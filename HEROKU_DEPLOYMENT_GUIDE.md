# 🚀 Guide de Déploiement Automatique Heroku - LinguaRomana

## 📋 **Vue d'ensemble**

Ce guide vous permet de configurer un **déploiement automatique** de LinguaRomana sur Heroku à chaque push sur `main` ou `develop`.

## 🎯 **Processus de Déploiement**

```
1. Push sur GitLab → 2. Tests automatiques → 3. Déploiement Heroku → 4. Vérifications → 5. Notifications
```

---

## 🔧 **Configuration Initiale**

### **1. Créer le compte et l'app Heroku**

```bash
# 1. Installer Heroku CLI
brew install heroku/brew/heroku  # macOS
# ou télécharger sur https://devcenter.heroku.com/articles/heroku-cli

# 2. Se connecter
heroku auth:login

# 3. Configuration automatique (recommandé)
./scripts/setup_heroku.sh mon-linguaromana-app

# 4. OU configuration manuelle
heroku create mon-linguaromana-app --region eu
heroku addons:create heroku-postgresql:essential-0
```

### **2. Configurer les Variables GitLab CI/CD**

Dans GitLab → Votre projet → Settings → CI/CD → Variables, ajoutez :

```bash
# OBLIGATOIRE
HEROKU_API_KEY = "votre-clé-api-heroku"
HEROKU_APP_NAME = "nom-de-votre-app"

# OPTIONNEL (pour staging)
HEROKU_STAGING_APP_NAME = "nom-app-staging"

# OPTIONNEL (notifications)
SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/..."
NOTIFICATION_EMAIL = "admin@monsite.com"

# OPTIONNEL (configuration avancée)
DEPLOY_METHOD = "dpl"  # ou "cli"
```

### **3. Obtenir votre clé API Heroku**

```bash
# Méthode 1: Via CLI
heroku auth:token

# Méthode 2: Via Dashboard
# https://dashboard.heroku.com/account → API Key
```

---

## 🏗️ **Structure des Fichiers**

```
projet/
├── Dockerfile              # Image Docker pour Heroku
├── Procfile                # Processus Heroku
├── runtime.txt             # Version Python
├── heroku.yml              # Config Docker Heroku
├── .gitlab-ci.yml          # Pipeline CI/CD modifiée
├── backend/
│   ├── requirements.txt    # Dépendances mises à jour
│   └── linguaromana_backend/
│       └── settings.py     # Config Heroku/PostgreSQL
└── scripts/
    ├── setup_heroku.sh     # Configuration automatique
    └── deploy.sh           # Script de déploiement
```

---

## ⚙️ **Variables d'Environnement Heroku**

Votre app Heroku aura automatiquement :

```bash
# Configurées automatiquement
DATABASE_URL="postgresql://..."     # PostgreSQL Heroku
SECRET_KEY="clé-sécurisée"         # Générée automatiquement
DEBUG=False                        # Production
ALLOWED_HOSTS="app.herokuapp.com"   # Domaine Heroku

# Configuration Django
DJANGO_SETTINGS_MODULE="linguaromana_backend.settings"
WEB_CONCURRENCY=3                  # Nombre de workers
```

---

## 🔄 **Processus de Déploiement Automatique**

### **1. Déploiement Production (branche `main`)**

```bash
git push origin main
```

**Pipeline automatique :**
1. ✅ **Validation** → Tests de format
2. ✅ **Tests** → Tests complets + couverture
3. ✅ **Sécurité** → Scan des vulnérabilités
4. 🚀 **Déploiement** → Push vers Heroku
5. 📊 **Vérifications** → Health checks
6. 📱 **Notifications** → Slack/Email

### **2. Déploiement Staging (branche `develop`)**

```bash
git push origin develop
```

**Pipeline automatique :**
1. ✅ **Tests rapides**
2. 🧪 **Déploiement staging**
3. 📊 **Vérifications**

---

## 🛠️ **Commandes Utiles**

### **Monitoring**

```bash
# Voir les logs en temps réel
heroku logs --tail -a mon-linguaromana-app

# État de l'application
heroku ps -a mon-linguaromana-app

# Ouvrir l'application
heroku open -a mon-linguaromana-app
```

