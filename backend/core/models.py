from datetime import date

from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

# Language choices used across models
LANGUAGE_CHOICES = [
    ("es", "Español"),
    ("it", "Italiano"),
    ("pt", "Português"),
    ("ca", "Català"),
    ("fr", "Français"),
]

LEVEL_CHOICES = [
    ("beginner", "Beginner"),
    ("intermediate", "Intermediate"),
    ("advanced", "Advanced"),
]


# ===========================
# USER MODELS (from authentication app)
# ===========================


class UserProfile(models.Model):
    """Extended user profile for language learning tracking"""

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    preferred_language = models.CharField(
        max_length=5,
        choices=LANGUAGE_CHOICES,
        default="es",
    )
    current_streak = models.PositiveIntegerField(default=0)
    total_points = models.PositiveIntegerField(default=0)
    level = models.PositiveIntegerField(default=1)
    last_activity_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.preferred_language}"

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"


class UserQuizResult(models.Model):
    """Track user quiz results for gamification and progress"""

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    article = models.ForeignKey("UnifiedArticle", on_delete=models.CASCADE)
    score = models.PositiveIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    points_earned = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.article.title} - {self.score}%"

    class Meta:
        verbose_name = "Quiz Result"
        verbose_name_plural = "Quiz Results"
        unique_together = ["user", "article"]


class UserActivity(models.Model):
    """Track daily user activity for streak calculation"""

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    points_earned = models.PositiveIntegerField(default=0)
    articles_read = models.PositiveIntegerField(default=0)
    quizzes_completed = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ["user", "date"]
        verbose_name = "User Activity"
        verbose_name_plural = "User Activities"

    def __str__(self):
        return f"{self.user.username} - {self.date}"


class UserBadge(models.Model):
    """Badges earned by users"""

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    badge = models.ForeignKey("Badge", on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["user", "badge"]
        verbose_name = "User Badge"
        verbose_name_plural = "User Badges"

    def __str__(self):
        return f"{self.user.username} - {self.badge.name}"


class UserSavedWord(models.Model):
    """Words saved by users to their personal dictionary"""

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    word = models.ForeignKey("Word", on_delete=models.CASCADE)
    saved_at = models.DateTimeField(auto_now_add=True)
    progress_level = models.CharField(
        max_length=20,
        choices=[
            ("learning", "Learning"),
            ("reviewing", "Reviewing"),
            ("mastered", "Mastered"),
        ],
        default="learning",
    )

    class Meta:
        unique_together = ["user", "word"]
        verbose_name = "Saved Word"
        verbose_name_plural = "Saved Words"

    def __str__(self):
        return f"{self.user.username} - {self.word.word}"


class Word(models.Model):
    """Vocabulary words with translations across Romance languages"""

    word = models.CharField(max_length=100, unique=True)
    primary_language = models.CharField(
        max_length=5,
        choices=LANGUAGE_CHOICES,
        default="es",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="core_words",
        help_text="Admin user who created this word",
    )

    def __str__(self):
        return f"{self.word} ({self.primary_language})"

    class Meta:
        ordering = ["word"]
        verbose_name = "Word"
        verbose_name_plural = "Words"


class WordTranslation(models.Model):
    """Translations of words in different Romance languages"""

    word = models.ForeignKey(
        Word, on_delete=models.CASCADE, related_name="translations"
    )
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES)
    translation = models.CharField(max_length=200)
    pronunciation = models.CharField(max_length=200, blank=True)
    part_of_speech = models.CharField(
        max_length=20,
        choices=[
            ("noun", "Nom"),
            ("verb", "Verbe"),
            ("adjective", "Adjectif"),
            ("adverb", "Adverbe"),
            ("preposition", "Préposition"),
            ("article", "Article"),
            ("other", "Autre"),
        ],
        blank=True,
    )

    def __str__(self):
        return f"{self.word.word} → {self.translation} ({self.language})"

    class Meta:
        unique_together = ["word", "language"]
        verbose_name = "Word Translation"
        verbose_name_plural = "Word Translations"


