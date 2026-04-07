import os
import uuid
from datetime import datetime
from dotenv import load_dotenv

load_dotenv('/root/companion/.env')

MEMORY_TYPES = ['Episodic','Semantic','Procedural','Affective','Goal','Belief','Identity','Contextual','Capture']
EMBED_DIM    = 384
COLLECTION   = 'companion_memory'

# --- Embedding model ---
try:
    from sentence_transformers import SentenceTransformer
    _embed = SentenceTransformer('all-MiniLM-L6-v2')
    _embed_ok = True
except Exception as e:
    print('[memory] embedding model unavailable:', e)
    _embed    = None
    _embed_ok = False

def _vec(text):
    if _embed_ok and _embed:
        return _embed.encode(text).tolist()
    return [0.0] * EMBED_DIM

# --- Neo4j ---
_neo4j    = None
_neo4j_ok = False
try:
    from neo4j import GraphDatabase
    _neo4j = GraphDatabase.driver(
        os.getenv('NEO4J_URI', 'bolt://localhost:7687'),
        auth=(os.getenv('NEO4J_USER', 'neo4j'), os.getenv('NEO4J_PASSWORD', 'companion_2026'))
    )
    _neo4j.verify_connectivity()
    with _neo4j.session() as s:
        s.run('CREATE CONSTRAINT memory_id IF NOT EXISTS FOR (m:Memory) REQUIRE m.id IS UNIQUE')
    _neo4j_ok = True
    print('[memory] Neo4j connected')
except Exception as e:
    print('[memory] Neo4j unavailable:', e)

# --- Qdrant ---
_qdrant    = None
_qdrant_ok = False
try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import Distance, VectorParams
    _qdrant = QdrantClient(url=os.getenv('QDRANT_URL', 'http://localhost:6333'))
    cols = [c.name for c in _qdrant.get_collections().collections]
    if COLLECTION not in cols:
        _qdrant.create_collection(COLLECTION, vectors_config=VectorParams(size=EMBED_DIM, distance=Distance.COSINE))
        print('[memory] Qdrant collection created')
    _qdrant_ok = True
    print('[memory] Qdrant connected')
except Exception as e:
    print('[memory] Qdrant unavailable:', e)


def write_memory(content, memory_type='Capture', salience=0.6, user_id='jas_personal'):
    if memory_type not in MEMORY_TYPES:
        memory_type = 'Capture'
    mid = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    vec = _vec(content)

    if _neo4j_ok:
        try:
            with _neo4j.session() as s:
                s.run(
                    'CREATE (m:Memory {id:$id, content:$content, type:$type, '
                    'salience:$salience, created_at:$now, last_accessed:$now, access_count:0, user_id:$uid})',
                    id=mid, content=content, type=memory_type, salience=salience, now=now, uid=user_id
                )
        except Exception as e:
            print('[memory] neo4j write error:', e)

    if _qdrant_ok:
        try:
            from qdrant_client.models import PointStruct
            _qdrant.upsert(COLLECTION, points=[PointStruct(
                id=mid, vector=vec,
                payload={'content': content, 'type': memory_type, 'salience': salience, 'created_at': now, 'user_id': user_id}
            )])
        except Exception as e:
            print('[memory] qdrant write error:', e)

    return mid


def recall_memories(query, top_k=6, memory_type=None, user_id='jas_personal'):
    if not _qdrant_ok:
        return []
    try:
        from qdrant_client.models import Filter, FieldCondition, MatchValue
        vec  = _vec(query)
        must_conditions = [FieldCondition(key='user_id', match=MatchValue(value=user_id))]
        if memory_type:
            must_conditions.append(FieldCondition(key='type', match=MatchValue(value=memory_type)))
        filt = Filter(must=must_conditions)
        results = _qdrant.query_points(
            COLLECTION, query=vec, limit=top_k,
            with_payload=True, score_threshold=0.28, query_filter=filt, with_vectors=False
        )
        mems = []
        for r in results.points:
            mems.append({
                'content':  r.payload['content'],
                'type':     r.payload.get('type', 'Unknown'),
                'salience': r.payload.get('salience', 0.5),
                'score':    round(r.score, 3)
            })
            _reinforce(r.id)
        return mems
    except Exception as e:
        print('[memory] recall error:', e)
        return []


def _reinforce(mid):
    if not _neo4j_ok:
        return
    try:
        with _neo4j.session() as s:
            s.run(
                'MATCH (m:Memory {id:$id}) '
                'SET m.salience = min(1.0, m.salience + 0.05), '
                '    m.last_accessed = $now, '
                '    m.access_count  = m.access_count + 1',
                id=mid, now=datetime.utcnow().isoformat()
            )
    except Exception:
        pass


def link_memories(id_a, id_b, relation='RELATED_TO'):
    if not _neo4j_ok:
        return
    try:
        with _neo4j.session() as s:
            s.run(
                'MATCH (a:Memory {id:$a}),(b:Memory {id:$b}) MERGE (a)-[:' + relation + ']->(b)',
                a=id_a, b=id_b
            )
    except Exception as e:
        print('[memory] link error:', e)


def run_decay():
    if not _neo4j_ok:
        return
    today = datetime.utcnow().date().isoformat()
    try:
        with _neo4j.session() as s:
            res = s.run(
                'MATCH (m:Memory) WHERE NOT m.last_accessed STARTS WITH $today '
                'SET m.salience = m.salience * 0.99 RETURN count(m) as n',
                today=today
            )
            print('[decay] decayed', res.single()['n'], 'memories')
    except Exception as e:
        print('[decay] error:', e)


def get_stats():
    stats = {'neo4j_ok': _neo4j_ok, 'qdrant_ok': _qdrant_ok, 'memory_types': MEMORY_TYPES}
    if _neo4j_ok:
        try:
            with _neo4j.session() as s:
                res = s.run('MATCH (m:Memory) RETURN count(m) as n')
                stats['total_memories'] = res.single()['n']
        except Exception:
            stats['total_memories'] = 0
    return stats


if __name__ == '__main__':
    print('[memory] self-test...')
    mid  = write_memory('Companion intelligence system is fully built and live.', 'Episodic', 0.9)
    print('[memory] wrote:', mid[:8] + '...')
    mems = recall_memories('companion system')
    print('[memory] recalled:', len(mems), 'memories')
    print('[memory] stats:', get_stats())
    print('[memory] ok')
