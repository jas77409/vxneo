from google_auth_oauthlib.flow import InstalledAppFlow
import json

SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/drive',
]

flow = InstalledAppFlow.from_client_secrets_file(
    'google_credentials.json',
    scopes=SCOPES,
    redirect_uri='urn:ietf:wg:oauth:2.0:oob'
)

auth_url, _ = flow.authorization_url(
    access_type='offline',
    include_granted_scopes='true',
    prompt='consent'
)

print('\nOpen this URL in your browser:\n')
print(auth_url)
print('\nPaste the code here:')
code = input('Code: ').strip()

flow.fetch_token(code=code)
creds = flow.credentials

token_data = {
    'token': creds.token,
    'refresh_token': creds.refresh_token,
    'token_uri': creds.token_uri,
    'client_id': creds.client_id,
    'client_secret': creds.client_secret,
    'scopes': list(creds.scopes),
    'access_token': creds.token,
}

with open('google_token.json', 'w') as f:
    json.dump(token_data, f, indent=2)

print('\nToken saved successfully!')
