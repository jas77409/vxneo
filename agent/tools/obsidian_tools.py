import os
from datetime import datetime, date
from pathlib import Path
from dotenv import load_dotenv

load_dotenv('/root/companion/.env')
VAULT = Path(os.getenv('OBSIDIAN_VAULT_PATH', '/root/vault'))


def _write(rel_path, content, append=False):
    p = VAULT / rel_path
    p.parent.mkdir(parents=True, exist_ok=True)
    mode = 'a' if append else 'w'
    with open(p, mode, encoding='utf-8') as f:
        f.write(content)
    return str(p)


def _read(rel_path):
    p = VAULT / rel_path
    return p.read_text(encoding='utf-8') if p.exists() else ''


def create_daily_note(orientation, surfaced_memory=''):
    today   = date.today().isoformat()
    path    = '10-Daily/' + today + '.md'
    content = (
        '# ' + today + '\n\n'
        '## Morning Orientation\n'
        + orientation + '\n\n'
        '## Memory Surface\n'
        + (surfaced_memory or '_Nothing specific surfaced today._') + '\n\n'
        '## Captures\n\n'
        '## Reflection\n'
    )
    return _write(path, content)


def append_capture(text, tags=None):
    today  = date.today().isoformat()
    now    = datetime.now().strftime('%H:%M')
    path   = '10-Daily/' + today + '.md'
    entry  = '\n- ' + now + '  ' + text
    if tags:
        entry += '  ' + ' '.join('#' + t for t in tags)
    return _write(path, entry, append=True)


def write_reflection(title, content):
    now  = datetime.now().strftime('%Y-%m-%d-%H%M')
    path = '20-Reflections/' + now + '-' + title.replace(' ', '-')[:40] + '.md'
    full = '# ' + title + '\n_' + datetime.now().strftime('%A %B %d, %Y %H:%M') + '_\n\n' + content + '\n'
    return _write(path, full)


def write_agent_log(action, detail=''):
    today = date.today().isoformat()
    path  = '80-Agent-Log/' + today + '.md'
    entry = '\n- ' + datetime.now().strftime('%H:%M') + '  **' + action + '**  ' + detail
    return _write(path, entry, append=True)


def search_vault(query, limit=8):
    q       = query.lower()
    results = []
    for p in VAULT.rglob('*.md'):
        try:
            text = p.read_text(encoding='utf-8', errors='ignore')
            if q in text.lower() or q in p.name.lower():
                results.append({'path': str(p.relative_to(VAULT)), 'preview': text[:200]})
                if len(results) >= limit:
                    break
        except Exception:
            pass
    return results


def read_note(rel_path):
    return _read(rel_path)


if __name__ == '__main__':
    r = create_daily_note('Testing the vault system.', 'First memory surfaced.')
    print('Created:', r)
    append_capture('This is a test capture', ['test'])
    write_agent_log('test_run', 'obsidian_tools self-test ok')
    print('obsidian tools ok')
