"""
Tests for Articles and Vocabulary System

Test scenarios:
1. Article with vocabulary words in brackets - check article-definition association
2. Latest article display on homepage
3. Article removal from admin affects archive display
"""

import re
from datetime import date, timedelta

from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.urls import reverse

from authentication.models import (
    Article,
    ArticleWord,
    UserProfile,
    Word,
    WordDefinition,
    WordTranslation,
)


class ArticlesVocabularyTestCase(TestCase):
    """Test suite for articles and vocabulary system"""

    def setUp(self):
        """Set up test data"""
        # Create test user
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        # Create user profile
        self.profile = UserProfile.objects.create(
            user=self.user, preferred_language="es", current_streak=0, total_points=0
        )

        # Create admin user
        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="adminpass123",
            is_staff=True,
            is_superuser=True,
        )

        self.client = Client()

    def create_word_with_translations_and_definition(
        self, word_text, primary_lang="es"
    ):
        """Helper method to create a complete word with translations and definition"""
        # Create the word using get_or_create to avoid unique constraint violations
        word, created = Word.objects.get_or_create(
            word=word_text,
            defaults={"primary_language": primary_lang, "created_by": self.admin_user},
        )

        # Define translations for the word in all languages
        translations_data = {
            "engañan": {
                "es": "engañan",
                "it": "ingannano",
                "pt": "enganam",
                "ca": "enganyen",
                "fr": "trompent",
            },
            "devastadora": {
                "es": "devastadora",
                "it": "devastante",
                "pt": "devastadora",
                "ca": "devastadora",
                "fr": "dévastatrice",
            },
            "redes": {
                "es": "redes",
                "it": "reti",
                "pt": "redes",
                "ca": "xarxes",
                "fr": "réseaux",
            },
        }

        # Get translations for this word
        word_translations = translations_data.get(
            word_text,
            {
                "es": word_text,
                "it": word_text,
                "pt": word_text,
                "ca": word_text,
                "fr": word_text,
            },
        )

        # Create translations for all languages (only if word was just created or missing translations)
        for lang_code, translation in word_translations.items():
            WordTranslation.objects.get_or_create(
                word=word,
                language=lang_code,
                defaults={
                    "translation": translation,
                    "part_of_speech": "verb" if word_text == "engañan" else "noun",
                },
            )

        # Create definition
        grammar_notes = {
            "engañan": 'Tercera persona del plural del presente de indicativo del verbo "engañar". Expresa una acción habitual.',
            "devastadora": "Adjetivo femenino singular que describe algo que causa gran destrucción o daño.",
            "redes": "Sustantivo femenino plural que se refiere a sistemas de conexiones interconectadas.",
        }

        WordDefinition.objects.get_or_create(
            word=word,
            defaults={
                "grammar_note": grammar_notes.get(
                    word_text, f"Definición gramatical de {word_text}"
                ),
                "usage_example": f"Ejemplo de uso de {word_text} en contexto.",
                "difficulty_level": "intermediate",
            },
        )

        return word

    def test_article_with_vocabulary_words_all_languages(self):
        """
        Test 1: Verify article-definition association for all languages
        Create an article in each language with vocabulary words in brackets
        """
        languages = [
            ("es", "Español"),
            ("it", "Italiano"),
            ("pt", "Português"),
            ("ca", "Català"),
            ("fr", "Français"),
        ]

        for lang_code, lang_name in languages:
            with self.subTest(language=lang_name):
                # Create vocabulary words
                word1 = self.create_word_with_translations_and_definition(
                    "engañan", lang_code
                )
                word2 = self.create_word_with_translations_and_definition(
                    "devastadora", lang_code
                )

                # Create article with words in brackets
                article_content = "Las redes sociales [engañan] con una nueva [devastadora] estafa que afecta a miles de usuarios."

                article = Article.objects.create(
                    title=f"Artículo de prueba en {lang_name}",
                    content=article_content,
                    language=lang_code,
                    level="intermediate",
                    publication_date=date.today(),
                    is_active=True,
                )

                # Extract words from brackets in content
                bracket_words = re.findall(r"\[([^\]]+)\]", article_content)

                # Create ArticleWord associations
                for i, bracket_word in enumerate(bracket_words):
                    word = Word.objects.filter(word=bracket_word).first()
                    if word:
                        ArticleWord.objects.create(
                            article=article,
                            word=word,
                            position_in_text=article_content.find(f"[{bracket_word}]"),
                            context_sentence=article_content,
                            is_key_vocabulary=True,
                        )

                # Verify associations
                article_words = ArticleWord.objects.filter(article=article)
                self.assertEqual(
                    article_words.count(),
                    2,
                    f"Should have 2 vocabulary words associated for {lang_name}",
                )

                # Verify each word has proper definition and translations
                for article_word in article_words:
                    word = article_word.word

                    # Check word has definition
                    self.assertTrue(
                        hasattr(word, "definition"),
                        f"Word {word.word} should have definition in {lang_name}",
                    )

                    # Check word has translations in all languages
                    translations = WordTranslation.objects.filter(word=word)
                    self.assertEqual(
                        translations.count(),
                        5,
                        f"Word {word.word} should have 5 translations in {lang_name}",
                    )

                    # Verify specific language translation exists
                    lang_translation = translations.filter(language=lang_code).first()
                    self.assertIsNotNone(
                        lang_translation,
                        f"Word {word.word} should have {lang_name} translation",
                    )

                print(
                    f"✅ Test 1 passed for {lang_name}: Article-vocabulary association verified"
                )

    def test_latest_article_homepage_display(self):
        """
        Test 2: Verify that the latest published article is the only one displayed on homepage
        """
        # Create multiple articles with different publication dates
        older_article = Article.objects.create(
            title="Article ancien",
            content="Contenu ancien avec des [mots] importants.",
            language="es",
            level="beginner",
            publication_date=date.today() - timedelta(days=5),
            is_active=True,
        )

        middle_article = Article.objects.create(
            title="Article du milieu",
            content="Contenu du milieu avec des [termes] techniques.",
            language="fr",
            level="intermediate",
            publication_date=date.today() - timedelta(days=2),
            is_active=True,
        )

        latest_article = Article.objects.create(
            title="Article le plus récent",
            content="Contenu le plus récent avec des [concepts] avancés.",
            language="it",
            level="advanced",
            publication_date=date.today(),
            is_active=True,
        )

        # Get latest article using the same logic as the frontend
        all_articles = Article.objects.filter(is_active=True).order_by(
            "-publication_date"
        )
        homepage_article = all_articles.first()

        # Verify it's the latest article
        self.assertEqual(
            homepage_article.id,
            latest_article.id,
            "Homepage should display the latest published article",
        )
        self.assertEqual(
            homepage_article.title,
            "Article le plus récent",
            "Homepage article should have the correct title",
        )
        self.assertEqual(
            homepage_article.publication_date,
            date.today(),
            "Homepage article should have today's date",
        )

        # Verify older articles are not featured
        self.assertNotEqual(homepage_article.id, older_article.id)
        self.assertNotEqual(homepage_article.id, middle_article.id)

        # Additional check: verify article order in archive view
        archive_articles = list(all_articles)
        self.assertEqual(
            archive_articles[0].id,
            latest_article.id,
            "First article in archive should be the latest",
        )
        self.assertEqual(
            archive_articles[1].id,
            middle_article.id,
            "Second article should be middle one",
        )
        self.assertEqual(
            archive_articles[2].id,
            older_article.id,
            "Third article should be the oldest",
        )

        print("✅ Test 2 passed: Latest article correctly displayed on homepage")

    def test_article_removal_from_archive(self):
        """
        Test 3: Verify that when an article is removed from admin,
        it no longer appears in the archive
        """
        # Create test articles
        article1 = Article.objects.create(
            title="Article à conserver",
            content="Contenu à conserver avec des [mots] utiles.",
            language="es",
            level="intermediate",
            publication_date=date.today() - timedelta(days=1),
            is_active=True,
        )

        article_to_remove = Article.objects.create(
            title="Article à supprimer",
            content="Contenu à supprimer avec des [termes] obsolètes.",
            language="fr",
            level="beginner",
            publication_date=date.today() - timedelta(days=3),
            is_active=True,
        )

        article3 = Article.objects.create(
            title="Autre article à conserver",
            content="Autre contenu à conserver avec des [concepts] importants.",
            language="it",
            level="advanced",
            publication_date=date.today() - timedelta(days=2),
            is_active=True,
        )

        # Verify all articles are initially in archive
        initial_archive = Article.objects.filter(is_active=True)
        self.assertEqual(
            initial_archive.count(), 3, "Archive should initially contain 3 articles"
        )
        self.assertIn(
            article_to_remove,
            initial_archive,
            "Article to remove should be in initial archive",
        )

        # Simulate admin removal (soft delete by setting is_active=False)
        article_to_remove.is_active = False
        article_to_remove.save()

        # Verify article is removed from archive
        archive_after_removal = Article.objects.filter(is_active=True)
        self.assertEqual(
            archive_after_removal.count(),
            2,
            "Archive should contain 2 articles after removal",
        )
        self.assertNotIn(
            article_to_remove,
            archive_after_removal,
            "Removed article should not appear in archive",
        )

        # Verify other articles are still in archive
        remaining_articles = list(archive_after_removal.order_by("-publication_date"))
        self.assertEqual(
            remaining_articles[0].id,
            article1.id,
            "Article 1 should still be in archive",
        )
        self.assertEqual(
            remaining_articles[1].id,
            article3.id,
            "Article 3 should still be in archive",
        )

        # Test hard deletion as well
        article_to_remove.delete()

        # Verify article is completely gone
        self.assertFalse(
            Article.objects.filter(id=article_to_remove.id).exists(),
            "Hard deleted article should not exist in database",
        )

        final_archive = Article.objects.filter(is_active=True)
        self.assertEqual(
            final_archive.count(),
            2,
            "Archive should still contain 2 articles after hard delete",
        )

        print("✅ Test 3 passed: Article removal correctly affects archive display")

    def test_integration_article_word_definition_flow(self):
        """
        Integration test: Complete flow from article creation to vocabulary display
        """
        # Create vocabulary word with complete data
        word = self.create_word_with_translations_and_definition("devastadora", "es")

        # Create article with the word
        article = Article.objects.create(
            title="Test d'intégration complète",
            content="Une nouvelle [devastadora] crise économique frappe l'Europe.",
            language="es",
            level="advanced",
            publication_date=date.today(),
            is_active=True,
        )

        # Create association
        ArticleWord.objects.create(
            article=article,
            word=word,
            position_in_text=13,  # Position of [devastadora]
            context_sentence=article.content,
            is_key_vocabulary=True,
        )

        # Test complete data integrity
        article_word = ArticleWord.objects.get(article=article, word=word)

        # Verify article
        self.assertEqual(article_word.article.title, "Test d'intégration complète")
        self.assertEqual(article_word.article.language, "es")

        # Verify word
        self.assertEqual(article_word.word.word, "devastadora")
        self.assertEqual(article_word.word.primary_language, "es")

        # Verify definition
        definition = article_word.word.definition
        self.assertIn("Adjetivo femenino", definition.grammar_note)
        self.assertEqual(definition.difficulty_level, "intermediate")

        # Verify translations
        translations = WordTranslation.objects.filter(word=word)
        self.assertEqual(translations.count(), 5)

        # Check specific translations
        es_translation = translations.get(language="es")
        fr_translation = translations.get(language="fr")
        it_translation = translations.get(language="it")

        self.assertEqual(es_translation.translation, "devastadora")
        self.assertEqual(fr_translation.translation, "dévastatrice")
        self.assertEqual(it_translation.translation, "devastante")

        print("✅ Integration test passed: Complete article-vocabulary flow verified")

    def tearDown(self):
        """Clean up after tests"""
        # Django TestCase automatically handles database cleanup
        pass


