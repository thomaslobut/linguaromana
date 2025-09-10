"""
Authentication views for the core app
Temporary file to add authentication functionality
"""

from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.shortcuts import redirect, render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import UserActivity, UserProfile, UserQuizResult


def login_view(request):
    """Display login form and handle login"""
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return redirect("core:home")
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

        messages.success(request, "Account created successfully! Please log in.")
        return redirect("core:login")

    return render(request, "authentication/register.html")


@login_required
def logout_view(request):
    """Handle user logout"""
    logout(request)
    return redirect("core:home")


def home_view(request):
    """Home page that serves the main application"""
    context = {}

    if request.user.is_authenticated:
        # Get user profile
        try:
            profile = request.user.userprofile
        except UserProfile.DoesNotExist:
            # Create profile if it doesn't exist
            profile = UserProfile.objects.create(user=request.user)

        context.update(
            {
                "is_authenticated": True,
                "user": request.user,
                "profile": profile,
            }
        )
    else:
        context.update(
            {
                "is_authenticated": False,
                "user": None,
                "profile": None,
            }
        )

    return render(request, "home.html", context)


# API Views
@api_view(["POST"])
@permission_classes([AllowAny])
def api_login(request):
    """API endpoint for user login"""
    try:
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"success": False, "message": "Username and password required"},
                status=400,
            )

        user = authenticate(username=username, password=password)

        if user is not None:
            login(request, user)
            profile, created = UserProfile.objects.get_or_create(user=user)

            return Response(
                {
                    "success": True,
                    "message": "Login successful",
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "profile": {
                            "preferred_language": profile.preferred_language,
                            "current_streak": profile.current_streak,
                            "total_points": profile.total_points,
                            "level": profile.level,
                        },
                    },
                }
            )
        else:
            return Response(
                {"success": False, "message": "Invalid credentials"}, status=400
            )

    except Exception as e:
        return Response(
            {"success": False, "message": f"Login error: {str(e)}"}, status=500
        )


@api_view(["GET"])
@login_required
def api_user_profile(request):
    """API endpoint to get user profile information"""
    try:
        profile, created = UserProfile.objects.get_or_create(user=request.user)

        return Response(
            {
                "success": True,
                "user": {
                    "id": request.user.id,
                    "username": request.user.username,
                    "email": request.user.email,
                    "profile": {
                        "preferred_language": profile.preferred_language,
                        "current_streak": profile.current_streak,
                        "total_points": profile.total_points,
                        "level": profile.level,
                        "last_activity_date": profile.last_activity_date,
                    },
                },
            }
        )

    except Exception as e:
        return Response(
            {"success": False, "message": f"Profile error: {str(e)}"}, status=500
        )


@api_view(["POST"])
@login_required
def api_submit_quiz_result(request):
    """API endpoint to submit quiz results"""
    try:
        from datetime import date

        from django.shortcuts import get_object_or_404

        from .models import Article

        article_id = request.data.get("article_id")
        score = request.data.get("score")

        if not article_id or score is None:
            return Response(
                {"success": False, "message": "Article ID and score required"},
                status=400,
            )

        article = get_object_or_404(Article, id=article_id)
        points_earned = max(0, int(score * 10))

        # Save or update quiz result
        quiz_result, created = UserQuizResult.objects.update_or_create(
            user=request.user,
            article=article,
            defaults={
                "score": score,
                "points_earned": points_earned,
            },
        )

        # Update user profile points
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        if created:  # Only add points for new quiz results
            profile.total_points += points_earned
            profile.save()

        return Response(
            {
                "success": True,
                "message": "Quiz result saved",
                "quiz_result": {
                    "score": quiz_result.score,
                    "points_earned": quiz_result.points_earned,
                    "completed_at": quiz_result.completed_at,
                },
                "total_points": profile.total_points,
            }
        )

    except Exception as e:
        return Response(
            {"success": False, "message": f"Quiz submission error: {str(e)}"},
            status=500,
        )
