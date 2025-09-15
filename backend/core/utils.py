from datetime import date, timedelta

from django.contrib.auth.models import User

from .models import UserActivity, UserProfile


def update_user_streak(user: User, activity_date: date = None) -> dict:
    """
    Update user streak based on their activity.

    Rules:
    - A user with 1 flame will have 2 flames if they do activity the next day
    - A user with 1 flame will NOT have 2 flames if they do 2 activities the same day
    - Streak resets if user misses a day

    Args:
        user: The user object
        activity_date: Date of the activity (defaults to today)

    Returns:
        dict: Contains streak information and whether it was updated
    """
    if activity_date is None:
        activity_date = date.today()

    profile, created = UserProfile.objects.get_or_create(user=user)

    # Check if user already had meaningful activity today
    existing_activity = UserActivity.objects.filter(
        user=user, date=activity_date
    ).first()

    # If activity exists and has meaningful data, don't update streak
    if existing_activity and (
        existing_activity.quizzes_completed > 0 or existing_activity.articles_read > 0
    ):
        return {
            "streak_updated": False,
            "current_streak": profile.current_streak,
            "activity_date": activity_date,
            "message": "Streak not updated - already had activity today",
        }

    # This is the first meaningful activity of the day
    yesterday = activity_date - timedelta(days=1)

    # Check if user had activity yesterday
    had_activity_yesterday = UserActivity.objects.filter(
        user=user, date=yesterday, quizzes_completed__gt=0
    ).exists()

    # Determine if this is the first activity ever
    is_first_activity = profile.last_activity_date is None

    # Calculate days since last activity
    days_since_last = 0
    if profile.last_activity_date:
        days_since_last = (activity_date - profile.last_activity_date).days

    # Apply streak logic
    if is_first_activity:
        # First activity ever
        profile.current_streak = 1
    elif days_since_last == 1 or had_activity_yesterday:
        # Consecutive day - increment streak
        profile.current_streak += 1
    elif days_since_last > 1:
        # Missed days - reset to 1
        profile.current_streak = 1
    else:
        # Same day activity - keep current streak
        pass

    # Update last activity date
    profile.last_activity_date = activity_date
    profile.save()

    # Create or update user activity
    user_activity, activity_created = UserActivity.objects.get_or_create(
        user=user,
        date=activity_date,
        defaults={"articles_read": 0, "quizzes_completed": 0, "points_earned": 0},
    )

    return {
        "streak_updated": True,
        "current_streak": profile.current_streak,
        "activity_date": activity_date,
    }


def reset_user_streak(user: User) -> dict:
    """Reset user streak to 0"""
    profile, created = UserProfile.objects.get_or_create(user=user)
    profile.current_streak = 0
    profile.save()

    return {"streak_reset": True, "current_streak": 0}


def get_user_streak_info(user: User) -> dict:
    """Get current streak information for a user"""
    profile, created = UserProfile.objects.get_or_create(user=user)

    return {
        "current_streak": profile.current_streak,
        "last_activity_date": profile.last_activity_date,
        "total_points": profile.total_points,
    }
