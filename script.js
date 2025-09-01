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
            // Update global translations object
            Object.assign(translations, this.customWords);
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
        this.currentEditingArticle = article;
        const editor = document.getElementById('article-editor');
        const title = document.getElementById('editor-title');
        
        if (article) {
            title.textContent = '✏️ Modifier Article';
            document.getElementById('article-title').value = article.title;
            document.getElementById('article-date').value = article.date;
            document.getElementById('article-content').value = article.content;
            document.getElementById('article-summary').value = article.summary || '';
        } else {
            title.textContent = '✍️ Nouvel Article';
            document.getElementById('article-title').value = '';
            document.getElementById('article-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('article-content').value = '';
            document.getElementById('article-summary').value = '';
        }

        editor.style.display = 'block';
        document.getElementById('articles-list').style.display = 'none';
        this.detectKeywords();
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
        const title = document.getElementById('article-title').value.trim();
        const date = document.getElementById('article-date').value;
        const content = document.getElementById('article-content').value.trim();
        const summary = document.getElementById('article-summary').value.trim();

        if (!title || !content) {
            alert('Le titre et le contenu sont obligatoires');
            return;
        }

        const article = {
            id: this.currentEditingArticle ? this.currentEditingArticle.id : Date.now(),
            title,
            date,
            content,
            summary,
            status: 'published',
            createdAt: this.currentEditingArticle ? this.currentEditingArticle.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
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
        this.showMessage('Article sauvegardé avec succès !', 'success');
    }

    renderArticles() {
        const grid = document.getElementById('articles-grid');
        
        if (this.customArticles.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 2rem;">Aucun article personnalisé créé.</p>';
            return;
        }

        const articlesHTML = this.customArticles.map(article => {
            const date = new Date(article.date).toLocaleDateString('fr-FR');
            const preview = article.content.substring(0, 150) + '...';
            
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
                        Créé le ${date} • ${article.status}
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
        const word = document.getElementById('word-key').value.trim();
        const es = document.getElementById('trans-input-es').value.trim();
        const it = document.getElementById('trans-input-it').value.trim();
        const pt = document.getElementById('trans-input-pt').value.trim();
        const ca = document.getElementById('trans-input-ca').value.trim();
        const fr = document.getElementById('trans-input-fr').value.trim();
        const grammar = document.getElementById('word-grammar').value.trim();

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

        this.customWords[word] = wordData;
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
}

// Initialize admin manager
const adminManager = new AdminManager();

// Update home button click handler to hide admin
const originalHomeBtn = document.getElementById('home-btn');
originalHomeBtn.addEventListener('click', () => {
    // Hide admin section
    document.getElementById('admin-section').style.display = 'none';
    document.getElementById('admin-btn').style.display = 'block';
    document.getElementById('saved-words-btn').style.display = 'block';
});

console.log('🌟 LinguaRomana MVP initialized successfully!');
console.log('📚 Ready to learn with news articles in Romance languages!');
console.log('💾 Saved Words feature loaded!');
console.log('⚙️ Admin panel loaded!');
