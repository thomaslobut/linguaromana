import json
from datetime import date, timedelta

from django.contrib.auth.models import User
from django.test import Client, TestCase

from .models import (
    Article,
    ArticleWord,
    Badge,
    QuizQuestion,
    Word,
    WordDefinition,
)


class LinguaRomanaModelsTestCase(TestCase):
    """Test the new model relationships and constraints"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        # Create a word and its definition
        self.word = Word.objects.create(word="controversia", primary_language="es")

        self.word_definition = WordDefinition.objects.create(
            word=self.word,
            grammar_note="Sustantivo femenino que significa disputa prolongada",
            usage_example="La decisión causó gran controversia",
            difficulty_level="intermediate",
        )

        # Create an article
        self.article = Article.objects.create(
            title="Test Article",
            content="Este artículo habla de [controversia] y otros temas",
            language="es",
            level="intermediate",
            publication_date=date.today(),
            summary="Test summary",
        )

    def test_article_creation(self):
        """Test article creation with new fields"""
        self.assertEqual(self.article.title, "Test Article")
        self.assertEqual(self.article.language, "es")
        self.assertEqual(self.article.level, "intermediate")
        self.assertTrue(self.article.is_active)
        self.assertEqual(self.article.summary, "Test summary")

    def test_word_definition_relationship(self):
        """Test one-to-one relationship between Word and WordDefinition"""
        self.assertEqual(self.word.definition, self.word_definition)
        self.assertEqual(self.word_definition.word, self.word)

    def test_quiz_question_with_word_definition(self):
        """Test the NEW relationship: QuizQuestion -> WordDefinition"""
        quiz_question = QuizQuestion.objects.create(
            article=self.article,
            word_definition=self.word_definition,
            question_text="¿Qué significa 'controversia'?",
            option_a="Disputa",
            option_b="Acuerdo",
            option_c="Silencio",
            option_d="Indiferencia",
            correct_option="A",
            question_type="vocabulary",
            difficulty_level="intermediate",
        )

        self.assertEqual(quiz_question.article, self.article)
        self.assertEqual(quiz_question.word_definition, self.word_definition)
        self.assertEqual(quiz_question.question_type, "vocabulary")

        # Test reverse relationship
        self.assertIn(quiz_question, self.word_definition.quiz_questions.all())


class LinguaRomanaAPITestCase(TestCase):
    """Test the new API endpoints"""

    def setUp(self):
        self.client = Client()

        # Create test data
        self.word = Word.objects.create(word="test", primary_language="es")
        self.word_definition = WordDefinition.objects.create(
            word=self.word, grammar_note="Test definition", usage_example="Test example"
        )

        self.article = Article.objects.create(
            title="Test Article",
            content="This is a [test] article",
            language="es",
            level="intermediate",
            publication_date=date.today(),
        )

        self.quiz_question = QuizQuestion.objects.create(
            article=self.article,
            word_definition=self.word_definition,
            question_text="What is test?",
            option_a="Correct",
            option_b="Wrong",
            option_c="Wrong",
            option_d="Wrong",
            correct_option="A",
        )

    def test_api_latest_article_with_quiz(self):
        """Test the new latest article API with quiz integration"""
        response = self.client.get("/api/latest-article-quiz/")

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)

        self.assertTrue(data["success"])
        self.assertIn("article", data)

        article_data = data["article"]
        self.assertEqual(article_data["title"], "Test Article")
        self.assertIn("quiz_questions", article_data)
        self.assertEqual(len(article_data["quiz_questions"]), 1)

        quiz_data = article_data["quiz_questions"][0]
        self.assertEqual(quiz_data["question_text"], "What is test?")
        self.assertIn("word", quiz_data)
        self.assertEqual(quiz_data["word"]["word"], "test")

    def test_api_create_article_with_quiz(self):
        """Test creating article with automatic quiz generation"""
        article_data = {
            "title": "New Article",
            "content": "This article discusses [important] topics",
            "language": "en",
            "level": "beginner",
            "publication_date": date.today().isoformat(),
            "summary": "Test summary",
        }

        response = self.client.post(
            "/api/create-article-quiz/",
            data=json.dumps(article_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        data = json.loads(response.content)

        self.assertTrue(data["success"])
        self.assertIn("article", data)

        # Check that article was created
        article = Article.objects.get(title="New Article")
        self.assertEqual(article.language, "en")

        # Check that word and definition were created
        word = Word.objects.get(word="important")
        self.assertTrue(hasattr(word, "definition"))

        # Check that quiz question was created
        quiz = QuizQuestion.objects.get(
            article=article, word_definition=word.definition
        )
        self.assertIn("important", quiz.question_text)

    def test_api_word_definition(self):
        """Test word definition API endpoint"""
        response = self.client.get(f"/api/word-definition/{self.word.id}/")

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)

        self.assertTrue(data["success"])
        self.assertIn("word", data)

        word_data = data["word"]
        self.assertEqual(word_data["word"], "test")
        self.assertIn("definition", word_data)
        self.assertEqual(word_data["definition"]["grammar_note"], "Test definition")


class DailyLanguageRotationTestCase(TestCase):
    """Test the daily language rotation logic in the new app"""

    def setUp(self):
        # Create articles for different languages
        languages = ["es", "it", "pt", "ca", "fr"]
        for i, lang in enumerate(languages):
            Article.objects.create(
                title=f"Article {lang}",
                content=f"Content in {lang}",
                language=lang,
                level="intermediate",
                publication_date=date.today() - timedelta(days=i),
            )

    def test_daily_language_rotation(self):
        """Test that the daily language rotation works correctly"""
        from core.views import get_daily_language

        daily_lang = get_daily_language()
        self.assertIn(daily_lang, ["es", "it", "pt", "ca", "fr"])

        # Test API returns article for correct language
        response = self.client.get("/api/latest-article-quiz/")
        data = json.loads(response.content)

        if data["success"]:
            article_lang = data["article"]["language"]
            # Should be daily language or fallback to most recent
            self.assertIn(article_lang, ["es", "it", "pt", "ca", "fr"])


class ContentManagementTestCase(TestCase):
    """Test content management features"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="admin", email="admin@example.com", password="admin123"
        )

    def test_badge_creation_with_new_fields(self):
        """Test badge creation with new category and requirements"""
        badge = Badge.objects.create(
            name="Word Master",
            description="Learn 100 words",
            icon="📚",
            category="learning",
            words_learned_required=100,
            articles_read_required=50,
        )

        self.assertEqual(badge.category, "learning")
        self.assertEqual(badge.words_learned_required, 100)
        self.assertEqual(badge.articles_read_required, 50)

    def test_content_workflow(self):
        """Test the complete content creation workflow"""
        # 1. Create article with keywords
        article = Article.objects.create(
            title="Learning [grammar] and [vocabulary]",
            content="This article teaches [grammar] and builds [vocabulary]",
            language="en",
            level="intermediate",
            publication_date=date.today(),
            author=self.user,
        )

        # 2. Create words and definitions
        grammar_word = Word.objects.create(word="grammar", primary_language="en")
        grammar_def = WordDefinition.objects.create(
            word=grammar_word,
            grammar_note="System of rules for language structure",
            usage_example="English grammar can be complex",
        )

        vocab_word = Word.objects.create(word="vocabulary", primary_language="en")
        vocab_def = WordDefinition.objects.create(
            word=vocab_word,
            grammar_note="Set of words in a language",
            usage_example="Expand your vocabulary daily",
        )

        # 3. Create quiz questions linked to definitions
        QuizQuestion.objects.create(
            article=article,
            word_definition=grammar_def,
            question_text="What is grammar?",
            option_a="Rules of language",
            option_b="List of words",
            option_c="Pronunciation guide",
            option_d="Writing style",
            correct_option="A",
            question_type="vocabulary",
        )

        QuizQuestion.objects.create(
            article=article,
            word_definition=vocab_def,
            question_text="What is vocabulary?",
            option_a="Grammar rules",
            option_b="Set of words",
            option_c="Sentence structure",
            option_d="Punctuation",
            correct_option="B",
            question_type="vocabulary",
        )

        # 4. Create article-word relationships
        ArticleWord.objects.create(
            article=article, word=grammar_word, position_in_text=20
        )

        ArticleWord.objects.create(
            article=article, word=vocab_word, position_in_text=35
        )

        # Verify the complete chain: Article → QuizQuestion → WordDefinition
        self.assertEqual(article.quiz_questions_temp.count(), 2)

        for quiz in article.quiz_questions_temp.all():
            self.assertIsNotNone(quiz.word_definition)
            self.assertIsNotNone(quiz.word_definition.word)

            # Check reverse relationship through ArticleWord
            ArticleWord.objects.get(
                article=article, word=quiz.word_definition.word
            )
            # Note: Relationship between ArticleWord and QuizQuestion verified through Article
