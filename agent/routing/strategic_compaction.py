import os,sys,json
from datetime import datetime
from pathlib import Path
sys.path.insert(0,'/root/companion/agent/memory')
from dotenv import load_dotenv
load_dotenv('/root/companion/.env')
import redis as _redis
_r=_redis.Redis.from_url(os.getenv('REDIS_URL','redis://localhost:6379'),decode_responses=True)
COMPACT_LOG=Path('/root/companion/logs/compaction.jsonl')
COMPACT_LOG.parent.mkdir(parents=True,exist_ok=True)
TURN_KEY='neo:session:turns'
CONTEXT_KEY='neo:session:context'
MILESTONE_KEY='neo:session:milestones'
SESSION_KEY='neo:session:id'
MAX_TURNS=20
KEEP_TURNS=5
MILESTONE_SIGNALS=[
    ('decision_made',['decided','going to','will do','committed','chosen']),
    ('insight_reached',['realised','understand now','i see','makes sense','clicked']),
    ('goal_set',['my goal is','i want to','i intend','planning to','aiming']),
    ('topic_shift',['changing subject','moving on','different topic']),
    ('session_end',['goodbye','thanks for','that is all','done for now']),
]

def get_session_id():
    sid=_r.get(SESSION_KEY)
    if not sid:
        sid=datetime.now().strftime('%Y%m%d-%H%M%S')
        _r.set(SESSION_KEY,sid,ex=86400)
    return sid

def record_turn(user_input,response,mode,task_type):
    turn={'ts':datetime.utcnow().isoformat(),'mode':mode,'task_type':task_type,
          'input_len':len(user_input),'resp_len':len(response),
          'input_preview':user_input[:100],'resp_preview':response[:100]}
    _r.rpush(TURN_KEY,json.dumps(turn));_r.expire(TURN_KEY,86400)
    count=_r.llen(TURN_KEY)
    milestone=_detect_milestone(user_input)
    if milestone:
        entry={'ts':datetime.utcnow().isoformat(),'type':milestone,'context':user_input[:100]}
        _r.rpush(MILESTONE_KEY,json.dumps(entry));_r.expire(MILESTONE_KEY,86400)
        print(f'[compact] milestone: {milestone}')
    should,reason=_should_compact(user_input,count,milestone)
    if should: compact(reason)
    return count

def _detect_milestone(text):
    t=text.lower()
    for mtype,signals in MILESTONE_SIGNALS:
        if any(s in t for s in signals): return mtype
    return None

def _should_compact(text,count,milestone):
    if count>=MAX_TURNS: return True,f'turn_limit:{count}'
    if milestone in ('session_end','insight_reached'): return True,f'milestone:{milestone}'
    recent=_get_recent_modes(3)
    if len(set(recent))>=3: return True,'mode_shift'
    return False,''

def _get_recent_modes(n):
    turns=_r.lrange(TURN_KEY,-n,-1)
    modes=[]
    for t in turns:
        try: modes.append(json.loads(t).get('mode',''))
        except: pass
    return modes

def compact(reason='manual'):
    all_raw=_r.lrange(TURN_KEY,0,-1)
    if len(all_raw)<=KEEP_TURNS: return {'compacted':0,'reason':reason}
    to_compact=all_raw[:-KEEP_TURNS]
    to_keep=all_raw[-KEEP_TURNS:]
    turns=[json.loads(t) for t in to_compact]
    modes=list(set(t.get('mode','') for t in turns))
    topics=[t.get('input_preview','') for t in turns[:3]]
    summary=(f'Compacted {len(turns)} turns. Modes: {", ".join(m for m in modes if m)}. '
             f'Topics: {". ".join(t for t in topics if t)[:200]}. '
             f'At {datetime.now().strftime("%Y-%m-%d %H:%M")}.')
    mid=None
    try:
        import memory_manager
        mid=memory_manager.write_memory(summary,'Episodic',0.75)
        print(f'[compact] stored as memory: {mid[:8]}')
    except Exception as e:
        print(f'[compact] memory store failed: {e}')
    _r.delete(TURN_KEY)
    for t in to_keep: _r.rpush(TURN_KEY,t)
    _r.expire(TURN_KEY,86400)
    _r.set(CONTEXT_KEY,summary[:500])
    result={'compacted':len(to_compact),'kept':len(to_keep),'reason':reason,
            'memory_id':mid,'summary':summary[:150],'ts':datetime.utcnow().isoformat()}
    with open(COMPACT_LOG,'a') as f: f.write(json.dumps(result)+'\n')
    print(f'[compact] {len(to_compact)} compacted, {len(to_keep)} kept, reason:{reason}')
    return result

def get_context(): return _r.get(CONTEXT_KEY) or ''

def get_status():
    count=_r.llen(TURN_KEY)
    milestones=[json.loads(m) for m in _r.lrange(MILESTONE_KEY,0,-1)]
    log=[]
    if COMPACT_LOG.exists():
        for line in COMPACT_LOG.read_text().strip().split('\n')[-3:]:
            try: log.append(json.loads(line))
            except: pass
    return {'current_turns':count,'compact_at':MAX_TURNS,'until_compact':max(0,MAX_TURNS-count),
            'session_id':get_session_id(),'milestones':milestones[-3:],'recent_compactions':log}

def reset_session():
    for k in [TURN_KEY,CONTEXT_KEY,MILESTONE_KEY,SESSION_KEY]: _r.delete(k)
    print('[compact] session reset')

if __name__=='__main__':
    modes=['Neo','catalyst','navigator','mirror','Neo']
    inputs=['I keep avoiding hard conversations','I decided to call them tomorrow',
            'What should I focus on','I keep repeating this pattern','I realised the real issue']
    for inp,mode in zip(inputs,modes):
        count=record_turn(inp,'Response '+'x'*100,mode,'conversation')
        print(f'Turn {count}: {mode}')
    print(json.dumps(get_status(),indent=2,default=str))
    print('strategic_compaction ok')
