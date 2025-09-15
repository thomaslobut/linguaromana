# Makefile pour LinguaRomana - Validation et Déploiement
# ======================================================

.PHONY: help install test test-fast test-deployment deploy-check clean

# Variables
PYTHON = python3
PIP = pip3
BACKEND_DIR = backend
VENV_DIR = $(BACKEND_DIR)/venv

# Couleurs pour l'affichage
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[1;33m
BLUE = \033[0;34m
NC = \033[0m # No Color

help: ## 📋 Afficher l'aide
	@echo "$(BLUE)🚀 LinguaRomana - Commandes de Déploiement$(NC)"
	@echo "=================================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

install: ## 📦 Installer les dépendances
	@echo "$(BLUE)📦 Installation des dépendances...$(NC)"
	cd $(BACKEND_DIR) && $(PIP) install -r requirements.txt
	cd $(BACKEND_DIR) && $(PIP) install beautifulsoup4  # Pour les tests HTML
	@echo "$(GREEN)✅ Dépendances installées$(NC)"

setup: install ## 🔧 Configuration initiale complète
	@echo "$(BLUE)🔧 Configuration initiale...$(NC)"
	cd $(BACKEND_DIR) && $(PYTHON) manage.py migrate
	cd $(BACKEND_DIR) && $(PYTHON) manage.py collectstatic --noinput
	@echo "$(GREEN)✅ Configuration terminée$(NC)"

test: ## 🧪 Tests complets de déploiement
	@echo "$(BLUE)🧪 Lancement des tests de déploiement...$(NC)"
	$(PYTHON) run_deployment_tests.py
	@echo "$(GREEN)✅ Tests terminés$(NC)"

test-fast: ## ⚡ Tests rapides (fumée)
	@echo "$(BLUE)⚡ Tests rapides...$(NC)"
	$(PYTHON) run_deployment_tests.py --fast
	@echo "$(GREEN)✅ Tests rapides terminés$(NC)"

test-deployment: test ## 🚀 Alias pour test complet

validate-format: ## 📋 Validation format page uniquement
	@echo "$(BLUE)📋 Validation format page...$(NC)"
	cd $(BACKEND_DIR) && $(PYTHON) manage.py test core.tests.tests_deployment.PageFormatDeploymentTest.test_home_page_structure_critical --verbosity=2
	@echo "$(GREEN)✅ Format validé$(NC)"

validate-api: ## 🌐 Validation API uniquement
	@echo "$(BLUE)🌐 Validation API...$(NC)"
	cd $(BACKEND_DIR) && $(PYTHON) manage.py test core.tests.tests_deployment.PageFormatDeploymentTest.test_comprehensive_article_api_critical --verbosity=2
	@echo "$(GREEN)✅ API validée$(NC)"

deploy-check: test ## 🚀 Vérification complète avant déploiement
	@echo "$(GREEN)"
	@echo "=================================================="
	@echo "🎉 VALIDATION DÉPLOIEMENT RÉUSSIE"
	@echo "=================================================="
	@echo "✅ Format page: Article + Notes de grammaire"
	@echo "✅ API fonctionnelle"
	@echo "✅ Performance acceptable"
	@echo "✅ Pas de sections en double"
	@echo "=================================================="
	@echo "🚀 DÉPLOIEMENT AUTORISÉ"
	@echo "$(NC)"

check-requirements: ## 🔍 Vérifier les dépendances
	@echo "$(BLUE)🔍 Vérification des dépendances...$(NC)"
	cd $(BACKEND_DIR) && $(PIP) check
	@echo "$(GREEN)✅ Dépendances OK$(NC)"

security-check: ## 🔒 Vérification sécurité
	@echo "$(BLUE)🔒 Vérification sécurité...$(NC)"
	cd $(BACKEND_DIR) && $(PIP) install safety bandit
	cd $(BACKEND_DIR) && safety check
	cd $(BACKEND_DIR) && bandit -r . -x "*/tests*,*/venv*" || true
	@echo "$(GREEN)✅ Vérification sécurité terminée$(NC)"

lint: ## 🔍 Analyse statique du code
	@echo "$(BLUE)🔍 Analyse statique...$(NC)"
	cd $(BACKEND_DIR) && $(PYTHON) -m flake8 . --exclude=venv,migrations --max-line-length=100 || true
	@echo "$(GREEN)✅ Analyse terminée$(NC)"

clean: ## 🧹 Nettoyer les fichiers temporaires
	@echo "$(BLUE)🧹 Nettoyage...$(NC)"
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} + || true
	cd $(BACKEND_DIR) && rm -rf staticfiles/admin staticfiles/rest_framework || true
	@echo "$(GREEN)✅ Nettoyage terminé$(NC)"

dev-server: ## 🖥️ Lancer le serveur de développement
	@echo "$(BLUE)🖥️ Lancement serveur développement...$(NC)"
	cd $(BACKEND_DIR) && $(PYTHON) manage.py runserver

# Commandes de CI/CD
ci-install: ## 🤖 Installation pour CI/CD
	@echo "$(BLUE)🤖 Installation CI/CD...$(NC)"
	$(PIP) install --upgrade pip
	cd $(BACKEND_DIR) && $(PIP) install -r requirements.txt
	cd $(BACKEND_DIR) && $(PIP) install beautifulsoup4 coverage
	@echo "$(GREEN)✅ Installation CI/CD terminée$(NC)"

ci-test: ## 🤖 Tests pour CI/CD
	@echo "$(BLUE)🤖 Tests CI/CD...$(NC)"
	$(PYTHON) run_deployment_tests.py
	@if [ $$? -eq 0 ]; then \
		echo "$(GREEN)✅ CI/CD: DÉPLOIEMENT AUTORISÉ$(NC)"; \
	else \
		echo "$(RED)❌ CI/CD: DÉPLOIEMENT BLOQUÉ$(NC)"; \
		exit 1; \
	fi

# Commandes de diagnostic
debug-format: ## 🔧 Debug format page
	@echo "$(BLUE)🔧 Debug format page...$(NC)"
	cd $(BACKEND_DIR) && $(PYTHON) manage.py shell -c "from core.tests.tests_deployment import PageFormatDeploymentTest; t = PageFormatDeploymentTest(); t.setUp(); t.test_home_page_structure_critical()"

debug-api: ## 🔧 Debug API
	@echo "$(BLUE)🔧 Debug API...$(NC)"
	cd $(BACKEND_DIR) && $(PYTHON) manage.py shell -c "from core.tests.tests_deployment import PageFormatDeploymentTest; t = PageFormatDeploymentTest(); t.setUp(); t.test_comprehensive_article_api_critical()"

status: ## 📊 Statut du projet
	@echo "$(BLUE)📊 Statut LinguaRomana$(NC)"
	@echo "================================"
	@echo "📁 Répertoire: $(shell pwd)"
	@echo "🐍 Python: $(shell $(PYTHON) --version)"
	@echo "📦 Pip: $(shell $(PIP) --version)"
	@echo "🗄️  Base: $(shell cd $(BACKEND_DIR) && $(PYTHON) manage.py showmigrations --plan | wc -l | tr -d ' ') migrations"
	@echo "📋 Format: $(shell if $(PYTHON) run_deployment_tests.py --fast >/dev/null 2>&1; then echo "✅ VALIDE"; else echo "❌ INVALIDE"; fi)"
	@echo "================================"

# Commande par défaut
.DEFAULT_GOAL := help


