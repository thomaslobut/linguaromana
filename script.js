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

console.log('🌟 LinguaRomana MVP initialized successfully!');
console.log('📚 Ready to learn with news articles in Romance languages!');
