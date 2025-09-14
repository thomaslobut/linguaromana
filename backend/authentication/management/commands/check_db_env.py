"""
Management command to verify database environment and safety.
"""

import os

from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Verify database environment and safety configuration"

    def handle(self, *args, **options):
        """Display database configuration and safety status."""

        self.stdout.write(self.style.SUCCESS("\n🔍 Database Environment Check\n"))

        # Check environment
        database_url = os.environ.get("DATABASE_URL")
        debug_mode = settings.DEBUG

        # Get database configuration
        db_config = settings.DATABASES["default"]
        engine = db_config["ENGINE"]
        db_name = db_config["NAME"]

        # Display environment
        if database_url:
            self.stdout.write(self.style.WARNING("🏭 PRODUCTION ENVIRONMENT DETECTED"))
            self.stdout.write(f"DATABASE_URL: {database_url[:50]}...")
            self.stdout.write(f"Engine: {engine}")
        else:
            self.stdout.write(self.style.SUCCESS("🏠 DEVELOPMENT ENVIRONMENT"))
            self.stdout.write("DATABASE_URL: Not set (correct for development)")
            self.stdout.write(f"Engine: {engine}")
            self.stdout.write(f"Database: {db_name}")

        # Safety checks
        self.stdout.write("\n🛡️ Safety Status:")

        if not database_url and "sqlite3" in engine:
            self.stdout.write(self.style.SUCCESS("✅ Using local SQLite database"))
            self.stdout.write(
                self.style.SUCCESS("✅ Completely isolated from production")
            )
        elif database_url and "postgresql" in engine:
            self.stdout.write(self.style.WARNING("⚠️  Using production PostgreSQL"))
            self.stdout.write(
                self.style.WARNING("⚠️  Connected to production environment")
            )
        else:
            self.stdout.write(self.style.ERROR("❌ Unexpected database configuration"))

        # Debug mode check
        if debug_mode:
            self.stdout.write(self.style.SUCCESS("✅ DEBUG mode enabled (development)"))
        else:
            self.stdout.write(
                self.style.WARNING("⚠️  DEBUG mode disabled (production-like)")
            )

        self.stdout.write("\n📋 Quick Commands:")
        self.stdout.write(
            "• Reset dev database: rm backend/db.sqlite3 && python manage.py migrate"
        )
        self.stdout.write("• Check migrations: python manage.py showmigrations")
        self.stdout.write("• Create test user: python manage.py createsuperuser")

        self.stdout.write("")
