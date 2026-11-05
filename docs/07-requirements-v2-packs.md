# Uzquiz 2.0 — Business Requirements: Question Packs, Media & Paid Packs

| Item | Value |
|---|---|
| Product | Uzquiz — Uzbek-language quiz game |
| Release | 2.0 (follows MVP 1.1, see `01-requirements.md`) |
| Author role | Senior Business Analyst |
| Stakeholder | Quiz owner |
| Date | 2026-11-05 |
| Status | **Draft for stakeholder review** — open questions in §12 |

---

## 1. Change request summary

| # | Stakeholder request | What it means for the product |
|---|---|---|
| CR-1 | Questions can contain media: **images, video clips, audio** | New question formats (e.g. "guess the song", "which film is this scene from?"), media upload and storage, playback rules on mobile |
| CR-2 | The game consists of **many question packs** | The app becomes a pack catalogue. A player picks a pack, opens it and plays it |
| CR-3 | Monetisation by **buying question packs** | Accounts, a store, payments, purchased-pack ownership, receipts, reporting |

**Key consequence:** MVP 1.x is a static site with no server or database (questions live in the app's code, progress in the phone's browser). CR-1…CR-3 require a **backend**:
- a database
- media storage with fast delivery (CDN)
- sign-in
- payment processing
- access control, so a paid pack can't be opened without buying it

This is the largest change since launch and drives most of the effort (§10).

## 2. Stakeholder decisions captured (2026-11-05)

| Topic | Decision | Implication |
|---|---|---|
| Pack format | **Flexible packs** — each pack defines its own rounds, question count and question types | Small single-theme packs (e.g. "Uzbek estrada of the 90s", 15 questions) and full "classic" 6-round packs can co-exist |
| Payments | **Uzbek payment apps** (Payme, Click; Uzum Bank later), prices in so'm, sold on the web | Needs a registered business (YaTT or LLC), merchant contracts and fiscal receipts (§9) |
| Sign-in | **Phone number + SMS code**. **Free packs playable without signing in** | Needs an SMS gateway (e.g. Eskiz.uz / Play Mobile). Sign-in is asked for only when buying or restoring purchases |
| Authors | **Only the owner's team** creates packs (via an extended admin editor) | No marketplace, moderation or revenue sharing. Role-based admin access is still needed |

## 3. Goals & success metrics

| ID | Goal | KPI (first 3 months after 2.0 launch) |
|---|---|---|
| G-1 | Grow content variety | ≥ 10 packs live at launch, ≥ 2 new packs per month |
| G-2 | Make media questions the signature feature | ≥ 40 % of questions in new packs use media |
| G-3 | Generate revenue | Free → paid conversion ≥ 3 % of signed-in players. Payment success rate ≥ 95 % |
| G-4 | Keep play friction low | Guest can start a free pack in ≤ 2 taps from opening the app. Media starts playing in ≤ 2 s on 4G |
| G-5 | Learn what sells | Owner dashboard shows views → starts → completions → purchases per pack |

## 4. Scope

### 4.1 In scope — Release 2.0
1. Pack catalogue (store) with free and paid packs, and a pack detail page.
2. Flexible pack structure with all current question types, plus media questions.
3. Media: images, audio clips and video clips in questions and in the answer reveal.
4. Guest play for free packs. Phone + SMS sign-in for buying and restoring.
5. Purchase of individual packs with Payme and Click. Ownership tied to the account.
6. Server-side protection of paid content and media.
7. Admin panel: pack and media management, pricing, publishing, sales report, manual grant or refund.
8. Migration: today's 42 questions become the free pack **"Uzquiz Klassik"**.
9. Basic analytics (§5, Epic 9).

### 4.2 Later phases (not in 2.0)
| Phase | Item |
|---|---|
| 2.1 | Uzum Bank payments, promo codes, pack bundles ("3 packs for the price of 2"), discounts |
| 2.1 | Offline download of purchased packs, including media |
| 2.2 | Native Android/iOS apps (in-app purchase rules of the stores apply, §11) |
| 2.2 | Subscription ("all packs" monthly), gifting packs |
| Future | Multiplayer / live quiz nights, global leaderboards, Russian / Uzbek Cyrillic UI |

