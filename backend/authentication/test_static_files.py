"""
Tests for static files serving - ensures CSS and other assets load properly.
"""

import requests
from django.conf import settings
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from django.test import LiveServerTestCase, TestCase


class StaticFilesDeploymentTest(StaticLiveServerTestCase):
    """Test that static files are accessible in deployment environment."""

    def test_css_file_accessible(self):
        """Test that the main CSS file is accessible via static URL."""
        # Test the main styles.css file
        css_url = f"{self.live_server_url}/static/styles.css"
        response = requests.get(css_url)

        self.assertEqual(
            response.status_code,
            200,
            f"CSS file not accessible. Got {response.status_code} for {css_url}",
        )

        # Verify it's actually CSS content
        self.assertIn(
            "text/css",
            response.headers.get("content-type", "").lower(),
            "CSS file doesn't have correct content-type",
        )

        # Verify file has some CSS content (not empty)
        self.assertGreater(
            len(response.content), 100, "CSS file appears to be empty or too small"
        )

    def test_home_page_references_css(self):
        """Test that the home page properly references CSS files."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)

        # Check that CSS is referenced in the HTML
        self.assertContains(
            response,
            "/static/styles.css",
            msg_prefix="Home page doesn't reference the main CSS file",
        )

    def test_static_files_setting_configured(self):
        """Test that Django static files settings are properly configured."""
        # Ensure STATIC_URL is set
        self.assertIsNotNone(
            settings.STATIC_URL, "STATIC_URL setting is not configured"
        )

        # Ensure STATIC_ROOT is set for production
        self.assertIsNotNone(
            settings.STATIC_ROOT, "STATIC_ROOT setting is not configured"
        )

        # Check that staticfiles app is installed
        self.assertIn(
            "django.contrib.staticfiles",
            settings.INSTALLED_APPS,
            "staticfiles app is not in INSTALLED_APPS",
        )


class StaticFilesUnitTest(TestCase):
    """Unit tests for static files configuration."""

    def test_static_url_format(self):
        """Test that STATIC_URL has correct format."""
        self.assertTrue(
            settings.STATIC_URL.startswith("/"), "STATIC_URL should start with /"
        )
        self.assertTrue(
            settings.STATIC_URL.endswith("/"), "STATIC_URL should end with /"
        )

    def test_staticfiles_storage_configured(self):
        """Test that staticfiles storage is configured for production."""
        # In production, we should use compressed/cached static files
        if not settings.DEBUG:
            expected_storage = "whitenoise.storage.CompressedManifestStaticFilesStorage"
            self.assertEqual(
                settings.STATICFILES_STORAGE,
                expected_storage,
                f"Production should use {expected_storage} for static files",
            )


