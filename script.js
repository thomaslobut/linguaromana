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
    initializeLanguageButtons();
    updateProgress();
});

// Initialize clickable keywords
function initializeKeywords() {
    const keywords = document.querySelectorAll('.keyword');
    
    keywords.forEach(keyword => {
        keyword.addEventListener('click', function() {
            const word = this.dataset.word;
            showTranslation(word);
        });
    });
}

// Show translation popup
function showTranslation(word) {
    if (translations[word]) {
        popupWord.textContent = word.charAt(0).toUpperCase() + word.slice(1);
        
        // Set translations
        document.getElementById('trans-es').textContent = translations[word].es;
        document.getElementById('trans-it').textContent = translations[word].it;
        document.getElementById('trans-pt').textContent = translations[word].pt;
        document.getElementById('trans-ca').textContent = translations[word].ca;
        document.getElementById('trans-fr').textContent = translations[word].fr;
        
        // Set grammar note
        document.getElementById('grammar-note-text').textContent = translations[word].grammar;
        
        // Show popup with animation
        translationPopup.classList.add('active');
    }
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

// Language button functionality
function initializeLanguageButtons() {
    const langButtons = document.querySelectorAll('.lang-btn');
    
    langButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            langButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Here you could add language switching logic
            console.log('Language switched to:', this.dataset.lang);
        });
    });
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

// Add some interactive feedback
document.addEventListener('click', function(e) {
    // Add ripple effect to buttons
    if (e.target.matches('button, .keyword')) {
        createRipple(e);
    }
});

