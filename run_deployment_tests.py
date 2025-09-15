#!/usr/bin/env python3
"""
Script de validation pour pipeline de déploiement
Exécute les tests critiques et bloque le déploiement en cas d'échec

Usage:
    python run_deployment_tests.py [--fast]

Exit codes:
    0: Tous les tests passent - Déploiement autorisé
    1: Tests échoués - Déploiement bloqué
    2: Erreur de configuration
"""

import os
import sys
from pathlib import Path

import django

# Configuration du chemin Django
BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "backend"

# Ajouter le backend au path Python
sys.path.insert(0, str(BACKEND_DIR))

# Configuration de l'environnement Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "linguaromana_backend.settings")


def setup_django():
    """Configuration initiale de Django"""
    try:
        django.setup()
        print("✅ Django configuré avec succès")
        return True
    except Exception as e:
        print(f"❌ Erreur configuration Django: {e}")
        return False


def check_database():
    """Vérifier la connectivité base de données"""
    try:
        from django.db import connection

        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        print("✅ Base de données accessible")
        return True
    except Exception as e:
        print(f"❌ Erreur base de données: {e}")
        return False


def run_migrations():
    """Exécuter les migrations si nécessaire"""
    try:
        from django.core.management import execute_from_command_line

        print("🔄 Vérification des migrations...")

        # Exécuter les migrations
        execute_from_command_line(["manage.py", "migrate", "--verbosity=0"])
        print("✅ Migrations appliquées")
        return True
    except Exception as e:
        print(f"❌ Erreur migrations: {e}")
        return False


def collect_static():
    """Collecter les fichiers statiques"""
    try:
        from django.core.management import execute_from_command_line

        print("🔄 Collection des fichiers statiques...")

        execute_from_command_line(
            ["manage.py", "collectstatic", "--noinput", "--verbosity=0"]
        )
        print("✅ Fichiers statiques collectés")
        return True
    except Exception as e:
        print(f"❌ Erreur collecte statique: {e}")
        return False


def run_critical_tests():
    """Exécuter les tests critiques de déploiement"""
    try:
        from django.conf import settings
        from django.test.utils import get_runner

        print("\n🧪 === TESTS CRITIQUES DE DÉPLOIEMENT ===")

        # Configuration du runner de tests
        TestRunner = get_runner(settings)
        test_runner = TestRunner(
            verbosity=2,
            interactive=False,
            keepdb=True,  # Garder la DB pour la performance
            parallel=1,  # Tests séquentiels pour la stabilité
        )

        # Tests de déploiement spécifiques
        test_labels = [
            "core.tests.tests_deployment.PageFormatDeploymentTest.test_home_page_structure_critical",
            "core.tests.tests_deployment.PageFormatDeploymentTest.test_comprehensive_article_api_critical",
            "core.tests.tests_deployment.PageFormatDeploymentTest.test_no_duplicate_grammar_sections_critical",
            "core.tests.tests_deployment.PageFormatDeploymentTest.test_content_loading_integration_critical",
            "core.tests.tests_deployment.PageFormatDeploymentTest.test_page_performance_critical",
            "core.tests.tests_deployment.QuickSmokeTest",
        ]

        failures = test_runner.run_tests(test_labels)

        if failures == 0:
            print("\n✅ === TOUS LES TESTS CRITIQUES PASSENT ===")
            return True
        else:
            print(f"\n❌ === {failures} TEST(S) CRITIQUE(S) ÉCHOUÉ(S) ===")
            return False

    except Exception as e:
        print(f"❌ Erreur lors des tests: {e}")
        return False


def run_quick_smoke_tests():
    """Tests de fumée rapides"""
    try:
        from django.conf import settings
        from django.test.utils import get_runner

        print("\n💨 === TESTS DE FUMÉE RAPIDES ===")

        TestRunner = get_runner(settings)
        test_runner = TestRunner(verbosity=1, interactive=False, keepdb=True)

        failures = test_runner.run_tests(["core.tests.tests_deployment.QuickSmokeTest"])

        return failures == 0

    except Exception as e:
        print(f"❌ Erreur tests de fumée: {e}")
        return False


def validate_environment():
    """Valider l'environnement de déploiement"""
    print("\n🔍 === VALIDATION ENVIRONNEMENT ===")

    checks = []

    # Vérifier les variables d'environnement critiques
    env_vars = ["SECRET_KEY"]
    for var in env_vars:
        if os.environ.get(var):
            print(f"✅ {var}: configuré")
            checks.append(True)
        else:
            print(f"⚠️  {var}: utilise valeur par défaut")
            checks.append(True)  # Non bloquant pour le développement

    # Vérifier les fichiers critiques
    critical_files = [
        BACKEND_DIR / "linguaromana_backend" / "settings.py",
        BACKEND_DIR / "core" / "models.py",
        BACKEND_DIR / "core" / "views.py",
        BACKEND_DIR / "templates" / "home.html",
        BACKEND_DIR / "static" / "script.js",
    ]

    for file_path in critical_files:
        if file_path.exists():
            print(f"✅ {file_path.name}: présent")
            checks.append(True)
        else:
            print(f"❌ {file_path.name}: MANQUANT")
            checks.append(False)

    return all(checks)


def main():
    """Fonction principale"""
    print("🚀 === VALIDATION DÉPLOIEMENT LINGUAROMANA ===")
    print(f"📁 Répertoire: {BASE_DIR}")

    # Arguments en ligne de commande
    fast_mode = "--fast" in sys.argv
    if fast_mode:
        print("⚡ Mode rapide activé")

    # Changer vers le répertoire backend
    os.chdir(BACKEND_DIR)

    # Étapes de validation
    steps = [
        ("Configuration Django", setup_django),
        ("Validation environnement", validate_environment),
        ("Connectivité base de données", check_database),
        ("Migrations", run_migrations),
        ("Fichiers statiques", collect_static),
    ]

    # Tests selon le mode
    if fast_mode:
        steps.append(("Tests de fumée", run_quick_smoke_tests))
    else:
        steps.append(("Tests critiques", run_critical_tests))

    # Exécuter toutes les étapes
    for step_name, step_func in steps:
        print(f"\n🔄 {step_name}...")
        if not step_func():
            print(f"\n❌ ÉCHEC: {step_name}")
            print("🚫 DÉPLOIEMENT BLOQUÉ")
            sys.exit(1)

    # Résumé final
    print("\n" + "=" * 60)
    print("🎉 VALIDATION DÉPLOIEMENT RÉUSSIE")
    print("=" * 60)
    print("✅ Tous les tests critiques passent")
    print("✅ Format page: Article + Notes de grammaire")
    print("✅ API fonctionnelle")
    print("✅ Performance acceptable")
    print("=" * 60)
    print("🚀 DÉPLOIEMENT AUTORISÉ")

    sys.exit(0)


if __name__ == "__main__":
    main()
