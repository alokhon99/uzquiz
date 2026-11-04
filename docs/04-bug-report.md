# Uzquiz MVP — Test Execution & Bug Report

Environment: Chromium (Claude browser pane), viewports 375 × 812, 320 × 568, desktop · Server `node serve.mjs` · Build MVP 1.0
Automation: `node tests/run-tests.mjs` (unit/content) · `tests/e2e.js` executed in the page (E2E) · manual visual checks.

---

## Iteration 1 — 2026-11-04

### Execution summary
| Suite | Scenarios | Pass | Fail |
|---|---|---|---|
| Unit / content (TC-01…17, 57, 58) | 19 | 18 | 1 (test defect TD-01) |
| E2E home/settings/full game (TC-18…42, 56, 59, 60) | 46 checks | 38 | 8 (test defects TD-02, TD-03) |
| E2E interruptions/persistence (TC-43…53) | 27 checks | 26 | 1 (test defect TD-02) |
| Manual visual / console (TC-54, 55, 56) | 3 | 0 | 3 → bugs below |

### Test defects (fixed in test code, not app bugs)
| ID | Description | Fix |
|---|---|---|
| TD-01 | TC-57 used `URL.pathname`, which keeps `%20` for the space in "Uzquiz app" → ENOENT | Use `fileURLToPath` |
| TD-02 | TC-23 / TC-48c compared `innerText` "Raund 1 / 6" case-sensitively; the label is styled `text-transform: uppercase`, so `innerText` returns "RAUND 1 / 6" | Case-insensitive compare |
| TD-03 | TC-30 expected 8 letter boxes for "Toshkent"; in the Uzbek alphabet **sh** is one letter (T-o-sh-k-e-n-t = 7). App behaviour is correct; scenario updated | Expectation → 7 |

### Bugs found
| ID | Severity | Scenario | Title | Steps to reproduce | Expected | Actual |
|---|---|---|---|---|---|---|
| BUG-01 | Minor | TC-56 | Console errors from `navigator.vibrate` | Open app, play (feedback after timeout or synthetic clicks) | No console errors (NFR-08) | Chrome logs "Blocked call to navigator.vibrate because user hasn't tapped…" (73 errors in one run) |
| BUG-02 | Minor | TC-54 | "O'tkazib yuborish" label wraps to 2 lines | Round 3 at 375 px | Single-line button | Label breaks into two lines, button taller than "Javob berish" |
| BUG-03 | Minor | TC-54 | Final screen "🏠 Bosh sahifa" label wraps / clipped | Finish a game at 375 px | Single line | Text wraps, second line cut off by viewport |
| BUG-04 | **Major** | TC-54 | On 320 × 568 phones the 4th answer option is below the fold | Start game on 320 × 568, Round 1 Q1 | All 4 options visible without scrolling during a timed question | Last option bottom at 648 px (viewport 568 px); player must scroll while timer runs |
| BUG-05 | Minor | TC-54 | Home "O'yinni boshlash" CTA below the fold on 320 × 568 | Open home on 320 × 568 with a record | Primary CTA visible | CTA hidden; must scroll |
| BUG-06 | Minor | TC-40 | "🏆 Yangi rekord!" shown when score only ties the previous best | Have record 100, finish another game with 100 | No "new record" on tie | Label shown |
| BUG-07 | Minor | TC-34/36 | Letter-hint boxes stay empty after answering | Answer/skip a text question | Boxes reveal the correct word | Boxes remain empty (only first letter) |
| BUG-08 | Minor | TC-36 | Duplicate answer in Round 6 Q7 feedback | Answer theme question | Theme shown once | "Yashirin mavzu: Samarqand" **and** "To'g'ri javob: Samarqand" both shown |
| BUG-09 | Minor | TC-60 | Screen reader re-announces the whole screen on every render | `aria-live="polite"` on `<main id="app">` | Only feedback / toast announced | Entire app container is a live region |

---

### Fixes delivered (Developer) — build 1.0.1
| Bug | Fix | File |
|---|---|---|
| BUG-01 | `vibrate()` only called after sticky user activation (`navigator.userActivation.hasBeenActive`) | `app/js/app.js` |
| BUG-02, BUG-03 | `.btn-row .btn` → `white-space: nowrap`, `min-width: 0`, 15.5 px, tighter padding | `app/css/styles.css` |
| BUG-04, BUG-05 | New `@media (max-height: 620px)` compact layout: smaller timer/picture/options, hidden round chips, smaller logo | `app/css/styles.css` |
| BUG-06 | New `isNewRecord()` — strictly greater than the previous best; computed before saving the record | `app/js/logic.js`, `app/js/app.js` |
| BUG-07 | After answer/skip the letter boxes reveal the correct word (green = correct, red = wrong) | `app/js/app.js`, `app/css/styles.css` |
| BUG-08 | "To'g'ri javob" line hidden for the final theme question (theme reveal is shown instead) | `app/js/app.js` |
| BUG-09 | `aria-live` removed from `<main>`; feedback keeps `role="alert"`, toast keeps `aria-live` | `app/index.html` |
| — | Service-worker cache bumped to `uzquiz-v2` so installed copies update | `app/sw.js` |

