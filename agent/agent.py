import os, sys
sys.path.insert(0, '/root/companion/agent/modes')
sys.path.insert(0, '/root/companion/agent/memory')
sys.path.insert(0, '/root/companion/agent/tools')
sys.path.insert(0, '/root/companion/agent/security')
sys.path.insert(0, '/root/companion/agent/routing')

from typing import TypedDict
from dotenv import load_dotenv
load_dotenv('/root/companion/.env')
from langgraph.graph import StateGraph, END
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from mode_prompts import MODES, detect_mode
import redis as _redis

_r   = _redis.Redis.from_url(os.getenv('REDIS_URL','redis://localhost:6379'), decode_responses=True)
_llm = ChatAnthropic(model='claude-opus-4-5', max_tokens=1024)

try:
    from security_layer import scan_input, scan_output, log_agent_action
except ImportError:
    def scan_input(t, source='user'): return {'allow':True,'warnings':[]}
    def scan_output(t, mode=''): return {'allow':True,'warnings':[]}
    def log_agent_action(a,d='',mode='',task_type=''): pass

try:
    from task_router import route
except ImportError:
    def route(text, context=None): return {'task_type':'conversation','message':None}

class AgentState(TypedDict):
    input: str
    mode: str
    memory_context: str
    response: str
    task_type: str
    routed: bool

def _security(state):
    r = scan_input(state['input'], source='user')
    if r['warnings']:
        _r.lpush('security_warnings', str([w['type'] for w in r['warnings']]))
        _r.ltrim('security_warnings', 0, 99)
    return state

def _route(state):
    result = route(state['input'])
    task_type = result.get('task_type','conversation')
    state['task_type'] = task_type
    if task_type != 'conversation' and result.get('message'):
        state['response'] = result['message']
        state['routed']   = True
        log_agent_action('routed', task_type, task_type=task_type)
    else:
        state['routed'] = False
    return state

def _should_skip(state):
    return 'skip' if state.get('routed') else 'continue'

def _classify(state):
    state['mode'] = detect_mode(state['input'])
    return state

def _recall(state):
    try:
        import memory_manager
        mems = memory_manager.recall_memories(state['input'], top_k=6)
        if mems:
            lines = ['Relevant memories:'] + ['- ['+m['type']+'] '+m['content'] for m in mems]
            state['memory_context'] = '\n'.join(lines)
        else:
            state['memory_context'] = ''
    except Exception:
        state['memory_context'] = ''
    return state

def _respond(state):
    system = MODES.get(state['mode'], MODES['default'])
    if state['memory_context']:
        system = system + '\n\n' + state['memory_context']
    try:
        resp = _llm.invoke([SystemMessage(content=system), HumanMessage(content=state['input'])])
        state['response'] = resp.content
    except Exception as e:
        state['response'] = '[error] ' + str(e)
    return state


def _store(state):
    try:
        import memory_manager
        if not state.get('routed'):
            memory_manager.write_memory(state['input'], 'Episodic', 0.5)
        mode_label = state.get('mode','default')
        if mode_label == 'default': mode_label = 'Neo'
        _r.set('agent_state',    'responded:' + mode_label)
        _r.set('last_mode',      mode_label)
        _r.set('last_response',  state['response'][:600])
        _r.set('last_task_type', state.get('task_type','conversation'))
        _r.incr('mode_total_count')
        scan_output(state['response'], mode=mode_label)
        log_agent_action('responded', state['input'][:100],
                         mode=mode_label, task_type=state.get('task_type','conversation'))
    except Exception:
        pass
    try:
        from continuous_learning_v2 import observe_interaction
        observe_interaction(state['input'], state.get('mode','Neo'),
                            state.get('task_type','conversation'),
                            state.get('routed',False), len(state.get('response','')))
    except Exception:
        pass
    try:
        from strategic_compaction import record_turn
        record_turn(state['input'], state.get('response',''),
                    state.get('mode','Neo'), state.get('task_type','conversation'))
    except Exception:
        pass
    return state


_g = StateGraph(AgentState)
_g.add_node('security', _security)
_g.add_node('router',   _route)
_g.add_node('classify', _classify)
_g.add_node('recall',   _recall)
_g.add_node('respond',  _respond)
_g.add_node('store',    _store)
_g.set_entry_point('security')
_g.add_edge('security', 'router')
_g.add_conditional_edges('router', _should_skip, {'skip':'store','continue':'classify'})
_g.add_edge('classify', 'recall')
_g.add_edge('recall',   'respond')
_g.add_edge('respond',  'store')
_g.add_edge('store',    END)
companion = _g.compile()

def ask(text):
    result = companion.invoke({
        'input':text,'mode':'','memory_context':'',
        'response':'','task_type':'','routed':False,
    })
    mode_label = result.get('mode','default')
    if mode_label == 'default': mode_label = 'Neo'
    return {
        'mode':      mode_label,
        'response':  result['response'],
        'task_type': result.get('task_type','conversation'),
        'routed':    result.get('routed',False),
    }