class WordDefinition(models.Model):
    """Grammar notes and contextual explanations for words"""

    word = models.OneToOneField(
        Word, on_delete=models.CASCADE, related_name="definition"
    )
    grammar_note = models.TextField(help_text="Detailed grammatical explanation")
    usage_example = models.TextField(
        blank=True, help_text="Example sentence using the word"
    )
    difficulty_level = models.CharField(
        max_length=20,
        choices=[
            ("beginner", "Débutant"),
            ("intermediate", "Intermédiaire"),
            ("advanced", "Avancé"),
        ],
        default="intermediate",
    )
    etymology = models.TextField(blank=True, help_text="Word origin and etymology")

    # Additional educational content
    memory_tip = models.TextField(blank=True, help_text="Mnemonic or memory aid")
    common_mistakes = models.TextField(
        blank=True, help_text="Common usage mistakes to avoid"
    )

    def __str__(self):
        return f"Definition: {self.word.word}"

    class Meta:
        verbose_name = "Word Definition"
        verbose_name_plural = "Word Definitions"


class Badge(models.Model):
    """Achievement badges for gamification"""

    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50, default="🏆")  # Emoji or icon class

    # Badge requirements
    points_required = models.PositiveIntegerField(default=0)
    quiz_count_required = models.PositiveIntegerField(default=0)
    streak_required = models.PositiveIntegerField(default=0)
    articles_read_required = models.PositiveIntegerField(default=0)
    words_learned_required = models.PositiveIntegerField(default=0)

    # Badge categorization
    category = models.CharField(
        max_length=20,
        choices=[
            ("progress", "Progress"),
            ("achievement", "Achievement"),
            ("streak", "Streak"),
            ("learning", "Learning"),
            ("special", "Special"),
        ],
        default="progress",
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.icon} {self.name}"

    class Meta:
        ordering = ["category", "points_required"]
        verbose_name = "Badge"
        verbose_name_plural = "Badges"


class ArticleWord(models.Model):
    """Many-to-many relationship between Articles and Words with additional context"""

    article = models.ForeignKey(
        "UnifiedArticle", on_delete=models.CASCADE, related_name="article_words"
    )
    word = models.ForeignKey(
        Word, on_delete=models.CASCADE, related_name="word_articles"
    )
    position_in_text = models.PositiveIntegerField(
        help_text="Character position where word appears in article"
    )
    context_sentence = models.TextField(
        blank=True, help_text="The sentence where this word appears"
    )
    is_key_vocabulary = models.BooleanField(
        default=True, help_text="Whether this word is highlighted as key vocabulary"
    )
    added_at = models.DateTimeField(auto_now_add=True)

    # Note: grammar note functionality is now integrated into UnifiedArticle

    def __str__(self):
        return f"{self.article.title} → {self.word.word}"

    class Meta:
        unique_together = ["article", "word", "position_in_text"]
        ordering = ["position_in_text"]
        verbose_name = "Article Word"
        verbose_name_plural = "Article Words"


# Content workflow and management models


class ContentSeries(models.Model):
    """Series of related articles"""

    name = models.CharField(max_length=100)
    description = models.TextField()
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.language})"

    class Meta:
        verbose_name = "Content Series"
        verbose_name_plural = "Content Series"


class ArticleSeries(models.Model):
    """Link articles to series with ordering"""

    article = models.ForeignKey("UnifiedArticle", on_delete=models.CASCADE)
    series = models.ForeignKey(ContentSeries, on_delete=models.CASCADE)
    order_in_series = models.PositiveIntegerField()

    class Meta:
        unique_together = ["article", "series"]
        ordering = ["order_in_series"]
        verbose_name = "Article Series"
        verbose_name_plural = "Article Series"


