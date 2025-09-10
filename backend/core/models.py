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
    article = models.ForeignKey("Article", on_delete=models.CASCADE)
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


class Article(models.Model):
    """
    Model for news articles used in language learning.

    Each article has:
    - One associated Quiz (via OneToOneField in Quiz model)
    - One main GrammarNote (via OneToOneField in GrammarNote model)
    - Multiple detailed ArticleGrammarNotes for specific words (optional)
    """

    title = models.CharField(max_length=200)
    content = models.TextField()
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES)
    level = models.CharField(
        max_length=20,
        choices=LEVEL_CHOICES,
        default="intermediate",
    )
    publication_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Metadata for content management
    author = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="core_articles",
        help_text="Content creator",
    )
    summary = models.TextField(blank=True, help_text="Brief article summary")
    tags = models.CharField(
        max_length=200, blank=True, help_text="Comma-separated tags"
    )

    def __str__(self):
        return f"{self.title} ({self.language})"

    @property
    def has_quiz(self):
        """Check if this article has an associated quiz"""
        return hasattr(self, "quiz")

    @property
    def has_grammar_note(self):
        """Check if this article has an associated grammar note"""
        return hasattr(self, "grammar_note")

    @property
    def is_complete(self):
        """Check if this article has both quiz and grammar note assigned"""
        return self.has_quiz and self.has_grammar_note

    def get_quiz(self):
        """Get the associated quiz, return None if not found"""
        return getattr(self, "quiz", None)

    def get_grammar_note(self):
        """Get the associated grammar note, return None if not found"""
        return getattr(self, "grammar_note", None)

    class Meta:
        ordering = ["-publication_date"]
        verbose_name = "Article"
        verbose_name_plural = "Articles"


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


class Quiz(models.Model):
    """Quiz associated with an article"""

    article = models.OneToOneField(
        Article,
        on_delete=models.CASCADE,
        related_name="quiz",
        help_text="Article that this quiz is associated with",
    )
    title = models.CharField(max_length=200, blank=True, help_text="Quiz title")
    description = models.TextField(blank=True, help_text="Quiz description")
    passing_score = models.PositiveIntegerField(
        default=70,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Minimum score required to pass (percentage)",
    )
    time_limit = models.PositiveIntegerField(
        null=True, blank=True, help_text="Time limit in minutes (optional)"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Quiz for {self.article.title}"

    class Meta:
        verbose_name = "Quiz"
        verbose_name_plural = "Quizzes"


class GrammarNote(models.Model):
    """Main grammar note for each article (one-to-one relationship)"""

    article = models.OneToOneField(
        Article,
        on_delete=models.CASCADE,
        related_name="grammar_note",
        help_text="Article this grammar note belongs to",
    )
    title = models.CharField(max_length=200, help_text="Grammar note title")
    content = models.TextField(help_text="Main grammar explanation for the article")
    key_concepts = models.TextField(
        blank=True, help_text="Key grammar concepts covered in this article"
    )
    learning_objectives = models.TextField(
        blank=True, help_text="What students should learn from this grammar note"
    )
    difficulty_level = models.CharField(
        max_length=20,
        choices=LEVEL_CHOICES,
        default="intermediate",
        help_text="Grammar difficulty level",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Grammar Note: {self.article.title}"

    class Meta:
        verbose_name = "Grammar Note"
        verbose_name_plural = "Grammar Notes"


class ArticleGrammarNote(models.Model):
    """Detailed grammar notes associated with an article and linked to word definitions"""

    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name="detailed_grammar_notes",
        help_text="Article this grammar note belongs to",
    )
    word_definition = models.ForeignKey(
        WordDefinition,
        on_delete=models.CASCADE,
        related_name="article_grammar_notes",
        help_text="Word definition this note explains",
    )
    title = models.CharField(max_length=200, help_text="Grammar note title")
    content = models.TextField(help_text="Detailed grammar explanation")
    order = models.PositiveIntegerField(
        default=1, help_text="Display order within the article"
    )
    is_key_concept = models.BooleanField(
        default=True, help_text="Whether this is a key grammar concept"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.article.title} - {self.title}"

    class Meta:
        unique_together = ["article", "word_definition"]
        ordering = ["order", "title"]
        verbose_name = "Article Grammar Note"
        verbose_name_plural = "Article Grammar Notes"


class QuizQuestion(models.Model):
    """Quiz questions associated with quizzes and linked to word definitions"""

    quiz = models.ForeignKey(
        Quiz, on_delete=models.CASCADE, related_name="questions", null=True, blank=True
    )

    # Temporary field to maintain backward compatibility during migration
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name="quiz_questions_temp",
        null=True,
        blank=True,
    )

    # Link to a specific word definition that this question tests
    word_definition = models.ForeignKey(
        WordDefinition,
        on_delete=models.CASCADE,
        related_name="quiz_questions",
        help_text="The word definition this question tests",
    )

    question_text = models.TextField()
    option_a = models.CharField(max_length=200)
    option_b = models.CharField(max_length=200)
    option_c = models.CharField(max_length=200)
    option_d = models.CharField(max_length=200)
    correct_option = models.CharField(
        max_length=1, choices=[("A", "A"), ("B", "B"), ("C", "C"), ("D", "D")]
    )
    points = models.PositiveIntegerField(default=10)

    # Question metadata
    question_type = models.CharField(
        max_length=20,
        choices=[
            ("vocabulary", "Vocabulary"),
            ("grammar", "Grammar"),
            ("comprehension", "Comprehension"),
            ("translation", "Translation"),
        ],
        default="vocabulary",
    )
    difficulty_level = models.CharField(
        max_length=20, choices=LEVEL_CHOICES, default="intermediate"
    )

    def __str__(self):
        return (
            f"Question for {self.quiz.article.title} - {self.word_definition.word.word}"
        )

    class Meta:
        verbose_name = "Quiz Question"
        verbose_name_plural = "Quiz Questions"
        # Ensure one question per word definition per quiz
        unique_together = ["quiz", "word_definition"]


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
        Article, on_delete=models.CASCADE, related_name="article_words"
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

    # Link to grammar note for this word in this article (optional)
    grammar_note = models.OneToOneField(
        ArticleGrammarNote,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="article_word",
        help_text="Grammar note explaining this word in this article",
    )

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

    article = models.ForeignKey(Article, on_delete=models.CASCADE)
    series = models.ForeignKey(ContentSeries, on_delete=models.CASCADE)
    order_in_series = models.PositiveIntegerField()

    class Meta:
        unique_together = ["article", "series"]
        ordering = ["order_in_series"]
        verbose_name = "Article Series"
        verbose_name_plural = "Article Series"


