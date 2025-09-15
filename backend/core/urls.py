from django.urls import path

from . import views

app_name = "core"

urlpatterns = [
    # ===========================
    # TEMPLATE VIEWS
    # ===========================
    path("", views.home_view, name="home"),
    path("login/", views.login_view, name="login"),
    path("register/", views.register_view, name="register"),
    path("logout/", views.logout_view, name="logout"),
    # ===========================
    # AUTHENTICATION API
    # ===========================
    path("api/login/", views.api_login, name="api_login"),
    path("api/register/", views.api_register, name="api_register"),
    path("api/logout/", views.api_logout, name="api_logout"),
    path("api/profile/", views.api_user_profile, name="api_user_profile"),
    # ===========================
    # ARTICLE APIs (New with quiz integration)
    # ===========================
    path(
        "api/latest-comprehensive-article/",
        views.api_latest_comprehensive_article,
        name="api_latest_comprehensive_article",
    ),
    path(
        "api/latest-article-quiz/",
        views.api_latest_article_with_quiz,
        name="api_latest_article_quiz",
    ),
    path(
        "api/articles-quiz/",
        views.api_all_articles_with_quiz,
        name="api_all_articles_quiz",
    ),
    path(
        "api/create-article-quiz/",
        views.api_create_article_with_quiz,
        name="api_create_article_quiz",
    ),
    # ===========================
    # QUIZ & USER ACTIVITY API
    # ===========================
    path("api/submit-quiz/", views.api_submit_quiz_result, name="api_submit_quiz"),
    path("api/stats/", views.api_user_stats, name="api_user_stats"),
    # ===========================
    # LEGACY ARTICLE APIs (keep for compatibility)
    # ===========================
    path("api/latest-article/", views.api_latest_article, name="api_latest_article"),
    path("api/articles/", views.api_all_articles, name="api_all_articles"),
    path("api/create-article/", views.api_create_article, name="api_create_article"),
    # ===========================
    # WORD DEFINITION API
    # ===========================
    path(
        "api/word-definition/<int:word_id>/",
        views.api_word_definition,
        name="api_word_definition",
    ),
    path(
        "api/word/<str:word_name>/",
        views.api_word_by_name,
        name="api_word_by_name",
    ),
    # ===========================
    # USER STREAK API
    # ===========================
    path(
        "api/user-streak/",
        views.api_user_streak,
        name="api_user_streak",
    ),
]
