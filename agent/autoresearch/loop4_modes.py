import sys, os
sys.path.insert(0, '/root/companion/agent/autoresearch')
sys.path.insert(0, '/root/companion/agent/modes')
from dotenv import load_dotenv
load_dotenv('/root/companion/.env')
import redis as _r
from pathlib import Path
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage
from base import run_loop

r      = _r.Redis.from_url(os.getenv('REDIS_URL','redis://localhost:6379'), decode_responses=True)
llm    = ChatAnthropic(model='claude-haiku-4-5', max_tokens=2000)
TARGET = '/root/companion/agent/modes/mode_prompts.py'

def get_score():
    overrides = int(r.get('mode_override_count') or 0)
    total     = int(r.get('mode_total_count')    or 1)
    return 1.0 - (overrides / total)

def make_variant(code, i):
    examples = r.lrange('mode_override_log', 0, 19) or []
    ex_text  = '\n'.join(str(e) for e in examples) if examples else 'No overrides yet.'
    resp = llm.invoke([
        SystemMessage(content='You improve mode detection for AI companions. Return only the complete updated Python file.'),
        HumanMessage(content='Reduce misclassifications. Overrides:\n' + ex_text + '\n\nCode:\n' + code)
    ])
    return resp.content.strip()

def run():
    current  = Path(TARGET).read_text()
    baseline = get_score()
    result   = run_loop('loop4_modes', TARGET, make_variant, get_score, baseline, max_exp=6)
    print('[loop4] improvement:', result['pct'], '%')

if __name__ == '__main__':
    run()
