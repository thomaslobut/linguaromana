#!/usr/bin/env python3
"""
Script to remove useless files from the LinguaRomana project.
Run this to clean up over-complexified codebase.

Usage: python cleanup_useless_files.py [--dry-run]
"""

import os
import sys
from pathlib import Path

# Get project root
PROJECT_ROOT = Path(__file__).parent

# Files to remove (relative to project root)
USELESS_FILES = [
    # Debug/Test HTML files
    "DIRECT_DEBUG_TEST.html",
    "test_auto_sync.html",
    "TEST_ARTICLE_DISPLAY_FIX.html",
    "test-admin-form.html",
    "URGENT_DEBUGGING.html",
    "TEST_LOGS_CONSOLE.html",
    "index_old.html",
    # Debug JavaScript files
    "debug_article_validation.js",
    "DEBUG_SAVE_WORD_PROBLEM.js",
    "TEST_ADMIN_TO_DATABASE.js",
    "TEST_BOUTONS_MODIFICATION_ARTICLES.js",
    "TEST_GRAMMAR_MANAGEMENT.js",
    "TEST_GRAMMAR_NOTES_SECTION.js",
    "TEST_MODIFICATION_ARTICLES.js",
    "TEST_MOT_CLE_OPTIONNEL.js",
    "TEST_PAGE_FORMAT_VALIDATION.js",
    "TEST_TRANSLATION_POPUP.js",
    "WORD_SAVE_DIAGNOSTIC.js",
    # Duplicate scripts (keep backend versions)
    "auto-sync.js",
    "sync_articles.js",
    # Debug documentation
    "CONSOLIDATION_FICHIERS_STATIC.md",
    "CORRECTION_BOUTONS_MODIFICATION_ARTICLES.md",
    "CORRECTION_ERREUR_404_SCRIPT.md",
    "CORRECTION_SAUVEGARDE_MOTS.md",
    "CORRECTIONS_BOUTON_ADMIN.md",
    "DEBUG_ADMIN_GUIDE.md",
    "LOADING_PROBLEM_SOLVED.md",
    "MOT_CLE_OPTIONNEL_QUIZ.md",
    "SUCCESS_ARCHIVEMANAGER_FIXED.md",
    "WORD_SAVE_FIX_SUMMARY.md",
    # Legacy backend files
    "backend/create_default_article.py",
    "backend/load_default_article_to_frontend.py",
    "backend/migrate_legacy_articles.py",
    "backend/test_admin_save.py",
]

# Directories to remove entirely
USELESS_DIRECTORIES = [
    "backend/venv",  # Using Poetry, not needed
]


def remove_file(file_path: Path, dry_run: bool = False):
    """Remove a file or directory."""
    try:
        if file_path.exists():
            if dry_run:
                print(f"[DRY RUN] Would remove: {file_path}")
            else:
                if file_path.is_file():
                    file_path.unlink()
                    print(f"✅ Removed file: {file_path}")
                elif file_path.is_dir():
                    import shutil

                    shutil.rmtree(file_path)
                    print(f"✅ Removed directory: {file_path}")
        else:
            print(f"⏭️  Already gone: {file_path}")
    except Exception as e:
        print(f"❌ Error removing {file_path}: {e}")


def main():
    """Clean up useless files."""
    dry_run = "--dry-run" in sys.argv

    if dry_run:
        print("🔍 DRY RUN MODE - No files will actually be removed\n")
    else:
        print("🧹 CLEANUP MODE - Files will be permanently removed\n")
        confirm = input("Are you sure you want to continue? (yes/no): ")
        if confirm.lower() != "yes":
            print("❌ Cleanup cancelled")
            return

    print(f"📂 Project root: {PROJECT_ROOT}\n")

    # Remove individual files
    print("🗑️  Removing useless files...")
    for file_path in USELESS_FILES:
        full_path = PROJECT_ROOT / file_path
        remove_file(full_path, dry_run)

    # Remove directories
    print("\n🗂️  Removing useless directories...")
    for dir_path in USELESS_DIRECTORIES:
        full_path = PROJECT_ROOT / dir_path
        remove_file(full_path, dry_run)

    # Clean up __pycache__ directories
    print("\n🧹 Cleaning __pycache__ directories...")
    for pycache_dir in PROJECT_ROOT.rglob("__pycache__"):
        if pycache_dir.is_dir():
            remove_file(pycache_dir, dry_run)

    print("\n" + "=" * 60)
    if dry_run:
        print("🔍 DRY RUN COMPLETE - Run without --dry-run to actually remove files")
    else:
        print("✅ CLEANUP COMPLETE!")
        print("📝 Recommendation: Review your .gitignore and commit these changes")
    print("=" * 60)


if __name__ == "__main__":
    main()
