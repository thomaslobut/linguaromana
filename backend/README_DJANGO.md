# 🌟 LinguaRomana - Backend Django avec Authentification

Système d'authentification Django pour l'application d'apprentissage des langues romanes.

## 🚀 Installation et Configuration

### 1. Prérequis
- Python 3.8+
- pip (gestionnaire de paquets Python)

### 2. Installation

```bash
# Aller dans le dossier backend
cd backend

# Créer et activer l'environnement virtuel
python3 -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Effectuer les migrations
python manage.py makemigrations
python manage.py migrate

# Créer les données initiales (articles, questions, utilisateurs de démo)
python manage.py setup_initial_data

# Créer un superutilisateur pour l'admin (optionnel)
python manage.py createsuperuser

# Lancer le serveur de développement
python manage.py runserver
```

### 3. Accès à l'application

- **Application principale**: http://127.0.0.1:8000/
- **Interface d'administration**: http://127.0.0.1:8000/admin/
- **Page de connexion**: http://127.0.0.1:8000/login/
- **Page d'inscription**: http://127.0.0.1:8000/register/

### 4. Utilisateurs de démonstration

Créés automatiquement par la commande `setup_initial_data`:

- **Utilisateur**: `demo` / **Mot de passe**: `demo123`
- **Utilisateur**: `testuser` / **Mot de passe**: `test123`

## 🏗️ Architecture

### Structure des dossiers
```
backend/
├── linguaromana_backend/     # Configuration principale Django
├── authentication/           # Application d'authentification
│   ├── models.py            # Modèles de données
│   ├── views.py             # Vues et API endpoints
│   ├── admin.py             # Configuration admin
│   └── management/          # Commandes personnalisées
├── templates/               # Templates HTML
└── static/                  # Fichiers statiques (CSS, JS)
```

### Modèles de données

#### UserProfile
- Extension du modèle User de Django
- Langue préférée, streak, points, niveau
- Suivi de l'activité utilisateur

#### Article
- Articles d'actualité pour l'apprentissage
- Support multi-langues (es, it, pt, ca, fr)
- Niveaux de difficulté

#### QuizQuestion
- Questions de quiz liées aux articles
- Système de points configurable

#### UserQuizResult
- Résultats des quiz des utilisateurs
- Suivi des scores et temps passé

#### UserActivity
- Activité quotidienne des utilisateurs
- Calcul des streaks et progression

## 🔌 API Endpoints

### Authentification
- `POST /api/login/` - Connexion utilisateur
- `POST /api/register/` - Inscription utilisateur
- `POST /api/logout/` - Déconnexion
- `GET /api/profile/` - Profil utilisateur

### Données utilisateur
- `POST /api/submit-quiz/` - Soumettre résultats quiz
- `GET /api/stats/` - Statistiques utilisateur

### Exemple d'utilisation API

```javascript
// Connexion
const loginResponse = await fetch('/api/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        username: 'demo',
        password: 'demo123'
    }),
    credentials: 'include'
});

// Soumettre quiz
const quizResponse = await fetch('/api/submit-quiz/', {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
    },
    body: JSON.stringify({
        article_id: 1,
        score: 80,
        points_earned: 30,
        time_spent: 120
    }),
    credentials: 'include'
});
```

## 🎮 Fonctionnalités

### Système de gamification
- **Points**: Gagnés lors des quiz réussis
- **Streaks**: Séries de jours consécutifs d'activité
- **Niveaux**: Progression basée sur les points totaux
- **Suivi temporal**: Historique de l'activité quotidienne

### Authentification
- Inscription/connexion sécurisée
- Sessions Django
- Protection CSRF
- Support multi-langues

### Interface d'administration
- Gestion des utilisateurs et profils
- Création/modification d'articles
- Gestion des questions de quiz
- Statistiques et rapports

## 🛠️ Développement

### Ajouter un nouvel article

```python
from authentication.models import Article, QuizQuestion
from datetime import date

# Créer l'article
article = Article.objects.create(
    title="Titre de l'article",
    content="Contenu de l'article...",
    language="es",
    level="intermediate",
    publication_date=date.today()
)

# Ajouter des questions
QuizQuestion.objects.create(
    article=article,
    question_text="Question ?",
    option_a="Option A",
    option_b="Option B", 
    option_c="Option C",
    option_d="Option D",
    correct_option="B",
    points=10
)
```

### Personnaliser les langues

Modifier les choix dans `models.py`:

```python
LANGUAGE_CHOICES = [
    ('es', 'Español'),
    ('it', 'Italiano'),
    ('pt', 'Português'),
    ('ca', 'Català'),
    ('fr', 'Français'),
    ('ro', 'Română'),  # Nouvelle langue
]
```

## 🚀 Déploiement

### Variables d'environnement pour la production

```bash
export DEBUG=False
export SECRET_KEY="your-secret-key"
export ALLOWED_HOSTS="yourdomain.com"
export DATABASE_URL="your-database-url"
```

### Collecte des fichiers statiques

```bash
python manage.py collectstatic
```

## 🔧 Dépannage

### Problèmes courants

1. **Erreur CORS**: Vérifier `CORS_ALLOW_ALL_ORIGINS` dans settings.py
2. **CSRF Failed**: S'assurer que le token CSRF est inclus dans les requêtes
3. **Static files**: Vérifier que les fichiers sont dans le dossier `static/`

### Logs et débogage

```bash
# Activer le mode debug dans settings.py
DEBUG = True

# Voir les logs SQL
# Dans settings.py, ajouter:
LOGGING = {
    'version': 1,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

## 📈 Prochaines étapes

- [ ] API REST complète avec Django REST Framework
- [ ] Tests automatisés (unittest/pytest)
- [ ] Système de notifications
- [ ] Intégration avec services externes (news APIs)
- [ ] Cache Redis pour les performances
- [ ] Déploiement Docker

---

**Développé avec ❤️ pour l'apprentissage des langues romanes**








