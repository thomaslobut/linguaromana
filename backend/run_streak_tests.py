#!/usr/bin/env python3
"""
Script to run the streak system tests for LinguaRomana Django backend.

Usage:
    python run_streak_tests.py

Or from the backend directory:
    python manage.py test core.test_streak
"""

import os
import sys

import django
from django.conf import settings
from django.test.utils import get_runner

if __name__ == "__main__":
    # Add the current directory to Python path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, current_dir)

    # Set up Django settings
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "linguaromana_backend.settings")
    django.setup()

    # Run tests
    TestRunner = get_runner(settings)
    test_runner = TestRunner()

    print("🔥 Running LinguaRomana Streak System Tests...")
    print("=" * 50)

    # Run specific streak tests
    failures = test_runner.run_tests(
        [
            "core.test_streak.StreakSystemTestCase",
            "core.test_streak.StreakIntegrationTestCase",
        ]
    )

    if failures:
        print(f"\n❌ {failures} test(s) failed!")
        sys.exit(1)
    else:
        print("\n✅ All streak tests passed!")
        print("\nRules verified:")
        print("✅ User with 1 flame gets 2 flames if they do activity next day")
        print(
            "✅ User with 1 flame does NOT get 2 flames for multiple activities same day"
        )
        print("✅ Streak resets properly when missing days")
        print("✅ Integration with quiz submission works correctly")
        sys.exit(0)
