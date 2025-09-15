#!/bin/bash
# ============================================
# 🚀 CONFIGURATION AUTOMATIQUE HEROKU
# ============================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 === CONFIGURATION HEROKU LINGUAROMANA ====${NC}"
echo -e "${BLUE}=============================================${NC}"

# Variables
APP_NAME=${1:-linguaromana-$(date +%s)}
REGION=${2:-eu}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier les prérequis
check_requirements() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Heroku CLI
    if ! command -v heroku &> /dev/null; then
        log_error "Heroku CLI n'est pas installé"
        echo "Installez avec: brew install heroku/brew/heroku (macOS)"
        echo "Ou visitez: https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi
    
    # Vérifier Git
    if ! command -v git &> /dev/null; then
        log_error "Git n'est pas installé"
        exit 1
    fi
    
    # Vérifier la connexion Heroku
    if ! heroku auth:whoami &> /dev/null; then
        log_warning "Non connecté à Heroku"
        log_info "Connexion à Heroku..."
        heroku auth:login
    fi
    
    log_success "Prérequis OK"
}

# Créer l'application Heroku
create_heroku_app() {
    log_info "Création de l'application Heroku: $APP_NAME"
    
    # Vérifier si l'app existe déjà
    if heroku apps:info $APP_NAME &> /dev/null; then
        log_warning "L'application $APP_NAME existe déjà"
        read -p "Voulez-vous continuer avec cette app? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Annulé par l'utilisateur"
            exit 0
        fi
    else
        # Créer l'application
        heroku create $APP_NAME --region $REGION
        log_success "Application créée: https://$APP_NAME.herokuapp.com"
    fi
    
    # Ajouter le remote Git
    if ! git remote get-url heroku &> /dev/null; then
        heroku git:remote -a $APP_NAME
        log_success "Remote Git Heroku ajouté"
    fi
}

# Configurer les addons Heroku
setup_addons() {
    log_info "Configuration des addons Heroku..."
    
    # PostgreSQL Database
    log_info "Ajout de PostgreSQL..."
    heroku addons:create heroku-postgresql:essential-0 -a $APP_NAME || \
    heroku addons:create heroku-postgresql:mini -a $APP_NAME || \
    log_warning "PostgreSQL déjà configuré ou erreur"
    
    # Redis (optionnel, pour le cache)
    log_info "Ajout de Redis..."
    heroku addons:create heroku-redis:mini -a $APP_NAME || \
    log_warning "Redis non ajouté (optionnel)"
    
    # Papertrail pour les logs (optionnel)
    log_info "Ajout de Papertrail pour les logs..."
    heroku addons:create papertrail:choklad -a $APP_NAME || \
    log_warning "Papertrail non ajouté (optionnel)"
    
    log_success "Addons configurés"
}

