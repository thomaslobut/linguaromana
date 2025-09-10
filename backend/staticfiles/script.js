// Environment Configuration
const API_CONFIG = {
    getBaseUrl() {
        // Detect environment
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        
        // If opened directly as file:// (development without server)
        if (protocol === 'file:') {
            console.log('🔧 Mode: Fichier local → API pointera vers localhost:8000');
            return 'http://localhost:8000';
        }
        
        // If served by Django development server
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            console.log('🔧 Mode: Développement Django → API relative');
            return ''; // Use relative URLs
        }
        
        // Production or other environments
        console.log('🔧 Mode: Production → API relative');
        return ''; // Use relative URLs
    },
    
    buildUrl(endpoint) {
        const baseUrl = this.getBaseUrl();
        return baseUrl + endpoint;
    }
};

// Global API function
function apiCall(endpoint, options = {}) {
    const url = API_CONFIG.buildUrl(endpoint);
    console.log(`📡 API Call: ${url}`);
    return fetch(url, options);
}

// Global utility functions for article management
function getCSRFToken() {
    const csrfCookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
    return csrfCookie ? csrfCookie.split('=')[1] : '';
}

function showMessage(message, type = 'success') {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `admin-message ${type}`;
    messageEl.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
        ${message}
    `;

    // Insert at top of body or current section
    const activeSection = document.querySelector('#admin-section:not([style*="none"])') || 
                          document.querySelector('#archive-section:not([style*="none"])') || 
                          document.body;
    
    activeSection.insertBefore(messageEl, activeSection.firstChild);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl);
        }
    }, 3000);
}

function saveArticleLocally(title, content, language, level, date, summary) {
    console.log('📦 Fallback: Sauvegarde locale uniquement');
    
    const extractKeywordsFromContent = (content) => {
        const matches = content.match(/\[([^\]]+)\]/g);
        return matches ? matches.map(match => match.slice(1, -1)) : [];
    };
    
    const keywords = extractKeywordsFromContent(content);
    const article = {
        id: 'local_' + Date.now(),
        title,
        date,
        content,
        summary,
        language,
        level,
        keywords,
        status: 'published',
        type: 'local',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isFeatured: false
    };

    // Save to localStorage via adminManager for compatibility
    if (window.adminManager) {
        adminManager.customArticles.unshift(article);
        adminManager.saveCustomArticles();
    }
    
    showMessage('⚠️ Article sauvegardé localement (hors connexion)', 'warning');
}

// Global article functions - independent from AdminManager
function loadArticleIntoMain(article) {
    console.log('🔄 Chargement de l\'article dans la page principale:', article.title);
    
    // Update main article titles
    const mainTitle = document.getElementById('article-main-title');
    const articleMeta = document.getElementById('article-meta');
    const articleContent = document.querySelector('.article-content');
    const newsArticle = document.querySelector('.news-article');
    
    // Titre dynamique basé sur la langue de l'article
    const dailyLanguageDisplay = getLanguageDisplayName(article.language || 'es');
    if (mainTitle) mainTitle.textContent = `📰 Article du jour - ${dailyLanguageDisplay}`;
    
    // Format article metadata with date, language and level
    const articleDate = new Date(article.date).toLocaleDateString('fr-FR');
    const languageNames = {
        'es': 'Español',
        'it': 'Italiano', 
        'pt': 'Português',
        'ca': 'Català',
        'fr': 'Français'
    };
    const levelNames = {
        'beginner': 'Débutant',
        'intermediate': 'Intermédiaire',
        'advanced': 'Avancé'
    };
    
    const languageName = languageNames[article.language] || article.language;
    const levelName = levelNames[article.level] || article.level;
    
    if (articleMeta) {
        articleMeta.textContent = `${articleDate} • ${languageName} • Niveau: ${levelName}`;
    }
    
    // Process content and make keywords clickable
    let processedContent = article.content;
    
    if (article.keywords && article.keywords.length > 0) {
        console.log('🔑 Mots-clés détectés:', article.keywords);
        article.keywords.forEach(keyword => {
            const regex = new RegExp(`\\[${keyword}\\]`, 'g');
            // Utiliser data-word au lieu d'onclick pour éviter les problèmes de caractères spéciaux
            processedContent = processedContent.replace(regex, `<span class="keyword" data-word="${keyword.replace(/"/g, '&quot;')}">${keyword}</span>`);
        });
    } else {
        // Fallback for bracket notation
        console.log('📝 Utilisation de la notation crochets pour détecter les mots-clés');
        processedContent = processedContent.replace(/\[([^\]]+)\]/g, '<span class="keyword" data-word="$1">$1</span>');
    }
    
    // Update article structure with title and content
    if (newsArticle) {
        // Split content into paragraphs
        const paragraphs = processedContent.split('\n\n').filter(p => p.trim());
        const contentHTML = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
        
        // Create complete article structure
        newsArticle.innerHTML = `
            <h3>${article.title}</h3>
            <div class="article-content">
                ${contentHTML}
            </div>
        `;
        
        console.log('✅ Article structure mise à jour avec titre:', article.title);
    } else if (articleContent) {
        // Fallback: update only content if newsArticle not found
        const paragraphs = processedContent.split('\n\n').filter(p => p.trim());
        articleContent.innerHTML = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
        console.log('⚠️ Fallback: mise à jour du contenu uniquement');
    } else {
        console.error('❌ Aucun élément DOM trouvé pour afficher l\'article');
    }
    
    // Load grammar notes if available
    if (article.grammar_note_data) {
        loadGrammarNotes(article.grammar_note_data);
    }
    
    // Re-initialize keywords after content update
    setTimeout(() => {
        initializeKeywords();
    }, 100);
    
    console.log('✅ Article chargé avec succès');
}

// Function to load grammar notes into the grammar section
function loadGrammarNotes(grammarNote) {
    console.log('📝 Tentative de chargement des notes de grammaire:', grammarNote.title);
    
    // Vérifier si la section de grammaire existe
    const grammarTitle = document.getElementById('grammar-title');
    if (!grammarTitle) {
        console.log('⚠️ Section de grammaire non trouvée dans l\'interface - notes ignorées');
        return;
    }
    
    const grammarText = document.getElementById('grammar-text');
    const grammarConcepts = document.getElementById('grammar-concepts');
    const grammarConceptsContent = document.getElementById('grammar-concepts-content');
    const grammarObjectives = document.getElementById('grammar-objectives');
    const grammarObjectivesContent = document.getElementById('grammar-objectives-content');
    const grammarLevel = document.getElementById('grammar-level');
    const grammarMeta = document.getElementById('grammar-meta');
    
    // Update title
    if (grammarTitle) {
        grammarTitle.textContent = grammarNote.title || 'Notes de grammaire';
    }
    
    // Update main grammar content
    if (grammarText) {
        if (grammarNote.content) {
            // Split content into paragraphs for better formatting
            const paragraphs = grammarNote.content.split('\n\n').filter(p => p.trim());
            grammarText.innerHTML = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
        } else {
            grammarText.innerHTML = '<p>Aucun contenu de grammaire disponible.</p>';
        }
    }
    
    // Update key concepts if available
    if (grammarNote.key_concepts && grammarNote.key_concepts.trim()) {
        if (grammarConceptsContent) {
            const concepts = grammarNote.key_concepts.split('\n').filter(c => c.trim());
            grammarConceptsContent.innerHTML = concepts.map(concept => `<div class="concept-item">• ${concept.trim()}</div>`).join('');
        }
        if (grammarConcepts) {
            grammarConcepts.style.display = 'block';
        }
    } else {
        if (grammarConcepts) {
            grammarConcepts.style.display = 'none';
        }
    }
    
    // Update learning objectives if available
    if (grammarNote.learning_objectives && grammarNote.learning_objectives.trim()) {
        if (grammarObjectivesContent) {
            const objectives = grammarNote.learning_objectives.split('\n').filter(o => o.trim());
            grammarObjectivesContent.innerHTML = objectives.map(objective => `<div class="objective-item">• ${objective.trim()}</div>`).join('');
        }
        if (grammarObjectives) {
            grammarObjectives.style.display = 'block';
        }
    } else {
        if (grammarObjectives) {
            grammarObjectives.style.display = 'none';
        }
    }
    
    // Update difficulty level
    if (grammarLevel) {
        const levelNames = {
            'beginner': 'Débutant',
            'intermediate': 'Intermédiaire',
            'advanced': 'Avancé'
        };
        grammarLevel.textContent = levelNames[grammarNote.difficulty_level] || grammarNote.difficulty_level || 'Intermédiaire';
    }
    
    // Show meta information
    if (grammarMeta) {
        grammarMeta.style.display = 'block';
    }
    
    console.log('✅ Notes de grammaire chargées avec succès');
}

// Global article management functions - independent from AdminManager
function editArticle(articleId) {
    console.log(`✏️ editArticle appelée avec ID: ${articleId}`);
    
    // Vérifier d'abord que adminManager existe
    if (!window.adminManager) {
        console.error('❌ adminManager non disponible - Gestionnaire non initialisé');
        alert('Erreur: Le gestionnaire d\'administration n\'est pas disponible. Rechargez la page.');
        return;
    }
    
    console.log(`📊 AdminManager disponible, recherche de l'article ID ${articleId}`);
    console.log(`📋 Articles disponibles: ${adminManager.customArticles.length}`);
    
    // Lister tous les articles disponibles pour debug
    adminManager.customArticles.forEach((article, index) => {
        console.log(`  ${index + 1}. ID: ${article.id}, Titre: "${article.title}"`);
    });
    
    const article = adminManager.customArticles.find(a => String(a.id) === String(articleId));
    
    if (article) {
        console.log(`✅ Article trouvé: "${article.title}"`);
        try {
            adminManager.showArticleEditor(article);
            console.log('✅ Éditeur d\'article ouvert avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'ouverture de l\'éditeur:', error);
            alert(`Erreur lors de l'ouverture de l'éditeur: ${error.message}`);
        }
    } else {
        console.error(`❌ Article avec ID ${articleId} non trouvé`);
        console.log(`Types d'IDs disponibles:`, adminManager.customArticles.map(a => `${a.id} (${typeof a.id})`));
        alert(`Article avec ID ${articleId} non trouvé. Vérifiez la liste des articles.`);
    }
}

function useArticle(articleId) {
    if (window.adminManager) {
        const article = adminManager.customArticles.find(a => String(a.id) === String(articleId));
        if (article) {
            loadArticleIntoMain(article);
            if (window.savedWordsManager) {
                savedWordsManager.showHomeSection(); // Return to main view
            }
            showMessage('Article chargé dans la vue principale !', 'success');
        }
    }
}

function deleteArticle(articleId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?') && window.adminManager) {
        adminManager.customArticles = adminManager.customArticles.filter(a => String(a.id) !== String(articleId));
        adminManager.saveCustomArticles();
        adminManager.renderArticles().catch(err => console.error('Erreur renderArticles:', err));
        showMessage('Article supprimé avec succès !', 'success');
    }
}

function editKeyword(keyword) {
    if (window.adminManager) {
        adminManager.editKeyword(keyword);
    }
}

function editWord(word) {
    if (window.adminManager) {
        const wordData = adminManager.customWords[word] || translations[word];
        adminManager.showWordEditor(word, wordData);
    }
}

function deleteWord(word) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le mot "${word}" ?`) && window.adminManager) {
        delete adminManager.customWords[word];
        adminManager.saveCustomWords();
        adminManager.renderWords();
        showMessage('Mot supprimé avec succès !', 'success');
    }
}

// Fonctions pour gérer les articles de l'API (base de données)
function editApiArticle(articleId) {
    console.log(`🔧 editApiArticle appelée avec ID: ${articleId} (article de la base de données)`);
    
    // Pour l'instant, on ne peut pas éditer les articles de l'API directement
    // On pourrait implémenter cela plus tard avec un formulaire dédié
    alert(`⚠️ Édition des articles de la base de données non implémentée.\n\nArticle ID: ${articleId}\n\nPour modifier cet article :\n1. Utilisez l'interface d'administration Django\n2. Ou créez un nouvel article local basé sur celui-ci`);
    
    // TODO: Implémenter l'édition d'articles API
    // - Récupérer l'article via /api/articles/{id}/
    // - Ouvrir un formulaire d'édition
    // - Sauvegarder via PUT /api/articles/{id}/
}

async function useApiArticle(articleId) {
    console.log(`📰 useApiArticle appelée avec ID: ${articleId}`);
    
    try {
        // Récupérer l'article depuis l'API
        const response = await fetch(`/api/articles/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            credentials: 'same-origin'
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        if (data.success && data.articles) {
            const article = data.articles.find(a => String(a.id) === String(articleId));
            
            if (article) {
                // Formater l'article pour loadArticleIntoMain
                const formattedArticle = {
                    id: article.id,
                    title: article.title,
                    content: article.content,
                    date: article.publication_date || article.date,
                    language: article.language,
                    level: article.level,
                    keywords: article.keywords || []
                };
                
                loadArticleIntoMain(formattedArticle);
                
                if (window.savedWordsManager) {
                    savedWordsManager.showHomeSection();
                }
                
                showMessage(`📰 Article "${article.title}" chargé depuis la base de données !`, 'success');
                console.log('✅ Article API chargé avec succès');
            } else {
                throw new Error(`Article ID ${articleId} non trouvé`);
            }
        }
    } catch (error) {
        console.error('❌ Erreur lors du chargement de l\'article API:', error);
        showMessage(`Erreur : ${error.message}`, 'error');
    }
}

function deleteApiArticle(articleId) {
    alert(`⚠️ Suppression des articles de la base de données non disponible depuis cette interface.\n\nPour supprimer l'article ID ${articleId} :\n1. Utilisez l'interface d'administration Django (/admin/)\n2. Ou utilisez la console de développement`);
    
    // TODO: Implémenter la suppression d'articles API si nécessaire
    // Nécessiterait un endpoint DELETE /api/articles/{id}/
}

// Utility functions for keyword extraction
function extractKeywordsFromContent(content) {
    const keywordRegex = /\[([^\]]+)\]/g;
    const keywords = [];
    let match;
    
    while ((match = keywordRegex.exec(content)) !== null) {
        keywords.push(match[1]);
    }
    
    // Remove duplicates
    return [...new Set(keywords)];
}

// Quiz management functions
let quizQuestionCounter = 0;

