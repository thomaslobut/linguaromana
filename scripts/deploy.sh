#!/bin/bash
# ============================================
# 🚀 SCRIPT DE DÉPLOIEMENT UNIVERSEL
# ============================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
ENVIRONMENT=${1:-staging}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/linguaromana"
APP_DIR="/var/www/linguaromana"
DOCKER_COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

echo -e "${BLUE}🚀 === DÉPLOIEMENT LINGUAROMANA ====${NC}"
echo -e "${BLUE}📅 Date: $(date)${NC}"
echo -e "${BLUE}🌍 Environnement: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}📦 Version: ${CI_COMMIT_SHA:-local}${NC}"
echo -e "${BLUE}======================================${NC}"

# ============================================
# FONCTIONS UTILITAIRES
# ============================================

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
    
    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    
    # Vérifier docker-compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    # Vérifier les variables d'environnement
    if [[ "$ENVIRONMENT" == "production" && -z "$PRODUCTION_HOST" ]]; then
        log_error "Variable PRODUCTION_HOST manquante"
        exit 1
    fi
    
    log_success "Prérequis OK"
}

# Sauvegarder la version actuelle
backup_current_version() {
    log_info "Sauvegarde de la version actuelle..."
    
    mkdir -p $BACKUP_DIR
    
    if [ -d "$APP_DIR" ]; then
        sudo tar -czf "$BACKUP_DIR/backup_${ENVIRONMENT}_${TIMESTAMP}.tar.gz" \
             -C "$APP_DIR" . \
             --exclude='*.log' \
             --exclude='node_modules' \
             --exclude='venv' \
             --exclude='__pycache__'
        log_success "Sauvegarde créée: backup_${ENVIRONMENT}_${TIMESTAMP}.tar.gz"
    else
        log_warning "Aucune version existante à sauvegarder"
    fi
}

