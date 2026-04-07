import os, sys, json
from datetime import datetime

sys.path.insert(0, '/root/companion/agent/memory')
sys.path.insert(0, '/root/companion/agent/tools')

from dotenv import load_dotenv
load_dotenv('/root/companion/.env')

import redis as _redis
_r = _redis.Redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379'), decode_responses=True)

TASK_KEYWORDS = {
    'github': ['github','my repo','open issues','recent commits','pull request','create issue'],
    'notion': ['notion','create note','quick note','add note','search notion','find note','my notes','save note'],
    'shell':  ['check neo','check telegram','disk space','memory usage','server uptime','server time','check logs','processes','what time','current time','uptime','free memory','server load'],
    'email': ['check my email','unread emails','my inbox','show emails','any emails','new emails','read emails'],
    'memory_store':  ['remember', 'store', 'save this', 'note that', 'keep in mind', 'capture', 'log this'],
    'memory_recall': ['what did i', 'do you remember', 'recall', 'search my memory', 'what have i said'],
    'vault_write':   ['add to my notes', 'create a note', 'write to vault', 'add to inbox', 'journal'],
    'vault_search':  ['search my notes', 'find in notes', 'show me my notes', 'check my vault'],
    'web_search':    ['search for', 'look up online', 'latest news', 'search online', 'find information about'],
    'calendar':      ['schedule', 'calendar', 'appointment', 'what do i have today', 'my day', 'remind me'],
}

def classify_task(text):
    t = text.lower()
    scores = {}
    for task_type, keywords in TASK_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in t)
        if score > 0:
            scores[task_type] = score
    if not scores:
        return 'conversation', 1.0
    best = max(scores, key=scores.get)
    return best, min(scores[best] / 2.0, 1.0)

def handle_memory_store(text):
    import memory_manager
    content = text
    for prefix in ['remember that', 'store this:', 'save this:', 'note that', 'capture:', 'remember:']:
        if content.lower().startswith(prefix):
            content = content[len(prefix):].strip()
            break
    mid = memory_manager.write_memory(content, 'Capture', 0.7)
    _r.incr('memory_store_count')
    return {'task_type': 'memory_store', 'success': True,
            'message': 'Stored. I will remember: ' + content[:100]}

def handle_memory_recall(text):
    import memory_manager
    results = memory_manager.recall_memories(text, top_k=8)
    _r.incr('memory_recall_count')
    if not results:
        return {'task_type': 'memory_recall', 'success': True,
                'message': 'I do not have any memories matching that yet.'}
    summary = '\n'.join('[' + m['type'] + '] ' + m['content'] for m in results[:5])
    return {'task_type': 'memory_recall', 'success': True,
            'results': results, 'message': 'Here is what I remember:\n' + summary}

def handle_vault_write(text):
    import obsidian_tools
    path = obsidian_tools.append_capture(text, tags=['router'])
    _r.incr('vault_write_count')
    return {'task_type': 'vault_write', 'success': True,
            'message': 'Added to your vault notes.'}

def handle_vault_search(text):
    import obsidian_tools
    query = text
    for prefix in ['search my notes for', 'find in notes', 'show me my notes about']:
        if query.lower().startswith(prefix):
            query = query[len(prefix):].strip()
            break
    results = obsidian_tools.search_vault(query, limit=5)
    _r.incr('vault_search_count')
    if not results:
        return {'task_type': 'vault_search', 'success': True,
                'message': 'No notes found matching: ' + query}
    summary = '\n'.join(r['path'] + ': ' + r['preview'][:80] for r in results)
    return {'task_type': 'vault_search', 'success': True,
            'message': 'Found ' + str(len(results)) + ' notes:\n' + summary}

