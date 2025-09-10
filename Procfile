# Heroku Procfile - LinguaRomana
# ==============================

# Application web principale  
web: cd backend && gunicorn linguaromana_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 120 --access-logfile - --error-logfile -

# Processus de release (migrations automatiques)
release: cd backend && python manage.py migrate
# Worker pour tâches en arrière-plan (optionnel)
# worker: cd backend && python manage.py rqworker

