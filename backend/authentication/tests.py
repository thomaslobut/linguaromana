from django.test import TestCase

# Import all streak tests
from .test_streak import StreakIntegrationTestCase, StreakSystemTestCase

# Import articles and vocabulary tests
from .test_articles_vocabulary import ArticlesVocabularyTestCase, ArticleManagementTestCase

# This allows running: python manage.py test authentication
# Which will run all tests in this app including:
# - Streak system tests
# - Articles and vocabulary tests
