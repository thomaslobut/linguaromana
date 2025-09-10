#!/usr/bin/env python
"""
Script de migration pour récupérer les articles des anciennes tables
et les migrer vers core_article.

Usage: python migrate_legacy_articles.py
"""

import os
import sys
import django
from datetime import date

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'linguaromana_backend.settings')
django.setup()

from django.db import connection
from core.models import Article

def migrate_legacy_articles():
    """Migre les articles des anciennes tables vers core_article"""
    
    print("🔄 Début de la migration des articles legacy...")
    
    # Tables legacy à migrer
    legacy_tables = [
        'authentication_article',
        'linguaromana_article'
    ]
    
    migrated_count = 0
    skipped_count = 0
    
    with connection.cursor() as cursor:
        for table in legacy_tables:
            print(f"\n📋 Migration depuis {table}...")
            
            try:
                # Récupérer tous les articles de la table legacy
                cursor.execute(f"""
                    SELECT id, title, content, language, level, publication_date, 
                           is_active, created_at, updated_at, summary, tags
                    FROM {table}
                """)
                
                legacy_articles = cursor.fetchall()
                print(f"   📊 {len(legacy_articles)} articles trouvés")
                
                for article_data in legacy_articles:
                    (old_id, title, content, language, level, pub_date, 
                     is_active, created_at, updated_at, summary, tags) = article_data
                    
                    # Vérifier si l'article existe déjà dans core_article (par titre et contenu)
                    existing = Article.objects.filter(
                        title=title,
                        content=content
                    ).first()
                    
                    if existing:
                        print(f"   ⏭️  Article '{title[:30]}...' existe déjà (ID: {existing.id})")
                        skipped_count += 1
                        continue
                    
                    # Créer nouvel article dans core_article
                    try:
                        new_article = Article.objects.create(
                            title=title,
                            content=content,
                            language=language,
                            level=level,
                            publication_date=pub_date or date.today(),
                            is_active=is_active if is_active is not None else True,
                            summary=summary or "",
                            tags=tags or "",
                        )
                        
                        print(f"   ✅ Migré: '{title[:30]}...' (ID: {old_id} → {new_article.id})")
                        migrated_count += 1
                        
                    except Exception as e:
                        print(f"   ❌ Erreur migration '{title[:30]}...': {e}")
                        
            except Exception as e:
                print(f"   ❌ Erreur lecture table {table}: {e}")
    
    print(f"\n🎯 Migration terminée:")
    print(f"   ✅ Articles migrés: {migrated_count}")
    print(f"   ⏭️  Articles ignorés (doublons): {skipped_count}")
    
    return migrated_count

def list_legacy_tables():
    """Liste les tables legacy et leur contenu"""
    
    print("📋 Tables legacy détectées:")
    
    legacy_tables = [
        'authentication_article',
        'linguaromana_article'
    ]
    
    with connection.cursor() as cursor:
        for table in legacy_tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"   📊 {table}: {count} articles")
                
                if count > 0:
                    cursor.execute(f"SELECT id, title FROM {table} LIMIT 3")
                    articles = cursor.fetchall()
                    for article in articles:
                        print(f"      - ID {article[0]}: {article[1][:50]}...")
                        
            except Exception as e:
                print(f"   ❌ {table}: {e}")

def cleanup_legacy_tables():
    """Supprime les tables legacy APRÈS migration"""
    
    print("\n⚠️  ATTENTION: Suppression des tables legacy!")
    confirm = input("Êtes-vous sûr de vouloir supprimer les anciennes tables ? (oui/non): ")
    
    if confirm.lower() != 'oui':
        print("❌ Suppression annulée")
        return
    
    legacy_tables = [
        'authentication_article',
        'authentication_articleword',
        'authentication_badge',
        'authentication_quizquestion',
        'authentication_useractivity',
        'authentication_userbadge',
        'authentication_userprofile',
        'authentication_userquizresult',
        'authentication_usersavedword',
        'authentication_word',
        'authentication_worddefinition',
        'authentication_wordtranslation',
        'linguaromana_article',
        'linguaromana_articlegrammarnote',
        'linguaromana_articleseries',
        'linguaromana_articleword',
        'linguaromana_badge',
        'linguaromana_contentseries',
        'linguaromana_quiz',
        'linguaromana_quizquestion',
        'linguaromana_word',
        'linguaromana_worddefinition',
        'linguaromana_wordtranslation'
    ]
    
    with connection.cursor() as cursor:
        for table in legacy_tables:
            try:
                cursor.execute(f"DROP TABLE IF EXISTS {table}")
                print(f"   🗑️  Table {table} supprimée")
            except Exception as e:
                print(f"   ❌ Erreur suppression {table}: {e}")
    
    print("✅ Nettoyage terminé!")

if __name__ == "__main__":
    print("=" * 60)
    print("🔧 MIGRATION DES ARTICLES LEGACY")
    print("=" * 60)
    
    # Étape 1: Lister les tables legacy
    list_legacy_tables()
    
    # Étape 2: Demander confirmation pour migration
    print("\n" + "=" * 60)
    migrate = input("Migrer les articles vers core_article ? (oui/non): ")
    
    if migrate.lower() == 'oui':
        migrated = migrate_legacy_articles()
        
        if migrated > 0:
            print(f"\n✅ {migrated} articles migrés avec succès!")
            
            # Étape 3: Proposer nettoyage
            print("\n" + "=" * 60)
            cleanup = input("Supprimer les tables legacy maintenant ? (oui/non): ")
            if cleanup.lower() == 'oui':
                cleanup_legacy_tables()
        else:
            print("\n⚠️  Aucun article migré. Tables legacy conservées.")
    else:
        print("❌ Migration annulée")
    
    print("\n🎯 Script terminé!")



