#!/bin/bash
# ============================================
# 🔍 VÉRIFICATION DÉPLOIEMENT HEROKU
# ============================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 === VÉRIFICATION DÉPLOIEMENT HEROKU ====${NC}"
echo -e "${BLUE}==========================================${NC}"

ERRORS=0
WARNINGS=0

check_error() {
    ERRORS=$((ERRORS + 1))
    echo -e "${RED}❌ $1${NC}"
}

check_warning() {
    WARNINGS=$((WARNINGS + 1))
    echo -e "${YELLOW}⚠️  $1${NC}"
}

check_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 1. Vérifier les fichiers requis
echo -e "\n${BLUE}📋 Vérification des fichiers requis...${NC}"

if [ -f "Dockerfile" ]; then
    check_success "Dockerfile présent"
else
    check_error "Dockerfile manquant"
fi

if [ -f "Procfile" ]; then
    check_success "Procfile présent"
else
    check_error "Procfile manquant"
fi

if [ -f "runtime.txt" ]; then
    check_success "runtime.txt présent"
else
    check_error "runtime.txt manquant"
fi

if [ -f "backend/requirements.txt" ]; then
    check_success "requirements.txt présent"
    
    # Vérifier les dépendances Heroku
    if grep -q "gunicorn" backend/requirements.txt; then
        check_success "gunicorn dans requirements.txt"
    else
        check_error "gunicorn manquant dans requirements.txt"
    fi
    
    if grep -q "psycopg2-binary" backend/requirements.txt; then
        check_success "psycopg2-binary dans requirements.txt"
    else
        check_error "psycopg2-binary manquant dans requirements.txt"
    fi
    
    if grep -q "whitenoise" backend/requirements.txt; then
        check_success "whitenoise dans requirements.txt"
    else
        check_error "whitenoise manquant dans requirements.txt"
    fi
    
    if grep -q "dj-database-url" backend/requirements.txt; then
        check_success "dj-database-url dans requirements.txt"
    else
        check_error "dj-database-url manquant dans requirements.txt"
    fi
else
    check_error "requirements.txt manquant"
fi

# 2. Vérifier la configuration Django
echo -e "\n${BLUE}⚙️  Vérification configuration Django...${NC}"

if [ -f "backend/linguaromana_backend/settings.py" ]; then
    check_success "settings.py présent"
    
    # Vérifier les imports Heroku
    if grep -q "import dj_database_url" backend/linguaromana_backend/settings.py; then
        check_success "dj_database_url importé"
    else
        check_error "dj_database_url non importé dans settings.py"
    fi
    
    if grep -q "whitenoise" backend/linguaromana_backend/settings.py; then
        check_success "WhiteNoise configuré"
    else
        check_error "WhiteNoise non configuré dans settings.py"
    fi
    
    if grep -q "ALLOWED_HOSTS.*herokuapp" backend/linguaromana_backend/settings.py; then
        check_success "ALLOWED_HOSTS configuré pour Heroku"
    else
        check_warning "ALLOWED_HOSTS peut ne pas inclure Heroku"
    fi
else
    check_error "settings.py manquant"
fi

# 3. Vérifier GitLab CI
echo -e "\n${BLUE}🔄 Vérification GitLab CI...${NC}"

if [ -f ".gitlab-ci.yml" ]; then
    check_success ".gitlab-ci.yml présent"
    
    if grep -q "Deploy Heroku" .gitlab-ci.yml; then
        check_success "Job de déploiement Heroku configuré"
    else
        check_error "Job de déploiement Heroku manquant"
    fi
    
    if grep -q "HEROKU_API_KEY" .gitlab-ci.yml; then
        check_success "Variable HEROKU_API_KEY référencée"
    else
        check_error "Variable HEROKU_API_KEY non référencée"
    fi
    
    if grep -q "HEROKU_APP_NAME" .gitlab-ci.yml; then
        check_success "Variable HEROKU_APP_NAME référencée"
    else
        check_error "Variable HEROKU_APP_NAME non référencée"
    fi
