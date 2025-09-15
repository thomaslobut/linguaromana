from django.contrib import admin

from .models import (
    ArticleSeries,
    ArticleWord,
    Badge,
    ContentSeries,
    UnifiedArticle,
    Word,
    WordDefinition,
    WordTranslation,
)


class WordTranslationInline(admin.TabularInline):
    model = WordTranslation
    extra = 1


@admin.register(Word)
class WordAdmin(admin.ModelAdmin):
    list_display = ["word", "primary_language", "created_by", "created_at"]
    list_filter = ["primary_language", "created_at"]
    search_fields = ["word"]
    readonly_fields = ["created_at"]
    inlines = [WordTranslationInline]

    fieldsets = (
        ("Word Information", {"fields": ("word", "primary_language")}),
        ("Metadata", {"fields": ("created_by", "created_at")}),
    )


@admin.register(WordDefinition)
class WordDefinitionAdmin(admin.ModelAdmin):
    list_display = ["word", "difficulty_level"]
    list_filter = ["difficulty_level"]
    search_fields = ["word__word", "grammar_note"]

    fieldsets = (
        ("Word", {"fields": ("word",)}),
        ("Definition", {"fields": ("grammar_note", "usage_example")}),
        ("Classification", {"fields": ("difficulty_level", "etymology")}),
    )


@admin.register(UnifiedArticle)
class UnifiedArticleAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "language",
        "level",
        "publication_date",
        "is_active",
        "has_quiz",
        "has_grammar_note",
        "quiz_questions_count",
    ]
    list_filter = ["language", "level", "is_active", "publication_date"]
    search_fields = ["title", "content", "quiz_title", "grammar_title"]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        (
            "Article Information",
            {"fields": ("title", "content", "summary", "language", "level")},
        ),
        (
            "Publication",
            {"fields": ("publication_date", "is_active", "author", "tags")},
        ),
        (
            "Quiz Data",
            {
                "fields": (
                    "quiz_title",
                    "quiz_description",
                    "quiz_passing_score",
                    "quiz_time_limit",
                    "quiz_is_active",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Grammar Data",
            {
                "fields": (
                    "grammar_title",
                    "grammar_content",
                    "grammar_key_concepts",
                    "grammar_learning_objectives",
                    "grammar_difficulty_level",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Advanced",
            {
                "fields": ("quiz_questions_data", "detailed_grammar_notes_data"),
                "classes": ("collapse",),
            },
        ),
        (
            "Metadata",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def quiz_questions_count(self, obj):
        return len(obj.get_quiz_questions())

    quiz_questions_count.short_description = "Quiz Questions"


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "icon", "points_required"]
    list_filter = ["category"]
    search_fields = ["name", "description"]


@admin.register(ArticleWord)
class ArticleWordAdmin(admin.ModelAdmin):
    list_display = ["article", "word", "position_in_text", "is_key_vocabulary"]
    list_filter = ["is_key_vocabulary", "added_at"]
    search_fields = ["article__title", "word__word"]


@admin.register(ContentSeries)
class ContentSeriesAdmin(admin.ModelAdmin):
    list_display = ["name", "language", "level", "is_active"]
    list_filter = ["language", "level", "is_active"]
    search_fields = ["name", "description"]


@admin.register(ArticleSeries)
class ArticleSeriesAdmin(admin.ModelAdmin):
    list_display = ["article", "series", "order_in_series"]
    list_filter = ["series"]
    ordering = ["series", "order_in_series"]


# Customize admin site
admin.site.site_header = "LinguaRomana Administration"
admin.site.site_title = "LinguaRomana Admin"
admin.site.index_title = "Content Management System"
