from django.contrib import admin
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import (
    Article,
    ArticleGrammarNote,
    ArticleSeries,
    ArticleWord,
    Badge,
    ComprehensiveArticle,
    ContentSeries,
    GrammarNote,
    Quiz,
    QuizQuestion,
    Word,
    WordDefinition,
    WordTranslation,
)


class WordTranslationInline(admin.TabularInline):
    model = WordTranslation
    extra = 1
    fields = ["language", "translation", "pronunciation", "part_of_speech"]


class WordDefinitionInline(admin.StackedInline):
    model = WordDefinition
    extra = 0
    fields = [
        "grammar_note",
        "usage_example",
        "difficulty_level",
        "etymology",
        "memory_tip",
        "common_mistakes",
    ]


@admin.register(Word)
class WordAdmin(admin.ModelAdmin):
    list_display = [
        "word",
        "primary_language",
        "created_at",
        "created_by",
        "has_definition",
    ]
    list_filter = ["primary_language", "created_at"]
    search_fields = ["word"]
    inlines = [WordTranslationInline, WordDefinitionInline]
    readonly_fields = ["created_at", "updated_at"]

    def has_definition(self, obj):
        return hasattr(obj, "definition")

    has_definition.boolean = True
    has_definition.short_description = "Has Definition"


class ArticleWordInline(admin.TabularInline):
    model = ArticleWord
    extra = 1
    fields = ["word", "position_in_text", "is_key_vocabulary", "grammar_note"]
    readonly_fields = ["added_at"]


class QuizQuestionInline(admin.TabularInline):
    model = QuizQuestion
    extra = 1
    fields = [
        "word_definition",
        "question_text",
        "correct_option",
        "question_type",
        "points",
    ]


class ArticleGrammarNoteInline(admin.TabularInline):
    model = ArticleGrammarNote
    extra = 1
    fields = ["word_definition", "title", "order", "is_key_concept"]
    readonly_fields = ["created_at"]


