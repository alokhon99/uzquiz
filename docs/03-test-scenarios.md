# Uzquiz MVP — Test Scenarios

Role: QA / Tester · Source: `01-requirements.md` · Environment: Chromium, mobile viewport 375 × 812 (and desktop 1280 × 800 for the framed layout).

Legend — **Type**: U = automated unit/content test (`tests/run-tests.mjs`, Node), E = automated end-to-end UI test executed in the browser (`tests/e2e.js`), M = manual/visual check.
**Priority**: P1 Critical · P2 Major · P3 Minor.

## A. Content & data integrity
| ID | Req | Type | Pri | Scenario | Expected result |
|---|---|---|---|---|---|
| TC-01 | §3 | U | P1 | Count rounds and questions | Exactly 6 rounds, 7 questions each, 42 total |
| TC-02 | §3 | U | P1 | Every option question has 4 unique, non-empty options and a valid `answer` index | All pass |
| TC-03 | FR-09 | U | P1 | Every Round 1 question has a picture (`image` or `imageSvg`) | All 7 have a picture |
| TC-04 | FR-15, A-2 | U | P1 | Round 3 chain rule: answer[i] starts with last letter of answer[i-1] (Uzbek digraphs aware) | Holds for i = 2..7 |
| TC-05 | A-4 | U | P1 | Round 6: Q1–6 option type, Q7 text type, final, 20 pts, answer = hidden theme | All true |
| TC-06 | NFR-02 | U | P2 | No question/option text contains Cyrillic or English UI words like "Next", "Score" | None found |
| TC-07 | §3 | U | P2 | Round timers: R1 20 s, R2/4/5/6 30 s, R3 45 s, R6 Q7 60 s | Match |

## B. Logic
| ID | Req | Type | Pri | Scenario | Expected result |
|---|---|---|---|---|---|
| TC-08 | FR-13 | U | P1 | `isTextCorrect` with "toshkent", "  TOSHKENT ", "Toshkent" | true |
| TC-09 | FR-13 | U | P1 | Apostrophe variants: "G‘afur", "Gʻafur", "G`afur", "G'afur" normalise equal | true |
| TC-10 | FR-13 | U | P1 | Alternative answers ("Alisher Navoiy", "Samarkand") accepted; wrong ("Buxoro") rejected; empty rejected | as stated |
| TC-11 | FR-19 | U | P1 | Points: correct with full time = 15, half time = 13, 0 time = 10, wrong = 0, final Q full time = 25, timer off = base only | as stated |
| TC-12 | FR-21 | U | P1 | `maxScore` = 640 (timer on), 430 (timer off) | as stated |
| TC-13 | §4.6 | U | P2 | Rank thresholds 95→Bilimlar sultoni, 70→Zukko, 69→Bilimdon, 30→Izlanuvchi, 29→Yosh bilimdon | as stated |
| TC-14 | FR-02 | U | P2 | `sanitizeName`: "" → "O'yinchi", "   " → "O'yinchi", 25-char name → 20 chars, "  Ali   Vali " → "Ali Vali" | as stated |
| TC-15 | FR-26 | U | P2 | `topRecords` sorts score desc, ties by newest date, max 10 | as stated |
| TC-16 | FR-31 | U | P1 | `isValidState` rejects null, string, wrong round index, negative score, missing arrays | false for each |
| TC-17 | FR-10 | U | P3 | `shuffle` returns a permutation and does not mutate input | true |

## C. Home & navigation (E2E)
| ID | Req | Type | Pri | Scenario | Expected result |
|---|---|---|---|---|---|
| TC-18 | FR-01 | E | P1 | Open app with clean storage | Logo "Uzquiz", buttons Boshlash / Qanday o'ynaladi? / Rekordlar / Sozlamalar visible; no Continue button; no best score card |
| TC-19 | FR-29 | E | P2 | Tap "Qanday o'ynaladi?" then back | Screen lists 6 rounds + scoring; back returns home |
| TC-20 | FR-26 | E | P2 | Open Rekordlar with no records | Empty state message shown |
| TC-21 | FR-28 | E | P2 | Toggle Ovoz/Tebranish/Taymer, reload | States persisted after reload |
| TC-22 | FR-02 | E | P2 | Enter name "Dilnoza", start, quit, reload | Name field pre-filled with "Dilnoza" |