function addQuizQuestion() {
    console.log('➕ Ajout d\'une nouvelle question de quiz');
    
    quizQuestionCounter++;
    const questionId = `quiz-question-${quizQuestionCounter}`;
    
    const questionHtml = `
        <div class="quiz-question-item" id="${questionId}" data-question-id="${quizQuestionCounter}">
            <div class="question-header">
                <h6>Question ${quizQuestionCounter}</h6>
                <button type="button" class="remove-question-btn" onclick="removeQuizQuestion('${questionId}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <div class="question-form">
                <div class="form-group">
                    <label for="question-word-${quizQuestionCounter}">Mot-clé (optionnel)</label>
                    <input type="text" id="question-word-${quizQuestionCounter}" class="quiz-word-input" 
                           placeholder="Ex: casa, comer, importante (optionnel)">
                </div>
                
                <div class="form-group">
                    <label for="question-text-${quizQuestionCounter}">Question</label>
                    <input type="text" id="question-text-${quizQuestionCounter}" class="quiz-question-input" 
                           placeholder="Ex: ¿Qué significa 'casa' en este contexto?">
                </div>
                
                <div class="options-grid">
                    <div class="form-group">
                        <label for="option-a-${quizQuestionCounter}">Option A (Correcte)</label>
                        <input type="text" id="option-a-${quizQuestionCounter}" class="quiz-option-input" 
                               placeholder="Réponse correcte">
                    </div>
                    <div class="form-group">
                        <label for="option-b-${quizQuestionCounter}">Option B</label>
                        <input type="text" id="option-b-${quizQuestionCounter}" class="quiz-option-input" 
                               placeholder="Réponse incorrecte">
                    </div>
                    <div class="form-group">
                        <label for="option-c-${quizQuestionCounter}">Option C</label>
                        <input type="text" id="option-c-${quizQuestionCounter}" class="quiz-option-input" 
                               placeholder="Réponse incorrecte">
                    </div>
                    <div class="form-group">
                        <label for="option-d-${quizQuestionCounter}">Option D</label>
                        <input type="text" id="option-d-${quizQuestionCounter}" class="quiz-option-input" 
                               placeholder="Réponse incorrecte">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="word-definition-${quizQuestionCounter}">Définition / Explication (optionnelle)</label>
                        <textarea id="word-definition-${quizQuestionCounter}" class="quiz-definition-input" 
                                  rows="2" placeholder="Définition du mot-clé ou explication générale pour la question"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="grammar-note-${quizQuestionCounter}">Note grammaticale / Contexte (optionnel)</label>
                        <textarea id="grammar-note-${quizQuestionCounter}" class="quiz-grammar-input" 
                                  rows="2" placeholder="Informations grammaticales ou contexte de la question"></textarea>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const questionsContainer = document.getElementById('quiz-questions');
    const noQuestionsMsg = questionsContainer.querySelector('.no-questions');
    
    if (noQuestionsMsg) {
        noQuestionsMsg.style.display = 'none';
    }
    
    questionsContainer.insertAdjacentHTML('beforeend', questionHtml);
    console.log(`✅ Question ${quizQuestionCounter} ajoutée`);
}

function removeQuizQuestion(questionId) {
    console.log(`🗑️ Suppression de la question: ${questionId}`);
    
    const questionElement = document.getElementById(questionId);
    if (questionElement) {
        questionElement.remove();
        
        const questionsContainer = document.getElementById('quiz-questions');
        const remainingQuestions = questionsContainer.querySelectorAll('.quiz-question-item');
        
        if (remainingQuestions.length === 0) {
            const noQuestionsMsg = questionsContainer.querySelector('.no-questions');
            if (noQuestionsMsg) {
                noQuestionsMsg.style.display = 'block';
            }
        }
        
        console.log('✅ Question supprimée');
    }
}

function collectQuizData() {
    console.log('📋 Collecte des données de quiz');
    
    const questionsContainer = document.getElementById('quiz-questions');
    const questionItems = questionsContainer.querySelectorAll('.quiz-question-item');
    
    const quizData = [];
    
    questionItems.forEach(item => {
        const questionId = item.dataset.questionId;
        
        const wordInput = document.getElementById(`question-word-${questionId}`);
        const questionInput = document.getElementById(`question-text-${questionId}`);
        const optionA = document.getElementById(`option-a-${questionId}`);
        const optionB = document.getElementById(`option-b-${questionId}`);
        const optionC = document.getElementById(`option-c-${questionId}`);
        const optionD = document.getElementById(`option-d-${questionId}`);
        const definitionInput = document.getElementById(`word-definition-${questionId}`);
        const grammarInput = document.getElementById(`grammar-note-${questionId}`);
        
        // Validation des champs obligatoires (mot-clé maintenant optionnel)
        if (wordInput && questionInput && optionA && optionB && optionC && optionD) {
            const word = wordInput.value.trim();
            const questionText = questionInput.value.trim();
            const optAText = optionA.value.trim();
            const optBText = optionB.value.trim();
            const optCText = optionC.value.trim();
            const optDText = optionD.value.trim();
            
            // Seuls question et options sont obligatoires, mot-clé est optionnel
            if (questionText && optAText && optBText && optCText && optDText) {
                const quizItem = {
                    question_text: questionText,
                    question_type: 'multiple_choice',
                    difficulty_level: 'intermediate', // Sera mis à jour avec le niveau de l'article
                    option_a: optAText,
                    option_b: optBText,
                    option_c: optCText,
                    option_d: optDText,
                    correct_option: 'A' // Par convention, A est toujours la bonne réponse
                };
                
                // Ajouter le mot-clé seulement s'il est fourni
                if (word) {
                    quizItem.word = word;
                    quizItem.word_definition = {
                        word: word,
                        definition: definitionInput ? definitionInput.value.trim() : '',
                        grammar_note: grammarInput ? grammarInput.value.trim() : '',
                        difficulty_level: 'intermediate' // Sera mis à jour avec le niveau de l'article
                    };
                } else {
                    // Si pas de mot-clé, on peut quand même avoir une définition générale
                    if (definitionInput && definitionInput.value.trim()) {
                        quizItem.general_definition = definitionInput.value.trim();
                    }
                    if (grammarInput && grammarInput.value.trim()) {
                        quizItem.grammar_note = grammarInput.value.trim();
                    }
                }
                
                quizData.push(quizItem);
            }
        }
    });
    
    console.log(`✅ ${quizData.length} questions de quiz collectées`);
    return quizData;
}

function clearQuizQuestions() {
    console.log('🧹 Nettoyage des questions de quiz');
    
    const questionsContainer = document.getElementById('quiz-questions');
    const questionItems = questionsContainer.querySelectorAll('.quiz-question-item');
    
    questionItems.forEach(item => item.remove());
    
    const noQuestionsMsg = questionsContainer.querySelector('.no-questions');
    if (noQuestionsMsg) {
        noQuestionsMsg.style.display = 'block';
    }
    
    // Reset counter
    quizQuestionCounter = 0;
    console.log('✅ Questions de quiz nettoyées');
}

// Global article save function - independent from AdminManager
async function saveArticle() {
    console.log('💾 saveArticle() - Sauvegarde en base de données Django');
    
    // Vérifier d'abord que l'éditeur est ouvert et visible
    const editor = document.getElementById('article-editor');
    if (!editor || editor.style.display === 'none') {
        console.error('❌ L\'éditeur d\'article n\'est pas ouvert!');
        alert('Erreur: L\'éditeur d\'article n\'est pas accessible. Veuillez réessayer.');
        return;
    }
    
    // Forcer la vérification et réparation du formulaire avant validation
    if (window.archiveManager && typeof archiveManager.ensureFormIntegrity === 'function') {
        archiveManager.ensureFormIntegrity();
    }
    
    // Récupérer les éléments du formulaire
    const titleElement = document.getElementById('article-title');
    const dateElement = document.getElementById('article-date');
    const contentElement = document.getElementById('article-content');
    const summaryElement = document.getElementById('article-summary');
    const languageElement = document.getElementById('article-language');
    const levelElement = document.getElementById('article-level');

    if (!titleElement || !contentElement || !languageElement) {
        console.error('❌ Éléments DOM critiques manquants!');
        alert('Erreur technique: Impossible d\'accéder aux champs du formulaire. Veuillez recharger la page.');
        return;
    }

    // Récupérer les valeurs
    const title = titleElement.value.trim();
    const date = dateElement ? dateElement.value : new Date().toISOString().split('T')[0];
    const content = contentElement.value.trim();
    const summary = summaryElement ? summaryElement.value.trim() : '';
    const language = languageElement.value;
    const level = levelElement ? levelElement.value : 'intermediate';

    console.log('📝 Données récupérées:', { title, date, content: content.substring(0, 50) + '...', summary, language, level });

    // Validation
    if (!title || !content || !language) {
        const missingFields = [];
        if (!title) missingFields.push('titre');
        if (!content) missingFields.push('contenu');
        if (!language) missingFields.push('langue');
        
        alert(`Les champs suivants sont obligatoires: ${missingFields.join(', ')}`);
        return;
    }

    try {
        console.log('📡 Envoi vers l\'API Django...');
        
        // Extraire les mots-clés du contenu pour information
        const keywords = extractKeywordsFromContent(content);
        console.log('🔑 Mots-clés détectés dans le contenu:', keywords);
        
        // Collecter les données de quiz créées par l'admin
        const quizQuestions = collectQuizData();
        console.log('🧠 Questions de quiz collectées:', quizQuestions);
        
        // Mettre à jour le niveau de difficulté des quiz avec celui de l'article
        quizQuestions.forEach(quiz => {
            quiz.difficulty_level = level;
            if (quiz.word_definition) {
                quiz.word_definition.difficulty_level = level;
                quiz.word_definition.language = language;
            }
        });
        
        // Préparer les données pour l'API - Article avec quiz créés par l'admin
        const articleData = {
            title: title,
            content: content,
            language: language,
            level: level,
            publication_date: date,
            summary: summary,
            keywords: keywords, // Inclure les mots-clés pour référence
            quiz_questions: quizQuestions // Inclure les quiz créés par l'admin
        };

        console.log('📦 Données complètes à envoyer:', {
            ...articleData,
            keywords: `${keywords.length} mots-clés détectés`,
            quiz_questions: `${quizQuestions.length} questions de quiz`
        });

        // Appeler l'API Django pour créer l'article avec quiz en base
        const response = await apiCall('/api/create-article-quiz/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            credentials: 'same-origin',
            body: JSON.stringify(articleData)
        });

        const result = await response.json();
        console.log('📡 Réponse API:', result);

        if (response.ok && result.success) {
            console.log('✅ Article créé en base avec ID:', result.article.id);
            console.log('🔑 Mots-clés inclus:', keywords.length);
            console.log('🧠 Quiz créés:', quizQuestions.length);
            
            // Sauvegarde locale minimale pour compatibilité interface
            const localArticle = {
                id: result.article.id.toString(),
                title: result.article.title,
                content: result.article.content,
                language: result.article.language,
                level: result.article.level,
                date: result.article.publication_date,
                summary: result.article.summary || '',
                keywords: result.article.keywords || [],
                status: 'published',
                type: 'database',
                createdAt: result.article.created_at,
                updatedAt: result.article.created_at,
                isFeatured: false
            };

            // Save to adminManager for compatibility
            if (window.adminManager) {
                if (adminManager.currentEditingArticle) {
                    const index = adminManager.customArticles.findIndex(a => a.id === adminManager.currentEditingArticle.id);
                    adminManager.customArticles[index] = localArticle;
                } else {
                    adminManager.customArticles.unshift(localArticle);
                }
                adminManager.saveCustomArticles();
                adminManager.hideArticleEditor();
                adminManager.renderArticles().catch(err => console.error('Erreur renderArticles:', err));
            }
            
            // IMPORTANT: Recharger automatiquement depuis la base avec quiz intégrés
            if (window.archiveManager) {
                console.log('🔄 Rechargement automatique avec quiz intégrés...');
                await archiveManager.loadLatestArticle();
                archiveManager.updateStats();
            }
            
            const quizMessage = quizQuestions.length > 0 
                ? `avec ${quizQuestions.length} question(s) de quiz !`
                : '! Vous pouvez ajouter des quiz en éditant l\'article.';
            showMessage(`✅ Article "${title}" créé avec succès ${quizMessage}`, 'success');

        } else {
            console.error('❌ Erreur API:', result.error);
            
            // En cas d'erreur, sauvegarder localement
            saveArticleLocally(title, content, language, level, date, summary);
            alert(`Erreur API: ${result.error}. Article sauvegardé localement.`);
        }

    } catch (error) {
        console.error('❌ Erreur lors de l\'appel API:', error);
        
        // Fallback: sauvegarder localement si l'API échoue
        saveArticleLocally(title, content, language, level, date, summary);
        alert('Erreur de connexion. Article sauvegardé localement seulement.');
    }
}

// Translations database for keywords
const translations = {
    "engañan": {
        es: "engañan (verbo: engañar - deceive)",
        it: "ingannano (verbo: ingannare)",
        pt: "enganam (verbo: enganar)",
        ca: "enganyen (verb: enganyar)",
        fr: "trompent (verbe: tromper)",
        grammar: "Tercera persona del plural del presente de indicativo del verbo 'engañar'. Expresa una acción habitual o universal."
    },
    "devastadora": {
        es: "devastadora (adjetivo femenino)",
        it: "devastante (aggettivo)",
        pt: "devastadora (adjetivo feminino)",
        ca: "devastadora (adjectiu femení)",
        fr: "dévastatrice (adjectif féminin)",
        grammar: "Adjetivo calificativo en género femenino que indica algo que causa gran destrucción o daño."
    },
    "controversia": {
        es: "controversia (sustantivo femenino)",
        it: "controversia (sostantivo femminile)",
        pt: "controvérsia (substantivo feminino)",
        ca: "controvèrsia (substantiu femení)",
        fr: "controverse (nom féminin)",
        grammar: "Sustantivo que indica una discusión prolongada sobre un tema en el que hay opiniones opuestas."
    }
};

// Quiz data
const quizData = [
    {
        question: "¿Qué opinan los expertos sobre los lanzamientos aéreos?",
        options: ["Son muy efectivos", "No son efectivos", "Son la mejor solución", "Son baratos"],
        correct: 1
    },
    {
        question: "Según el activista palestino, ¿qué son realmente estos lanzamientos?",
        options: ["Ayuda real", "Fotos que engañan", "Una solución perfecta", "Un programa exitoso"],
        correct: 1
    },
    {
        question: "¿Cómo se describe la situación humanitaria en Gaza?",
        options: ["Está mejorando", "Es normal", "Es devastadora", "Es excelente"],
        correct: 2
    }
];

// Application state
let currentQuestion = 0;
let userAnswers = [];
let score = 0;
let currentStreak = 7;
let currentPoints = 2840;

// DOM elements
const translationPopup = document.getElementById('translation-popup');
const popupWord = document.getElementById('popup-word');
const closeBtn = document.querySelector('.close-btn');
const streakCount = document.getElementById('streak-count');
const pointsCount = document.getElementById('points-count');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeKeywords();
    initializeQuiz();
    updateProgress();
    
    // Afficher la langue du jour
    const dailyLanguage = getDailyLanguage();
    console.log(`🌍 Langue du jour: ${getLanguageDisplayName(dailyLanguage)}`);
});

// Initialize clickable keywords
function initializeKeywords() {
    const keywords = document.querySelectorAll('.keyword');
    console.log(`🔗 Initialisation ${keywords.length} mots-clés cliquables`);
    
    keywords.forEach((keyword, index) => {
        const word = keyword.dataset.word;
        const textContent = keyword.textContent;
        console.log(`  ${index + 1}. "${textContent}" (data-word: "${word}")`);
        
        keyword.addEventListener('click', function() {
            const clickedWord = this.dataset.word;
            console.log(`👆 Clic sur mot-clé: "${clickedWord}" (textContent: "${this.textContent}")`);
            showTranslation(clickedWord);
        });
    });
    
    console.log('✅ Mots-clés initialisés');
}

// Show translation popup
async function showTranslation(word) {
    console.log(`🔍 showTranslation appelée avec: "${word}" (type: ${typeof word})`);
    
    // Vérification de sécurité du paramètre
    if (!word || typeof word !== 'string') {
        console.error('❌ Erreur: paramètre word invalide dans showTranslation:', word);
        return;
    }
    
    console.log(`✅ Recherche définition pour: "${word}"`);
    
    let wordData = null;
    
    // 1. Vérifier d'abord les traductions statiques
    if (translations[word]) {
        console.log(`📚 Mot trouvé dans translations statiques: "${word}"`);
        wordData = translations[word];
    } 
    // 2. Vérifier les mots personnalisés de l'admin
    else if (window.adminManager && adminManager.customWords[word]) {
        console.log(`🎯 Mot trouvé dans customWords: "${word}"`);
        const customWord = adminManager.customWords[word];
        
        // Support both old format (direct es, it, pt, ca, fr) and new format (translations)
        if (customWord.translations) {
            wordData = {
                ...customWord.translations,
                grammar: customWord.definition?.grammar_note || customWord.grammar || ''
            };
        } else {
            wordData = {
                es: customWord.es || '',
                it: customWord.it || '',
                pt: customWord.pt || '',
                ca: customWord.ca || '',
                fr: customWord.fr || '',
                grammar: customWord.grammar || ''
            };
        }
    } 
    // 3. Si pas trouvé localement, appeler l'API
    else {
        console.log(`🌐 Mot non trouvé localement, appel API pour: "${word}"`);
        
        // Afficher message de chargement
        showTranslationPopup(word, {
            es: 'Chargement...',
            it: 'Caricamento...',
            pt: 'Carregando...',
            ca: 'Carregant...',
            fr: 'Chargement...',
            grammar: 'Recherche de la définition en cours...'
        });
        
        try {
            const response = await fetch(`/api/word/${encodeURIComponent(word)}/`);
            const data = await response.json();
            
            if (data.success) {
                console.log(`✅ Définition trouvée via API pour: "${word}"`);
                wordData = {
                    es: data.word.es || '',
                    it: data.word.it || '',
                    pt: data.word.pt || '',
                    ca: data.word.ca || '',
                    fr: data.word.fr || '',
                    grammar: data.word.grammar || data.word.definition?.grammar_note || ''
                };
                
                // Ajouter à translations pour éviter les futurs appels API
                translations[word] = wordData;
                console.log(`💾 Mot "${word}" ajouté au cache local`);
            } else {
                console.log(`❌ Mot "${word}" non trouvé en base de données`);
                wordData = {
                    es: `"${word}" non défini`,
                    it: `"${word}" non definito`,
                    pt: `"${word}" não definido`,
                    ca: `"${word}" no definit`,
                    fr: `"${word}" non défini`,
                    grammar: `Le mot "${word}" n'a pas été trouvé dans le dictionnaire.`
                };
            }
        } catch (error) {
            console.error(`❌ Erreur API pour "${word}":`, error);
            wordData = {
                es: 'Erreur de connexion',
                it: 'Errore di connessione',
                pt: 'Erro de conexão',
                ca: 'Error de connexió',
                fr: 'Erreur de connexion',
                grammar: 'Impossible de récupérer la définition. Vérifiez votre connexion.'
            };
        }
    }
    
    // Afficher la popup avec les données trouvées
    if (wordData) {
        showTranslationPopup(word, wordData);
    }
}

