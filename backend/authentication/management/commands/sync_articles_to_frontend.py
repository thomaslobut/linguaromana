"""
Django Management Command pour synchroniser les articles Django avec le frontend.
Génère les données JSON nécessaires pour le localStorage.

Usage:
    python manage.py sync_articles_to_frontend
"""

import json
import os

from django.core.management.base import BaseCommand

from authentication.models import Article, ArticleWord


class Command(BaseCommand):
    help = "Synchroniser les articles Django avec le frontend localStorage"

    def add_arguments(self, parser):
        parser.add_argument(
            "--output",
            type=str,
            default="../frontend_articles_data.json",
            help="Fichier de sortie pour les données JSON (défaut: ../frontend_articles_data.json)",
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS("🔄 Synchronisation des articles Django vers frontend")
        )
        self.stdout.write("=" * 60)

        try:
            # Récupérer tous les articles actifs
            articles = Article.objects.filter(is_active=True).order_by(
                "-publication_date"
            )

            if not articles.exists():
                self.stdout.write(
                    self.style.WARNING(
                        "⚠️  Aucun article actif trouvé en base de données"
                    )
                )
                return

            frontend_articles = []

            for article in articles:
                # Récupérer les mots-clés associés
                article_words = ArticleWord.objects.filter(article=article)
                keywords = [aw.word.word for aw in article_words]

                # Convertir au format frontend
                frontend_article = {
                    "id": str(article.id),
                    "title": article.title,
                    "content": article.content,
                    "language": article.language,
                    "level": article.level,
                    "date": article.publication_date.isoformat(),
                    "summary": f"Article {article.level} en {article.language}",
                    "keywords": keywords,
                    "status": "published",
                    "createdAt": article.created_at.isoformat(),
                    "updatedAt": article.created_at.isoformat(),
                }

                frontend_articles.append(frontend_article)

                self.stdout.write(f"✅ Article synchronisé: {article.title}")
                self.stdout.write(
                    f"   ID: {article.id} | Langue: {article.language} | Niveau: {article.level}"
                )
                self.stdout.write(
                    f"   Mots-clés: {', '.join(keywords) if keywords else 'aucun'}"
                )

            # Récupérer et synchroniser les définitions des mots
            word_definitions = self.sync_word_definitions()

            # Préparer les données pour le localStorage
            localStorage_data = {
                "linguaromana_custom_articles": frontend_articles,
                "linguaromana_custom_words": word_definitions,
                "sync_timestamp": articles.first().created_at.isoformat()
                if articles
                else None,
                "total_articles": len(frontend_articles),
                "total_words": len(word_definitions),
            }

            # Sauvegarder les données JSON
            output_file = options["output"]
            output_path = os.path.join(
                os.path.dirname(__file__), "..", "..", "..", output_file
            )

            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(localStorage_data, f, ensure_ascii=False, indent=2)

            # Créer le script d'initialisation JavaScript
            js_script = self.generate_js_initialization_script(localStorage_data)
            js_path = os.path.join(os.path.dirname(output_path), "sync_articles.js")

            with open(js_path, "w", encoding="utf-8") as f:
                f.write(js_script)

            self.stdout.write(self.style.SUCCESS(f"\n✅ Synchronisation terminée!"))
            self.stdout.write(f"   Articles synchronisés: {len(frontend_articles)}")
            self.stdout.write(f"   Données JSON: {output_path}")
            self.stdout.write(f"   Script JS: {js_path}")

            self.stdout.write("\n📋 Pour appliquer au frontend:")
            self.stdout.write("1. Ouvrez l'application dans votre navigateur")
            self.stdout.write("2. Ouvrez la console développeur (F12)")
            self.stdout.write(f"3. Copiez-collez le contenu de {js_path}")
            self.stdout.write("4. Rechargez la page")

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Erreur lors de la synchronisation: {e}")
            )
            raise

    def sync_word_definitions(self):
        """Synchroniser les définitions des mots vers le format frontend"""
        from authentication.models import Word, WordDefinition, WordTranslation

        self.stdout.write("\n🔑 Synchronisation des définitions de mots...")

        word_definitions = {}
        words = Word.objects.all()

        for word in words:
            # Récupérer toutes les traductions
            translations = WordTranslation.objects.filter(word=word)
            word_translations = {}

            for translation in translations:
                word_translations[translation.language] = translation.translation

            # Récupérer la définition
            try:
                definition = word.definition
                grammar_note = definition.grammar_note
                usage_example = definition.usage_example
                difficulty_level = definition.difficulty_level
            except WordDefinition.DoesNotExist:
                grammar_note = ""
                usage_example = ""
                difficulty_level = "intermediate"

            # Format compatible avec le frontend existant
            word_definitions[word.word] = {
                "es": word_translations.get("es", ""),
                "it": word_translations.get("it", ""),
                "pt": word_translations.get("pt", ""),
                "ca": word_translations.get("ca", ""),
                "fr": word_translations.get("fr", ""),
                "grammar": grammar_note,
                "usage_example": usage_example,
                "difficulty_level": difficulty_level,
                "primary_language": word.primary_language,
            }

            self.stdout.write(f"   🔤 Mot synchronisé: {word.word}")

        self.stdout.write(f"✅ {len(word_definitions)} définitions synchronisées")
        return word_definitions

    def generate_js_initialization_script(self, data):
        """Générer le script JavaScript pour initialiser le localStorage"""
        script = f"""// Script de synchronisation des articles Django vers frontend
// Généré automatiquement - NE PAS MODIFIER MANUELLEMENT

console.log("🔄 Synchronisation des articles depuis Django...");

// Données des articles depuis Django
const articlesData = {json.dumps(data["linguaromana_custom_articles"], ensure_ascii=False, indent=2)};

// Données des définitions de mots depuis Django
const wordsData = {json.dumps(data["linguaromana_custom_words"], ensure_ascii=False, indent=2)};

// Nettoyer les anciennes données
localStorage.removeItem('linguaromana_custom_articles');
localStorage.removeItem('linguaromana_custom_words');

// Charger les nouvelles données
localStorage.setItem('linguaromana_custom_articles', JSON.stringify(articlesData));
localStorage.setItem('linguaromana_custom_words', JSON.stringify(wordsData));

console.log(`✅ {{articlesData.length}} article(s) synchronisé(s)`);
console.log(`✅ {{Object.keys(wordsData).length}} définition(s) de mots synchronisée(s)`);

console.log("📊 Statistiques articles:");
articlesData.forEach((article, index) => {{
    console.log(`   {{index + 1}}. {{article.title}} ({{article.language}}, {{article.level}})`);
}});

console.log("🔤 Définitions de mots:");
Object.keys(wordsData).forEach((word, index) => {{
    console.log(`   {{index + 1}}. {{word}} ({{wordsData[word].primary_language}}, {{wordsData[word].difficulty_level}})`);
}});

console.log("\\n🔄 Rechargement de la page...");
// Recharger automatiquement pour appliquer les changements
setTimeout(() => {{
    window.location.reload();
}}, 1000);
"""
        return script
