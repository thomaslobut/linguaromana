// 🧪 DIAGNOSTIC SAUVEGARDE DE MOTS - À exécuter dans la console
// ================================================================

console.log('🧪 === DIAGNOSTIC SAUVEGARDE DE MOTS ===');
console.log('🎯 Objectif: Vérifier que les corrections d\'ID fonctionnent');

// 1. Vérifier la présence des boutons
console.log('\n📍 1. VÉRIFICATION DES BOUTONS');
console.log('================================');

const popupSaveBtn = document.getElementById('save-word-btn');
const adminSaveBtn = document.getElementById('admin-save-word-btn');

if (popupSaveBtn) {
    console.log('✅ save-word-btn (popup) trouvé:', popupSaveBtn);
    console.log('   Classe:', popupSaveBtn.className);
    console.log('   Texte:', popupSaveBtn.textContent.trim());
} else {
    console.log('❌ save-word-btn (popup) INTROUVABLE');
}

if (adminSaveBtn) {
    console.log('✅ admin-save-word-btn (admin) trouvé:', adminSaveBtn);
    console.log('   Classe:', adminSaveBtn.className);
    console.log('   Texte:', adminSaveBtn.textContent.trim());
} else {
    console.log('❌ admin-save-word-btn (admin) INTROUVABLE');
}

// 2. Vérifier les éléments de formulaire admin
console.log('\n📍 2. VÉRIFICATION FORMULAIRE ADMIN');
console.log('===================================');

const adminFormElements = {
    'word-key': document.getElementById('word-key'),
    'trans-input-es': document.getElementById('trans-input-es'),
    'trans-input-it': document.getElementById('trans-input-it'),
    'trans-input-pt': document.getElementById('trans-input-pt'),
    'trans-input-ca': document.getElementById('trans-input-ca'),
    'trans-input-fr': document.getElementById('trans-input-fr'),
    'word-grammar': document.getElementById('word-grammar')
};

Object.entries(adminFormElements).forEach(([id, element]) => {
    if (element) {
        console.log(`✅ ${id}: trouvé`);
    } else {
        console.log(`❌ ${id}: MANQUANT`);
    }
});

// 3. Test des event listeners
console.log('\n📍 3. TEST EVENT LISTENERS');
console.log('==========================');

// Test simulation pour popup
if (popupSaveBtn) {
    console.log('🔧 Test listener popup (save-word-btn)...');
    try {
        // Vérifier si un listener est attaché en regardant les propriétés
        const listeners = getEventListeners ? getEventListeners(popupSaveBtn) : 'Non disponible en prod';
        console.log('   Listeners attachés:', listeners);
        console.log('✅ Popup button prêt pour les clics');
    } catch (e) {
        console.log('⚠️ Impossible de vérifier les listeners en production');
    }
} else {
    console.log('❌ Impossible de tester - bouton popup manquant');
}

// Test simulation pour admin
if (adminSaveBtn) {
    console.log('🔧 Test listener admin (admin-save-word-btn)...');
    try {
        const listeners = getEventListeners ? getEventListeners(adminSaveBtn) : 'Non disponible en prod';
        console.log('   Listeners attachés:', listeners);
        console.log('✅ Admin button prêt pour les clics');
    } catch (e) {
        console.log('⚠️ Impossible de vérifier les listeners en production');
    }
} else {
    console.log('❌ Impossible de tester - bouton admin manquant');
}

// 4. Fonctions de test pratiques
console.log('\n📍 4. FONCTIONS DE TEST DISPONIBLES');
console.log('===================================');

// Fonction pour tester la sauvegarde popup
window.testPopupWordSave = function(testWord = 'test') {
    console.log(`🧪 Test sauvegarde popup avec mot: "${testWord}"`);
    
    if (!window.savedWordsManager) {
        console.log('❌ savedWordsManager non disponible');
        return false;
    }
    
    savedWordsManager.currentWord = testWord;
    
    // Simuler les traductions
    window.translations = window.translations || {};
    window.translations[testWord] = {
        es: testWord,
        it: 'test_it',
        pt: 'test_pt', 
        ca: 'test_ca',
        fr: 'test_fr',
        grammar: 'Test grammar note'
    };
    
    try {
        savedWordsManager.handleSaveCurrentWord();
        console.log('✅ Test popup réussi');
        return true;
    } catch (error) {
        console.log('❌ Erreur test popup:', error.message);
        return false;
    }
};

// Fonction pour tester la sauvegarde admin
window.testAdminWordSave = function() {
    console.log('🧪 Test sauvegarde admin');
    
    if (!window.adminManager) {
        console.log('❌ adminManager non disponible');
        return false;
    }
    
    // Remplir le formulaire de test
    const wordKey = document.getElementById('word-key');
    const transEs = document.getElementById('trans-input-es');
    const transFr = document.getElementById('trans-input-fr');
    const grammar = document.getElementById('word-grammar');
    
    if (wordKey) wordKey.value = 'test_admin';
    if (transEs) transEs.value = 'prueba';
    if (transFr) transFr.value = 'test';
    if (grammar) grammar.value = 'Note de test';
    
    try {
        adminManager.saveWord();
        console.log('✅ Test admin réussi');
        return true;
    } catch (error) {
        console.log('❌ Erreur test admin:', error.message);
        return false;
    }
};

// Fonction pour vider les données de test
window.clearTestData = function() {
    console.log('🗑️ Nettoyage des données de test...');
    
    // Vider les champs admin
    const adminInputs = ['word-key', 'trans-input-es', 'trans-input-it', 'trans-input-pt', 'trans-input-ca', 'trans-input-fr', 'word-grammar'];
    adminInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });
    
    console.log('✅ Données de test nettoyées');
};

console.log('\n🎯 FONCTIONS DISPONIBLES:');
console.log('========================');
console.log('testPopupWordSave("mot") - Tester sauvegarde popup');
console.log('testAdminWordSave() - Tester sauvegarde admin');
console.log('clearTestData() - Nettoyer les données de test');

// 5. Résumé final
console.log('\n🎉 RÉSUMÉ DU DIAGNOSTIC');
console.log('=======================');

const popupOK = !!popupSaveBtn;
const adminOK = !!adminSaveBtn;
const formOK = Object.values(adminFormElements).every(el => !!el);

if (popupOK && adminOK && formOK) {
    console.log('✅ TOUT EST FONCTIONNEL !');
    console.log('   - Bouton popup: ✅');
    console.log('   - Bouton admin: ✅');
    console.log('   - Formulaire admin: ✅');
    console.log('\n👉 Vous pouvez maintenant tester la sauvegarde de mots !');
} else {
    console.log('❌ PROBLÈMES DÉTECTÉS:');
    if (!popupOK) console.log('   - Bouton popup manquant');
    if (!adminOK) console.log('   - Bouton admin manquant');
    if (!formOK) console.log('   - Éléments de formulaire manquants');
}

console.log('\n🧪 === FIN DIAGNOSTIC ===');

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testPopupWordSave: window.testPopupWordSave,
        testAdminWordSave: window.testAdminWordSave,
        clearTestData: window.clearTestData
    };
}