// Fonction helper pour afficher la popup
function showTranslationPopup(word, wordData) {
    console.log(`📋 showTranslationPopup appelée avec word="${word}", wordData=`, wordData);
    
    // Vérification de sécurité
    if (!word || typeof word !== 'string') {
        console.error('❌ Erreur: paramètre word invalide:', word);
        return;
    }
    
    if (!wordData) {
        console.error('❌ Erreur: wordData manquant pour le mot:', word);
        return;
    }
    
    popupWord.textContent = word.charAt(0).toUpperCase() + word.slice(1);
    
    // Set translations
    document.getElementById('trans-es').textContent = wordData.es || '';
    document.getElementById('trans-it').textContent = wordData.it || '';
    document.getElementById('trans-pt').textContent = wordData.pt || '';
    document.getElementById('trans-ca').textContent = wordData.ca || '';
    document.getElementById('trans-fr').textContent = wordData.fr || '';
    
    // Set grammar note
    document.getElementById('grammar-note-text').textContent = wordData.grammar || '';
    
    // Show popup with animation
    translationPopup.classList.add('active');
}

// Close translation popup
function closeTranslation() {
    translationPopup.classList.remove('active');
}

// Event listeners for popup
closeBtn.addEventListener('click', closeTranslation);
translationPopup.addEventListener('click', function(e) {
    if (e.target === translationPopup) {
        closeTranslation();
    }
});

// Daily language rotation functionality
function getDailyLanguage() {
    // Langues disponibles en rotation
    const languages = ['es', 'it', 'pt', 'ca', 'fr'];
    
    // Utiliser la date actuelle pour déterminer la langue du jour
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    // Rotation basée sur le jour de l'année
    const languageIndex = dayOfYear % languages.length;
    const currentLanguage = languages[languageIndex];
    
    console.log(`🌍 Langue du jour (${today.toLocaleDateString()}): ${currentLanguage}`);
    return currentLanguage;
}

// Obtenir le nom complet de la langue avec drapeau
function getLanguageDisplayName(languageCode) {
    const languageMap = {
        'es': '🇪🇸 Español',
        'it': '🇮🇹 Italiano', 
        'pt': '🇵🇹 Português',
        'ca': '🏴󠁥󠁳󠁣󠁴󠁿 Català',
        'fr': '🇫🇷 Français'
    };
    return languageMap[languageCode] || languageCode;
}

// Quiz functionality
function initializeQuiz() {
    const questions = document.querySelectorAll('.question');
    const options = document.querySelectorAll('.option');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const restartBtn = document.getElementById('restart-quiz');
    const questionCounter = document.querySelector('.question-counter');

    // Initialize quiz state
    showQuestion(0);
    updateQuestionCounter();

    // Option click handlers
    options.forEach(option => {
        option.addEventListener('click', function() {
            if (this.closest('.question').classList.contains('active')) {
                selectOption(this);
            }
        });
    });

    // Navigation button handlers
    prevBtn.addEventListener('click', () => {
        if (currentQuestion > 0) {
            currentQuestion--;
            showQuestion(currentQuestion);
            updateQuestionCounter();
            updateNavigationButtons();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentQuestion < quizData.length - 1) {
            currentQuestion++;
            showQuestion(currentQuestion);
            updateQuestionCounter();
            updateNavigationButtons();
        }
    });

    submitBtn.addEventListener('click', submitQuiz);
    restartBtn.addEventListener('click', restartQuiz);

    updateNavigationButtons();
}

function showQuestion(index) {
    const questions = document.querySelectorAll('.question');
    
    questions.forEach(question => question.classList.remove('active'));
    questions[index].classList.add('active');
}

function selectOption(selectedOption) {
    const questionElement = selectedOption.closest('.question');
    const options = questionElement.querySelectorAll('.option');
    
    // Remove selection from all options in this question
    options.forEach(option => option.classList.remove('selected'));
    
    // Select the clicked option
    selectedOption.classList.add('selected');
    
    // Store the answer
    const optionIndex = Array.from(options).indexOf(selectedOption);
    userAnswers[currentQuestion] = optionIndex;
    
    updateNavigationButtons();
}

function updateQuestionCounter() {
    const counter = document.querySelector('.question-counter');
    counter.textContent = `${currentQuestion + 1} / ${quizData.length}`;
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    // Update previous button
    prevBtn.disabled = currentQuestion === 0;
    
    // Update next/submit buttons
    if (currentQuestion === quizData.length - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-block';
    } else {
        nextBtn.style.display = 'inline-block';
        submitBtn.style.display = 'none';
    }
}

function submitQuiz() {
    // Calculate score
    score = 0;
    for (let i = 0; i < quizData.length; i++) {
        if (userAnswers[i] === quizData[i].correct) {
            score++;
        }
    }

    // Show results
    showQuizResults();
    
    // Add points and update streak
    const pointsEarned = score * 10; // 10 points per correct answer
    addPoints(pointsEarned);
    updateStreak();
    
    // Show correct/incorrect answers
    highlightAnswers();
}

function showQuizResults() {
    const quizContainer = document.querySelector('.quiz-container');
    const quizResults = document.getElementById('quiz-results');
    const scoreElement = document.getElementById('score');
    const pointsEarned = document.getElementById('points-earned');
    
    quizContainer.style.display = 'none';
    quizResults.style.display = 'block';
    
    scoreElement.textContent = score;
    pointsEarned.textContent = score * 10;
}

function highlightAnswers() {
    const questions = document.querySelectorAll('.question');
    
    questions.forEach((question, index) => {
        const options = question.querySelectorAll('.option');
        const correctIndex = quizData[index].correct;
        const userIndex = userAnswers[index];
        
        // Highlight correct answer
        options[correctIndex].classList.add('correct');
        
        // Highlight incorrect user answer (if different from correct)
        if (userIndex !== undefined && userIndex !== correctIndex) {
            options[userIndex].classList.add('incorrect');
        }
    });
}

function restartQuiz() {
    // Reset quiz state
    currentQuestion = 0;
    userAnswers = [];
    score = 0;
    
    // Reset UI
    const quizContainer = document.querySelector('.quiz-container');
    const quizResults = document.getElementById('quiz-results');
    const options = document.querySelectorAll('.option');
    
    quizContainer.style.display = 'block';
    quizResults.style.display = 'none';
    
    // Remove all selection and result classes
    options.forEach(option => {
        option.classList.remove('selected', 'correct', 'incorrect');
    });
    
    // Show first question
    showQuestion(0);
    updateQuestionCounter();
    updateNavigationButtons();
}

// Gamification functions
function addPoints(points) {
    currentPoints += points;
    updateProgress();
    
    // Show point animation
    showPointsAnimation(points);
}

function updateStreak() {
    // Simple streak logic - in a real app, this would be based on daily activity
    currentStreak++;
    updateProgress();
}

function updateProgress() {
    streakCount.textContent = currentStreak;
    pointsCount.textContent = currentPoints.toLocaleString();
}

