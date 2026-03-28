import sys, os
sys.path.insert(0, '/root/companion/agent/autoresearch')
sys.path.insert(0, '/root/companion/agent/memory')
from dotenv import load_dotenv
load_dotenv('/root/companion/.env')
import redis as _r
from pathlib import Path
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage
from base import run_loop

r      = _r.Redis.from_url(os.getenv('REDIS_URL','redis://localhost:6379'), decode_responses=True)
llm    = ChatAnthropic(model='claude-haiku-4-5', max_tokens=1500)
TARGET = '/root/companion/cron/morning.py'

def get_score():
    done  = int(r.get('morning_focus_completed') or 0)
    total = int(r.get('morning_focus_total')     or 1)
    return done / total

def make_variant(code, i):
    resp = llm.invoke([
        SystemMessage(content='You improve morning orientation prompts for AI companions. Return only the complete updated Python file.'),
        HumanMessage(content='Make this orientation more likely to drive action today:\n\n' + code)
    ])
    return resp.content.strip()

def run():
    current  = Path(TARGET).read_text()
    baseline = get_score()
    result   = run_loop('loop3_morning', TARGET, make_variant, get_score, baseline, max_exp=5)
    print('[loop3] improvement:', result['pct'], '%')

if __name__ == '__main__':
    run()
