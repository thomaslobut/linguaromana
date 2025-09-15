// Debug script pour identifier pourquoi loadLatestArticle() n'est pas appelé

console.log('🔍 DEBUG LOADING: Script debug-loading.js chargé');

// Vérifier l'ordre de chargement
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔍 DEBUG: DOMContentLoaded déclenché');
    console.log('🔍 DEBUG: window.archiveManager existe ?', !!window.archiveManager);
    console.log('🔍 DEBUG: archiveManager existe ?', typeof archiveManager !== 'undefined');
    
    if (window.archiveManager) {
        console.log('🔍 DEBUG: archiveManager trouvé, type:', typeof window.archiveManager);
        console.log('🔍 DEBUG: loadLatestArticle existe ?', typeof window.archiveManager.loadLatestArticle);
    } else {
        console.log('❌ DEBUG: archiveManager NON trouvé !');
        console.log('🔍 DEBUG: Variables globales disponibles:', Object.keys(window).filter(k => k.includes('Manager') || k.includes('manager')));
    }
    
    // Essayer d'accéder à archiveManager après un délai
    setTimeout(() => {
        console.log('🔍 DEBUG (après 200ms): archiveManager existe ?', !!window.archiveManager);
        if (window.archiveManager) {
            console.log('✅ DEBUG: Tentative d\'appel loadLatestArticle()...');
            try {
                window.archiveManager.loadLatestArticle();
            } catch (error) {
                console.error('❌ DEBUG: Erreur lors de l\'appel loadLatestArticle():', error);
            }
        }
    }, 200);
});

// Vérifier si les classes sont définies
setTimeout(() => {
    console.log('🔍 DEBUG: ArchiveManager classe définie ?', typeof ArchiveManager !== 'undefined');
    console.log('🔍 DEBUG: AdminManager classe définie ?', typeof AdminManager !== 'undefined');
    console.log('🔍 DEBUG: archiveManager instance créée ?', !!window.archiveManager);
}, 50);