function showPointsAnimation(points) {
    // Create a temporary element for points animation
    const pointsElement = document.createElement('div');
    pointsElement.textContent = `+${points} puntos!`;
    pointsElement.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #feca57, #ff9ff3);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 15px;
        font-weight: bold;
        z-index: 1001;
        animation: pointsFloat 2s ease-out forwards;
        pointer-events: none;
    `;
    
    // Add animation CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pointsFloat {
            0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 1; transform: translate(-50%, -60%) scale(1.2); }
            100% { opacity: 0; transform: translate(-50%, -80%) scale(0.8); }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(pointsElement);
    
    // Remove element after animation
    setTimeout(() => {
        document.body.removeChild(pointsElement);
        document.head.removeChild(style);
    }, 2000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Close popup with Escape
    if (e.key === 'Escape' && translationPopup.classList.contains('active')) {
        closeTranslation();
    }
    
    // Quiz navigation with arrow keys
    if (e.key === 'ArrowLeft' && currentQuestion > 0) {
        document.getElementById('prev-btn').click();
    }
    
    if (e.key === 'ArrowRight' && currentQuestion < quizData.length - 1) {
        document.getElementById('next-btn').click();
    }
});

// Add some interactive feedback (ripple effect désactivé pour éviter les erreurs)
document.addEventListener('click', function(e) {
    // Ripple effect temporairement désactivé
    console.debug('🔘 Clic détecté sur:', e.target.tagName, e.target.className);
});

// Fonction createRipple désactivée pour éviter les erreurs DOM
function createRipple(event) {
    // Fonction désactivée temporairement pour éviter HierarchyRequestError
    console.debug('🌊 Effet ripple désactivé');
    return;
}

// Add ripple CSS
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s linear;
        background-color: rgba(255, 255, 255, 0.3);
        pointer-events: none;
    }

    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// Saved Words Management
class SavedWordsManager {
    constructor() {
        this.savedWords = this.loadSavedWords();
        this.currentWord = null;
        this.initializeEventListeners();
        this.updateUI();
    }

    loadSavedWords() {
        try {
            const saved = localStorage.getItem('linguaromana_saved_words');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading saved words:', error);
            return [];
        }
    }

    saveSavedWords() {
        try {
            localStorage.setItem('linguaromana_saved_words', JSON.stringify(this.savedWords));
        } catch (error) {
            console.error('Error saving words:', error);
        }
    }

    saveWord(word, translations, grammar) {
        // Check if word is already saved
        const existingIndex = this.savedWords.findIndex(saved => saved.word === word);
        
        if (existingIndex !== -1) {
            return false; // Word already saved
        }

        const savedWord = {
            id: Date.now(),
            word: word,
            translations: translations,
            grammar: grammar,
            savedAt: new Date().toISOString(),
            language: this.detectLanguage(word, translations)
        };

        this.savedWords.unshift(savedWord); // Add at beginning
        this.saveSavedWords();
        this.updateUI();
        
        return true;
    }

    detectLanguage(word, translations) {
        // Try to detect the main language based on the word and translations
        // For now, we'll use Spanish as default since our current words are in Spanish
        return 'es';
    }

    removeWord(wordId) {
        this.savedWords = this.savedWords.filter(word => word.id !== wordId);
        this.saveSavedWords();
        this.updateUI();
    }

    clearAllWords() {
        if (confirm('Êtes-vous sûr de vouloir supprimer tous les mots sauvegardés ?')) {
            this.savedWords = [];
            this.saveSavedWords();
            this.updateUI();
        }
    }

    exportWords() {
        if (this.savedWords.length === 0) {
            alert('Aucun mot à exporter');
            return;
        }

        const dataStr = JSON.stringify(this.savedWords, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `linguaromana_mots_sauvegardes_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    getFilteredWords() {
        // Return all saved words - no more language filtering
        return this.savedWords;
    }

    initializeEventListeners() {
        // Save word button in popup
        document.getElementById('save-word-btn').addEventListener('click', () => {
            this.handleSaveCurrentWord();
        });

        // Saved words navigation
        document.getElementById('saved-words-btn').addEventListener('click', () => {
            this.showSavedWordsSection();
        });

        document.getElementById('home-btn').addEventListener('click', () => {
            this.showHomeSection();
        });

        // Controls
        document.getElementById('clear-all-words').addEventListener('click', () => {
            this.clearAllWords();
        });

        document.getElementById('export-words').addEventListener('click', () => {
            this.exportWords();
        });

        // Note: Language tabs removed - using simple word count display
    }

    handleSaveCurrentWord() {
        if (!this.currentWord) return;

        console.log(`💾 Tentative de sauvegarde du mot: "${this.currentWord}"`);
        
        // Récupérer les données directement depuis la popup affichée
        const wordData = this.getCurrentWordDataFromPopup();
        
        if (!wordData) {
            console.error('❌ Impossible de récupérer les données du mot depuis la popup');
            return;
        }
        
        console.log('📊 Données du mot récupérées:', wordData);

        const success = this.saveWord(
            this.currentWord,
            wordData.translations,
            wordData.grammar
        );

        const saveBtn = document.getElementById('save-word-btn');
        if (success) {
            saveBtn.innerHTML = '<i class="fas fa-check"></i> <span>Mot sauvegardé!</span>';
            saveBtn.classList.add('saved');
            saveBtn.disabled = true;
            
            // Show success animation
            this.showSaveSuccessAnimation();
        } else {
            saveBtn.innerHTML = '<i class="fas fa-bookmark"></i> <span>Déjà sauvegardé</span>';
            saveBtn.classList.add('saved');
            saveBtn.disabled = true;
        }
    }

    showSaveSuccessAnimation() {
        // Create floating animation
        const popup = document.getElementById('translation-popup');
        const successIcon = document.createElement('div');
        successIcon.innerHTML = '📚 +1';
        successIcon.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 2rem;
            font-weight: bold;
            color: #28a745;
            pointer-events: none;
            animation: saveSuccess 2s ease-out forwards;
            z-index: 1002;
        `;
        
        popup.appendChild(successIcon);
        
        setTimeout(() => {
            if (successIcon.parentNode) {
                successIcon.parentNode.removeChild(successIcon);
            }
        }, 2000);
    }

    getCurrentWordDataFromPopup() {
        try {
            // Récupérer les données actuellement affichées dans la popup
            const translations = {
                es: document.getElementById('trans-es')?.textContent || '',
                it: document.getElementById('trans-it')?.textContent || '',
                pt: document.getElementById('trans-pt')?.textContent || '',
                ca: document.getElementById('trans-ca')?.textContent || '',
                fr: document.getElementById('trans-fr')?.textContent || ''
            };
            
            const grammar = document.getElementById('grammar-note-text')?.textContent || '';
            
            console.log('📋 Données récupérées de la popup:', { translations, grammar });
            
            return {
                translations: translations,
                grammar: grammar
            };
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des données de la popup:', error);
            return null;
        }
    }

    setCurrentWord(word) {
        this.currentWord = word;
        
        // Update save button state
        const saveBtn = document.getElementById('save-word-btn');
        const isAlreadySaved = this.savedWords.some(saved => saved.word === word);
        
        if (isAlreadySaved) {
            saveBtn.innerHTML = '<i class="fas fa-bookmark"></i> <span>Déjà sauvegardé</span>';
            saveBtn.classList.add('saved');
            saveBtn.disabled = true;
        } else {
            saveBtn.innerHTML = '<i class="fas fa-bookmark"></i> <span>Sauvegarder ce mot</span>';
            saveBtn.classList.remove('saved');
            saveBtn.disabled = false;
        }
    }

    showSavedWordsSection() {
        document.querySelector('.article-section').style.display = 'none';
        document.querySelector('.grammar-section').style.display = 'none';
        document.querySelector('.quiz-section').style.display = 'none';
        document.getElementById('saved-words-section').style.display = 'block';
        document.getElementById('saved-words-btn').style.display = 'none';
        document.getElementById('home-btn').style.display = 'block';
        
        this.renderSavedWords();
    }

    showHomeSection() {
        document.querySelector('.article-section').style.display = 'block';
        document.querySelector('.grammar-section').style.display = 'block';
        document.querySelector('.quiz-section').style.display = 'block';
        document.getElementById('saved-words-section').style.display = 'none';
        document.getElementById('saved-words-btn').style.display = 'block';
        document.getElementById('home-btn').style.display = 'none';
        
        // S'assurer que le dernier article est chargé quand on revient à l'accueil
        ensureLatestArticleOnHome();
    }

    // setFilter method removed - no more language tabs

    renderSavedWords() {
        const container = document.getElementById('saved-words-content');
        const filteredWords = this.getFilteredWords();
        
        if (filteredWords.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bookmark-o"></i>
                    <h4>Aucun mot sauvegardé</h4>
                    <p>Cliquez sur les mots surlignés dans les articles pour les sauvegarder et créer votre dictionnaire personnel.</p>
                </div>
            `;
            return;
        }

        const wordsHTML = filteredWords.map(word => this.createWordCardHTML(word)).join('');
        
        container.innerHTML = `
            <div class="saved-words-grid">
                ${wordsHTML}
            </div>
        `;

        // Add event listeners for remove buttons
        container.querySelectorAll('.remove-word-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const wordId = parseInt(e.currentTarget.dataset.wordId);
                this.removeWord(wordId);
            });
        });
    }

    createWordCardHTML(wordData) {
        const date = new Date(wordData.savedAt).toLocaleDateString('fr-FR');
        const translations = wordData.translations;
        
        return `
            <div class="saved-word-card">
                <div class="saved-word-header">
                    <div>
                        <h4 class="saved-word-title">${wordData.word}</h4>
                        <div class="saved-word-date">Sauvegardé le ${date}</div>
                    </div>
                    <button class="remove-word-btn" data-word-id="${wordData.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="saved-translations">
                    <div class="saved-translation">
                        <div class="lang">Español</div>
                        <div class="text">${translations.es}</div>
                    </div>
                    <div class="saved-translation">
                        <div class="lang">Italiano</div>
                        <div class="text">${translations.it}</div>
                    </div>
                    <div class="saved-translation">
                        <div class="lang">Português</div>
                        <div class="text">${translations.pt}</div>
                    </div>
                    <div class="saved-translation">
                        <div class="lang">Català</div>
                        <div class="text">${translations.ca}</div>
                    </div>
                    <div class="saved-translation">
                        <div class="lang">Français</div>
                        <div class="text">${translations.fr}</div>
                    </div>
                </div>
                
                <div class="saved-grammar">
                    ${wordData.grammar}
                </div>
            </div>
        `;
    }

    updateUI() {
        // Update saved count badge
        document.getElementById('saved-count').textContent = this.savedWords.length;
        
        // Update language tab counts
        const languages = ['es', 'it', 'pt', 'ca', 'fr'];
        languages.forEach(lang => {
            const count = this.savedWords.filter(word => word.language === lang).length;
            const countElement = document.getElementById(`count-${lang}`);
            if (countElement) {
                countElement.textContent = count;
            }
        });
        
        document.getElementById('count-all').textContent = this.savedWords.length;
    }
}

// SavedWordsManager sera initialisé dans DOMContentLoaded

// Update the existing showTranslation function to set current word
const originalShowTranslation = window.showTranslation;
window.showTranslation = function(word) {
    originalShowTranslation(word);
    if (window.savedWordsManager) {
        savedWordsManager.setCurrentWord(word);
    }
};

// Add CSS animation for save success
const saveAnimationCSS = document.createElement('style');
saveAnimationCSS.textContent = `
    @keyframes saveSuccess {
        0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        50% { opacity: 1; transform: translate(-50%, -60%) scale(1.3); }
        100% { opacity: 0; transform: translate(-50%, -80%) scale(0.8); }
    }
`;
document.head.appendChild(saveAnimationCSS);

// Admin Management System
class AdminManager {
    constructor() {
        this.adminPassword = 'admin123'; // In production, this should be more secure
        this.isAuthenticated = false;
        this.currentTab = 'articles';
        this.customArticles = this.loadCustomArticles();
        this.customWords = this.loadCustomWords();
        this.currentEditingArticle = null;
        this.currentEditingWord = null;
        
        this.initializeEventListeners();
    }

    loadCustomArticles() {
        try {
            const saved = localStorage.getItem('linguaromana_custom_articles');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading custom articles:', error);
            return [];
        }
    }

    saveCustomArticles() {
        try {
            localStorage.setItem('linguaromana_custom_articles', JSON.stringify(this.customArticles));
        } catch (error) {
            console.error('Error saving custom articles:', error);
        }
    }

    loadCustomWords() {
        try {
            const saved = localStorage.getItem('linguaromana_custom_words');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Error loading custom words:', error);
            return {};
        }
    }

    saveCustomWords() {
        try {
            localStorage.setItem('linguaromana_custom_words', JSON.stringify(this.customWords));
            // Update global translations object with backward compatibility
            Object.keys(this.customWords).forEach(word => {
                const wordData = this.customWords[word];
                
                // Support both old format (direct es, it, pt, ca, fr) and new format (translations)
                if (wordData.translations) {
                    // New format with translations object
                    translations[word] = {
                        ...wordData.translations,
                        grammar: wordData.definition?.grammar_note || ''
                    };
                } else {
                    // Old format with direct language properties
                    translations[word] = {
                        es: wordData.es || '',
                        it: wordData.it || '',
                        pt: wordData.pt || '',
                        ca: wordData.ca || '',
                        fr: wordData.fr || '',
                        grammar: wordData.grammar || ''
                    };
                }
            });
            
            console.log('💾 Mots personnalisés sauvegardés:', this.customWords);
            console.log('🌍 Traductions globales mises à jour:', translations);
        } catch (error) {
            console.error('Error saving custom words:', error);
        }
    }

