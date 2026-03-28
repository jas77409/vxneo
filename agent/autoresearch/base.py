import os,json,shutil
from datetime import datetime
from pathlib import Path
RESULTS=Path('/root/companion/agent/autoresearch/results')
RESULTS.mkdir(parents=True,exist_ok=True)
def run_loop(name,target_file,variants_fn,metric_fn,baseline,max_exp=10):
    target=Path(target_file);backup=target.with_suffix('.bak');shutil.copy(target,backup)
    best_score=baseline;best_code=target.read_text();log=[]
    print('[auto:'+name+'] baseline='+str(round(baseline,4)))
    for i in range(max_exp):
        variant=variants_fn(best_code,i)
        if not variant:continue
        target.write_text(variant)
        try:score=metric_fn()
        except:score=0.0
        kept=score>best_score;log.append({'i':i+1,'score':score,'kept':kept})
        if kept:best_score=score;best_code=variant;print('  improved:',round(score,4))
        else:target.write_text(best_code)
    result={'loop':name,'baseline':baseline,'best':best_score,'pct':round((best_score-baseline)/max(baseline,0.001)*100,2),'log':log,'ts':datetime.now().isoformat()}
    (RESULTS/(name+'-'+datetime.now().strftime('%Y%m%d-%H%M')+'.json')).write_text(json.dumps(result,indent=2))
    print('[auto:'+name+'] done best='+str(round(best_score,4)))
    return result