else
    check_error ".gitlab-ci.yml manquant"
fi

# 4. Vérifier les scripts
echo -e "\n${BLUE}📜 Vérification des scripts...${NC}"

if [ -f "scripts/setup_heroku.sh" ]; then
    if [ -x "scripts/setup_heroku.sh" ]; then
        check_success "setup_heroku.sh présent et exécutable"
    else
        check_warning "setup_heroku.sh présent mais pas exécutable"
    fi
else
    check_error "setup_heroku.sh manquant"
fi

if [ -f "scripts/deploy.sh" ]; then
    if [ -x "scripts/deploy.sh" ]; then
        check_success "deploy.sh présent et exécutable"
    else
        check_warning "deploy.sh présent mais pas exécutable"
    fi
else
    check_warning "deploy.sh manquant (optionnel)"
fi

# 5. Vérifier la documentation
echo -e "\n${BLUE}📚 Vérification documentation...${NC}"

if [ -f "HEROKU_DEPLOYMENT_GUIDE.md" ]; then
    check_success "Guide de déploiement présent"
else
    check_warning "Guide de déploiement manquant"
fi

# 6. Vérifier les outils requis
echo -e "\n${BLUE}🛠️  Vérification des outils...${NC}"

if command -v heroku &> /dev/null; then
    check_success "Heroku CLI installé"
    
    # Vérifier la connexion
    if heroku auth:whoami &> /dev/null; then
        HEROKU_USER=$(heroku auth:whoami)
        check_success "Connecté à Heroku ($HEROKU_USER)"
    else
        check_warning "Non connecté à Heroku (utilisez: heroku auth:login)"
    fi
else
    check_error "Heroku CLI non installé"
fi

if command -v git &> /dev/null; then
    check_success "Git installé"
else
    check_error "Git non installé"
fi

if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    check_success "$PYTHON_VERSION installé"
else
    check_error "Python 3 non installé"
fi

# 7. Test des dépendances Python
echo -e "\n${BLUE}🐍 Test des dépendances Python...${NC}"

if [ -d "backend/venv" ]; then
    check_info "Environnement virtuel détecté"
else
    check_warning "Aucun environnement virtuel détecté"
fi

# Test d'installation des dépendances
check_info "Test d'installation des dépendances..."
cd backend
if python3 -m pip install -r requirements.txt --dry-run &> /dev/null; then
    check_success "Toutes les dépendances peuvent être installées"
else
    check_warning "Problème potentiel avec les dépendances"
fi
cd ..

# 8. Résumé final
echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}📊 RÉSUMÉ DE LA VÉRIFICATION${NC}"
echo -e "${BLUE}=========================================${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 PARFAIT ! Tout est prêt pour le déploiement Heroku${NC}"
    echo -e "${GREEN}✅ 0 erreur, 0 avertissement${NC}"
    echo -e "\n${BLUE}🚀 Prochaines étapes :${NC}"
    echo -e "${BLUE}1. ./scripts/setup_heroku.sh nom-de-votre-app${NC}"
    echo -e "${BLUE}2. Configurer les variables GitLab CI/CD${NC}"
    echo -e "${BLUE}3. git push origin main${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  PRESQUE PRÊT ! ${WARNINGS} avertissement(s)${NC}"
    echo -e "${GREEN}✅ 0 erreur${NC}"
    echo -e "${YELLOW}⚠️  ${WARNINGS} avertissement(s) à vérifier${NC}"
    echo -e "\n${YELLOW}Le déploiement devrait fonctionner mais vérifiez les avertissements${NC}"
    exit 0
else
    echo -e "${RED}❌ PAS PRÊT ! ${ERRORS} erreur(s), ${WARNINGS} avertissement(s)${NC}"
    echo -e "${RED}❌ ${ERRORS} erreur(s) à corriger${NC}"
    echo -e "${YELLOW}⚠️  ${WARNINGS} avertissement(s) à vérifier${NC}"
    echo -e "\n${RED}Corrigez les erreurs avant de déployer${NC}"
    exit 1
fi

