from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User

from .models import (
    Article,
    Badge,
    QuizQuestion,
    UserActivity,
    UserBadge,
    UserProfile,
    UserQuizResult,
)


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = "Profile"


class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "preferred_language",
        "current_streak",
        "total_points",
        "level",
        "last_activity_date",
    ]
    list_filter = ["preferred_language", "level", "last_activity_date"]
    search_fields = ["user__username", "user__email"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ["title", "language", "level", "publication_date", "is_active"]
    list_filter = ["language", "level", "is_active", "publication_date"]
    search_fields = ["title", "content"]
    date_hierarchy = "publication_date"
    readonly_fields = ["created_at"]


class QuizQuestionInline(admin.TabularInline):
    model = QuizQuestion
    extra = 1


@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ["article", "question_text", "correct_option", "points"]
    list_filter = ["article__language", "correct_option"]
    search_fields = ["question_text", "article__title"]


@admin.register(UserQuizResult)
class UserQuizResultAdmin(admin.ModelAdmin):
    list_display = ["user", "article", "score", "points_earned", "completed_at"]
    list_filter = ["score", "completed_at", "article__language"]
    search_fields = ["user__username", "article__title"]
    date_hierarchy = "completed_at"
    readonly_fields = ["completed_at"]


@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "date",
        "articles_read",
        "quizzes_completed",
        "points_earned",
    ]
    list_filter = ["date"]
    search_fields = ["user__username"]
    date_hierarchy = "date"


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = [
        "icon",
        "name",
        "points_required",
        "quiz_count_required",
        "streak_required",
        "is_active",
    ]
    list_filter = ["is_active", "points_required", "streak_required"]
    search_fields = ["name", "description"]
    readonly_fields = ["created_at"]


@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ["user", "badge", "earned_at"]
    list_filter = ["earned_at", "badge"]
    search_fields = ["user__username", "badge__name"]
    date_hierarchy = "earned_at"
    readonly_fields = ["earned_at"]


# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)