def handle_web_search(text):
    import urllib.request, urllib.parse
    query = text
    for prefix in ['search for', 'look up online', 'find information about', 'latest news on']:
        if query.lower().startswith(prefix):
            query = query[len(prefix):].strip()
            break
    try:
        url = 'https://api.duckduckgo.com/?q=' + urllib.parse.quote(query) + '&format=json&no_html=1'
        req = urllib.request.Request(url, headers={'User-Agent': 'CompanionAI/1.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
        result = data.get('AbstractText') or data.get('Answer') or 'No instant answer found for: ' + query
        _r.incr('web_search_count')
        _r.lpush('web_search_history', json.dumps({'query': query, 'ts': datetime.now().isoformat()}))
        _r.ltrim('web_search_history', 0, 49)
        return {'task_type': 'web_search', 'success': True, 'message': result}
    except Exception as e:
        return {'task_type': 'web_search', 'success': False, 'message': 'Search failed: ' + str(e)}

def handle_calendar(text):
    import memory_manager
    today_note = _r.get('today_schedule') or ''
    if any(w in text.lower() for w in ['today', 'my day', 'what do i have']):
        return {'task_type': 'calendar', 'success': True,
                'message': today_note if today_note else 'No calendar data cached yet. Add your schedule in the morning orientation.'}
    mid = memory_manager.write_memory(text, 'Goal', 0.8)
    _r.incr('calendar_intent_count')
    return {'task_type': 'calendar', 'success': True,
            'message': 'Noted as an intention: ' + text[:100]}

def route(text, context=None):
    task_type, confidence = classify_task(text)
    _r.lpush('router_log', json.dumps({'task_type': task_type, 'confidence': round(confidence,2),
                                        'ts': datetime.now().isoformat()}))
    _r.ltrim('router_log', 0, 99)
    handlers = {
        'memory_store':  handle_memory_store,
        'memory_recall': handle_memory_recall,
        'vault_write':   handle_vault_write,
        'vault_search':  handle_vault_search,
        'web_search':    handle_web_search,
        'calendar':      handle_calendar_google,
        'email':         handle_email,
        'github':        handle_github,
        'notion':        handle_notion,
        'shell':         handle_shell,
    }
    if task_type in handlers:
        result = handlers[task_type](text)
    else:
        result = {'task_type': 'conversation', 'message': None}
    result['confidence'] = round(confidence, 2)
    return result

def get_router_stats():
    stats = {}
    for key in ['memory_store_count','memory_recall_count','vault_write_count',
                'vault_search_count','web_search_count','calendar_intent_count']:
        stats[key] = int(_r.get(key) or 0)
    return stats

if __name__ == '__main__':
    tests = [
        'Remember that I work best in the mornings before 10am',
        'What did I say about momentum last week',
        'Search my notes for goals',
        'Search for latest LangGraph updates',
        'What do I have today',
        'I feel stuck and do not know where to start',
    ]
    for t in tests:
        task, conf = classify_task(t)
        print('[' + task + '] (' + str(round(conf,2)) + ') ' + t[:60])
    print('task_router ok')

def handle_email(text):
    sys.path.insert(0, '/root/companion/agent/tools')
    try:
        from google_tools import get_recent_emails
        emails = get_recent_emails(5)
        if not emails or 'error' in emails[0]:
            return {'task_type':'email','success':False,'message':'Gmail unavailable: ' + emails[0].get('error','')}
        lines = [f"From: {e['from'][:40]}\nSubject: {e['subject']}\n{e['snippet']}" for e in emails]
        return {'task_type':'email','success':True,'message':'Your recent emails:\n\n' + '\n\n---\n\n'.join(lines)}
    except Exception as e:
        return {'task_type':'email','success':False,'message':f'Email error: {e}'}

def handle_calendar_google(text):
    sys.path.insert(0, '/root/companion/agent/tools')
    try:
        from google_tools import get_upcoming_events
        events = get_upcoming_events(5)
        if not events or 'error' in events[0]:
            return {'task_type':'calendar','success':False,'message':'Calendar unavailable'}
        lines = [f"{e['title']} — {e['start']}" + (f" @ {e['location']}" if e.get('location') else '') for e in events]
        return {'task_type':'calendar','success':True,'message':'Upcoming events:\n\n' + '\n'.join(lines)}
    except Exception as e:
        return {'task_type':'calendar','success':False,'message':f'Calendar error: {e}'}


def handle_notion(text):
    import sys as _s; _s.path.insert(0,'/root/companion/agent/tools')
    try:
        from notion_tools import route_notion_task
        return route_notion_task(text)
    except Exception as e:
        return {'task_type':'notion','success':False,'message':f'Notion error: {e}'}

def handle_github(text):
    sys.path.insert(0, '/root/companion/agent/tools')
    try:
        from github_tools import route_github_task
        return route_github_task(text)
    except Exception as e:
        return {'task_type':'github','success':False,'message':f'GitHub tools error: {e}'}

def handle_shell(text):
    sys.path.insert(0, '/root/companion/agent/tools')
    try:
        from github_tools import run_command
        cmd_map = {
            'server time': 'date',
            'current time': 'date',
            'what time': 'date',
            'check neo': 'systemctl status companion-api --no-pager | head -8',
            'check telegram': 'systemctl status neo-telegram --no-pager | head -8',
            'disk space': 'df -h / | tail -1',
            'memory': 'free -h | head -2',
            'uptime': 'uptime',
            'processes': 'ps aux --sort=-%cpu | head -8',
        }
        t = text.lower()
        for key, cmd in cmd_map.items():
            if key in t:
                r = run_command(cmd)
                return {'task_type':'shell','success':True,'message':r['stdout'] or r['error']}
        return {'task_type':'shell','success':False,'message':'Specify what to check: neo, telegram, disk, memory, uptime'}
    except Exception as e:
        return {'task_type':'shell','success':False,'message':f'Shell error: {e}'}
