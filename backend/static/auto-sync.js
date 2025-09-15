// Script d'auto-synchronisation pour LinguaRomana
// S'exécute automatiquement au chargement de la page pour synchroniser les données Django

(function() {
    'use strict';
    
    console.log('🚀 Auto-synchronisation LinguaRomana démarrée...');
    
    // Vérifier si une synchronisation récente existe déjà
    const lastSync = localStorage.getItem('linguaromana_last_sync');
    const now = Date.now();
    const oneHour = 60 * 60 * 1000; // 1 heure en millisecondes
    
    // Ne pas re-synchroniser si la dernière sync a eu lieu il y a moins d'une heure
    if (lastSync && (now - parseInt(lastSync)) < oneHour) {
        console.log('⏰ Synchronisation récente détectée, utilisation des données existantes');
        return;
    }
    
    // Charger le script de synchronisation dynamiquement  
    fetch('/static/sync_articles.js')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(scriptContent => {
            console.log('📥 Script de synchronisation chargé');
            
            // Exécuter le script de synchronisation
            try {
                // Créer un script element et l'exécuter
                const script = document.createElement('script');
                script.textContent = scriptContent;
                document.head.appendChild(script);
                
                // Marquer la synchronisation comme effectuée
                localStorage.setItem('linguaromana_last_sync', now.toString());
                
                console.log('✅ Auto-synchronisation terminée avec succès');
                
                // Nettoyer le script après exécution
                setTimeout(() => {
                    document.head.removeChild(script);
                }, 1000);
                
            } catch (error) {
                console.error('❌ Erreur lors de l\'exécution de la synchronisation:', error);
            }
        })
        .catch(error => {
            console.error('❌ Erreur lors du chargement du script de synchronisation:', error);
            console.log('📋 Utilisation des données existantes en localStorage');
        });
    
})();
