# Uzquiz 2.2 — Cyrillic script (Кирилл ёзуви)

| | |
|---|---|
| Status | Delivered (2026-11-05), not yet deployed |
| Requested by | Quiz owner |
| Related | `09-requirements-2.1-typed-answers.md` (answers in either script are already accepted) |

## 1. Problem
Many players, especially older ones, read Uzbek in Cyrillic, and the owner's own quiz slides are in Cyrillic. Until now the game was Latin only.

## 2. Decision
- One **script switch** for the whole game: **Lotin / Кирилл**.
- Content stays authored once, and the game converts it on screen. Packs can be written in Latin **or** Cyrillic; each player sees their chosen script.
- No second copy of the texts to maintain.

## 3. Requirements

| ID | Requirement | Priority |
|---|---|---|
| CY-01 | Settings → **Ёзув / Yozuv**: Lotin or Кирилл; remembered on the device; default Lotin | Must |
| CY-02 | One-tap toggle in the catalogue header (**Ўз** / **O'z**) | Should |
| CY-03 | Every screen, dialog, toast, placeholder and screen-reader label is shown in the chosen script, including pack content (titles, questions, options, facts, answers, round names), records and the page title. The page language is set to `uz-Cyrl` | Must |
| CY-04 | Uzbek transliteration rules: o'→ў, g'→ғ, sh→ш, ch→ч, yo/yu/ya/ye→ё/ю/я/е, word-initial e and e after a vowel→э, tutuq belgisi (')→ъ, h→ҳ, x→х, q→қ; capital letters kept | Must |
| CY-05 | Not converted: chemical formulas (H₂O, NaCl), the brand name Uzquiz, words with letters that don't exist in Uzbek (c without h, w: "Newton"), mixed-case brands (iPhone), links | Must |
| CY-06 | Packs written in Cyrillic are shown in Latin to Latin-mode players (Ўзбекистон → O'zbekiston, Ер → Yer) | Must |
| CY-07 | Typed answers: Latin or Cyrillic accepted in both modes (already in 2.1) | Must |
| CY-08 | Letter boxes and the first-letter hint use Cyrillic letters and Cyrillic letter counts (Do'ppi → Д Ў П П И; Yer → Е Р = 2 boxes). Word-chain hints work in Cyrillic | Must |
| CY-09 | Answer keys А Б В Г in Cyrillic mode (A B C D in Latin) | Must |
| CY-10 | Catalogue search accepts Cyrillic queries | Must |
| CY-11 | Shared text (📤 Ulashish) is sent in the chosen script | Should |

## 4. Known limitations
- Text drawn **inside pictures** (e.g. the Xiva reveal card) is part of the image and stays as drawn. Authors who want both scripts should keep text out of images, or use the question and fact fields instead.
- The pack editor stays in Latin. Authors may still type content in either script.
- Automatic conversion follows the official rules. Rare words with t+s/ц or loan words may need a manual spelling. Report them and we'll add exceptions.
