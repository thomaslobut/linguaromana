"""
Django Management Command pour créer l'article par défaut en base de données.
Cet article servira de "Point de montage" pour l'application.

Usage:
    python manage.py create_default_article
"""

import re
from datetime import date

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from authentication.models import (
    Article,
    ArticleWord,
    Word,
    WordDefinition,
    WordTranslation,
)


class Command(BaseCommand):
    help = "Créer l'article par défaut (Point de montage) en base de données"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Force la recréation même si l'article existe déjà",
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS("🌟 Création de l'article par défaut (Point de montage)")
        )
        self.stdout.write("=" * 60)

        try:
            # Créer l'utilisateur admin
            admin_user = self.create_admin_user()

            # Créer les mots de vocabulaire
            self.stdout.write("\n📚 Création des mots de vocabulaire...")
            vocabulary_words = self.create_vocabulary_words(admin_user)

            # Créer l'article par défaut
            self.stdout.write("\n📄 Création de l'article par défaut...")
            article = self.create_default_article(
                admin_user, vocabulary_words, options["force"]
            )

            self.stdout.write(
                self.style.SUCCESS("\n✅ Article par défaut créé avec succès!")
            )
            self.stdout.write(f"   Titre: {article.title}")
            self.stdout.write(f"   Langue: {article.language}")
            self.stdout.write(f"   Niveau: {article.level}")
            self.stdout.write(f"   Date: {article.publication_date}")
            self.stdout.write(
                f"   Mots de vocabulaire associés: {len(vocabulary_words)}"
            )

            # Vérifier les associations
            article_words_count = ArticleWord.objects.filter(article=article).count()
            self.stdout.write(f"   Associations article-mots: {article_words_count}")

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Erreur lors de la création: {e}"))
            raise

    def create_admin_user(self):
        """Créer un utilisateur admin s'il n'existe pas"""
        admin_user, created = User.objects.get_or_create(
            username="admin_sistema",
            defaults={
                "email": "admin@linguaromana.app",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            admin_user.set_password("admin123")
            admin_user.save()
            self.stdout.write(f"✅ Utilisateur admin créé: {admin_user.username}")
        else:
            self.stdout.write(
                f"ℹ️  Utilisateur admin existe déjà: {admin_user.username}"
            )

        return admin_user

    def create_vocabulary_words(self, admin_user):
        """Créer les mots de vocabulaire nécessaires pour l'article"""
        words_data = {
            "crisis": {
                "primary_language": "es",
                "translations": {
                    "es": "crisis",
                    "it": "crisi",
                    "pt": "crise",
                    "ca": "crisi",
                    "fr": "crise",
                },
                "grammar_note": "Sustantivo femenino invariable que designa una situación grave o difícil.",
                "usage_example": "La crisis humanitaria requiere una respuesta inmediata.",
                "difficulty": "intermediate",
            },
            "humanitaria": {
                "primary_language": "es",
                "translations": {
                    "es": "humanitaria",
                    "it": "umanitaria",
                    "pt": "humanitária",
                    "ca": "humanitària",
                    "fr": "humanitaire",
                },
                "grammar_note": "Adjetivo femenino singular que se refiere a la ayuda y protección de personas.",
                "usage_example": "La ayuda humanitaria es esencial en zonas de conflicto.",
                "difficulty": "intermediate",
            },
            "lanzamientos": {
                "primary_language": "es",
                "translations": {
                    "es": "lanzamientos",
                    "it": "lanci",
                    "pt": "lançamentos",
                    "ca": "llançaments",
                    "fr": "largages",
                },
                "grammar_note": 'Sustantivo masculino plural derivado del verbo "lanzar".',
                "usage_example": "Los lanzamientos aéreos son una forma de entregar suministros.",
                "difficulty": "advanced",
            },
            "aéreos": {
                "primary_language": "es",
                "translations": {
                    "es": "aéreos",
                    "it": "aerei",
                    "pt": "aéreos",
                    "ca": "aeris",
                    "fr": "aériens",
                },
                "grammar_note": "Adjetivo masculino plural que se refiere a todo lo relacionado con el aire o la aviación.",
                "usage_example": "Los ataques aéreos causaron gran destrucción.",
                "difficulty": "intermediate",
            },
            "controversia": {
                "primary_language": "es",
                "translations": {
                    "es": "controversia",
                    "it": "controversia",
                    "pt": "controvérsia",
                    "ca": "controvèrsia",
                    "fr": "controverse",
                },
                "grammar_note": "Sustantivo femenino que designa una discusión o debate público.",
                "usage_example": "El tema generó una gran controversia en los medios.",
                "difficulty": "advanced",
            },
        }

        created_words = {}

        for word_text, word_info in words_data.items():
            # Créer ou récupérer le mot
            word, created = Word.objects.get_or_create(
                word=word_text,
                defaults={
                    "primary_language": word_info["primary_language"],
                    "created_by": admin_user,
                },
            )

            if created:
                self.stdout.write(f"✅ Mot créé: {word_text}")
            else:
                self.stdout.write(f"ℹ️  Mot existe déjà: {word_text}")

            # Créer les traductions
            for lang_code, translation in word_info["translations"].items():
                translation_obj, created = WordTranslation.objects.get_or_create(
                    word=word,
                    language=lang_code,
                    defaults={
                        "translation": translation,
                        "part_of_speech": "noun"
                        if word_text in ["crisis", "lanzamientos", "controversia"]
                        else "adjective",
                    },
                )

                if created:
                    self.stdout.write(
                        f"   ✅ Traduction créée: {word_text} -> {translation} ({lang_code})"
                    )

            # Créer la définition
            definition, created = WordDefinition.objects.get_or_create(
                word=word,
                defaults={
                    "grammar_note": word_info["grammar_note"],
                    "usage_example": word_info["usage_example"],
                    "difficulty_level": word_info["difficulty"],
                },
            )

            if created:
                self.stdout.write(f"   ✅ Définition créée pour: {word_text}")

            created_words[word_text] = word

        return created_words

    def create_default_article(self, admin_user, vocabulary_words, force=False):
        """Créer l'article par défaut 'Point de montage'"""

        article_title = "Crisis humanitaria en Gaza: Los lanzamientos aéreos de ayuda generan controversia"
        article_content = """La [crisis] [humanitaria] en Gaza ha alcanzado proporciones alarmantes, y los [lanzamientos] [aéreos] de ayuda se han convertido en una medida desesperada para proporcionar asistencia a la población civil atrapada en el conflicto.

Sin embargo, esta forma de entrega de suministros ha generado una gran [controversia] entre organizaciones humanitarias y expertos en ayuda internacional. Mientras algunos argumentan que es la única forma viable de hacer llegar alimentos y medicinas a las zonas más afectadas, otros critican que los lanzamientos aéreos son imprecisos y potencialmente peligrosos.

Los defensores de esta estrategia sostienen que, ante la imposibilidad de acceso terrestre seguro, los lanzamientos aéreos representan una línea de vida crucial para miles de familias. No obstante, los críticos señalan que esta metodología puede causar más daño que beneficio, ya que los suministros pueden caer en zonas inadecuadas o incluso lastimar a civiles."""

        # Vérifier si l'article existe déjà
        existing_article = Article.objects.filter(title=article_title).first()

        if existing_article and not force:
            self.stdout.write(
                f"ℹ️  Article par défaut existe déjà: {existing_article.title}"
            )
            return existing_article

        if existing_article and force:
            # Supprimer les associations existantes
            ArticleWord.objects.filter(article=existing_article).delete()
            existing_article.delete()
            self.stdout.write("🗑️  Article existant supprimé (force=True)")

        # Créer l'article
        article = Article.objects.create(
            title=article_title,
            content=article_content,
            language="es",
            level="advanced",
            publication_date=date.today(),
            is_active=True,
        )

        self.stdout.write(f"✅ Article par défaut créé: {article.title}")

        # Créer les associations ArticleWord
        words_in_brackets = [
            "crisis",
            "humanitaria",
            "lanzamientos",
            "aéreos",
            "controversia",
        ]

        for word_text in words_in_brackets:
            if word_text in vocabulary_words:
                word = vocabulary_words[word_text]

                # Trouver toutes les positions du mot dans le contenu
                pattern = f"\\[{re.escape(word_text)}\\]"
                matches = list(re.finditer(pattern, article_content))

                for i, match in enumerate(matches):
                    article_word = ArticleWord.objects.create(
                        article=article,
                        word=word,
                        position_in_text=match.start(),
                        context_sentence=article_content,
                        is_key_vocabulary=True,
                    )

                    self.stdout.write(
                        f"   ✅ Association créée: {article.title} -> {word_text} (pos: {match.start()})"
                    )

        return article