    initializeEventListeners() {
        // Admin button click
        document.getElementById('admin-btn').addEventListener('click', () => {
            this.showAdminSection();
        });

        // Authentication
        document.getElementById('admin-login-btn').addEventListener('click', () => {
            this.authenticate();
        });

        document.getElementById('admin-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.authenticate();
            }
        });

        // Logout
        document.getElementById('admin-logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Admin tabs
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.currentTarget.dataset.tab);
            });
        });

        // Article management
        document.getElementById('new-article-btn').addEventListener('click', () => {
            this.showArticleEditor();
        });

        document.getElementById('save-article-btn').addEventListener('click', async () => {
            await saveArticle();
        });

        document.getElementById('cancel-edit-btn').addEventListener('click', () => {
            this.hideArticleEditor();
        });

        // Word management  
        document.getElementById('new-word-btn').addEventListener('click', () => {
            this.showWordEditor();
        });

        document.getElementById('admin-save-word-btn').addEventListener('click', () => {
            this.saveWord();
        });

        document.getElementById('cancel-word-btn').addEventListener('click', () => {
            this.hideWordEditor();
        });

        // Content detection
        document.getElementById('article-content').addEventListener('input', () => {
            this.detectKeywords();
        });

        // Quiz management sera initialisé dans showArticleEditor()

        // Search and filters
        document.getElementById('word-search').addEventListener('input', () => {
            this.filterWords();
        });

        document.getElementById('word-lang-filter').addEventListener('change', () => {
            this.filterWords();
        });

        // Settings
        document.getElementById('change-password-btn').addEventListener('click', () => {
            this.changePassword();
        });

        document.getElementById('export-all-btn').addEventListener('click', () => {
            this.exportAllData();
        });

        document.getElementById('import-data-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importData(e);
        });

        document.getElementById('reset-all-btn').addEventListener('click', () => {
            this.resetAllData();
        });
    }

    showAdminSection() {
        // Hide other sections
        document.querySelector('.article-section').style.display = 'none';
        document.querySelector('.grammar-section').style.display = 'none';
        document.querySelector('.quiz-section').style.display = 'none';
        document.getElementById('saved-words-section').style.display = 'none';
        
        // Show admin section
        document.getElementById('admin-section').style.display = 'block';
        document.getElementById('admin-btn').style.display = 'none';
        document.getElementById('saved-words-btn').style.display = 'none';
        document.getElementById('home-btn').style.display = 'block';

        // Show appropriate admin view
        if (this.isAuthenticated) {
            document.getElementById('admin-auth').style.display = 'none';
            document.getElementById('admin-dashboard').style.display = 'block';
            this.renderDashboard();
        } else {
            document.getElementById('admin-auth').style.display = 'block';
            document.getElementById('admin-dashboard').style.display = 'none';
        }
    }

    authenticate() {
        const password = document.getElementById('admin-password').value;
        const errorDiv = document.getElementById('auth-error');

        if (password === this.adminPassword) {
            this.isAuthenticated = true;
            document.getElementById('admin-auth').style.display = 'none';
            document.getElementById('admin-dashboard').style.display = 'block';
            errorDiv.style.display = 'none';
            this.renderDashboard();
        } else {
            errorDiv.style.display = 'block';
            document.getElementById('admin-password').value = '';
        }
    }

    logout() {
        this.isAuthenticated = false;
        document.getElementById('admin-password').value = '';
        this.showAdminSection();
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update active tab
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Show/hide tab content
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById(`tab-${tabName}`).style.display = 'block';

        // Render content based on tab
        switch(tabName) {
            case 'articles':
                this.renderArticles().catch(err => console.error('Erreur renderArticles:', err));
                break;
            case 'words':
                this.renderWords();
                break;
            case 'settings':
                this.renderSettings();
                break;
        }
    }

    renderDashboard() {
        this.switchTab(this.currentTab);
    }

    // Article Management
    showArticleEditor(article = null) {
        console.log('📝 showArticleEditor() - Ouverture de l\'éditeur d\'article');
        
        this.currentEditingArticle = article;
        const editor = document.getElementById('article-editor');
        const title = document.getElementById('editor-title');
        
        if (article) {
            console.log('✏️ Mode édition - Chargement de l\'article existant');
            title.textContent = '✏️ Modifier Article';
            document.getElementById('article-title').value = article.title;
            document.getElementById('article-date').value = article.date;
            document.getElementById('article-content').value = article.content;
            document.getElementById('article-summary').value = article.summary || '';
            document.getElementById('article-language').value = article.language || 'es';
            document.getElementById('article-level').value = article.level || 'intermediate';
        } else {
            console.log('✍️ Mode création - Initialisation d\'un nouvel article');
            title.textContent = '✍️ Nouvel Article';
            
            // Réinitialiser tous les champs explicitement
            const titleField = document.getElementById('article-title');
            const dateField = document.getElementById('article-date');
            const contentField = document.getElementById('article-content');
            const summaryField = document.getElementById('article-summary');
            const languageField = document.getElementById('article-language');
            const levelField = document.getElementById('article-level');
            
            // Vérifier que tous les éléments existent avant de les modifier
            if (!titleField || !dateField || !contentField || !summaryField || !languageField || !levelField) {
                console.error('❌ Éléments du formulaire manquants lors de l\'initialisation!');
                return;
            }
            
            titleField.value = '';
            dateField.value = new Date().toISOString().split('T')[0];
            contentField.value = '';
            summaryField.value = '';
            
            // Forcer la sélection de langue et niveau avec une vérification
            languageField.value = 'es';
            levelField.value = 'intermediate';
            
            // Nettoyer les questions de quiz pour un nouvel article
            clearQuizQuestions();
            
            // Vérification que les valeurs ont bien été définies
            setTimeout(() => {
                console.log('🔍 Vérification des valeurs par défaut après initialisation:', {
                    title: `"${titleField.value}"`,
                    date: `"${dateField.value}"`,
                    content: `"${contentField.value}"`,
                    language: `"${languageField.value}"`,
                    level: `"${levelField.value}"`
                });
                
                // Si la langue n'est toujours pas définie, forcer la première option
                if (!languageField.value) {
                    languageField.selectedIndex = 0; // Sélectionner la première option (es)
                    console.warn('⚠️ Langue forcée via selectedIndex');
                }
            }, 50);
        }

        editor.style.display = 'block';
        document.getElementById('articles-list').style.display = 'none';
        
        // Forcer la vérification de l'intégrité du formulaire après un délai
        setTimeout(() => {
            if (window.archiveManager && typeof archiveManager.ensureFormIntegrity === 'function') {
                archiveManager.ensureFormIntegrity();
            }
            this.detectKeywords();
        }, 100);
        
        // Initialiser l'event listener pour le bouton "Ajouter Question" (seulement si pas déjà fait)
        const addQuizBtn = document.getElementById('add-quiz-question');
        if (addQuizBtn && !addQuizBtn.hasAttribute('data-listener-added')) {
            addQuizBtn.addEventListener('click', () => {
                console.log('🔘 Clic sur Ajouter Question');
                addQuizQuestion();
            });
            addQuizBtn.setAttribute('data-listener-added', 'true');
            console.log('✅ Event listener pour bouton "Ajouter Question" initialisé');
        }
        
        console.log('✅ Éditeur d\'article ouvert');
    }

    hideArticleEditor() {
        document.getElementById('article-editor').style.display = 'none';
        document.getElementById('articles-list').style.display = 'block';
        this.currentEditingArticle = null;
        
        // Nettoyer les questions de quiz
        clearQuizQuestions();
    }

    detectKeywords() {
        const content = document.getElementById('article-content').value;
        const keywordRegex = /\[([^\]]+)\]/g;
        const keywords = [];
        let match;

        while ((match = keywordRegex.exec(content)) !== null) {
            keywords.push(match[1]);
        }

        const container = document.getElementById('detected-keywords');
        
        if (keywords.length === 0) {
            container.innerHTML = '<p class="no-keywords">Aucun mot-clé détecté. Utilisez [mot-clé] dans le contenu.</p>';
        } else {
            const uniqueKeywords = [...new Set(keywords)];
            container.innerHTML = uniqueKeywords.map(keyword => {
                const hasTranslation = translations[keyword] || this.customWords[keyword];
                const chipClass = hasTranslation ? 'keyword-chip' : 'keyword-chip missing';
                return `<span class="${chipClass}" onclick="editKeyword('${keyword}')">${keyword}</span>`;
            }).join('');
        }
    }

    editKeyword(keyword) {
        const existing = translations[keyword] || this.customWords[keyword];
        if (existing) {
            this.showWordEditor(keyword, existing);
            this.switchTab('words');
        } else {
            if (confirm(`Le mot "${keyword}" n'a pas de traduction. Voulez-vous l'ajouter maintenant ?`)) {
                this.showWordEditor(keyword);
                this.switchTab('words');
            }
        }
    }



    extractKeywordsFromContent(content) {
        const matches = content.match(/\[([^\]]+)\]/g);
        return matches ? matches.map(match => match.slice(1, -1)) : [];
    }

    async renderArticles() {
        const grid = document.getElementById('articles-grid');
        console.log('📋 Chargement des articles pour la gestion admin...');
        
        // Charger les articles depuis l'API ET les articles locaux
        let allArticles = [...this.customArticles]; // Articles locaux (localStorage)
        
        // Tenter de charger les articles de la base de données
        try {
            const response = await fetch('/api/articles/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                },
                credentials: 'same-origin'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.articles) {
                    console.log(`📡 ${data.articles.length} articles chargés depuis l'API`);
                    
                    // Marquer les articles API et les ajouter
                    const apiArticles = data.articles.map(article => ({
                        ...article,
                        id: article.id,
                        date: article.publication_date || article.date,
                        isFromAPI: true, // Marquer comme venant de l'API
                        status: 'Publié'
                    }));
                    
                    allArticles = [...apiArticles, ...allArticles];
                }
            }
        } catch (error) {
            console.log('⚠️ Impossible de charger les articles API, affichage des articles locaux seulement');
        }
        
        if (allArticles.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 2rem;">Aucun article trouvé.</p>';
            return;
        }
        
        console.log(`📊 Total articles à afficher: ${allArticles.length} (API + localStorage)`);
        
        const languageNames = {
            'es': 'Español',
            'it': 'Italiano', 
            'pt': 'Português',
            'ca': 'Català',
            'fr': 'Français'
        };

        const articlesHTML = allArticles.map(article => {
            const date = new Date(article.date).toLocaleDateString('fr-FR');
            const preview = article.content.substring(0, 150) + '...';
            const languageName = languageNames[article.language] || 'Español';
            const levelNames = {
                'beginner': 'Débutant',
                'intermediate': 'Intermédiaire',
                'advanced': 'Avancé'
            };
            const levelName = levelNames[article.level] || 'Intermédiaire';
            
            return `
                <div class="admin-item-card">
                    <div class="admin-item-header">
                        <h6 class="admin-item-title">${article.title}</h6>
                        <div class="admin-item-actions">
                            ${article.isFromAPI ? `
                                <button class="admin-action-btn edit-btn" onclick="editApiArticle(${article.id})">
                                    <i class="fas fa-edit"></i>
                                    Modifier (BD)
                                </button>
                                <button class="admin-action-btn publish-btn" onclick="useApiArticle(${article.id})">
                                    <i class="fas fa-eye"></i>
                                    Utiliser
                                </button>
                                <button class="admin-action-btn delete-btn" onclick="deleteApiArticle(${article.id})" style="opacity: 0.5;" title="Suppression depuis l'interface de développement uniquement">
                                    <i class="fas fa-trash"></i>
                                    Suppr. BD
                                </button>
                            ` : `
                                <button class="admin-action-btn edit-btn" onclick="editArticle(${article.id})">
                                    <i class="fas fa-edit"></i>
                                    Modifier (Local)
                                </button>
                                <button class="admin-action-btn publish-btn" onclick="useArticle(${article.id})">
                                    <i class="fas fa-eye"></i>
                                    Utiliser
                                </button>
                                <button class="admin-action-btn delete-btn" onclick="deleteArticle(${article.id})">
                                    <i class="fas fa-trash"></i>
                                    Supprimer
                                </button>
                            `}
                        </div>
                    </div>
                    <div class="admin-item-meta">
                        Créé le ${date} • ${languageName} • ${levelName} • ${article.status}
                    </div>
                    <div class="admin-item-content">
                        ${preview}
                    </div>
                </div>
            `;
        }).join('');

        grid.innerHTML = articlesHTML;
    }



    generateQuizFromArticle(article) {
        // Extract keywords for quiz generation
        const keywordRegex = /\[([^\]]+)\]/g;
        const keywords = [];
        let match;

        while ((match = keywordRegex.exec(article.content)) !== null) {
            if (translations[match[1]] || this.customWords[match[1]]) {
                keywords.push(match[1]);
            }
        }

        // This is a simplified quiz generation - in a real app you'd want more sophisticated logic
        if (keywords.length >= 3) {
            console.log('Generated quiz keywords:', keywords.slice(0, 3));
        }
    }

    // Word Management
    showWordEditor(word = null, wordData = null) {
        this.currentEditingWord = word;
        const editor = document.getElementById('word-editor');
        const title = document.getElementById('word-editor-title');
        
        if (word && wordData) {
            title.textContent = '✏️ Modifier Mot';
            document.getElementById('word-key').value = word;
            document.getElementById('trans-input-es').value = wordData.es || '';
            document.getElementById('trans-input-it').value = wordData.it || '';
            document.getElementById('trans-input-pt').value = wordData.pt || '';
            document.getElementById('trans-input-ca').value = wordData.ca || '';
            document.getElementById('trans-input-fr').value = wordData.fr || '';
            document.getElementById('word-grammar').value = wordData.grammar || '';
        } else if (word) {
            title.textContent = `➕ Ajouter "${word}"`;
            document.getElementById('word-key').value = word;
            // Clear other fields
            document.getElementById('trans-input-es').value = '';
            document.getElementById('trans-input-it').value = '';
            document.getElementById('trans-input-pt').value = '';
            document.getElementById('trans-input-ca').value = '';
            document.getElementById('trans-input-fr').value = '';
            document.getElementById('word-grammar').value = '';
        } else {
            title.textContent = '➕ Nouveau Mot';
            // Clear all fields
            document.getElementById('word-key').value = '';
            document.getElementById('trans-input-es').value = '';
            document.getElementById('trans-input-it').value = '';
            document.getElementById('trans-input-pt').value = '';
            document.getElementById('trans-input-ca').value = '';
            document.getElementById('trans-input-fr').value = '';
            document.getElementById('word-grammar').value = '';
        }

        editor.style.display = 'block';
        document.getElementById('words-list').style.display = 'none';
    }

    hideWordEditor() {
        document.getElementById('word-editor').style.display = 'none';
        document.getElementById('words-list').style.display = 'block';
        this.currentEditingWord = null;
    }

    saveWord() {
        console.log('💾 saveWord() appelée');
        
        const word = document.getElementById('word-key').value.trim();
        const es = document.getElementById('trans-input-es').value.trim();
        const it = document.getElementById('trans-input-it').value.trim();
        const pt = document.getElementById('trans-input-pt').value.trim();
        const ca = document.getElementById('trans-input-ca').value.trim();
        const fr = document.getElementById('trans-input-fr').value.trim();
        const grammar = document.getElementById('word-grammar').value.trim();
        
        console.log('📝 Données du formulaire:', { word, es, it, pt, ca, fr, grammar });

        if (!word) {
            alert('Le mot-clé est obligatoire');
            return;
        }

        if (!es && !it && !pt && !ca && !fr) {
            alert('Au moins une traduction est requise');
            return;
        }

        const wordData = {
            es: es || '',
            it: it || '',
            pt: pt || '',
            ca: ca || '',
            fr: fr || '',
            grammar: grammar || ''
        };

        console.log('💿 Données à sauvegarder:', wordData);
        
        this.customWords[word] = wordData;
        console.log('📚 Mots personnalisés après ajout:', this.customWords);
        
        this.saveCustomWords();
        this.hideWordEditor();
        this.renderWords();
        showMessage('Mot sauvegardé avec succès !', 'success');
    }

    renderWords() {
        const grid = document.getElementById('words-grid');
        const allWords = {...translations, ...this.customWords};
        const wordsArray = Object.entries(allWords);
        
        if (wordsArray.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 2rem;">Aucun mot dans le dictionnaire.</p>';
            return;
        }

        const wordsHTML = wordsArray.map(([word, data]) => {
            const isCustom = this.customWords[word] !== undefined;
            const languages = Object.entries(data)
                .filter(([key, value]) => key !== 'grammar' && value)
                .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
                .join(' • ');
            
            return `
                <div class="admin-item-card">
                    <div class="admin-item-header">
                        <h6 class="admin-item-title">
                            ${word}
                            ${isCustom ? '<span style="color: #007bff; font-size: 0.7rem;">(CUSTOM)</span>' : ''}
                        </h6>
                        <div class="admin-item-actions">
                            <button class="admin-action-btn edit-btn" onclick="editWord('${word}')">
                                <i class="fas fa-edit"></i>
                                Modifier
                            </button>
                            ${isCustom ? `
                                <button class="admin-action-btn delete-btn" onclick="deleteWord('${word}')">
                                    <i class="fas fa-trash"></i>
                                    Supprimer
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="admin-item-content" style="font-size: 0.8rem;">
                        ${languages}
                    </div>
                    ${data.grammar ? `<div class="admin-item-meta">${data.grammar}</div>` : ''}
                </div>
            `;
        }).join('');

        grid.innerHTML = wordsHTML;
    }


    filterWords() {
        // This would implement search and filter functionality
        // For now, just re-render
        this.renderWords();
    }

    // Settings
    renderSettings() {
        // Settings are already in HTML, just update if needed
    }

    changePassword() {
        const newPassword = document.getElementById('new-password').value;
        if (newPassword && newPassword.length >= 6) {
            this.adminPassword = newPassword;
            localStorage.setItem('linguaromana_admin_password', newPassword);
            document.getElementById('new-password').value = '';
            showMessage('Mot de passe changé avec succès !', 'success');
        } else {
            showMessage('Le mot de passe doit contenir au moins 6 caractères', 'error');
        }
    }

    exportAllData() {
        const data = {
            articles: this.customArticles,
            words: this.customWords,
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `linguaromana_admin_export_${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        showMessage('Données exportées avec succès !', 'success');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.articles) {
                    this.customArticles = [...this.customArticles, ...data.articles];
                    this.saveCustomArticles();
                }
                
                if (data.words) {
                    Object.assign(this.customWords, data.words);
                    this.saveCustomWords();
                }

                this.renderDashboard();
                showMessage('Données importées avec succès !', 'success');
            } catch (error) {
                showMessage('Erreur lors de l\'importation des données', 'error');
            }
        };
        reader.readAsText(file);
    }

    resetAllData() {
        if (confirm('⚠️ ATTENTION: Cette action supprimera TOUTES les données personnalisées (articles et mots). Cette action est irréversible. Continuer ?')) {
            this.customArticles = [];
            this.customWords = {};
            this.saveCustomArticles();
            this.saveCustomWords();
            this.renderDashboard();
            showMessage('Toutes les données ont été réinitialisées', 'warning');
        }
    }


    // FONCTION DE DIAGNOSTIC POUR DÉBOGAGE ADMIN
    diagnoseAdminForm() {
        console.log('🔧 === DIAGNOSTIC FORMULAIRE ADMIN ===');
        
        // Vérifier que la section admin est visible
        const adminSection = document.querySelector('.admin-section');
        const articleEditor = document.getElementById('article-editor');
        
        console.log('📋 Visibilité des sections:', {
            adminSection: adminSection ? (adminSection.style.display !== 'none') : 'INTROUVABLE',
            articleEditor: articleEditor ? (articleEditor.style.display !== 'none') : 'INTROUVABLE'
        });
        
        // Vérifier les éléments du formulaire
        const elements = {
            title: document.getElementById('article-title'),
            content: document.getElementById('article-content'),
            language: document.getElementById('article-language'),
            level: document.getElementById('article-level'),
            date: document.getElementById('article-date'),
            summary: document.getElementById('article-summary')
        };
        
        console.log('🔍 Éléments du formulaire:');
        Object.entries(elements).forEach(([key, element]) => {
            if (element) {
                console.log(`  ✅ ${key}: trouvé, valeur="${element.value}", visible=${element.offsetParent !== null}`);
            } else {
                console.error(`  ❌ ${key}: INTROUVABLE`);
            }
        });
        
        // Tester la validation avec les valeurs actuelles
        if (elements.title && elements.content && elements.language) {
            const title = elements.title.value.trim();
            const content = elements.content.value.trim();
            const language = elements.language.value;
            
            console.log('📝 Validation avec valeurs actuelles:', {
                title: `"${title}" (valide: ${title.length > 0})`,
                content: `"${content.substring(0, 30)}..." (valide: ${content.length > 0})`,
                language: `"${language}" (valide: ${language.length > 0})`
            });
            
            const wouldPass = title.length > 0 && content.length > 0 && language.length > 0;
            console.log(`🎯 Validation passerait: ${wouldPass}`);
            
            if (!wouldPass) {
                console.warn('⚠️ La validation échouerait avec ces valeurs!');
            }
        } else {
            console.error('❌ Impossible de tester la validation: éléments manquants');
        }
        
        console.log('🔧 === FIN DIAGNOSTIC ===');
        
        // Retourner les informations pour utilisation
        return {
            elementsFound: Object.values(elements).filter(el => el !== null).length,
            totalElements: Object.keys(elements).length,
            elements: elements
        };
    }
}

