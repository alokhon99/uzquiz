# Uzquiz — O'zbekcha viktorina (MVP 1.0.2)

Mobile-first PWA quiz game in Uzbek: 6 rounds × 7 questions. No dependencies, no build step.

## Run
```bash
node serve.mjs 5173
```
Open http://localhost:5173 (use the browser's phone/device mode, or open it from a phone on the same network).

## Test
```bash
node tests/run-tests.mjs
```
E2E suites (`tests/e2e.js`) run inside the open app page: `const m = await import('/__tests/e2e.js'); await m.run('full')`.

## Structure
| Path | What |
|---|---|
| `app/index.html`, `app/css/styles.css` | Shell & design |
| `app/js/questions.js` | Question bank (42 questions) |
| `app/js/logic.js` | Pure game logic (scoring, answer matching, Uzbek letters) |
| `app/js/app.js` | Screens, timer, persistence, sounds |
| `app/sw.js`, `app/manifest.webmanifest` | Offline + installable |
| `docs/01-requirements.md` | BRD (Business Analyst) |
| `docs/03-test-scenarios.md` | 61 test scenarios |
| `docs/04-bug-report.md` | Test iterations & bugs |
| `docs/05-foydalanuvchi-qollanmasi.md` | User manual (Uzbek) |