# Préparer le répertoire de déploiement
prepare_deployment() {
    log_info "Préparation du déploiement..."
    
    # Créer le répertoire s'il n'existe pas
    sudo mkdir -p $APP_DIR
    sudo chown $USER:$USER $APP_DIR
    
    # Copier les fichiers
    cp -r ./* $APP_DIR/
    
    log_success "Fichiers copiés vers $APP_DIR"
}

# Configurer l'environnement
setup_environment() {
    log_info "Configuration de l'environnement ${ENVIRONMENT}..."
    
    cd $APP_DIR
    
    # Copier le fichier d'environnement approprié
    if [ -f ".env.${ENVIRONMENT}" ]; then
        cp ".env.${ENVIRONMENT}" .env
        log_success "Fichier .env.${ENVIRONMENT} copié"
    else
        log_warning "Fichier .env.${ENVIRONMENT} non trouvé, utilisation des variables CI/CD"
        
        # Créer un fichier .env à partir des variables CI/CD
        cat > .env << EOF
DEBUG=False
SECRET_KEY=${SECRET_KEY:-$(openssl rand -hex 32)}
DATABASE_URL=${DATABASE_URL}
ALLOWED_HOSTS=${ALLOWED_HOSTS:-localhost,127.0.0.1}
STATIC_URL=/static/
MEDIA_URL=/media/
ENVIRONMENT=${ENVIRONMENT}
EOF
    fi
}

# Déployer avec Docker
deploy_with_docker() {
    log_info "Déploiement avec Docker..."
    
    cd $APP_DIR
    
    # Arrêter les conteneurs existants
    if [ -f "$DOCKER_COMPOSE_FILE" ]; then
        docker-compose -f $DOCKER_COMPOSE_FILE down || true
    else
        log_warning "Fichier $DOCKER_COMPOSE_FILE non trouvé, utilisation de docker-compose.yml"
        DOCKER_COMPOSE_FILE="docker-compose.yml"
    fi
    
    # Construire et lancer les nouveaux conteneurs
    docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache
    docker-compose -f $DOCKER_COMPOSE_FILE up -d
    
    log_success "Conteneurs Docker déployés"
}

# Exécuter les migrations Django
run_migrations() {
    log_info "Exécution des migrations Django..."
    
    cd $APP_DIR
    
    # Exécuter les migrations dans le conteneur
    docker-compose -f $DOCKER_COMPOSE_FILE exec -T web python manage.py migrate
    
    # Collecter les fichiers statiques
    docker-compose -f $DOCKER_COMPOSE_FILE exec -T web python manage.py collectstatic --noinput
    
    log_success "Migrations terminées"
}

# Vérification de santé
health_check() {
    log_info "Vérification de santé de l'application..."
    
    # Déterminer l'URL à tester
    case $ENVIRONMENT in
        "staging")
            HEALTH_URL=${STAGING_URL:-"http://localhost:8000"}/api/latest-comprehensive-article/
            ;;
        "production")
            HEALTH_URL=${PRODUCTION_URL:-"http://localhost:8000"}/api/latest-comprehensive-article/
            ;;
        *)
            HEALTH_URL="http://localhost:8000/api/latest-comprehensive-article/"
            ;;
    esac
    
    # Attendre que l'application soit prête
    for i in {1..30}; do
        if curl -f -s "$HEALTH_URL" > /dev/null; then
            log_success "Application en ligne: $HEALTH_URL"
            return 0
        fi
        log_info "Tentative $i/30... En attente de l'application"
        sleep 10
    done
    
    log_error "L'application ne répond pas après 5 minutes"
    return 1
}

# Nettoyer les anciens conteneurs/images
cleanup() {
    log_info "Nettoyage des anciennes versions..."
    
    # Supprimer les conteneurs arrêtés
    docker container prune -f
    
    # Supprimer les images non utilisées
    docker image prune -f
    
    # Garder seulement les 3 dernières sauvegardes
    if [ -d "$BACKUP_DIR" ]; then
        find $BACKUP_DIR -name "backup_${ENVIRONMENT}_*.tar.gz" -type f | \
        sort -r | tail -n +4 | xargs -r rm
    fi
    
    log_success "Nettoyage terminé"
}

# Envoyer une notification
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local color="good"
        local emoji="✅"
        
        if [ "$status" != "success" ]; then
            color="danger"
            emoji="❌"
        fi
        
        curl -X POST -H 'Content-type: application/json' \
        --data "{
            \"attachments\": [{
                \"color\": \"$color\",
                \"title\": \"$emoji LinguaRomana - Déploiement $ENVIRONMENT\",
                \"text\": \"$message\",
                \"fields\": [
                    {\"title\": \"Environnement\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                    {\"title\": \"Version\", \"value\": \"${CI_COMMIT_SHA:-local}\", \"short\": true},
                    {\"title\": \"Date\", \"value\": \"$(date)\", \"short\": true}
                ]
            }]
        }" $SLACK_WEBHOOK_URL || true
    fi
}

# ============================================
# DÉPLOIEMENT PRINCIPAL
# ============================================

main() {
    local start_time=$(date +%s)
    
    # Vérifications préliminaires
    check_requirements
    
    # Processus de déploiement
    backup_current_version
    prepare_deployment
    setup_environment
    deploy_with_docker
    run_migrations
    
    # Vérifications post-déploiement
    if health_check; then
        cleanup
        
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        log_success "🎉 DÉPLOIEMENT RÉUSSI en ${duration}s"
        log_success "🌐 Application disponible: $HEALTH_URL"
        
        send_notification "success" "Déploiement réussi en ${duration}s"
        
        return 0
    else
        log_error "Échec de la vérification de santé"
        log_error "Rollback recommandé: ./scripts/rollback.sh $ENVIRONMENT"
        
        send_notification "error" "Échec du déploiement - Vérification de santé échouée"
        
        return 1
    fi
}

# ============================================
# EXÉCUTION
# ============================================

# Vérifier les arguments
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    echo "Usage: $0 [staging|production]"
    echo ""
    echo "Variables d'environnement requises:"
    echo "  - DATABASE_URL: URL de la base de données"
    echo "  - SECRET_KEY: Clé secrète Django"
    echo "  - STAGING_URL ou PRODUCTION_URL: URL de l'application"
    echo ""
    echo "Variables optionnelles:"
    echo "  - SLACK_WEBHOOK_URL: Pour les notifications"
    echo "  - ALLOWED_HOSTS: Hosts autorisés Django"
    exit 0
fi

# Exécuter le déploiement
main "$@"

