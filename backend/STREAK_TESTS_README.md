# 🔥 Système de Flammes (Streak) - Tests Django

Ce document décrit le système de tests pour les flammes/streaks dans LinguaRomana.

## 📋 Règles du Système de Flammes

### ✅ Règles Implémentées

1. **Une personne ayant une flamme aura deux flammes s'il fait l'activité le jour suivant**
   - Un utilisateur avec 1 flamme qui fait un quiz le jour suivant aura 2 flammes
   - La continuité quotidienne est récompensée

2. **Une personne ayant une flamme n'en aura pas deux s'il fait deux activités le même jour**
   - Faire plusieurs quiz le même jour ne multiplie pas les flammes
   - Une seule flamme par jour maximum

3. **Règles additionnelles**
   - Le streak se remet à 1 si l'utilisateur rate un jour
   - Le premier quiz de l'utilisateur démarre le streak à 1
   - Les activités consécutives incrémentent le streak correctement

## 🧪 Tests Implémentés

### Tests Principaux (`StreakSystemTestCase`)

1. `test_user_with_one_flame_gets_two_flames_next_day`
   - Vérifie la règle : 1 flamme → activité jour suivant → 2 flammes

2. `test_user_with_one_flame_no_two_flames_same_day`
   - Vérifie la règle : 1 flamme + 2 activités même jour = toujours 1 flamme

3. `test_streak_resets_after_missing_day`
   - Vérifie que le streak se remet à 1 après un jour manqué

4. `test_first_activity_starts_streak_at_one`
   - Vérifie que la première activité démarre le streak à 1

5. `test_consecutive_days_increment_streak`
   - Vérifie l'incrémentation correcte sur plusieurs jours consécutifs

6. `test_multiple_activities_same_day_only_counts_once`
   - Vérifie que plusieurs activités le même jour ne comptent qu'une fois

### Tests d'Intégration (`StreakIntegrationTestCase`)

1. `test_quiz_submission_updates_streak`
   - Vérifie l'intégration avec la soumission de quiz

## 🚀 Comment Lancer les Tests

### Option 1 : Script dédié
```bash
cd backend
python run_streak_tests.py
```

### Option 2 : Commande Django standard
```bash
cd backend
python manage.py test authentication.test_streak
```

### Option 3 : Tests spécifiques
```bash
# Test une classe spécifique
python manage.py test authentication.test_streak.StreakSystemTestCase

# Test une méthode spécifique
python manage.py test authentication.test_streak.StreakSystemTestCase.test_user_with_one_flame_gets_two_flames_next_day
```

### Option 4 : Tous les tests de l'app
```bash
python manage.py test authentication
```

## 📁 Structure des Fichiers

```
backend/
├── authentication/
│   ├── models.py                 # Modèles UserProfile, UserActivity
│   ├── utils.py                  # Logique de gestion des streaks
│   ├── views.py                  # Intégration des streaks dans les vues
│   ├── test_streak.py           # Tests complets du système de flammes
│   └── tests.py                 # Import des tests de streak
├── run_streak_tests.py          # Script pour lancer les tests
└── STREAK_TESTS_README.md       # Cette documentation
```

## 🔧 Fonctions Utilitaires

### `update_user_streak(user, activity_date=None)`
```python
from authentication.utils import update_user_streak

# Met à jour le streak d'un utilisateur pour une date donnée
result = update_user_streak(user)
print(result)
# {'streak_updated': True, 'current_streak': 2, 'activity_date': date.today()}
```

### `reset_user_streak(user)`
```python
from authentication.utils import reset_user_streak

# Remet le streak à 0
result = reset_user_streak(user)
print(result)
# {'streak_reset': True, 'current_streak': 0}
```

### `get_user_streak_info(user)`
```python
from authentication.utils import get_user_streak_info

# Récupère les informations de streak
info = get_user_streak_info(user)
print(info)
# {'current_streak': 3, 'last_activity_date': date.today(), 'total_points': 150}
```

## 🎯 Exemples de Cas d'Usage

### Scénario 1 : Utilisateur Régulier
```python
# Jour 1 : Premier quiz
update_user_streak(user, date(2025, 1, 1))  # streak = 1

# Jour 2 : Quiz le jour suivant
update_user_streak(user, date(2025, 1, 2))  # streak = 2

# Jour 2 : Deuxième quiz le même jour
update_user_streak(user, date(2025, 1, 2))  # streak = 2 (pas d'incrément)
```

### Scénario 2 : Utilisateur qui Rate un Jour
```python
# Jour 1 : Quiz
update_user_streak(user, date(2025, 1, 1))  # streak = 1

# Jour 3 : Quiz (jour 2 raté)
update_user_streak(user, date(2025, 1, 3))  # streak = 1 (reset)
```

## 🔍 Vérification Manuelle

Pour vérifier manuellement le système :

```python
# Dans le shell Django (python manage.py shell)
from django.contrib.auth.models import User
from authentication.utils import *
from datetime import date, timedelta

# Créer un utilisateur test
user = User.objects.create_user('testuser', 'test@example.com', 'password')

# Tester les scénarios
result = update_user_streak(user)
print(f"Premier quiz: {result}")

result = update_user_streak(user)
print(f"Deuxième quiz même jour: {result}")

# Quiz jour suivant
tomorrow = date.today() + timedelta(days=1)
result = update_user_streak(user, tomorrow)
print(f"Quiz jour suivant: {result}")
```

## ✅ Résultats Attendus

Après avoir lancé les tests, vous devriez voir :

```
🔥 Running LinguaRomana Streak System Tests...
==================================================
..........
----------------------------------------------------------------------
Ran 10 tests in 0.XXXs

OK

✅ All streak tests passed!

Rules verified:
✅ User with 1 flame gets 2 flames if they do activity next day
✅ User with 1 flame does NOT get 2 flames for multiple activities same day
✅ Streak resets properly when missing days
✅ Integration with quiz submission works correctly
```

## 🐛 Débogage

Si les tests échouent :

1. **Vérifiez la base de données** : `python manage.py migrate`
2. **Vérifiez les imports** : Assurez-vous que tous les modules sont importés
3. **Vérifiez les dates** : Les tests utilisent des dates relatives à `date.today()`
4. **Logs détaillés** : Lancez avec `python manage.py test --verbosity=2`

## 🔄 Intégration Continue

Ces tests peuvent être intégrés dans votre pipeline CI/CD :

```yaml
# .github/workflows/test.yml
- name: Run Streak Tests
  run: |
    cd backend
    python manage.py test authentication.test_streak
```
