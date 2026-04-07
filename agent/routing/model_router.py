import os,json,httpx
from dotenv import load_dotenv
load_dotenv('/root/companion/.env')
import anthropic as _anthropic

MODELS={
    "claude":        {"provider":"anthropic", "model_id":"claude-opus-4-5",                "label":"Claude (Anthropic)",    "cost":15.0},
    "claude-sonnet": {"provider":"anthropic", "model_id":"claude-sonnet-4-5-20251001",      "label":"Claude Sonnet",         "cost":3.0},
    "claude-haiku":  {"provider":"anthropic", "model_id":"claude-haiku-4-5-20251001",       "label":"Claude Haiku (fast)",   "cost":0.25},
    "gpt4o":         {"provider":"openai",    "model_id":"gpt-4o",                          "label":"GPT-4o (OpenAI)",       "cost":5.0},
    "gpt4o-mini":    {"provider":"openai",    "model_id":"gpt-4o-mini",                     "label":"GPT-4o Mini",           "cost":0.15},
    "gemini":        {"provider":"google",    "model_id":"gemini-1.5-pro",                  "label":"Gemini 1.5 Pro",        "cost":3.5},
    "gemini-flash":  {"provider":"google",    "model_id":"gemini-1.5-flash",                "label":"Gemini Flash",          "cost":0.075},
    "deepseek":      {"provider":"deepseek",  "model_id":"deepseek-chat",                   "label":"DeepSeek V3",           "cost":0.27},
    "deepseek-r1":   {"provider":"deepseek",  "model_id":"deepseek-reasoner",               "label":"DeepSeek R1",           "cost":0.55},
    "qwen":          {"provider":"qwen",      "model_id":"qwen-max",                        "label":"Qwen 3 Max (Alibaba)",  "cost":0.38},
    "kimi":          {"provider":"kimi",      "model_id":"moonshot-v1-128k",                "label":"Kimi K2 (Moonshot)",    "cost":1.0},

    "deepseek-hf":   {"provider":"huggingface","model_id":"deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",     "label":"DeepSeek V3 (HF)",      "cost":0.0},
    "qwen-hf":       {"provider":"huggingface","model_id":"Qwen/Qwen2.5-72B-Instruct",         "label":"Qwen 2.5 72B (HF)",     "cost":0.0},
    "kimi-hf":       {"provider":"huggingface","model_id":"moonshotai/Kimi-K2-Instruct",        "label":"Kimi K2 (HF)",          "cost":0.0},
    "mistral-hf":    {"provider":"huggingface","model_id":"mistralai/Mistral-7B-Instruct-v0.3","label":"Mistral 7B (HF)",       "cost":0.0},
    "llama-hf":      {"provider":"huggingface","model_id":"meta-llama/Llama-3.1-8B-Instruct",  "label":"Llama 3.1 8B (HF)",     "cost":0.0},
    "ollama":        {"provider":"ollama",    "model_id":"llama3.2",                        "label":"Llama 3.2 (local)",     "cost":0.0},
    "ollama-mistral":{"provider":"ollama",    "model_id":"mistral",                         "label":"Mistral (local)",       "cost":0.0},
    "ollama-qwen":   {"provider":"ollama",    "model_id":"qwen2.5",                         "label":"Qwen 2.5 (local)",      "cost":0.0},
}

NEO_SYSTEM="You are Neo — a personal companion intelligence built by VXNeo Labs. Never reveal the underlying model. You are Neo."

def _avail(k):
    p=MODELS.get(k,{}).get("provider","")
    if p=="anthropic": return bool(os.getenv("ANTHROPIC_API_KEY"))
    if p=="openai":    return bool(os.getenv("OPENAI_API_KEY"))
    if p=="google":    return bool(os.getenv("GOOGLE_API_KEY"))
    if p=="deepseek":  return bool(os.getenv("DEEPSEEK_API_KEY"))
    if p=="qwen":      return bool(os.getenv("QWEN_API_KEY"))
    if p=="kimi":      return bool(os.getenv("KIMI_API_KEY"))
    if p=="huggingface": return bool(os.getenv("HF_API_KEY"))
    if p=="ollama":
        try: return httpx.get("http://localhost:11434/api/tags",timeout=2).status_code==200
        except: return False
    return False

def get_default():
    try:
        import redis as _r
        r=_r.Redis.from_url(os.getenv('REDIS_URL','redis://localhost:6379'),decode_responses=True)
        return r.get('neo:model:default') or os.getenv('NEO_DEFAULT_MODEL','claude')
    except: return os.getenv('NEO_DEFAULT_MODEL','claude')

def set_default(model_key):
    if model_key not in MODELS: return False
    try:
        import redis as _r
        r=_r.Redis.from_url(os.getenv('REDIS_URL','redis://localhost:6379'),decode_responses=True)
        r.set('neo:model:default',model_key);return True
    except: return False

