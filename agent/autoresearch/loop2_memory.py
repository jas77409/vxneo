import sys, os, random
sys.path.insert(0, '/root/companion/agent/autoresearch')
sys.path.insert(0, '/root/companion/agent/memory')
from dotenv import load_dotenv
load_dotenv('/root/companion/.env')
import redis as _r
from pathlib import Path
from base import run_loop

r      = _r.Redis.from_url(os.getenv('REDIS_URL','redis://localhost:6379'), decode_responses=True)
TARGET = '/root/companion/agent/memory/memory_manager.py'

def get_score():
    rel = int(r.get('memory_relevant_count')   or 0)
    irr = int(r.get('memory_irrelevant_count') or 0)
    return rel / (rel + irr) if (rel + irr) > 5 else 0.5

def make_variant(code, i):
    decay     = round(0.98 + random.uniform(0, 0.015), 4)
    reinforce = round(0.03 + random.uniform(0, 0.04),  3)
    threshold = round(0.25 + random.uniform(0, 0.08),  3)
    code = code.replace('m.salience * 0.99',    'm.salience * ' + str(decay))
    code = code.replace('m.salience + 0.05',    'm.salience + ' + str(reinforce))
    code = code.replace('score_threshold=0.28', 'score_threshold=' + str(threshold))
    return code

def run():
    current  = Path(TARGET).read_text()
    baseline = get_score()
    result   = run_loop('loop2_memory', TARGET, make_variant, get_score, baseline, max_exp=8)
    print('[loop2] improvement:', result['pct'], '%')

if __name__ == '__main__':
    run()
