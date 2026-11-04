# Uzquiz — MVP Business Requirements Document (BRD)

| Item | Value |
|---|---|
| Product | **Uzquiz** — mobile quiz game in the Uzbek language |
| Version | MVP 1.0 |
| Author role | Senior Business Analyst |
| Date | 2026-11-04 |
| Status | Approved for build |

---

## 1. Purpose & vision

Uzquiz is a modern, mobile-first trivia game that entertains and educates Uzbek-speaking users through six themed rounds. The MVP must feel like a polished native app (smooth animations, large touch targets, instant feedback) while running in any modern mobile browser and being installable to the home screen (PWA) and playable offline.

### 1.1 Business goals
| ID | Goal | Success metric (post-launch) |
|---|---|---|
| BG-1 | Deliver an engaging Uzbek-language quiz | ≥ 60 % of started games are completed |
| BG-2 | Promote Uzbek culture & language | 100 % of UI and content in Uzbek (Latin script) |
| BG-3 | Frictionless mobile access | First playable screen < 2 s on 4G; works offline after first visit |
| BG-4 | Replayability | ≥ 25 % of players start a 2nd game in the same session |

### 1.2 Scope
**In scope (MVP):** single-player game of 6 rounds × 7 questions, scoring, timer, results, local records, settings, how-to-play, resume interrupted game, offline/PWA, Uzbek UI.
**Out of scope (MVP):** user accounts/backend, multiplayer, leaderboards online, in-app purchases, ads, content admin panel, Cyrillic/Russian/English UI, push notifications.

