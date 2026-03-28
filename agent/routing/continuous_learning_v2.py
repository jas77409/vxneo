import os,sys,json,uuid
from datetime import datetime,timedelta
from pathlib import Path
sys.path.insert(0,'/root/companion/agent/memory')
from dotenv import load_dotenv
load_dotenv('/root/companion/.env')
import redis as _redis
_r=_redis.Redis.from_url(os.getenv('REDIS_URL','redis://localhost:6379'),decode_responses=True)
INSTINCT_KEY='neo:instincts'
SKILL_KEY='neo:evolved_skills'
INSTINCT_LOG=Path('/root/companion/logs/instincts.jsonl')
SKILL_FILE=Path('/root/companion/agent/modes/learned_skills.json')
CONFIDENCE_THRESHOLD=0.65
EVIDENCE_THRESHOLD=3
TTL_DAYS=30
INSTINCT_LOG.parent.mkdir(parents=True,exist_ok=True)
CATEGORIES=['mode_detection','memory_recall','routing','vault','response_quality','timing']

def observe(category,pattern,positive=True,context=None):
    if category not in CATEGORIES: category='response_quality'
    existing=_find_instinct(pattern,category)
    if existing:
        iid=existing['id'];delta=0.1 if positive else -0.08
        updated=_reinforce(iid,delta,positive);_log_event('reinforced',updated);return iid
    inst={'id':str(uuid.uuid4())[:8],'category':category,'pattern':pattern,
          'confidence':0.5 if positive else 0.3,'evidence':1,'positive':positive,
          'created_at':datetime.utcnow().isoformat(),'last_seen':datetime.utcnow().isoformat(),
          'expires_at':(datetime.utcnow()+timedelta(days=TTL_DAYS)).isoformat(),'context':context or {}}
    _r.hset(INSTINCT_KEY,inst['id'],json.dumps(inst));_log_event('created',inst);return inst['id']

def _find_instinct(pattern,category):
    pl=pattern.lower()
    for val in _r.hgetall(INSTINCT_KEY).values():
        i=json.loads(val)
        if i['category']==category and i['pattern'].lower()==pl: return i
    return None

def _reinforce(iid,delta,positive):
    raw=_r.hget(INSTINCT_KEY,iid)
    if not raw: return {}
    i=json.loads(raw)
    i['confidence']=max(0.0,min(1.0,i['confidence']+delta));i['evidence']+=1
    i['last_seen']=datetime.utcnow().isoformat()
    i['expires_at']=(datetime.utcnow()+timedelta(days=TTL_DAYS)).isoformat()
    _r.hset(INSTINCT_KEY,iid,json.dumps(i));return i

def get_instincts(category=None,min_confidence=0.0):
    now=datetime.utcnow()
    result=[json.loads(v) for v in _r.hgetall(INSTINCT_KEY).values()]
    result=[i for i in result if datetime.fromisoformat(i['expires_at'])>now]
    if category: result=[i for i in result if i['category']==category]
    if min_confidence>0: result=[i for i in result if i['confidence']>=min_confidence]
    return sorted(result,key=lambda x:x['confidence'],reverse=True)

def prune_expired():
    now=datetime.utcnow();pruned=0
    for iid,val in _r.hgetall(INSTINCT_KEY).items():
        if datetime.fromisoformat(json.loads(val)['expires_at'])<=now:
            _r.hdel(INSTINCT_KEY,iid);pruned+=1
    print(f'[learning] pruned {pruned} expired instincts');return pruned

def evolve():
    candidates=[i for i in get_instincts(min_confidence=CONFIDENCE_THRESHOLD) if i['evidence']>=EVIDENCE_THRESHOLD]
    if not candidates: print('[learning] nothing ready to evolve');return []
    by_cat={}
    for i in candidates: by_cat.setdefault(i['category'],[]).append(i)
    skills=[]
    for cat,insts in by_cat.items():
        if len(insts)<2: continue
        skill={'id':str(uuid.uuid4())[:8],'name':f'{cat}_skill_{datetime.now().strftime("%Y%m")}',
               'category':cat,'patterns':[i['pattern'] for i in insts],
               'avg_confidence':round(sum(i['confidence'] for i in insts)/len(insts),3),
               'total_evidence':sum(i['evidence'] for i in insts),
               'evolved_at':datetime.utcnow().isoformat()}
        _r.hset(SKILL_KEY,skill['id'],json.dumps(skill));skills.append(skill)
        print(f"[learning] evolved: {skill['name']} (conf={skill['avg_confidence']})")
    SKILL_FILE.parent.mkdir(parents=True,exist_ok=True)
    SKILL_FILE.write_text(json.dumps([json.loads(v) for v in _r.hgetall(SKILL_KEY).values()],indent=2))
    return skills

def get_skills(): return [json.loads(v) for v in _r.hgetall(SKILL_KEY).values()]

def observe_interaction(input_text,mode,task_type,routed,response_len):
    t=input_text.lower()
    STOP={'i','a','the','and','or','but','in','on','at','to','for','of','with','my','me','is'}
    sig=' '.join([w for w in t.split() if len(w)>3 and w not in STOP][:5])
    if mode not in ('Neo','default',''): observe('mode_detection',f'mode:{mode} sig:{sig}',True)
    if routed and task_type not in ('conversation',''): observe('routing',f'{task_type} sig:{sig}',True)
    if response_len<50: observe('response_quality','short_response',False)
    elif response_len>400: observe('response_quality','long_substantive',True)
    h=datetime.now().hour
    if 6<=h<=9: observe('timing','morning',True,{'hour':h})
    elif 21<=h<=23: observe('timing','evening',True,{'hour':h})

def status():
    instincts=get_instincts();skills=get_skills()
    by_cat={}
    for i in instincts: by_cat.setdefault(i['category'],[]).append(i['confidence'])
    return {'total_instincts':len(instincts),'total_skills':len(skills),
            'ready':len([i for i in instincts if i['confidence']>=CONFIDENCE_THRESHOLD and i['evidence']>=EVIDENCE_THRESHOLD]),
            'by_category':{cat:{'count':len(c),'avg':round(sum(c)/len(c),2)} for cat,c in by_cat.items()}}

def export_instincts(path='/root/companion/logs/instincts_export.json'):
    Path(path).write_text(json.dumps(get_instincts(),indent=2));return path

def _log_event(event,i):
    with open(INSTINCT_LOG,'a') as f:
        f.write(json.dumps({'ts':datetime.utcnow().isoformat(),'event':event,
                            'id':i.get('id'),'cat':i.get('category'),
                            'pattern':i.get('pattern','')[:60],'conf':i.get('confidence')})+'\n')

if __name__=='__main__':
    for _ in range(3): observe('mode_detection','catalyst from stuck blocked',True)
    for _ in range(3): observe('routing','memory_store from remember that',True)
    print(json.dumps(status(),indent=2))
    print('evolved:',len(evolve()))
    print('continuous_learning_v2 ok')