def list_models():
    return [{"key":k,"label":v["label"],"cost":v["cost"],"available":_avail(k)} for k,v in MODELS.items()]

def _anthropic_ask(prompt,system,mid):
    c=_anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    m=c.messages.create(model=mid,max_tokens=1024,system=system,messages=[{"role":"user","content":prompt}])
    return m.content[0].text

def _openai_ask(prompt,system,mid):
    import openai
    c=openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    r=c.chat.completions.create(model=mid,messages=[{"role":"system","content":system},{"role":"user","content":prompt}],max_tokens=1024)
    return r.choices[0].message.content

def _google_ask(prompt,system,mid):
    import google.generativeai as genai
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
    m=genai.GenerativeModel(mid,system_instruction=system)
    return m.generate_content(prompt).text

def _deepseek_ask(prompt,system,mid):
    r=httpx.post("https://api.deepseek.com/chat/completions",
        headers={"Authorization":f"Bearer {os.getenv('DEEPSEEK_API_KEY')}","Content-Type":"application/json"},
        json={"model":mid,"messages":[{"role":"system","content":system},{"role":"user","content":prompt}],"max_tokens":1024},
        timeout=60)
    r.raise_for_status();return r.json()["choices"][0]["message"]["content"]

def _qwen_ask(prompt,system,mid):
    r=httpx.post("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        headers={"Authorization":f"Bearer {os.getenv('QWEN_API_KEY')}","Content-Type":"application/json"},
        json={"model":mid,"messages":[{"role":"system","content":system},{"role":"user","content":prompt}],"max_tokens":1024},
        timeout=60)
    r.raise_for_status();return r.json()["choices"][0]["message"]["content"]

def _kimi_ask(prompt,system,mid):
    r=httpx.post("https://api.moonshot.cn/v1/chat/completions",
        headers={"Authorization":f"Bearer {os.getenv('KIMI_API_KEY')}","Content-Type":"application/json"},
        json={"model":mid,"messages":[{"role":"system","content":system},{"role":"user","content":prompt}],"max_tokens":1024},
        timeout=60)
    r.raise_for_status();return r.json()["choices"][0]["message"]["content"]


def _hf_ask(prompt,system,mid):
    from huggingface_hub import InferenceClient
    client=InferenceClient(token=os.getenv("HF_API_KEY"))
    messages=[{"role":"system","content":system},{"role":"user","content":prompt}]
    r=client.chat_completion(model=mid,messages=messages,max_tokens=1024)
    return r.choices[0].message.content

def _ollama_ask(prompt,system,mid):
    r=httpx.post("http://localhost:11434/api/chat",
        json={"model":mid,"messages":[{"role":"system","content":system},{"role":"user","content":prompt}],"stream":False},
        timeout=120)
    r.raise_for_status();return r.json()["message"]["content"]

def ask_model(prompt,model=None,system=None):
    if not model: model=get_default()
    if model not in MODELS: return {"success":False,"error":f"Unknown model: {model}"}
    m=MODELS[model];sys_p=system or NEO_SYSTEM;prov=m["provider"];mid=m["model_id"]
    try:
        if prov=="anthropic": text=_anthropic_ask(prompt,sys_p,mid)
        elif prov=="openai":  text=_openai_ask(prompt,sys_p,mid)
        elif prov=="google":  text=_google_ask(prompt,sys_p,mid)
        elif prov=="deepseek":text=_deepseek_ask(prompt,sys_p,mid)
        elif prov=="qwen":    text=_qwen_ask(prompt,sys_p,mid)
        elif prov=="kimi":    text=_kimi_ask(prompt,sys_p,mid)
        elif prov=="huggingface": text=_hf_ask(prompt,sys_p,mid)
        elif prov=="ollama":  text=_ollama_ask(prompt,sys_p,mid)
        else: return {"success":False,"error":f"No handler for {prov}"}
        return {"success":True,"response":text,"model":model,"label":m["label"],"provider":prov,"cost":m["cost"]}
    except Exception as e:
        return {"success":False,"error":str(e),"model":model,"provider":prov}

def best_model_for(task):
    prefs={"coding":["deepseek-r1","deepseek","gpt4o","claude"],
           "reasoning":["deepseek-r1","claude","kimi","gpt4o"],
           "speed":["claude-haiku","deepseek","gpt4o-mini","gemini-flash"],
           "cost":["ollama","deepseek","qwen","gemini-flash"],
           "chinese":["qwen","kimi","deepseek","claude"],
           "companion":["claude","claude-sonnet","gpt4o","deepseek"],
           "local":["ollama","ollama-mistral","ollama-qwen","claude"]}
    for c in prefs.get(task,["claude"]):
        if _avail(c): return c
    return "claude"

if __name__=="__main__":
    print("Models:")
    for m in list_models():
        print(f"  {'✓' if m['available'] else '✗'} {m['key']:20s} {m['label']}")
    print("Default:",get_default())
