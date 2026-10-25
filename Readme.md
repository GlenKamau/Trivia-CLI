# CLI Trivia Game

A terminal trivia game written in plain JavaScript (Node.js 16+; no dependencies).

## Run

```bash
node trivia.js
```

Answer with a letter (`A`-`D`) or number (`1`-`4`).

## Features

| Requirement | Where |
|---|---|
| Start a game / view questions sequentially | `startGame()` loops through the selected questions |
| Select answers | `parseAnswer()` accepts letters or numbers, re-prompts on invalid input |
| Immediate feedback | Correct / incorrect / time's up message after every question |
| Timers | `setTimeout` per-question limit (15s) with a 5s warning, plus a 90s game cap |
| Arrays + iteration methods | `questionBank`, `map` (choice formatting), `filter` and `reduce` (summary stats), `forEach` (review) |
| Objects | Each question is `{ question, choices, answer }`; each result is `{ question, correct, timedOut, timeSec }` |
| Game-over feedback | `buildSummary()` shows score, %, timeouts, average time, total time |

## Configuration

Edit the constants at the top of `trivia.js`: `QUESTION_TIME_LIMIT_SEC`, `GAME_TIME_LIMIT_SEC`, `QUESTIONS_PER_GAME`. Add questions to `questionBank` (`answer` is the zero-based index of the correct choice).

## Testing checklist

- All correct, all wrong, and mixed answers -> score and percentage are right
- Invalid input (`zzz`, `9`, blank) -> re-prompt, timer keeps running
- No input -> "Time's up!" and the game moves on
- Lower `GAME_TIME_LIMIT_SEC` to confirm the overall cap ends the game early
- Ctrl+D / Ctrl+C -> exits cleanly

## Version control

```bash
git init
git add .
git commit -m "Add CLI trivia game"
```

Commit small changes with clear messages (e.g. "Add timeout warning"), and review the question bank periodically to keep it accurate.