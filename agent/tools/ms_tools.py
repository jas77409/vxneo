import os,json,sys,re,requests
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
load_dotenv('/root/companion/.env')

CLIENT_ID=os.getenv('MS_CLIENT_ID','f4386880-a0ed-48a5-aaeb-411a402d0cc3')
CLIENT_SECRET=os.getenv('MS_CLIENT_SECRET','')
TENANT_ID=os.getenv('MS_TENANT_ID','5e373fd4-1414-4f20-bca6-b86ab524aa57')
TOKEN_FILE='/root/companion/ms_token.json'
GRAPH_BASE='https://graph.microsoft.com/v1.0'
SCOPES=['Notes.Read','Notes.ReadWrite','Notes.Read.All','User.Read']

def _save_token(t): Path(TOKEN_FILE).write_text(json.dumps(t,indent=2))
def _load_token():
    if Path(TOKEN_FILE).exists(): return json.loads(Path(TOKEN_FILE).read_text())
    return {}

def _refresh(rt):
    r=requests.post(f'https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token',
        data={'client_id':CLIENT_ID,'client_secret':CLIENT_SECRET,'refresh_token':rt,
              'grant_type':'refresh_token','scope':' '.join(SCOPES)},timeout=15)
    r.raise_for_status();return r.json()

def get_access_token():
    tok=_load_token()
    if not tok: raise Exception('No token. Run: python3 ms_tools.py auth')
    if 'refresh_token' in tok:
        try:
            new=_refresh(tok['refresh_token'])
            new['refresh_token']=tok['refresh_token']
            _save_token(new);return new['access_token']
        except: pass
    return tok.get('access_token','')

def _h(): return {'Authorization':f'Bearer {get_access_token()}','Content-Type':'application/json'}

def _graph(method,path,**kw):
    r=getattr(requests,method)(f'{GRAPH_BASE}{path}',headers=_h(),timeout=15,**kw)
    if r.status_code==204: return {'success':True}
    if not r.ok: return {'error':f'{r.status_code}: {r.text[:200]}'}
    return r.json()

def auth_device_flow():
    import msal
    app=msal.PublicClientApplication(CLIENT_ID,authority=f'https://login.microsoftonline.com/{TENANT_ID}')
    flow=app.initiate_device_flow(scopes=SCOPES)
    if 'user_code' not in flow: raise Exception(f'Flow failed: {flow}')
    print(f'\n1. Open: {flow["verification_uri"]}\n2. Enter code: {flow["user_code"]}\n\nWaiting...')
    result=app.acquire_token_by_device_flow(flow)
    if 'access_token' not in result: raise Exception(f'Auth failed: {result.get("error_description")}')
    _save_token(result);print(f'\nAuthenticated! Token saved to {TOKEN_FILE}');return result

def get_notebooks():
    d=_graph('get','/me/onenote/notebooks')
    if 'error' in d: return [d]
    return [{'id':n['id'],'name':n['displayName'],'modified':n.get('lastModifiedDateTime','')[:10]} for n in d.get('value',[])]

def get_sections(notebook_id=None):
    path=f'/me/onenote/notebooks/{notebook_id}/sections' if notebook_id else '/me/onenote/sections'
    d=_graph('get',path)
    if 'error' in d: return [d]
    return [{'id':s['id'],'name':s['displayName'],'notebook':s.get('parentNotebook',{}).get('displayName','')} for s in d.get('value',[])]

def get_pages(section_id=None,top=10):
    path=f'/me/onenote/sections/{section_id}/pages' if section_id else '/me/onenote/pages'
    d=_graph('get',path,params={'$top':top,'$orderby':'lastModifiedDateTime desc'})
    if 'error' in d: return [d]
    return [{'id':p['id'],'title':p.get('title','Untitled'),'section':p.get('parentSection',{}).get('displayName',''),'modified':p.get('lastModifiedDateTime','')[:10]} for p in d.get('value',[])]

