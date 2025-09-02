#!/usr/bin/env python3
"""
Script de test spécifique pour la fonctionnalité de sauvegarde d'articles de l'admin.
Tests isolés pour identifier le problème de validation.

Usage:
    python test_admin_save.py
"""

import os
import sys

import django
from django.conf import settings
from django.test.utils import get_runner


def setup_django():
    """Setup Django environment"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, current_dir)

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "linguaromana_backend.settings")
    django.setup()


def run_admin_save_tests():
    """Run admin save specific tests"""
    print("🔧 Running Admin Article Save Tests...")
    print("=" * 60)

    TestRunner = get_runner(settings)
    test_runner = TestRunner(verbosity=2)

    # Run only the admin save test class
    test_labels = [
        "authentication.test_articles_vocabulary.AdminArticleSaveTestCase",
    ]

    failures = test_runner.run_tests(test_labels)

    if failures:
        print(f"\n❌ {failures} admin save test(s) failed!")
        return False
    else:
        print("\n✅ All admin save tests passed!")
        print("\nValidation scenarios tested:")
        print("✅ Missing title validation")
        print("✅ Missing content validation")
        print("✅ Missing language validation")
        print("✅ Successful validation with valid data")
        print("✅ Whitespace handling")
        print("✅ Language selector values")
        print("✅ Date field handling")
        print("✅ Article creation in database")
        return True


def create_test_debug_script():
    """Create a debugging script to test the exact validation logic"""
    debug_script = """
// Script de test pour débugger la validation des articles
// À exécuter dans la console du navigateur sur la page admin

console.log('🔧 Test de débogage de la validation d\'articles');

// Test 1: Vérifier que les éléments existent
const elements = {
    title: document.getElementById('article-title'),
    content: document.getElementById('article-content'),
    language: document.getElementById('article-language'),
    level: document.getElementById('article-level'),
    date: document.getElementById('article-date'),
    summary: document.getElementById('article-summary')
};

console.log('📋 Éléments du formulaire:', elements);

// Vérifier si tous les éléments existent
const allElementsExist = Object.values(elements).every(el => el !== null);
console.log('✅ Tous les éléments existent:', allElementsExist);

// Test 2: Remplir le formulaire avec des données de test
function fillTestData() {
    if (elements.title) elements.title.value = 'Article de test de débogage';
    if (elements.content) elements.content.value = 'Contenu de test avec [mots] [clés] pour vérifier la validation.';
    if (elements.language) elements.language.value = 'es';
    if (elements.level) elements.level.value = 'intermediate';
    if (elements.date) elements.date.value = new Date().toISOString().split('T')[0];
    if (elements.summary) elements.summary.value = 'Résumé de test';
    
    console.log('📝 Formulaire rempli avec des données de test');
}

// Test 3: Simuler la validation
function testValidation() {
    const title = elements.title ? elements.title.value.trim() : '';
    const content = elements.content ? elements.content.value.trim() : '';
    const language = elements.language ? elements.language.value : '';
    
    console.log('🔍 Valeurs récupérées:', {
        title: `"${title}" (longueur: ${title.length})`,
        content: `"${content.substring(0, 50)}..." (longueur: ${content.length})`,
        language: `"${language}"`
    });
    
    const titleValid = title && title.length > 0;
    const contentValid = content && content.length > 0;
    const languageValid = language && language.length > 0;
    
    console.log('✅ Validation:', {
        title: titleValid,
        content: contentValid, 
        language: languageValid,
        overall: titleValid && contentValid && languageValid
    });
    
    if (titleValid && contentValid && languageValid) {
        console.log('🎉 Validation réussie ! Le formulaire devrait pouvoir être sauvegardé.');
    } else {
        console.error('❌ Validation échouée. Champs manquants:', {
            title: !titleValid ? 'MANQUANT' : 'OK',
            content: !contentValid ? 'MANQUANT' : 'OK', 
            language: !languageValid ? 'MANQUANT' : 'OK'
        });
    }
}

// Fonctions utilisables dans la console
window.fillTestData = fillTestData;
window.testValidation = testValidation;

console.log('🚀 Scripts disponibles:');
console.log('  fillTestData() - Remplit le formulaire avec des données de test');
console.log('  testValidation() - Teste la logique de validation');
console.log('');
console.log('💡 Étapes de débogage:');
console.log('1. Ouvrez la page admin et cliquez sur "Nouvel Article"');
console.log('2. Exécutez fillTestData() pour remplir le formulaire');
console.log('3. Exécutez testValidation() pour tester la validation');
console.log('4. Essayez de sauvegarder et comparez avec les logs');
"""

    debug_file = os.path.join(
        os.path.dirname(__file__), "..", "debug_article_validation.js"
    )
    with open(debug_file, "w", encoding="utf-8") as f:
        f.write(debug_script)

    print(f"📝 Script de débogage créé: {debug_file}")
    print("📋 Utilisation:")
    print("1. Ouvrez l'application web")
    print("2. Accédez à la page admin")
    print("3. Ouvrez la console développeur (F12)")
    print("4. Copiez-collez le contenu du script")
    print("5. Utilisez fillTestData() et testValidation() pour débugger")


def main():
    """Main test execution function"""
    print("🎯 Test de la Fonctionnalité de Sauvegarde d'Articles Admin")
    print("=" * 60)
    print("Objectif: Identifier pourquoi la validation échoue")
    print("Error reportée: 'Le titre, le contenu et la langue sont obligatoires'")
    print("=" * 60)

    # Setup
    setup_django()

    # Run admin save tests
    success = run_admin_save_tests()

    # Create debugging script
    print("\n" + "=" * 60)
    create_test_debug_script()

    if success:
        print("\n🚀 Tests backend réussis!")
        print("📋 Le problème pourrait être côté frontend:")
        print("  - Éléments HTML introuvables")
        print("  - Valeurs non récupérées correctement")
        print("  - Problème de timing/événements")
        print("\n💡 Utiliser le script de débogage pour investiguer.")
        sys.exit(0)
    else:
        print("\n🛑 Tests backend échoués!")
        print("Le problème est dans la logique de validation.")
        sys.exit(1)


if __name__ == "__main__":
    main()
