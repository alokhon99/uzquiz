# Uzquiz 2.0-α — Test Scenarios (packs & media)

Role: QA · Source: `07-requirements-v2-packs.md` (increment 2.0-α: Epics 1, 2, 3, 7 without sales, 8) · Builds on `03-test-scenarios.md` (1.x rules still apply to the "Uzquiz Klassik" pack).

**Type:** U = unit/content (`node tests/run-tests.mjs`), E = in-browser E2E (`tests/e2e.js`, `tests/admin-e2e.js`), M = manual/visual. **Viewport:** 375 × 812 unless noted.

## A. Content & format (automated, U)
| ID | Req | Scenario | Expected |
|---|---|---|---|
| U-01 | PS-01…03, AD-06 | Every `packs/*/pack.json` validated | 0 errors, 0 warnings; id = folder |
| U-02 | PK-01 | `packs/index.json` vs packs | One entry per pack, identical to `catalogueEntry()`; all free in α |
| U-03 / U-04 | MD-03 | Media files | Every referenced file exists, within size limit; no orphan files |
| U-05 / U-06 | AD-11 | Klassik migration | Pack equals `migrateV1(v1 bank)`; chain and hidden theme intact |
| U-07 | NF-10 | Language | No Cyrillic in any pack |
| U-08 | MD-09, MD-11 | Accessibility & rights | Every image/video has alt text; every file has source, licence, holder |
| U-10…13 | 1.x | Answer matching, points, ranks, records | As in 1.x |
| U-12 | PS-05 | Max score per pack | Klassik 640 / 430, Diqqat 105, speed-bonus-off variant correct |
| U-20 | AD-06 | Validator negative cases | Duplicate/too few/too many options, missing alt, missing rights, bad trim, bad True/False, chain break, chain non-text, theme mismatch, 0 or 11 rounds, 21 questions, bad id, bad category, final outside theme, replays > 5 |
| U-21 | AD-03 | New-pack templates | Blank pack fails; filled blank passes; theme round template ends with final question |
| U-22 | PK-01…03, BR-05, BR-08 | Catalogue helpers | Only published shown, newest first; search title + description, case-insensitive; category filter; "Yangi" ≤ 14 days |
| U-23 | PF-02 | Saved game guard | Rejects other pack, bad round, wrong option-order length, garbage |
| U-24 | — | Canonical files | pack.json / index.json byte-identical to serializer output |
| U-30…33 | NF-08, NFR-05/07, NF-10 | Shell | SW precaches every shell file; app code < 300 KB; manifest; no English UI |

## B. Catalogue & pack page (E)
| ID | Req | Scenario | Expected |
|---|---|---|---|
| V-01 | PK-01/02 | Open app, clean storage | 3 pack cards with cover, title, description, "N savol · ~M daq", media icons, "Bepul" badge |
| V-02 | PK-03 | Search "ritm" | Only "Tovushlar va ritm" |
| V-03 | PK-03 | Tap category "Mantiq va diqqat" | Only "Diqqat sinovi"; "Hammasi" resets |
| V-04 | PK-03 | Search "zzzz" | Empty-state message |
| V-05 | PK-04 | Open pack | Cover, category, age, "Bepul", title, description, rounds/questions/minutes, media chips, round list, name field, "O'ynash" |
| V-06 | PF-01 | Back from pack page | Catalogue |
| V-07 | PF-04 | Deep link `#/pack/tovushlar` on fresh load | Opens that pack page |
| V-08 | PF-04 | Share pack (no Web Share API) | Link `…#/pack/<id>` copied, toast shown |