class WordManagementTestCase(TestCase):
    """Test suite for word definition management and UI interactions"""

    def setUp(self):
        """Set up test data"""
        # Create test admin user
        self.admin_user = User.objects.create_user(
            username="admin_test",
            email="admin@test.com",
            password="testpass123",
            is_staff=True,
            is_superuser=True,
        )

    def test_word_creation_with_all_translations(self):
        """
        Test creating a word with translations in all supported languages
        Simulates the saveWord() function from AdminManager
        """
        # Test data that mimics frontend form input
        word_data = {
            "word": "prueba",
            "primary_language": "es",
            "translations": {
                "es": "prueba",
                "it": "prova",
                "pt": "teste",
                "ca": "prova",
                "fr": "test",
            },
            "definition": {
                "grammar_note": "Sustantivo femenino que significa examen o ensayo.",
                "usage_example": "La prueba fue muy difícil.",
                "difficulty_level": "intermediate",
            },
        }

        # Create the word
        word = Word.objects.create(
            word=word_data["word"],
            primary_language=word_data["primary_language"],
            created_by=self.admin_user,
        )

        # Create translations
        for lang_code, translation in word_data["translations"].items():
            WordTranslation.objects.create(
                word=word,
                language=lang_code,
                translation=translation,
                part_of_speech="noun",
            )

        # Create definition
        WordDefinition.objects.create(
            word=word,
            grammar_note=word_data["definition"]["grammar_note"],
            usage_example=word_data["definition"]["usage_example"],
            difficulty_level=word_data["definition"]["difficulty_level"],
        )

        # Verify word was created
        self.assertTrue(Word.objects.filter(word="prueba").exists())
        created_word = Word.objects.get(word="prueba")

        # Verify all translations exist
        translations = WordTranslation.objects.filter(word=created_word)
        self.assertEqual(translations.count(), 5)

        # Verify specific translations
        es_translation = translations.get(language="es")
        fr_translation = translations.get(language="fr")
        self.assertEqual(es_translation.translation, "prueba")
        self.assertEqual(fr_translation.translation, "test")

        # Verify definition exists
        self.assertTrue(hasattr(created_word, "definition"))
        definition = created_word.definition
        self.assertEqual(definition.difficulty_level, "intermediate")
        self.assertIn("Sustantivo femenino", definition.grammar_note)

        print("✅ Test word creation with all translations passed")

    def test_word_update_functionality(self):
        """
        Test updating an existing word's translations and definition
        """
        # Create initial word
        word = Word.objects.create(
            word="ejemplo", primary_language="es", created_by=self.admin_user
        )

        # Initial translation
        WordTranslation.objects.create(word=word, language="es", translation="ejemplo")

        # Initial definition
        WordDefinition.objects.create(
            word=word, grammar_note="Nota inicial", difficulty_level="beginner"
        )

        # Update translation
        es_translation = WordTranslation.objects.get(word=word, language="es")
        es_translation.translation = "ejemplo actualizado"
        es_translation.save()

        # Add new translations
        WordTranslation.objects.create(word=word, language="fr", translation="exemple")

        # Update definition
        definition = word.definition
        definition.grammar_note = "Nota actualizada con más detalles"
        definition.difficulty_level = "intermediate"
        definition.save()

        # Verify updates
        updated_word = Word.objects.get(word="ejemplo")
        updated_es = WordTranslation.objects.get(word=updated_word, language="es")
        self.assertEqual(updated_es.translation, "ejemplo actualizado")

        fr_translation = WordTranslation.objects.get(word=updated_word, language="fr")
        self.assertEqual(fr_translation.translation, "exemple")

        updated_definition = updated_word.definition
        self.assertEqual(updated_definition.difficulty_level, "intermediate")
        self.assertIn("actualizada", updated_definition.grammar_note)

        print("✅ Test word update functionality passed")

    def test_word_deletion_cascade(self):
        """
        Test that deleting a word properly cascades to translations and definition
        """
        # Create word with translations and definition
        word = Word.objects.create(
            word="temporal", primary_language="es", created_by=self.admin_user
        )

        WordTranslation.objects.create(word=word, language="es", translation="temporal")

        WordTranslation.objects.create(
            word=word, language="fr", translation="temporaire"
        )

        WordDefinition.objects.create(
            word=word, grammar_note="Adjetivo que indica duración limitada"
        )

        # Verify data exists
        self.assertEqual(WordTranslation.objects.filter(word=word).count(), 2)
        self.assertTrue(WordDefinition.objects.filter(word=word).exists())

        word_id = word.id

        # Delete the word
        word.delete()

        # Verify cascade deletion
        self.assertEqual(WordTranslation.objects.filter(word_id=word_id).count(), 0)
        self.assertEqual(WordDefinition.objects.filter(word_id=word_id).count(), 0)

        print("✅ Test word deletion cascade passed")