// Archive Management System
class ArchiveManager {
    constructor() {
        this.currentLevelFilter = 'all';
        this.currentLanguageFilter = 'all';
        this.currentSort = 'newest';
        this.searchTerm = '';
        
        this.initializeEventListeners();
        this.updateStats(); // Note: Appel async sans await car dans renderDashboard
    }

    initializeEventListeners() {
        // Archive navigation
        document.getElementById('archive-btn').addEventListener('click', () => {
            this.showArchiveSection();
        });

        // Archive controls
        document.getElementById('archive-level-filter').addEventListener('change', (e) => {
            this.setLevelFilter(e.target.value);
        });

        document.getElementById('archive-language-filter').addEventListener('change', (e) => {
            this.setLanguageFilter(e.target.value);
        });

        document.getElementById('archive-sort').addEventListener('change', (e) => {
            this.setSort(e.target.value);
        });

        // Search functionality
        document.getElementById('archive-search-btn').addEventListener('click', () => {
            this.toggleSearch();
        });

        document.getElementById('clear-search-btn').addEventListener('click', () => {
            this.clearSearch();
        });

        document.getElementById('archive-search-input').addEventListener('input', (e) => {
            this.setSearchTerm(e.target.value);
        });
    }

    showArchiveSection() {
        // Hide other sections
        document.querySelector('.article-section').style.display = 'none';
        document.querySelector('.grammar-section').style.display = 'none';
        document.querySelector('.quiz-section').style.display = 'none';
        document.getElementById('saved-words-section').style.display = 'none';
        document.getElementById('admin-section').style.display = 'none';
        
        // Show archive section
        document.getElementById('archive-section').style.display = 'block';
        
        // Update navigation buttons
        document.getElementById('archive-btn').style.display = 'none';
        document.getElementById('saved-words-btn').style.display = 'none';
        document.getElementById('admin-btn').style.display = 'none';
        document.getElementById('home-btn').style.display = 'block';
        
        this.renderArchive(); // Note: Appel async sans await car dans showArchiveSection
    }

    showHomeSection() {
        // Show main sections
        document.querySelector('.article-section').style.display = 'block';
        document.querySelector('.grammar-section').style.display = 'block';
        document.querySelector('.quiz-section').style.display = 'block';
        
        // Hide other sections
        document.getElementById('archive-section').style.display = 'none';
        document.getElementById('saved-words-section').style.display = 'none';
        document.getElementById('admin-section').style.display = 'none';
        
        // Update navigation buttons
        document.getElementById('archive-btn').style.display = 'block';
        document.getElementById('saved-words-btn').style.display = 'block';
        document.getElementById('admin-btn').style.display = 'block';
        document.getElementById('home-btn').style.display = 'none';

        // Load the most recent article on home
        this.loadLatestArticle();
    }

    async setLevelFilter(level) {
        this.currentLevelFilter = level;
        await this.renderArchive();
    }

    async setLanguageFilter(language) {
        this.currentLanguageFilter = language;
        await this.renderArchive();
    }

    async setSort(sort) {
        this.currentSort = sort;
        await this.renderArchive();
    }

    toggleSearch() {
        const searchBox = document.getElementById('archive-search-box');
        const isVisible = searchBox.style.display !== 'none';
        
        if (isVisible) {
            searchBox.style.display = 'none';
        } else {
            searchBox.style.display = 'block';
            document.getElementById('archive-search-input').focus();
        }
    }

    clearSearch() {
        document.getElementById('archive-search-input').value = '';
        this.setSearchTerm('');
        this.toggleSearch();
    }

    async setSearchTerm(term) {
        this.searchTerm = term.toLowerCase();
        await this.renderArchive();
    }

