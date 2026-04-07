import os,json,re,sys,requests
from datetime import datetime
from dotenv import load_dotenv
load_dotenv('/root/companion/.env')

NOTION_TOKEN=os.getenv('NOTION_TOKEN','')
NOTION_BASE='https://api.notion.com/v1'
NOTION_VER='2022-06-28'

def _h(): return {'Authorization':f'Bearer {NOTION_TOKEN}','Notion-Version':NOTION_VER,'Content-Type':'application/json'}
def _get(path,params=None):
    r=requests.get(f'{NOTION_BASE}{path}',headers=_h(),params=params,timeout=15)
    if not r.ok: return {'error':f'{r.status_code}: {r.text[:200]}'}
    return r.json()
def _post(path,data):
    r=requests.post(f'{NOTION_BASE}{path}',headers=_h(),json=data,timeout=15)
    if not r.ok: return {'error':f'{r.status_code}: {r.text[:200]}'}
    return r.json()
def _patch(path,data):
    r=requests.patch(f'{NOTION_BASE}{path}',headers=_h(),json=data,timeout=15)
    if not r.ok: return {'error':f'{r.status_code}: {r.text[:200]}'}
    return r.json()

def _title(page):
    for p in page.get('properties',{}).values():
        if p.get('type')=='title':
            items=p.get('title',[])
            if items: return items[0].get('plain_text','Untitled')
    return 'Untitled'

def _extract(blocks):
    lines=[]
    for b in blocks:
        bt=b.get('type','')
        rich=b.get(bt,{}).get('rich_text',[])
        text=' '.join(r.get('plain_text','') for r in rich)
        if text.strip():
            if bt in ('heading_1','heading_2','heading_3'): lines.append(f'\n## {text}')
            elif bt=='bulleted_list_item': lines.append(f'• {text}')
            elif bt=='numbered_list_item': lines.append(f'- {text}')
            elif bt=='to_do':
                done='✓' if b.get(bt,{}).get('checked') else '☐'
                lines.append(f'{done} {text}')
            else: lines.append(text)
    return '\n'.join(lines)

def search_pages(query='',top=10):
    d=_post('/search',{'query':query,'filter':{'value':'page','property':'object'},
        'sort':{'direction':'descending','timestamp':'last_edited_time'},'page_size':top})
    if 'error' in d: return [d]
    return [{'id':p['id'],'title':_title(p),'url':p.get('url',''),'modified':p.get('last_edited_time','')[:10]} for p in d.get('results',[])]

def get_page_content(page_id):
    d=_get(f'/blocks/{page_id}/children',params={'page_size':100})
    if 'error' in d: return d
    text=_extract(d.get('results',[]))
    pg=_get(f'/pages/{page_id}')
    return {'id':page_id,'title':_title(pg) if 'error' not in pg else '','content':text[:3000],'truncated':len(text)>3000,'url':pg.get('url','')}

def create_page(parent_id,title,content):
    blocks=[]
    for line in content.split('\n'):
        line=line.strip()
        if not line: continue
        if line.startswith('## '): blocks.append({'object':'block','type':'heading_2','heading_2':{'rich_text':[{'type':'text','text':{'content':line[3:]}}]}})
        elif line.startswith('• '): blocks.append({'object':'block','type':'bulleted_list_item','bulleted_list_item':{'rich_text':[{'type':'text','text':{'content':line[2:]}}]}})
        else: blocks.append({'object':'block','type':'paragraph','paragraph':{'rich_text':[{'type':'text','text':{'content':line}}]}})
    blocks.append({'object':'block','type':'paragraph','paragraph':{'rich_text':[{'type':'text','text':{'content':f'— Neo · {datetime.now().strftime("%Y-%m-%d %H:%M")}'},'annotations':{'color':'gray'}}]}})
    d=_post('/pages',{'parent':{'page_id':parent_id},'properties':{'title':{'title':[{'type':'text','text':{'content':title}}]}},'children':blocks[:100]})
    if 'error' in d: return d
    return {'success':True,'id':d['id'],'title':title,'url':d.get('url','')}

