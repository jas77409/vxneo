import os, json
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv
load_dotenv('/root/companion/.env')

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import base64, email

TOKEN_FILE = '/root/companion/google_token.json'
CREDS_FILE = '/root/companion/google_credentials.json'

SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
]

def _get_creds():
    creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        Path(TOKEN_FILE).write_text(creds.to_json())
    return creds

def get_recent_emails(max_results=5):
    try:
        service = build('gmail', 'v1', credentials=_get_creds())
        results = service.users().messages().list(
            userId='me', maxResults=max_results, q='is:unread'
        ).execute()
        messages = results.get('messages', [])
        emails = []
        for msg in messages:
            m = service.users().messages().get(userId='me', id=msg['id'], format='metadata',
                metadataHeaders=['Subject','From','Date']).execute()
            headers = {h['name']: h['value'] for h in m['payload']['headers']}
            emails.append({
                'id':      msg['id'],
                'subject': headers.get('Subject', 'No subject'),
                'from':    headers.get('From', 'Unknown'),
                'date':    headers.get('Date', ''),
                'snippet': m.get('snippet', '')[:150],
            })
        return emails
    except Exception as e:
        return [{'error': str(e)}]

def send_email(to, subject, body):
    try:
        service = build('gmail', 'v1', credentials=_get_creds())
        message = email.message.EmailMessage()
        message['To']      = to
        message['Subject'] = subject
        message.set_content(body)
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
        service.users().messages().send(userId='me', body={'raw': raw}).execute()
        return {'success': True, 'to': to, 'subject': subject}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def get_upcoming_events(max_results=5):
    try:
        service   = build('calendar', 'v3', credentials=_get_creds())
        now       = datetime.utcnow().isoformat() + 'Z'
        results   = service.events().list(
            calendarId='primary', timeMin=now,
            maxResults=max_results, singleEvents=True,
            orderBy='startTime'
        ).execute()
        events = []
        for e in results.get('items', []):
            start = e['start'].get('dateTime', e['start'].get('date', ''))
            events.append({
                'id':       e['id'],
                'title':    e.get('summary', 'No title'),
                'start':    start,
                'location': e.get('location', ''),
                'description': e.get('description', '')[:100],
            })
        return events
    except Exception as e:
        return [{'error': str(e)}]

def create_event(title, start_time, end_time, description='', location=''):
    try:
        service = build('calendar', 'v3', credentials=_get_creds())
        event   = {
            'summary':     title,
            'location':    location,
            'description': description,
            'start': {'dateTime': start_time, 'timeZone': 'UTC'},
            'end':   {'dateTime': end_time,   'timeZone': 'UTC'},
        }
        result = service.events().insert(calendarId='primary', body=event).execute()
        return {'success': True, 'id': result['id'], 'title': title, 'start': start_time}
    except Exception as e:
        return {'success': False, 'error': str(e)}

if __name__ == '__main__':
    print('[gmail] recent emails:')
    for e in get_recent_emails(3):
        print(' -', e.get('subject','?'), 'from', e.get('from','?'))
    print('[calendar] upcoming events:')
    for e in get_upcoming_events(3):
        print(' -', e.get('title','?'), 'at', e.get('start','?'))
    print('google_tools ok')
