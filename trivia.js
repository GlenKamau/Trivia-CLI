#!/usr/bin/env node

const readline = require("readline");

const QUESTION_TIME_LIMIT_SEC = 15;
const GAME_TIME_LIMIT_SEC = 90;
const WARNING_AT_SEC = 5;
const QUESTIONS_PER_GAME = 5;

const questionBank = [
  {
    question: "Which keyword declares a block-scoped variable that can be reassigned?",
    choices: ["var", "let", "const", "static"],
    answer: 1,
  },
  {
    question: "What does `typeof null` return in JavaScript?",
    choices: ["'null'", "'undefined'", "'object'", "'number'"],
    answer: 2,
  },
  {
    question: "Which array method returns a NEW array of items that pass a test?",
    choices: ["map", "filter", "forEach", "push"],
    answer: 1,
  },
  {
    question: "Which function schedules code to run once after a delay?",
    choices: ["setInterval", "setImmediate", "setTimeout", "delay"],
    answer: 2,
  },
  {
    question: "What is the result of `'5' + 3` in JavaScript?",
    choices: ["8", "'53'", "NaN", "TypeError"],
    answer: 1,
  },
  {
    question: "Which method converts a JSON string into a JavaScript object?",
    choices: ["JSON.stringify", "JSON.parse", "JSON.object", "JSON.decode"],
    answer: 1,
  },
  {
    question: "Which operator checks both value AND type equality?",
    choices: ["==", "=", "===", "!="],
    answer: 2,
  },
];

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function selectQuestions(count) {
  return shuffle(questionBank).slice(0, count);
}

function formatChoices(choices) {
  return choices
    .map((choice, index) => `  ${String.fromCharCode(65 + index)}) ${choice}`)
    .join("\n");
}

function parseAnswer(input, choiceCount) {
  const cleaned = input.trim().toUpperCase();
  let index = -1;

  if (/^[A-Z]$/.test(cleaned)) {
    index = cleaned.charCodeAt(0) - 65;
  } else if (/^\d+$/.test(cleaned)) {
    index = Number(cleaned) - 1;
  }

  return index >= 0 && index < choiceCount ? index : -1;
}

function isCorrect(question, chosenIndex) {
  return chosenIndex === question.answer;
}

function askWithTimeout(rl, prompt, timeLimitMs) {
  return new Promise((resolve) => {
    const controller = new AbortController();
    let warningTimer = null;

    const limitTimer = setTimeout(() => controller.abort(), timeLimitMs);

    const warningDelay = timeLimitMs - WARNING_AT_SEC * 1000;
    if (warningDelay > 0) {
      warningTimer = setTimeout(() => {
        console.log(`\n  (!) ${WARNING_AT_SEC} seconds left...`);
        rl.prompt(true);
      }, warningDelay);
    }

    const cleanup = () => {
      clearTimeout(limitTimer);
      clearTimeout(warningTimer);
    };

    controller.signal.addEventListener(
      "abort",
      () => {
        cleanup();
        resolve({ answer: null, timedOut: true });
      },
      { once: true }
    );

    try {
      rl.question(prompt, { signal: controller.signal }, (answer) => {
        cleanup();
        resolve({ answer, timedOut: false });
      });
    } catch (error) {
      cleanup();
      resolve({ answer: null, timedOut: false });
    }
  });
}

function buildSummary(results, totalQuestions, elapsedSec) {
  const correctCount = results.filter((r) => r.correct).length;
  const timedOutCount = results.filter((r) => r.timedOut).length;
  const answeredCount = results.length;
  const percent = totalQuestions
    ? Math.round((correctCount / totalQuestions) * 100)
    : 0;
  const totalAnswerTime = results.reduce((sum, r) => sum + r.timeSec, 0);
  const avgTime = answeredCount ? (totalAnswerTime / answeredCount).toFixed(1) : "0.0";

  let rating = "Keep practicing - you'll get there!";
  if (percent === 100) rating = "Perfect score! Trivia master!";
  else if (percent >= 80) rating = "Excellent work!";
  else if (percent >= 50) rating = "Nice effort - solid result.";

  return [
    "",
    "=============== GAME OVER ===============",
    `  Score:            ${correctCount} / ${totalQuestions} (${percent}%)`,
    `  Questions asked:  ${answeredCount}`,
    `  Timed out:        ${timedOutCount}`,
    `  Avg. answer time: ${avgTime}s`,
    `  Total game time:  ${elapsedSec.toFixed(1)}s`,
    `  ${rating}`,
    "=========================================",
    "",
  ];
}

