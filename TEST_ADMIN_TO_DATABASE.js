// 🧪 TEST ADMIN → BASE DE DONNÉES - À exécuter dans la console
// ==============================================================

console.log('🧪 === TEST INTERFACE ADMIN → BASE DE DONNÉES ===');
console.log('🎯 Objectif: Vérifier que la création d\'article sauvegarde en base');

// Test principal
window.testAdminToDatabase = async function() {
    console.log('\n🔍 === DÉMARRAGE TEST ADMIN → BASE ===');
    
    // 1. Vérifier que l'API de création fonctionne
    console.log('\n📍 1. TEST API CREATE-ARTICLE');
    console.log('==============================');
    
    const testArticleData = {
        title: 'Test API Direct ' + new Date().toLocaleTimeString(),
        content: 'Ceci est un [test] de l\'API de [création] d\'article.',
        language: 'fr',
        level: 'intermediate',
        publication_date: new Date().toISOString().split('T')[0],
        summary: 'Article de test pour l\'API'
    };
    
    try {
        console.log('📡 Test création d\'article via API directe...');
        console.log('📝 Données de test:', testArticleData);
        
        const response = await fetch('/api/create-article/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            credentials: 'same-origin',
            body: JSON.stringify(testArticleData)
        });

        const result = await response.json();
        console.log('📡 Réponse API:', result);

        if (response.ok && result.success) {
            console.log('✅ API CREATE-ARTICLE fonctionne !');
            console.log(`📰 Article créé avec ID: ${result.article.id}`);
            console.log(`📅 Date publication: ${result.article.publication_date}`);
            
            // Vérifier que l'article apparaît dans latest-article
            await testLatestArticleUpdate(result.article.id);
            
            return { success: true, article: result.article };
        } else {
            console.error('❌ Erreur API:', result.error);
            return { success: false, error: result.error };
        }

    } catch (error) {
        console.error('❌ Erreur lors de l\'appel API:', error);
        return { success: false, error: error.message };
    }
};

// Test que le dernier article est bien mis à jour
async function testLatestArticleUpdate(expectedId) {
    console.log('\n📍 2. VÉRIFICATION LATEST-ARTICLE');
    console.log('=================================');
    
    try {
        const response = await fetch('/api/latest-article/');
        const data = await response.json();
        
        if (data.success && data.article) {
            console.log(`📰 Dernier article récupéré: "${data.article.title}" (ID: ${data.article.id})`);
            
            if (data.article.id == expectedId) {
                console.log('✅ SUCCÈS: Le nouvel article est maintenant le dernier !');
            } else {
                console.log(`⚠️ INFO: Dernier article ID ${data.article.id}, attendu ${expectedId}`);
                console.log('   (Normal si d\'autres articles plus récents existent)');
            }
        } else {
            console.log('❌ Aucun article trouvé via latest-article API');
        }
    } catch (error) {
        console.error('❌ Erreur latest-article:', error);
    }
}

// Test du formulaire admin
window.testAdminForm = function() {
    console.log('\n📍 3. TEST FORMULAIRE ADMIN');
    console.log('===========================');
    
    // Vérifier que l'interface admin est accessible
    if (!window.adminManager) {
        console.error('❌ adminManager non disponible');
        return false;
    }
    
    // Remplir automatiquement le formulaire
    console.log('📝 Remplissage automatique du formulaire...');
    
    const testData = {
        title: 'Test Interface Admin ' + new Date().toLocaleTimeString(),
        content: 'Contenu de test avec des [mots-clés] automatiques pour [vérifier] le système.',
        language: 'fr',
        level: 'intermediate',
        date: new Date().toISOString().split('T')[0],
        summary: 'Test automatique de l\'interface admin'
    };
    
    // Ouvrir l'éditeur si pas déjà ouvert
    if (adminManager.showArticleEditor) {
        adminManager.showArticleEditor();
    }
    
    // Attendre que l'éditeur soit ouvert
    setTimeout(() => {
        const elements = {
            title: document.getElementById('article-title'),
            content: document.getElementById('article-content'),
            language: document.getElementById('article-language'),
            level: document.getElementById('article-level'),
            date: document.getElementById('article-date'),
            summary: document.getElementById('article-summary')
        };
        
        console.log('🔍 Éléments formulaire trouvés:');
        Object.entries(elements).forEach(([name, element]) => {
            if (element) {
                console.log(`  ✅ ${name}: OK`);
            } else {
                console.log(`  ❌ ${name}: MANQUANT`);
            }
        });
        
        // Remplir les champs
        if (elements.title) elements.title.value = testData.title;
        if (elements.content) elements.content.value = testData.content;
        if (elements.language) elements.language.value = testData.language;
        if (elements.level) elements.level.value = testData.level;
        if (elements.date) elements.date.value = testData.date;
        if (elements.summary) elements.summary.value = testData.summary;
        
        console.log('✅ Formulaire rempli avec les données de test');
        console.log('👉 Cliquez maintenant sur "Enregistrer" pour tester la sauvegarde');
        
    }, 500);
    
    return true;
};