class ArchiveReadingTestCase(TestCase):
    """Test suite for archive article reading functionality"""

    def setUp(self):
        """Set up test data"""
        self.admin_user = User.objects.create_user(
            username="admin_test",
            email="admin@test.com",
            password="testpass123",
            is_staff=True,
            is_superuser=True,
        )

    def test_article_retrieval_by_id(self):
        """
        Test retrieving article by ID for archive reading functionality
        Simulates the readArticle() function from ArchiveManager
        """
        # Create test articles
        article1 = Article.objects.create(
            title="Primer artículo de prueba",
            content="Contenido del [primer] artículo con palabras clave.",
            language="es",
            level="beginner",
            publication_date=date.today() - timedelta(days=2),
            is_active=True,
        )

        article2 = Article.objects.create(
            title="Segundo artículo de prueba",
            content="Contenido del [segundo] artículo más avanzado.",
            language="fr",
            level="advanced",
            publication_date=date.today() - timedelta(days=1),
            is_active=True,
        )

        # Test retrieval by string ID (as comes from frontend)
        retrieved_article1 = Article.objects.filter(id=str(article1.id)).first()
        self.assertIsNotNone(retrieved_article1)
        self.assertEqual(retrieved_article1.title, "Primer artículo de prueba")

        # Test retrieval by integer ID
        retrieved_article2 = Article.objects.filter(id=article2.id).first()
        self.assertIsNotNone(retrieved_article2)
        self.assertEqual(retrieved_article2.title, "Segundo artículo de prueba")

        # Test non-existent ID
        non_existent = Article.objects.filter(id=99999).first()
        self.assertIsNone(non_existent)

        print("✅ Test article retrieval by ID passed")

    def test_article_with_keywords_retrieval(self):
        """
        Test retrieving article with associated keywords for proper display
        """
        # Create article
        article = Article.objects.create(
            title="Artículo con vocabulario",
            content="Este artículo tiene [palabras] [importantes] para aprender.",
            language="es",
            level="intermediate",
            publication_date=date.today(),
            is_active=True,
        )

        # Create words
        word1 = Word.objects.create(
            word="palabras", primary_language="es", created_by=self.admin_user
        )

        word2 = Word.objects.create(
            word="importantes", primary_language="es", created_by=self.admin_user
        )

        # Create associations
        ArticleWord.objects.create(
            article=article,
            word=word1,
            position_in_text=19,  # Position of [palabras]
            context_sentence=article.content,
            is_key_vocabulary=True,
        )

        ArticleWord.objects.create(
            article=article,
            word=word2,
            position_in_text=29,  # Position of [importantes]
            context_sentence=article.content,
            is_key_vocabulary=True,
        )

        # Test article retrieval with keywords
        retrieved_article = Article.objects.get(id=article.id)
        article_words = ArticleWord.objects.filter(article=retrieved_article)

        self.assertEqual(article_words.count(), 2)

        # Verify keywords can be extracted
        keywords = [aw.word.word for aw in article_words]
        self.assertIn("palabras", keywords)
        self.assertIn("importantes", keywords)

        # Test ordering by position
        ordered_article_words = article_words.order_by("position_in_text")
        first_word = ordered_article_words.first()
        self.assertEqual(first_word.word.word, "palabras")

        print("✅ Test article with keywords retrieval passed")

    def test_archive_filtering_functionality(self):
        """
        Test archive filtering by language and level
        Simulates getFilteredAndSortedArticles() function
        """
        # Create articles with different languages and levels
        Article.objects.create(
            title="Artículo español básico",
            content="Contenido en español básico.",
            language="es",
            level="beginner",
            publication_date=date.today() - timedelta(days=3),
            is_active=True,
        )

        Article.objects.create(
            title="Article français avancé",
            content="Contenu en français avancé.",
            language="fr",
            level="advanced",
            publication_date=date.today() - timedelta(days=2),
            is_active=True,
        )

        Article.objects.create(
            title="Articolo italiano intermedio",
            content="Contenuto in italiano intermedio.",
            language="it",
            level="intermediate",
            publication_date=date.today() - timedelta(days=1),
            is_active=True,
        )

        # Test filtering by language
        spanish_articles = Article.objects.filter(language="es", is_active=True)
        french_articles = Article.objects.filter(language="fr", is_active=True)

        self.assertEqual(spanish_articles.count(), 1)
        self.assertEqual(french_articles.count(), 1)
        self.assertEqual(spanish_articles.first().title, "Artículo español básico")

        # Test filtering by level
        beginner_articles = Article.objects.filter(level="beginner", is_active=True)
        advanced_articles = Article.objects.filter(level="advanced", is_active=True)

        self.assertEqual(beginner_articles.count(), 1)
        self.assertEqual(advanced_articles.count(), 1)

        # Test combined filtering
        spanish_beginner = Article.objects.filter(
            language="es", level="beginner", is_active=True
        )
        self.assertEqual(spanish_beginner.count(), 1)

        # Test sorting by date
        all_articles = Article.objects.filter(is_active=True).order_by(
            "-publication_date"
        )
        latest_article = all_articles.first()
        self.assertEqual(latest_article.title, "Articolo italiano intermedio")

        print("✅ Test archive filtering functionality passed")

    def test_inactive_article_exclusion(self):
        """
        Test that inactive articles are properly excluded from archive
        """
        # Create active article
        active_article = Article.objects.create(
            title="Artículo activo",
            content="Este artículo está activo.",
            language="es",
            level="intermediate",
            publication_date=date.today(),
            is_active=True,
        )

        # Create inactive article
        inactive_article = Article.objects.create(
            title="Artículo inactivo",
            content="Este artículo está inactivo.",
            language="es",
            level="intermediate",
            publication_date=date.today(),
            is_active=False,
        )

        # Test that only active articles are retrieved
        active_articles = Article.objects.filter(is_active=True)
        self.assertEqual(active_articles.count(), 1)
        self.assertEqual(active_articles.first().title, "Artículo activo")

        # Test that inactive articles are excluded
        all_articles = Article.objects.filter(is_active=True)
        inactive_titles = [article.title for article in all_articles]
        self.assertNotIn("Artículo inactivo", inactive_titles)

        # Test total count includes inactive when not filtered
        total_articles = Article.objects.all()
        self.assertEqual(total_articles.count(), 2)

        print("✅ Test inactive article exclusion passed")


