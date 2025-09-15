"""
Tests pour le nouveau modèle UnifiedArticle qui remplace les 5 modèles séparés.

Ces tests vérifient que le modèle unifié maintient toutes les fonctionnalités
des modèles originaux.
"""

import json
from datetime import date, timedelta
from unittest.mock import patch

from core.models import (
    LANGUAGE_CHOICES,
    LEVEL_CHOICES,
    UnifiedArticle,
    Word,
    WordDefinition,
)
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.test import Client, TestCase


class UnifiedArticleBasicTestCase(TestCase):
    """Test basic UnifiedArticle functionality"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )

    def test_unified_article_creation(self):
        """Test basic unified article creation"""
        article = UnifiedArticle.objects.create(
            title="Unified Test Article",
            content="This is a unified test article content",
            language="es",
            level="intermediate",
            publication_date=date.today(),
            author=self.user,
            summary="Unified test summary",
            tags="unified,test,article",
        )

        self.assertEqual(article.title, "Unified Test Article")
        self.assertEqual(article.content, "This is a unified test article content")
        self.assertEqual(article.language, "es")
        self.assertEqual(article.level, "intermediate")
        self.assertEqual(article.author, self.user)
        self.assertEqual(article.summary, "Unified test summary")
        self.assertEqual(article.tags, "unified,test,article")
        self.assertTrue(article.is_active)

    def test_unified_article_str_representation(self):
        """Test UnifiedArticle string representation"""
        article = UnifiedArticle.objects.create(
            title="Spanish Unified Article",
            content="Content",
            language="es",
            level="beginner",
            publication_date=date.today(),
        )
        self.assertEqual(str(article), "Spanish Unified Article (es)")

    def test_unified_article_properties_empty(self):
        """Test UnifiedArticle properties when no quiz/grammar data exists"""
        article = UnifiedArticle.objects.create(
            title="Empty Unified Article",
            content="Content",
            language="fr",
            level="advanced",
            publication_date=date.today(),
        )

        self.assertFalse(article.has_quiz)
        self.assertFalse(article.has_grammar_note)
        self.assertFalse(article.has_detailed_grammar_notes)
        self.assertFalse(article.is_complete)

    def test_unified_article_ordering(self):
        """Test UnifiedArticle ordering by publication_date descending"""
        old_article = UnifiedArticle.objects.create(
            title="Old Unified Article",
            content="Content",
            language="es",
            level="beginner",
            publication_date=date.today() - timedelta(days=5),
        )

        new_article = UnifiedArticle.objects.create(
            title="New Unified Article",
            content="Content",
            language="es",
            level="beginner",
            publication_date=date.today(),
        )

        articles = list(UnifiedArticle.objects.all())
        self.assertEqual(articles[0], new_article)
        self.assertEqual(articles[1], old_article)


class UnifiedArticleQuizTestCase(TestCase):
    """Test quiz functionality in UnifiedArticle"""

    def setUp(self):
        self.article = UnifiedArticle.objects.create(
            title="Quiz Test Article",
            content="Content for quiz",
            language="pt",
            level="intermediate",
            publication_date=date.today(),
            quiz_title="Portuguese Quiz",
            quiz_description="Test your Portuguese knowledge",
            quiz_passing_score=80,
            quiz_time_limit=30,
        )

        self.word = Word.objects.create(word="test", primary_language="pt")
        self.word_definition = WordDefinition.objects.create(
            word=self.word, grammar_note="Test definition", usage_example="Test example"
        )

    def test_quiz_properties_with_data(self):
        """Test quiz properties when quiz data exists"""
        self.assertEqual(self.article.quiz_title, "Portuguese Quiz")
        self.assertEqual(
            self.article.quiz_description, "Test your Portuguese knowledge"
        )
        self.assertEqual(self.article.quiz_passing_score, 80)
        self.assertEqual(self.article.quiz_time_limit, 30)
        self.assertTrue(self.article.quiz_is_active)

    def test_add_quiz_question(self):
        """Test adding quiz questions"""
        question_data = self.article.add_quiz_question(
            word_definition=self.word_definition,
            question_text="What does 'test' mean?",
            option_a="Examination",
            option_b="Play",
            option_c="Work",
            option_d="Study",
            correct_option="A",
            points=15,
            question_type="vocabulary",
        )

        self.assertTrue(self.article.has_quiz)
        self.assertEqual(len(self.article.quiz_questions_data), 1)

        question = self.article.quiz_questions_data[0]
        self.assertEqual(question["word_definition_id"], self.word_definition.id)
        self.assertEqual(question["question_text"], "What does 'test' mean?")
        self.assertEqual(question["option_a"], "Examination")
        self.assertEqual(question["correct_option"], "A")
        self.assertEqual(question["points"], 15)
        self.assertEqual(question["question_type"], "vocabulary")

    def test_update_existing_quiz_question(self):
        """Test updating an existing quiz question for the same word"""
        # Add first question
        self.article.add_quiz_question(
            word_definition=self.word_definition,
            question_text="Original question",
            option_a="A",
            option_b="B",
            option_c="C",
            option_d="D",
            correct_option="A",
        )

        # Update same word question
        self.article.add_quiz_question(
            word_definition=self.word_definition,
            question_text="Updated question",
            option_a="A_updated",
            option_b="B_updated",
            option_c="C_updated",
            option_d="D_updated",
            correct_option="B",
        )

        # Should still have only one question
        self.assertEqual(len(self.article.quiz_questions_data), 1)

        question = self.article.quiz_questions_data[0]
        self.assertEqual(question["question_text"], "Updated question")
        self.assertEqual(question["option_a"], "A_updated")
        self.assertEqual(question["correct_option"], "B")

    def test_remove_quiz_question(self):
        """Test removing a quiz question"""
        self.article.add_quiz_question(
            word_definition=self.word_definition,
            question_text="To be removed",
            option_a="A",
            option_b="B",
            option_c="C",
            option_d="D",
            correct_option="A",
        )

        self.assertEqual(len(self.article.quiz_questions_data), 1)

        self.article.remove_quiz_question(self.word_definition.id)
        self.assertEqual(len(self.article.quiz_questions_data), 0)
        self.assertFalse(self.article.has_quiz)

    def test_get_quiz_question(self):
        """Test getting a specific quiz question"""
        self.article.add_quiz_question(
            word_definition=self.word_definition,
            question_text="Specific question",
            option_a="A",
            option_b="B",
            option_c="C",
            option_d="D",
            correct_option="A",
        )

        question = self.article.get_quiz_question(self.word_definition.id)
        self.assertIsNotNone(question)
        self.assertEqual(question["question_text"], "Specific question")

        # Test non-existent question
        non_existent = self.article.get_quiz_question(99999)
        self.assertIsNone(non_existent)

    def test_to_quiz_dict(self):
        """Test converting to quiz dictionary format"""
        self.article.add_quiz_question(
            word_definition=self.word_definition,
            question_text="Test question",
            option_a="A",
            option_b="B",
            option_c="C",
            option_d="D",
            correct_option="A",
        )

        quiz_dict = self.article.to_quiz_dict()

        self.assertEqual(quiz_dict["title"], "Portuguese Quiz")
        self.assertEqual(quiz_dict["description"], "Test your Portuguese knowledge")
        self.assertEqual(quiz_dict["passing_score"], 80)
        self.assertEqual(quiz_dict["time_limit"], 30)
        self.assertEqual(len(quiz_dict["questions"]), 1)


class UnifiedArticleGrammarTestCase(TestCase):
    """Test grammar functionality in UnifiedArticle"""

    def setUp(self):
        self.article = UnifiedArticle.objects.create(
            title="Grammar Test Article",
            content="Content for grammar",
            language="ca",
            level="advanced",
            publication_date=date.today(),
            grammar_title="Catalan Grammar",
            grammar_content="Grammar explanation content",
            grammar_key_concepts="verbs, tenses",
            grammar_learning_objectives="Learn present tense",
            grammar_difficulty_level="advanced",
        )

        self.word = Word.objects.create(word="haver", primary_language="ca")
        self.word_definition = WordDefinition.objects.create(
            word=self.word,
            grammar_note="To have (auxiliary verb)",
            usage_example="He de fer això",
        )

    def test_grammar_properties_with_data(self):
        """Test grammar properties when grammar data exists"""
        self.assertTrue(self.article.has_grammar_note)
        self.assertEqual(self.article.grammar_title, "Catalan Grammar")
        self.assertEqual(self.article.grammar_content, "Grammar explanation content")
        self.assertEqual(self.article.grammar_key_concepts, "verbs, tenses")
        self.assertEqual(
            self.article.grammar_learning_objectives, "Learn present tense"
        )
        self.assertEqual(self.article.grammar_difficulty_level, "advanced")

    def test_add_detailed_grammar_note(self):
        """Test adding detailed grammar notes"""
        note_data = self.article.add_detailed_grammar_note(
            word_definition=self.word_definition,
            title="Auxiliary Verbs",
            content="Detailed explanation of haver usage",
            order=1,
            is_key_concept=True,
        )

        self.assertTrue(self.article.has_detailed_grammar_notes)
        self.assertEqual(len(self.article.detailed_grammar_notes_data), 1)

        note = self.article.detailed_grammar_notes_data[0]
        self.assertEqual(note["word_definition_id"], self.word_definition.id)
        self.assertEqual(note["title"], "Auxiliary Verbs")
        self.assertEqual(note["content"], "Detailed explanation of haver usage")
        self.assertEqual(note["order"], 1)
        self.assertTrue(note["is_key_concept"])

    def test_update_existing_detailed_grammar_note(self):
        """Test updating an existing detailed grammar note"""
        # Add first note
        self.article.add_detailed_grammar_note(
            word_definition=self.word_definition,
            title="Original title",
            content="Original content",
            order=1,
        )

        # Update same word note
        self.article.add_detailed_grammar_note(
            word_definition=self.word_definition,
            title="Updated title",
            content="Updated content",
            order=2,
        )

        # Should still have only one note
        self.assertEqual(len(self.article.detailed_grammar_notes_data), 1)

        note = self.article.detailed_grammar_notes_data[0]
        self.assertEqual(note["title"], "Updated title")
        self.assertEqual(note["content"], "Updated content")
        self.assertEqual(note["order"], 2)

    def test_remove_detailed_grammar_note(self):
        """Test removing a detailed grammar note"""
        self.article.add_detailed_grammar_note(
            word_definition=self.word_definition,
            title="To be removed",
            content="Content",
        )

        self.assertEqual(len(self.article.detailed_grammar_notes_data), 1)

        self.article.remove_detailed_grammar_note(self.word_definition.id)
        self.assertEqual(len(self.article.detailed_grammar_notes_data), 0)
        self.assertFalse(self.article.has_detailed_grammar_notes)

    def test_detailed_grammar_notes_ordering(self):
        """Test ordering of detailed grammar notes"""
        word2 = Word.objects.create(word="estar", primary_language="ca")
        word_def2 = WordDefinition.objects.create(
            word=word2, grammar_note="To be", usage_example="Estic bé"
        )

        # Add notes in different order
        self.article.add_detailed_grammar_note(
            word_definition=word_def2,
            title="B Note",
            content="Content B",
            order=1,
        )

        self.article.add_detailed_grammar_note(
            word_definition=self.word_definition,
            title="A Note",
            content="Content A",
            order=2,
        )

        ordered_notes = self.article.get_detailed_grammar_notes()
        self.assertEqual(ordered_notes[0]["title"], "B Note")  # order=1 first
        self.assertEqual(ordered_notes[1]["title"], "A Note")  # order=2 second

    def test_to_grammar_note_dict(self):
        """Test converting to grammar note dictionary format"""
        grammar_dict = self.article.to_grammar_note_dict()

        self.assertEqual(grammar_dict["title"], "Catalan Grammar")
        self.assertEqual(grammar_dict["content"], "Grammar explanation content")
        self.assertEqual(grammar_dict["key_concepts"], "verbs, tenses")
        self.assertEqual(grammar_dict["learning_objectives"], "Learn present tense")
        self.assertEqual(grammar_dict["difficulty_level"], "advanced")


class UnifiedArticleIntegrationTestCase(TestCase):
    """Test integration and complete functionality of UnifiedArticle"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="integrationuser", password="testpass123"
        )

    def test_complete_unified_article_creation(self):
        """Test creating a complete unified article with all components"""
        # Create complete article
        article = UnifiedArticle.objects.create(
            title="Complete Integration Test",
            content="This article has [complex] grammar rules",
            language="es",
            level="advanced",
            publication_date=date.today(),
            author=self.user,
            summary="Integration test summary",
            quiz_title="Integration Quiz",
            quiz_description="Test all components",
            quiz_passing_score=75,
            grammar_title="Advanced Grammar",
            grammar_content="Complex grammar rules explanation",
            grammar_key_concepts="subjunctive, conditional",
            grammar_learning_objectives="Master advanced tenses",
        )

        # Add words and definitions
        word = Word.objects.create(word="complex", primary_language="es")
        word_definition = WordDefinition.objects.create(
            word=word,
            grammar_note="Adjective meaning complicated",
            usage_example="Es un problema complejo",
        )

        # Add quiz question
        article.add_quiz_question(
            word_definition=word_definition,
            question_text="What does 'complejo' mean?",
            option_a="Complex",
            option_b="Simple",
            option_c="Easy",
            option_d="Basic",
            correct_option="A",
            question_type="vocabulary",
        )

        # Add detailed grammar note
        article.add_detailed_grammar_note(
            word_definition=word_definition,
            title="Adjective Usage",
            content="How to use complex adjectives in Spanish",
            order=1,
            is_key_concept=True,
        )

        # Verify all components work
        self.assertTrue(article.has_quiz)
        self.assertTrue(article.has_grammar_note)
        self.assertTrue(article.has_detailed_grammar_notes)
        self.assertTrue(article.is_complete)

        # Test quiz functionality
        self.assertEqual(len(article.get_quiz_questions()), 1)
        quiz_question = article.get_quiz_question(word_definition.id)
        self.assertEqual(quiz_question["question_text"], "What does 'complejo' mean?")

        # Test grammar functionality
        self.assertEqual(len(article.get_detailed_grammar_notes()), 1)
        grammar_note = article.get_detailed_grammar_note(word_definition.id)
        self.assertEqual(grammar_note["title"], "Adjective Usage")

    def test_to_comprehensive_dict(self):
        """Test converting to comprehensive dictionary format"""
        article = UnifiedArticle.objects.create(
            title="Comprehensive Test",
            content="Content",
            language="fr",
            level="intermediate",
            quiz_title="French Quiz",
            grammar_title="French Grammar",
            grammar_content="Grammar content",
        )

        comp_dict = article.to_comprehensive_dict()

        # Verify structure
        self.assertIn("article", comp_dict)
        self.assertIn("quiz", comp_dict)
        self.assertIn("grammar_note", comp_dict)
        self.assertIn("detailed_grammar_notes", comp_dict)

        # Verify article data
        self.assertEqual(comp_dict["article"]["title"], "Comprehensive Test")

        # Verify quiz data
        self.assertEqual(comp_dict["quiz"]["title"], "French Quiz")

        # Verify grammar note data
        self.assertEqual(comp_dict["grammar_note"]["title"], "French Grammar")

    def test_validation_invalid_quiz_questions(self):
        """Test validation of invalid quiz questions data"""
        article = UnifiedArticle(
            title="Validation Test",
            content="Content",
            language="es",
            level="intermediate",
            quiz_questions_data=[
                {
                    # Missing required fields
                    "question_text": "Incomplete question",
                }
            ],
        )

        with self.assertRaises(ValidationError):
            article.clean()

    def test_validation_invalid_correct_option(self):
        """Test validation of invalid correct_option"""
        article = UnifiedArticle(
            title="Validation Test",
            content="Content",
            language="es",
            level="intermediate",
            quiz_questions_data=[
                {
                    "word_definition_id": 1,
                    "question_text": "Test question",
                    "option_a": "A",
                    "option_b": "B",
                    "option_c": "C",
                    "option_d": "D",
                    "correct_option": "X",  # Invalid
                }
            ],
        )

        with self.assertRaises(ValidationError):
            article.clean()


