import json
from datetime import date

from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import (
    ArticleWord,
    Badge,
    UnifiedArticle,
    UserActivity,
    UserBadge,
    UserProfile,
    UserQuizResult,
    UserSavedWord,
    Word,
    WordDefinition,
)


def get_daily_language():
    """Determine today's language based on daily rotation"""
    languages = ["es", "it", "pt", "ca", "fr"]

    # Use the day of year to rotate languages
    today = date.today()
    day_of_year = today.timetuple().tm_yday

    # Rotate based on day of year
    language_index = (day_of_year - 1) % len(languages)
    current_language = languages[language_index]

    return current_language


@api_view(["GET"])
@permission_classes([AllowAny])
def api_latest_article_with_quiz(request):
    """Get the latest published article for today's language with its quiz questions and word definitions"""
    try:
        # Determine today's language
        daily_language = get_daily_language()

        # Get the latest unified article for today's language
        latest_article = (
            UnifiedArticle.objects.filter(is_active=True, language=daily_language)
            .order_by("-publication_date", "-id")
            .first()
        )

        # Fallback to any language if no article found for today's language
        if not latest_article:
            latest_article = (
                UnifiedArticle.objects.filter(is_active=True)
                .order_by("-publication_date", "-id")
                .first()
            )

        if not latest_article:
            return Response(
                {
                    "success": False,
                    "message": "Aucun article disponible",
                    "article": None,
                }
            )

        # Get quiz questions from the unified article's JSON data
        quiz_questions = latest_article.get_quiz_questions()

        quiz_data = []
        for question_data in quiz_questions:
            quiz_data.append(
                {
                    "id": question_data.get("word_definition_id"),
                    "question_text": question_data.get("question_text"),
                    "options": {
                        "A": question_data.get("option_a"),
                        "B": question_data.get("option_b"),
                        "C": question_data.get("option_c"),
                        "D": question_data.get("option_d"),
                    },
                    "correct_option": question_data.get("correct_option"),
                    "points": question_data.get("points", 10),
                    "question_type": question_data.get("question_type", "vocabulary"),
                    "word": {
                        "word": question_data.get("word"),
                        "definition": question_data.get("word_definition"),
                        "usage_example": question_data.get("word_usage_example"),
                        "difficulty_level": question_data.get("word_difficulty_level"),
                    },
                }
            )

        # Get article words with their definitions - temporarily empty for UnifiedArticle
        # TODO: Update ArticleWord model to work with UnifiedArticle or handle differently
        article_words = []

        keywords = []
        for article_word in article_words:
            word_data = {
                "word": article_word.word.word,
                "position": article_word.position_in_text,
                "context": article_word.context_sentence,
                "is_key": article_word.is_key_vocabulary,
            }

            # Add definition if available
            if hasattr(article_word.word, "definition"):
                word_data["definition"] = {
                    "grammar_note": article_word.word.definition.grammar_note,
                    "usage_example": article_word.word.definition.usage_example,
                    "difficulty_level": article_word.word.definition.difficulty_level,
                    "etymology": article_word.word.definition.etymology,
                }

            keywords.append(word_data)

        # Format article data
        article_data = {
            "id": latest_article.id,
            "title": latest_article.title,
            "content": latest_article.content,
            "language": latest_article.language,
            "level": latest_article.level,
            "publication_date": latest_article.publication_date.isoformat(),
            "date": latest_article.publication_date.isoformat(),
            "is_active": latest_article.is_active,
            "created_at": latest_article.created_at.isoformat(),
            "summary": latest_article.summary,
            "tags": latest_article.tags,
            "keywords": [kw["word"] for kw in keywords],
            "keywords_details": keywords,
            "quiz_questions": quiz_data,
        }

        return Response(
            {
                "success": True,
                "message": "Article avec quiz récupéré avec succès",
                "article": article_data,
                "debug_info": {
                    "article_id": latest_article.id,
                    "publication_date": latest_article.publication_date.isoformat(),
                    "keywords_count": len(keywords),
                    "quiz_questions_count": len(quiz_data),
                    "daily_language": daily_language,
                    "article_language": latest_article.language,
                    "language_match": latest_article.language == daily_language,
                },
            }
        )

    except Exception as e:
        return Response(
            {
                "success": False,
                "error": f"Erreur lors de la récupération de l'article: {str(e)}",
                "article": None,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def api_latest_comprehensive_article(request):
    """Get the latest comprehensive unified article for today's language"""
    try:
        # Determine today's language
        daily_language = get_daily_language()

        # Get the latest unified article for today's language
        latest_article = (
            UnifiedArticle.objects.filter(
                is_active=True,
                language=daily_language,
            )
            .order_by("-publication_date", "-created_at")
            .first()
        )

        # Fallback to any language if no article found for today's language
        if not latest_article:
            latest_article = (
                UnifiedArticle.objects.filter(is_active=True)
                .order_by("-publication_date", "-created_at")
                .first()
            )

        if not latest_article:
            return Response(
                {
                    "success": False,
                    "message": "Aucun article complet disponible",
                    "comprehensive_article": None,
                }
            )

        # Use the unified article directly
        article = latest_article

        # Get quiz questions from the unified article's JSON data
        quiz_questions_data = article.get_quiz_questions()

        quiz_data = []
        for question_data in quiz_questions_data:
            quiz_data.append(
                {
                    "id": question_data.get("word_definition_id"),
                    "question_text": question_data.get("question_text"),
                    "options": {
                        "A": question_data.get("option_a"),
                        "B": question_data.get("option_b"),
                        "C": question_data.get("option_c"),
                        "D": question_data.get("option_d"),
                    },
                    "correct_option": question_data.get("correct_option"),
                    "points": question_data.get("points", 10),
                    "question_type": question_data.get("question_type", "vocabulary"),
                    "word": {
                        "word": question_data.get("word"),
                        "definition": question_data.get("word_definition"),
                        "usage_example": question_data.get("word_usage_example"),
                        "difficulty_level": question_data.get("word_difficulty_level"),
                    },
                }
            )

        # Get article words - temporarily empty for unified article
        # TODO: Update ArticleWord model to work with UnifiedArticle or integrate into unified model
        keywords = []

        # Format comprehensive article data using unified article
        comprehensive_data = {
            "id": article.id,
            "is_published": True,  # Unified articles are published by default if is_active
            "notes": f"Unified article: {article.title}",
            "created_at": article.created_at.isoformat(),
            "updated_at": article.updated_at.isoformat(),
            # Article data
            "article": {
                "id": article.id,
                "title": article.title,
                "content": article.content,
                "language": article.language,
                "level": article.level,
                "publication_date": article.publication_date.isoformat(),
                "is_active": article.is_active,
                "summary": article.summary,
                "tags": article.tags,
                "author": article.author.username if article.author else None,
            },
            # Quiz data from unified article
            "quiz": {
                "id": article.id,
                "title": article.quiz_title,
                "description": article.quiz_description,
                "passing_score": article.quiz_passing_score,
                "time_limit": article.quiz_time_limit,
                "is_active": article.quiz_is_active,
                "questions_count": len(quiz_data),
                "questions": quiz_data,
            },
            # Grammar note data from unified article
            "grammar_note": {
                "id": article.id,
                "title": article.grammar_title,
                "content": article.grammar_content,
                "key_concepts": article.grammar_key_concepts,
                "learning_objectives": article.grammar_learning_objectives,
                "difficulty_level": article.grammar_difficulty_level,
            },
            # Legacy compatibility fields
            "title": article.title,
            "content": article.content,
            "language": article.language,
            "level": article.level,
            "publication_date": article.publication_date.isoformat(),
            "date": article.publication_date.isoformat(),
            "keywords": [kw["word"] for kw in keywords],
            "keywords_details": keywords,
            "quiz_questions": quiz_data,
            # Completion status based on unified article properties
            "completion_status": "complete" if article.is_complete else "in_progress",
        }

        return Response(
            {
                "success": True,
                "message": "Article complet récupéré avec succès",
                "comprehensive_article": comprehensive_data,
                "debug_info": {
                    "unified_article_id": article.id,
                    "article_id": article.id,
                    "publication_date": article.publication_date.isoformat(),
                    "keywords_count": len(keywords),
                    "quiz_questions_count": len(quiz_data),
                    "daily_language": daily_language,
                    "article_language": article.language,
                    "language_match": article.language == daily_language,
                    "is_complete": article.is_complete,
                    "has_quiz": article.has_quiz,
                    "has_grammar_note": article.has_grammar_note,
                },
            }
        )

    except Exception as e:
        return Response(
            {
                "success": False,
                "error": f"Erreur lors de la récupération de l'article complet: {str(e)}",
                "comprehensive_article": None,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def api_all_articles_with_quiz(request):
    """Get all published articles with their quiz counts"""
    try:
        # Get all active unified articles with quiz question counts
        articles = UnifiedArticle.objects.filter(is_active=True).order_by(
            "-publication_date"
        )

        articles_data = []
        for article in articles:
            # Count quiz questions
            quiz_count = len(article.get_quiz_questions())

            # Get article words
            article_words = ArticleWord.objects.filter(article=article).select_related(
                "word"
            )
            keywords = [aw.word.word for aw in article_words]

            article_data = {
                "id": article.id,
                "title": article.title,
                "content": article.content,
                "language": article.language,
                "level": article.level,
                "publication_date": article.publication_date.isoformat(),
                "date": article.publication_date.isoformat(),
                "is_active": article.is_active,
                "created_at": article.created_at.isoformat(),
                "summary": article.summary,
                "keywords": keywords,
                "quiz_count": quiz_count,
            }
            articles_data.append(article_data)

        return Response(
            {
                "success": True,
                "message": f"{len(articles_data)} articles récupérés",
                "articles": articles_data,
                "count": len(articles_data),
            }
        )

    except Exception as e:
        return Response(
            {
                "success": False,
                "error": f"Erreur lors de la récupération des articles: {str(e)}",
                "articles": [],
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def api_create_article_with_quiz(request):
    """Create a new article with associated quiz questions and word definitions"""
    try:
        # Get article data
        title = request.data.get("title", "").strip()
        content = request.data.get("content", "").strip()
        language = request.data.get("language", "").strip()
        level = request.data.get("level", "intermediate").strip()
        publication_date = request.data.get("publication_date")
        summary = request.data.get("summary", "").strip()
        tags = request.data.get("tags", "").strip()

        # Validation
        if not title:
            return Response(
                {
                    "success": False,
                    "error": "Le titre est obligatoire",
                    "field": "title",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not content:
            return Response(
                {
                    "success": False,
                    "error": "Le contenu est obligatoire",
                    "field": "content",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not language:
            return Response(
                {
                    "success": False,
                    "error": "La langue est obligatoire",
                    "field": "language",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Handle publication date
        if publication_date:
            try:
                from datetime import datetime

                pub_date = datetime.strptime(publication_date, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {
                        "success": False,
                        "error": "Format de date invalide (YYYY-MM-DD attendu)",
                        "field": "publication_date",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            pub_date = date.today()

        # Create the unified article with default quiz and grammar data
        article = UnifiedArticle.objects.create(
            title=title,
            content=content,
            language=language,
            level=level,
            publication_date=pub_date,
            summary=summary,
            tags=tags,
            is_active=True,
            quiz_title=f"Quiz for {title}",
            quiz_description=f"Test your understanding of {title}",
            grammar_title=f"Grammar notes for {title}",
            grammar_content=f"Key grammar concepts covered in {title}",
        )

        # Extract keywords and create words/definitions
        import re

        keywords = re.findall(r"\[([^\]]+)\]", content)

        for keyword in keywords:
            # Create or get the word
            word, created = Word.objects.get_or_create(
                word=keyword,
                defaults={
                    "primary_language": language,
                    "created_by": None,  # System admin
                },
            )

            # Create word definition if it doesn't exist
            if not hasattr(word, "definition"):
                WordDefinition.objects.create(
                    word=word,
                    grammar_note=f"Définition automatique pour '{keyword}'",
                    usage_example=f"Exemple: {keyword} dans le contexte de l'article.",
                    difficulty_level=level,
                )

            # Create a quiz question for this word in the unified article
            article.add_quiz_question(
                word_definition=word.definition,
                question_text=f"Que signifie le mot '{keyword}' dans ce contexte ?",
                option_a="Option A (à définir)",
                option_b="Option B (à définir)",
                option_c="Option C (à définir)",
                option_d="Option D (à définir)",
                correct_option="A",
                question_type="vocabulary",
                difficulty_level=level,
            )

        # Handle grammar note data if provided
        grammar_data = request.data.get("grammar_note")
        if grammar_data and isinstance(grammar_data, dict):
            # Update the unified article's grammar data
            if grammar_data.get("title"):
                article.grammar_title = grammar_data["title"].strip()
            if grammar_data.get("content"):
                article.grammar_content = grammar_data["content"].strip()
            if grammar_data.get("difficulty_level"):
                article.grammar_difficulty_level = grammar_data["difficulty_level"]
            if grammar_data.get("key_concepts"):
                article.grammar_key_concepts = grammar_data["key_concepts"].strip()
            if grammar_data.get("learning_objectives"):
                article.grammar_learning_objectives = grammar_data[
                    "learning_objectives"
                ].strip()

            # Save updated unified article
            article.save()

        # Format response
        article_data = {
            "id": article.id,
            "title": article.title,
            "content": article.content,
            "language": article.language,
            "level": article.level,
            "publication_date": article.publication_date.isoformat(),
            "date": article.publication_date.isoformat(),
            "is_active": article.is_active,
            "created_at": article.created_at.isoformat(),
            "summary": article.summary,
            "tags": article.tags,
            "keywords": keywords,
        }

        return Response(
            {
                "success": True,
                "message": "Article unifié créé avec succès",
                "article": article_data,
                "quiz": {
                    "id": article.id,
                    "title": article.quiz_title,
                    "description": article.quiz_description,
                    "questions_count": len(article.get_quiz_questions()),
                },
                "grammar_note": {
                    "id": article.id,
                    "title": article.grammar_title,
                    "content": article.grammar_content,
                    "difficulty_level": article.grammar_difficulty_level,
                },
                "unified_article": {
                    "id": article.id,
                    "has_quiz": article.has_quiz,
                    "has_grammar_note": article.has_grammar_note,
                    "is_complete": article.is_complete,
                },
                "debug_info": {
                    "article_id": article.id,
                    "keywords_extracted": len(keywords),
                    "quiz_questions_created": len(keywords),
                    "publication_date": article.publication_date.isoformat(),
                    "is_complete": article.is_complete,
                },
            },
            status=status.HTTP_201_CREATED,
        )

    except Exception as e:
        return Response(
            {
                "success": False,
                "error": f"Erreur lors de la création de l'article: {str(e)}",
                "article": None,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def api_word_definition(request, word_id):
    """Get detailed word definition with translations"""
    try:
        word = get_object_or_404(Word, id=word_id)

        # Get all translations
        translations = {}
        for translation in word.translations.all():
            translations[translation.language] = {
                "translation": translation.translation,
                "pronunciation": translation.pronunciation,
                "part_of_speech": translation.part_of_speech,
            }

        # Get definition if available
        definition_data = None
        if hasattr(word, "definition"):
            definition_data = {
                "grammar_note": word.definition.grammar_note,
                "usage_example": word.definition.usage_example,
                "difficulty_level": word.definition.difficulty_level,
                "etymology": word.definition.etymology,
                "memory_tip": word.definition.memory_tip,
                "common_mistakes": word.definition.common_mistakes,
            }

        word_data = {
            "id": word.id,
            "word": word.word,
            "primary_language": word.primary_language,
            "translations": translations,
            "definition": definition_data,
        }

        return Response(
            {
                "success": True,
                "word": word_data,
            }
        )

    except Exception as e:
        return Response(
            {
                "success": False,
                "error": f"Erreur lors de la récupération du mot: {str(e)}",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def api_word_by_name(request, word_name):
    """Get detailed word definition by word name (for frontend showTranslation)"""
    try:
        word = get_object_or_404(Word, word__iexact=word_name)

        # Get all translations
        translations = {}
        for translation in word.translations.all():
            translations[translation.language] = {
                "translation": translation.translation,
                "pronunciation": translation.pronunciation,
                "part_of_speech": translation.part_of_speech,
            }

        # Get definition if available
        definition_data = None
        if hasattr(word, "definition"):
            definition_data = {
                "grammar_note": word.definition.grammar_note,
                "usage_example": word.definition.usage_example,
                "difficulty_level": word.definition.difficulty_level,
                "etymology": word.definition.etymology,
                "memory_tip": word.definition.memory_tip,
                "common_mistakes": word.definition.common_mistakes,
            }

        # Format for frontend showTranslation function
        word_data = {
            "id": word.id,
            "word": word.word,
            "primary_language": word.primary_language,
            # Format compatible with existing showTranslation function
            "es": translations.get("es", {}).get("translation", ""),
            "it": translations.get("it", {}).get("translation", ""),
            "pt": translations.get("pt", {}).get("translation", ""),
            "ca": translations.get("ca", {}).get("translation", ""),
            "fr": translations.get("fr", {}).get("translation", ""),
            "grammar": definition_data.get("grammar_note", "")
            if definition_data
            else "",
            "usage_example": definition_data.get("usage_example", "")
            if definition_data
            else "",
            "translations": translations,
            "definition": definition_data,
        }

        return Response(
            {
                "success": True,
                "word": word_data,
            }
        )

    except Exception as e:
        return Response(
            {
                "success": False,
                "error": f"Mot '{word_name}' non trouvé en base de données",
            },
            status=404,
        )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def api_user_streak(request):
    """Get or update user streak (flammes)"""
    from datetime import date, timedelta

    from django.utils import timezone

    from .models import UserActivity, UserProfile

    try:
        profile, created = UserProfile.objects.get_or_create(user=request.user)

        if request.method == "GET":
            # Simplement retourner le streak actuel
            return Response(
                {
                    "success": True,
                    "streak": profile.current_streak,
                    "last_activity": profile.last_activity_date.isoformat()
                    if profile.last_activity_date
                    else None,
                    "user": request.user.username,
                }
            )

        elif request.method == "POST":
            # Mettre à jour le streak basé sur l'activité d'aujourd'hui
            today = date.today()
            yesterday = today - timedelta(days=1)

            # Créer ou récupérer l'activité d'aujourd'hui
            activity, activity_created = UserActivity.objects.get_or_create(
                user=request.user,
                date=today,
                defaults={
                    "points_earned": 0,
                    "articles_read": 0,
                    "quizzes_completed": 0,
                },
            )

            # Calculer le nouveau streak
            previous_streak = profile.current_streak

            if profile.last_activity_date is None:
                # Premier jour d'activité
                new_streak = 1
            elif profile.last_activity_date == yesterday:
                # Activité consécutive - incrémenter le streak
                new_streak = profile.current_streak + 1
            elif profile.last_activity_date == today:
                # Déjà actif aujourd'hui - garder le même streak
                new_streak = profile.current_streak
            else:
                # Gap dans l'activité - reset à 1
                new_streak = 1

            # Mettre à jour le profil
            profile.current_streak = new_streak
            profile.last_activity_date = today
            profile.save()

            # Mettre à jour l'activité selon le type d'action
            action_type = request.data.get("action_type", "general")
            if action_type == "quiz_completed":
                activity.quizzes_completed += 1
                activity.points_earned += request.data.get("points", 10)
            elif action_type == "article_read":
                activity.articles_read += 1
                activity.points_earned += request.data.get("points", 5)

            activity.save()

            return Response(
                {
                    "success": True,
                    "streak": new_streak,
                    "previous_streak": previous_streak,
                    "streak_increased": new_streak > previous_streak,
                    "last_activity": today.isoformat(),
                    "message": f"Streak mis à jour ! Vous avez {new_streak} flamme{'s' if new_streak > 1 else ''} 🔥",
                }
            )

    except Exception as e:
        return Response(
            {
                "success": False,
                "error": f"Erreur lors de la gestion du streak: {str(e)}",
            },
            status=500,
        )


# Import authentication views
from .auth_views import (
    api_login,
    api_submit_quiz_result,
    api_user_profile,
    home_view,
    login_view,
    logout_view,
    register_view,
)


# Legacy compatibility functions
def api_register(request):
    """Legacy API endpoint for registration"""
    return Response({"success": False, "message": "Use new authentication flow"})


def api_logout(request):
    """Legacy API endpoint for logout"""
    return Response({"success": True, "message": "Logout successful"})


def api_user_stats(request):
    """API endpoint to get user statistics"""
    return api_user_profile(request)


def api_latest_article(request):
    """Legacy API - redirect to new quiz-integrated version"""
    return api_latest_article_with_quiz(request)


def api_all_articles(request):
    """Legacy API - redirect to new quiz-integrated version"""
    return api_all_articles_with_quiz(request)


def api_create_article(request):
    """Legacy API - redirect to new quiz-integrated version"""
    return api_create_article_with_quiz(request)
