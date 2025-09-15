# Heroku Procfile - LinguaRomana (Poetry)
# =======================================

# Application web principale avec Poetry
web: cd backend && poetry run gunicorn linguaromana_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 120 --access-logfile - --error-logfile -

# Worker pour tâches en arrière-plan (optionnel)
# worker: cd backend && poetry run python manage.py rqworker

# Release phase - migrations automatiques (optionnel)
# release: cd backend && poetry run python manage.py migrate

