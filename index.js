/**
 * CLI Trivia Game
 * 
 * Features:
 * - Interactive command-line interface using Readline
 * - Per-question timer using asynchronous JavaScript timers
 * - Array iteration methods (map, filter, reduce) for processing questions and calculating scores
 * - Modular design using functions and object structures
 */

const readline = require('readline');

// ==========================================
// 1. DATA STRUCTURES & CONFIGURATION
// ==========================================

/**
 * Quiz Questions Dataset
 * Array of Objects containing question, choices, correct answer index, and explanation.
 */
const questionsData = [
  {
    id: 1,
    question: "Which keyword is used to declare a block-scoped variable in JavaScript?",
    choices: ["var", "let", "global", "assign"],
    correctIndex: 1,
    category: "JavaScript Basics"
  },
  {
    id: 2,
    question: "Which array method creates a new array with results of calling a provided function on every element?",
    choices: ["filter()", "forEach()", "map()", "reduce()"],
    correctIndex: 2,
    category: "Array Methods"
  },
  {
    id: 3,
    question: "What will `typeof NaN` evaluate to in JavaScript?",
    choices: ["number", "NaN", "undefined", "object"],
    correctIndex: 0,
    category: "Data Types"
  },
  {
    id: 4,
    question: "Which timer function executes a function repeatedly at specified time intervals?",
    choices: ["setTimeout()", "setInterval()", "setImmediate()", "requestAnimationFrame()"],
    correctIndex: 1,
    category: "Asynchronous JS"
  }
];

const TIME_LIMIT_PER_QUESTION = 10; // Time limit per question in seconds

// Game State Management Object
const gameState = {
  questions: [],
  currentIndex: 0,
  userAnswers: [], // Stores objects: { questionId, selectedIndex, isCorrect, timeTaken }
  timer: null,
  timeRemaining: 0,
  gameStartTime: null,
  isAnswerSubmitted: false
};

// Interface for Command-Line Input/Output
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ==========================================
// 2. HELPER FUNCTIONS & ARRAY ITERATIONS
// ==========================================

/**
 * Formats raw question data to ensure consistent structures using Array.prototype.map
 * Requirement: Array iteration method usage
 */
function prepareQuestions(data) {
  return data.map((item) => ({
    ...item,
    choicesFormatted: item.choices.map((choice, index) => `${index + 1}. ${choice}`)
  }));
}

/**
 * Calculates final score and game statistics using Array.prototype.reduce and filter
 * Requirement: Array iteration method usage
 */
function calculateResults(userAnswers) {
  const totalQuestions = userAnswers.length;
  
  // Use filter to count correct answers
  const correctCount = userAnswers.filter(ans => ans.isCorrect).length;
  
  // Use reduce to aggregate total time spent
  const totalTimeSpent = userAnswers.reduce((sum, ans) => sum + ans.timeTaken, 0);

  const percentage = Math.round((correctCount / totalQuestions) * 100);

  return {
    totalQuestions,
    correctCount,
    percentage,
    totalTimeSpent
  };
}

/**
 * Clears terminal line and moves cursor for live timer UI updates
 */
function clearCurrentLine() {
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);
}

// ==========================================
// 3. ASYNCHRONOUS TIMERS & CORE LOGIC
// ==========================================

/**
 * Starts countdown timer for the current question
 */
function startQuestionTimer(onTimeout) {
  gameState.timeRemaining = TIME_LIMIT_PER_QUESTION;

  gameState.timer = setInterval(() => {
    gameState.timeRemaining -= 1;

    if (gameState.timeRemaining <= 0) {
      clearInterval(gameState.timer);
      onTimeout();
    }
  }, 1000);
}

/**
 * Stops active question timer
 */
function stopQuestionTimer() {
  if (gameState.timer) {
    clearInterval(gameState.timer);
    gameState.timer = null;
  }
}

/**
 * Displays the current question and option choices
 */
function presentQuestion() {
  const currentQuestion = gameState.questions[gameState.currentIndex];
  
  console.log(`\n==================================================`);
  console.log(`Question ${gameState.currentIndex + 1} of ${gameState.questions.length} [Category: ${currentQuestion.category}]`);
  console.log(`Time Limit: ${TIME_LIMIT_PER_QUESTION} seconds`);
  console.log(`--------------------------------------------------`);
  console.log(`${currentQuestion.question}\n`);
  
  currentQuestion.choicesFormatted.forEach(choice => {
    console.log(`  ${choice}`);
  });
  
  console.log(`--------------------------------------------------`);

  gameState.isAnswerSubmitted = false;
  const questionStartTime = Date.now();

  // Start Asynchronous Timer
  startQuestionTimer(() => {
    if (!gameState.isAnswerSubmitted) {
      gameState.isAnswerSubmitted = true;
      console.log(`\n\n⏰ TIME'S UP! You ran out of time for this question.`);
      
      recordAnswer(-1, false, TIME_LIMIT_PER_QUESTION);
      advanceGame();
    }
  });

  // Prompt user for input
  promptUserAnswer(currentQuestion, questionStartTime);
}