function createRipple(event) {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
    circle.classList.add('ripple');

    const ripple = button.getElementsByClassName('ripple')[0];
    if (ripple) {
        ripple.remove();
    }

    button.appendChild(circle);
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
        this.currentFilter = 'all';
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
        if (this.currentFilter === 'all') {
            return this.savedWords;
        }
        return this.savedWords.filter(word => word.language === this.currentFilter);
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

        // Language filter tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.currentTarget.dataset.lang);
            });
        });
    }

    handleSaveCurrentWord() {
        if (!this.currentWord) return;

        const success = this.saveWord(
            this.currentWord,
            translations[this.currentWord],
            translations[this.currentWord].grammar
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
    }

    setFilter(language) {
        this.currentFilter = language;
        
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-lang="${language}"]`).classList.add('active');
        
        this.renderSavedWords();
    }

    renderSavedWords() {
        const container = document.getElementById('saved-words-content');
        const filteredWords = this.getFilteredWords();
        
        if (filteredWords.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bookmark-o"></i>
                    <h4>Aucun mot sauvegardé${this.currentFilter !== 'all' ? ' dans cette langue' : ''}</h4>
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

// Initialize saved words manager
const savedWordsManager = new SavedWordsManager();

// Update the existing showTranslation function to set current word
const originalShowTranslation = window.showTranslation;
window.showTranslation = function(word) {
    originalShowTranslation(word);
    savedWordsManager.setCurrentWord(word);
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

        document.getElementById('save-article-btn').addEventListener('click', () => {
            this.saveArticle();
        });

        document.getElementById('cancel-edit-btn').addEventListener('click', () => {
            this.hideArticleEditor();
        });

        // Word management  
        document.getElementById('new-word-btn').addEventListener('click', () => {
            this.showWordEditor();
        });

        document.getElementById('save-word-btn').addEventListener('click', () => {
            this.saveWord();
        });

        document.getElementById('cancel-word-btn').addEventListener('click', () => {
            this.hideWordEditor();
        });

        // Content detection
        document.getElementById('article-content').addEventListener('input', () => {
            this.detectKeywords();
        });

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
                this.renderArticles();
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
        
        console.log('✅ Éditeur d\'article ouvert');
    }

    hideArticleEditor() {
        document.getElementById('article-editor').style.display = 'none';
        document.getElementById('articles-list').style.display = 'block';
        this.currentEditingArticle = null;
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
                return `<span class="${chipClass}" onclick="adminManager.editKeyword('${keyword}')">${keyword}</span>`;
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

    saveArticle() {
        console.log('💾 saveArticle() - Début de la sauvegarde');
        
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
        
        // 🚨 DIAGNOSTIC AUTOMATIQUE TEMPS RÉEL - Lancé à chaque sauvegarde
        console.log('🚨 LANCEMENT DIAGNOSTIC AUTOMATIQUE AVANT VALIDATION...');
        if (window.realTimeDiagnosis && typeof realTimeDiagnosis === 'function') {
            window.realTimeDiagnosis();
        }
        
        // Récupérer les éléments du formulaire
        const titleElement = document.getElementById('article-title');
        const dateElement = document.getElementById('article-date');
        const contentElement = document.getElementById('article-content');
        const summaryElement = document.getElementById('article-summary');
        const languageElement = document.getElementById('article-language');
        const levelElement = document.getElementById('article-level');

        // Vérifier que tous les éléments existent
        const elementsCheck = {
            title: !!titleElement,
            date: !!dateElement,
            content: !!contentElement,
            summary: !!summaryElement,
            language: !!languageElement,
            level: !!levelElement
        };

        console.log('🔍 Vérification des éléments DOM:', elementsCheck);

        if (!titleElement || !contentElement || !languageElement) {
            console.error('❌ Éléments DOM critiques manquants!', elementsCheck);
            alert('Erreur technique: Impossible d\'accéder aux champs du formulaire. Veuillez recharger la page.');
            return;
        }

        // Récupérer les valeurs
        const title = titleElement.value.trim();
        const date = dateElement ? dateElement.value : '';
        const content = contentElement.value.trim();
        const summary = summaryElement ? summaryElement.value.trim() : '';
        const language = languageElement.value;
        const level = levelElement ? levelElement.value : 'intermediate';

        console.log('📝 Données récupérées du formulaire:', {
            title: `"${title}" (longueur: ${title.length})`,
            date: `"${date}"`,
            content: `"${content.substring(0, 50)}..." (longueur: ${content.length})`,
            summary: `"${summary}" (longueur: ${summary.length})`,
            language: `"${language}"`,
            level: `"${level}"`
        });

        // Vérification détaillée de chaque champ
        const titleValid = title && title.length > 0;
        const contentValid = content && content.length > 0;
        const languageValid = language && language.length > 0;

        console.log('✅ Validation des champs:', {
            title: titleValid,
            content: contentValid,
            language: languageValid
        });

        if (!titleValid || !contentValid || !languageValid) {
            const missingFields = [];
            if (!titleValid) missingFields.push('titre');
            if (!contentValid) missingFields.push('contenu');
            if (!languageValid) missingFields.push('langue');
            
            console.error('❌ Validation échouée. Champs problématiques:', {
                title: titleValid ? 'OK' : `INVALIDE ("${title}")`,
                content: contentValid ? 'OK' : `INVALIDE (${content.length} caractères)`,
                language: languageValid ? 'OK' : `INVALIDE ("${language}")`
            });
            
            // Message d'erreur plus détaillé
            let errorMessage = `Les champs suivants sont obligatoires: ${missingFields.join(', ')}`;
            
            // Ajouter des détails spécifiques pour aider au débogage
            if (!languageValid) {
                errorMessage += `\n\nProblème de langue détecté: "${language}"`;
                errorMessage += '\nVeuillez sélectionner une langue dans la liste déroulante.';
            }
            
            alert(errorMessage);
            return;
        }

        // Extraire les mots-clés du contenu
        const keywords = this.extractKeywordsFromContent(content);

        const article = {
            id: this.currentEditingArticle ? this.currentEditingArticle.id : Date.now(),
            title,
            date,
            content,
            summary,
            language,
            level,
            keywords,
            status: 'published',
            type: 'custom',
            createdAt: this.currentEditingArticle ? this.currentEditingArticle.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isFeatured: false
        };

        if (this.currentEditingArticle) {
            const index = this.customArticles.findIndex(a => a.id === this.currentEditingArticle.id);
            this.customArticles[index] = article;
        } else {
            this.customArticles.unshift(article);
        }

        this.saveCustomArticles();
        this.hideArticleEditor();
        this.renderArticles();
        
        // Mettre à jour les statistiques de l'archive
        if (window.archiveManager) {
            archiveManager.updateStats();
        }
        
        this.showMessage('Article sauvegardé avec succès !', 'success');
    }

    extractKeywordsFromContent(content) {
        const matches = content.match(/\[([^\]]+)\]/g);
        return matches ? matches.map(match => match.slice(1, -1)) : [];
    }

    renderArticles() {
        const grid = document.getElementById('articles-grid');
        
        if (this.customArticles.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 2rem;">Aucun article personnalisé créé.</p>';
            return;
        }

        const languageNames = {
            'es': 'Español',
            'it': 'Italiano', 
            'pt': 'Português',
            'ca': 'Català',
            'fr': 'Français'
        };

        const articlesHTML = this.customArticles.map(article => {
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
                            <button class="admin-action-btn edit-btn" onclick="adminManager.editArticle(${article.id})">
                                <i class="fas fa-edit"></i>
                                Modifier
                            </button>
                            <button class="admin-action-btn publish-btn" onclick="adminManager.useArticle(${article.id})">
                                <i class="fas fa-eye"></i>
                                Utiliser
                            </button>
                            <button class="admin-action-btn delete-btn" onclick="adminManager.deleteArticle(${article.id})">
                                <i class="fas fa-trash"></i>
                                Supprimer
                            </button>
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

    editArticle(articleId) {
        const article = this.customArticles.find(a => a.id === articleId);
        if (article) {
            this.showArticleEditor(article);
        }
    }

    deleteArticle(articleId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
            this.customArticles = this.customArticles.filter(a => a.id !== articleId);
            this.saveCustomArticles();
            this.renderArticles();
            this.showMessage('Article supprimé avec succès !', 'success');
        }
    }

    useArticle(articleId) {
        const article = this.customArticles.find(a => a.id === articleId);
        if (article) {
            this.loadArticleIntoMain(article);
            savedWordsManager.showHomeSection(); // Return to main view
            this.showMessage('Article chargé dans la vue principale !', 'success');
        }
    }

    loadArticleIntoMain(article) {
        // Replace main article content
        document.querySelector('.article-header h2').textContent = article.title;
        document.querySelector('.article-date').textContent = new Date(article.date).toLocaleDateString('fr-FR');
        
        // Process content and make keywords clickable
        let processedContent = article.content.replace(/\[([^\]]+)\]/g, '<span class="keyword" onclick="showTranslation(\'$1\')">$1</span>');
        document.querySelector('.article-content p').innerHTML = processedContent;

        // Update quiz if needed
        this.generateQuizFromArticle(article);
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
        this.showMessage('Mot sauvegardé avec succès !', 'success');
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
                            <button class="admin-action-btn edit-btn" onclick="adminManager.editWord('${word}')">
                                <i class="fas fa-edit"></i>
                                Modifier
                            </button>
                            ${isCustom ? `
                                <button class="admin-action-btn delete-btn" onclick="adminManager.deleteWord('${word}')">
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

    editWord(word) {
        const wordData = this.customWords[word] || translations[word];
        this.showWordEditor(word, wordData);
    }

    deleteWord(word) {
        if (confirm(`Êtes-vous sûr de vouloir supprimer le mot "${word}" ?`)) {
            delete this.customWords[word];
            this.saveCustomWords();
            this.renderWords();
            this.showMessage('Mot supprimé avec succès !', 'success');
        }
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
            this.showMessage('Mot de passe changé avec succès !', 'success');
        } else {
            this.showMessage('Le mot de passe doit contenir au moins 6 caractères', 'error');
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

        this.showMessage('Données exportées avec succès !', 'success');
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
                this.showMessage('Données importées avec succès !', 'success');
            } catch (error) {
                this.showMessage('Erreur lors de l\'importation des données', 'error');
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
            this.showMessage('Toutes les données ont été réinitialisées', 'warning');
        }
    }

    showMessage(message, type = 'success') {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `admin-message ${type}`;
        messageEl.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
            ${message}
        `;

        // Insert at top of current tab
        const activeTab = document.querySelector('.admin-tab-content[style*="block"]');
        if (activeTab) {
            activeTab.insertBefore(messageEl, activeTab.firstChild);
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 3000);
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
        this.updateStats();
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
        
        this.renderArchive();
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

    setLevelFilter(level) {
        this.currentLevelFilter = level;
        this.renderArchive();
    }

    setLanguageFilter(language) {
        this.currentLanguageFilter = language;
        this.renderArchive();
    }

    setSort(sort) {
        this.currentSort = sort;
        this.renderArchive();
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

    setSearchTerm(term) {
        this.searchTerm = term.toLowerCase();
        this.renderArchive();
    }

    getAllArticles() {
        // Utiliser uniquement les articles stockés via l'AdminManager
        // Ces articles sont maintenant tous stockés en base Django via l'API
        const articles = adminManager.customArticles || [];
        
        console.log('🔍 getAllArticles - Articles bruts du adminManager:', articles);
        
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
        
        console.log('🔍 getAllArticles - Articles traités:', processedArticles);
        
        return processedArticles;
    }

    getFilteredAndSortedArticles() {
        let articles = this.getAllArticles();
        
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

    loadLatestArticle() {
        const articles = this.getAllArticles();
        const latest = articles.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        
        if (latest) {
            this.loadArticleIntoMain(latest);
        }
    }

    loadArticleIntoMain(article) {
        console.log('🔄 Chargement de l\'article dans la page principale:', article.title);
        
        // Update main article titles
        const mainTitle = document.getElementById('article-main-title');
        const articleTitle = document.getElementById('article-title');
        const articleMeta = document.getElementById('article-meta');
        const articleContent = document.getElementById('article-content');
        
        if (mainTitle) mainTitle.textContent = '📰 Artículo del día';
        if (articleTitle) articleTitle.textContent = article.title;
        
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
                processedContent = processedContent.replace(regex, `<span class="keyword" onclick="showTranslation('${keyword}')">${keyword}</span>`);
            });
        } else {
            // Fallback for bracket notation
            console.log('📝 Utilisation de la notation crochets pour détecter les mots-clés');
            processedContent = processedContent.replace(/\[([^\]]+)\]/g, '<span class="keyword" onclick="showTranslation(\'$1\')">$1</span>');
        }
        
        // Split content into paragraphs and update display
        if (articleContent) {
            const paragraphs = processedContent.split('\n\n').filter(p => p.trim());
            articleContent.innerHTML = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
        }
        
        // Re-initialize keywords after content update
        setTimeout(() => {
            initializeKeywords();
        }, 100);
        
        console.log('✅ Article chargé avec succès');
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

    renderArchive() {
        const articles = this.getFilteredAndSortedArticles();
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
        
        this.updateStats();
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

    readArticle(articleId) {
        console.log('🔍 ReadArticle appelé avec ID:', articleId);
        
        const articles = this.getAllArticles();
        console.log('📚 Articles disponibles:', articles);
        console.log('🔍 IDs des articles:', articles.map(a => `${a.id} (${typeof a.id})`));
        
        // Assurer que la comparaison fonctionne avec string et number
        const article = articles.find(a => a.id == articleId || a.id === String(articleId));
        
        console.log('📖 Article trouvé:', article);
        
        if (article) {
            this.loadArticleIntoMain(article);
            this.showHomeSection();
            
            // Show success message
            this.showMessage(`Article "${article.title}" chargé avec succès !`, 'success');
        } else {
            console.error('❌ Article non trouvé avec ID:', articleId);
            this.showMessage(`Article avec ID ${articleId} non trouvé`, 'error');
        }
    }

    updateStats() {
        const allArticles = this.getAllArticles();
        
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

// Initialize admin manager
const adminManager = new AdminManager();

// Initialize archive manager
const archiveManager = new ArchiveManager();

// Initialize with latest article on page load
document.addEventListener('DOMContentLoaded', () => {
    archiveManager.loadLatestArticle();
});

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
    if (window.adminManager && typeof adminManager.saveArticle === 'function') {
        adminManager.saveArticle();
    } else {
        console.error('❌ adminManager non disponible ou méthode saveArticle manquante');
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

console.log('🌟 LinguaRomana MVP initialized successfully!');
console.log('📚 Ready to learn with news articles in Romance languages!');
console.log('💾 Saved Words feature loaded!');
console.log('⚙️ Admin panel loaded!');
console.log('📚 Archive system loaded!');