class UnifiedArticleMigrationTestCase(TestCase):
    """Test migration functionality from old models to UnifiedArticle"""

    def setUp(self):
        # This would normally import the old models for testing migration
        # For now, we'll test the migration method structure
        pass

    def test_create_from_article_method_structure(self):
        """Test that create_from_article method exists and has correct signature"""
        # Test method exists
        self.assertTrue(hasattr(UnifiedArticle, "create_from_article"))
        self.assertTrue(callable(getattr(UnifiedArticle, "create_from_article")))

    def test_to_dict_methods_exist(self):
        """Test that all conversion methods exist"""
        article = UnifiedArticle()

        self.assertTrue(hasattr(article, "to_article_dict"))
        self.assertTrue(hasattr(article, "to_quiz_dict"))
        self.assertTrue(hasattr(article, "to_grammar_note_dict"))
        self.assertTrue(hasattr(article, "to_comprehensive_dict"))


class UnifiedArticleAPICompatibilityTestCase(TestCase):
    """Test API compatibility with existing endpoints"""

    def setUp(self):
        self.client = Client()

        # Create test data using UnifiedArticle
        self.word = Word.objects.create(word="test", primary_language="es")
        self.word_definition = WordDefinition.objects.create(
            word=self.word, grammar_note="Test definition", usage_example="Test example"
        )

        self.article = UnifiedArticle.objects.create(
            title="API Test Article",
            content="This is a [test] article",
            language="es",
            level="intermediate",
            publication_date=date.today(),
            quiz_title="API Test Quiz",
            quiz_description="Test quiz description",
            grammar_title="API Grammar Note",
            grammar_content="Grammar content for API test",
        )

        self.article.add_quiz_question(
            word_definition=self.word_definition,
            question_text="What is test?",
            option_a="Correct",
            option_b="Wrong",
            option_c="Wrong",
            option_d="Wrong",
            correct_option="A",
        )

    def test_article_dict_format(self):
        """Test article dictionary format matches expected API structure"""
        article_dict = self.article.to_article_dict()

        expected_fields = [
            "id",
            "title",
            "content",
            "language",
            "level",
            "publication_date",
            "is_active",
            "author",
            "summary",
            "tags",
            "created_at",
            "updated_at",
        ]

        for field in expected_fields:
            self.assertIn(field, article_dict)

    def test_quiz_dict_format(self):
        """Test quiz dictionary format matches expected API structure"""
        quiz_dict = self.article.to_quiz_dict()

        expected_fields = [
            "id",
            "article_id",
            "title",
            "description",
            "passing_score",
            "time_limit",
            "is_active",
            "questions",
        ]

        for field in expected_fields:
            self.assertIn(field, quiz_dict)

        # Verify questions structure
        self.assertEqual(len(quiz_dict["questions"]), 1)
        question = quiz_dict["questions"][0]
        self.assertEqual(question["question_text"], "What is test?")

    def test_comprehensive_dict_format(self):
        """Test comprehensive dictionary format matches expected API structure"""
        comp_dict = self.article.to_comprehensive_dict()

        expected_top_level = [
            "id",
            "article",
            "quiz",
            "grammar_note",
            "detailed_grammar_notes",
            "is_published",
            "created_at",
            "updated_at",
        ]

        for field in expected_top_level:
            self.assertIn(field, comp_dict)

        # Verify nested structures
        self.assertEqual(comp_dict["article"]["title"], "API Test Article")
        self.assertEqual(comp_dict["quiz"]["title"], "API Test Quiz")
        self.assertEqual(comp_dict["grammar_note"]["title"], "API Grammar Note")
