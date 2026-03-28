import sys,os
sys.path.insert(0,'/root/companion/agent/autoresearch')
from dotenv import load_dotenv;load_dotenv('/root/companion/.env')
import redis as _r;from pathlib import Path
from langchain_anthropic import ChatAnthropic;from langchain_core.messages import SystemMessage,HumanMessage
from base import run_loop
r=_r.Redis.from_url(os.getenv('REDIS_URL','redis://localhost:6379'),decode_responses=True)
llm=ChatAnthropic(model='claude-opus-4-5',max_tokens=2000)
TARGET='/root/companion/agent/modes/mode_prompts.py'
def get_score():
    scores=r.lrange('satisfaction_scores',0,-1)
    vals=[float(s) for s in (scores or []) if str(s).replace('.','').isdigit()]
    return sum(vals)/len(vals) if vals else 3.0
def make_variant(code,i):
    resp=llm.invoke([SystemMessage(content='Improve AI companion prompts. Return only complete Python file.'),HumanMessage(content='Improve one mentor mode:\n\n'+code)])
    return resp.content.strip()
def run():
    current=Path(TARGET).read_text();baseline=get_score()
    result=run_loop('loop1_prompts',TARGET,make_variant,get_score,baseline,max_exp=5)
    print('[loop1]',result['pct'],'%')
if __name__=='__main__':run()
