
// Script de test pour débugger la validation des articles
// À exécuter dans la console du navigateur sur la page admin

console.log('🔧 Test de débogage de la validation d'articles');

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
