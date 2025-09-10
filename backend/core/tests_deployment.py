"""
Tests de déploiement pour valider le format des pages
Ces tests sont exécutés automatiquement lors du déploiement
Si ils échouent, le déploiement doit être bloqué
"""

import json
import re
from datetime import date

from bs4 import BeautifulSoup
from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.urls import reverse

from core.models import Article, ComprehensiveArticle, GrammarNote, Quiz


class PageFormatDeploymentTest(TestCase):
    """Test critique du format des pages pour le déploiement"""

    def setUp(self):
        """Préparer les données de test"""
        self.client = Client()

        # Créer un utilisateur
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        # Créer des données de test complètes
        self.article = Article.objects.create(
            title="Test Article Déploiement",
            content="Ceci est un [test] d'article pour le déploiement. Il contient des [mots-clés] pour validation.",
            language="es",
            level="intermediate",
            author=self.user,
            summary="Article de test pour déploiement",
            publication_date=date.today(),
            is_active=True,
        )

        # Les objets sont créés automatiquement par les signaux Django
        # Récupérer les objets créés automatiquement
        self.grammar_note = self.article.grammar_note
        self.quiz = self.article.quiz
        self.comprehensive = self.article.comprehensive_view

        # Mettre à jour les contenus avec des données de test
        self.grammar_note.title = "Test Grammaire Déploiement"
        self.grammar_note.content = "Note de grammaire de test pour validation.\n\nCeci est un paragraphe additionnel."
        self.grammar_note.key_concepts = "Concept 1\nConcept 2\nConcept 3"
        self.grammar_note.learning_objectives = "Objectif 1\nObjectif 2\nObjectif 3"
        self.grammar_note.difficulty_level = "intermediate"
        self.grammar_note.save()

        self.quiz.title = "Test Quiz Déploiement"
        self.quiz.description = "Quiz de test pour déploiement"
        self.quiz.passing_score = 60
        self.quiz.time_limit = 300
        self.quiz.is_active = True
        self.quiz.save()

        self.comprehensive.is_published = True
        self.comprehensive.notes = "Article complet de test pour déploiement"
        self.comprehensive.save()

    def test_home_page_structure_critical(self):
        """TEST CRITIQUE: Structure de la page home"""
        print("\n🧪 [DÉPLOIEMENT] Test structure page home...")

        response = self.client.get("/")
        self.assertEqual(response.status_code, 200, "Page home doit être accessible")

        # Parser le HTML
        soup = BeautifulSoup(response.content, "html.parser")

        # Vérifications critiques de structure
        required_sections = {
            "header.header": "Header navigation",
            ".article-section": "Section article principal",
            ".grammar-section": "Section notes de grammaire",
            ".quiz-section": "Section quiz",
        }

        for selector, name in required_sections.items():
            element = soup.select_one(selector)
            self.assertIsNotNone(
                element, f"ÉCHEC CRITIQUE: {name} manquante (sélecteur: {selector})"
            )
            print(f"✅ {name}: trouvée")

        # Vérifications des éléments de grammaire spécifiques
        grammar_elements = {
            "#grammar-title": "Titre grammaire",
            "#grammar-text": "Contenu grammaire",
            "#grammar-concepts": "Concepts clés",
            "#grammar-objectives": "Objectifs apprentissage",
            "#grammar-level": "Niveau grammaire",
        }

        for selector, name in grammar_elements.items():
            element = soup.select_one(selector)
            self.assertIsNotNone(
                element, f"ÉCHEC CRITIQUE: {name} manquant (sélecteur: {selector})"
            )
            print(f"✅ {name}: trouvé")

        print("✅ [DÉPLOIEMENT] Structure page home: VALIDE")

    def test_comprehensive_article_api_critical(self):
        """TEST CRITIQUE: API article complet"""
        print("\n🧪 [DÉPLOIEMENT] Test API article complet...")

        response = self.client.get("/api/latest-comprehensive-article/")
        self.assertEqual(
            response.status_code, 200, "API comprehensive article doit être accessible"
        )

        data = json.loads(response.content)

        # Vérifications critiques de l'API
        self.assertTrue(
            data.get("success", False),
            "ÉCHEC CRITIQUE: API doit retourner success=True",
        )

        comprehensive_data = data.get("comprehensive_article")
        self.assertIsNotNone(
            comprehensive_data,
            "ÉCHEC CRITIQUE: comprehensive_article manquant dans la réponse",
        )

        # Vérifier la structure des données
        required_fields = {
            "article": ["id", "title", "content", "language", "level"],
            "grammar_note": ["id", "title", "content", "difficulty_level"],
            "quiz": ["id", "title", "description", "questions"],
        }

        for section, fields in required_fields.items():
            section_data = comprehensive_data.get(section)
            self.assertIsNotNone(
                section_data, f"ÉCHEC CRITIQUE: Section {section} manquante"
            )

            for field in fields:
                self.assertIn(
                    field,
                    section_data,
                    f"ÉCHEC CRITIQUE: Champ {field} manquant dans {section}",
                )

                # Vérifier que les champs ne sont pas vides
                value = section_data[field]
                if field in ["title", "content", "description"]:
                    self.assertTrue(
                        value and str(value).strip(),
                        f"ÉCHEC CRITIQUE: {field} ne peut pas être vide dans {section}",
                    )

        print("✅ [DÉPLOIEMENT] API article complet: VALIDE")

    def test_no_duplicate_grammar_sections_critical(self):
        """TEST CRITIQUE: Pas de sections grammaire en double"""
        print("\n🧪 [DÉPLOIEMENT] Test sections grammaire uniques...")

        response = self.client.get("/")
        soup = BeautifulSoup(response.content, "html.parser")

        # Vérifier qu'il n'y a qu'une seule section grammaire
        grammar_sections = soup.select(".grammar-section")
        self.assertEqual(
            len(grammar_sections),
            1,
            f"ÉCHEC CRITIQUE: Trouvé {len(grammar_sections)} sections grammaire, attendu 1",
        )

        # Vérifier l'absence d'éléments indésirables
        unwanted_selectors = {
            ".grammar-cards": "Cartes grammaire statiques",
            'h3:contains("📚 Notas gramaticales")': "Section Notas gramaticales",
        }

        for selector, name in unwanted_selectors.items():
            if "contains" in selector:
                # Vérification spéciale pour le texte
                h3_elements = soup.select("h3")
                unwanted_found = any(
                    "📚 Notas gramaticales" in h3.get_text() for h3 in h3_elements
                )
                self.assertFalse(
                    unwanted_found,
                    f"ÉCHEC CRITIQUE: {name} trouvée (doit être supprimée)",
                )
            else:
                elements = soup.select(selector)
                self.assertEqual(
                    len(elements),
                    0,
                    f"ÉCHEC CRITIQUE: {name} trouvée(s) ({len(elements)}), doit être supprimée",
                )

        print("✅ [DÉPLOIEMENT] Sections grammaire uniques: VALIDE")

    def test_content_loading_integration_critical(self):
        """TEST CRITIQUE: Intégration chargement contenu"""
        print("\n🧪 [DÉPLOIEMENT] Test intégration chargement...")

        # Test de l'API avec l'interface
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)

        # Vérifier que le JavaScript nécessaire est chargé
        content = response.content.decode("utf-8")

        # Vérifier que le script.js est inclus dans la page
        self.assertIn(
            "/static/script.js",
            content,
            "ÉCHEC CRITIQUE: Script JavaScript principal manquant",
        )

        # Vérifier que l'auto-sync.js est inclus
        self.assertIn(
            "/static/auto-sync.js", content, "ÉCHEC CRITIQUE: Script auto-sync manquant"
        )

        # Vérifier que les éléments nécessaires pour l'intégration sont présents
        self.assertIn(
            "window.USER_DATA",
            content,
            "ÉCHEC CRITIQUE: Données utilisateur pour JS manquantes",
        )

        print("✅ [DÉPLOIEMENT] Intégration chargement: VALIDE")

    def test_page_performance_critical(self):
        """TEST CRITIQUE: Performance de la page"""
        print("\n🧪 [DÉPLOIEMENT] Test performance...")

        import time

        # Mesurer le temps de réponse de la page home
        start_time = time.time()
        response = self.client.get("/")
        home_time = time.time() - start_time

        self.assertLess(
            home_time,
            2.0,
            f"ÉCHEC CRITIQUE: Page home trop lente ({home_time:.2f}s > 2s)",
        )

        # Mesurer le temps de réponse de l'API
        start_time = time.time()
        response = self.client.get("/api/latest-comprehensive-article/")
        api_time = time.time() - start_time

        self.assertLess(
            api_time, 1.0, f"ÉCHEC CRITIQUE: API trop lente ({api_time:.2f}s > 1s)"
        )

        print(
            f"✅ [DÉPLOIEMENT] Performance: VALIDE (home: {home_time:.2f}s, API: {api_time:.2f}s)"
        )


