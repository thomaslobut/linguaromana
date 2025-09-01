# 🌟 LinguaRomana - MVP

Un site d'apprentissage des langues romanes (espagnol, italien, portugais, catalan, français) qui propose chaque jour un article d'actualité simplifié et traduit.

## 🚀 Fonctionnalités

### ✨ Caractéristiques principales

- **Articles d'actualité simplifiés** : Contenu adapté pour l'apprentissage des langues
- **Mots-clés interactifs** : Cliquez sur les mots surlignés pour voir les traductions dans les 5 langues romanes
- **Notes grammaticales** : Explications contextuelles pour chaque mot-clé
- **Quiz de compréhension** : Testez votre compréhension avec des QCM interactifs
- **Système de gamification** : Gagnez des points et maintenez votre série quotidienne (flammes)
- **Interface moderne** : Design responsive inspiré des meilleures applications d'apprentissage

### 🗣️ Langues supportées

- **Espagnol** (Español)
- **Italien** (Italiano)  
- **Portugais** (Português)
- **Catalan** (Català)
- **Français** (Français)

## 📖 Article d'exemple

L'article actuel traite de la **crise humanitaire à Gaza** et des controverses autour des lanzamientos aéreos de ayuda humanitaria. Les mots-clés suivants sont interactifs :

- **engañan** - Traductions disponibles dans les 4 langues
- **devastadora** - Avec note grammaticale sur les adjectifs
- **controversia** - Explication du substantif féminin

## 🎯 Comment utiliser

1. **Ouvrez `index.html`** dans votre navigateur
2. **Lisez l'article** et cliquez sur les mots surlignés en violet
3. **Explorez les traductions** dans les 5 langues romanes (consultation gratuite)
4. **Lisez les notes grammaticales** pour approfondir votre compréhension
5. **Répondez au quiz** pour tester votre compréhension et gagner des points
6. **Maintenez votre série quotidienne** et progressez dans votre apprentissage !

## 🛠️ Structure du projet

```
apprentissage-langues/
├── index.html          # Page principale
├── styles.css          # Styles modernes et responsifs
├── script.js           # Logique interactive et gamification
└── README.md           # Documentation
```

## 🎨 Fonctionnalités techniques

### Interface utilisateur
- **Design moderne** avec gradients et animations fluides
- **Responsive design** optimisé pour mobile et desktop
- **Popups élégants** pour les traductions
- **Animations CSS** pour une expérience utilisateur engageante

### Interactivité
- **Traductions dynamiques** en temps réel
- **Quiz interactif** avec navigation et scoring
- **Système de points** avec animations
- **Raccourcis clavier** (Échap pour fermer, flèches pour naviguer)
- **Effets visuels** (ripples, transitions)

### Gamification
- **Série quotidienne** (streak) avec icône flamme 🔥
- **Points** gagnés uniquement pour les bonnes réponses au quiz (10 pts/réponse, pas de bonus)
- **Consultations gratuites** des traductions (pas de points, apprentissage libre)
- **Animations de récompense** lors du gain de points
- **Interface inspirée de Duolingo**

## 🧪 Tests et Déploiement

### 🔥 Tests du Système de Flammes

Le projet inclut un système complet de tests pour garantir que le système de flammes fonctionne correctement :

```bash
# Tests de streak seulement
cd backend
python run_streak_tests.py

# Tous les tests Django
python manage.py test authentication

# Tests complets avec vérifications
python run_all_tests.py
```

### 🚀 Pipeline de Déploiement Automatique

Le projet utilise GitHub Actions pour :
- ✅ **Tests automatiques** du système de flammes à chaque push
- ✅ **Validation** du code frontend et backend  
- ✅ **Déploiement automatique** sur GitHub Pages si tous les tests passent
- ✅ **Notifications** du statut de déploiement

### 📊 Status des Tests

![Tests](https://github.com/thomaslobut/linguaromana/workflows/🚀%20LinguaRomana%20CI/CD%20Pipeline/badge.svg)

### 🛠️ Développement Local

Avant de pousser votre code, utilisez le script de validation :

```bash
# Script complet de validation
./scripts/test-before-deploy.sh

# Ou manuellement :
cd backend && python run_streak_tests.py
```

## 🔧 Personnalisation

### Ajouter de nouveaux mots-clés

Dans `script.js`, ajoutez des entrées dans l'objet `translations` :

```javascript
const translations = {
    "nouveau_mot": {
        es: "translation en español",
        it: "traduzione in italiano", 
        pt: "tradução em português",
        ca: "traducció en català",
        grammar: "Note grammaticale explicative"
    }
};
```

### Ajouter de nouvelles questions

Modifiez l'array `quizData` dans `script.js` :

```javascript
const quizData = [
    {
        question: "Votre question ?",
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        correct: 0 // Index de la bonne réponse (0-3)
    }
];
```

## 🔐 Nouvelle fonctionnalité : Authentification Django

Le projet intègre maintenant un système d'authentification complet avec Django !

### 🚀 Lancement de l'application

#### Option 1: Version avec authentification (Django Backend)
```bash
# Aller dans le dossier backend
cd backend

# Activer l'environnement virtuel
source venv/bin/activate

# Lancer le serveur Django
python manage.py runserver
```
Puis accéder à : http://127.0.0.1:8000/

#### Option 2: Version originale (Frontend uniquement)
Ouvrir directement `index.html` dans le navigateur.

### ✨ Nouvelles fonctionnalités

- 🔐 **Inscription et connexion** sécurisées
- 📊 **Sauvegarde des résultats** de quiz en base de données
- 🏆 **Système de points et streaks** persistants
- 👤 **Profils utilisateur** avec langues préférées
- 🎯 **Suivi de progression** détaillé
- 🛡️ **Interface d'administration** Django
- 🆓 **Accès libre aux articles** sans compte obligatoire
- 🎮 **Système de badges** et récompenses
- 💡 **Messages motivationnels** pour encourager l'inscription
- 📈 **Interface adaptative** selon le statut de connexion

### 👥 Comptes de démonstration

- **Utilisateur**: `demo` / **Mot de passe**: `demo123`
- **Utilisateur**: `testuser` / **Mot de passe**: `test123`
- **Admin**: `admin` / **Mot de passe**: `admin123` (Interface d'administration : http://127.0.0.1:8000/admin/)

### 📁 Structure du projet

```
apprentissage-langues/
├── backend/                 # Backend Django avec authentification
│   ├── authentication/     # App d'authentification
│   ├── templates/          # Templates HTML
│   └── requirements.txt    # Dépendances Python
├── static/                 # Fichiers CSS/JS partagés
├── index.html             # Version frontend simple
├── script.js              # Version originale
└── README.md              # Cette documentation
```

## 🚀 Améliorations futures

- ✅ **Système d'authentification** *(Terminé !)*
- ✅ **Base de données** pour stocker le progrès utilisateur *(Terminé !)*
- **Nouveaux articles** automatiquement mis à jour
- **Leaderboards** et compétitions
- **Audio** pour la prononciation
- **Exercices d'écriture** et de grammaire
- **API d'actualités** pour le contenu dynamique
- **Notifications push** pour les streaks
- **Mode hors ligne** avec service workers

## 📱 Compatibilité

- ✅ Chrome, Firefox, Safari, Edge
- ✅ Responsive (mobile, tablette, desktop)
- ✅ Accessible (navigation clavier)
- ✅ Performance optimisée

---

**Développé avec ❤️ pour l'apprentissage des langues romanes**

*Commencez votre voyage linguistique dès aujourd'hui !* 🌟