## C. Media questions (E)
| ID | Req | Scenario | Expected |
|---|---|---|---|
| V-20 | MD-01, MD-04 | Image question | Skeleton until loaded; timer starts after image load |
| V-21 | MD-04 | Video question before ▶ | Timer greyed and not counting; "▶ bosing" chip |
| V-22 | MD-04 | Tap ▶ | Video plays inline; timer starts with playback |
| V-23 | MD-05 | Replays (max 1) | After end: "Qayta (1)"; after 2nd end: no replay, ▶ disabled |
| V-24 | MD-05 | Answer while playing | Playback stops; controls disabled |
| V-25 | MD-06 | Trimmed clip (0.3–5.6 s) | Playback starts ≥ 0.3 s and stops at 5.6 s |
| V-26 | PS-03 | True/False question | Two buttons; correct/wrong marking as for options |
| V-27 | MD-04 | Audio buffering (`waiting`) | Timer pauses; resumes on `playing` |
| V-28 | MD-10, BR-07 | Media fails to load | 2 retries, then "Media yuklanmadi" + "Jarimasiz o'tkazish"; question excluded from accuracy and totals |
| V-29 | MD-07 | Next question media | Requested in advance (network log) |

## D. Game flow per pack (E)
| ID | Req | Scenario | Expected |
|---|---|---|---|
| V-10 | PS-06 | Full Klassik game, all correct | 42/42, 100 %, "Bilimlar sultoni", score = sum of points |
| V-11 | PF-03 | Final screen | 2 recommended packs (same category first) |
| V-12 | PF-04 | Share result | Text contains pack name + pack link |
| V-13 | PS-07, BR-06 | Records | Record saved with pack id/title; records screen filters by pack |
| V-30 | PF-01 | Android back during a game | Exit dialog; game continues on "Davom etish" |
| V-31 | PF-02 | Exit → pack page | "Davom ettirish" with round and score |
| V-32 | PF-02 | Two packs in progress | Both shown in catalogue "Davom ettirish" row and badge |
| V-33 | PF-02 | Reload and resume each | Correct pack, position and score |
| V-34 | AD-11 | 1.x saved game + records in storage | Migrated to Klassik: resumable, records labelled "Uzquiz Klassik" |
| V-35 / V-36 | NF-08 | Catalogue fetch fails | Error state with "Qayta urinish"; retry recovers |
| V-37 | FR-31 | Corrupt saved data | App loads normally |
| V-38 | FR-28 | Timer off | No timer; base points only |
| V-50… | 1.x | Klassik regression: wrong answer, double tap, timeout, exit pause, visibility pause, empty/skip text, chain hints, theme reveal, Escape cancels dialog | As 1.x |
| V-60 | NF-09 | 320 × 568 | Catalogue usable; media question options visible without scrolling |

## E. Admin (E, publishing mocked)
| ID | Req | Scenario | Expected |
|---|---|---|---|
| AD-01 | AD-03 | Pack list | All packs with status; "＋ Yangi paket" |
| AD-02 | AD-03 | Create pack (title → auto id) | Draft editor opens; blank pack shows errors; taken id rejected |
| AD-03 | AD-04 | Settings: category, age, speed bonus, show correct | Saved to draft |
| AD-04 | PS-01/02 | Add round, change kind to chain/theme | Questions converted; theme adds final question |
| AD-05 | PS-03 | Add choice / True-False / text questions; add/remove options (2–6); mark correct | Model and validation update |
| AD-06 | AD-05, MD-03 | Upload PNG | Converted to WebP ≤ 1280 px, content-hash name, stored locally, preview shown |
| AD-07 | MD-03 | Upload wrong type / > 60 s audio | Rejected with clear message |
| AD-08 | MD-09, MD-11 | Missing alt / rights | Blocks "Nashr qilingan"/"Ko'rib chiqishda"; draft save allowed |
| AD-09 | AD-07 | "Sinash" | Game opens the draft (incl. unpublished media) in preview mode, records kept separate |
| AD-10 | AD-03 | Save via GitHub (mocked) | One commit per branch: pack.json + new media + updated index.json under correct paths; status applied; pending media cleared |
| AD-11 | — | 401 from GitHub | Clear error, retry possible |
| AD-12 | AD-03 | Duplicate pack | New id, draft status, media copied |
| AD-13 | — | Draft survives reload; "Qoralamani bekor qilish" restores live version | — |