### 1.3 Assumptions & clarifications
| # | Topic | Decision |
|---|---|---|
| A-1 | The brief lists rounds numbered 1, 2, 3, 4, 6, 7 but states "6 rounds". | The game has **exactly 6 rounds**, numbered 1–6 in the app: Picture → 4 options → Word chain → Cinema → Music → Hidden theme. |
| A-2 | Round 3 rule "answer of next question ends with last letter of previous question". | Interpreted as the classic Uzbek *so'z zanjiri*: **each next answer STARTS with the last letter of the previous answer**. The app shows that letter as a hint. |
| A-3 | Rounds 4–5 answer format not specified. | 4 answer options (same as round 2) for fast mobile play. |
| A-4 | Round 6 "logical question on hidden theme". | Questions 1–6 are clues (4 options) whose answers share one hidden theme; question 7 asks the player to type the hidden theme. |
| A-5 | Pictures. | Pictures are bundled vector/emoji illustrations (no network needed, crisp on any screen). |
| A-6 | Uzbek script. | Uzbek **Latin** alphabet (official). Answer checking tolerates apostrophe variants (o' / oʻ / o’ / o\`) and letter case. |

---

## 2. Users / personas
| Persona | Description | Needs |
|---|---|---|
| **Dilnoza, 19, student** | Plays on phone during commute | Short sessions, ability to pause/resume, attractive design |
| **Akmal, 35, office worker** | Likes trivia, competitive | Score, speed bonus, personal records |
| **Mohira, 12, pupil** | Younger player | Easy round with pictures, clear Uzbek text, hints |

---

## 3. Game structure

| Round | Uzbek title | Question type | Qs | Timer | Answer input |
|---|---|---|---|---|---|
| 1 | Rasmli savollar | Easy questions with a picture | 7 | 20 s | 4 options |
| 2 | Bilimdon | General knowledge | 7 | 30 s | 4 options |
| 3 | So'z zanjiri | Logic word-chain | 7 | 45 s | Typed text |
| 4 | Kino olami | Cinema | 7 | 30 s | 4 options |
| 5 | Musiqa sadosi | Music | 7 | 30 s | 4 options |
| 6 | Yashirin mavzu | Hidden-theme logic | 7 | 30 s (Q7: 60 s) | Q1–6 options, Q7 typed |

Total: **42 questions**.

---

## 4. Functional requirements

### 4.1 Home screen
| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Show app logo "Uzquiz", tagline, and buttons: **O'yinni boshlash**, **Qanday o'ynaladi?**, **Rekordlar**, **Sozlamalar**. | Must |
| FR-02 | Player enters a name (1–20 chars, trimmed). Empty name → default "O'yinchi". Name is remembered for next visit. | Must |
| FR-03 | If an unfinished game exists, show **Davom ettirish** (Continue) button with round/question info. Starting a new game asks for confirmation before discarding it. | Must |
| FR-04 | Show the player's best score on the home screen when one exists. | Should |

### 4.2 Round intro
| ID | Requirement | Priority |
|---|---|---|
| FR-05 | Before each round show an intro card: round number "N / 6", title, icon, short rule description, timer length, and **Boshlash** button. | Must |

### 4.3 Question screen
| ID | Requirement | Priority |
|---|---|---|
| FR-06 | Header shows round title, question number "N / 7", current total score and an exit (✕) button. | Must |
| FR-07 | A progress bar shows progress within the round. | Must |
| FR-08 | A visible countdown timer (ring + seconds). Last 5 s are highlighted in red. When time is up the question counts as wrong and the correct answer is shown. | Must |
| FR-09 | Round 1 questions display a large picture above the question text. | Must |
| FR-10 | Option questions show 4 large buttons (min 52 px height). Option order is shuffled every game. | Must |
| FR-11 | After answering, buttons are locked; the chosen option turns green (correct) or red (wrong) and the correct option is always highlighted green. | Must |
| FR-12 | Text questions show an input field, a hint (first letter and letter count shown as boxes), **Javob berish** (submit) and **O'tkazib yuborish** (skip) buttons. Enter key submits. Empty submission is ignored. | Must |
| FR-13 | Text answer comparison ignores case, leading/trailing/multiple spaces, and apostrophe variants (' ʻ ’ \` ʼ). Each question may define alternative accepted answers. | Must |
| FR-14 | Feedback panel appears with "To'g'ri!" / "Noto'g'ri" / "Vaqt tugadi", the correct answer, an optional fun fact, points earned, and a **Keyingi** button. | Must |
| FR-15 | Round 3: hint text "Javob «X» harfi bilan boshlanadi" where X is the last letter of the previous correct answer (for Q1, the first letter of its own answer). | Must |
| FR-16 | Round 6: the theme stays hidden until Q7 is answered; then it is revealed. | Must |
| FR-17 | The timer pauses when the app goes to background (tab hidden) or the exit dialog is open, and resumes afterward. | Must |
| FR-18 | Exit (✕) opens a confirmation dialog: **Davom etish** / **Chiqish**. Leaving saves progress so the game can be resumed. | Must |

### 4.4 Scoring
| ID | Requirement | Priority |
|---|---|---|
| FR-19 | Correct answer = **10 points** + speed bonus = `ceil(5 × timeLeft / timeLimit)` (max 5). Round 6 Q7 (theme) = **20 points** + speed bonus. Wrong / skipped / timed-out = 0. | Must |
| FR-20 | Streak: 3+ correct answers in a row show a "🔥 N ketma-ket" badge. (Visual only in MVP.) | Should |
| FR-21 | Max possible score = 41 × 10 + 1 × 20 (base 430) + 42 × 5 (bonus 210) = **640**. With the timer turned off there is no bonus (max 430). | Must |

### 4.5 Round & final results
| ID | Requirement | Priority |
|---|---|---|
| FR-22 | After each round: show correct count "X / 7", points earned this round, total score, and **Keyingi raund** button (on round 6: **Natijalarni ko'rish**). | Must |
| FR-23 | Final screen: total score, accuracy %, rank title (see 4.6), star rating (1–3), per-round breakdown, buttons **Qayta o'ynash**, **Bosh sahifa**, **Ulashish**. | Must |
| FR-24 | "Ulashish" uses the device share sheet (Web Share API) and falls back to copying the text to clipboard with a toast message. | Should |
| FR-25 | Confetti animation when accuracy ≥ 70 %. | Could |

### 4.6 Rank titles
| Accuracy | Title |
|---|---|
| ≥ 90 % | Bilimlar sultoni 👑 |
| 70–89 % | Zukko 🧠 |
| 50–69 % | Bilimdon 📚 |
| 30–49 % | Izlanuvchi 🔍 |
| < 30 % | Yosh bilimdon 🌱 |

### 4.7 Records
| ID | Requirement | Priority |
|---|---|---|
| FR-26 | Save each completed game (name, score, correct count, date) locally. Records screen lists top 10 sorted by score desc, then date. Empty state message when none. | Must |
| FR-27 | "Rekordlarni tozalash" with confirmation. | Should |

### 4.8 Settings & help
| ID | Requirement | Priority |
|---|---|---|
| FR-28 | Toggles: **Ovoz** (sound effects), **Tebranish** (vibration), **Taymer** (timer on/off — off = relaxed mode, no speed bonus). Persisted locally. | Must |
| FR-29 | "Qanday o'ynaladi?" screen explains all 6 rounds and scoring in Uzbek. | Must |

### 4.9 Persistence
| ID | Requirement | Priority |
|---|---|---|
| FR-30 | Game progress (round, question, score, answers, shuffled orders) is auto-saved after every answer so a page reload / app kill can be resumed. A question in progress at reload restarts with a full timer. | Must |
| FR-31 | Corrupted/invalid stored data must not crash the app (fallback to defaults). | Must |

---

## 5. Non-functional requirements
| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Platform | Mobile-first responsive web app (PWA). Target iOS Safari 15+, Android Chrome 100+. Portrait 320–480 px width primary; on larger screens the app is shown centered in a phone-width frame. |
| NFR-02 | Language | 100 % of user-facing text in Uzbek Latin; `lang="uz"`. |
| NFR-03 | UI/UX | Modern dark theme with gradients, glass cards, rounded corners (16–24 px), smooth transitions (≤ 300 ms), touch targets ≥ 44 px, respects iPhone safe areas (notch, home bar). |
| NFR-04 | Accessibility | Text contrast ≥ 4.5:1, buttons have accessible labels, timer announced via `aria-live`, supports `prefers-reduced-motion`. |
| NFR-05 | Performance | No external network dependencies; total bundle < 300 KB; interactions respond < 100 ms. |
| NFR-06 | Offline | Service worker caches all assets; game fully playable offline after first load. |
| NFR-07 | Installability | Web manifest with name, icons, theme color, `display: standalone`. |
| NFR-08 | Reliability | No JS errors in console during a full game. Double taps must not register two answers. |
| NFR-09 | Privacy | No personal data leaves the device. |

---

## 6. Content (question bank v1)

All content in Uzbek Latin. ✅ marks the correct answer.

### Round 1 — Rasmli savollar (easy, picture)
| # | Picture | Question | Options |
|---|---|---|---|
| 1 | 🍎 | Rasmda qanday meva tasvirlangan? | Olma ✅, Nok, Anor, Shaftoli |
| 2 | 🐘 | Bu qanday hayvon? | Fil ✅, Ot, Tuya, Karkidon |
| 3 | 🇺🇿 flag (vector) | Bu qaysi davlatning bayrog'i? | O'zbekiston ✅, Qozog'iston, Tojikiston, Ozarbayjon |
| 4 | 🐪 | Cho'lda yashaydigan bu hayvon nima deb ataladi? | Tuya ✅, Ot, Eshak, Qo'y |
| 5 | 🍉 | Bu poliz mahsulotining nomi nima? | Tarvuz ✅, Qovun, Qovoq, Bodring |
| 6 | ⚽ | Bu to'p qaysi sport turida ishlatiladi? | Futbol ✅, Basketbol, Tennis, Voleybol |
| 7 | 🌙 | Rasmda nima tasvirlangan? | Oy ✅, Quyosh, Yulduz, Bulut |

### Round 2 — Bilimdon (4 options)
| # | Question | Options |
|---|---|---|
| 1 | O'zbekistonda nechta viloyat bor? | 12 ✅, 13, 14, 10 |
| 2 | Dunyodagi eng katta okean qaysi? | Tinch okeani ✅, Atlantika okeani, Hind okeani, Shimoliy Muz okeani |
| 3 | Amir Temur qaysi shahar yaqinida tug'ilgan? | Shahrisabz (Kesh) ✅, Samarqand, Buxoro, Termiz |
| 4 | Kabisa bo'lmagan yilda necha kun bor? | 365 ✅, 364, 366, 360 |
| 5 | Qaysi sayyora "Qizil sayyora" deb ataladi? | Mars ✅, Venera, Yupiter, Saturn |
| 6 | Suvning kimyoviy formulasi qanday? | H₂O ✅, CO₂, O₂, NaCl |
| 7 | O'zbekiston mustaqilligi qaysi yili e'lon qilingan? | 1991 ✅, 1990, 1992, 1989 |

### Round 3 — So'z zanjiri (word chain, typed)
Rule: each answer starts with the last letter of the previous answer.
| # | Question | Answer | Starts / ends |
|---|---|---|---|
| 1 | O'zbekiston Respublikasining poytaxti qaysi shahar? | Toshkent | T… → t |
| 2 | Yozda pishadigan, ichi qizil, katta yumaloq poliz mevasi? | Tarvuz | T… → z |
| 3 | Terisi oq-qora yo'l-yo'l bo'lgan, otga o'xshash Afrika hayvoni? | Zebra | Z… → a |
| 4 | Ichida yuzlab qizil donachalari bo'lgan, "jannat mevasi" deb ataluvchi meva? | Anor | A… → r |
| 5 | Musulmonlar ro'za tutadigan muqaddas oy? | Ramazon | R… → n |
| 6 | Tandirda yopiladigan, o'zbek dasturxonining eng aziz ne'mati? | Non | N… → n |
| 7 | "Xamsa" asarini yozgan buyuk o'zbek shoiri kim? | Navoiy (alt: Alisher Navoiy) | N… |

### Round 4 — Kino olami (cinema)
| # | Question | Options |
|---|---|---|
| 1 | "Titanik" (1997) filmida Jek rolini kim ijro etgan? | Leonardo DiKaprio ✅, Bred Pitt, Tom Kruz, Jonni Depp |
| 2 | "Shum bola" filmi qaysi yozuvchining qissasi asosida suratga olingan? | G'afur G'ulom ✅, Abdulla Qodiriy, Cho'lpon, Oybek |
| 3 | "Garri Potter" filmlaridagi sehrgarlik maktabi qanday nomlanadi? | Xogvarts ✅, Narniya, Olimp, Atlantida |
| 4 | "Sher qirol" multfilmidagi bosh qahramon — sher bolasining ismi nima? | Simba ✅, Mufasa, Nala, Skar |
| 5 | Kino sohasidagi eng nufuzli xalqaro mukofot qaysi? | Oskar ✅, Grammi, Nobel, Emmi |
| 6 | "Avatar" filmining rejissyori kim? | Jeyms Kemeron ✅, Stiven Spilberg, Kristofer Nolan, Jorj Lukas |
| 7 | Charli Chaplin qaysi turdagi kinoning afsonaviy yulduzi bo'lgan? | Ovozsiz kino ✅, 3D kino, Animatsion kino, Hujjatli kino |

### Round 5 — Musiqa sadosi (music)
| # | Question | Options |
|---|---|---|
| 1 | Qaysi musiqa asbobida odatda 88 ta klavish bo'ladi? | Fortepiano ✅, Gitara, Skripka, Akkordeon |
| 2 | Qaysi biri o'zbek milliy urma cholg'u asbobi? | Doira ✅, Dutor, Nay, Rubob |
| 3 | "Shashmaqom" qaysi san'at turiga tegishli? | Mumtoz musiqa ✅, Raqs, Rassomlik, Me'morchilik |
| 4 | "Oy nuri" sonatasining muallifi kim? | Betxoven ✅, Motsart, Bax, Chaykovskiy |
| 5 | Nomi "ikki tor" degan ma'noni anglatuvchi o'zbek xalq cholg'usi? | Dutor ✅, Tanbur, G'ijjak, Chang |
| 6 | "Pop qiroli" deb nom olgan xonanda kim? | Maykl Jekson ✅, Elvis Presli, Fredi Merkyuri, Stivi Uander |
| 7 | Musiqada nechta asosiy nota bor (do, re, mi…)? | 7 ✅, 5, 6, 8 |

### Round 6 — Yashirin mavzu (hidden theme = **Samarqand**)
| # | Question | Options |
|---|---|---|
| 1 | Uchta madrasadan iborat mashhur me'moriy ansambl qaysi? | Registon ✅, Labi hovuz, Ichan qal'a, Ko'kaldosh |
| 2 | XV asrda mashhur rasadxona qurdirgan olim-hukmdor kim? | Mirzo Ulug'bek ✅, Al-Xorazmiy, Ibn Sino, Beruniy |
| 3 | Amir Temur dafn etilgan maqbara qanday nomlanadi? | Go'ri Amir ✅, Toj Mahal, Oqsaroy, Somoniylar maqbarasi |
| 4 | Nomi "Tirik shoh" ma'nosini anglatuvchi maqbaralar majmuasi? | Shohi Zinda ✅, Chor Minor, Poi Kalon, Bolo hovuz |
| 5 | Amir Temurning suyukli rafiqasi nomi bilan ataluvchi jome masjidi? | Bibixonim ✅, Juma masjidi, Hazrati Imom, Kalon masjidi |
| 6 | Bibixonim masjidi yonidagi mashhur qadimiy bozor? | Siyob bozori ✅, Chorsu bozori, Oloy bozori, Eski Juva |
| 7 | Yuqoridagi barcha javoblarni qaysi yashirin mavzu birlashtiradi? (typed) | **Samarqand** (alt: Samarkand, Samarqand shahri) |

---

## 7. User flow

```
Home ──► [name] ──► Round intro (1/6) ──► Q1..Q7 (answer → feedback → next)
  ▲                                          │
  │                                          ▼
  │                                   Round result ──► next Round intro … (×6)
  │                                                          │
  └──── Bosh sahifa ◄── Final results (share / replay) ◄─────┘
Home ──► Qanday o'ynaladi? | Rekordlar | Sozlamalar ──► back
Any question ──► ✕ ──► confirm ──► Home (progress saved → Davom ettirish)
```

## 8. Acceptance criteria (MVP done when)
1. A full game of 6 rounds × 7 questions can be completed on a 375 × 812 phone viewport without layout breaks or console errors.
2. All rules in §4 are verified by the test scenarios in `03-test-scenarios.md` with zero open Critical/Major bugs.
3. All user-facing text is Uzbek.
4. Uzbek user manual is delivered.
