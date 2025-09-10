// Script de debug pour vérifier le chargement d'article
console.log('🚀 Debug script chargé');

document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 DOM chargé - debug script');
    
    // Attendre un peu puis tester l'API
    setTimeout(async () => {
        console.log('🔄 Test direct de l\'API...');
        
        try {
            const response = await fetch('/api/latest-article-quiz/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ API Response:', data);
            
            if (data.success && data.article) {
                console.log('📰 Article trouvé:', data.article.title);
                
                // Tester si on peut modifier le DOM
                const articleContent = document.querySelector('.article-content');
                if (articleContent) {
                    articleContent.innerHTML = `
                        <h3>${data.article.title}</h3>
                        <p>${data.article.content}</p>
                        <p><strong>Debug:</strong> Article chargé avec succès !</p>
                    `;
                    console.log('✅ DOM mis à jour avec succès');
                } else {
                    console.error('❌ Element .article-content introuvable');
                }
            } else {
                console.error('❌ Pas d\'article dans la réponse API');
            }
            
        } catch (error) {
            console.error('❌ Erreur API:', error);
        }
    }, 2000); // 2 secondes d'attente
});