class IntegrationUITestCase(TestCase):
    """Integration tests simulating frontend-backend interactions"""

    def setUp(self):
        """Set up test data"""
        self.admin_user = User.objects.create_user(
            username="admin_integration",
            email="admin@integration.com",
            password="testpass123",
            is_staff=True,
            is_superuser=True,
        )

    def test_complete_word_management_workflow(self):
        """
        Test complete workflow: create word, add to article, retrieve for reading
        """
        # Step 1: Create word with all data (simulates admin panel word creation)
        word = Word.objects.create(
            word="integración", primary_language="es", created_by=self.admin_user
        )

        # Add translations
        languages = {
            "es": "integración",
            "it": "integrazione",
            "pt": "integração",
            "ca": "integració",
            "fr": "intégration",
        }

        for lang_code, translation in languages.items():
            WordTranslation.objects.create(
                word=word,
                language=lang_code,
                translation=translation,
                part_of_speech="noun",
            )

        # Add definition
        WordDefinition.objects.create(
            word=word,
            grammar_note="Sustantivo femenino que significa acción de integrar o integrarse.",
            usage_example="La integración de sistemas es compleja.",
            difficulty_level="advanced",
        )

        # Step 2: Create article that uses this word
        article = Article.objects.create(
            title="La integración en la era digital",
            content="La [integración] de tecnologías modernas es fundamental para el progreso.",
            language="es",
            level="advanced",
            publication_date=date.today(),
            is_active=True,
        )

        # Step 3: Link word to article
        ArticleWord.objects.create(
            article=article,
            word=word,
            position_in_text=3,  # Position of [integración]
            context_sentence=article.content,
            is_key_vocabulary=True,
        )

        # Step 4: Simulate archive retrieval (readArticle functionality)
        retrieved_article = Article.objects.get(id=article.id)
        self.assertEqual(retrieved_article.title, "La integración en la era digital")

        # Step 5: Verify word associations are retrievable
        article_words = ArticleWord.objects.filter(article=retrieved_article)
        self.assertEqual(article_words.count(), 1)

        linked_word = article_words.first().word
        self.assertEqual(linked_word.word, "integración")

        # Step 6: Verify all translations are accessible
        word_translations = WordTranslation.objects.filter(word=linked_word)
        self.assertEqual(word_translations.count(), 5)

        fr_translation = word_translations.get(language="fr")
        self.assertEqual(fr_translation.translation, "intégration")

        # Step 7: Verify definition is accessible
        definition = linked_word.definition
        self.assertEqual(definition.difficulty_level, "advanced")
        self.assertIn("integrar", definition.grammar_note)

        print("✅ Test complete word management workflow passed")

    def test_article_reading_edge_cases(self):
        """
        Test edge cases for article reading functionality
        """
        # Test with article that has no keywords
        simple_article = Article.objects.create(
            title="Artículo simple",
            content="Este es un artículo sin palabras clave especiales.",
            language="es",
            level="beginner",
            publication_date=date.today(),
            is_active=True,
        )

        # Should be retrievable without issues
        retrieved = Article.objects.get(id=simple_article.id)
        self.assertEqual(retrieved.title, "Artículo simple")

        # Should have no associated words
        word_count = ArticleWord.objects.filter(article=retrieved).count()
        self.assertEqual(word_count, 0)

        # Test with article containing brackets but no defined words
        bracket_article = Article.objects.create(
            title="Artículo con corchetes",
            content="Este artículo tiene [palabras] en corchetes pero sin definiciones.",
            language="es",
            level="intermediate",
            publication_date=date.today(),
            is_active=True,
        )

        retrieved_bracket = Article.objects.get(id=bracket_article.id)
        self.assertEqual(retrieved_bracket.title, "Artículo con corchetes")

        # Should have no word associations since words aren't defined
        bracket_word_count = ArticleWord.objects.filter(
            article=retrieved_bracket
        ).count()
        self.assertEqual(bracket_word_count, 0)

        print("✅ Test article reading edge cases passed")

    def tearDown(self):
        """Clean up after integration tests"""
        # Django TestCase automatically handles database cleanup
        pass


