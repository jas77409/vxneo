import requests
import time
import json
import os
import redis
from datetime import datetime

AWTRIX_IP = "192.168.0.211"
AWTRIX_URL = f"http://{AWTRIX_IP}/api/notify"
APPS_URL = f"http://{AWTRIX_IP}/api/custom"
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

r = redis.Redis.from_url(REDIS_URL, decode_responses=True)

def push_app(app_name, text, icon=None, color="#3b82f6", duration=10):
    payload = {
        "text": text,
        "color": color,
        "duration": duration,
    }
    if icon:
        payload["icon"] = icon
    try:
        requests.post(f"{APPS_URL}?name={app_name}", json=payload, timeout=5)
        print(f"[DISPLAY] {app_name}: {text}")
    except Exception as e:
        print(f"[DISPLAY] Error: {e}")

def get_server_health():
    try:
        import psutil
        cpu = psutil.cpu_percent(interval=1)
        mem = psutil.virtual_memory().percent
        return f"CPU {cpu:.0f}% MEM {mem:.0f}%"
    except:
        try:
            import subprocess
            uptime = subprocess.check_output("uptime -p", shell=True).decode().strip()
            return uptime
        except:
            return "Server OK"

def get_github_stars():
    try:
        resp = requests.get(
            "https://api.github.com/repos/jas77409/vxneo",
            headers={"Accept": "application/vnd.github.v3+json"},
            timeout=5
        )
        if resp.status_code == 200:
            stars = resp.json().get("stargazers_count", 0)
            return f"★ {stars} stars"
    except:
        pass
    return "★ GitHub"

def get_weather():
    try:
        # Vienna weather via wttr.in
        resp = requests.get("https://wttr.in/Vienna?format=%t+%C", timeout=5)
        if resp.status_code == 200:
            return resp.text.strip()
    except:
        pass
    return "Weather N/A"

def get_neo_notifications():
    try:
        keys = r.keys("neo:notif:*")
        if keys:
            latest = r.get(keys[-1])
            if latest:
                data = json.loads(latest)
                return data.get("message", "")[:50]
    except:
        pass
    return None

def get_calendar_events():
    try:
        keys = r.keys("calendar:*")
        if keys:
            events = []
            for k in keys[:2]:
                v = r.get(k)
                if v:
                    data = json.loads(v)
                    events.append(data.get("title", "")[:20])
            if events:
                return " | ".join(events)
    except:
        pass
    return None

def run():
    print("[NEO DISPLAY] Starting desk display service...")
    cycle = 0
    while True:
        try:
            # App 1: Time (always shown via AWTRIX clock)
            
            # App 2: Server health
            if cycle % 6 == 0:
                health = get_server_health()
                push_app("neo_server", f"🖥 {health}", color="#10b981", duration=8)
            
            # App 3: GitHub stars
            elif cycle % 6 == 1:
                stars = get_github_stars()
                push_app("neo_github", f"⭐ {stars}", color="#f59e0b", duration=8)
            
            # App 4: Weather
            elif cycle % 6 == 2:
                weather = get_weather()
                push_app("neo_weather", f"🌤 {weather}", color="#06b6d4", duration=8)
            
            # App 5: Neo notification
            elif cycle % 6 == 3:
                notif = get_neo_notifications()
                if notif:
                    push_app("neo_alert", f"Neo: {notif}", color="#3b82f6", duration=10)
            
            # App 6: Calendar
            elif cycle % 6 == 4:
                events = get_calendar_events()
                if events:
                    push_app("neo_cal", f"📅 {events}", color="#8b5cf6", duration=10)
            
            # App 7: VXNeo branding
            elif cycle % 6 == 5:
                push_app("neo_brand", "VXNeo Labs", color="#3b82f6", duration=5)

            cycle += 1
            time.sleep(15)
            
        except KeyboardInterrupt:
            print("[NEO DISPLAY] Stopped")
            break
        except Exception as e:
            print(f"[NEO DISPLAY] Error: {e}")
            time.sleep(30)

if __name__ == "__main__":
    run()
