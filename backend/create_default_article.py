#!/usr/bin/env python3
"""
Script pour créer l'article par défaut en base de données Django.
Cet article servira de "Point de montage" pour l'application.

Usage:
    python create_default_article.py
"""

import os
import sys
from datetime import date

import django
from django.contrib.auth.models import User

# Setup Django
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "linguaromana_backend.settings")
django.setup()

from authentication.models import (
    Article,
    ArticleWord,
    Word,
    WordDefinition,
    WordTranslation,
)


def create_admin_user():
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
        print(f"✅ Utilisateur admin créé: {admin_user.username}")
    else:
        print(f"ℹ️  Utilisateur admin existe déjà: {admin_user.username}")

    return admin_user


def create_vocabulary_words(admin_user):
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
            print(f"✅ Mot créé: {word_text}")
        else:
            print(f"ℹ️  Mot existe déjà: {word_text}")

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
                print(
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
            print(f"   ✅ Définition créée pour: {word_text}")

        created_words[word_text] = word

    return created_words


def create_default_article(admin_user, vocabulary_words):
    """Créer l'article par défaut 'Point de montage'"""

    article_content = """La [crisis] [humanitaria] en Gaza ha alcanzado proporciones alarmantes, y los [lanzamientos] [aéreos] de ayuda se han convertido en una medida desesperada para proporcionar asistencia a la población civil atrapada en el conflicto.

Sin embargo, esta forma de entrega de suministros ha generado una gran [controversia] entre organizaciones humanitarias y expertos en ayuda internacional. Mientras algunos argumentan que es la única forma viable de hacer llegar alimentos y medicinas a las zonas más afectadas, otros critican que los lanzamientos aéreos son imprecisos y potencialmente peligrosos.

Los defensores de esta estrategia sostienen que, ante la imposibilidad de acceso terrestre seguro, los lanzamientos aéreos representan una línea de vida crucial para miles de familias. No obstante, los críticos señalan que esta metodología puede causar más daño que beneficio, ya que los suministros pueden caer en zonas inadecuadas o incluso lastimar a civiles."""

    # Créer l'article
    article, created = Article.objects.get_or_create(
        title="Crisis humanitaria en Gaza: Los lanzamientos aéreos de ayuda generan controversia",
        defaults={
            "content": article_content,
            "language": "es",
            "level": "advanced",
            "publication_date": date.today(),
            "is_active": True,
        },
    )

    if created:
        print(f"✅ Article par défaut créé: {article.title}")

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
                import re

                pattern = f"\\[{re.escape(word_text)}\\]"
                matches = list(re.finditer(pattern, article_content))

                for i, match in enumerate(matches):
                    article_word, created = ArticleWord.objects.get_or_create(
                        article=article,
                        word=word,
                        position_in_text=match.start(),
                        defaults={
                            "context_sentence": article_content,
                            "is_key_vocabulary": True,
                        },
                    )

                    if created:
                        print(
                            f"   ✅ Association créée: {article.title} -> {word_text} (pos: {match.start()})"
                        )

    else:
        print(f"ℹ️  Article par défaut existe déjà: {article.title}")

    return article


def main():
    """Fonction principale"""
    print("🌟 Création de l'article par défaut (Point de montage)")
    print("=" * 60)

    try:
        # Créer l'utilisateur admin
        admin_user = create_admin_user()

        # Créer les mots de vocabulaire
        print("\n📚 Création des mots de vocabulaire...")
        vocabulary_words = create_vocabulary_words(admin_user)

        # Créer l'article par défaut
        print("\n📄 Création de l'article par défaut...")
        article = create_default_article(admin_user, vocabulary_words)

        print("\n✅ Article par défaut créé avec succès!")
        print(f"   Titre: {article.title}")
        print(f"   Langue: {article.language}")
        print(f"   Niveau: {article.level}")
        print(f"   Date: {article.publication_date}")
        print(f"   Mots de vocabulaire associés: {len(vocabulary_words)}")

        # Vérifier les associations
        article_words_count = ArticleWord.objects.filter(article=article).count()
        print(f"   Associations article-mots: {article_words_count}")

    except Exception as e:
        print(f"❌ Erreur lors de la création: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
