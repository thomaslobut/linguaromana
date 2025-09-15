# 🚀 LinguaRomana - Pipeline de Déploiement

## 📋 Vue d'ensemble

LinguaRomana utilise une pipeline de déploiement automatique avec GitHub Actions qui garantit que tous les tests passent avant chaque déploiement, particulièrement le système critique de flammes (streak).

## 🔄 Workflow de Déploiement

### 1. 🧪 Tests Backend Django

```yaml
backend-tests:
  - Setup Python 3.11
  - Installation des dépendances Django
  - Migrations de base de données
  - ⭐ Tests du système de flammes (priorité)
  - Tests Django complets
```

**Tests Critiques du Système de Flammes :**
- ✅ Règle 1 : Une flamme → activité jour suivant → deux flammes
- ✅ Règle 2 : Une flamme + 2 activités même jour = toujours une flamme
- ✅ Reset de streak après jour manqué
- ✅ Intégration avec soumission de quiz

### 2. 🌐 Validation Frontend

```yaml
frontend-validation:
  - Validation syntaxe HTML
  - Vérification syntaxe JavaScript
  - Tests de base des fonctionnalités
```

### 3. 🚀 Déploiement GitHub Pages

```yaml
deploy:
  needs: [backend-tests, frontend-validation]
  - Déploiement uniquement si TOUS les tests passent
  - Publication sur GitHub Pages
  - URL: https://thomaslobut.github.io/linguaromana/
```

### 4. 📢 Notifications

```yaml
notify:
  - Rapport de statut du déploiement
  - Résumé des tests exécutés
  - Confirmation de mise en ligne
```

## 🎯 Déclencheurs de Pipeline

### Push sur `main`
- ✅ Tests complets
- ✅ Déploiement automatique si tests OK
- ✅ Site mis à jour en ligne

### Pull Request
- ✅ Tests de validation uniquement (pre-commit.yml)
- ✅ Pas de déploiement
- ✅ Vérification rapide des règles critiques

### Push sur `develop`
- ✅ Tests complets
- ❌ Pas de déploiement
- ✅ Validation pour développement

## 🛠️ Fichiers de Configuration

```
.github/workflows/
├── ci-cd.yml           # Pipeline principale
└── pre-commit.yml      # Validation rapide PR

scripts/
└── test-before-deploy.sh  # Script local de validation

backend/
├── run_streak_tests.py    # Tests de flammes
├── run_all_tests.py       # Tests complets
└── (dépendances gérées par Poetry via pyproject.toml)
```

## 🔍 Tests Exécutés dans la Pipeline

### Tests de Streak (Critiques)
```bash
# Tests des règles principales
python manage.py test core.test_streak.StreakSystemTestCase.test_user_with_one_flame_gets_two_flames_next_day
python manage.py test core.test_streak.StreakSystemTestCase.test_user_with_one_flame_no_two_flames_same_day

# Tests complets (10 tests)
python run_streak_tests.py
```

### Tests Django Complets
```bash
# Tous les tests de l'app authentication
python manage.py test authentication

# Avec migrations et setup
python run_all_tests.py
```

### Validation Code
```bash
# Syntaxe Python
python -m py_compile authentication/*.py

# Syntaxe JavaScript  
node -c script.js
```

## 🚨 Gestion des Échecs

### Si Tests de Streak Échouent
```
❌ ÉCHEC: Pipeline arrêtée
🛑 Déploiement bloqué
📧 Notification d'échec
```

**Actions requises :**
1. Corriger les tests de streak
2. Valider localement avec `./scripts/test-before-deploy.sh`
3. Pousser la correction

### Si Tests Django Échouent
```
❌ ÉCHEC: Pipeline arrêtée  
🛑 Déploiement bloqué
📧 Notification d'échec
```

### Si Validation Frontend Échoue
```
❌ ÉCHEC: Pipeline arrêtée
🛑 Déploiement bloqué
📧 Notification d'échec
```

## 🎉 Déploiement Réussi

Quand tous les tests passent :

```
✅ Backend tests: PASSED
✅ Frontend validation: PASSED
✅ Streak system: VERIFIED
🚀 Deployment: SUCCESS
🌐 Site URL: https://thomaslobut.github.io/linguaromana/
```

## 🛠️ Développement Local

### Avant de Pousser du Code

```bash
# Script automatique recommandé (utilise Poetry)
./scripts/test-before-deploy.sh

# Ou étapes manuelles avec Poetry :
poetry install --only=main
cd backend
poetry run python run_streak_tests.py
poetry run python manage.py test authentication
cd .. && node -c script.js
```

### Workflow Recommandé

1. **Développer** une fonctionnalité
2. **Tester localement** avec le script
3. **Commit & Push** sur une branche
4. **Créer une PR** → Tests automatiques
5. **Merger sur main** → Déploiement automatique

## 🔧 Configuration Avancée

### Variables d'Environnement

```yaml
# Dans GitHub Actions
CI: true                          # Mode CI pour tests
DJANGO_SETTINGS_MODULE: settings  # Configuration Django
```

### Permissions GitHub

```yaml
permissions:
  contents: read     # Lecture du code
  pages: write      # Écriture GitHub Pages  
  id-token: write   # Authentification
```

## 📊 Monitoring et Badges

### Badge de Statut

```markdown
![Tests](https://github.com/thomaslobut/linguaromana/workflows/🚀%20LinguaRomana%20CI/CD%20Pipeline/badge.svg)
```

### Logs et Monitoring

- **GitHub Actions** : Logs détaillés de chaque étape
- **Tests Results** : Rapport de tous les tests exécutés
- **Deployment Status** : Confirmation de mise en ligne

## 🚀 Résultats

Cette pipeline garantit que :

1. **Aucune régression** du système de flammes
2. **Code de qualité** avant déploiement
3. **Site toujours fonctionnel** en production
4. **Déploiement automatique** sans intervention manuelle
5. **Feedback immédiat** sur les erreurs

## 🎯 Prochaines Améliorations

- [ ] Tests d'intégration frontend/backend
- [ ] Tests de performance
- [ ] Tests d'accessibilité
- [ ] Déploiement multi-environnement (staging/prod)
- [ ] Rollback automatique en cas d'erreur

---

**🌟 La pipeline assure que votre système de flammes fonctionne parfaitement à chaque déploiement !**