New regression tests: `TC-61` (unit, isNewRecord), E2E suites `regression` (BUG-02/03/06/07/08/09) and `small` (BUG-04/05 at 320 × 568).

---

## Iteration 2 — retest of build 1.0.1
| Suite | Checks | Pass | Fail |
|---|---|---|---|
| Unit / content | 20 | 20 | 0 |
| E2E all suites @ 375 × 812 (incl. per-suite "no JS errors" checks) | 90 | 90 | 0 |
| E2E `small` @ 320 × 568 | 3 | 3 | 0 |
| Console errors during whole run | — | 0 new | — |

BUG-01…BUG-09 → **Verified fixed / Closed**.

### New bug found in exploratory testing
| ID | Severity | Title | Steps | Expected | Actual |
|---|---|---|---|---|---|
| BUG-10 | Minor | No way to leave the game from the round-result screen | Finish any round → round-result screen | ✕ exit available (as on question/intro screens), progress saved | Only "Keyingi raund" button; player is forced to continue |

**Fix (build 1.0.2):** round-result screen gets the same top bar with ✕ → exit dialog → progress saved with `phase: roundEnd`, so "Davom ettirish" returns to the same round result. Regression suites `roundEndExit1/2` added.

---

## Iteration 3 — retest of build 1.0.2 (full regression)
| Suite | Checks | Pass | Fail |
|---|---|---|---|
| Unit / content (`node tests/run-tests.mjs`) | 20 | 20 | 0 |
| E2E home, settings, full game, mixed, regression, BUG-10, persistence, timer-off, records, corrupt data @ 375 × 812 (incl. per-suite "no JS errors" checks) | 96 | 96 | 0 |
| E2E `small` @ 320 × 568 (all 42 questions fit without scrolling, no horizontal scroll) | 3 | 3 | 0 |
| Browser console (between ITER3-START / ITER3-END markers) | — | 0 errors, 0 warnings | — |
| Exploratory visual pass (home, intro, question, text round, feedback, round result, final, records, settings; desktop frame) | — | OK | — |

BUG-10 → **Verified fixed / Closed**.

## Final status
| Severity | Found | Fixed | Open |
|---|---|---|---|
| Critical | 0 | 0 | 0 |
| Major | 1 | 1 | 0 |
| Minor | 9 | 9 | 0 |
| **Total** | **10** | **10** | **0** |

✅ Exit criterion met: an iteration finished with **no bugs found**. The MVP meets the acceptance criteria in `01-requirements.md` §8.

Known limitations (not defects, outside the MVP's test reach): real-device haptics/audio and on-screen keyboard overlap on iOS/Android were not tested on physical hardware. Native Web Share sheet was only tested via its clipboard fallback.

---

## Release 1.1 — Question editor (admin.html) — 2026-11-04
| Suite | Checks | Pass | Fail |
|---|---|---|---|
| Unit (`run-tests.mjs`, incl. TC-62…64: validator, canonical file format, round-trip) | 23 | 23 | 0 |
| Editor E2E `admin-e2e.js` (edit, validation, draft restore, mocked GitHub publish, 401 error) | 25 | 25 | 0 |
| Game regression E2E (home, full game, mixed, regression, timer off, records) | 72 | 72 | 0 |
| Preview mode (draft questions shown, separate `.preview` storage, live game unaffected) | 3 | 3 | 0 |

Bugs found and fixed during this release:
| ID | Severity | Title | Fix |
|---|---|---|---|
| BUG-11 | Minor | Round tabs showed a "0" error badge for rounds with no errors (`display:grid` overrode `hidden`) | `.tab .badge[hidden]{display:none}` |
| BUG-12 | Minor | "O'yinni ochish" link-button rendered underlined in link colour | `a.btn` resets decoration/colour |
| BUG-13 | Minor | Editor textareas used the browser's monospace font | `textarea { font: inherit }` |

Test defect: AD-02 expected 1 error after breaking the word chain; changing one answer correctly breaks two links (Q3 and Q4) → expectation updated to 2.
Not tested: a real publish to GitHub (needs your token); the publish code was verified against a mocked GitHub API.