    async getAllArticles() {
        console.log('🔍 getAllArticles - Récupération depuis la base de données...');
        
        try {
            // Appeler l'API Django pour récupérer tous les articles
            const response = await apiCall('/api/articles/', {
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
            console.log('📡 Articles API reçus:', data);

            if (data.success && data.articles) {
                console.log(`✅ ${data.articles.length} articles récupérés depuis la base`);
                return data.articles;
            } else {
                console.log('📭 Aucun article disponible en base, fallback localStorage');
                return this.getAllArticlesFromLocalStorage();
            }

        } catch (error) {
            console.error('❌ Erreur lors de la récupération des articles:', error);
            console.log('🔄 Fallback vers localStorage...');
            return this.getAllArticlesFromLocalStorage();
        }
    }

    getAllArticlesFromLocalStorage() {
        // Utiliser uniquement les articles stockés via l'AdminManager (fallback)
        const articles = adminManager.customArticles || [];
        
        console.log('📦 getAllArticles - Articles localStorage:', articles);
        
        const processedArticles = articles.map(article => ({
            id: article.id,
            title: article.title,
            content: article.content,
            language: article.language || 'es',
            level: article.level || 'intermediate',
            publication_date: article.date,
            date: article.date, // Compatibilité
            is_active: true,
            keywords: article.keywords || this.extractKeywords(article.content),
            summary: article.summary || '',
            created_at: article.createdAt || new Date().toISOString(),
            updated_at: article.updatedAt || new Date().toISOString()
        }));
        
        console.log('🔍 getAllArticles - Articles localStorage traités:', processedArticles);
        
        return processedArticles;
    }

    async getFilteredAndSortedArticles() {
        let articles = await this.getAllArticles();
        
        // Apply level filter
        if (this.currentLevelFilter !== 'all') {
            articles = articles.filter(article => 
                (article.level || 'intermediate') === this.currentLevelFilter
            );
        }
        
        // Apply language filter
        if (this.currentLanguageFilter !== 'all') {
            articles = articles.filter(article => 
                (article.language || 'es') === this.currentLanguageFilter
            );
        }
        
        // Apply search
        if (this.searchTerm) {
            articles = articles.filter(article => 
                article.title.toLowerCase().includes(this.searchTerm) ||
                article.content.toLowerCase().includes(this.searchTerm) ||
                (article.summary && article.summary.toLowerCase().includes(this.searchTerm))
            );
        }
        
        // Apply sort
        articles.sort((a, b) => {
            switch (this.currentSort) {
                case 'newest':
                    return new Date(b.date) - new Date(a.date);
                case 'oldest':
                    return new Date(a.date) - new Date(b.date);
                case 'title':
                    return a.title.localeCompare(b.title);
                default:
                    return 0;
            }
        });
        
        return articles;
    }

    async loadLatestArticle() {
        console.log('🔄 Chargement du dernier article avec quiz depuis la base de données...');
        
        try {
            // Appeler l'API Django pour récupérer le dernier article complet (avec article, quiz et notes de grammaire)
            const response = await apiCall('/api/latest-comprehensive-article/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin'  // Inclure les cookies de session
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📡 Réponse API reçue:', data);

            if (data.success && data.comprehensive_article) {
                const comprehensiveArticle = data.comprehensive_article;
                const article = comprehensiveArticle.article;
                const quiz = comprehensiveArticle.quiz;
                const grammarNote = comprehensiveArticle.grammar_note;
                
                console.log('📰 Dernier article complet trouvé en base:', {
                    comprehensive_id: comprehensiveArticle.id,
                    article_id: article.id,
                    title: article.title,
                    publication_date: article.publication_date,
                    language: article.language,
                    level: article.level,
                    keywords_count: comprehensiveArticle.keywords ? comprehensiveArticle.keywords.length : 0,
                    quiz_count: quiz.questions ? quiz.questions.length : 0,
                    quiz_title: quiz.title,
                    grammar_title: grammarNote.title,
                    is_complete: data.debug_info ? data.debug_info.is_complete : false
                });
                
                // Stocker les quiz questions avec définitions pour l'interface
                if (quiz.questions && quiz.questions.length > 0) {
                    window.currentArticleQuiz = quiz.questions;
                    console.log('🧠 Quiz avec définitions chargés:', quiz.questions.length);
                }
                
                // Stocker les notes de grammaire pour affichage
                if (grammarNote) {
                    window.currentGrammarNote = grammarNote;
                    console.log('📝 Notes de grammaire chargées:', grammarNote.title);
                }
                
                // Créer un objet article compatible avec l'interface existante
                const articleForDisplay = {
                    ...comprehensiveArticle, // Include all comprehensive data
                    id: article.id,
                    title: article.title,
                    content: article.content,
                    language: article.language,
                    level: article.level,
                    publication_date: article.publication_date,
                    date: article.publication_date,
                    is_active: article.is_active,
                    summary: article.summary,
                    tags: article.tags,
                    author: article.author,
                    quiz_questions: quiz.questions || [],
                    keywords: comprehensiveArticle.keywords || [],
                    keywords_details: comprehensiveArticle.keywords_details || [],
                    // Add comprehensive-specific data
                    quiz_data: quiz,
                    grammar_note_data: grammarNote
                };
                
                // Charger l'article depuis la base de données
                loadArticleIntoMain(articleForDisplay);
                console.log('✅ Dernier article complet chargé avec succès');
                
                return articleForDisplay;
            } else {
                console.log('📭 Aucun article disponible en base de données');
                console.log('🔄 Fallback vers localStorage...');
                
                // Fallback vers localStorage si pas d'article en base
                this.loadLatestArticleFromLocalStorage();
                return null;
            }

        } catch (error) {
            console.error('❌ Erreur lors de l\'appel API:', error);
            console.log('🔄 Fallback vers localStorage après erreur API...');
            
            // Fallback vers localStorage en cas d'erreur
            this.loadLatestArticleFromLocalStorage();
            return null;
        }
    }

    // Fonction de fallback utilisant localStorage (ancien comportement)
    loadLatestArticleFromLocalStorage() {
        console.log('📦 Chargement depuis localStorage (fallback)');
        const articles = this.getAllArticlesFromLocalStorage();
        
        if (articles.length === 0) {
            console.log('📭 Aucun article disponible en localStorage');
            this.showWelcomeMessage();
            return;
        }
        
        // Trier par date décroissante et prendre uniquement le premier (le plus récent)
        const latest = articles.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        
        console.log('📰 Dernier article localStorage trouvé:', {
            title: latest.title,
            date: latest.date,
            language: latest.language,
            level: latest.level
        });
        
        // Charger uniquement le dernier article
        loadArticleIntoMain(latest);
        console.log('✅ Dernier article localStorage chargé avec succès');
    }

    showWelcomeMessage() {
        console.log('👋 Affichage du message de bienvenue - aucun article disponible');
        
        // Mettre à jour les éléments de la page d'accueil
        const mainTitle = document.getElementById('article-main-title');
        const articleMeta = document.getElementById('article-meta');
        const articleContent = document.querySelector('.article-content p');
        
        if (mainTitle) {
            mainTitle.textContent = '👋 Bienvenue sur LinguaRomana';
        }
        
        if (articleMeta) {
            articleMeta.textContent = 'Plateforme d\'apprentissage des langues romanes';
        }
        
        if (articleContent) {
            articleContent.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <h3>🌟 Bienvenue !</h3>
                    <p>Aucun article n'est encore disponible.</p>
                    <p>Utilisez l'interface <strong>Admin</strong> pour créer votre premier article d'apprentissage.</p>
                    <p>📚 Une fois publié, le dernier article apparaîtra automatiquement ici à chaque connexion.</p>
                </div>
            `;
        }
    }


    // FONCTION DE RÉPARATION POUR LE FORMULAIRE ADMIN
    ensureFormIntegrity() {
        console.log('🔧 ensureFormIntegrity() - Vérification et réparation du formulaire');
        
        const languageElement = document.getElementById('article-language');
        if (languageElement) {
            // Si aucune valeur n'est sélectionnée, forcer la première option valide
            if (!languageElement.value || languageElement.value === '') {
                console.warn('⚠️ Langue non sélectionnée, force la valeur par défaut');
                languageElement.value = 'es';
                
                // Si ça ne marche toujours pas, utiliser selectedIndex
                if (!languageElement.value || languageElement.value === '') {
                    languageElement.selectedIndex = 1; // Index 1 car index 0 est l'option disabled
                    console.warn('⚠️ Langue forcée via selectedIndex');
                }
            }
        }
        
        const levelElement = document.getElementById('article-level');
        if (levelElement && (!levelElement.value || levelElement.value === '')) {
            levelElement.value = 'intermediate';
        }
        
        const dateElement = document.getElementById('article-date');
        if (dateElement && (!dateElement.value || dateElement.value === '')) {
            dateElement.value = new Date().toISOString().split('T')[0];
        }
        
        console.log('✅ Intégrité du formulaire vérifiée');
    }

    async renderArchive() {
        const articles = await this.getFilteredAndSortedArticles();
        const grid = document.getElementById('archive-grid');
        const emptyState = document.getElementById('empty-archive');
        
        if (articles.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        grid.style.display = 'grid';
        emptyState.style.display = 'none';
        
        const articlesHTML = articles.map(article => this.createArticleCardHTML(article)).join('');
        grid.innerHTML = articlesHTML;
        
        await this.updateStats();
    }

    createArticleCardHTML(article) {
        const date = new Date(article.date).toLocaleDateString('fr-FR');
        const preview = this.stripBrackets(article.content).substring(0, 120) + '...';
        const keywords = article.keywords || this.extractKeywords(article.content);
        const keywordsHTML = keywords.slice(0, 5).map(keyword => 
            `<span class="archive-keyword">${keyword}</span>`
        ).join('');
        
        const featuredBadge = article.isFeatured ? 
            '<div class="featured-badge"><i class="fas fa-star"></i> Vedette</div>' : '';
        
        // Obtenir le nom de la langue
        const languageNames = {
            'es': 'Español',
            'it': 'Italiano', 
            'pt': 'Português',
            'ca': 'Català',
            'fr': 'Français'
        };
        const languageName = languageNames[article.language] || 'Español';
        
        return `
            <div class="archive-article-card" data-article-id="${article.id}">
                ${featuredBadge}
                <div class="archive-article-header">
                    <h4 class="archive-article-title">${article.title}</h4>
                    <span class="archive-article-level">${article.level || 'intermediate'}</span>
                </div>
                
                <div class="archive-article-meta">
                    <div class="archive-meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${date}</span>
                    </div>
                    <div class="archive-meta-item">
                        <i class="fas fa-tags"></i>
                        <span>${keywords.length} mots-clés</span>
                    </div>
                    <div class="archive-meta-item">
                        <i class="fas fa-language"></i>
                        <span>${languageName}</span>
                    </div>
                </div>
                
                <div class="archive-article-preview">
                    ${preview}
                </div>
                
                <div class="archive-article-keywords">
                    ${keywordsHTML}
                </div>
                
                <div class="archive-article-actions">
                    <button class="read-article-btn" onclick="event.stopPropagation(); archiveManager.readArticle('${article.id}')">
                        <i class="fas fa-book-open"></i>
                        Lire l'article
                    </button>
                    <span class="archive-article-date">${date}</span>
                </div>
            </div>
        `;
    }

    stripBrackets(text) {
        return text.replace(/\[([^\]]+)\]/g, '$1');
    }

    extractKeywords(content) {
        const matches = content.match(/\[([^\]]+)\]/g);
        return matches ? matches.map(match => match.slice(1, -1)) : [];
    }

    async readArticle(articleId) {
        console.log('🔍 ReadArticle appelé avec ID:', articleId);
        
        const articles = await this.getAllArticles();
        console.log('📚 Articles disponibles:', articles);
        console.log('🔍 IDs des articles:', articles.map(a => `${a.id} (${typeof a.id})`));
        
        // Assurer que la comparaison fonctionne avec string et number
        const article = articles.find(a => a.id == articleId || a.id === String(articleId));
        
        console.log('📖 Article trouvé:', article);
        
        if (article) {
            loadArticleIntoMain(article);
            this.showHomeSection();
            
            // Show success message
            showMessage(`Article "${article.title}" chargé avec succès !`, 'success');
        } else {
            console.error('❌ Article non trouvé avec ID:', articleId);
            showMessage(`Article avec ID ${articleId} non trouvé`, 'error');
        }
    }

    async updateStats() {
        const allArticles = await this.getAllArticles();
        
        // Mettre à jour les statistiques générales
        document.getElementById('total-articles').textContent = allArticles.length;
        
        // Calculer les statistiques par niveau
        const beginnerCount = allArticles.filter(a => (a.level || 'intermediate') === 'beginner').length;
        const intermediateCount = allArticles.filter(a => (a.level || 'intermediate') === 'intermediate').length;
        const advancedCount = allArticles.filter(a => (a.level || 'intermediate') === 'advanced').length;
        
        // Mettre à jour les éléments s'ils existent
        const beginnerElement = document.getElementById('beginner-articles');
        const intermediateElement = document.getElementById('intermediate-articles');
        const advancedElement = document.getElementById('advanced-articles');
        
        if (beginnerElement) beginnerElement.textContent = beginnerCount;
        if (intermediateElement) intermediateElement.textContent = intermediateCount;
        if (advancedElement) advancedElement.textContent = advancedCount;
        
        // Mettre à jour les statistiques par langue
        const languages = ['es', 'it', 'pt', 'ca', 'fr'];
        languages.forEach(lang => {
            const count = allArticles.filter(article => 
                (article.language || 'es') === lang
            ).length;
            const countElement = document.getElementById(`count-lang-${lang}`);
            if (countElement) {
                countElement.textContent = count;
            }
        });
    }

    showMessage(message, type = 'success') {
        // Create a temporary message
        const messageEl = document.createElement('div');
        messageEl.className = `admin-message ${type}`;
        messageEl.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            ${message}
        `;
        
        // Insert into archive section if visible
        const archiveSection = document.getElementById('archive-section');
        if (archiveSection.style.display !== 'none') {
            archiveSection.insertBefore(messageEl, archiveSection.firstChild);
            
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 3000);
        }
    }
}

// Variables globales pour les managers
let savedWordsManager;
let adminManager;
let archiveManager;

// Initialisation après chargement complet du DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 DOM chargé, initialisation des managers...');
    
    // Initialize managers in correct order
    savedWordsManager = new SavedWordsManager();
    adminManager = new AdminManager(); 
    archiveManager = new ArchiveManager();
    
    // Attach global window references
    window.savedWordsManager = savedWordsManager;
    window.adminManager = adminManager;
    window.archiveManager = archiveManager;
    
    console.log('✅ Managers initialisés avec succès');
    
    // Initialize with latest article on page load - PRIORITÉ À CHAQUE RECONNEXION
    console.log('🚀 Page chargée - Initialisation avec le dernier article uniquement');
    
    // Attendre que les managers soient prêts
    setTimeout(() => {
        if (window.archiveManager) {
            archiveManager.loadLatestArticle();
        } else {
            console.error('❌ ArchiveManager non disponible au chargement');
        }
    }, 100);
});

// S'assurer que le dernier article est rechargé quand on revient à l'accueil
async function ensureLatestArticleOnHome() {
    console.log('🏠 Retour à l\'accueil - Rechargement du dernier article');
    if (window.archiveManager) {
        await archiveManager.loadLatestArticle();
    }
}

// Fonction utilitaire pour forcer le rechargement du dernier article
window.refreshLatestArticle = async function() {
    console.log('🔄 Rechargement forcé du dernier article');
    if (window.archiveManager) {
        await archiveManager.loadLatestArticle();
    } else {
        console.error('❌ ArchiveManager non disponible');
    }
};

// FONCTIONS GLOBALES DE DÉBOGAGE ADMIN (accessibles depuis la console)
window.debugAdminForm = function() {
    console.log('🎯 Lancement du diagnostic admin depuis window.debugAdminForm()');
    if (window.adminManager && typeof adminManager.diagnoseAdminForm === 'function') {
        return adminManager.diagnoseAdminForm();
    } else {
        console.error('❌ adminManager non disponible ou méthode manquante');
        return null;
    }
};

window.fillAdminTestData = function() {
    console.log('📝 Remplissage du formulaire admin avec des données de test');
    
    const elements = {
        title: document.getElementById('article-title'),
        content: document.getElementById('article-content'),
        language: document.getElementById('article-language'),
        level: document.getElementById('article-level'),
        date: document.getElementById('article-date'),
        summary: document.getElementById('article-summary')
    };
    
    if (elements.title) elements.title.value = 'Test Debug: Article de validation';
    if (elements.content) elements.content.value = 'Ceci est un [test] de [validation] pour identifier le problème de sauvegarde. Le contenu contient des [mots-clés] pour vérifier l\'extraction automatique.';
    if (elements.language) elements.language.value = 'es';
    if (elements.level) elements.level.value = 'intermediate';
    if (elements.date) elements.date.value = new Date().toISOString().split('T')[0];
    if (elements.summary) elements.summary.value = 'Article de test pour le débogage';
    
    console.log('✅ Données de test ajoutées au formulaire');
    
    // Tester automatiquement la validation
    setTimeout(() => {
        window.debugAdminForm();
    }, 100);
};

window.testAdminSave = function() {
    console.log('💾 Test de la fonction saveArticle()');
    if (typeof saveArticle === 'function') {
        saveArticle();
    } else {
        console.error('❌ fonction globale saveArticle non disponible');
    }
};

// DIAGNOSTIC TEMPS RÉEL - FONCTIONNE AU MOMENT EXACT DE L'ERREUR
window.realTimeDiagnosis = function() {
    console.log('🚨 === DIAGNOSTIC TEMPS RÉEL === 🚨');
    
    // 1. Vérifier l'état de l'éditeur
    const editor = document.getElementById('article-editor');
    console.log('📋 État de l\'éditeur:', {
        exists: !!editor,
        visible: editor ? editor.style.display !== 'none' : false,
        offsetParent: editor ? !!editor.offsetParent : false
    });
    
    // 2. Chercher TOUS les éléments possibles avec des IDs similaires
    const allElements = document.querySelectorAll('[id*="article"]');
    console.log('🔍 Tous les éléments avec "article" dans l\'ID:', 
        Array.from(allElements).map(el => ({
            id: el.id,
            tagName: el.tagName,
            type: el.type || 'N/A',
            value: el.value || el.textContent?.substring(0, 30) || 'empty',
            visible: !!el.offsetParent
        }))
    );
    
    // 3. Test direct des IDs exacts
    const exactElements = {
        'article-title': document.getElementById('article-title'),
        'article-content': document.getElementById('article-content'), 
        'article-language': document.getElementById('article-language'),
        'article-level': document.getElementById('article-level'),
        'article-date': document.getElementById('article-date'),
        'article-summary': document.getElementById('article-summary')
    };
    
    console.log('🎯 Éléments par ID exact:');
    Object.entries(exactElements).forEach(([id, element]) => {
        if (element) {
            console.log(`  ✅ ${id}:`, {
                exists: true,
                tagName: element.tagName,
                type: element.type || 'N/A',
                value: `"${element.value}"`,
                length: element.value ? element.value.length : 0,
                trimmed: `"${element.value ? element.value.trim() : ''}"`,
                trimmedLength: element.value ? element.value.trim().length : 0,
                visible: !!element.offsetParent,
                disabled: element.disabled,
                readonly: element.readOnly
            });
        } else {
            console.error(`  ❌ ${id}: INTROUVABLE`);
        }
    });
    
    // 4. Test de la logique de validation EXACTE
    const titleEl = document.getElementById('article-title');
    const contentEl = document.getElementById('article-content');
    const languageEl = document.getElementById('article-language');
    
    if (titleEl && contentEl && languageEl) {
        const title = titleEl.value.trim();
        const content = contentEl.value.trim();
        const language = languageEl.value;
        
        console.log('🧪 Test de validation:');
        console.log('  📝 Valeurs brutes:', {
            title: `"${titleEl.value}"`,
            content: `"${contentEl.value.substring(0, 50)}..."`,
            language: `"${languageEl.value}"`
        });
        
        console.log('  📝 Valeurs après trim:', {
            title: `"${title}"`,
            content: `"${content.substring(0, 50)}..."`,
            language: `"${language}"`
        });
        
        console.log('  ✅ Longueurs:', {
            title: title.length,
            content: content.length,
            language: language.length
        });
        
        const titleValid = title && title.length > 0;
        const contentValid = content && content.length > 0;
        const languageValid = language && language.length > 0;
        
        console.log('  🎯 Résultats de validation:', {
            titleValid,
            contentValid,
            languageValid,
            wouldPass: titleValid && contentValid && languageValid
        });
        
        if (!titleValid || !contentValid || !languageValid) {
            console.error('❌ VALIDATION ÉCHOUERAIT - Problèmes détectés:');
            if (!titleValid) console.error(`  - Titre: "${title}" (longueur: ${title.length})`);
            if (!contentValid) console.error(`  - Contenu: "${content}" (longueur: ${content.length})`);
            if (!languageValid) console.error(`  - Langue: "${language}" (longueur: ${language.length})`);
        } else {
            console.log('✅ VALIDATION RÉUSSIRAIT - Tous les champs sont valides');
        }
    } else {
        console.error('❌ Impossible de tester la validation - éléments manquants:', {
            title: !!titleEl,
            content: !!contentEl,
            language: !!languageEl
        });
    }
    
    console.log('🚨 === FIN DIAGNOSTIC TEMPS RÉEL === 🚨');
    
    return {
        editorVisible: editor && editor.style.display !== 'none',
        elementsFound: Object.values(exactElements).filter(el => el !== null).length,
        canValidate: !!(titleEl && contentEl && languageEl)
    };
};

console.log('🔧 Fonctions de débogage admin disponibles:');
console.log('  window.debugAdminForm() - Diagnostic du formulaire');
console.log('  window.fillAdminTestData() - Remplir avec données de test'); 
console.log('  window.testAdminSave() - Tester la sauvegarde');
console.log('  window.realTimeDiagnosis() - 🚨 DIAGNOSTIC TEMPS RÉEL 🚨');

// Update home button click handler to handle all sections
const originalHomeBtn = document.getElementById('home-btn');
originalHomeBtn.addEventListener('click', () => {
    // Use the archive manager's showHomeSection method
    archiveManager.showHomeSection();
});

// Fonctions utilitaires supplémentaires qui pourraient avoir été dans les anciens fichiers
window.utils = {
    // Fonction pour formater les dates
    formatDate: (dateString) => {
        try {
            return new Date(dateString).toLocaleDateString('fr-FR');
        } catch (error) {
            console.warn('Erreur formatage date:', dateString);
            return dateString;
        }
    },
    
    // Fonction pour nettoyer le localStorage
    clearAllLocalStorage: () => {
        localStorage.removeItem('articles');
        localStorage.removeItem('customWords');
        localStorage.removeItem('savedWords');
        localStorage.removeItem('admin_articles');
        console.log('✅ localStorage nettoyé');
    },
    
    // Fonction pour exporter toutes les données
    exportAllData: () => {
        const data = {
            articles: JSON.parse(localStorage.getItem('articles') || '[]'),
            customWords: JSON.parse(localStorage.getItem('customWords') || '{}'),
            savedWords: JSON.parse(localStorage.getItem('savedWords') || '[]'),
            adminArticles: JSON.parse(localStorage.getItem('admin_articles') || '[]'),
            timestamp: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `linguaromana-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        console.log('📦 Données exportées');
    },
    
    // Fonction pour recharger complètement l'application
    reloadApp: () => {
        console.log('🔄 Rechargement complet de l\'application...');
        window.location.reload();
    },
    
    // Fonction de diagnostic rapide
    quickDiagnostic: () => {
        console.log('🔧 === DIAGNOSTIC RAPIDE ===');
        console.log('Managers:', {
            savedWordsManager: !!window.savedWordsManager,
            adminManager: !!window.adminManager,
            archiveManager: !!window.archiveManager
        });
        console.log('LocalStorage:', {
            articles: JSON.parse(localStorage.getItem('articles') || '[]').length,
            customWords: Object.keys(JSON.parse(localStorage.getItem('customWords') || '{}')).length,
            savedWords: JSON.parse(localStorage.getItem('savedWords') || '[]').length
        });
        console.log('État DOM:', {
            adminSection: !!document.getElementById('admin-section'),
            articleEditor: !!document.getElementById('article-editor'),
            quizSection: !!document.getElementById('quiz-questions')
        });
    }
};

// Fonction pour vérifier l'intégrité du système
window.checkSystemIntegrity = function() {
    console.log('🔍 === VÉRIFICATION INTÉGRITÉ SYSTÈME ===');
    
    const checks = {
        managers: {
            savedWordsManager: typeof savedWordsManager !== 'undefined',
            adminManager: typeof adminManager !== 'undefined',
            archiveManager: typeof archiveManager !== 'undefined'
        },
        functions: {
            addQuizQuestion: typeof addQuizQuestion === 'function',
            collectQuizData: typeof collectQuizData === 'function',
            saveArticle: typeof saveArticle === 'function',
            apiCall: typeof apiCall === 'function'
        },
        dom: {
            adminSection: !!document.getElementById('admin-section'),
            articleEditor: !!document.getElementById('article-editor'),
            addQuizButton: !!document.getElementById('add-quiz-question')
        }
    };
    
    let allGood = true;
    Object.entries(checks).forEach(([category, items]) => {
        console.log(`📋 ${category.toUpperCase()}:`);
        Object.entries(items).forEach(([item, status]) => {
            const icon = status ? '✅' : '❌';
            console.log(`  ${icon} ${item}: ${status}`);
            if (!status) allGood = false;
        });
    });
    
    console.log(allGood ? '🎉 SYSTÈME OK' : '⚠️ PROBLÈMES DÉTECTÉS');
    return allGood;
};

console.log('🌟 LinguaRomana MVP initialized successfully!');
console.log('📚 Ready to learn with news articles in Romance languages!');
console.log('💾 Saved Words feature loaded!');
console.log('⚙️ Admin panel loaded!');
console.log('📚 Archive system loaded!');

// Utilitaires disponibles
console.log('🔧 Utilitaires disponibles:');
console.log('  window.utils.clearAllLocalStorage() - Nettoyer localStorage');
console.log('  window.utils.exportAllData() - Exporter toutes les données');
console.log('  window.utils.quickDiagnostic() - Diagnostic rapide');
console.log('  window.checkSystemIntegrity() - Vérifier l\'intégrité');

// ===============================
// SYSTÈME DE FLAMMES (STREAK)
// ===============================

// Variables globales pour les flammes
let userStreak = 0;
let isAuthenticated = false;

// Classe pour gérer les flammes utilisateur
class StreakManager {
    constructor() {
        this.currentStreak = 0;
        this.isAuthenticated = false;
        this.lastUpdateDate = null;
        this.streakElement = null;
        
        this.init();
    }
    
    init() {
        console.log('🔥 Initialisation StreakManager');
        
        // Créer l'élément d'affichage des flammes
        this.createStreakDisplay();
        
        // Vérifier si l'utilisateur est connecté
        this.checkAuthenticationStatus();
        
        // Charger les flammes si connecté
        if (this.isAuthenticated) {
            this.loadUserStreak();
        }
    }
    
    createStreakDisplay() {
        // Chercher un endroit pour afficher les flammes (header, nav, etc.)
        const header = document.querySelector('header') || document.querySelector('nav') || document.querySelector('.top-nav');
        
        if (header) {
            const streakContainer = document.createElement('div');
            streakContainer.id = 'streak-display';
            streakContainer.className = 'streak-display';
            streakContainer.innerHTML = `
                <div class="streak-content">
                    <span class="streak-icon">🔥</span>
                    <span class="streak-count" id="streak-count">0</span>
                    <span class="streak-label">flammes</span>
                </div>
            `;
            
            // Ajouter les styles CSS
            const style = document.createElement('style');
            style.textContent = `
                .streak-display {
                    display: inline-flex;
                    align-items: center;
                    background: linear-gradient(135deg, #ff6b35, #ff8e53);
                    color: white;
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: bold;
                    box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
                    margin: 0 10px;
                }
                
                .streak-content {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .streak-icon {
                    font-size: 16px;
                    animation: flicker 2s infinite;
                }
                
                .streak-count {
                    font-size: 16px;
                    font-weight: bold;
                }
                
                .streak-label {
                    font-size: 12px;
                    opacity: 0.9;
                }
                
                @keyframes flicker {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                
                .streak-increase-animation {
                    animation: streakIncrease 1s ease-out;
                }
                
                @keyframes streakIncrease {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.2); color: #ffff00; }
                    100% { transform: scale(1); }
                }
            `;
            
            document.head.appendChild(style);
            header.appendChild(streakContainer);
            this.streakElement = document.getElementById('streak-count');
        }
    }
    
    checkAuthenticationStatus() {
        // Vérifier si l'utilisateur est connecté (basé sur la présence de certains éléments)
        const authIndicators = [
            document.getElementById('admin-btn'),
            document.querySelector('.user-profile'),
            localStorage.getItem('user_token')
        ];
        
        this.isAuthenticated = authIndicators.some(indicator => indicator !== null);
        console.log(`👤 Authentification détectée: ${this.isAuthenticated}`);
    }
    
    async loadUserStreak() {
        try {
            console.log('🔄 Chargement du streak utilisateur...');
            
            const response = await fetch('/api/user-streak/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                },
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentStreak = data.streak;
                this.lastUpdateDate = data.last_activity;
                this.updateStreakDisplay();
                
                console.log(`🔥 Streak chargé: ${this.currentStreak} flammes`);
            } else {
                console.log('⚠️ Impossible de charger le streak:', data.error);
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement du streak:', error);
        }
    }
    
    async updateUserStreak(actionType = 'general', points = 0) {
        if (!this.isAuthenticated) {
            console.log('👤 Utilisateur non connecté, pas de mise à jour du streak');
            return;
        }
        
        try {
            console.log(`🔥 Mise à jour du streak (action: ${actionType}, points: ${points})`);
            
            const response = await fetch('/api/user-streak/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    action_type: actionType,
                    points: points
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                const previousStreak = this.currentStreak;
                this.currentStreak = data.streak;
                this.updateStreakDisplay();
                
                if (data.streak_increased) {
                    this.showStreakIncreaseAnimation();
                    console.log(`🎉 Streak augmenté ! ${previousStreak} → ${data.streak} flammes`);
                    
                    // Afficher un message de félicitations
                    if (window.showMessage) {
                        showMessage(data.message, 'success');
                    }
                }
                
                console.log(`🔥 Streak mis à jour: ${data.streak} flammes`);
                return data;
            } else {
                console.error('❌ Erreur mise à jour streak:', data.error);
            }
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour du streak:', error);
        }
    }
    
    updateStreakDisplay() {
        if (this.streakElement) {
            this.streakElement.textContent = this.currentStreak;
            
            // Mettre à jour le label
            const labelElement = document.querySelector('.streak-label');
            if (labelElement) {
                labelElement.textContent = this.currentStreak === 1 ? 'flamme' : 'flammes';
            }
        }
    }
    
    showStreakIncreaseAnimation() {
        const display = document.getElementById('streak-display');
        if (display) {
            display.classList.add('streak-increase-animation');
            setTimeout(() => {
                display.classList.remove('streak-increase-animation');
            }, 1000);
        }
    }
    
    // Méthodes pour les différents types d'activités
    async onQuizCompleted(score, points = 10) {
        return await this.updateUserStreak('quiz_completed', points);
    }
    
    async onArticleRead(points = 5) {
        return await this.updateUserStreak('article_read', points);
    }
    
    async onWordSaved(points = 2) {
        return await this.updateUserStreak('word_saved', points);
    }
}

// Instance globale du gestionnaire de streak
let streakManager = null;

// Initialiser le streak manager après le chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        streakManager = new StreakManager();
        window.streakManager = streakManager; // Rendre accessible globalement
        
        console.log('🔥 StreakManager initialisé');
    }, 1000);
});

// Fonctions globales pour faciliter l'intégration
window.updateStreakOnQuiz = function(score, points = 10) {
    if (streakManager) {
        return streakManager.onQuizCompleted(score, points);
    }
};

window.updateStreakOnArticleRead = function(points = 5) {
    if (streakManager) {
        return streakManager.onArticleRead(points);
    }
};

window.updateStreakOnWordSaved = function(points = 2) {
    if (streakManager) {
        return streakManager.onWordSaved(points);
    }
};

// ===============================
// GRAMMAR NOTES MANAGEMENT
// ===============================

// Initialiser la gestion des notes de grammaire
function initializeGrammarNotesManagement() {
    // Toggle pour activer/désactiver les notes de grammaire
    const includeGrammarToggle = document.getElementById('include-grammar');
    const grammarForm = document.getElementById('grammar-form');
    
    if (includeGrammarToggle && grammarForm) {
        includeGrammarToggle.addEventListener('change', function() {
            if (this.checked) {
                grammarForm.classList.remove('hidden');
                grammarForm.style.display = 'block';
            } else {
                grammarForm.classList.add('hidden');
                setTimeout(() => {
                    grammarForm.style.display = 'none';
                }, 300);
            }
        });
        
        // État initial
        if (includeGrammarToggle.checked) {
            grammarForm.classList.remove('hidden');
            grammarForm.style.display = 'block';
        }
    }
}

// Collecter les données de grammaire du formulaire
function collectGrammarData() {
    const includeGrammar = document.getElementById('include-grammar');
    
    if (!includeGrammar || !includeGrammar.checked) {
        return null; // Pas de note de grammaire
    }
    
    const grammarData = {
        title: document.getElementById('grammar-title-input')?.value?.trim() || '',
        content: document.getElementById('grammar-content-input')?.value?.trim() || '',
        difficulty_level: document.getElementById('grammar-level-select')?.value || 'intermediate',
        key_concepts: document.getElementById('grammar-concepts-input')?.value?.trim() || '',
        learning_objectives: document.getElementById('grammar-objectives-input')?.value?.trim() || '',
        examples: document.getElementById('grammar-examples-input')?.value?.trim() || ''
    };
    
    // Validation basique
    if (!grammarData.title || !grammarData.content) {
        return {
            error: 'Le titre et le contenu de la note de grammaire sont requis'
        };
    }
    
    return grammarData;
}

// Pré-remplir le formulaire de grammaire avec des données existantes
function populateGrammarForm(grammarData) {
    if (!grammarData) return;
    
    const includeGrammar = document.getElementById('include-grammar');
    if (includeGrammar) {
        includeGrammar.checked = true;
        includeGrammar.dispatchEvent(new Event('change'));
    }
    
    const elements = {
        'grammar-title-input': grammarData.title || '',
        'grammar-content-input': grammarData.content || '',
        'grammar-level-select': grammarData.difficulty_level || 'intermediate',
        'grammar-concepts-input': grammarData.key_concepts || '',
        'grammar-objectives-input': grammarData.learning_objectives || '',
        'grammar-examples-input': grammarData.examples || ''
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.value = value;
        }
    });
}

// Effacer le formulaire de grammaire
function clearGrammarForm() {
    const includeGrammar = document.getElementById('include-grammar');
    if (includeGrammar) {
        includeGrammar.checked = true; // Par défaut activé
    }
    
    const formElements = [
        'grammar-title-input',
        'grammar-content-input', 
        'grammar-concepts-input',
        'grammar-objectives-input',
        'grammar-examples-input'
    ];
    
    formElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
        }
    });
    
    const levelSelect = document.getElementById('grammar-level-select');
    if (levelSelect) {
        levelSelect.value = 'intermediate';
    }
}

// Intégrer la gestion des notes de grammaire dans le système existant
function enhanceArticleManagementWithGrammar() {
    // Override de la fonction saveArticle si elle existe
    const originalSaveArticle = window.saveArticle;
    
    if (originalSaveArticle) {
        window.saveArticle = function() {
            console.log('📝 Sauvegarde article avec gestion de grammaire...');
            
            // Collecter les données de grammaire
            const grammarData = collectGrammarData();
            
            if (grammarData && grammarData.error) {
                showMessage(grammarData.error, 'error');
                return;
            }
            
            // Ajouter les données de grammaire à l'article
            if (grammarData) {
                console.log('✅ Données de grammaire collectées:', grammarData);
                // Stocker temporairement pour utilisation dans saveArticle
                window.tempGrammarData = grammarData;
            }
            
            // Appeler la fonction originale
            return originalSaveArticle.call(this);
        };
    } else {
        // Créer une nouvelle fonction saveArticle si elle n'existe pas
        window.saveArticle = function() {
            console.log('📝 Nouvelle fonction de sauvegarde avec grammaire...');
            
            // Collecter les données d'article
            const articleData = collectArticleData();
            if (!articleData) {
                showMessage('Erreur: Données d\'article manquantes', 'error');
                return;
            }
            
            // Collecter les données de grammaire
            const grammarData = collectGrammarData();
            
            if (grammarData && grammarData.error) {
                showMessage(grammarData.error, 'error');
                return;
            }
            
            // Collecter les données de quiz
            const quizData = collectQuizData();
            
            // Préparer les données complètes
            const completeData = {
                ...articleData,
                quiz_questions: quizData || [],
                grammar_note: grammarData || null
            };
            
            console.log('📝 Données complètes à sauvegarder:', completeData);
            
            // Envoyer à l'API
            return saveCompleteArticle(completeData);
        };
    }
}

// Collecter les données d'article du formulaire
function collectArticleData() {
    const title = document.getElementById('article-title')?.value?.trim();
    const content = document.getElementById('article-content')?.value?.trim();
    const language = document.getElementById('article-language')?.value;
    const level = document.getElementById('article-level')?.value;
    const date = document.getElementById('article-date')?.value;
    const summary = document.getElementById('article-summary')?.value?.trim();
    
    if (!title || !content || !language) {
        showMessage('Titre, contenu et langue sont obligatoires', 'error');
        return null;
    }
    
    return {
        title,
        content,
        language,
        level: level || 'intermediate',
        publication_date: date || new Date().toISOString().split('T')[0],
        summary: summary || ''
    };
}

// Sauvegarder l'article complet avec grammaire
async function saveCompleteArticle(articleData) {
    try {
        console.log('🚀 Envoi des données à l\'API...');
        
        const response = await apiCall('/api/create-article-quiz/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(articleData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Article créé avec succès !', 'success');
            console.log('✅ Article sauvegardé:', data);
            
            // Nettoyer le formulaire
            clearArticleForm();
            clearGrammarForm();
            clearQuizQuestions();
            
            // Rafraîchir la liste des articles si AdminManager existe
            if (window.adminManager && typeof adminManager.renderArticles === 'function') {
                adminManager.renderArticles().catch(err => console.error('Erreur renderArticles:', err));
            }
            
            return data;
        } else {
            throw new Error(data.error || 'Erreur lors de la sauvegarde');
        }
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde:', error);
        showMessage(`Erreur: ${error.message}`, 'error');
        throw error;
    }
}

// Nettoyer le formulaire d'article
function clearArticleForm() {
    const formElements = [
        'article-title',
        'article-content',
        'article-summary'
    ];
    
    formElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.value = '';
        }
    });
    
    // Réinitialiser les sélecteurs
    const languageSelect = document.getElementById('article-language');
    if (languageSelect) {
        languageSelect.value = 'es';
    }
    
    const levelSelect = document.getElementById('article-level');
    if (levelSelect) {
        levelSelect.value = 'intermediate';
    }
    
    // Réinitialiser la date
    const dateInput = document.getElementById('article-date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
}

// Initialiser tout le système de gestion de grammaire
function initializeGrammarManagement() {
    console.log('📝 Initialisation de la gestion des notes de grammaire...');
    
    // Attendre que le DOM soit prêt
    setTimeout(() => {
        initializeGrammarNotesManagement();
        enhanceArticleManagementWithGrammar();
        console.log('✅ Gestion des notes de grammaire initialisée');
    }, 1000);
}

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    initializeGrammarManagement();
});

// Export des fonctions globales
window.collectGrammarData = collectGrammarData;
window.populateGrammarForm = populateGrammarForm;
window.clearGrammarForm = clearGrammarForm;

// Vérification automatique au démarrage
setTimeout(() => {
    window.checkSystemIntegrity();
}, 2000);