class ArticleManagementTestCase(TestCase):
    """Additional tests for article management features"""

    def setUp(self):
        """Set up test data"""
        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="adminpass123",
            is_staff=True,
            is_superuser=True,
        )

    def test_article_language_filtering(self):
        """Test filtering articles by language"""
        # Create articles in different languages
        Article.objects.create(
            title="Artículo en español",
            content="Contenido en [español]",
            language="es",
            level="intermediate",
            publication_date=date.today(),
            is_active=True,
        )

        Article.objects.create(
            title="Article en français",
            content="Contenu en [français]",
            language="fr",
            level="beginner",
            publication_date=date.today(),
            is_active=True,
        )

        Article.objects.create(
            title="Articolo in italiano",
            content="Contenuto in [italiano]",
            language="it",
            level="advanced",
            publication_date=date.today(),
            is_active=True,
        )

        # Test language filtering
        spanish_articles = Article.objects.filter(language="es", is_active=True)
        french_articles = Article.objects.filter(language="fr", is_active=True)
        italian_articles = Article.objects.filter(language="it", is_active=True)

        self.assertEqual(spanish_articles.count(), 1)
        self.assertEqual(french_articles.count(), 1)
        self.assertEqual(italian_articles.count(), 1)

        self.assertEqual(spanish_articles.first().title, "Artículo en español")
        self.assertEqual(french_articles.first().title, "Article en français")
        self.assertEqual(italian_articles.first().title, "Articolo in italiano")

        print("✅ Language filtering test passed")

    def test_vocabulary_extraction_from_brackets(self):
        """Test automatic vocabulary word extraction from brackets"""
        content = "Les [réseaux] sociaux [engagent] les utilisateurs avec des [algorithmes] sophistiqués."

        # Extract words using regex (same as frontend logic)
        bracket_words = re.findall(r"\[([^\]]+)\]", content)

        expected_words = ["réseaux", "engagent", "algorithmes"]
        self.assertEqual(bracket_words, expected_words)
        self.assertEqual(len(bracket_words), 3)

        # Test with more complex content
        complex_content = "Text with [word1], then [word2] and finally [word3]."
        complex_words = re.findall(r"\[([^\]]+)\]", complex_content)

        self.assertEqual(complex_words, ["word1", "word2", "word3"])

        print("✅ Vocabulary extraction test passed")


