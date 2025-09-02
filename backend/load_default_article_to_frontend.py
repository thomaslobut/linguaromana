#!/usr/bin/env python3
"""
Script pour charger l'article par défaut depuis la base de données Django
et l'ajouter au localStorage du frontend.

Cela simule la synchronisation entre Django et le frontend jusqu'à ce que
l'API soit complètement implémentée.

Usage:
    python load_default_article_to_frontend.py
"""

import json
import os
import sys

import django

# Setup Django
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "linguaromana_backend.settings")
django.setup()

from authentication.models import Article, ArticleWord


def load_default_article():
    """Charger l'article par défaut depuis la base Django"""
    try:
        # Récupérer l'article par défaut créé
        article = Article.objects.filter(
            title__icontains="Crisis humanitaria en Gaza"
        ).first()

        if not article:
            print("❌ Article par défaut non trouvé en base de données")
            return None

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
            "summary": "Article sur la crise humanitaire à Gaza et les lanzamientos aéreos de ayuda",
            "keywords": keywords,
            "status": "published",
            "type": "default",
            "createdAt": article.created_at.isoformat(),
            "updatedAt": article.created_at.isoformat(),
            "isFeatured": True,
        }

        print(f"✅ Article chargé: {article.title}")
        print(f"   ID: {article.id}")
        print(f"   Langue: {article.language}")
        print(f"   Niveau: {article.level}")
        print(f"   Date: {article.publication_date}")
        print(f"   Mots-clés: {', '.join(keywords)}")

        return frontend_article

    except Exception as e:
        print(f"❌ Erreur lors du chargement: {e}")
        return None


def generate_frontend_data(article):
    """Générer les données à injecter dans le frontend"""
    if not article:
        return None

    # Structure pour le localStorage
    custom_articles = [article]

    localStorage_data = {
        "linguaromana_custom_articles": json.dumps(custom_articles, indent=2),
    }

    return localStorage_data


def create_frontend_initialization_script(localStorage_data):
    """Créer un script JavaScript pour initialiser le localStorage"""
    if not localStorage_data:
        return None

    script_content = (
        """// Script d'initialisation pour charger l'article par défaut
// Ce script doit être exécuté dans la console du navigateur ou intégré à l'application

console.log("🌟 Chargement de l'article par défaut depuis Django...");

// Données de l'article par défaut
const defaultArticleData = """
        + localStorage_data["linguaromana_custom_articles"]
        + """;

// Charger dans le localStorage
localStorage.setItem('linguaromana_custom_articles', JSON.stringify(defaultArticleData));

console.log("✅ Article par défaut chargé dans le localStorage");
console.log("Rechargez la page pour voir l'article");

// Optionnel: recharger automatiquement la page
// window.location.reload();
"""
    )

    return script_content


def main():
    """Fonction principale"""
    print("🌟 Chargement de l'article par défaut pour le frontend")
    print("=" * 60)

    # Charger l'article depuis Django
    article = load_default_article()

    if not article:
        print("❌ Impossible de charger l'article")
        sys.exit(1)

    # Générer les données frontend
    localStorage_data = generate_frontend_data(article)

    # Créer le script d'initialisation
    script = create_frontend_initialization_script(localStorage_data)

    # Sauvegarder le script
    script_path = os.path.join(
        os.path.dirname(__file__), "..", "initialize_default_article.js"
    )
    with open(script_path, "w", encoding="utf-8") as f:
        f.write(script)

    print(f"\n✅ Script d'initialisation créé: {script_path}")
    print("\n📋 Instructions:")
    print("1. Ouvrez votre navigateur sur l'application")
    print("2. Ouvrez la console développeur (F12)")
    print("3. Copiez-collez le contenu du fichier initialize_default_article.js")
    print("4. Appuyez sur Entrée pour exécuter")
    print("5. Rechargez la page")

    # Afficher également les données JSON pour référence
    json_path = os.path.join(
        os.path.dirname(__file__), "..", "default_article_data.json"
    )
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(localStorage_data, f, ensure_ascii=False, indent=2)

    print(f"\n📄 Données JSON sauvegardées: {json_path}")


if __name__ == "__main__":
    main()
