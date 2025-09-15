#!/usr/bin/env python3
"""
Complete test runner for LinguaRomana Django backend.
Runs all tests including the streak system with detailed reporting.

Usage:
    python run_all_tests.py

Environment variables:
    CI=true                 # Run in CI mode (less verbose output)
    DJANGO_SETTINGS_MODULE  # Django settings module
"""

import os
import sys

import django
from django.conf import settings
from django.core.management import execute_from_command_line
from django.test.utils import get_runner


def setup_django():
    """Setup Django environment"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, current_dir)

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "linguaromana_backend.settings")
    django.setup()


def run_migrations():
    """Run Django migrations"""
    print("🔧 Setting up database...")
    try:
        execute_from_command_line(["manage.py", "makemigrations"])
        execute_from_command_line(["manage.py", "migrate"])
        print("✅ Database setup completed")
        return True
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        return False


def run_streak_tests():
    """Run streak system tests specifically"""
    print("\n🔥 Running LinguaRomana Streak System Tests...")
    print("=" * 60)

    TestRunner = get_runner(settings)
    test_runner = TestRunner(verbosity=1 if os.getenv("CI") else 2)

    streak_failures = test_runner.run_tests(
        [
            "core.test_streak.StreakSystemTestCase",
            "core.test_streak.StreakIntegrationTestCase",
        ]
    )

    if streak_failures:
        print(f"\n❌ {streak_failures} streak test(s) failed!")
        return False
    else:
        print("\n✅ All streak tests passed!")
        print("\n🎯 Streak Rules Verified:")
        print("  ✅ User with 1 flame gets 2 flames if they do activity next day")
        print(
            "  ✅ User with 1 flame does NOT get 2 flames for multiple activities same day"
        )
        print("  ✅ Streak resets properly when missing days")
        print("  ✅ Integration with quiz submission works correctly")
        return True


def run_all_django_tests():
    """Run all Django tests"""
    print("\n🧪 Running All Django Tests...")
    print("=" * 60)

    TestRunner = get_runner(settings)
    test_runner = TestRunner(verbosity=1 if os.getenv("CI") else 2)

    all_failures = test_runner.run_tests(["core"])

    if all_failures:
        print(f"\n❌ {all_failures} Django test(s) failed!")
        return False
    else:
        print("\n✅ All Django tests passed!")
        return True


def run_ui_functionality_tests():
    """Run specific UI functionality tests"""
    print("\n🎯 Running UI Functionality Tests...")
    print("=" * 60)

    TestRunner = get_runner(settings)
    test_runner = TestRunner(verbosity=1 if os.getenv("CI") else 2)

    # Run specific test classes for UI functionality
    ui_test_labels = [
        "authentication.test_articles_vocabulary.WordManagementTestCase",
        "authentication.test_articles_vocabulary.ArchiveReadingTestCase",
        "authentication.test_articles_vocabulary.IntegrationUITestCase",
        "authentication.test_articles_vocabulary.AdminArticleSaveTestCase",
    ]

    ui_failures = test_runner.run_tests(ui_test_labels)

    if ui_failures:
        print(f"\n❌ {ui_failures} UI functionality test(s) failed!")
        return False
    else:
        print("\n✅ All UI functionality tests passed!")
        print("✅ Word definition management verified")
        print("✅ Archive article reading verified")
        print("✅ Frontend-backend integration verified")
        return True


def run_code_quality_checks():
    """Run basic code quality checks"""
    print("\n🔍 Running Code Quality Checks...")
    print("=" * 60)

    # Check for basic Python syntax
    try:
        import py_compile

        python_files = [
            "core/models.py",
            "core/views.py",
            "core/utils.py",
            "core/test_streak.py",
        ]

        for file_path in python_files:
            if os.path.exists(file_path):
                py_compile.compile(file_path, doraise=True)
                print(f"  ✅ {file_path} - syntax OK")
            else:
                print(f"  ⚠️  {file_path} - file not found")

        print("✅ Code quality checks passed")
        return True
    except py_compile.PyCompileError as e:
        print(f"❌ Syntax error found: {e}")
        return False
    except Exception as e:
        print(f"❌ Code quality check failed: {e}")
        return False


def print_summary(results):
    """Print test execution summary"""
    print("\n" + "=" * 80)
    print("📊 TEST EXECUTION SUMMARY")
    print("=" * 80)

    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result)
    failed_tests = total_tests - passed_tests

    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"  {test_name:<30} {status}")

    print(f"\n📈 Results: {passed_tests}/{total_tests} test suites passed")

    if failed_tests == 0:
        print("\n🎉 ALL TESTS PASSED! Ready for deployment! 🚀")
        return True
    else:
        print(
            f"\n💥 {failed_tests} test suite(s) failed. Fix issues before deployment."
        )
        return False


def main():
    """Main test execution function"""
    print("🌟 LinguaRomana Complete Test Suite")
    print("=" * 80)

    # Setup
    setup_django()

    # Track results
    results = {}

    # Run database setup
    results["Database Setup"] = run_migrations()
    if not results["Database Setup"]:
        print("❌ Cannot continue without database setup")
        sys.exit(1)

    # Run tests in order
    results["Streak System Tests"] = run_streak_tests()
    results["All Django Tests"] = run_all_django_tests()
    results["UI Functionality Tests"] = run_ui_functionality_tests()
    results["Code Quality Checks"] = run_code_quality_checks()

    # Print summary and determine exit code
    success = print_summary(results)

    if success:
        print("\n🚀 Ready for deployment!")
        sys.exit(0)
    else:
        print("\n🛑 Fix failing tests before deployment!")
        sys.exit(1)


if __name__ == "__main__":
    main()