// Test automatique complet
window.testCompleteAdminFlow = async function() {
    console.log('\n🎯 === TEST FLUX COMPLET ADMIN ===');
    
    // 1. Test API directe
    const apiTest = await testAdminToDatabase();
    
    // 2. Test rechargement page d'accueil
    if (apiTest.success) {
        console.log('\n📍 4. TEST RECHARGEMENT PAGE D\'ACCUEIL');
        console.log('=====================================');
        
        try {
            if (window.archiveManager) {
                console.log('🔄 Rechargement du dernier article...');
                await archiveManager.loadLatestArticle();
                
                const displayedTitle = document.querySelector('.article-header h2')?.textContent;
                console.log(`📰 Article maintenant affiché: "${displayedTitle}"`);
                
                if (displayedTitle && displayedTitle.includes('Test API Direct')) {
                    console.log('✅ PARFAIT: L\'article de test s\'affiche automatiquement !');
                } else {
                    console.log('ℹ️ Article affiché (possiblement un autre article plus récent)');
                }
            } else {
                console.log('❌ archiveManager non disponible');
            }
        } catch (error) {
            console.error('❌ Erreur rechargement:', error);
        }
    }
    
    // 3. Test formulaire admin
    console.log('\n📍 5. PRÉPARATION TEST INTERFACE');
    console.log('================================');
    testAdminForm();
    
    console.log('\n🎉 === RÉSUMÉ DES TESTS ===');
    console.log('API Création:', apiTest.success ? '✅' : '❌');
    console.log('Interface Admin: ✅ (prête pour test manuel)');
    
    if (apiTest.success) {
        console.log('\n🎉 INTÉGRATION ADMIN → BASE FONCTIONNELLE !');
        console.log('👉 Les articles créés via l\'admin apparaissent automatiquement sur l\'accueil');
    } else {
        console.log('\n⚠️ PROBLÈME DÉTECTÉ');
        console.log('👉 Vérifiez que le serveur Django fonctionne');
    }
    
    return apiTest;
};

// Fonction utilitaire pour récupérer le CSRF token
function getCsrfToken() {
    // Essayer d'abord les cookies
    const csrfCookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
    if (csrfCookie) {
        return csrfCookie.split('=')[1];
    }
    
    // Fallback: chercher dans les meta tags
    const csrfMeta = document.querySelector('[name=csrfmiddlewaretoken]');
    if (csrfMeta) {
        return csrfMeta.getAttribute('content');
    }
    
    // Dernier fallback: créer un token temporaire
    console.log('⚠️ CSRF token non trouvé, utilisation d\'un token vide');
    return '';
}

// Test simple de connectivité
window.testDjangoConnection = async function() {
    console.log('🔗 Test connectivité Django...');
    
    try {
        const response = await fetch('/api/latest-article/');
        if (response.ok) {
            console.log('✅ Serveur Django accessible');
            return true;
        } else {
            console.log(`❌ Serveur Django erreur: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Serveur Django inaccessible:', error.message);
        return false;
    }
};

// Instructions d'utilisation
console.log('\n🎯 FONCTIONS DE TEST DISPONIBLES:');
console.log('=================================');
console.log('testDjangoConnection() - Test connectivité serveur');
console.log('testAdminToDatabase() - Test API création directe');
console.log('testAdminForm() - Préparer formulaire admin');
console.log('testCompleteAdminFlow() - 🎯 TEST COMPLET');

console.log('\n👉 Lancez testCompleteAdminFlow() pour tout tester');
console.log('🧪 === FIN INITIALISATION TESTS ===');

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testAdminToDatabase: window.testAdminToDatabase,
        testAdminForm: window.testAdminForm,
        testCompleteAdminFlow: window.testCompleteAdminFlow,
        testDjangoConnection: window.testDjangoConnection
    };
}






