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

llm = ChatAnthropic(model='claude-opus-4-5', max_tokens=600)


def run():
    today      = date.today().isoformat()
    today_mems = memory_manager.recall_memories('today ' + today, top_k=4)
    today_ctx  = '\n'.join('- ' + m['content'] for m in today_mems) if today_mems else 'No captures today.'

    prompt = (
        'Today was ' + today + '.\n'
        'Based on today\'s interactions and captures:\n'
        + today_ctx + '\n\n'
        'Write a short evening reflection (4-6 sentences) covering:\n'
        '1. What seemed to matter most today\n'
        '2. What drained or energised the person\n'
        '3. One honest observation about where they are\n\n'
        'Be specific, not generic. Write in second person.'
    )

    resp       = llm.invoke([
        SystemMessage(content='You are a personal companion intelligence writing an evening reflection.'),
        HumanMessage(content=prompt)
    ])
    reflection = resp.content

    path = obsidian_tools.write_reflection('Evening Reflection', reflection)
    memory_manager.write_memory('Evening reflection ' + today + ': ' + reflection[:200], 'Episodic', 0.7)
    obsidian_tools.write_agent_log('evening_reflection', 'created ' + path)
    print('[reflection] created:', path)


if __name__ == '__main__':
    run()