function printReview(results) {
  if (results.length === 0) return;
  console.log("Review:");
  results.forEach((r, i) => {
    const mark = r.correct ? "[correct]  " : r.timedOut ? "[timed out]" : "[wrong]    ";
    console.log(`  ${i + 1}. ${mark} ${r.question}`);
  });
  console.log("");
}

async function startGame(rl) {
  const questions = selectQuestions(QUESTIONS_PER_GAME);
  const results = [];

  console.log("\n=========== CLI TRIVIA GAME ===========");
  console.log(`  ${questions.length} questions | ${QUESTION_TIME_LIMIT_SEC}s per question | ${GAME_TIME_LIMIT_SEC}s total`);
  console.log("  Answer with a letter (A-D) or a number (1-4).");
  console.log("=======================================\n");

  const gameStart = Date.now();
  const gameDeadline = gameStart + GAME_TIME_LIMIT_SEC * 1000;

  for (let i = 0; i < questions.length; i++) {
    const current = questions[i];
    const msLeftInGame = gameDeadline - Date.now();

    if (msLeftInGame <= 0) {
      console.log("\nThe game time limit has been reached!");
      break;
    }

    const limitMs = Math.min(QUESTION_TIME_LIMIT_SEC * 1000, msLeftInGame);

    console.log(`Question ${i + 1} of ${questions.length}  (${Math.ceil(limitMs / 1000)}s)`);
    console.log(current.question);
    console.log(formatChoices(current.choices));

    const questionStart = Date.now();
    let chosenIndex = -1;
    let timedOut = false;

    while (chosenIndex === -1) {
      const remaining = limitMs - (Date.now() - questionStart);
      if (remaining <= 0) {
        timedOut = true;
        break;
      }

      const { answer, timedOut: expired } = await askWithTimeout(rl, "> ", remaining);

      if (expired || answer === null) {
        timedOut = true;
        break;
      }

      chosenIndex = parseAnswer(answer, current.choices.length);
      if (chosenIndex === -1) {
        console.log(`  Please enter a letter A-${String.fromCharCode(64 + current.choices.length)} or a valid number.`);
      }
    }

    const timeSec = (Date.now() - questionStart) / 1000;
    const correct = !timedOut && isCorrect(current, chosenIndex);

    if (timedOut) {
      console.log(`\n  Time's up! The correct answer was ${String.fromCharCode(65 + current.answer)}) ${current.choices[current.answer]}.\n`);
    } else if (correct) {
      console.log("\n  Correct! +1 point\n");
    } else {
      console.log(`\n  Incorrect. The correct answer was ${String.fromCharCode(65 + current.answer)}) ${current.choices[current.answer]}.\n`);
    }

    results.push({ question: current.question, correct, timedOut, timeSec });
  }

  const elapsedSec = (Date.now() - gameStart) / 1000;
  buildSummary(results, questions.length, elapsedSec).forEach((line) => console.log(line));
  printReview(results);
}

function askYesNo(rl, prompt) {
  return new Promise((resolve) => {
    try {
      rl.question(prompt, (answer) => resolve(/^y(es)?$/i.test(answer.trim())));
    } catch (error) {
      resolve(false);
    }
  });
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    let playing = await askYesNo(rl, "Welcome to CLI Trivia! Start a game? (y/n) ");

    while (playing) {
      await startGame(rl);
      playing = await askYesNo(rl, "Play again? (y/n) ");
    }

    console.log("Thanks for playing. Goodbye!");
  } catch (error) {
    console.error("Unexpected error:", error.message);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

main();