class UnifiedArticle(models.Model):
    """
    Modèle unifié qui combine Article, Quiz, QuizQuestion, GrammarNote, et ArticleGrammarNote
    en une seule structure cohérente et plus efficace.
    """

    # ===== ARTICLE DATA =====
    title = models.CharField(max_length=200, help_text="Article title")
    content = models.TextField(help_text="Article content")
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES)
    level = models.CharField(
        max_length=20,
        choices=LEVEL_CHOICES,
        default="intermediate",
        help_text="Article difficulty level",
    )
    publication_date = models.DateField(default=date.today)
    is_active = models.BooleanField(default=True)

    # Article metadata
    author = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="unified_articles",
        help_text="Content creator",
    )
    summary = models.TextField(blank=True, help_text="Brief article summary")
    tags = models.CharField(
        max_length=200, blank=True, help_text="Comma-separated tags"
    )

    # ===== QUIZ DATA =====
    quiz_title = models.CharField(max_length=200, blank=True, help_text="Quiz title")
    quiz_description = models.TextField(blank=True, help_text="Quiz description")
    quiz_passing_score = models.PositiveIntegerField(
        default=70,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Minimum score required to pass (percentage)",
    )
    quiz_time_limit = models.PositiveIntegerField(
        null=True, blank=True, help_text="Time limit in minutes (optional)"
    )
    quiz_is_active = models.BooleanField(default=True)

    # ===== MAIN GRAMMAR NOTE DATA =====
    grammar_title = models.CharField(
        max_length=200, blank=True, help_text="Main grammar note title"
    )
    grammar_content = models.TextField(
        blank=True, help_text="Main grammar explanation for the article"
    )
    grammar_key_concepts = models.TextField(
        blank=True, help_text="Key grammar concepts covered in this article"
    )
    grammar_learning_objectives = models.TextField(
        blank=True, help_text="What students should learn from this grammar note"
    )
    grammar_difficulty_level = models.CharField(
        max_length=20,
        choices=LEVEL_CHOICES,
        default="intermediate",
        help_text="Grammar difficulty level",
    )

    # ===== QUIZ QUESTIONS DATA (JSON field) =====
    quiz_questions_data = models.JSONField(
        default=list,
        blank=True,
        help_text="Array of quiz questions with all their data",
    )

    # ===== DETAILED GRAMMAR NOTES DATA (JSON field) =====
    detailed_grammar_notes_data = models.JSONField(
        default=list,
        blank=True,
        help_text="Array of detailed grammar notes for specific words",
    )

    # ===== TIMESTAMPS =====
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-publication_date", "-id"]
        verbose_name = "Unified Article"
        verbose_name_plural = "Unified Articles"
        indexes = [
            models.Index(fields=["language", "level"]),
            models.Index(fields=["publication_date", "is_active"]),
            models.Index(fields=["author"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.language})"

    # ===== ARTICLE PROPERTIES =====
    @property
    def has_quiz(self):
        """Check if this article has quiz questions"""
        return len(self.quiz_questions_data) > 0

    @property
    def has_grammar_note(self):
        """Check if this article has a main grammar note"""
        return bool(self.grammar_title and self.grammar_content)

    @property
    def has_detailed_grammar_notes(self):
        """Check if this article has detailed grammar notes"""
        return len(self.detailed_grammar_notes_data) > 0

    @property
    def is_complete(self):
        """Check if this article has both quiz and grammar note"""
        return self.has_quiz and self.has_grammar_note

    # ===== QUIZ METHODS =====
    def add_quiz_question(
        self,
        word_definition,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_option,
        points=10,
        question_type="vocabulary",
        difficulty_level=None,
    ):
        """Add a quiz question to this article"""
        if difficulty_level is None:
            difficulty_level = self.level

        question_data = {
            "word_definition_id": word_definition.id,
            "word": word_definition.word.word,
            "word_definition": word_definition.grammar_note,
            "word_usage_example": word_definition.usage_example,
            "word_difficulty_level": word_definition.difficulty_level,
            "question_text": question_text,
            "option_a": option_a,
            "option_b": option_b,
            "option_c": option_c,
            "option_d": option_d,
            "correct_option": correct_option,
            "points": points,
            "question_type": question_type,
            "difficulty_level": difficulty_level,
        }

        # Check if question for this word already exists
        for existing_question in self.quiz_questions_data:
            if existing_question.get("word_definition_id") == word_definition.id:
                # Update existing question
                existing_question.update(question_data)
                self.save()
                return existing_question

        # Add new question
        self.quiz_questions_data.append(question_data)
        self.save()
        return question_data

    def remove_quiz_question(self, word_definition_id):
        """Remove a quiz question by word definition ID"""
        self.quiz_questions_data = [
            q
            for q in self.quiz_questions_data
            if q.get("word_definition_id") != word_definition_id
        ]
        self.save()

    def get_quiz_questions(self):
        """Get all quiz questions for this article"""
        return self.quiz_questions_data

    def get_quiz_question(self, word_definition_id):
        """Get a specific quiz question by word definition ID"""
        for question in self.quiz_questions_data:
            if question.get("word_definition_id") == word_definition_id:
                return question
        return None

    # ===== DETAILED GRAMMAR NOTES METHODS =====
    def add_detailed_grammar_note(
        self, word_definition, title, content, order=1, is_key_concept=True
    ):
        """Add a detailed grammar note for a specific word"""
        note_data = {
            "word_definition_id": word_definition.id,
            "word": word_definition.word.word,
            "word_definition": word_definition.grammar_note,
            "word_usage_example": word_definition.usage_example,
            "title": title,
            "content": content,
            "order": order,
            "is_key_concept": is_key_concept,
        }

        # Check if note for this word already exists
        for existing_note in self.detailed_grammar_notes_data:
            if existing_note.get("word_definition_id") == word_definition.id:
                # Update existing note
                existing_note.update(note_data)
                self.save()
                return existing_note

        # Add new note
        self.detailed_grammar_notes_data.append(note_data)
        # Sort by order
        self.detailed_grammar_notes_data.sort(
            key=lambda x: (x.get("order", 1), x.get("title", ""))
        )
        self.save()
        return note_data

    def remove_detailed_grammar_note(self, word_definition_id):
        """Remove a detailed grammar note by word definition ID"""
        self.detailed_grammar_notes_data = [
            note
            for note in self.detailed_grammar_notes_data
            if note.get("word_definition_id") != word_definition_id
        ]
        self.save()

    def get_detailed_grammar_notes(self):
        """Get all detailed grammar notes for this article, sorted by order"""
        return sorted(
            self.detailed_grammar_notes_data,
            key=lambda x: (x.get("order", 1), x.get("title", "")),
        )

    def get_detailed_grammar_note(self, word_definition_id):
        """Get a specific detailed grammar note by word definition ID"""
        for note in self.detailed_grammar_notes_data:
            if note.get("word_definition_id") == word_definition_id:
                return note
        return None

    # ===== CONVERSION METHODS =====
    def to_article_dict(self):
        """Convert to article dictionary format (for API compatibility)"""
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "language": self.language,
            "level": self.level,
            "publication_date": self.publication_date.isoformat(),
            "is_active": self.is_active,
            "author": self.author.username if self.author else None,
            "summary": self.summary,
            "tags": self.tags,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def to_quiz_dict(self):
        """Convert to quiz dictionary format (for API compatibility)"""
        return {
            "id": self.id,
            "article_id": self.id,
            "title": self.quiz_title,
            "description": self.quiz_description,
            "passing_score": self.quiz_passing_score,
            "time_limit": self.quiz_time_limit,
            "is_active": self.quiz_is_active,
            "questions": self.quiz_questions_data,
        }

    def to_grammar_note_dict(self):
        """Convert to grammar note dictionary format (for API compatibility)"""
        return {
            "id": self.id,
            "article_id": self.id,
            "title": self.grammar_title,
            "content": self.grammar_content,
            "key_concepts": self.grammar_key_concepts,
            "learning_objectives": self.grammar_learning_objectives,
            "difficulty_level": self.grammar_difficulty_level,
        }

    def to_comprehensive_dict(self):
        """Convert to comprehensive article format (for API compatibility)"""
        return {
            "id": self.id,
            "article": self.to_article_dict(),
            "quiz": self.to_quiz_dict(),
            "grammar_note": self.to_grammar_note_dict(),
            "detailed_grammar_notes": self.get_detailed_grammar_notes(),
            "is_published": self.is_active,  # Map is_active to is_published
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    # ===== VALIDATION METHODS =====
    def clean(self):
        """Custom validation"""
        from django.core.exceptions import ValidationError

        errors = {}

        # Validate quiz questions format
        if self.quiz_questions_data:
            for i, question in enumerate(self.quiz_questions_data):
                required_fields = [
                    "word_definition_id",
                    "question_text",
                    "option_a",
                    "option_b",
                    "option_c",
                    "option_d",
                    "correct_option",
                ]
                for field in required_fields:
                    if not question.get(field):
                        errors["quiz_questions_data"] = (
                            f"Question {i + 1}: Missing required field '{field}'"
                        )
                        break

                # Validate correct_option
                if question.get("correct_option") not in ["A", "B", "C", "D"]:
                    errors["quiz_questions_data"] = (
                        f"Question {i + 1}: Invalid correct_option"
                    )

        # Validate detailed grammar notes format
        if self.detailed_grammar_notes_data:
            for i, note in enumerate(self.detailed_grammar_notes_data):
                required_fields = ["word_definition_id", "title", "content"]
                for field in required_fields:
                    if not note.get(field):
                        errors["detailed_grammar_notes_data"] = (
                            f"Note {i + 1}: Missing required field '{field}'"
                        )
                        break

        if errors:
            raise ValidationError(errors)

    # ===== MIGRATION HELPERS =====
    @classmethod
    def create_from_article(cls, article):
        """Create UnifiedArticle from existing Article and related models"""
        unified = cls.objects.create(
            title=article.title,
            content=article.content,
            language=article.language,
            level=article.level,
            publication_date=article.publication_date,
            is_active=article.is_active,
            author=article.author,
            summary=article.summary,
            tags=article.tags,
        )

        # Migrate Quiz data
        if hasattr(article, "quiz") and article.quiz:
            quiz = article.quiz
            unified.quiz_title = quiz.title
            unified.quiz_description = quiz.description
            unified.quiz_passing_score = quiz.passing_score
            unified.quiz_time_limit = quiz.time_limit
            unified.quiz_is_active = quiz.is_active

            # Migrate QuizQuestions
            for question in quiz.questions.all():
                unified.add_quiz_question(
                    word_definition=question.word_definition,
                    question_text=question.question_text,
                    option_a=question.option_a,
                    option_b=question.option_b,
                    option_c=question.option_c,
                    option_d=question.option_d,
                    correct_option=question.correct_option,
                    points=question.points,
                    question_type=question.question_type,
                    difficulty_level=question.difficulty_level,
                )

        # Migrate GrammarNote data
        if hasattr(article, "grammar_note") and article.grammar_note:
            grammar = article.grammar_note
            unified.grammar_title = grammar.title
            unified.grammar_content = grammar.content
            unified.grammar_key_concepts = grammar.key_concepts
            unified.grammar_learning_objectives = grammar.learning_objectives
            unified.grammar_difficulty_level = grammar.difficulty_level

        # Migrate ArticleGrammarNotes
        for detailed_note in article.detailed_grammar_notes.all():
            unified.add_detailed_grammar_note(
                word_definition=detailed_note.word_definition,
                title=detailed_note.title,
                content=detailed_note.content,
                order=detailed_note.order,
                is_key_concept=detailed_note.is_key_concept,
            )

        unified.save()
        return unified
