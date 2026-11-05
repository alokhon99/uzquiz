# Uzquiz 2.1 — Typed answers judged like a human ("Rasminka")

| | |
|---|---|
| Status | Delivered (2026-11-05) |
| Requested by | Quiz owner |
| Related | `07-requirements-v2-packs.md` (pack format), `08-test-scenarios-v2.md` §2.1 |

## 1. Problem
The owner's live-quiz questions ask players to write answers on paper, and a person checks them. Showing answer options would give the logic away. A phone, though, has to judge typed answers as fairly and as leniently as a human judge does. Otherwise players who knew the answer are marked wrong.

## 2. Decision
- Questions keep **free-text answers**, with no options.
- The app accepts every reasonable form of the answer automatically.
- When the app still rejects an answer, the player can **overrule it** ("✋ Men to'g'ri topgandim").
- First use: **Klassik round 1 becomes "Rasminka"**, with 7 picture riddles and typed answers.

## 3. Requirements

| ID | Requirement | Priority |
|---|---|---|
| TA-01 | Ignore case, spaces, dots and other punctuation, and apostrophe variants (o' / oʻ / o') | Must |
| TA-02 | Treat Cyrillic and Latin as the same (Ўзбек ↔ O'zbek, Хива ↔ Xiva); also kh → x and x ↔ h | Must |
| TA-03 | Forgive typos: 0 for answers of ≤ 4 letters, 1 for 5–7 letters, 2 for 8 or more; a swap of neighbouring letters counts as 1. Answers containing digits must be exact. The author can switch typo tolerance off per question (`exact`) | Must |
| TA-04 | Alternative answers (`alts`): any one gives full points | Must (existed) |
| TA-05 | Key words (`keywords`): an answer that contains the key word (whole word, typo-tolerant) gets full points, e.g. "Polo" for "U.S. Polo Assn" | Must |
| TA-06 | Partial answers (`partial`): half points (rounded), shown in yellow as "Qisman to'g'ri" | Must |
| TA-07 | Player overrule: after a wrong or partial typed answer, a "✋ Men to'g'ri topgandim" button gives full points (same speed bonus as at answer time) and restores the streak. The result is stored as self-judged (`s: true`). Not offered after skip or timeout, or when the correct answer is hidden. The owner can turn it off per pack (`settings.selfJudge`) | Must |
| TA-08 | The final screen shows how many answers were partial or self-judged | Should |
| TA-09 | Hint per question (`hint`): `letters` (first letter + letter boxes, default), `count` (letter boxes only), `none`. Multi-word answers show grouped boxes and a "N so'z" count. Chain rounds always use `letters` | Must |
| TA-10 | Feedback shows "Sizning javobingiz: …" next to the correct answer, and notes when a typo was forgiven | Must |
| TA-11 | Editor: fields for key words, partial answers, hint and "exact", plus a **🧪 test box** where the author types a likely player answer and sees ✅ / 🤏 / ❌ live | Must |
| TA-12 | Validation: no empty list entries; unknown hint is an error; a partial answer that already counts as correct is an error; a key word shorter than 3 letters is a warning | Must |
| TA-13 | Klassik round 1 "Rasminka": 7 picture riddles (own SVG art, licence "own"), typed answers, 45 s, 10 points; one reveal picture; maximum score unchanged (640) | Must |

## 4. Out of scope, for later
- Sending overruled answers to the team, with alias suggestions in the editor ("47 players wrote 'Ю Эс Поло' — add it?"). Needs the 2.0-β backend.
- Global leaderboards that count only auto-checked answers (2.0-β).
- Hint ladder (reveal a letter for −3 points).
- Party / host mode with paper answers and a team scoreboard (planned 2.2).

## 5. Rasminka content

| # | Picture | Answer | Also accepted | Half points | Hint |
|---|---|---|---|---|---|
| 1 | Kazan with rice and carrots | Osh | Palov, Plov, Osh palov | — | count |
| 2 | Black cap with white chilli motifs | Do'ppi | Chust do'ppi, Tyubeteyka | — | letters |
| 3 | Cotton boll | Paxta | G'o'za | — | count |
| 4 | Wide, unfinished tiled minaret (+ reveal card) | Xiva | Khiva, Ichan qal'a | Xorazm | none |
| 5 | Giant underground arc | Ulug'bek | Mirzo Ulug'bek | Samarqand | letters |
| 6 | Apple falling on a man under a tree | Nyuton | Isaak Nyuton, Newton | Tortishish qonuni, Gravitatsiya | count |
| 7 | Three madrasa portals | Registon | Registon maydoni, Registan | Samarqand | letters |

The owner's own photo riddles (e.g. the U.S. Polo example) can be added in the editor. Third-party photos and logos need a rights check before a pack is sold.