### 4.3 Out of scope
- Third-party pack authors or a marketplace
- User-generated content
- Advertising
- Cryptocurrency or international card payments

---

## 5. Functional requirements

Priority: **M** = Must for 2.0, **S** = Should, **C** = Could.

### Epic 1 — Pack catalogue (store)
| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| PK-01 | Home screen shows a **pack catalogue**: cover image, title, short description, number of questions, media icons (🖼️ 🎵 🎬), price or "Bepul" | M | Catalogue loads in ≤ 2 s on 4G. Shows at least 20 packs without layout issues on a 320 px screen |
| PK-02 | Status badges on each pack: **Bepul** (free), **Sotib olingan** (owned), **Yangi** (new, ≤ 14 days), **Davom ettirish** (in progress) | M | Badge rules match §7 |
| PK-03 | Categories (e.g. Umumiy bilim, Kino, Musiqa, Tarix, Sport, Bolalar) and search by title | M | Filter + search return results in ≤ 300 ms |
| PK-04 | **Pack detail page:** cover, description, rounds list, question count, estimated play time, media types, age rating, price, **"O'ynash"** or **"Sotib olish — 15 000 so'm"** button | M | Locked pack shows the buy button, never the content |
| PK-05 | **Free preview** of a paid pack: the first *N* questions (owner sets *N*, default 2) are playable before buying | S | Preview ends with a purchase prompt; preview score is not saved as a record |
| PK-06 | "Mening paketlarim" (My packs) shows owned and started packs | M | Synced across devices after sign-in |
| PK-07 | Featured / banner slot controlled by admin | C | — |

### Epic 2 — Flexible pack structure
| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| PS-01 | A pack has **1–10 rounds**, each with **1–20 questions** | M | Admin cannot publish a pack outside these limits |
| PS-02 | Round types (configurable per round): **Standard**, **Word chain** (today's round 3 rule), **Hidden theme** (today's round 6 rule) | M | Existing validation rules from the 1.1 editor apply per round type |
| PS-03 | Question answer types: **Single choice** (2–6 options), **Typed answer** with alternative answers, **True / False** | M | Typed answers keep the 1.x tolerance (case, spaces, apostrophe variants) |
| PS-04 | **Image options:** answer options can be images instead of text (e.g. "which one is the flag of…") | S | 2×2 grid on mobile, tap target ≥ 44 px |
| PS-05 | Per-round time limit and points. Pack-level settings: speed bonus on/off, show correct answer on/off | M | Defaults: 30 s, 10 points, speed bonus on |
| PS-06 | Game flow, scoring, streaks, resume, rank titles and results work **per pack** as in 1.x | M | 1.x regression test suite passes on the "Uzquiz Klassik" pack |
| PS-07 | Per-pack personal best and records | M | Records screen can filter by pack |