/**
 * Handles user input validation and recording
 */
function promptUserAnswer(currentQuestion, startTime) {
  rl.question(`Enter choice (1-${currentQuestion.choices.length}): `, (input) => {
    if (gameState.isAnswerSubmitted) return; // Prevent double submission on timeout

    const selectedOption = parseInt(input.trim(), 10);
    const validChoices = currentQuestion.choices.map((_, index) => index + 1);

    if (isNaN(selectedOption) || !validChoices.includes(selectedOption)) {
      console.log(`❌ Invalid choice. Please enter a number between 1 and ${currentQuestion.choices.length}.`);
      promptUserAnswer(currentQuestion, startTime);
      return;
    }

    // Stop timer and calculate elapsed time
    stopQuestionTimer();
    gameState.isAnswerSubmitted = true;
    
    const timeTaken = Math.min(
      Math.round((Date.now() - startTime) / 1000),
      TIME_LIMIT_PER_QUESTION
    );

    const selectedIndex = selectedOption - 1;
    const isCorrect = selectedIndex === currentQuestion.correctIndex;

    // Provide Immediate Feedback
    if (isCorrect) {
      console.log(`\n✅ CORRECT! Excellent job.`);
    } else {
      const correctText = currentQuestion.choices[currentQuestion.correctIndex];
      console.log(`\n❌ INCORRECT! The correct answer was: ${currentQuestion.correctIndex + 1}. ${correctText}`);
    }

    recordAnswer(selectedIndex, isCorrect, timeTaken);
    advanceGame();
  });
}

/**
 * Stores response into game state
 */
function recordAnswer(selectedIndex, isCorrect, timeTaken) {
  const currentQuestion = gameState.questions[gameState.currentIndex];
  gameState.userAnswers.push({
    questionId: currentQuestion.id,
    selectedIndex,
    isCorrect,
    timeTaken
  });
}

/**
 * Moves to next question or finishes game
 */
function advanceGame() {
  gameState.currentIndex += 1;

  if (gameState.currentIndex < gameState.questions.length) {
    setTimeout(() => {
      presentQuestion();
    }, 1500); // Short delay before next question
  } else {
    endGame();
  }
}

// ==========================================
// 4. GAME LIFECYCLE CONTROLLERS
// ==========================================

/**
 * Initializes and starts trivia session
 */
function startGame() {
  console.clear();
  console.log(`==================================================`);
  console.log(`         WELCOME TO JS CLI TRIVIA GAME           `);
  console.log(`==================================================`);
  console.log(`Instructions:`);
  console.log(`- Answer questions sequentially by selecting 1-4.`);
  console.log(`- You have ${TIME_LIMIT_PER_QUESTION} seconds per question.`);
  console.log(`==================================================\n`);

  rl.question(`Press ENTER to start the quiz... `, () => {
    gameState.questions = prepareQuestions(questionsData);
    gameState.currentIndex = 0;
    gameState.userAnswers = [];
    gameState.gameStartTime = Date.now();
    
    presentQuestion();
  });
}

/**
 * Ends game and outputs final score report
 */
function endGame() {
  stopQuestionTimer();
  const totalDuration = Math.round((Date.now() - gameState.gameStartTime) / 1000);
  const summary = calculateResults(gameState.userAnswers);

  console.log(`\n==================================================`);
  console.log(`                  GAME OVER                       `);
  console.log(`==================================================`);
  console.log(`Final Score:       ${summary.correctCount} / ${summary.totalQuestions} (${summary.percentage}%)`);
  console.log(`Total Time Spent:  ${totalDuration} seconds`);
  console.log(`Avg Time/Question: ${(summary.totalTimeSpent / summary.totalQuestions).toFixed(1)} seconds`);
  console.log(`==================================================`);

  rl.question(`\nWould you like to play again? (y/n): `, (answer) => {
    if (answer.trim().toLowerCase() === 'y') {
      startGame();
    } else {
      console.log(`\nThank you for playing JS CLI Trivia! Goodbye.\n`);
      rl.close();
      process.exit(0);
    }
  });
}

// ==========================================
// 5. EXECUTION ENTRY POINT
// ==========================================
startGame();