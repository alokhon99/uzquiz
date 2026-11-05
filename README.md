# Uzquiz — O'zbekcha viktorina (2.1)

Live: https://alokhon99.github.io/uzquiz/ · Pack editor: https://alokhon99.github.io/uzquiz/admin.html

Mobile-first PWA quiz game in Uzbek built from **question packs**. Questions can contain images, audio and video. No dependencies, no build step. 2.0-α: all packs are free and stored as static files (backend for accounts and paid packs comes in 2.0-β, see `docs/07-requirements-v2-packs.md`).

## Run
```bash
node serve.mjs 5173
```
Open http://localhost:5173 (use device mode, or a phone on the same network).

## Test
```bash
node tests/run-tests.mjs
```
Browser suites run inside the open page (served by `serve.mjs` under `/__tests/`):
- game: `const m = await import('/__tests/e2e.js'); await m.run('media')` — suites: catalogue, rasminka, klassikFull, media, audio, mediaFail, back, multi1/2, migrate1/2, offline, corrupt1/2, timerOff, klassikRegress, deeplink1/2, small
- editor (on `admin.html`, GitHub mocked): `const m = await import('/__tests/admin-e2e.js'); await m.run('upload')` — suites: list, create, edit, afterReload, upload, preview, publish, duplicate, discard, rules

## Structure
| Path | What |
|---|---|
| `app/index.html`, `app/css/styles.css`, `app/js/app.js` | Player app: catalogue, pack page, game, media player |
| `app/js/pack.js` | Pack format (schema 2): validation, catalogue entries, limits, v1 migration |
| `app/js/logic.js` | Scoring, lenient answer matching (Cyrillic/Latin, typos, key words, partial), Uzbek letters |
| `app/js/mediastore.js` | IndexedDB store for not-yet-published media (editor + preview) |
| `app/admin.html`, `app/js/admin.js`, `app/css/admin.css` | Pack editor: packs, rounds, questions, media upload, validation, preview, publish |
| `app/packs/index.json`, `app/packs/<id>/pack.json`, `app/packs/<id>/media/` | Catalogue, packs, media |
| `app/sw.js`, `app/manifest.webmanifest` | Offline + installable |
| `tools/` | Pack generators (demo audio/video/images), v1 migration, `build-index.mjs` |
| `docs/` | Requirements (01, 07, 09), test scenarios (03, 08), bug report (04), Uzbek manuals (05 player, 06 editor) |

## Publishing
- **Content:** the editor commits `pack.json` + media + `index.json` to `main` and `gh-pages` in one commit per branch. Run `git pull` before working locally.
- **Code:**
  ```bash
  git push origin main
  ```
  ```bash
  git subtree split --prefix app -b gh-pages && git push origin gh-pages
  ```
  If the editor has committed to `gh-pages` meanwhile, merge `origin/main` first so the split includes those commits.