class QuizInline(admin.StackedInline):
    model = Quiz
    extra = 0
    fields = ["title", "description", "passing_score", "time_limit", "is_active"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "language",
        "level",
        "publication_date",
        "is_active",
        "word_count",
        "quiz_count",
    ]
    list_filter = ["language", "level", "is_active", "publication_date"]
    search_fields = ["title", "content"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [ArticleWordInline, ArticleGrammarNoteInline, QuizInline]

    fieldsets = (
        ("Basic Information", {"fields": ("title", "content", "summary")}),
        ("Language & Level", {"fields": ("language", "level")}),
        ("Publication", {"fields": ("publication_date", "is_active", "author")}),
        (
            "Metadata",
            {"fields": ("tags", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def word_count(self, obj):
        return obj.article_words.count()

    word_count.short_description = "Words"

    def quiz_count(self, obj):
        if hasattr(obj, "quiz") and obj.quiz:
            return obj.quiz.questions.count()
        return 0

    quiz_count.short_description = "Quiz Questions"


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = [
        "article",
        "title",
        "passing_score",
        "time_limit",
        "is_active",
        "question_count",
    ]
    list_filter = ["is_active", "article__language", "article__level"]
    search_fields = ["title", "description", "article__title"]
    inlines = [QuizQuestionInline]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        ("Quiz Info", {"fields": ("article", "title", "description")}),
        ("Settings", {"fields": ("passing_score", "time_limit", "is_active")}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def question_count(self, obj):
        return obj.questions.count()

    question_count.short_description = "Questions"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("article")


@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = [
        "quiz",
        "word_definition",
        "question_type",
        "difficulty_level",
        "correct_option",
        "points",
    ]
    list_filter = ["question_type", "difficulty_level", "quiz__article__language"]
    search_fields = [
        "question_text",
        "quiz__article__title",
        "word_definition__word__word",
    ]

    fieldsets = (
        (
            "Question Content",
            {"fields": ("quiz", "word_definition", "question_text")},
        ),
        (
            "Answer Options",
            {
                "fields": (
                    "option_a",
                    "option_b",
                    "option_c",
                    "option_d",
                    "correct_option",
                )
            },
        ),
        (
            "Question Settings",
            {"fields": ("question_type", "difficulty_level", "points")},
        ),
    )

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("quiz__article", "word_definition__word")
        )


@admin.register(WordDefinition)
class WordDefinitionAdmin(admin.ModelAdmin):
    list_display = ["word", "difficulty_level", "has_example", "has_etymology"]
    list_filter = ["difficulty_level", "word__primary_language"]
    search_fields = ["word__word", "grammar_note"]

    fieldsets = (
        ("Basic Definition", {"fields": ("word", "grammar_note", "difficulty_level")}),
        (
            "Usage & Examples",
            {"fields": ("usage_example", "memory_tip", "common_mistakes")},
        ),
        ("Etymology", {"fields": ("etymology",), "classes": ("collapse",)}),
    )

    def has_example(self, obj):
        return bool(obj.usage_example)

    has_example.boolean = True
    has_example.short_description = "Has Example"

    def has_etymology(self, obj):
        return bool(obj.etymology)

    has_etymology.boolean = True
    has_etymology.short_description = "Has Etymology"


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ["name", "icon", "category", "points_required", "is_active"]
    list_filter = ["category", "is_active"]
    search_fields = ["name", "description"]

    fieldsets = (
        ("Badge Info", {"fields": ("name", "description", "icon", "category")}),
        (
            "Requirements",
            {
                "fields": (
                    "points_required",
                    "quiz_count_required",
                    "streak_required",
                    "articles_read_required",
                    "words_learned_required",
                )
            },
        ),
        ("Status", {"fields": ("is_active",)}),
    )


@admin.register(ArticleGrammarNote)
class ArticleGrammarNoteAdmin(admin.ModelAdmin):
    list_display = [
        "article",
        "word_definition",
        "title",
        "order",
        "is_key_concept",
    ]
    list_filter = [
        "is_key_concept",
        "article__language",
        "word_definition__difficulty_level",
    ]
    search_fields = [
        "title",
        "content",
        "article__title",
        "word_definition__word__word",
    ]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        ("Basic Info", {"fields": ("article", "word_definition", "title", "order")}),
        ("Content", {"fields": ("content", "is_key_concept")}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("article", "word_definition__word")
        )


@admin.register(ArticleWord)
class ArticleWordAdmin(admin.ModelAdmin):
    list_display = [
        "article",
        "word",
        "position_in_text",
        "is_key_vocabulary",
        "has_grammar_note",
    ]
    list_filter = ["is_key_vocabulary", "article__language", "word__primary_language"]
    search_fields = ["article__title", "word__word"]

    def has_grammar_note(self, obj):
        return obj.grammar_note is not None

    has_grammar_note.boolean = True
    has_grammar_note.short_description = "Has Grammar Note"


class ArticleSeriesInline(admin.TabularInline):
    model = ArticleSeries
    extra = 1
    fields = ["article", "order_in_series"]


@admin.register(ContentSeries)
class ContentSeriesAdmin(admin.ModelAdmin):
    list_display = ["name", "language", "level", "article_count", "is_active"]
    list_filter = ["language", "level", "is_active"]
    search_fields = ["name", "description"]
    inlines = [ArticleSeriesInline]

    def article_count(self, obj):
        return obj.articleseries_set.count()

    article_count.short_description = "Articles"


@admin.register(GrammarNote)
class GrammarNoteAdmin(admin.ModelAdmin):
    list_display = [
        "article",
        "title",
        "difficulty_level",
        "has_key_concepts",
        "has_objectives",
    ]
    list_filter = ["difficulty_level", "article__language", "article__level"]
    search_fields = ["title", "content", "article__title"]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        ("Basic Info", {"fields": ("article", "title", "difficulty_level")}),
        ("Content", {"fields": ("content",)}),
        (
            "Learning Details",
            {"fields": ("key_concepts", "learning_objectives")},
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def has_key_concepts(self, obj):
        return bool(obj.key_concepts and obj.key_concepts.strip())

    has_key_concepts.boolean = True
    has_key_concepts.short_description = "Has Key Concepts"

    def has_objectives(self, obj):
        return bool(obj.learning_objectives and obj.learning_objectives.strip())

    has_objectives.boolean = True
    has_objectives.short_description = "Has Learning Objectives"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("article")


@admin.register(ComprehensiveArticle)
class ComprehensiveArticleAdmin(admin.ModelAdmin):
    list_display = [
        "article",
        "is_published",
        "is_complete_display",
        "completion_percentage_display",
        "created_at",
    ]
    list_filter = ["is_published", "article__language", "article__level", "created_at"]
    search_fields = ["article__title", "notes"]
    readonly_fields = [
        "created_at",
        "updated_at",
        "completion_status_display",
        "completion_percentage_display",
    ]

    fieldsets = (
        (
            "Components",
            {"fields": ("article", "quiz", "grammar_note")},
        ),
        (
            "Publication",
            {"fields": ("is_published", "notes")},
        ),
        (
            "Status",
            {
                "fields": (
                    "completion_status_display",
                    "completion_percentage_display",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def is_complete_display(self, obj):
        return obj.is_complete

    is_complete_display.boolean = True
    is_complete_display.short_description = "Complete"

    def completion_percentage_display(self, obj):
        try:
            status = obj.completion_status
            completed = sum(1 for v in status.values() if v)
            total = len(status)
            percentage = int((completed / total) * 100) if total > 0 else 0
            return f"{percentage}%"
        except:
            return "N/A"

    completion_percentage_display.short_description = "Completion %"

    def completion_status_display(self, obj):
        try:
            status = obj.completion_status
            return (
                f"Article: {'✅' if status.get('article_complete') else '❌'} | "
                f"Quiz: {'✅' if status.get('quiz_complete') else '❌'} | "
                f"Grammar: {'✅' if status.get('grammar_complete') else '❌'}"
            )
        except:
            return "Status unavailable"

    completion_status_display.short_description = "Component Status"

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("article", "quiz", "grammar_note")
        )


# Django signals for automatic creation of related components
@receiver(post_save, sender=Article)
def create_article_components(sender, instance, created, **kwargs):
    """
    Automatically create Quiz, GrammarNote, and ComprehensiveArticle
    when a new Article is created via Django admin (but not via API).
    """
    if created:  # Only for newly created articles
        try:
            # Check if Quiz already exists (may have been created by API)
            quiz = None
            try:
                quiz = instance.quiz
                print(f"ℹ️ Quiz déjà existant pour l'article: {instance.title}")
            except Quiz.DoesNotExist:
                quiz = Quiz.objects.create(
                    article=instance,
                    title=f"Quiz - {instance.title}",
                    description=f"Quiz automatique pour l'article '{instance.title}'",
                    passing_score=70,
                    is_active=True,
                )
                print(f"✅ Quiz créé automatiquement pour l'article: {instance.title}")

            # Check if GrammarNote already exists (may have been created by API)
            grammar_note = None
            try:
                grammar_note = instance.grammar_note
                print(f"ℹ️ GrammarNote déjà existante pour l'article: {instance.title}")
            except GrammarNote.DoesNotExist:
                grammar_note = GrammarNote.objects.create(
                    article=instance,
                    title=f"Notes de grammaire - {instance.title}",
                    content=f"Notes de grammaire automatiques pour l'article '{instance.title}'. "
                    f"Ces notes peuvent être modifiées dans l'interface d'administration.",
                    key_concepts="Concepts clés à définir",
                    learning_objectives="Objectifs d'apprentissage à définir",
                    difficulty_level=instance.level,
                )
                print(
                    f"✅ GrammarNote créée automatiquement pour l'article: {instance.title}"
                )

            # Check if ComprehensiveArticle already exists (may have been created by API)
            try:
                comprehensive_article = instance.comprehensive_view
                print(
                    f"ℹ️ ComprehensiveArticle déjà existante pour l'article: {instance.title}"
                )
            except ComprehensiveArticle.DoesNotExist:
                comprehensive_article = ComprehensiveArticle.objects.create(
                    article=instance,
                    quiz=quiz,
                    grammar_note=grammar_note,
                    is_published=True,
                    notes=f"Article créé automatiquement via l'admin le {instance.created_at.date()}",
                )
                print(
                    f"✅ ComprehensiveArticle créée automatiquement pour l'article: {instance.title}"
                )

        except Exception as e:
            print(
                f"❌ Erreur lors de la création automatique des composants pour {instance.title}: {e}"
            )


# Customize admin site
admin.site.site_header = "LinguaRomana Administration"
admin.site.site_title = "LinguaRomana Admin"
admin.site.index_title = "Content Management System"
