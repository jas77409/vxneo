import os
import sys
import asyncio
from datetime import datetime

sys.path.insert(0, '/root/companion/agent')
sys.path.insert(0, '/root/companion/agent/modes')
sys.path.insert(0, '/root/companion/agent/memory')

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv('/root/companion/.env')
import redis.asyncio as aioredis

app = FastAPI(title='Companion Intelligence')
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])


@app.get('/health')
def health():
    return {'status': 'alive', 'ts': datetime.now().isoformat()}


@app.get('/ask/{text}')
async def ask_get(text: str):
    from agent import ask
    return ask(text)


@app.post('/ask')
async def ask_post(body: dict):
    from agent import ask
    return ask(body.get('text', ''))


@app.get('/memory/search/{query}')
async def mem_search(query: str):
    import memory_manager
    return memory_manager.recall_memories(query)


@app.post('/memory/write')
async def mem_write(body: dict):
    import memory_manager
    mid = memory_manager.write_memory(
        body.get('content', ''),
        body.get('type', 'Capture'),
        body.get('salience', 0.6)
    )
    return {'id': mid}


@app.get('/memory/stats')
async def mem_stats():
    import memory_manager
    return memory_manager.get_stats()


@app.websocket('/ws/screen')
async def screen_ws(ws: WebSocket):
    await ws.accept()
    r = aioredis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379'))
    try:
        while True:
            state = await r.get('agent_state') or 'idle'
            mode  = await r.get('last_mode')   or ''
            last  = await r.get('last_response') or ''
            await ws.send_json({'agent_state': state, 'mode': mode, 'last_response': last})
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass
    finally:
        await r.aclose()


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)