class QuickSmokeTest(TestCase):
    """Tests de fumée rapides pour validation express"""

    def test_basic_pages_accessible(self):
        """Vérification basique d'accessibilité"""
        pages = [
            ("/", "Page home"),
            ("/api/latest-comprehensive-article/", "API comprehensive"),
        ]

        for url, name in pages:
            response = self.client.get(url)
            self.assertIn(
                response.status_code,
                [200, 302],
                f"ÉCHEC: {name} non accessible ({url})",
            )

    def test_no_500_errors(self):
        """Aucune erreur serveur 500"""
        response = self.client.get("/")
        self.assertNotEqual(
            response.status_code,
            500,
            "ÉCHEC CRITIQUE: Erreur serveur 500 sur page home",
        )


def run_deployment_tests():
    """
    Fonction utilitaire pour exécuter les tests de déploiement
    Retourne True si tous les tests passent, False sinon
    """
    import sys

    from django.conf import settings
    from django.test.utils import get_runner

    # Configuration du runner de tests
    TestRunner = get_runner(settings)
    test_runner = TestRunner(verbosity=2, interactive=False, keepdb=False)

    # Exécuter uniquement les tests de déploiement
    test_labels = [
        "core.tests_deployment.PageFormatDeploymentTest",
        "core.tests_deployment.QuickSmokeTest",
    ]

    failures = test_runner.run_tests(test_labels)

    if failures:
        print(f"\n❌ [DÉPLOIEMENT] {failures} test(s) échoué(s)")
        print("🚫 DÉPLOIEMENT BLOQUÉ")
        return False
    else:
        print("\n✅ [DÉPLOIEMENT] Tous les tests passent")
        print("🚀 DÉPLOIEMENT AUTORISÉ")
        return True