### **Base de données**

```bash
# Accès à la base de données
heroku pg:psql -a mon-linguaromana-app

# Backup de la DB
heroku pg:backups:capture -a mon-linguaromana-app

# Migrations manuelles
heroku run python backend/manage.py migrate -a mon-linguaromana-app
```

### **Django Admin**

```bash
# Créer un superuser
heroku run python backend/manage.py createsuperuser -a mon-linguaromana-app

# Shell Django
heroku run python backend/manage.py shell -a mon-linguaromana-app
```

---

## 🚨 **Troubleshooting**

### **Problème : App crash au démarrage**

```bash
# 1. Vérifier les logs
heroku logs --tail -a mon-linguaromana-app

# 2. Vérifier les variables
heroku config -a mon-linguaromana-app

# 3. Redémarrer l'app
heroku restart -a mon-linguaromana-app
```

### **Problème : Base de données**

```bash
# Vérifier la connexion DB
heroku pg:info -a mon-linguaromana-app

# Reset de la DB (ATTENTION : perte de données)
heroku pg:reset DATABASE_URL -a mon-linguaromana-app --confirm mon-linguaromana-app
heroku run python backend/manage.py migrate -a mon-linguaromana-app
```

### **Problème : Fichiers statiques**

```bash
# Recollect des fichiers statiques
heroku run python backend/manage.py collectstatic --noinput -a mon-linguaromana-app
```

---

## 📊 **URLs importantes**

```bash
# Application principale
https://mon-linguaromana-app.herokuapp.com

# Interface admin
https://mon-linguaromana-app.herokuapp.com/admin

# API
https://mon-linguaromana-app.herokuapp.com/api/latest-comprehensive-article/

# Dashboard Heroku
https://dashboard.heroku.com/apps/mon-linguaromana-app
```

---

## 🔐 **Sécurité**

### **Variables sensibles**

- ✅ `SECRET_KEY` générée automatiquement
- ✅ `DATABASE_URL` fournie par Heroku
- ✅ HTTPS forcé en production
- ✅ Headers de sécurité activés

### **Accès admin par défaut**

```bash
Username: admin
Password: linguaromana2024
```

**🔒 IMPORTANT :** Changez le mot de passe admin après le premier déploiement !

---

## 🎛️ **Configuration Avancée**

### **Scaling**

```bash
# Augmenter les dynos
heroku ps:scale web=2 -a mon-linguaromana-app

# Upgrader la base de données
heroku addons:upgrade heroku-postgresql:standard-0 -a mon-linguaromana-app
```

### **Domaine personnalisé**

```bash
# Ajouter un domaine
heroku domains:add www.monsite.com -a mon-linguaromana-app

# Certificat SSL
heroku certs:auto:enable -a mon-linguaromana-app
```

### **Variables personnalisées**

```bash
# Ajouter des variables
heroku config:set MA_VARIABLE=valeur -a mon-linguaromana-app
```

---

## 🎉 **Résultat Final**

Après configuration :

1. **Push sur `main`** → Déploiement automatique en production
2. **Push sur `develop`** → Déploiement automatique en staging
3. **Tests automatiques** → Blocage si échec
4. **Notifications** → Slack/Email du statut
5. **Monitoring** → Logs et métriques Heroku

---

## 📞 **Support**

### **Documentation Heroku**
- [Getting Started with Django](https://devcenter.heroku.com/articles/getting-started-with-python)
- [Django and Static Assets](https://devcenter.heroku.com/articles/django-assets)

### **Commandes de diagnostic**

```bash
# État complet de l'app
heroku status
heroku ps -a mon-linguaromana-app
heroku pg:info -a mon-linguaromana-app

# Tests locaux
python backend/manage.py check --deploy
python run_deployment_tests.py
```

---

## 🚀 **Démarrage Rapide**

```bash
# 1. Configuration automatique
./scripts/setup_heroku.sh mon-linguaromana-app

# 2. Configuration GitLab Variables
# Ajouter HEROKU_API_KEY et HEROKU_APP_NAME

# 3. Push pour déployer
git push origin main

# 4. Vérifier le déploiement
heroku open -a mon-linguaromana-app
```

**🎉 Votre application est maintenant déployée automatiquement !**

