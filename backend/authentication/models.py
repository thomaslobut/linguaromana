from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class UserProfile(models.Model):
    """Extended user profile for language learning tracking"""

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    preferred_language = models.CharField(
        max_length=5,
        choices=[
            ("es", "Español"),
            ("it", "Italiano"),
            ("pt", "Português"),
            ("ca", "Català"),
            ("fr", "Français"),
        ],
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


class Article(models.Model):
    """Model for news articles used in language learning"""

    title = models.CharField(max_length=200)
    content = models.TextField()
    language = models.CharField(
        max_length=5,
        choices=[
            ("es", "Español"),
            ("it", "Italiano"),
            ("pt", "Português"),
            ("ca", "Català"),
            ("fr", "Français"),
        ],
    )
    level = models.CharField(
        max_length=20,
        choices=[
            ("beginner", "Beginner"),
            ("intermediate", "Intermediate"),
            ("advanced", "Advanced"),
        ],
        default="intermediate",
    )
    publication_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.language})"

    class Meta:
        ordering = ["-publication_date"]


class QuizQuestion(models.Model):
    """Quiz questions associated with articles"""

    article = models.ForeignKey(
        Article, on_delete=models.CASCADE, related_name="quiz_questions"
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

    def __str__(self):
        return f"Question for {self.article.title}"


class UserQuizResult(models.Model):
    """Track user quiz results for gamification and progress"""

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    article = models.ForeignKey(Article, on_delete=models.CASCADE)
    score = models.PositiveIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    points_earned = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(auto_now_add=True)
    time_spent = models.PositiveIntegerField(
        help_text="Time spent in seconds", null=True, blank=True
    )

    def __str__(self):
        return f"{self.user.username} - {self.article.title}: {self.score}%"

    class Meta:
        unique_together = ["user", "article"]
        ordering = ["-completed_at"]


class UserActivity(models.Model):
    """Track daily user activity for streak calculation"""

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    articles_read = models.PositiveIntegerField(default=0)
    quizzes_completed = models.PositiveIntegerField(default=0)
    points_earned = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.user.username} - {self.date}"

    class Meta:
        unique_together = ["user", "date"]
        ordering = ["-date"]


class Badge(models.Model):
    """Achievement badges for gamification"""

    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50, default="🏆")  # Emoji or icon class
    points_required = models.PositiveIntegerField(default=0)
    quiz_count_required = models.PositiveIntegerField(default=0)
    streak_required = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.icon} {self.name}"

    class Meta:
        ordering = ["points_required"]


class UserBadge(models.Model):
    """Badges earned by users"""

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.badge.name}"

    class Meta:
        unique_together = ["user", "badge"]
        ordering = ["-earned_at"]
