import os,subprocess,json,re,httpx
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
load_dotenv('/root/companion/.env')

GITHUB_TOKEN=os.getenv('GITHUB_TOKEN','')
GITHUB_API='https://api.github.com'
SHELL_TIMEOUT=30
SHELL_WHITELIST=['git','ls','cat','find','grep','echo','pwd','wc','head','tail',
    'diff','stat','du','df','ps','uptime','free','date','whoami','hostname',
    'python3','pip','curl','wget','systemctl','journalctl','docker','nginx','crontab']
SHELL_BLACKLIST=[r'rm\s+-rf\s+/',r'dd\s+if=',r'mkfs',r'format',r'shutdown',
    r'reboot',r'passwd',r':(){:|:&};:',r'>\s*/dev/sd',r'chmod\s+777\s+/']
SAFE_ROOTS=['/root/companion','/root/vxneo-platform','/root/vault','/tmp']

def _gh_h():
    h={'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}
    if GITHUB_TOKEN: h['Authorization']=f'Bearer {GITHUB_TOKEN}'
    return h

def _gh_get(path,params=None):
    r=httpx.get(f'{GITHUB_API}{path}',headers=_gh_h(),params=params,timeout=15)
    if r.status_code==404: return {'error':'Not found'}
    r.raise_for_status();return r.json()

def _gh_post(path,data):
    r=httpx.post(f'{GITHUB_API}{path}',headers=_gh_h(),json=data,timeout=15)
    r.raise_for_status();return r.json()

def get_repo(owner,repo):
    d=_gh_get(f'/repos/{owner}/{repo}')
    if 'error' in d: return d
    return {'name':d['name'],'description':d.get('description',''),
            'stars':d['stargazers_count'],'forks':d['forks_count'],
            'language':d.get('language',''),'open_issues':d['open_issues_count'],
            'url':d['html_url'],'default_branch':d['default_branch'],'updated_at':d['updated_at']}

def get_commits(owner,repo,branch='main',limit=10):
    d=_gh_get(f'/repos/{owner}/{repo}/commits',params={'sha':branch,'per_page':limit})
    if isinstance(d,dict) and 'error' in d: return [d]
    return [{'sha':c['sha'][:8],'message':c['commit']['message'].split('\n')[0][:80],
             'author':c['commit']['author']['name'],'date':c['commit']['author']['date'][:10]} for c in d]

def get_issues(owner,repo,state='open',limit=10):
    d=_gh_get(f'/repos/{owner}/{repo}/issues',params={'state':state,'per_page':limit})
    if isinstance(d,dict) and 'error' in d: return [d]
    return [{'number':i['number'],'title':i['title'],'state':i['state'],
             'labels':[l['name'] for l in i.get('labels',[])],'url':i['html_url']}
            for i in d if 'pull_request' not in i]

def create_issue(owner,repo,title,body,labels=None):
    p={'title':title,'body':body}
    if labels: p['labels']=labels
    d=_gh_post(f'/repos/{owner}/{repo}/issues',p)
    return {'number':d['number'],'title':d['title'],'url':d['html_url']}

def get_file_content(owner,repo,path,branch='main'):
    import base64
    d=_gh_get(f'/repos/{owner}/{repo}/contents/{path}',params={'ref':branch})
    if 'error' in d: return d
    if d.get('type')!='file': return {'error':f'{path} is not a file'}
    content=base64.b64decode(d['content']).decode('utf-8',errors='replace')
    return {'path':path,'content':content[:3000],'truncated':d['size']>3000}

def run_command(command,working_dir='/root/companion'):
    for p in SHELL_BLACKLIST:
        if re.search(p,command):
            return {'success':False,'error':f'Blocked: {p}','stdout':'','stderr':'','code':-1}
    first=command.strip().split()[0] if command.strip() else ''
    if first not in SHELL_WHITELIST:
        return {'success':False,'error':f'"{first}" not whitelisted','stdout':'','stderr':'','code':-1}
    try:
        r=subprocess.run(command,shell=True,capture_output=True,text=True,
                         timeout=SHELL_TIMEOUT,cwd=working_dir)
        return {'success':r.returncode==0,'stdout':r.stdout[:2000],
                'stderr':r.stderr[:500],'code':r.returncode,'command':command}
    except subprocess.TimeoutExpired:
        return {'success':False,'error':f'Timed out after {SHELL_TIMEOUT}s','stdout':'','stderr':'','code':-1}
    except Exception as e:
        return {'success':False,'error':str(e),'stdout':'','stderr':'','code':-1}

def _safe(path):
    return any(str(Path(path).resolve()).startswith(r) for r in SAFE_ROOTS)

def read_file(path):
    if not _safe(path): return {'error':f'Path outside allowed dirs'}
    p=Path(path)
    if not p.exists(): return {'error':f'Not found: {path}'}
    if not p.is_file(): return {'error':f'Not a file: {path}'}
    c=p.read_text(errors='replace')
    return {'path':path,'content':c[:3000],'truncated':len(c)>3000}

def write_file(path,content):
    if not _safe(path): return {'error':'Path outside allowed dirs'}
    p=Path(path);p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(content);return {'success':True,'path':path,'bytes':len(content)}

def search_files(directory,pattern,extension=''):
    if not _safe(directory): return [{'error':'Outside allowed paths'}]
    results=[]
    for p in Path(directory).rglob(f'*{extension}'):
        if p.is_file() and pattern.lower() in p.name.lower():
            results.append({'path':str(p),'name':p.name,'size':p.stat().st_size})
            if len(results)>=20: break
    return results

def list_directory(path):
    if not _safe(path): return {'error':'Outside allowed dirs'}
    p=Path(path)
    if not p.exists(): return {'error':f'Not found: {path}'}
    items=[{'name':i.name,'type':'dir' if i.is_dir() else 'file',
            'size':i.stat().st_size if i.is_file() else None}
           for i in sorted(p.iterdir())]
    return {'path':path,'items':items[:50]}

def route_github_task(text):
    t=text.lower()
    if any(x in t for x in ['run command','check status','service status','check logs','tail log']):
        if any(x in t for x in ['companion','neo','api']):
            r=run_command('systemctl status companion-api --no-pager | head -8')
            return {'task_type':'shell','success':True,'message':r['stdout'] or r['error']}
        if 'log' in t:
            r=run_command('tail -20 /root/companion/logs/telegram.jsonl 2>/dev/null || echo "No logs yet"')
            return {'task_type':'shell','success':True,'message':r['stdout'] or r['error']}
    if any(x in t for x in ['github','issue','commit','repo','pull request']):
        owner,repo='jas77409','vxneo'
        if 'issue' in t:
            issues=get_issues(owner,repo)
            if not issues: return {'task_type':'github','success':True,'message':'No open issues.'}
            lines=[f"#{i['number']} {i['title']}" for i in issues[:5]]
            return {'task_type':'github','success':True,'message':'Open issues:\n\n'+'\n'.join(lines)}
        if 'commit' in t:
            commits=get_commits(owner,repo)
            lines=[f"{c['sha']} — {c['message']} ({c['date']})" for c in commits[:5]]
            return {'task_type':'github','success':True,'message':'Recent commits:\n\n'+'\n'.join(lines)}
        info=get_repo(owner,repo)
        return {'task_type':'github','success':True,
                'message':f"jas77409/vxneo\n{info.get('description','')}\nStars: {info.get('stars',0)} | Issues: {info.get('open_issues',0)}"}
    if any(x in t for x in ['find file','search file','where is','list files']):
        q=text.strip().split()[-1]
        r=search_files('/root/companion',q)
        if not r: return {'task_type':'file','success':True,'message':f'No files matching "{q}".'}
        lines=[f"{f['name']} — {f['path']}" for f in r[:5]]
        return {'task_type':'file','success':True,'message':'\n'.join(lines)}
    return {'task_type':'github','success':False,'message':'Could not parse GitHub/shell request.'}

if __name__=='__main__':
    print('uptime:',run_command('uptime')['stdout'].strip())
    print('repo:',get_repo('jas77409','vxneo').get('name'))
    print('blocked:',run_command('rm -rf /')['error'])
    print('list:',list_directory('/root/companion/agent')['items'][:3])
    print('github_tools ok')