def append_to_page(page_id,content):
    blocks=[{'object':'block','type':'paragraph','paragraph':{'rich_text':[{'type':'text','text':{'content':content}}]}},
            {'object':'block','type':'paragraph','paragraph':{'rich_text':[{'type':'text','text':{'content':f'— Neo · {datetime.now().strftime("%Y-%m-%d %H:%M")}'},'annotations':{'color':'gray'}}]}}]
    d=_patch(f'/blocks/{page_id}/children',{'children':blocks})
    if 'error' in d: return d
    return {'success':True}

def create_quick_note(content,parent_id=None):
    if not parent_id:
        pages=search_pages(top=1)
        if not pages or 'error' in pages[0]: return {'error':'No pages found. Share a page with Neo Companion integration first.'}
        parent_id=pages[0]['id']
    return create_page(parent_id,f"Quick Note · {datetime.now().strftime('%b %d %H:%M')}",content)

def search_databases(query='',top=5):
    d=_post('/search',{'query':query,'filter':{'value':'database','property':'object'},'page_size':top})
    if 'error' in d: return [d]
    return [{'id':db['id'],'title':db.get('title',[{}])[0].get('plain_text','Untitled') if db.get('title') else 'Untitled','url':db.get('url','')} for db in d.get('results',[])]

def query_database(db_id,top=10):
    d=_post(f'/databases/{db_id}/query',{'page_size':top})
    if 'error' in d: return [d]
    return [{'id':p['id'],'title':_title(p),'url':p.get('url',''),'modified':p.get('last_edited_time','')[:10]} for p in d.get('results',[])]

def route_notion_task(text):
    t=text.lower()
    if any(x in t for x in ['create note','add note','new note','quick note','save note','write note']):
        content=re.sub(r'.*(create|add|new|quick|save|write)\s+note\s*:?\s*','',text,flags=re.I).strip() or text
        r=create_quick_note(content)
        if r.get('success'): return {'task_type':'notion','success':True,'message':f"Note created: *{r['title']}*\n{r.get('url','')}"}
        return {'task_type':'notion','success':False,'message':r.get('error','Failed')}
    if any(x in t for x in ['search notion','find in notion','find note','search note']):
        q=re.sub(r'.*(search|find)\s+(notion|notes?|in notion)\s*:?\s*','',text,flags=re.I).strip()
        results=search_pages(q,top=5)
        if not results or 'error' in results[0]: return {'task_type':'notion','success':False,'message':'Could not search Notion.'}
        lines=[f"• {p['title']} ({p['modified']})" for p in results]
        return {'task_type':'notion','success':True,'message':f'Found {len(results)} pages:\n\n'+'\n'.join(lines)}
    if any(x in t for x in ['read','open','show']) and 'notion' in t:
        q=re.sub(r'.*(read|open|show)\s+(notion\s+)?(page\s+)?','',text,flags=re.I).strip()
        results=search_pages(q,top=1)
        if results and 'error' not in results[0]:
            c=get_page_content(results[0]['id'])
            return {'task_type':'notion','success':True,'message':f"*{c.get('title','')}*\n\n{c.get('content','(empty)')[:500]}"}
        return {'task_type':'notion','success':False,'message':f'Page not found: {q}'}
    pages=search_pages(top=5)
    if not pages or 'error' in pages[0]: return {'task_type':'notion','success':False,'message':'Could not fetch Notion pages. Share pages with Neo Companion integration.'}
    lines=[f"• {p['title']} ({p['modified']})" for p in pages]
    return {'task_type':'notion','success':True,'message':'Recent Notion pages:\n\n'+'\n'.join(lines)}

if __name__=='__main__':
    print('Testing Notion...')
    pages=search_pages(top=5)
    if pages and 'error' not in pages[0]:
        print(f'Connected! {len(pages)} pages:')
        for p in pages: print(f"  • {p['title']} ({p['modified']})")
    else:
        print('Error:',pages)
        print('Share a Notion page with Neo Companion integration first.')