class ComprehensiveArticle(models.Model):
    """
    Comprehensive model that links Article, Quiz, and GrammarNote together.
    Provides a unified interface to access all three related models.
    """

    # Foreign key relationships to the three main models
    article = models.OneToOneField(
        Article,
        on_delete=models.CASCADE,
        related_name="comprehensive_view",
        help_text="Associated article",
    )
    quiz = models.OneToOneField(
        Quiz,
        on_delete=models.CASCADE,
        related_name="comprehensive_view",
        help_text="Associated quiz",
    )
    grammar_note = models.OneToOneField(
        GrammarNote,
        on_delete=models.CASCADE,
        related_name="comprehensive_view",
        help_text="Associated grammar note",
    )

    # Metadata for the comprehensive view
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(
        blank=True, help_text="Additional notes for this comprehensive view"
    )
    is_published = models.BooleanField(
        default=False,
        help_text="Whether this complete set is published and ready for students",
    )

    def __str__(self):
        return f"Comprehensive: {self.article.title}"

    # Properties to access data from related models
    @property
    def title(self):
        """Get article title"""
        return self.article.title

    @property
    def content(self):
        """Get article content"""
        return self.article.content

    @property
    def language(self):
        """Get article language"""
        return self.article.language

    @property
    def level(self):
        """Get article level"""
        return self.article.level

    @property
    def author(self):
        """Get article author"""
        return self.article.author

    @property
    def quiz_title(self):
        """Get quiz title"""
        return self.quiz.title

    @property
    def quiz_description(self):
        """Get quiz description"""
        return self.quiz.description

    @property
    def quiz_questions_count(self):
        """Get number of quiz questions"""
        return self.quiz.questions.count()

    @property
    def grammar_title(self):
        """Get grammar note title"""
        return self.grammar_note.title

    @property
    def grammar_content(self):
        """Get grammar note content"""
        return self.grammar_note.content

    @property
    def is_complete(self):
        """Check if all components are properly set up"""
        return all(
            [
                self.article.title,
                self.article.content,
                self.quiz.title,
                self.quiz.questions.exists(),  # Quiz has questions
                self.grammar_note.title,
                self.grammar_note.content,
            ]
        )

    @property
    def completion_status(self):
        """Get detailed completion status"""
        return {
            "article_complete": bool(self.article.title and self.article.content),
            "quiz_complete": bool(self.quiz.title and self.quiz.questions.exists()),
            "grammar_complete": bool(
                self.grammar_note.title and self.grammar_note.content
            ),
            "overall_complete": self.is_complete,
        }

    def get_all_components(self):
        """Get all three components as a dictionary"""
        return {
            "article": self.article,
            "quiz": self.quiz,
            "grammar_note": self.grammar_note,
        }

    @classmethod
    def create_comprehensive(cls, article, quiz, grammar_note, **kwargs):
        """
        Create a comprehensive view linking all three components.
        Validates that they are compatible (same language, etc.)
        """
        # Validate compatibility
        if article.language != quiz.article.language:
            raise ValueError("Article and Quiz must have the same language")
        if article.id != quiz.article.id:
            raise ValueError("Quiz must belong to the same article")
        if article.id != grammar_note.article.id:
            raise ValueError("Grammar note must belong to the same article")

        return cls.objects.create(
            article=article, quiz=quiz, grammar_note=grammar_note, **kwargs
        )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Comprehensive Article"
        verbose_name_plural = "Comprehensive Articles"