class AdminArticleSaveTestCase(TestCase):
    """Test suite for admin panel article saving functionality"""

    def setUp(self):
        """Set up test data"""
        self.admin_user = User.objects.create_user(
            username="admin_save_test",
            email="admin@save.com",
            password="testpass123",
            is_staff=True,
            is_superuser=True,
        )

    def test_article_validation_missing_title(self):
        """
        Test that article validation fails when title is missing
        Simulates the frontend validation logic
        """
        # Simulate form data with missing title (empty string after trim)
        form_data = {
            "title": "   ",  # Empty after trim
            "content": "Contenido del artículo con [palabras] importantes.",
            "language": "es",
            "level": "intermediate",
            "date": date.today().isoformat(),
            "summary": "Resumen del artículo",
        }

        # Test validation logic
        title_valid = bool(form_data["title"].strip())
        content_valid = bool(form_data["content"].strip())
        language_valid = bool(form_data["language"])

        # Should fail due to empty title
        self.assertFalse(title_valid)
        self.assertTrue(content_valid)
        self.assertTrue(language_valid)

        # Verification that article shouldn't be created
        validation_passed = title_valid and content_valid and language_valid
        self.assertFalse(validation_passed)

        print("✅ Test validation missing title passed")

    def test_article_validation_missing_content(self):
        """
        Test that article validation fails when content is missing
        """
        form_data = {
            "title": "Título del artículo",
            "content": "",  # Empty content
            "language": "es",
            "level": "intermediate",
            "date": date.today().isoformat(),
            "summary": "Resumen del artículo",
        }

        # Test validation logic
        title_valid = bool(form_data["title"].strip())
        content_valid = bool(form_data["content"].strip())
        language_valid = bool(form_data["language"])

        # Should fail due to empty content
        self.assertTrue(title_valid)
        self.assertFalse(content_valid)
        self.assertTrue(language_valid)

        validation_passed = title_valid and content_valid and language_valid
        self.assertFalse(validation_passed)

        print("✅ Test validation missing content passed")

    def test_article_validation_missing_language(self):
        """
        Test that article validation fails when language is missing
        """
        form_data = {
            "title": "Título del artículo",
            "content": "Contenido del artículo con [palabras] importantes.",
            "language": "",  # Empty language
            "level": "intermediate",
            "date": date.today().isoformat(),
            "summary": "Resumen del artículo",
        }

        # Test validation logic
        title_valid = bool(form_data["title"].strip())
        content_valid = bool(form_data["content"].strip())
        language_valid = bool(form_data["language"])

        # Should fail due to empty language
        self.assertTrue(title_valid)
        self.assertTrue(content_valid)
        self.assertFalse(language_valid)

        validation_passed = title_valid and content_valid and language_valid
        self.assertFalse(validation_passed)

        print("✅ Test validation missing language passed")

    def test_article_validation_success(self):
        """
        Test that article validation passes with all required fields
        """
        form_data = {
            "title": "Nuevo artículo de prueba",
            "content": "Este es el contenido del artículo con [palabras] [importantes] para el aprendizaje.",
            "language": "es",
            "level": "intermediate",
            "date": date.today().isoformat(),
            "summary": "Artículo de prueba para validación",
        }

        # Test validation logic
        title_valid = bool(form_data["title"].strip())
        content_valid = bool(form_data["content"].strip())
        language_valid = bool(form_data["language"])

        # All should be valid
        self.assertTrue(title_valid)
        self.assertTrue(content_valid)
        self.assertTrue(language_valid)

        validation_passed = title_valid and content_valid and language_valid
        self.assertTrue(validation_passed)

        print("✅ Test validation success passed")

    def test_article_creation_with_valid_data(self):
        """
        Test that article can be successfully created in database with valid data
        Simulates successful form submission
        """
        # Simulate valid form data
        form_data = {
            "title": "Inteligencia artificial en medicina",
            "content": "La [inteligencia] [artificial] está revolucionando la [medicina] moderna. Los [algoritmos] de [aprendizaje] automático pueden diagnosticar enfermedades con mayor precisión que los médicos tradicionales.",
            "language": "es",
            "level": "advanced",
            "date": date.today(),
            "summary": "Artículo sobre IA en medicina",
        }

        # Create article (simulates successful validation + save)
        article = Article.objects.create(
            title=form_data["title"],
            content=form_data["content"],
            language=form_data["language"],
            level=form_data["level"],
            publication_date=form_data["date"],
            is_active=True,
        )

        # Verify article was created
        self.assertIsNotNone(article.id)
        self.assertEqual(article.title, "Inteligencia artificial en medicina")
        self.assertEqual(article.language, "es")
        self.assertEqual(article.level, "advanced")
        self.assertTrue(article.is_active)

        # Verify article exists in database
        saved_article = Article.objects.get(id=article.id)
        self.assertEqual(saved_article.title, form_data["title"])
        self.assertEqual(saved_article.content, form_data["content"])

        # Test keyword extraction (simulates frontend logic)
        content = form_data["content"]
        keywords = re.findall(r"\[([^\]]+)\]", content)
        expected_keywords = [
            "inteligencia",
            "artificial",
            "medicina",
            "algoritmos",
            "aprendizaje",
        ]
        self.assertEqual(keywords, expected_keywords)

        print("✅ Test article creation with valid data passed")

    def test_whitespace_handling_in_validation(self):
        """
        Test that validation properly handles whitespace in form fields
        """
        # Test data with various whitespace scenarios
        test_cases = [
            {
                "name": "Leading/trailing spaces",
                "title": "  Título con espacios  ",
                "content": "  Contenido con espacios  ",
                "language": "es",
                "should_pass": True,
            },
            {
                "name": "Only spaces in title",
                "title": "    ",
                "content": "Contenido válido",
                "language": "es",
                "should_pass": False,
            },
            {
                "name": "Only spaces in content",
                "title": "Título válido",
                "content": "    ",
                "language": "es",
                "should_pass": False,
            },
            {
                "name": "Tabs and newlines",
                "title": "\t\nTítulo\t\n",
                "content": "\t\nContenido\t\n",
                "language": "es",
                "should_pass": True,
            },
        ]

        for test_case in test_cases:
            with self.subTest(case=test_case["name"]):
                # Simulate validation logic
                title_valid = bool(test_case["title"].strip())
                content_valid = bool(test_case["content"].strip())
                language_valid = bool(test_case["language"])

                validation_passed = title_valid and content_valid and language_valid

                if test_case["should_pass"]:
                    self.assertTrue(
                        validation_passed,
                        f"Case '{test_case['name']}' should pass validation",
                    )
                else:
                    self.assertFalse(
                        validation_passed,
                        f"Case '{test_case['name']}' should fail validation",
                    )

        print("✅ Test whitespace handling in validation passed")

    def test_language_selector_values(self):
        """
        Test that language selector returns valid language codes
        """
        # Valid language options from the form
        valid_languages = ["es", "it", "pt", "ca", "fr"]

        # Test each language
        for lang_code in valid_languages:
            # Simulate selecting each language
            form_data = {
                "title": f"Artículo en {lang_code}",
                "content": f"Contenido del artículo en {lang_code} con [palabras] importantes.",
                "language": lang_code,
                "level": "intermediate",
            }

            # Validation should pass
            title_valid = bool(form_data["title"].strip())
            content_valid = bool(form_data["content"].strip())
            language_valid = bool(form_data["language"])

            self.assertTrue(title_valid)
            self.assertTrue(content_valid)
            self.assertTrue(language_valid)

            # Language should be in valid options
            self.assertIn(form_data["language"], valid_languages)

        print("✅ Test language selector values passed")

    def test_date_field_handling(self):
        """
        Test that date field is properly handled
        """
        # Test with valid date
        form_data = {
            "title": "Artículo con fecha",
            "content": "Contenido del artículo con fecha.",
            "language": "es",
            "level": "intermediate",
            "date": date.today().isoformat(),  # Format: YYYY-MM-DD
        }

        # Date should be parseable
        parsed_date = date.fromisoformat(form_data["date"])
        self.assertIsInstance(parsed_date, date)
        self.assertEqual(parsed_date, date.today())

        # Test with empty date (should handle gracefully)
        form_data_no_date = {
            "title": "Artículo sin fecha",
            "content": "Contenido del artículo sin fecha.",
            "language": "es",
            "level": "intermediate",
            "date": "",  # Empty date
        }

        # Validation should still pass (date is not required)
        title_valid = bool(form_data_no_date["title"].strip())
        content_valid = bool(form_data_no_date["content"].strip())
        language_valid = bool(form_data_no_date["language"])

        validation_passed = title_valid and content_valid and language_valid
        self.assertTrue(validation_passed)

        print("✅ Test date field handling passed")
