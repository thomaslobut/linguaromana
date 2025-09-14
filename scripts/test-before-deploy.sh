#!/bin/bash

# 🔥 LinguaRomana - Test Before Deploy Script
# Exécute tous les tests avant un déploiement local ou une poussée Git

set -e  # Exit on any error

echo "🌟 LinguaRomana - Test Before Deploy"
echo "======================================"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher des messages colorés
print_status() {
    echo -e "${BLUE}🔍 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier si on est dans le bon répertoire
if [ ! -f "index.html" ] || [ ! -d "backend" ]; then
    print_error "Exécutez ce script depuis la racine du projet LinguaRomana"
    exit 1
fi

print_status "Vérification de l'environnement..."

# Vérifier Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 n'est pas installé"
    exit 1
fi

# Vérifier Poetry
if ! command -v poetry &> /dev/null; then
    print_error "Poetry n'est pas installé. Installez-le avec: curl -sSL https://install.python-poetry.org | python3 -"
    exit 1
fi

print_success "Python 3 et Poetry détectés"

# Vérifier l'environnement Poetry (depuis la racine du projet)
print_status "Configuration de l'environnement Poetry..."
if [ ! -f "poetry.lock" ]; then
    print_warning "Fichier poetry.lock non trouvé. Installation initiale..."
    poetry install --only=main
    print_success "Poetry.lock généré et dépendances installées"
else
    print_status "Installation des dépendances avec Poetry..."
    poetry install --only=main
    print_success "Dépendances installées avec Poetry"
fi

print_status "Exécution des tests depuis la racine avec Poetry..."

# Vérifier les migrations
print_status "Vérification des migrations Django..."
poetry run python backend/manage.py makemigrations --check --dry-run > /dev/null 2>&1 || {
    print_warning "Nouvelles migrations détectées. Création..."
    poetry run python backend/manage.py makemigrations
}

poetry run python backend/manage.py migrate > /dev/null 2>&1
print_success "Base de données à jour"

# Tests de syntax
print_status "Vérification de la syntaxe Python..."
poetry run python -m py_compile backend/authentication/utils.py
poetry run python -m py_compile backend/authentication/test_streak.py
poetry run python -m py_compile backend/authentication/views.py
print_success "Syntaxe Python validée"

# Tests de streak system (critiques)
print_status "Exécution des tests critiques du système de flammes..."
echo ""

# Test de la règle principale 1
if poetry run python backend/manage.py test authentication.test_streak.StreakSystemTestCase.test_user_with_one_flame_gets_two_flames_next_day --verbosity=0 > /dev/null 2>&1; then
    print_success "Règle 1: Flamme +1 jour suivant ✓"
else
    print_error "Règle 1: ÉCHEC - Flamme +1 jour suivant"
    exit 1
fi

# Test de la règle principale 2  
if poetry run python backend/manage.py test authentication.test_streak.StreakSystemTestCase.test_user_with_one_flame_no_two_flames_same_day --verbosity=0 > /dev/null 2>&1; then
    print_success "Règle 2: Pas de double flamme même jour ✓"
else
    print_error "Règle 2: ÉCHEC - Pas de double flamme même jour"
    exit 1
fi

# Tests complets de streak
print_status "Exécution de tous les tests de flammes..."
if poetry run python backend/run_streak_tests.py > /dev/null 2>&1; then
    print_success "Tous les tests de flammes passent ✓"
else
    print_error "Certains tests de flammes échouent"
    echo ""
    print_warning "Exécution avec détails:"
    poetry run python backend/run_streak_tests.py
    exit 1
fi

# Tests Django complets
print_status "Exécution de tous les tests Django..."
if poetry run python backend/manage.py test authentication --verbosity=0 > /dev/null 2>&1; then
    print_success "Tous les tests Django passent ✓"
else
    print_error "Certains tests Django échouent"
    echo ""
    print_warning "Exécution avec détails:"
    poetry run python backend/manage.py test authentication --verbosity=2
    exit 1
fi

# Validation frontend basique
print_status "Validation frontend basique..."

# Vérifier la syntaxe JavaScript
if command -v node &> /dev/null; then
    if node -c script.js > /dev/null 2>&1; then
        print_success "Syntaxe JavaScript validée ✓"
    else
        print_error "Erreur de syntaxe JavaScript"
        exit 1
    fi
else
    print_warning "Node.js non installé - validation JavaScript ignorée"
fi

# Vérifier les fichiers essentiels
essential_files=("index.html" "script.js" "styles.css" "README.md")
for file in "${essential_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "Fichier $file présent ✓"
    else
        print_error "Fichier manquant: $file"
        exit 1
    fi
done

# Résumé final
echo ""
echo "============================================"
print_success "🎉 TOUS LES TESTS SONT PASSÉS !"
echo "============================================"
echo ""
echo "✅ Backend Django: Validé"
echo "✅ Système de flammes: Validé"  
echo "✅ Frontend: Validé"
echo "✅ Fichiers essentiels: Présents"
echo ""
print_success "🚀 Prêt pour le déploiement !"
echo ""
echo "Commandes suggérées pour déployer:"
echo "  git add ."
echo "  git commit -m \"🚀 Ready for deployment - all tests pass\""
echo "  git push origin main"
echo ""

# Proposer de pousser automatiquement
read -p "Voulez-vous pousser vers Git maintenant ? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Préparation du commit..."
    git add .
    git commit -m "🚀 Deploy: All tests pass - $(date '+%Y-%m-%d %H:%M')"
    git push origin main
    print_success "Code poussé vers GitHub ! 🎉"
    print_status "La pipeline de déploiement va s'exécuter automatiquement"
else
    print_warning "N'oubliez pas de pousser votre code quand vous êtes prêt !"
fi
