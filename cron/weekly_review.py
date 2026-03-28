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

llm = ChatAnthropic(model='claude-opus-4-5', max_tokens=800)


def run():
    week = date.today().isocalendar()
    mems = memory_manager.recall_memories('this week patterns themes decisions', top_k=10)
    ctx  = '\n'.join('- [' + m['type'] + '] ' + m['content'] for m in mems) if mems else 'No recent memories.'

    prompt = (
        'Week ' + str(week.week) + ' of ' + str(week.year) + '.\n'
        'Recent memories and interactions:\n' + ctx + '\n\n'
        'Write a weekly review with:\n'
        '1. 2-3 emerging themes from this week\n'
        '2. How this week tracked against stated goals\n'
        '3. One pattern worth noticing\n'
        '4. One question to sit with in the coming week\n\n'
        'Be honest and specific. Not generic. Write in second person.'
    )

    resp   = llm.invoke([
        SystemMessage(content='You are a personal companion intelligence writing a weekly review.'),
        HumanMessage(content=prompt)
    ])
    review = resp.content

    title = 'Week-' + str(week.week) + '-Review'
    path  = obsidian_tools.write_reflection(title, review)
    memory_manager.write_memory('Weekly review W' + str(week.week) + ': ' + review[:200], 'Episodic', 0.8)
    obsidian_tools.write_agent_log('weekly_review', 'created ' + path)
    print('[weekly] created:', path)


if __name__ == '__main__':
    run()