## D. Gameplay (E2E)
| ID | Req | Type | Pri | Scenario | Expected result |
|---|---|---|---|---|---|
| TC-23 | FR-05 | E | P1 | Start game | Intro "Raund 1 / 6", title "Rasmli savollar", Boshlash button |
| TC-24 | FR-06/07/08/09 | E | P1 | Tap Boshlash | Header "Savol 1 / 7", score pill, progress bar, timer showing 20, picture, 4 options |
| TC-25 | FR-11/14/19 | E | P1 | Tap the correct option | Option green, others locked, feedback "To'g'ri!", +15 (or 14) points, score pill updated |
| TC-26 | FR-11/14 | E | P1 | Tap a wrong option | Chosen red, correct green, "Noto'g'ri", +0, "To'g'ri javob" shown |
| TC-27 | NFR-08 | E | P1 | Tap two options rapidly (double tap) | Only one answer is recorded |
| TC-28 | FR-08 | E | P1 | Let timer expire (simulated) | "Vaqt tugadi", 0 points, correct answer highlighted |
| TC-29 | FR-10 | E | P3 | Option order differs between two new games (statistically) | Orders differ at least once over 2 games |
| TC-30 | FR-12/15 | E | P1 | Round 3 Q1 | Text input, hint "«T» harfi bilan boshlanadi · 7 ta harf", 7 letter boxes (Uzbek alphabet: "sh" is one letter → T-o-sh-k-e-n-t) |
| TC-31 | FR-12 | E | P2 | Submit empty text | Nothing recorded, input shakes |
| TC-32 | FR-13 | E | P1 | Type " toshkent " and press Enter | Accepted as correct |
| TC-33 | FR-15 | E | P1 | Round 3 Q2 hint | Shows last letter of previous answer: «T» |
| TC-34 | FR-12 | E | P2 | Tap "O'tkazib yuborish" | Feedback "O'tkazib yuborildi", 0 points, correct answer shown |
| TC-35 | FR-16 | E | P1 | Round 6 Q1–6 | Hidden theme word not visible anywhere on screen |
| TC-36 | FR-16/19 | E | P1 | Round 6 Q7 type "Samarqand" | Correct, theme revealed, +20..25 |
| TC-37 | FR-20 | E | P3 | 3 correct in a row | "🔥 3 ketma-ket" badge on next question |
| TC-38 | FR-22 | E | P1 | Finish a round | Round result "X / 7", round points, total, "Keyingi raund" |
| TC-39 | FR-22/23 | E | P1 | Complete all 6 rounds answering all correct | Final screen: 42/42, 100 %, "Bilimlar sultoni", 3 stars, breakdown 7/7 ×6, score = sum of points |
| TC-40 | FR-26 | E | P1 | After finishing | Record saved; Rekordlar shows it; home shows best score |
| TC-41 | FR-23 | E | P2 | Tap "Qayta o'ynash" | New game starts at Round 1 intro with score 0 |
| TC-42 | FR-24 | E | P3 | Tap "Ulashish" (no Web Share API) | Toast shown (copied / text) without error |

## E. Interruptions & persistence (E2E)
| ID | Req | Type | Pri | Scenario | Expected result |
|---|---|---|---|---|---|
| TC-43 | FR-18/17 | E | P1 | Tap ✕ during a question | Dialog shown; timer paused (value unchanged after 2 s) |
| TC-44 | FR-18 | E | P1 | Dialog → "Davom etish" | Dialog closes, timer resumes |
| TC-45 | FR-18/03 | E | P1 | Dialog → "Chiqish" | Home with "Davom ettirish" showing round/question/score |
| TC-46 | FR-30 | E | P1 | Answer Q1–Q3 of round 2, reload page, Continue | Resumes at round 2 Q4 with same score |
| TC-47 | FR-30 | E | P1 | Reload while feedback panel is shown, Continue | Answer is not lost and not counted twice; continues at next question |
| TC-48 | FR-03 | E | P1 | With saved game tap "O'yinni boshlash" | Confirmation dialog; "Bekor qilish" keeps saved game; "Ha" starts new |
| TC-49 | FR-31 | E | P1 | Put corrupt JSON in all storage keys, reload | App loads home normally, no errors |
| TC-50 | FR-17 | E | P2 | Simulate tab hidden for 3 s | Timer does not decrease while hidden |
| TC-51 | FR-27 | E | P2 | Rekordlar → tozalash → confirm | Records list empty |
| TC-52 | FR-28 | E | P2 | Timer off, start game | No timer ring; "∞ Vaqt cheklanmagan"; correct = exactly 10 pts |
| TC-53 | M | E | P2 | Escape key / backdrop tap on "new game" confirmation | Acts as cancel (saved game kept) |

## F. UI / non-functional
| ID | Req | Type | Pri | Scenario | Expected result |
|---|---|---|---|---|---|
| TC-54 | NFR-01/03 | M | P2 | Every screen at 375 × 812 and 320 × 568 | No horizontal scroll, nothing cut off, buttons ≥ 44 px |
| TC-55 | NFR-01 | M | P3 | Desktop 1280 × 800 | App shown centered in phone frame |
| TC-56 | NFR-08 | E | P1 | Full game run | Zero console errors |
| TC-57 | NFR-05 | U | P3 | Bundle size of `app/` | < 300 KB |
| TC-58 | NFR-07/06 | U | P2 | Manifest valid JSON with name, icons, display=standalone; SW caches all app files | true |
| TC-59 | NFR-02 | E | P2 | Scan visible text of every screen for English words (Next, Score, Start, Back, Settings) | None |
| TC-60 | NFR-04 | E | P3 | All buttons have text or aria-label; `html[lang=uz]` | true |
