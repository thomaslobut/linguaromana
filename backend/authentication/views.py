import json
from datetime import date, datetime

from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db.models import Sum
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Article, UserActivity, UserProfile, UserQuizResult
from .utils import update_user_streak


# Template-based views for authentication
def login_view(request):
    """Display login form and handle login"""
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return redirect("home")
        else:
            messages.error(request, "Invalid username or password.")

    return render(request, "authentication/login.html")


def register_view(request):
    """Display registration form and handle user registration"""
    if request.method == "POST":
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")
        password_confirm = request.POST.get("password_confirm")
        preferred_language = request.POST.get("preferred_language", "es")

        # Validation
        if password != password_confirm:
            messages.error(request, "Passwords do not match.")
            return render(request, "authentication/register.html")

        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists.")
            return render(request, "authentication/register.html")

        if User.objects.filter(email=email).exists():
            messages.error(request, "Email already registered.")
            return render(request, "authentication/register.html")

        # Create user
        user = User.objects.create_user(
            username=username, email=email, password=password
        )

        # Create user profile
        UserProfile.objects.create(user=user, preferred_language=preferred_language)

        login(request, user)
        messages.success(request, "Account created successfully!")
        return redirect("home")

    return render(request, "authentication/register.html")


@login_required
def logout_view(request):
    """Handle user logout"""
    logout(request)
    messages.success(request, "You have been logged out successfully.")
    return redirect("login")


def home_view(request):
    """Home page that serves the main application"""
    context = {}

    if request.user.is_authenticated:
        # Get user profile data for authenticated users
        profile = UserProfile.objects.get_or_create(user=request.user)[0]
        context = {
            "user": request.user,
            "profile": profile,
            "is_authenticated": True,
        }
    else:
        # Guest users can still access articles but without profile data
        context = {
            "user": None,
            "profile": None,
            "is_authenticated": False,
        }

    return render(request, "home.html", context)


# API Views for AJAX/Frontend integration
@api_view(["POST"])
@permission_classes([AllowAny])
def api_login(request):
    """API endpoint for user login"""
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"error": "Username and password required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(username=username, password=password)

    if user is not None:
        login(request, user)
        profile = UserProfile.objects.get_or_create(user=user)[0]
        return Response(
            {
                "success": True,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                },
                "profile": {
                    "preferred_language": profile.preferred_language,
                    "current_streak": profile.current_streak,
                    "total_points": profile.total_points,
                    "level": profile.level,
                },
            }
        )
    else:
        return Response(
            {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def api_register(request):
    """API endpoint for user registration"""
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")
    preferred_language = request.data.get("preferred_language", "es")

    if not all([username, email, password]):
        return Response(
            {"error": "Username, email and password required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(email=email).exists():
        return Response(
            {"error": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Create user
    user = User.objects.create_user(username=username, email=email, password=password)

    # Create profile
    profile = UserProfile.objects.create(
        user=user, preferred_language=preferred_language
    )

    login(request, user)

    return Response(
        {
            "success": True,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            },
            "profile": {
                "preferred_language": profile.preferred_language,
                "current_streak": profile.current_streak,
                "total_points": profile.total_points,
                "level": profile.level,
            },
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_logout(request):
    """API endpoint for user logout"""
    logout(request)
    return Response({"success": True})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_user_profile(request):
    """Get current user profile data"""
    profile = UserProfile.objects.get_or_create(user=request.user)[0]
    return Response(
        {
            "user": {
                "id": request.user.id,
                "username": request.user.username,
                "email": request.user.email,
            },
            "profile": {
                "preferred_language": profile.preferred_language,
                "current_streak": profile.current_streak,
                "total_points": profile.total_points,
                "level": profile.level,
                "last_activity_date": profile.last_activity_date.isoformat(),
            },
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_submit_quiz_result(request):
    """Submit quiz results and update user progress"""
    article_id = request.data.get("article_id")
    score = request.data.get("score")
    points_earned = request.data.get("points_earned", 0)
    time_spent = request.data.get("time_spent")

    if not all([article_id is not None, score is not None]):
        return Response(
            {"error": "Article ID and score required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        # For now, we'll create a default article if it doesn't exist
        # In production, you'd have actual articles
        article, created = Article.objects.get_or_create(
            id=article_id,
            defaults={
                "title": f"Article {article_id}",
                "content": "Default content",
                "language": "es",
                "publication_date": date.today(),
            },
        )

        # Create or update quiz result
        quiz_result, created = UserQuizResult.objects.get_or_create(
            user=request.user,
            article=article,
            defaults={
                "score": score,
                "points_earned": points_earned,
                "time_spent": time_spent,
            },
        )

        if not created:
            # Update existing result only if score is better
            if score > quiz_result.score:
                quiz_result.score = score
                quiz_result.points_earned = points_earned
                quiz_result.time_spent = time_spent
                quiz_result.save()

        # Update user profile
        profile = UserProfile.objects.get_or_create(user=request.user)[0]
        profile.total_points += points_earned
        profile.save()

        # Update daily activity
        today = date.today()
        activity, created = UserActivity.objects.get_or_create(
            user=request.user,
            date=today,
            defaults={"points_earned": points_earned, "quizzes_completed": 1},
        )

        if not created:
            activity.points_earned += points_earned
            activity.quizzes_completed += 1
            activity.save()

        # Update user streak (only for the first quiz of the day)
        streak_result = update_user_streak(request.user, today)

        return Response(
            {
                "success": True,
                "total_points": profile.total_points,
                "quiz_completed": True,
                "streak_info": {
                    "current_streak": streak_result["current_streak"],
                    "streak_updated": streak_result["streak_updated"],
                },
            }
        )

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_user_stats(request):
    """Get user statistics and progress"""
    profile = UserProfile.objects.get_or_create(user=request.user)[0]

    # Get quiz statistics
    total_quizzes = UserQuizResult.objects.filter(user=request.user).count()
    avg_score = (
        UserQuizResult.objects.filter(user=request.user).aggregate(
            avg_score=Sum("score")
        )["avg_score"]
        or 0
    )

    if total_quizzes > 0:
        avg_score = avg_score / total_quizzes

    # Get recent activity
    recent_activities = UserActivity.objects.filter(user=request.user)[:7]

    return Response(
        {
            "profile": {
                "total_points": profile.total_points,
                "current_streak": profile.current_streak,
                "level": profile.level,
                "preferred_language": profile.preferred_language,
            },
            "stats": {
                "total_quizzes": total_quizzes,
                "average_score": round(avg_score, 1),
            },
            "recent_activity": [
                {
                    "date": activity.date.isoformat(),
                    "articles_read": activity.articles_read,
                    "quizzes_completed": activity.quizzes_completed,
                    "points_earned": activity.points_earned,
                }
                for activity in recent_activities
            ],
        }
    )