# Configurer les variables d'environnement
setup_environment() {
    log_info "Configuration des variables d'environnement..."
    
    # Générer une clé secrète sécurisée
    SECRET_KEY=$(python3 -c "
import secrets
import string
alphabet = string.ascii_letters + string.digits + '!@#$%^&*(-_=+)'
key = ''.join(secrets.choice(alphabet) for i in range(50))
print(key)
")
    
    # Configurer les variables
    heroku config:set \
        SECRET_KEY="$SECRET_KEY" \
        DEBUG=False \
        ALLOWED_HOSTS="$APP_NAME.herokuapp.com,localhost,127.0.0.1" \
        DJANGO_SETTINGS_MODULE="linguaromana_backend.settings" \
        WEB_CONCURRENCY=3 \
        MAX_REQUESTS=1000 \
        MAX_REQUESTS_JITTER=100 \
        -a $APP_NAME
    
    log_success "Variables d'environnement configurées"
}

# Configurer le stack Heroku
setup_stack() {
    log_info "Configuration du stack Heroku..."
    
    # Utiliser le stack le plus récent
    heroku stack:set heroku-22 -a $APP_NAME || \
    log_warning "Stack déjà configuré"
    
    # Activer les features nécessaires
    heroku features:enable runtime-dyno-metadata -a $APP_NAME || true
    
    log_success "Stack configuré"
}

# Configurer les buildpacks
setup_buildpacks() {
    log_info "Configuration des buildpacks..."
    
    # Nettoyer les buildpacks existants
    heroku buildpacks:clear -a $APP_NAME || true
    
    # Ajouter le buildpack Python
    heroku buildpacks:add heroku/python -a $APP_NAME
    
    log_success "Buildpacks configurés"
}

# Déployer l'application
deploy_app() {
    log_info "Déploiement de l'application..."
    
    # Vérifier que nous sommes dans un repo Git
    if ! git rev-parse --git-dir &> /dev/null; then
        log_error "Ce n'est pas un dépôt Git"
        log_info "Initialisation du dépôt Git..."
        git init
        git add .
        git commit -m "Initial commit pour Heroku"
    fi
    
    # Déployer sur Heroku
    log_info "Push vers Heroku..."
    git push heroku main || git push heroku master
    
    log_success "Application déployée"
}

# Configurer la base de données
setup_database() {
    log_info "Configuration de la base de données..."
    
    # Exécuter les migrations
    heroku run python backend/manage.py migrate -a $APP_NAME
    
    # Créer un superuser (optionnel)
    log_info "Création d'un superuser..."
    heroku run python backend/manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@linguaromana.com', 'linguaromana2024')
    print('Superuser créé: admin / linguaromana2024')
else:
    print('Superuser existe déjà')
" -a $APP_NAME
    
    # Collecter les fichiers statiques
    heroku run python backend/manage.py collectstatic --noinput -a $APP_NAME
    
    log_success "Base de données configurée"
}

# Afficher les informations finales
show_final_info() {
    echo -e "${GREEN}=============================================${NC}"
    echo -e "${GREEN}🎉 CONFIGURATION HEROKU TERMINÉE !${NC}"
    echo -e "${GREEN}=============================================${NC}"
    echo -e "${BLUE}📱 Application: ${GREEN}$APP_NAME${NC}"
    echo -e "${BLUE}🌐 URL: ${GREEN}https://$APP_NAME.herokuapp.com${NC}"
    echo -e "${BLUE}🛠️  Dashboard: ${GREEN}https://dashboard.heroku.com/apps/$APP_NAME${NC}"
    echo -e "${GREEN}=============================================${NC}"
    echo -e "${YELLOW}📋 COMMANDES UTILES:${NC}"
    echo -e "${BLUE}heroku logs --tail -a $APP_NAME${NC} - Voir les logs"
    echo -e "${BLUE}heroku run python backend/manage.py shell -a $APP_NAME${NC} - Shell Django"
    echo -e "${BLUE}heroku pg:psql -a $APP_NAME${NC} - Accès PostgreSQL"
    echo -e "${BLUE}heroku open -a $APP_NAME${NC} - Ouvrir l'application"
    echo -e "${GREEN}=============================================${NC}"
    echo -e "${YELLOW}🔐 COMPTE ADMIN:${NC}"
    echo -e "${BLUE}Username: ${GREEN}admin${NC}"
    echo -e "${BLUE}Password: ${GREEN}linguaromana2024${NC}"
    echo -e "${BLUE}URL Admin: ${GREEN}https://$APP_NAME.herokuapp.com/admin${NC}"
    echo -e "${GREEN}=============================================${NC}"
}

# Test de l'application
test_deployment() {
    log_info "Test de l'application déployée..."
    
    APP_URL="https://$APP_NAME.herokuapp.com"
    
    # Attendre que l'app soit prête
    for i in {1..10}; do
        if curl -f -s "$APP_URL" > /dev/null; then
            log_success "Application en ligne: $APP_URL"
            
            # Tester l'API
            if curl -f -s "$APP_URL/api/latest-comprehensive-article/" > /dev/null; then
                log_success "API fonctionnelle"
            else
                log_warning "API non accessible (normal si pas de données)"
            fi
            
            return 0
        fi
        log_info "Tentative $i/10... En attente de l'application"
        sleep 30
    done
    
    log_warning "Impossible de tester l'application"
    log_info "Vérifiez les logs: heroku logs --tail -a $APP_NAME"
}

# ============================================
# EXECUTION PRINCIPALE
# ============================================

main() {
    # Vérifier les arguments
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        echo "Usage: $0 [nom-app] [région]"
        echo ""
        echo "Arguments:"
        echo "  nom-app    Nom de l'application Heroku (par défaut: linguaromana-timestamp)"
        echo "  région     Région Heroku (par défaut: eu)"
        echo ""
        echo "Exemple: $0 my-linguaromana us"
        exit 0
    fi
    
    # Processus de configuration
    check_requirements
    create_heroku_app
    setup_stack
    setup_buildpacks
    setup_addons
    setup_environment
    deploy_app
    setup_database
    test_deployment
    show_final_info
    
    log_success "🎉 Configuration Heroku terminée avec succès !"
}

# Exécuter le script
main "$@"