### Epic 3 — Media in questions
| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| MD-01 | A question can have **one main media item**: image, audio clip or video clip | M | — |
| MD-02 | A question can have an optional **answer reveal media** item shown after answering (e.g. full photo, the song's chorus, the film poster) | S | — |
| MD-03 | **Supported formats & limits** (enforced on upload): | M | Upload is rejected with a clear message when a limit is exceeded |
| | • Image: JPG, PNG, WebP · ≤ 5 MB upload · auto-converted to WebP, max 1280 px | | |
| | • Audio: MP3, M4A/AAC, OGG · ≤ 60 s · ≤ 5 MB · normalised loudness | | |
| | • Video: MP4 (H.264) / WebM · ≤ 60 s · ≤ 30 MB upload · transcoded to 480p and 720p | | |
| MD-04 | **Timer starts only after the media is ready.** For audio/video the timer starts when playback starts (mobile browsers require a tap) | M | Slow network never costs the player time |
| MD-05 | Player controls: play/pause, **replay** (admin sets max replays, default 1), volume follows device. Video plays inline, never auto-fullscreen | M | — |
| MD-06 | **Clip trimming** in admin: set start/end seconds so only a fragment is played | S | Only the trimmed fragment is delivered to players |
| MD-07 | **Preloading:** the next question's media is preloaded while the current question is answered | M | Media start ≤ 2 s on 4G (G-4) |
| MD-08 | **Data saver:** on slow connections video falls back to 480p; a "Kam trafik" setting forces 480p | S | — |
| MD-09 | Accessibility: images have alt text (required in admin). Video can have Uzbek subtitles. Audio questions show a visual "listening" state | M (alt) / C (subtitles) | Publishing is blocked without alt text |
| MD-10 | Media failure handling: if media fails to load after 2 retries, the player can **skip without penalty** (question not counted) | M | No crash. The skipped question is excluded from accuracy |
| MD-11 | **Rights record:** every uploaded asset stores source, licence type and rights holder. Publishing is blocked if empty | M | See risk R-1 |

### Epic 4 — Accounts & sign-in
| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| AC-01 | **Guest mode:** free packs are playable without an account. Progress is stored on the device | M | No sign-in prompt before the first purchase or "restore" |
| AC-02 | **Sign-in with phone + SMS code:** Uzbek format +998 XX XXX XX XX, 6-digit code, valid 5 min | M | Code arrives in ≤ 30 s for 95 % of attempts |
| AC-03 | Abuse protection: max 3 codes per number per 15 min, max 5 wrong attempts, then a 15-min lock | M | Rate limits enforced server-side |
| AC-04 | **Guest → account merge:** on first sign-in, the device's progress and records are attached to the account | M | No progress lost |
| AC-05 | Profile: display name (used on results/share), sign out, **delete account** (removes personal data, keeps anonymised sales records) | M | Deletion completes in ≤ 30 days (legal check, §9) |
| AC-06 | A session stays signed in for 90 days on a device | M | — |

### Epic 5 — Purchases
| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| PU-01 | Buy a single pack for a fixed price in **so'm** (set by the owner per pack) | M | — |
| PU-02 | Checkout methods: **Payme** and **Click** (redirect / deep-link to the app), Uzum Bank in 2.1 | M | Works on Android and iOS browsers |
| PU-03 | Ownership (**entitlement**) is granted **only after the payment provider confirms** (server-to-server), never on the client's word | M | Simulated "fake success" from the client does not unlock a pack |
| PU-04 | Order states: created → pending → paid → (refunded / failed / cancelled). Player sees "To'lov kutilmoqda…" for pending | M | Each provider callback is processed exactly once |
| PU-05 | Purchased packs are available on every device after signing in (**restore purchases**) | M | — |
| PU-06 | **Fiscal receipt** for each payment, as required by Uzbek tax rules; receipt link shown in "Xaridlarim" (My purchases) | M | Legal/tax check, §9 |
| PU-07 | Purchase history screen: pack, date, amount, status, receipt | M | — |
| PU-08 | Refunds are made by admin (Epic 7). A refund removes access to the pack | M | — |
| PU-09 | Card data never touches Uzquiz servers (handled entirely by Payme / Click) | M | Security review |
| PU-10 | Promo codes (free pack or % discount, usage limit, expiry) | S (2.1) | — |

### Epic 6 — Content protection
| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| CP-01 | Questions, answers and media of paid packs are delivered **only to entitled users**, through the server | M | A non-owner cannot fetch paid questions or media by URL |
| CP-02 | Media URLs are **short-lived signed links** (e.g. valid 1 hour) | M | Shared links stop working |
| CP-03 | Correct answers are not exposed to the client before the player answers, for typed and hidden-theme questions | S | Reduces cheating; may be relaxed for offline mode (2.1) |

### Epic 7 — Admin panel (owner's team)
| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| AD-01 | **Roles:** Owner (everything incl. prices, sales, refunds, users) and Editor (packs and media only) | M | Editors can't see revenue or personal data |
| AD-02 | Admin sign-in with phone + SMS **and** a second factor or allow-list | M | — |
| AD-03 | Pack management: create, edit, duplicate, reorder rounds/questions; states **Draft → Review → Published → Archived** | M | Only Owner can publish. Archived packs stay available to buyers |
| AD-04 | Pack settings: title, description, cover, category, age rating, price (or free), preview size, release date (scheduled publishing) | M | — |
| AD-05 | Media library: upload (drag-and-drop or phone gallery), progress bar, preview, trim (MD-06), alt text, rights record, reuse across questions | M | Upload validation per MD-03 |
| AD-06 | Live validation (extends the 1.1 editor): word chain, hidden theme, duplicates, missing media/alt text/rights, round limits | M | Publish is blocked on errors |
| AD-07 | **Preview as player** on phone layout before publishing | M | — |
| AD-08 | Sales report: revenue per day/pack/payment method, number of sales, refunds; CSV export | M | Figures reconcile with Payme/Click statements |
| AD-09 | User lookup by phone: owned packs, purchase history; **grant pack manually**, **refund** | M | Every manual action is audit-logged |
| AD-10 | Audit log of publish, price change, grant, refund, delete actions | M | — |
| AD-11 | Import of the existing 1.x question bank into the pack "Uzquiz Klassik" | M | All 42 questions migrated, 1.x tests pass |

### Epic 8 — Player flow changes
| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| PF-01 | New flow: **Catalogue → Pack detail → (Buy) → Play → Results → back to catalogue** | M | See §6 |
| PF-02 | Resume works per pack. Several packs can be in progress | M | — |
| PF-03 | Results screen recommends 2 related packs ("Sizga yoqishi mumkin") | S | — |
| PF-04 | Share result includes the pack name and a link to the pack | S | — |

### Epic 9 — Analytics
| ID | Requirement | Pri | Acceptance criteria |
|---|---|---|---|
| AN-01 | Funnel per pack: catalogue views → detail views → starts → completions → purchases | M | Visible in admin (AD-08) |
| AN-02 | Question difficulty: % correct, average answer time, skip rate, media failure rate | S | Helps editors fix bad questions |
| AN-03 | Privacy-friendly: no third-party ad trackers; analytics data anonymised for guests | M | — |

---

## 6. Key user flows

**F-1 Guest plays a free pack**
Open app → catalogue → tap a "Bepul" pack → detail page → **O'ynash** → rounds → results → "Boshqa paketlar".

**F-2 Buy a pack**
Pack detail → **Sotib olish — 15 000 so'm** → (not signed in) phone number → SMS code → choose Payme / Click → pay in the provider's app or page → return to Uzquiz → "To'lov tasdiqlandi ✓" → **O'ynash**.
If the provider confirms late, the player sees "To'lov kutilmoqda…" and gets access automatically once confirmed (≤ 5 min target).

**F-3 Media question**
Question screen shows the image / audio player / video player → for audio/video the player taps ▶ (timer starts with playback) → answer → reveal panel (optional reveal media) → next question (preloaded).

**F-4 Restore on a new phone**
Install/open → Profil → phone + SMS → owned packs appear under "Mening paketlarim".

**F-5 Owner publishes a pack**
Admin → New pack → settings & price → add rounds/questions → upload media (with rights info) → validation clean → Preview as player → Editor sends for Review → Owner publishes (now or scheduled).

---

## 7. Business rules

| ID | Rule |
|---|---|
| BR-01 | A pack is **playable** if it's free, or the signed-in player owns it, or the player is inside its free preview (PK-05) |
| BR-02 | Ownership is permanent unless refunded. Archived packs remain playable for owners |
| BR-03 | Price changes don't affect existing owners. Orders keep the price at the time of purchase |
| BR-04 | A purchase is linked to the account (phone), not the device |
| BR-05 | Only Published packs appear in the catalogue. Drafts are visible only in admin preview |
| BR-06 | Records and personal bests are kept per pack. Preview plays don't create records |
| BR-07 | A question whose media failed to load (MD-10) doesn't affect score or accuracy |
| BR-08 | "Yangi" badge for 14 days after publishing. "Davom ettirish" while a saved game exists |
| BR-09 | Every published media asset must have a rights record (MD-11) |
| BR-10 | Minimum pack price and price steps are set by the Owner (e.g. from 5 000 so'm in 1 000 so'm steps) — to be confirmed |

## 8. Data model (business view)

```
Pack ──< Round ──< Question ──< AnswerOption
  │                   ├── main media ──> MediaAsset (type, file, duration, alt, rights)
  │                   └── reveal media ─> MediaAsset
  ├── price, category, cover (MediaAsset), status, preview size
Player (phone, name) ──< Order ──< Payment (provider, status, receipt)
Player ──< Entitlement (pack, source: purchase | grant | promo, date)
Player ──< GameProgress (pack, position, score) / Record (pack, score, date)
AdminUser (role) ──< AuditLogEntry
```

## 9. Non-functional & compliance requirements

| ID | Category | Requirement |
|---|---|---|
| NF-01 | Performance | Catalogue ≤ 2 s, media start ≤ 2 s on 4G. Media served from a CDN close to Uzbekistan |
| NF-02 | Availability | 99.5 % monthly for catalogue, sign-in and purchases. Payment callbacks are retried and never lost |
| NF-03 | Scalability | 10 000 daily players and 500 concurrent games without degradation |
| NF-04 | Security | HTTPS everywhere, OWASP Top-10 review before launch, admin second factor, secrets never in the client |
| NF-05 | Payments | Provider integrations follow Payme / Click merchant specifications. Reconciliation report matches provider statements daily |
| NF-06 | **Personal data (legal check)** | Phone numbers are personal data. Uzbekistan's personal-data law requires personal data of Uzbek citizens to be stored on servers **located in Uzbekistan** — hosting must be chosen accordingly. Privacy policy and consent at sign-in are required. *To be confirmed by a lawyer* |
| NF-07 | **Fiscal receipts (legal/tax check)** | Online payments must produce fiscal receipts per current tax rules. Payme/Click offer fiscalisation features — confirm the setup with an accountant |
| NF-08 | Offline | Free and owned packs already played stay playable offline. Full offline download comes in 2.1 |
| NF-09 | Compatibility | Android Chrome 100+, iOS Safari 15+, 320–480 px portrait first. Media autoplay rules of iOS/Android respected (tap to play) |
| NF-10 | Language | All player-facing text in Uzbek Latin. Admin panel in Uzbek |
| NF-11 | Backups | Daily database backups kept 30 days. Media storage versioned |

## 10. Architecture impact & rough sizing

The 1.x static site (GitHub Pages, questions in code, `localStorage`) can't meet CP-01, PU-03 or AC-02. Release 2.0 needs:

| Component | Purpose | Notes |
|---|---|---|
| Web app (existing PWA, extended) | Catalogue, player, purchase flow | Reuses 1.x game engine and tests |
| Backend API | Packs, sign-in, entitlements, orders, admin | — |
| Database | Packs, users, orders, entitlements, progress | Hosted in Uzbekistan (NF-06) |
| Object storage + CDN | Images, audio, video, transcoding | Signed URLs (CP-02) |
| SMS gateway | Sign-in codes | e.g. Eskiz.uz, Play Mobile — per-SMS cost |
| Payment providers | Payme, Click (Uzum in 2.1) | Merchant contracts needed |
| Admin panel | Extends the 1.1 question editor | Replaces GitHub-token publishing |

Relative effort (T-shirt sizes, for planning only):

| Epic | Size |
|---|---|
| E1 Catalogue | M |
| E2 Flexible packs | M |
| E3 Media | **L** |
| E4 Accounts | M |
| E5 Purchases | **L** |
| E6 Protection | M |
| E7 Admin | **L** |
| E8 Flow | S |
| E9 Analytics | S |

Recommended delivery in **3 increments**:
1. **2.0-α — Packs & media, all free:** E1, E2, E3, E7 (without sales), E8. Validates content and media UX with real players and no payment risk.
2. **2.0-β — Accounts & ownership:** E4, E6, manual grants (AD-09). Packs can be "sold" offline via promo/manual grant while merchant contracts are being signed.
3. **2.0 — Payments:** E5 with Payme + Click, sales report, receipts, E9.

## 11. Risks & dependencies

| ID | Risk / dependency | Impact | Mitigation |
|---|---|---|---|
| R-1 | **Copyright of film and music clips.** Short clips of films and songs are still protected works; selling packs that contain them without licences creates legal exposure | High | Prefer owner-produced or licensed media (stock libraries, agreements with artists/studios, public-domain archives). Rights record per asset (MD-11). Legal review before selling cinema/music packs |
| R-2 | Merchant contracts with Payme/Click need a registered legal entity and bank account | High (blocks E5) | Start registration now. Increment 2.0-β doesn't depend on it |
| R-3 | Personal-data localisation (NF-06) limits hosting choices | Medium | Choose an Uzbekistan-hosted provider for the database. Media CDN holds no personal data |
| R-4 | Fiscalisation requirements (NF-07) | Medium | Use the providers' fiscal receipt services. Accountant review |
| R-5 | SMS costs and SMS fraud (pumping) | Medium | Rate limits (AC-03), captcha after repeated requests, cost alerts |
| R-6 | Mobile autoplay restrictions and slow networks hurt media questions | Medium | MD-04 (timer after playback), MD-07 preloading, MD-10 no-penalty skip |
| R-7 | Piracy (sharing screenshots/recordings of packs) | Low | Accept for screenshots. CP-01/02 stop bulk download |
| R-8 | Future native apps: Apple/Google require their in-app purchase system for digital content, with 15–30 % commission | Medium (2.2) | Keep web sales as the primary channel. Decide store strategy before 2.2 |
| R-9 | Content production capacity (≥ 10 packs at launch, many with media) | Medium | Start pack production during 2.0-α. Admin bulk import |

## 12. Open questions for the stakeholder

| # | Question | Needed by |
|---|---|---|
| Q-1 | Price range per pack (e.g. 5 000–30 000 so'm)? Same price for all packs or per pack? | 2.0 |
| Q-2 | How many packs at launch, and which themes first? Who produces the media? | 2.0-α |
| Q-3 | Is your business already registered (YaTT/LLC) with a bank account for Payme/Click? | 2.0-β |
| Q-4 | Refund policy: within how many days, and only if the pack wasn't played? | 2.0 |
| Q-5 | Should "Uzquiz Klassik" stay free forever? | 2.0-α |
| Q-6 | Age ratings needed (e.g. children's packs 6+)? Any parental controls? | 2.0-α |
| Q-7 | Do you already have licensed media sources for cinema and music packs (R-1)? | 2.0-α |
| Q-8 | Is the free preview (PK-05) wanted, and how many questions? | 2.0 |
| Q-9 | Budget and target launch date — this decides whether to build the backend in-house or use a managed platform | Now |

## 13. Acceptance criteria for Release 2.0

1. A guest can open the catalogue and play any free pack, including image, audio and video questions, on a 375 × 812 phone without errors.
2. A player can sign in with phone + SMS, buy a paid pack with Payme and with Click, and play it. The same pack is available on a second device after signing in.
3. A paid pack's questions and media can't be accessed without ownership (security test).
4. The owner can create, preview, price and publish a pack with media and see its sales in the report. Every manual grant or refund is audit-logged.
5. "Uzquiz Klassik" (today's 42 questions) passes the full 1.x regression suite.
6. Legal checks NF-06, NF-07 and R-1 are signed off.

---

## 14. Implementation note — increment 2.0-α (delivered 2026-11-05)

| Topic | Decision for α | Revisit in |
|---|---|---|
| Hosting | Packs and media are static files on GitHub Pages; no backend yet (all packs are free, nothing to protect) | 2.0-β (backend required for AC, PU, CP epics) |
| Admin access (AD-01/02) | Access = a GitHub fine-grained token with Contents write on the repo; no Owner/Editor roles yet | 2.0-β |
| Review state (AD-03) | Draft / Review / Published / Archived stored in `pack.json`; drafts saved to the repo are readable by URL | 2.0-β |
| Media processing (MD-03) | Images resized + converted to WebP in the browser; audio/video validated (type, size, ≤ 60 s) but not transcoded or loudness-normalised | Backend transcoding in 2.0-β |
| Trimming (MD-06) | Start/end playback window enforced by the player; the full file is still delivered | 2.0-β |
| Offline (NF-08) | App, catalogue, packs and images cached; audio/video need a connection | 2.1 offline download |
| Not built in α | PK-05 free preview, PS-04 image options, MD-08 data saver, Epic 4–6, Epic 9 analytics | per §10 |
| Demo content | 3 free packs: "Uzquiz Klassik" (migrated 1.x, 42 q), "Tovushlar va ritm" (9 audio q), "Diqqat sinovi" (3 image + 3 video q). All media is original (synthesised/drawn by the team) | — |
