"""
Script de migration pour convertir les anciens modèles séparés
(Article, Quiz, QuizQuestion, GrammarNote, ArticleGrammarNote)
vers le nouveau modèle unifié UnifiedArticle.

Usage:
    python migrate_to_unified.py [--dry-run] [--verbose]
"""

import argparse
import os
import sys
from datetime import datetime

import django
from django.db import transaction

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "linguaromana_backend.settings")
django.setup()

from core.models import (
    Article,
    ArticleGrammarNote,
    ComprehensiveArticle,
    GrammarNote,
    Quiz,
    QuizQuestion,
    UnifiedArticle,
)


class MigrationProgress:
    """Track migration progress and statistics"""

    def __init__(self):
        self.start_time = datetime.now()
        self.articles_processed = 0
        self.articles_migrated = 0
        self.quizzes_migrated = 0
        self.grammar_notes_migrated = 0
        self.quiz_questions_migrated = 0
        self.detailed_grammar_notes_migrated = 0
        self.errors = []

    def log_error(self, message, article_id=None):
        """Log an error during migration"""
        error_msg = f"Error: {message}"
        if article_id:
            error_msg += f" (Article ID: {article_id})"
        self.errors.append(error_msg)
        print(f"❌ {error_msg}")

    def log_success(self, message):
        """Log a successful operation"""
        print(f"✅ {message}")

    def log_info(self, message):
        """Log informational message"""
        print(f"ℹ️  {message}")

    def print_summary(self):
        """Print migration summary"""
        end_time = datetime.now()
        duration = end_time - self.start_time

        print("\n" + "=" * 60)
        print("📊 MIGRATION SUMMARY")
        print("=" * 60)
        print(f"⏱️  Duration: {duration}")
        print(f"📄 Articles processed: {self.articles_processed}")
        print(f"🔄 Articles migrated: {self.articles_migrated}")
        print(f"🧩 Quizzes migrated: {self.quizzes_migrated}")
        print(f"📝 Grammar notes migrated: {self.grammar_notes_migrated}")
        print(f"❓ Quiz questions migrated: {self.quiz_questions_migrated}")
        print(
            f"📋 Detailed grammar notes migrated: {self.detailed_grammar_notes_migrated}"
        )

        if self.errors:
            print(f"\n❌ Errors encountered: {len(self.errors)}")
            for error in self.errors:
                print(f"   - {error}")
        else:
            print("\n🎉 Migration completed successfully with no errors!")


def check_prerequisites():
    """Check if migration can proceed safely"""
    progress = MigrationProgress()

    # Check if unified table exists (would need to be created first)
    try:
        UnifiedArticle.objects.count()
        progress.log_info("UnifiedArticle model is available")
    except Exception as e:
        progress.log_error(f"UnifiedArticle model not available: {e}")
        return False

    # Check for existing data in old models
    article_count = Article.objects.count()
    quiz_count = Quiz.objects.count()
    grammar_count = GrammarNote.objects.count()

    progress.log_info(f"Found {article_count} articles to migrate")
    progress.log_info(f"Found {quiz_count} quizzes to migrate")
    progress.log_info(f"Found {grammar_count} grammar notes to migrate")

    if article_count == 0:
        progress.log_info("No articles found to migrate")
        return False

    return True


def migrate_article(article, progress, dry_run=False, verbose=False):
    """Migrate a single article and all its related data"""
    try:
        progress.articles_processed += 1

        if verbose:
            progress.log_info(f"Processing article: {article.title} (ID: {article.id})")

        # Check if already migrated
        existing = UnifiedArticle.objects.filter(
            title=article.title,
            publication_date=article.publication_date,
            language=article.language,
        ).first()

        if existing:
            if verbose:
                progress.log_info(
                    f"Article '{article.title}' already exists in unified model, skipping"
                )
            return existing

        if dry_run:
            progress.log_info(f"[DRY RUN] Would migrate article: {article.title}")
            progress.articles_migrated += 1
            return None

        # Create UnifiedArticle
        unified = UnifiedArticle.objects.create(
            title=article.title,
            content=article.content,
            language=article.language,
            level=article.level,
            publication_date=article.publication_date,
            is_active=article.is_active,
            author=article.author,
            summary=article.summary,
            tags=article.tags,
            created_at=article.created_at,
            updated_at=article.updated_at,
        )

        progress.articles_migrated += 1

        # Migrate Quiz data
        if hasattr(article, "quiz") and article.quiz:
            quiz = article.quiz
            unified.quiz_title = quiz.title
            unified.quiz_description = quiz.description
            unified.quiz_passing_score = quiz.passing_score
            unified.quiz_time_limit = quiz.time_limit
            unified.quiz_is_active = quiz.is_active

            progress.quizzes_migrated += 1

            if verbose:
                progress.log_info(f"  Migrated quiz: {quiz.title}")

            # Migrate QuizQuestions
            for question in quiz.questions.all():
                try:
                    unified.add_quiz_question(
                        word_definition=question.word_definition,
                        question_text=question.question_text,
                        option_a=question.option_a,
                        option_b=question.option_b,
                        option_c=question.option_c,
                        option_d=question.option_d,
                        correct_option=question.correct_option,
                        points=question.points,
                        question_type=question.question_type,
                        difficulty_level=question.difficulty_level,
                    )
                    progress.quiz_questions_migrated += 1

                    if verbose:
                        progress.log_info(
                            f"    Migrated quiz question: {question.question_text[:50]}..."
                        )

                except Exception as e:
                    progress.log_error(
                        f"Failed to migrate quiz question: {e}", article.id
                    )

        # Migrate GrammarNote data
        if hasattr(article, "grammar_note") and article.grammar_note:
            grammar = article.grammar_note
            unified.grammar_title = grammar.title
            unified.grammar_content = grammar.content
            unified.grammar_key_concepts = grammar.key_concepts
            unified.grammar_learning_objectives = grammar.learning_objectives
            unified.grammar_difficulty_level = grammar.difficulty_level

            progress.grammar_notes_migrated += 1

            if verbose:
                progress.log_info(f"  Migrated grammar note: {grammar.title}")

        # Migrate ArticleGrammarNotes
        for detailed_note in article.detailed_grammar_notes.all():
            try:
                unified.add_detailed_grammar_note(
                    word_definition=detailed_note.word_definition,
                    title=detailed_note.title,
                    content=detailed_note.content,
                    order=detailed_note.order,
                    is_key_concept=detailed_note.is_key_concept,
                )
                progress.detailed_grammar_notes_migrated += 1

                if verbose:
                    progress.log_info(
                        f"    Migrated detailed grammar note: {detailed_note.title}"
                    )

            except Exception as e:
                progress.log_error(
                    f"Failed to migrate detailed grammar note: {e}", article.id
                )

        # Save the unified article
        unified.save()

        if verbose:
            progress.log_success(f"Successfully migrated article: {article.title}")

        return unified

    except Exception as e:
        progress.log_error(
            f"Failed to migrate article '{article.title}': {e}", article.id
        )
        return None


