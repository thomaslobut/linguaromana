#!/usr/bin/env python3
"""
Script to run specific UI functionality tests for LinguaRomana.
Tests the problematic areas identified: word saving and article reading.

Usage:
    python run_ui_functionality_tests.py
"""

import os
import sys

import django
from django.conf import settings
from django.test.utils import get_runner

def setup_django():
    """Setup Django environment"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, current_dir)

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "linguaromana_backend.settings")
    django.setup()


def run_ui_functionality_tests():
    """Run specific UI functionality tests"""
    print("🧪 Running UI Functionality Tests...")
    print("=" * 60)

    TestRunner = get_runner(settings)
    test_runner = TestRunner(verbosity=2)

    # Run specific test classes for UI functionality
    test_labels = [
        "authentication.test_articles_vocabulary.WordManagementTestCase",
        "authentication.test_articles_vocabulary.ArchiveReadingTestCase", 
        "authentication.test_articles_vocabulary.IntegrationUITestCase",
    ]

    failures = test_runner.run_tests(test_labels)

    if failures:
        print(f"\n❌ {failures} UI functionality test(s) failed!")
        return False
    else:
        print("\n✅ All UI functionality tests passed!")
        print("\nFeatures verified:")
        print("✅ Word definition saving and retrieval")
        print("✅ Article reading from archive")
        print("✅ Word-article associations")
        print("✅ Archive filtering functionality")
        print("✅ Database cascade operations")
        print("✅ Edge case handling")
        return True


def main():
    """Main test execution function"""
    print("🎯 LinguaRomana UI Functionality Test Suite")
    print("=" * 60)
    print("Testing specific problem areas:")
    print("- Word definition management")
    print("- Archive article reading")
    print("- Frontend-backend integration")
    print("=" * 60)

    # Setup
    setup_django()

    # Run UI functionality tests
    success = run_ui_functionality_tests()

    if success:
        print("\n🚀 All UI functionality tests passed!")
        print("The identified problems should now be resolved.")
        sys.exit(0)
    else:
        print("\n🛑 Some UI functionality tests failed!")
        print("Please review the test output above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
