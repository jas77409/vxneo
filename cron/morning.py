import sys
import os
sys.path.insert(0, '/root/companion/agent')
sys.path.insert(0, '/root/companion/agent/modes')
sys.path.insert(0, '/root/companion/agent/memory')
sys.path.insert(0, '/root/companion/agent/tools')

from dotenv import load_dotenv
load_dotenv('/root/companion/.env')

from datetime import date
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage
import memory_manager
import obsidian_tools

llm = ChatAnthropic(model='claude-opus-4-5', max_tokens=400)


def run():
    today     = date.today().strftime('%A, %B %d')
    goals     = memory_manager.recall_memories('current goals intentions focus', top_k=3, memory_type='Goal')
    feelings  = memory_manager.recall_memories('recent feelings energy emotional state', top_k=2, memory_type='Affective')

    goal_ctx    = '\n'.join(m['content'] for m in goals)   if goals    else 'No goals stored yet.'
    feeling_ctx = '\n'.join(m['content'] for m in feelings) if feelings else 'No emotional context yet.'

    prompt = (
        'Today is ' + today + '.\n'
        'Write a warm, honest morning orientation - 3 to 4 sentences.\n'
        'Connect today to the person\'s current intentions. Surface one small actionable focus.\n\n'
        'Current goals/intentions:\n' + goal_ctx + '\n\n'
        'Recent feelings/energy:\n' + feeling_ctx + '\n\n'
        'Write in second person. Warm but direct. Like a mentor who knows them well.'
    )

    resp        = llm.invoke([SystemMessage(content='You are a personal companion intelligence.'), HumanMessage(content=prompt)])
    orientation = resp.content

    surfaced  = memory_manager.recall_memories('important insight turning point realisation', top_k=1)
    surf_text = surfaced[0]['content'] if surfaced else ''

    path = obsidian_tools.create_daily_note(orientation, surf_text)
    obsidian_tools.write_agent_log('morning_orientation', 'created ' + path)
    print('[morning] note created:', path)
    print(orientation)


if __name__ == '__main__':
    run()
