# HTTPS Setup Guide for Django

## Development HTTPS

### Option 1: django-extensions (Recommended)

1. Install django-extensions:
```bash
poetry add django-extensions[crypto]
```

2. Add to INSTALLED_APPS in settings.py:
```python
INSTALLED_APPS = [
    # ... existing apps
    'django_extensions',
]
```

3. Run with HTTPS:
```bash
poetry run python backend/manage.py runserver_plus --cert-file cert.crt --key-file cert.key 0.0.0.0:8000
```

### Option 2: Self-signed Certificate

1. Generate certificate:
```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

2. Use with Gunicorn:
```bash
poetry add gunicorn
poetry run gunicorn --certfile=cert.pem --keyfile=key.pem -b 0.0.0.0:8000 linguaromana_backend.wsgi:application
```

### Option 3: ngrok (For testing/sharing)

1. Install ngrok: https://ngrok.com/
2. Run your server normally: `poetry run python backend/manage.py runserver`
3. In another terminal: `ngrok http 8000`
4. Access via the HTTPS URL ngrok provides

## Production HTTPS (Already Configured!)

Your production setup is already correct for Heroku:

- ✅ SECURE_SSL_REDIRECT = True
- ✅ SECURE_PROXY_SSL_HEADER configured
- ✅ Secure cookies enabled
- ✅ Security headers set

Heroku automatically provides SSL certificates for all apps.

## Quick Dev HTTPS Setup

To get HTTPS working in development quickly:

```bash
# Install django-extensions
poetry add django-extensions[crypto]

# Add to INSTALLED_APPS in settings.py
# Then run:
poetry run python backend/manage.py runserver_plus --cert-file cert.crt 0.0.0.0:8000
```

Access at: https://127.0.0.1:8000/ (you'll get a security warning - click "Advanced" > "Proceed")
