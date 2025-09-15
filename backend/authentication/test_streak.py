from datetime import date, timedelta

from django.contrib.auth.models import User
from django.test import TestCase

from .models import Article, UserActivity, UserProfile, UserQuizResult
from .utils import get_user_streak_info, reset_user_streak, update_user_streak


class StreakSystemTestCase(TestCase):
    """Test cases for the streak (flame) system"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.profile = UserProfile.objects.create(
            user=self.user, current_streak=0, total_points=0, last_activity_date=None
        )

        # Create a test article for quiz submissions
        self.article = Article.objects.create(
            title="Test Article",
            content="Test content",
            language="es",
            publication_date=date.today(),
        )

    def test_user_with_one_flame_gets_two_flames_next_day(self):
        """
        Test: Une personne ayant une flamme aura deux flammes
        s'il fait l'activité le jour suivant
        """
        # Set up: User has 1 flame from yesterday
        yesterday = date.today() - timedelta(days=1)
        self.profile.current_streak = 1
        self.profile.last_activity_date = yesterday
        self.profile.save()

        # Create activity from yesterday
        UserActivity.objects.get_or_create(
            user=self.user,
            date=yesterday,
            defaults={"quizzes_completed": 1, "points_earned": 10},
        )

        # Action: User does activity today
        today = date.today()
        result = update_user_streak(self.user, today)

        # Assertions
        self.assertTrue(result["streak_updated"])
        self.assertEqual(result["current_streak"], 2)

        # Verify in database
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.current_streak, 2)
        self.assertEqual(self.profile.last_activity_date, today)

    def test_user_with_one_flame_no_two_flames_same_day(self):
        """
        Test: Une personne ayant une flamme n'en aura pas deux
        s'il fait deux activités le même jour
        """
        # Set up: User has 1 flame and already did activity today
        today = date.today()
        self.profile.current_streak = 1
        self.profile.last_activity_date = today
        self.profile.save()

        # Create first activity today
        UserActivity.objects.get_or_create(
            user=self.user,
            date=today,
            defaults={"quizzes_completed": 1, "points_earned": 10},
        )

        # Action: User does second activity same day
        result = update_user_streak(self.user, today)

        # Assertions
        self.assertFalse(result["streak_updated"])
        self.assertEqual(result["current_streak"], 1)
        self.assertIn("already had activity today", result["message"])

        # Verify in database - streak should remain 1
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.current_streak, 1)

    def test_streak_resets_after_missing_day(self):
        """Test that streak resets to 1 when user misses a day"""
        # Set up: User had 3 flames but missed yesterday
        two_days_ago = date.today() - timedelta(days=2)
        self.profile.current_streak = 3
        self.profile.last_activity_date = two_days_ago
        self.profile.save()

        # Create activity from two days ago
        UserActivity.objects.get_or_create(
            user=self.user,
            date=two_days_ago,
            defaults={"quizzes_completed": 1, "points_earned": 10},
        )

        # Action: User does activity today (skipped yesterday)
        today = date.today()
        result = update_user_streak(self.user, today)

        # Assertions
        self.assertTrue(result["streak_updated"])
        self.assertEqual(result["current_streak"], 1)  # Should reset to 1

        # Verify in database
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.current_streak, 1)

    def test_first_activity_starts_streak_at_one(self):
        """Test that user's first activity starts streak at 1"""
        # Set up: New user with no activity
        self.assertEqual(self.profile.current_streak, 0)

        # Action: User does first activity
        today = date.today()
        result = update_user_streak(self.user, today)

        # Assertions
        self.assertTrue(result["streak_updated"])
        self.assertEqual(result["current_streak"], 1)

        # Verify in database
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.current_streak, 1)
        self.assertEqual(self.profile.last_activity_date, today)

    def test_consecutive_days_increment_streak(self):
        """Test that consecutive daily activities properly increment streak"""
        # Day 1
        day1 = date.today() - timedelta(days=2)
        update_user_streak(self.user, day1)
        UserActivity.objects.get_or_create(
            user=self.user, date=day1, defaults={"quizzes_completed": 1}
        )

        # Day 2
        day2 = date.today() - timedelta(days=1)
        result2 = update_user_streak(self.user, day2)
        UserActivity.objects.get_or_create(
            user=self.user, date=day2, defaults={"quizzes_completed": 1}
        )

        # Day 3 (today)
        day3 = date.today()
        result3 = update_user_streak(self.user, day3)

        # Assertions
        self.assertEqual(result2["current_streak"], 2)
        self.assertEqual(result3["current_streak"], 3)

        # Verify final state
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.current_streak, 3)

    def test_reset_user_streak_function(self):
        """Test the reset_user_streak utility function"""
        # Set up: User has some streak
        self.profile.current_streak = 5
        self.profile.save()

        # Action: Reset streak
        result = reset_user_streak(self.user)

        # Assertions
        self.assertTrue(result["streak_reset"])
        self.assertEqual(result["current_streak"], 0)

        # Verify in database
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.current_streak, 0)

    def test_get_user_streak_info_function(self):
        """Test the get_user_streak_info utility function"""
        # Set up: User with some data
        today = date.today()
        self.profile.current_streak = 4
        self.profile.total_points = 150
        self.profile.last_activity_date = today
        self.profile.save()

        # Action: Get streak info
        info = get_user_streak_info(self.user)

        # Assertions
        self.assertEqual(info["current_streak"], 4)
        self.assertEqual(info["total_points"], 150)
        self.assertEqual(info["last_activity_date"], today)

    def test_weekend_gap_resets_streak(self):
        """Test that missing weekend days properly resets streak"""
        # Set up: User had activity on Friday
        friday = date.today() - timedelta(days=4)  # Assuming today is Tuesday
        self.profile.current_streak = 2
        self.profile.last_activity_date = friday
        self.profile.save()

        UserActivity.objects.get_or_create(
            user=self.user,
            date=friday,
            defaults={"quizzes_completed": 1, "points_earned": 10},
        )

        # Action: User does activity on Tuesday (missed Sat, Sun, Mon)
        tuesday = date.today()
        result = update_user_streak(self.user, tuesday)

        # Assertions - streak should reset because of the gap
        self.assertTrue(result["streak_updated"])
        self.assertEqual(result["current_streak"], 1)

        # Verify in database
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.current_streak, 1)

    def test_multiple_activities_same_day_only_counts_once(self):
        """Test that multiple quiz completions on same day don't affect streak"""
        # Set up: User starts with streak of 1
        yesterday = date.today() - timedelta(days=1)
        self.profile.current_streak = 1
        self.profile.last_activity_date = yesterday
        self.profile.save()

        UserActivity.objects.get_or_create(
            user=self.user,
            date=yesterday,
            defaults={"quizzes_completed": 1, "points_earned": 10},
        )

        # Action: User does first activity today
        today = date.today()
        result1 = update_user_streak(self.user, today)

        # Simulate user activity for today (update existing)
        activity = UserActivity.objects.get(user=self.user, date=today)
        activity.quizzes_completed = 1
        activity.points_earned = 10
        activity.save()

        # Action: User tries to update streak again same day
        result2 = update_user_streak(self.user, today)

        # Assertions
        self.assertTrue(result1["streak_updated"])
        self.assertEqual(result1["current_streak"], 2)

        self.assertFalse(result2["streak_updated"])
        self.assertEqual(result2["current_streak"], 2)  # Should stay the same

        # Verify final streak in database
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.current_streak, 2)


class StreakIntegrationTestCase(TestCase):
    """Integration tests for streak system with quiz submissions"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="integrationuser",
            email="integration@example.com",
            password="testpass123",
        )
        self.article = Article.objects.create(
            title="Integration Test Article",
            content="Test content for integration",
            language="es",
            publication_date=date.today(),
        )

    def test_quiz_submission_updates_streak(self):
        """Test that submitting a quiz properly updates streak"""
        # Create a quiz result (simulating quiz submission)
        quiz_result = UserQuizResult.objects.create(
            user=self.user, article=self.article, score=80, points_earned=30
        )

        # Update streak based on quiz submission
        result = update_user_streak(self.user)

        # Assertions
        self.assertTrue(result["streak_updated"])
        self.assertEqual(result["current_streak"], 1)

        # Verify UserActivity was created/updated
        activity = UserActivity.objects.get(user=self.user, date=date.today())
        self.assertEqual(activity.quizzes_completed, 0)  # Will be updated separately

        # Verify profile
        profile = UserProfile.objects.get(user=self.user)
        self.assertEqual(profile.current_streak, 1)
        self.assertEqual(profile.last_activity_date, date.today())