def get_page_content(page_id):
    r=requests.get(f'{GRAPH_BASE}/me/onenote/pages/{page_id}/content',headers={'Authorization':f'Bearer {get_access_token()}'},timeout=15)
    if not r.ok: return {'error':f'{r.status_code}'}
    text=re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',r.text)).strip()
    return {'content':text[:2000],'truncated':len(text)>2000}

def search_pages(query,top=5):
    d=_graph('get','/me/onenote/pages',params={'$top':50,'$orderby':'lastModifiedDateTime desc'})
    if 'error' in d: return [d]
    return [{'id':p['id'],'title':p.get('title','Untitled'),'section':p.get('parentSection',{}).get('displayName','')} for p in d.get('value',[]) if query.lower() in p.get('title','').lower()][:top]

def create_page(section_id,title,content):
    r=requests.post(f'{GRAPH_BASE}/me/onenote/sections/{section_id}/pages',
        headers={'Authorization':f'Bearer {get_access_token()}','Content-Type':'text/html'},
        data=f'<!DOCTYPE html><html><head><title>{title}</title></head><body><h1>{title}</h1><p>{content}</p><p style="color:gray">Neo · {datetime.now().strftime("%Y-%m-%d %H:%M")}</p></body></html>'.encode(),timeout=15)
    if not r.ok: return {'error':f'{r.status_code}: {r.text[:200]}'}
    d=r.json();return {'success':True,'id':d.get('id'),'title':title,'url':d.get('links',{}).get('oneNoteWebUrl',{}).get('href','')}

def create_sticky_note(content):
    sections=get_sections()
    qn=next((s for s in sections if 'quick' in s.get('name','').lower()),None)
    if not qn and sections and 'error' not in sections[0]: qn=sections[0]
    if not qn: return {'error':'No sections found'}
    return create_page(qn['id'],f"Note · {datetime.now().strftime('%b %d %H:%M')}",content)

def route_ms_task(text):
    t=text.lower()
    if any(x in t for x in ['sticky note','quick note']):
        if any(x in t for x in ['create','add','new','write','save']):
            content=re.sub(r'.*(create|add|new|write|save).*?(note|notes)\s*:?\s*','',text,flags=re.I).strip() or text
            r=create_sticky_note(content)
            return {'task_type':'onenote','success':r.get('success',False),'message':f"Note created: {r.get('title','')}" if r.get('success') else r.get('error','')}
        notes=get_pages(top=5)
        lines=[f"• {p['title']} ({p['modified']})" for p in notes if 'error' not in p]
        return {'task_type':'onenote','success':True,'message':'Recent notes:\n\n'+'\n'.join(lines)}
    if any(x in t for x in ['onenote','notebook','my pages']):
        if 'search' in t:
            q=re.sub(r'.*(search|find)\s+','',text,flags=re.I).strip()
            results=search_pages(q)
            lines=[f"• {p['title']} [{p['section']}]" for p in results]
            return {'task_type':'onenote','success':True,'message':f'Found {len(results)} pages:\n\n'+'\n'.join(lines) if lines else f'No pages found for "{q}".'}
        pages=get_pages(top=5)
        lines=[f"• {p['title']} [{p['section']}] ({p['modified']})" for p in pages if 'error' not in p]
        return {'task_type':'onenote','success':True,'message':'Recent OneNote pages:\n\n'+'\n'.join(lines)}
    return {'task_type':'onenote','success':False,'message':'Could not parse OneNote request.'}

if __name__=='__main__':
    if len(sys.argv)>1 and sys.argv[1]=='auth':
        auth_device_flow()
    else:
        try:
            tok=get_access_token();print('Token ok')
            nbs=get_notebooks();print('Notebooks:',[n['name'] for n in nbs])
            pages=get_pages(top=3);print('Pages:',[p['title'] for p in pages])
        except Exception as e:
            print(f'Error: {e}')
            print('Run auth: python3 ms_tools.py auth')