def migrate_comprehensive_articles(progress, dry_run=False, verbose=False):
    """Handle ComprehensiveArticle records after migration"""
    comprehensive_articles = ComprehensiveArticle.objects.all()

    if not comprehensive_articles.exists():
        progress.log_info("No ComprehensiveArticle records found")
        return

    progress.log_info(
        f"Found {comprehensive_articles.count()} ComprehensiveArticle records"
    )

    for comp_article in comprehensive_articles:
        try:
            # Find corresponding UnifiedArticle
            unified = UnifiedArticle.objects.filter(
                title=comp_article.article.title,
                publication_date=comp_article.article.publication_date,
                language=comp_article.article.language,
            ).first()

            if unified:
                # Update unified article with published status
                if not dry_run:
                    unified.is_active = comp_article.is_published
                    unified.save()

                if verbose:
                    progress.log_info(
                        f"Updated unified article published status: {unified.title}"
                    )
            else:
                progress.log_error(
                    f"Could not find unified article for comprehensive: {comp_article.article.title}"
                )

        except Exception as e:
            progress.log_error(f"Failed to process comprehensive article: {e}")


def verify_migration(progress, verbose=False):
    """Verify that migration was successful"""
    progress.log_info("🔍 Verifying migration...")

    # Count records
    original_articles = Article.objects.count()
    unified_articles = UnifiedArticle.objects.count()

    progress.log_info(f"Original articles: {original_articles}")
    progress.log_info(f"Unified articles: {unified_articles}")

    if unified_articles >= original_articles:
        progress.log_success("Migration verification passed")
    else:
        progress.log_error("Migration verification failed - not all articles migrated")

    # Sample verification
    if verbose and unified_articles > 0:
        sample_unified = UnifiedArticle.objects.first()
        progress.log_info(f"Sample unified article: {sample_unified.title}")
        progress.log_info(f"  Has quiz: {sample_unified.has_quiz}")
        progress.log_info(f"  Has grammar: {sample_unified.has_grammar_note}")
        progress.log_info(f"  Is complete: {sample_unified.is_complete}")


def main():
    """Main migration function"""
    parser = argparse.ArgumentParser(description="Migrate to unified article model")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be migrated without making changes",
    )
    parser.add_argument(
        "--verbose", action="store_true", help="Show detailed progress information"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=100,
        help="Number of articles to process in each batch",
    )

    args = parser.parse_args()

    progress = MigrationProgress()

    print("🚀 Starting migration to UnifiedArticle model")
    print("=" * 50)

    if args.dry_run:
        print("🧪 DRY RUN MODE - No changes will be made")

    if args.verbose:
        print("📝 VERBOSE MODE - Detailed logging enabled")

    # Check prerequisites
    if not check_prerequisites():
        print("❌ Prerequisites not met, aborting migration")
        return 1

    try:
        with transaction.atomic():
            if args.dry_run:
                # Use savepoint for dry run so we can rollback
                savepoint = transaction.savepoint()

            # Get all articles to migrate
            articles = (
                Article.objects.all()
                .select_related("author", "quiz", "grammar_note")
                .prefetch_related(
                    "quiz__questions__word_definition__word",
                    "detailed_grammar_notes__word_definition__word",
                )
            )

            total_articles = articles.count()
            progress.log_info(f"Starting migration of {total_articles} articles")

            # Process articles in batches
            batch_size = args.batch_size
            for i in range(0, total_articles, batch_size):
                batch = articles[i : i + batch_size]
                progress.log_info(
                    f"Processing batch {i // batch_size + 1} ({len(batch)} articles)"
                )

                for article in batch:
                    migrate_article(article, progress, args.dry_run, args.verbose)

            # Handle ComprehensiveArticle records
            migrate_comprehensive_articles(progress, args.dry_run, args.verbose)

            if args.dry_run:
                # Rollback dry run changes
                transaction.savepoint_rollback(savepoint)
                progress.log_info("Dry run completed - changes rolled back")
            else:
                # Verify migration
                verify_migration(progress, args.verbose)
                progress.log_success("Migration committed to database")

    except Exception as e:
        progress.log_error(f"Migration failed: {e}")
        return 1

    finally:
        progress.print_summary()

    return 0 if not progress.errors else 1


if __name__ == "__main__":
    sys.exit(main())
