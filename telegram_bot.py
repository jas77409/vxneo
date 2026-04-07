import os, sys, json, httpx
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
load_dotenv('/root/companion/.env')
load_dotenv('/root/companion/telegram.env')

from telegram import Update, BotCommand
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

NEO_API  = 'http://localhost:8000'
LOG_FILE = Path('/root/companion/logs/telegram.jsonl')
LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

def _log(event, data):
    with open(LOG_FILE, 'a') as f:
        f.write(json.dumps({'ts': datetime.utcnow().isoformat(), 'event': event, **data}) + '\n')

async def start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    name = update.effective_user.first_name or 'there'
    await update.message.reply_text(
        f"Hello {name}. I am Neo.\n\nYour personal companion intelligence.\n\n"
        f"/remember [text] — store a memory\n"
        f"/recall [query] — search memories\n"
        f"/status — check Neo\n\n"
        f"Or just talk to me."
    )
    _log('start', {'user_id': update.effective_user.id, 'name': name})

async def status(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(f'{NEO_API}/health')
        await update.message.reply_text(f"Neo is alive. {r.json().get('ts','')}")
    except Exception as e:
        await update.message.reply_text(f"Neo API unreachable: {e}")

async def remember(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    text = ' '.join(ctx.args)
    if not text:
        await update.message.reply_text("Usage: /remember [what to remember]")
        return
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(f'{NEO_API}/memory/write',
                json={'content': text, 'type': 'Capture', 'salience': 0.7})
        mid = r.json().get('id', '?')[:8]
        await update.message.reply_text(f"Stored. id: {mid}...")
        _log('remember', {'user_id': update.effective_user.id, 'content': text[:80]})
    except Exception as e:
        await update.message.reply_text(f"Error: {e}")

async def recall(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    query = ' '.join(ctx.args)
    if not query:
        await update.message.reply_text("Usage: /recall [query]")
        return
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.get(f'{NEO_API}/memory/search/{query}')
        mems = r.json()
        if not mems:
            await update.message.reply_text("No memories found.")
            return
        lines = [f"[{m['type']}] {m['content'][:100]}" for m in mems[:5]]
        await update.message.reply_text("Memories:\n\n" + "\n\n".join(lines))
    except Exception as e:
        await update.message.reply_text(f"Error: {e}")

async def message(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    await update.message.chat.send_action('typing')
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(f'{NEO_API}/ask', json={'text': text, 'user_id': str(update.effective_user.id)})
        result = r.json()
        mode     = result.get('mode', 'Neo')
        response = result.get('response', 'No response.')
        header   = f"[{mode}]\n" if mode not in ('Neo', 'default') else ''
        await update.message.reply_text((header + response)[:4096])
        _log('message', {'user_id': update.effective_user.id,
                         'mode': mode, 'input_len': len(text)})
    except Exception as e:
        await update.message.reply_text(f"Try again in a moment. ({e})")


async def cmd_model(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    import sys as _s; _s.path.insert(0,'/root/companion/agent')
    from routing.model_router import list_models, get_default, set_default
    args = ctx.args
    if not args:
        current = get_default()
        lines = [f"Active model: *{current}*", ""]
        for m in list_models():
            if m['available']:
                mark = "▶" if m['key']==current else "  "
                cost = f"${m['cost']}/1M" if m['cost']>0 else "free"
                lines.append(f"{mark} `{m['key']}` — {m['label']} ({cost})")
        lines.append("")
        lines.append("Switch: /model deepseek-hf")
        await update.message.reply_text("\n".join(lines), parse_mode="Markdown")
    else:
        key = args[0].strip()
        avail = {m['key']:m for m in list_models() if m['available']}
        if key not in avail:
            await update.message.reply_text(f"Unknown or unavailable model: {key}")
            return
        set_default(key)
        await update.message.reply_text(f"Switched to *{avail[key]['label']}*", parse_mode="Markdown")

def main():
    token = os.getenv('TELEGRAM_BOT_TOKEN')
    if not token or 'YOUR_TOKEN' in token:
        print('[telegram] ERROR: set TELEGRAM_BOT_TOKEN in /root/companion/telegram.env')
        sys.exit(1)

    app = Application.builder().token(token).build()
    app.add_handler(CommandHandler('start',    start))
    app.add_handler(CommandHandler('help',     start))
    app.add_handler(CommandHandler('status',   status))
    app.add_handler(CommandHandler('remember', remember))
    app.add_handler(CommandHandler('recall',   recall))
    app.add_handler(CommandHandler('model', cmd_model))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, message))

    print('[telegram] Neo bot polling...')
    app.run_polling(drop_pending_updates=True)

if __name__ == '__main__':
    main()
