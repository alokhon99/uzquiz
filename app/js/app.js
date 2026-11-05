// Uzquiz 2.0 — asosiy ilova: paketlar katalogi, paket sahifasi, media savollar, o'yin oqimi.
import * as L from "./logic.js";
import * as P from "./pack.js";
import { mediaStore } from "./mediastore.js";

/* ---------- Rejim ---------- */
// Ko'rib chiqish (?preview=<paketId>&r=<raund>): muharrirdagi qoralama paket bilan o'ynash.
const params = new URLSearchParams(location.search);
const PREVIEW_ID = params.get("preview");
const PREVIEW = !!PREVIEW_ID;
const SFX = PREVIEW ? ".preview" : "";
const KEYS = {
  game: (id) => `uzquiz.game.${id}${SFX}`,
  records: "uzquiz.records" + SFX,
  settings: "uzquiz.settings",
  name: "uzquiz.name",
};
const RING = 2 * Math.PI * 28;
const LETTERS = "ABCDEF";
const MEDIA_ICON = { image: "🖼️", audio: "🎵", video: "🎬" };
const CAT = Object.fromEntries(P.CATEGORIES.map((c) => [c.id, c]));

/* ---------- Saqlash ---------- */
const store = {
  get(k, def) { try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch { return def; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* xotira to'la */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* e'tiborsiz */ } },
  keys() { try { return Object.keys(localStorage); } catch { return []; } },
};
function loadSettings() {
  const def = { sound: true, vibration: true, timer: true };
  const s = store.get(KEYS.settings, def);
  if (!s || typeof s !== "object") return def;
  return Object.fromEntries(Object.keys(def).map((k) => [k, typeof s[k] === "boolean" ? s[k] : def[k]]));
}
function loadRecords() {
  const r = store.get(KEYS.records, []);
  return Array.isArray(r) ? r.filter((x) => x && typeof x.score === "number" && typeof x.name === "string").map((x) => ({ ...x, packId: x.packId || "klassik" })) : [];
}
function savedGameRaw(id) { return store.get(KEYS.game(id), null); }
function savedGame(pack) {
  const g = savedGameRaw(pack.id);
  if (P.isValidGame(g, pack)) return g;
  if (localStorage.getItem(KEYS.game(pack.id)) !== null) store.del(KEYS.game(pack.id)); // buzilgan saqlovni tozalash
  return null;
}
function savedPackIds() {
  const pre = "uzquiz.game.";
  return store.keys().filter((k) => k.startsWith(pre) && (PREVIEW ? k.endsWith(".preview") : !k.endsWith(".preview"))).map((k) => k.slice(pre.length).replace(/\.preview$/, ""));
}

/** v1 → v2: eski saqlangan o'yin va rekordlarni «klassik» paketga o'tkazish (bir marta). */
function migrateV1Storage() {
  if (PREVIEW) return;
  const old = store.get("uzquiz.game", null);
  if (old && typeof old === "object" && !store.get(KEYS.game("klassik"), null)) store.set(KEYS.game("klassik"), { ...old, v: 2, packId: "klassik" });
  if (localStorage.getItem("uzquiz.game") !== null) store.del("uzquiz.game");
  const recs = store.get(KEYS.records, null);
  if (Array.isArray(recs) && recs.some((r) => r && !r.packId)) store.set(KEYS.records, recs.map((r) => ({ ...r, packId: r.packId || "klassik", packTitle: r.packTitle || "Uzquiz Klassik" })));
}

let settings = loadSettings();
let catalogue = null;         // index.json dagi nashr qilingan paketlar
const packs = new Map();      // id → paket (to'liq)
let pack = null;              // joriy paket
let game = null;
let timer = null;
let answered = false;
let lastResult = null;
let media = null;             // joriy savol mediasi holati
let route = "home";
let filter = { query: "", category: "" };
const blobUrls = new Map();

const app = document.getElementById("app");
const modalRoot = document.getElementById("modal-root");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const R = () => pack.rounds[game.round];
const Q = () => R().questions[game.q];

function render(html, accent) {
  stopTimer();
  stopMedia();
  closeModal();
  app.style.setProperty("--accent", accent || "var(--primary)");
  app.innerHTML = `<section class="screen">${html}</section>`;
  app.scrollTop = 0;
  window.scrollTo(0, 0);
}

/* ---------- Yo'nalish (orqaga tugmasi uchun) ---------- */
function go(hash, replace = false) {
  if (location.hash === hash) return;
  if (replace) history.replaceState(null, "", hash || location.pathname + location.search);
  else history.pushState(null, "", hash || location.pathname + location.search);
}
window.addEventListener("popstate", () => {
  if (route === "game" && game) {
    // o'yin paytida «orqaga» — chiqishni so'raymiz
    history.pushState(null, "", `#/play/${pack.id}`);
    actions.exit();
    return;
  }
  routeFromHash();
});
async function routeFromHash() {
  const m = /^#\/(pack|play)\/([a-z0-9-]+)/.exec(location.hash);
  const page = location.hash.slice(2);
  if (m) {
    const p = await openPack(m[2]);
    if (!p) return showHome();
    if (m[1] === "play" && savedGame(p)) return resumeGame(savedGame(p));
    return showDetail();
  }
  if (page === "records") return showRecords();
  if (page === "settings") return showSettings();
  if (page === "howto") return showHowto();
  showHome();
}

/* ---------- Ma'lumot yuklash ---------- */
async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
async function loadCatalogue() {
  if (catalogue) return catalogue;
  const idx = await fetchJSON("packs/index.json");
  catalogue = P.visiblePacks(idx);
  return catalogue;
}
async function loadPack(id) {
  if (PREVIEW && id === PREVIEW_ID) {
    const d = store.get(`uzquiz.admin.draft.${id}`, null);
    if (d && d.pack && !P.validatePack(d.pack).errors.length) return d.pack;
  }
  if (packs.has(id)) return packs.get(id);
  const p = await fetchJSON(`packs/${id}/pack.json`);
  const v = P.validatePack(p);
  if (v.errors.length) throw new Error("Paket fayli buzilgan");
  packs.set(id, p);
  return p;
}
async function openPack(id) {
  try {
    pack = await loadPack(id);
    return pack;
  } catch (e) {
    toast(navigator.onLine === false ? "Internet yo'q — paketni yuklab bo'lmadi" : "Paketni yuklab bo'lmadi");
    return null;
  }
}
/** Media faylining manzili. Ko'rib chiqishda hali nashr qilinmagan fayllar IndexedDB'dan olinadi. */
async function mediaUrl(packId, src) {
  if (!src) return "";
  if (/^(https?:|blob:|data:)/.test(src)) return src;
  if (PREVIEW && packId === PREVIEW_ID) {
    const key = `${packId}/${src}`;
    if (blobUrls.has(key)) return blobUrls.get(key);
    try {
      const blob = await mediaStore.get(key);
      if (blob) { const u = URL.createObjectURL(blob); blobUrls.set(key, u); return u; }
    } catch { /* IndexedDB yo'q */ }
  }
  return `packs/${packId}/${src}`;
}
function coverHtml(entry, cls = "") {
  const c = entry.cover || {};
  if (c.type === "image" && c.src) return `<div class="cover ${cls}"><img src="packs/${esc(entry.id)}/${esc(c.src)}" alt="${esc(c.alt || entry.title)}" loading="lazy" /></div>`;
  return `<div class="cover ${cls}" aria-hidden="true"><span>${esc(c.value || "❓")}</span></div>`;
}

/* ---------- Ovoz va tebranish ---------- */
let audioCtx = null;
function tone(freqs, dur = 0.12, type = "sine", gain = 0.08) {
  if (!settings.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    freqs.forEach((f, i) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain(), t = audioCtx.currentTime + i * dur;
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t + dur);
    });
  } catch { /* ovoz yo'q */ }
}
const sfx = {
  correct: () => tone([660, 880], 0.11, "triangle"),
  wrong: () => tone([220, 160], 0.16, "sawtooth", 0.05),
  tick: () => tone([1000], 0.04, "square", 0.02),
  win: () => tone([523, 659, 784, 1046], 0.13, "triangle"),
  click: () => tone([440], 0.04, "sine", 0.03),
};
function vibrate(p) {
  const activated = !navigator.userActivation || navigator.userActivation.hasBeenActive;
  if (settings.vibration && navigator.vibrate && activated) { try { navigator.vibrate(p); } catch { /* e'tiborsiz */ } }
}

/* ---------- Toast va modal ---------- */
let toastTimer;
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}
function openModal({ emoji, title, text, actions: acts }) {
  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-modal-backdrop>
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="e" aria-hidden="true">${emoji}</div>
        <h3 id="modal-title">${esc(title)}</h3>
        <p>${esc(text)}</p>
        ${acts.map((a, i) => `<button class="btn ${a.cls}" data-modal-act="${i}">${esc(a.label)}</button>`).join("")}
      </div>
    </div>`;
  modalRoot.firstElementChild.addEventListener("click", (e) => {
    const b = e.target.closest("[data-modal-act]");
    if (b) { const a = acts[+b.dataset.modalAct]; closeModal(); a.onClick && a.onClick(); }
    else if (e.target.hasAttribute("data-modal-backdrop")) { const c = acts.find((a) => a.cancel); closeModal(); c && c.onClick && c.onClick(); }
  });
  modalRoot.querySelector("[data-modal-act]").focus();
}
function closeModal() { modalRoot.innerHTML = ""; }
const modalOpen = () => !!modalRoot.firstElementChild;

/* ---------- Taymer ---------- */
function startTimer(limit, onTimeout) {
  stopTimer();
  timer = { limit, remaining: limit, last: performance.now(), running: true, onTimeout, lastSec: limit, started: true };
  timer.id = setInterval(tickTimer, 100);
  drawTimer();
}
/** Taymer yaratiladi, lekin media boshlanguncha to'xtab turadi (MD-04). */
function armTimer(limit, onTimeout) {
  startTimer(limit, onTimeout);
  timer.running = false;
  timer.started = false;
  drawTimer();
}
function tickTimer() {
  if (!timer || !timer.running) return;
  const now = performance.now();
  timer.remaining = Math.max(0, timer.remaining - (now - timer.last) / 1000);
  timer.last = now;
  const sec = Math.ceil(timer.remaining);
  if (sec !== timer.lastSec) { timer.lastSec = sec; if (sec <= 5 && sec > 0) sfx.tick(); }
  drawTimer();
  if (timer.remaining <= 0) { const cb = timer.onTimeout; stopTimer(); cb && cb(); }
}
function drawTimer() {
  const el = document.getElementById("timer");
  if (!el || !timer) return;
  const sec = Math.ceil(timer.remaining);
  el.querySelector(".num").textContent = sec;
  el.querySelector(".bar").style.strokeDashoffset = String(RING * (1 - timer.remaining / timer.limit));
  el.classList.toggle("low", sec <= 5 && timer.started);
  el.classList.toggle("waiting", !timer.started);
  el.setAttribute("aria-label", timer.started ? `Qolgan vaqt: ${sec} soniya` : "Taymer media boshlanishini kutmoqda");
}
function pauseTimer() { if (timer && timer.running) { tickTimer(); if (timer) timer.running = false; } }
function resumeTimer() {
  if (timer && !timer.running && timer.started && !(media && media.buffering)) { timer.last = performance.now(); timer.running = true; }
}
function beginTimer() {
  if (timer && !timer.started) { timer.started = true; timer.last = performance.now(); timer.running = !modalOpen() && !document.hidden; drawTimer(); }
}
function stopTimer() { if (timer) clearInterval(timer.id); timer = null; }
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { pauseTimer(); media && media.el && !media.el.paused && media.el.pause(); }
  else if (!modalOpen()) resumeTimer();
});

/* ---------- O'yin holati ---------- */
function save() { if (game) store.set(KEYS.game(game.packId), game); }
function newGame(name) {
  game = {
    v: 2, packId: pack.id, packTitle: pack.title, name, round: 0, q: 0, phase: "intro", score: 0, streak: 0,
    timerOn: settings.timer,
    results: pack.rounds.map(() => []),
    orders: pack.rounds.map((r) => r.questions.map((q) => (q.type === "choice" ? L.shuffle(q.options.map((_, i) => i)) : null))),
    startedAt: Date.now(),
  };
  route = "game";
  go(`#/play/${pack.id}`);
  save();
  showIntro();
}
function resumeGame(g) {
  game = g;
  route = "game";
  go(`#/play/${pack.id}`, location.hash.startsWith("#/play/"));
  if (typeof game.streak !== "number") game.streak = 0;
  if (game.phase === "roundEnd") return showRoundEnd();
  if (game.phase === "intro") return showIntro();
  if (game.phase === "feedback") return nextQuestion();
  if (game.q >= R().questions.length) return showRoundEnd();
  showQuestion();
}
function leaveGame() { stopTimer(); stopMedia(); save(); game = null; showDetail(); }

/* ---------- Bosh sahifa: katalog ---------- */
async function showHome() {
  try { await drawHome(); }
  catch (e) {
    console.warn("Katalogni chizishda xato", e);
    if (route === "home") render(`${homeHeader()}<div class="empty card"><span class="e" aria-hidden="true">⚠️</span>Nimadir noto'g'ri ketdi.<br/>Qayta urinib ko'ring.</div><button class="btn btn-primary" data-act="retry">🔄 Qayta urinish</button>`);
  }
}
async function drawHome() {
  route = "home";
  game = null;
  go("", true);
  if (!catalogue) render(`${homeHeader()}<p class="muted center" style="margin-top:30vh">Yuklanmoqda…</p>`);
  let list;
  try { list = await loadCatalogue(); }
  catch {
    if (route !== "home") return;
    return render(`
      ${homeHeader()}
      <div class="empty card"><span class="e" aria-hidden="true">📡</span>Paketlar ro'yxatini yuklab bo'lmadi.<br/>Internet aloqasini tekshiring.</div>
      <button class="btn btn-primary" data-act="retry">🔄 Qayta urinish</button>`);
  }
  if (route !== "home") return;
  // BUG-16: faqat o'qiladigan va tuzilishi to'g'ri saqlangan o'yinlar ko'rsatiladi; buzilganlari o'chiriladi
  const inProgress = savedPackIds().map((id) => {
    const entry = list.find((p) => p.id === id);
    const g = savedGameRaw(id);
    const okShape = entry && g && typeof g === "object" && g.packId === id && Number.isInteger(g.round) && g.round >= 0 && g.round < entry.roundCount && typeof g.score === "number";
    if (!okShape) { store.del(KEYS.game(id)); return null; }
    return entry;
  }).filter(Boolean);
  const records = loadRecords();
  const best = (id) => records.filter((r) => r.packId === id).reduce((m, r) => Math.max(m, r.score), -1);
  const cats = P.CATEGORIES.filter((c) => list.some((p) => p.category === c.id));
  const shown = P.searchPacks(list, filter);
  const card = (p) => {
    const b = best(p.id);
    return `
      <button class="pack-card" data-act="open" data-id="${esc(p.id)}" aria-label="${esc(p.title)} paketi">
        ${coverHtml(p)}
        <span class="pc-body">
          <span class="pc-badges">
            ${p.price ? `<span class="badge-s price">${p.price.toLocaleString("uz")} so'm</span>` : `<span class="badge-s free">Bepul</span>`}
            ${P.isNew(p) ? `<span class="badge-s new">Yangi</span>` : ""}
            ${inProgress.some((x) => x.id === p.id) ? `<span class="badge-s cont">Davom ettirish</span>` : ""}
          </span>
          <b class="pc-title">${esc(p.title)}</b>
          <span class="pc-desc">${esc(p.description)}</span>
          <span class="pc-meta">${p.questionCount} savol · ~${p.estMinutes} daq ${p.mediaTypes.map((t) => `<span title="${t}">${MEDIA_ICON[t]}</span>`).join("")}${b >= 0 ? ` · 🏆 ${b}` : ""}</span>
        </span>
      </button>`;
  };
  render(`
    ${homeHeader()}
    ${inProgress.length ? `
      <div class="section-h">▶ Davom ettirish</div>
      <div class="cont-row">${inProgress.map((p) => {
        const g = savedGameRaw(p.id);
        return `<button class="cont-card" data-act="open" data-id="${esc(p.id)}">${coverHtml(p, "sm")}<span><b>${esc(p.title)}</b><small>${(g.round || 0) + 1}-raund · ${g.score || 0} ochko</small></span></button>`;
      }).join("")}</div>` : ""}
    <div class="search-wrap">
      <label class="sr-only" for="search">Paket qidirish</label>
      <input id="search" class="input" type="search" placeholder="🔍 Paket qidirish…" value="${esc(filter.query)}" autocomplete="off" enterkeyhint="search" />
    </div>
    <div class="cat-chips" role="group" aria-label="Toifalar">
      <button class="chip-btn ${filter.category ? "" : "on"}" data-act="cat" data-id="">Hammasi</button>
      ${cats.map((c) => `<button class="chip-btn ${filter.category === c.id ? "on" : ""}" data-act="cat" data-id="${c.id}">${c.icon} ${esc(c.title)}</button>`).join("")}
    </div>
    <div class="section-h">📦 Paketlar <small class="muted">(${shown.length})</small></div>
    <div class="pack-list" id="pack-list">
      ${shown.length ? shown.map(card).join("") : `<div class="empty card"><span class="e" aria-hidden="true">🔍</span>Hech narsa topilmadi.<br/>Boshqa so'z bilan qidirib ko'ring.</div>`}
    </div>
  `);
  const s = document.getElementById("search");
  s.addEventListener("input", () => {
    filter.query = s.value;
    const pos = s.selectionStart;
    showHome().then(() => { const n = document.getElementById("search"); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch { /* e'tiborsiz */ } } });
  });
}
function homeHeader() {
  return `
    <div class="cat-head">
      <div class="logo-mini" aria-hidden="true">Uz</div>
      <div class="ch-title"><h1>Uzquiz</h1><small>Savollar paketlari</small></div>
      <button class="icon-btn" data-act="records" aria-label="Rekordlar">🏆</button>
      <button class="icon-btn" data-act="howto" aria-label="Qanday o'ynaladi?">📖</button>
      <button class="icon-btn" data-act="settings" aria-label="Sozlamalar">⚙️</button>
    </div>`;
}

/* ---------- Paket sahifasi ---------- */
function showDetail() {
  route = "detail";
  game = null;
  go(`#/pack/${pack.id}`, location.hash.startsWith("#/play/"));
  const entry = P.catalogueEntry(pack);
  const saved = savedGame(pack);
  const recs = loadRecords().filter((r) => r.packId === pack.id);
  const best = recs.length ? L.topRecords(recs, 1)[0] : null;
  const cat = CAT[pack.category];
  const name = store.get(KEYS.name, "");
  render(`
    <div class="topbar"><button class="icon-btn" data-act="home" aria-label="Orqaga">←</button><h2></h2>
      <button class="icon-btn" data-act="sharePack" aria-label="Paketni ulashish">📤</button></div>
    <div class="detail-hero">
      ${coverHtml(entry, "lg")}
      <div class="chips">
        ${cat ? `<span class="chip">${cat.icon} ${esc(cat.title)}</span>` : ""}
        <span class="chip">${esc(pack.ageRating)}</span>
        ${entry.price ? `<span class="chip">${entry.price.toLocaleString("uz")} so'm</span>` : `<span class="chip free">Bepul</span>`}
      </div>
      <h1 class="intro-title">${esc(pack.title)}</h1>
      <p class="muted center" style="margin:0;line-height:1.5">${esc(pack.description)}</p>
    </div>
    <div class="stat-row">
      <div class="card stat"><b>${entry.roundCount}</b><span>raund</span></div>
      <div class="card stat"><b>${entry.questionCount}</b><span>savol</span></div>
      <div class="card stat"><b>~${entry.estMinutes}</b><span>daqiqa</span></div>
    </div>
    ${entry.mediaTypes.length ? `<div class="chips">${entry.mediaTypes.map((t) => `<span class="chip">${MEDIA_ICON[t]} ${{ image: "Rasmlar", audio: "Tovushlar", video: "Videolar" }[t]}</span>`).join("")}</div>` : ""}
    <div class="card list-rounds">
      ${pack.rounds.map((r, i) => `<div class="lr"><span class="e" aria-hidden="true">${esc(r.icon)}</span><span class="name">${i + 1}. ${esc(r.title)}</span><small class="muted">${r.kind !== "standard" ? P.ROUND_KINDS[r.kind] + " · " : ""}${r.questions.length} savol</small></div>`).join("")}
    </div>
    ${best ? `<div class="card best"><div style="font-size:26px" aria-hidden="true">🏆</div><div style="flex:1"><small class="muted">Eng yaxshi natija</small><div class="big">${best.score} ochko</div></div><small class="muted">${esc(best.name)}</small></div>` : ""}
    <div class="field">
      <label for="name">Ismingiz</label>
      <input id="name" class="input" maxlength="20" autocomplete="nickname" placeholder="Ismingizni kiriting" value="${esc(name)}" enterkeyhint="go" />
    </div>
    ${saved ? `
      <button class="btn btn-success" data-act="continue">▶ Davom ettirish <small style="font-weight:700;opacity:.8">· ${saved.round + 1}-raund · ${saved.score} ochko</small></button>
      <button class="btn btn-secondary" data-act="start">🔄 Qaytadan boshlash</button>` : `
      <button class="btn btn-primary" data-act="start">🚀 O'ynash</button>`}
  `, pack.rounds[0].color);
  document.getElementById("name").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); actions.start(); } });
}

/* ---------- Raund kirish ---------- */
function showIntro() {
  const r = R();
  game.phase = "intro";
  save();
  render(`
    <div class="topbar">
      <button class="icon-btn" data-act="exit" aria-label="O'yindan chiqish">✕</button>
      <h2 class="muted" style="font-size:14px;text-align:center">${esc(pack.title)}</h2>
      <div class="score-pill">⭐ ${game.score}</div>
    </div>
    <div class="intro-badge" aria-hidden="true">${esc(r.icon)}</div>
    <div class="intro-step">Raund ${game.round + 1} / ${pack.rounds.length}</div>
    <h1 class="intro-title">${esc(r.title)}</h1>
    <div class="round-dots" aria-hidden="true">${pack.rounds.map((_, i) => `<i class="${i < game.round ? "done" : i === game.round ? "cur" : ""}"></i>`).join("")}</div>
    ${r.description ? `<div class="card center"><p style="margin:0;line-height:1.5">${esc(r.description)}</p></div>` : ""}
    <div class="rules">
      <div class="card"><b>${r.questions.length}</b><span>savol</span></div>
      <div class="card"><b>${game.timerOn ? `${r.timeLimit}s` : "∞"}</b><span>har savolga</span></div>
      <div class="card"><b>${r.kind === "theme" ? "🕵️" : r.kind === "chain" ? "🔗" : "⭐"}</b><span>${r.kind === "standard" ? `${r.points || 10} ochko` : P.ROUND_KINDS[r.kind]}</span></div>
    </div>
    <div class="spacer"></div>
    <button class="btn btn-primary" data-act="beginRound">Boshlash</button>
  `, r.color);
  app.querySelector("[data-act=beginRound]").focus({ preventScroll: true });
}

/* ---------- Media ---------- */
function stopMedia() {
  if (media && media.el) { try { media.el.pause(); } catch { /* e'tiborsiz */ } }
  media = null;
}
function mediaBlock(m, role = "main") {
  if (!m) return "";
  if (m.type === "emoji") return `<div class="q-image" role="img" aria-label="Savol rasmi">${esc(m.value)}</div>`;
  if (m.type === "image") return `<div class="media-box img" data-media="${role}"><div class="skel" aria-hidden="true"></div><img alt="${esc(m.alt || "")}" /></div>`;
  if (m.type === "audio") return `
    <div class="media-box audio" data-media="${role}">
      <audio preload="auto"></audio>
      <button class="play-big" data-act="mplay" data-role="${role}" aria-label="Tinglash">▶</button>
      <div class="m-info"><b class="m-label">Tinglang</b><div class="m-bar"><i></i></div></div>
      <div class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      ${role === "main" ? `<button class="replay" data-act="mreplay" data-role="${role}" hidden>🔁 <span></span></button>` : ""}
    </div>`;
  if (m.type === "video") return `
    <div class="media-box video" data-media="${role}">
      <video playsinline webkit-playsinline preload="auto" disablepictureinpicture aria-label="${esc(m.alt || "Video")}"></video>
      <button class="play-over" data-act="mplay" data-role="${role}" aria-label="Videoni ko'rish">▶</button>
      <div class="m-bar"><i></i></div>
      ${role === "main" ? `<button class="replay" data-act="mreplay" data-role="${role}" hidden>🔁 <span></span></button>` : ""}
    </div>`;
  return "";
}
/** Mediani yuklash va hodisalarni ulash. onReady — rasm yuklanganda; onFail — 2 urinishdan keyin. */
async function mountMedia(m, role, { onReady, onFail } = {}) {
  const box = app.querySelector(`[data-media="${role}"]`);
  if (!box || !m || m.type === "emoji") { onReady && onReady(); return; }
  const url = await mediaUrl(pack.id, m.src);
  if (!box.isConnected) return;
  let tries = 0;
  const fail = () => {
    tries++;
    if (tries <= 2) { setTimeout(() => { if (box.isConnected) el.src = url + (url.startsWith("blob:") ? "" : (url.includes("?") ? "&" : "?") + "r=" + tries); }, 400 * tries); return; }
    box.classList.add("failed");
    onFail && onFail();
  };
  if (m.type === "image") {
    var el = box.querySelector("img");
    el.onload = () => { box.classList.add("ready"); onReady && onReady(); };
    el.onerror = fail;
    el.src = url;
    return;
  }
  el = box.querySelector(m.type);
  const st = { el, m, role, box, plays: 0, playing: false, buffering: false, ended: false, maxReplays: m.maxReplays ?? 1 };
  if (role === "main") media = st;
  const start = m.start || 0, end = m.end || null;
  const bar = box.querySelector(".m-bar i");
  el.addEventListener("error", fail);
  el.addEventListener("loadedmetadata", () => box.classList.add("ready"));
  el.addEventListener("timeupdate", () => {
    const dur = (end || el.duration || 1) - start;
    if (bar) bar.style.width = `${Math.min(100, Math.max(0, ((el.currentTime - start) / dur) * 100))}%`;
    if (end && el.currentTime >= end) { el.pause(); onEnded(); }
  });
  el.addEventListener("ended", onEnded);
  el.addEventListener("playing", () => {
    st.playing = true; st.buffering = false; box.classList.add("playing"); box.classList.remove("buffering");
    if (role === "main") { beginTimer(); if (!modalOpen() && !document.hidden) resumeTimer(); }
  });
  el.addEventListener("waiting", () => { st.buffering = true; box.classList.add("buffering"); if (role === "main") pauseTimer(); });
  el.addEventListener("pause", () => { st.playing = false; box.classList.remove("playing"); });
  function onEnded() {
    st.ended = true; st.playing = false; box.classList.remove("playing"); box.classList.add("ended");
    if (role !== "main") return;
    const left = st.maxReplays - Math.max(0, st.plays - 1);
    const rb = box.querySelector(".replay");
    if (rb && !answered) { rb.hidden = left <= 0; rb.querySelector("span").textContent = `Qayta (${left})`; }
    // tugagandan keyin katta ▶ o'rniga faqat «Qayta» tugmasi; urinish qolmasa — ijro o'chiriladi
    box.querySelectorAll('[data-act="mplay"]').forEach((b) => (b.disabled = left <= 0));
    box.classList.toggle("no-replay", left <= 0);
  }
  st.play = () => {
    if (st.playing) return;
    const replay = st.plays > 0;
    if (replay && st.plays - 1 >= st.maxReplays) return;
    st.plays++;
    st.ended = false;
    box.classList.remove("ended");
    const rb = box.querySelector(".replay"); if (rb) rb.hidden = true;
    try { el.currentTime = start; } catch { /* metadata yo'q */ }
    const p = el.play();
    if (p && p.catch) p.catch(() => { st.plays--; toast("Ijro etish uchun yana bir bor bosing"); });
  };
  box._st = st;
  el.src = url + (start || end ? `#t=${start}${end ? "," + end : ""}` : "");
  el.load();
}
/** Keyingi savol mediasini oldindan yuklash (MD-07). */
async function preloadNext() {
  let ri = game.round, qi = game.q + 1;
  if (qi >= pack.rounds[ri].questions.length) { ri++; qi = 0; }
  const q = pack.rounds[ri] && pack.rounds[ri].questions[qi];
  for (const m of [q && q.media, q && q.reveal]) {
    if (!m || m.type === "emoji") continue;
    const url = await mediaUrl(pack.id, m.src);
    if (url.startsWith("blob:")) continue;
    if (m.type === "image") { const i = new Image(); i.src = url; }
    else fetch(url).catch(() => {});
  }
}

/* ---------- Savol ekrani ---------- */
function showQuestion() {
  const r = R(), q = Q();
  const limit = P.questionTime(r, q);
  game.phase = "question";
  save();
  answered = false;
  let body = "";
  if (q.type === "choice") {
    const order = game.orders[game.round][game.q];
    body = `<div class="options" id="options" role="group" aria-label="Javob variantlari">
      ${order.map((oi, i) => `<button class="option" data-opt="${oi}"><span class="key">${LETTERS[i]}</span><span>${esc(q.options[oi])}</span></button>`).join("")}
    </div>`;
  } else if (q.type === "truefalse") {
    body = `<div class="options tf" id="options" role="group" aria-label="Ha yoki yo'q">
      <button class="option" data-tf="true"><span class="key">✓</span><span>Ha, to'g'ri</span></button>
      <button class="option" data-tf="false"><span class="key">✕</span><span>Yo'q, noto'g'ri</span></button>
    </div>`;
  } else {
    const letter = r.kind === "chain" ? L.chainHintLetter(r, game.q) : L.firstLetter(q.answer);
    const letters = L.uzLetters(q.answer);
    body = `
      <div class="hint">
        <div class="hint-text">Javob «<b>${esc(L.capLetter(letter))}</b>» harfi bilan boshlanadi · ${letters.length} ta harf</div>
        <div class="letters" aria-hidden="true">${letters.map((l, i) => `<i class="${i === 0 ? "first" : ""}">${i === 0 ? esc(L.capLetter(l)) : ""}</i>`).join("")}</div>
      </div>
      <form id="text-form" autocomplete="off">
        <label class="sr-only" for="answer">Javobingiz</label>
        <input id="answer" class="input" placeholder="Javobni yozing…" autocapitalize="words" autocorrect="off" spellcheck="false" enterkeyhint="send" />
        <div class="btn-row" style="margin-top:10px">
          <button type="button" class="btn btn-secondary" data-act="skip">O'tkazib yuborish</button>
          <button type="submit" class="btn btn-primary">Javob berish</button>
        </div>
      </form>`;
  }
  const waitsForMedia = q.media && q.media.type !== "emoji";
  render(`
    <div class="q-head">
      <button class="icon-btn" data-act="exit" aria-label="O'yindan chiqish">✕</button>
      <div class="meta"><small>Raund ${game.round + 1} · ${esc(r.title)}</small><b>Savol ${game.q + 1} / ${r.questions.length}</b></div>
      <div class="score-pill" id="score">⭐ ${game.score}</div>
    </div>
    <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${r.questions.length}" aria-valuenow="${game.q}"><i id="progress" style="width:${(game.q / r.questions.length) * 100}%"></i></div>
    <div class="timer-wrap">
      ${game.timerOn ? `
        <div class="timer" id="timer" role="timer" aria-label="Qolgan vaqt: ${limit} soniya">
          <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
            <circle class="track" cx="32" cy="32" r="28" fill="none" stroke-width="6"/>
            <circle class="bar" cx="32" cy="32" r="28" fill="none" stroke-width="6" stroke-dasharray="${RING}" stroke-dashoffset="0"/>
          </svg>
          <div class="num">${limit}</div>
        </div>` : `<span class="chip">∞ Vaqt cheklanmagan</span>`}
      ${game.streak >= 3 ? `<span class="streak">🔥 ${game.streak} ketma-ket</span>` : ""}
      ${waitsForMedia && game.timerOn && q.media.type !== "image" ? `<span class="chip wait-chip" id="wait-chip">▶ bosing</span>` : ""}
    </div>
    <div class="card q-card">
      ${mediaBlock(q.media, "main")}
      <p class="q-text">${esc(q.text)}</p>
    </div>
    ${body}
    <div id="fb"></div>
  `, r.color);

  if (q.type === "text") {
    document.getElementById("text-form").addEventListener("submit", (e) => { e.preventDefault(); submitText(); });
    if (!waitsForMedia) setTimeout(() => document.getElementById("answer")?.focus({ preventScroll: true }), 250);
  }
  const onTimeout = () => finishAnswer(false, "timeout");
  if (game.timerOn) {
    if (waitsForMedia) armTimer(limit, onTimeout); else startTimer(limit, onTimeout);
  }
  mountMedia(q.media, "main", {
    onReady: () => { if (q.media && q.media.type === "image") beginTimer(); },
    onFail: () => mediaFailed(),
  });
  preloadNext();
}

function mediaFailed() {
  if (answered) return;
  pauseTimer();
  const fb = document.getElementById("fb");
  if (!fb) return;
  fb.innerHTML = `
    <div class="feedback bad" role="alert">
      <div class="fb-title"><span>Media yuklanmadi 📡</span></div>
      <div class="fb-answer">Internet aloqasi sekin yoki fayl topilmadi. Bu savolni jarimasiz o'tkazib yuborishingiz mumkin — u natijaga ta'sir qilmaydi.</div>
      <button class="btn btn-primary" data-act="mediaSkip">Jarimasiz o'tkazish →</button>
    </div>`;
}

function chooseOption(btn) {
  if (answered || modalOpen()) return;
  const q = Q();
  const correct = btn.dataset.tf !== undefined ? (btn.dataset.tf === "true") === q.answer : +btn.dataset.opt === q.answer;
  document.getElementById("options").classList.add("locked");
  if (!correct) btn.classList.add("wrong");
  btn.classList.add("picked");
  finishAnswer(correct, correct ? "ok" : "wrong");
}
function submitText() {
  if (answered || modalOpen()) return;
  const input = document.getElementById("answer");
  if (!L.normalize(input.value)) {
    input.classList.remove("shake"); void input.offsetWidth; input.classList.add("shake"); vibrate(30);
    return;
  }
  const correct = L.isTextCorrect(input.value, Q());
  finishAnswer(correct, correct ? "ok" : "wrong");
}

function correctText(q) {
  if (q.type === "choice") return q.options[q.answer];
  if (q.type === "truefalse") return q.answer ? "Ha, to'g'ri" : "Yo'q, noto'g'ri";
  return q.answer;
}

function finishAnswer(correct, reason) {
  if (answered) return;
  answered = true;
  const r = R(), q = Q();
  const limit = P.questionTime(r, q);
  const excluded = reason === "mediaFail";
  const timeLeft = timer && timer.started ? timer.remaining : limit;
  stopTimer();
  if (media && media.el) { try { media.el.pause(); } catch { /* e'tiborsiz */ } }
  app.querySelectorAll(".replay").forEach((b) => (b.hidden = true));
  app.querySelectorAll('[data-act="mplay"]').forEach((b) => (b.disabled = true));
  const showCorrect = pack.settings?.showCorrect !== false;

  const points = excluded ? 0 : L.calcPoints({ correct, timeLeft, timeLimit: limit, base: P.questionPoints(r, q), timerOn: game.timerOn && pack.settings?.speedBonus !== false });
  game.results[game.round][game.q] = excluded ? { c: false, p: 0, x: true } : { c: correct, p: points };
  game.score += points;
  if (!excluded) game.streak = correct ? game.streak + 1 : 0;
  game.phase = "feedback";
  save();

  const opts = document.getElementById("options");
  if (opts) {
    opts.classList.add("locked");
    if (showCorrect || correct) {
      const sel = q.type === "truefalse" ? `[data-tf="${q.answer}"]` : `[data-opt="${q.answer}"]`;
      opts.querySelector(sel)?.classList.add("correct");
    }
  } else {
    const input = document.getElementById("answer");
    if (input) { input.disabled = true; input.blur(); }
    document.querySelectorAll("#text-form button").forEach((b) => (b.disabled = true));
    if (showCorrect || correct) {
      const boxes = document.querySelectorAll(".letters i");
      L.uzLetters(q.answer).forEach((l, i) => { if (boxes[i]) { boxes[i].textContent = L.capLetter(l); boxes[i].classList.add(correct ? "ok" : "bad"); } });
    }
  }
  document.getElementById("progress").style.width = `${((game.q + 1) / r.questions.length) * 100}%`;
  const pill = document.getElementById("score");
  pill.textContent = `⭐ ${game.score}`;
  if (correct) pill.classList.add("bump");
  if (!excluded) { if (correct) { sfx.correct(); vibrate(25); } else { sfx.wrong(); vibrate([40, 60, 40]); } }

  const title = excluded ? "Savol hisobga olinmadi" : correct ? "To'g'ri! 🎉" : reason === "timeout" ? "Vaqt tugadi ⏰" : reason === "skip" ? "O'tkazib yuborildi ⏭️" : "Noto'g'ri 😕";
  const last = game.q === r.questions.length - 1;
  const showAnswerLine = !excluded && !q.final && showCorrect && !(correct && q.type !== "text");
  document.getElementById("fb").innerHTML = `
    <div class="feedback ${correct ? "ok" : "bad"}" role="alert">
      <div class="fb-title"><span>${title}</span><span class="pts">+${points}</span></div>
      ${q.final ? `<div class="theme-reveal">🕵️ Yashirin mavzu: ${esc(r.hiddenTheme)}</div>` : ""}
      ${showAnswerLine ? `<div class="fb-answer">To'g'ri javob: <b>${esc(correctText(q))}</b></div>` : ""}
      ${q.reveal ? mediaBlock(q.reveal, "reveal") : ""}
      ${q.fact && !excluded ? `<div class="fb-fact">💡 ${esc(q.fact)}</div>` : ""}
      <button class="btn btn-primary" data-act="next">${last ? "Raund natijasi" : "Keyingi"} →</button>
    </div>`;
  if (q.reveal) mountMedia(q.reveal, "reveal");
  const nextBtn = app.querySelector("[data-act=next]");
  nextBtn.focus({ preventScroll: true });
  nextBtn.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function nextQuestion() {
  if (game.q + 1 < R().questions.length) { game.q += 1; showQuestion(); }
  else { game.q = R().questions.length; showRoundEnd(); }
}

function roundStats(ri, g = game) {
  const res = (g.results[ri] || []).filter(Boolean);
  const counted = res.filter((x) => !x.x);
  return {
    correct: counted.filter((x) => x.c).length,
    points: res.reduce((s, x) => s + x.p, 0),
    total: pack.rounds[ri].questions.length - res.filter((x) => x.x).length,
  };
}

function showRoundEnd() {
  const r = R();
  game.phase = "roundEnd";
  save();
  const st = roundStats(game.round);
  const lastRound = game.round === pack.rounds.length - 1;
  const ratio = st.total ? st.correct / st.total : 0;
  const emoji = ratio === 1 ? "🏆" : ratio >= 0.7 ? "🎉" : ratio >= 0.4 ? "👍" : "💪";
  const msg = ratio === 1 ? "Mukammal! Barcha javoblar to'g'ri!" : ratio >= 0.7 ? "Ajoyib natija!" : ratio >= 0.4 ? "Yaxshi, davom eting!" : "Taslim bo'lmang, keyingisi albatta yaxshiroq bo'ladi!";
  render(`
    <div class="topbar"><button class="icon-btn" data-act="exit" aria-label="O'yindan chiqish">✕</button><h2></h2></div>
    <div class="result-hero">
      <div class="emoji" aria-hidden="true">${emoji}</div>
      <div class="intro-step">${game.round + 1}-raund yakunlandi</div>
      <h2>${esc(r.title)}</h2>
      <p class="muted" style="margin:4px 0 0">${msg}</p>
    </div>
    <div class="stat-row">
      <div class="card stat"><b>${st.correct} / ${st.total}</b><span>to'g'ri javob</span></div>
      <div class="card stat"><b>+${st.points}</b><span>raund ochkosi</span></div>
      <div class="card stat"><b>${game.score}</b><span>jami ochko</span></div>
    </div>
    <div class="round-dots" aria-hidden="true">${pack.rounds.map((_, i) => `<i class="${i <= game.round ? "done" : ""}"></i>`).join("")}</div>
    <div class="spacer"></div>
    <button class="btn btn-primary" data-act="nextRound">${lastRound ? "🏁 Natijalarni ko'rish" : "Keyingi raund →"}</button>
  `, r.color);
  if (ratio === 1) sfx.win();
}

function finishGame() {
  if (!game) return;
  const per = pack.rounds.map((_, i) => roundStats(i));
  const correct = per.reduce((s, x) => s + x.correct, 0);
  const counted = per.reduce((s, x) => s + x.total, 0);
  const accuracy = counted ? Math.round((correct / counted) * 100) : 0;
  lastResult = { packId: pack.id, name: game.name, score: game.score, correct, counted, accuracy, timerOn: game.timerOn, perRound: per };
  const records = loadRecords();
  lastResult.isBest = L.isNewRecord(records.filter((r) => r.packId === pack.id), game.score);
  records.push({ packId: pack.id, packTitle: pack.title, name: game.name, score: game.score, correct, total: counted, date: Date.now() });
  store.set(KEYS.records, L.topRecords(records, 200));
  store.del(KEYS.game(pack.id));
  game = null;
  showFinal();
}

async function showFinal() {
  route = "final";
  const res = lastResult;
  if (!res) return showHome();
  go(`#/pack/${pack.id}`, true);
  const rank = L.rankFor(res.accuracy);
  const stars = L.starsFor(res.accuracy);
  const max = P.maxScore(pack, res.timerOn);
  render(`
    <div class="result-hero">
      <div class="emoji" aria-hidden="true">${rank.emoji}</div>
      <div class="intro-step">${esc(pack.title)} · yakunlandi</div>
      <h2>${esc(rank.title)}</h2>
      <div class="stars" aria-label="${stars} yulduz">${[1, 2, 3].map((i) => `<span class="${i <= stars ? "" : "off"}">⭐</span>`).join("")}</div>
      <div class="result-score">${res.score}</div>
      <div class="muted">${esc(res.name)} · ${max} ochkodan${res.isBest ? " · 🏆 Yangi rekord!" : ""}</div>
    </div>
    <div class="stat-row">
      <div class="card stat"><b>${res.correct}/${res.counted}</b><span>to'g'ri</span></div>
      <div class="card stat"><b>${res.accuracy}%</b><span>aniqlik</span></div>
      <div class="card stat"><b>${pack.rounds.length}</b><span>raund</span></div>
    </div>
    <div class="card breakdown">
      ${pack.rounds.map((r, i) => {
        const st = res.perRound[i];
        return `<div class="bd-row"><span class="e" aria-hidden="true">${esc(r.icon)}</span><span class="name">${esc(r.title)}</span>
          <span class="bar" aria-hidden="true"><i style="width:${st.total ? (st.correct / st.total) * 100 : 0}%"></i></span>
          <span class="val">${st.correct}/${st.total}</span></div>`;
      }).join("")}
    </div>
    <div id="recs"></div>
    <button class="btn btn-primary" data-act="replay">🔄 Qayta o'ynash</button>
    <div class="btn-row">
      <button class="btn btn-secondary" data-act="share">📤 Ulashish</button>
      <button class="btn btn-secondary" data-act="home">📦 Paketlar</button>
    </div>
  `);
  sfx.win();
  vibrate([30, 50, 30, 50, 60]);
  if (res.accuracy >= 70) confetti();
  try {
    const list = (await loadCatalogue()).filter((p) => p.id !== pack.id);
    const same = list.filter((p) => p.category === pack.category);
    const recs = [...same, ...list.filter((p) => !same.includes(p))].slice(0, 2);
    const box = document.getElementById("recs");
    if (box && recs.length) box.innerHTML = `<div class="section-h">✨ Sizga yoqishi mumkin</div><div class="cont-row">${recs.map((p) => `<button class="cont-card" data-act="open" data-id="${esc(p.id)}">${coverHtml(p, "sm")}<span><b>${esc(p.title)}</b><small>${p.questionCount} savol</small></span></button>`).join("")}</div>`;
  } catch { /* katalog yo'q — tavsiyasiz */ }
}

function showHowto() {
  route = "howto";
  go("#/howto");
  render(`
    <div class="topbar"><button class="icon-btn" data-act="home" aria-label="Orqaga">←</button><h2>Qanday o'ynaladi?</h2></div>
    <div class="card"><p style="margin:0;line-height:1.5">Uzquiz — savollar paketlaridan iborat viktorina. Paketni tanlang, oching va o'ynang! Har bir paketda o'z raundlari va savollari bor.</p></div>
    <div class="list">
      <div class="card how-item"><span class="e" aria-hidden="true">📦</span><div><h4>Paketlar</h4><p>Bosh sahifada barcha paketlar. Toifa bo'yicha saralang yoki nomi bilan qidiring. «Davom ettirish» — tugallanmagan o'yinlaringiz.</p></div></div>
      <div class="card how-item"><span class="e" aria-hidden="true">🔘</span><div><h4>Savol turlari</h4><p>Variantli savollar, «Ha / Yo'q» savollari va javobni yozish kerak bo'lgan savollar.</p></div></div>
      <div class="card how-item"><span class="e" aria-hidden="true">🎬</span><div><h4>Rasm, tovush va video</h4><p>Ba'zi savollarda rasm, audio yoki video bor. Tovush va videoda ▶ tugmasini bosing — taymer ijro boshlanganda ishga tushadi. Ba'zan bir marta qayta tinglash mumkin.</p></div></div>
      <div class="card how-item"><span class="e" aria-hidden="true">🔗</span><div><h4>So'z zanjiri</h4><p>Har bir keyingi javob oldingi javobning oxirgi harfi bilan boshlanadi.</p></div></div>
      <div class="card how-item"><span class="e" aria-hidden="true">🕵️</span><div><h4>Yashirin mavzu</h4><p>Raund savollarining javoblari bitta mavzuga bog'liq. Oxirgi savolda o'sha mavzuni yozing — ikki baravar ochko!</p></div></div>
      <div class="card how-item"><span class="e" aria-hidden="true">⭐</span><div><h4>Ochkolar</h4><p>To'g'ri javob uchun raund ochkosi (odatda 10) va tez javob uchun +5 gacha bonus. Noto'g'ri, o'tkazilgan yoki vaqti tugagan savol — 0 ochko. Media yuklanmasa, savolni jarimasiz o'tkazish mumkin.</p></div></div>
      <div class="card how-item"><span class="e" aria-hidden="true">💾</span><div><h4>Saqlash</h4><p>Har bir paketdagi o'yin avtomatik saqlanadi. Bir nechta paketni parallel o'ynashingiz mumkin.</p></div></div>
    </div>
    <button class="btn btn-primary" data-act="home">Tushunarli</button>
  `);
}

function showRecords(packId = "") {
  route = "records";
  go("#/records");
  const all = loadRecords();
  const ids = [...new Set(all.map((r) => r.packId))];
  const recs = L.topRecords(packId ? all.filter((r) => r.packId === packId) : all, 10);
  render(`
    <div class="topbar"><button class="icon-btn" data-act="home" aria-label="Orqaga">←</button><h2>Rekordlar</h2></div>
    ${ids.length > 1 ? `<div class="cat-chips"><button class="chip-btn ${packId ? "" : "on"}" data-act="recPack" data-id="">Hammasi</button>${ids.map((id) => {
      const t = all.find((r) => r.packId === id)?.packTitle || id;
      return `<button class="chip-btn ${packId === id ? "on" : ""}" data-act="recPack" data-id="${esc(id)}">${esc(t)}</button>`;
    }).join("")}</div>` : ""}
    ${recs.length ? `
      <div class="list">${recs.map((r, i) => `
        <div class="card rec"><span class="pos">${i + 1}</span>
          <div class="who"><b>${esc(r.name)}</b><small>${esc(r.packTitle || r.packId)} · ${formatDate(r.date)} · ${r.correct ?? "?"}/${r.total ?? 42}</small></div>
          <span class="sc">${r.score}</span></div>`).join("")}</div>
      <div class="spacer"></div>
      <button class="btn btn-danger" data-act="clearRecords">🗑️ Rekordlarni tozalash</button>` : `
      <div class="empty card"><span class="e" aria-hidden="true">🏆</span>Hozircha rekordlar yo'q.<br/>Paketni o'ynang va natijangiz shu yerda paydo bo'ladi!</div>
      <div class="spacer"></div>
      <button class="btn btn-primary" data-act="home">📦 Paketlarga</button>`}
  `);
}

function showSettings() {
  route = "settings";
  go("#/settings");
  const row = (key, title, desc, emoji) => `
    <label class="card setting">
      <span style="font-size:24px" aria-hidden="true">${emoji}</span>
      <span class="txt"><b>${title}</b><small>${desc}</small></span>
      <span class="switch"><input type="checkbox" data-setting="${key}" ${settings[key] ? "checked" : ""} aria-label="${title}" /><span class="slider"></span></span>
    </label>`;
  render(`
    <div class="topbar"><button class="icon-btn" data-act="home" aria-label="Orqaga">←</button><h2>Sozlamalar</h2></div>
    <div class="list">
      ${row("sound", "Ovoz", "Javob va taymer ovozlari", "🔊")}
      ${row("vibration", "Tebranish", "Javob berganda telefon tebranadi", "📳")}
      ${row("timer", "Taymer", "O'chirilsa — vaqt cheklanmaydi, bonus berilmaydi", "⏱️")}
    </div>
    <p class="muted center" style="font-size:13px">Taymer sozlamasi keyingi yangi o'yindan boshlab qo'llaniladi.</p>
    <div class="spacer"></div>
    <p class="muted center" style="font-size:12px">Uzquiz 2.0-α · Barcha ma'lumotlar faqat qurilmangizda saqlanadi</p>
  `);
}

function formatDate(ts) {
  const d = new Date(ts);
  if (isNaN(d)) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/* ---------- Konfetti ---------- */
function confetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.getElementById("confetti"), ctx = c.getContext("2d"), dpr = window.devicePixelRatio || 1;
  c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const colors = ["#7C5CFF", "#FF4D8D", "#FFC53D", "#22D39A", "#3DA9FF"];
  const parts = Array.from({ length: 140 }, () => ({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.5, w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, vx: -1.5 + Math.random() * 3, vy: 2 + Math.random() * 3.5, r: Math.random() * Math.PI, vr: -0.2 + Math.random() * 0.4, color: colors[(Math.random() * colors.length) | 0] }));
  const end = performance.now() + 3500;
  (function frame(now) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    parts.forEach((p) => { p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vy += 0.03; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore(); });
    if (now < end) requestAnimationFrame(frame); else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })(performance.now());
}

/* ---------- Ulashish ---------- */
const packLink = (id) => `${location.origin}${location.pathname}#/pack/${id}`;
async function shareText(text, url) {
  try { if (navigator.share) { await navigator.share({ title: "Uzquiz", text, url }); return; } }
  catch (e) { if (e && e.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(`${text} ${url}`); toast("Havola nusxalandi 📋"); }
  catch { toast(url); }
}

/* ---------- Harakatlar ---------- */
const actions = {
  async open(el) {
    const p = await openPack(el.dataset.id);
    if (p) showDetail();
  },
  retry() { catalogue = null; showHome(); },
  cat(el) { filter.category = el.dataset.id; showHome(); },
  start() {
    const input = document.getElementById("name");
    const raw = input ? input.value : store.get(KEYS.name, "");
    const name = L.sanitizeName(raw);
    store.set(KEYS.name, String(raw || "").trim() ? name : "");
    if (savedGame(pack)) {
      openModal({
        emoji: "⚠️", title: "Qaytadan boshlansinmi?", text: "Bu paketdagi tugallanmagan o'yiningiz o'chib ketadi.",
        actions: [
          { label: "Ha, qaytadan", cls: "btn-primary", onClick: () => { store.del(KEYS.game(pack.id)); newGame(name); } },
          { label: "Bekor qilish", cls: "btn-ghost", cancel: true },
        ],
      });
    } else newGame(name);
  },
  continue() { const g = savedGame(pack); if (g) resumeGame(g); else showDetail(); },
  beginRound() { showQuestion(); },
  next() { nextQuestion(); },
  skip() { if (!answered && !modalOpen()) finishAnswer(false, "skip"); },
  mediaSkip() { if (!answered) finishAnswer(false, "mediaFail"); },
  mplay(el) {
    const box = el.closest(".media-box");
    if (box && box._st) { box._st.play(); document.getElementById("wait-chip")?.remove(); }
  },
  mreplay(el) { actions.mplay(el); },
  nextRound() {
    if (game.round < pack.rounds.length - 1) { game.round += 1; game.q = 0; showIntro(); }
    else finishGame();
  },
  exit() {
    if (!game) return;
    pauseTimer();
    if (media && media.el && !media.el.paused) media.el.pause();
    openModal({
      emoji: "🚪", title: "O'yindan chiqasizmi?", text: "Natijangiz saqlanadi — paket sahifasidan «Davom ettirish» orqali qaytishingiz mumkin.",
      actions: [
        { label: "Davom etish", cls: "btn-primary", cancel: true, onClick: () => resumeTimer() },
        { label: "Chiqish", cls: "btn-danger", onClick: () => leaveGame() },
      ],
    });
  },
  home() { showHome(); },
  howto() { showHowto(); },
  records() { showRecords(); },
  recPack(el) { showRecords(el.dataset.id); },
  settings() { showSettings(); },
  replay() { newGame(lastResult ? lastResult.name : L.sanitizeName(store.get(KEYS.name, ""))); },
  share() {
    if (!lastResult) return;
    const rank = L.rankFor(lastResult.accuracy);
    shareText(`Men Uzquiz'dagi «${pack.title}» paketida ${lastResult.score} ochko to'pladim va «${rank.title}» ${rank.emoji} unvonini oldim! Siz ham sinab ko'ring:`, packLink(pack.id));
  },
  sharePack() { shareText(`Uzquiz'dagi «${pack.title}» paketini o'ynab ko'ring!`, packLink(pack.id)); },
  clearRecords() {
    openModal({
      emoji: "🗑️", title: "Rekordlar o'chirilsinmi?", text: "Barcha saqlangan natijalar butunlay o'chiriladi.",
      actions: [
        { label: "Ha, o'chirish", cls: "btn-danger", onClick: () => { store.del(KEYS.records); showRecords(); toast("Rekordlar tozalandi"); } },
        { label: "Bekor qilish", cls: "btn-ghost", cancel: true },
      ],
    });
  },
};

app.addEventListener("click", (e) => {
  const opt = e.target.closest("[data-opt], [data-tf]");
  if (opt && opt.closest("#options")) return chooseOption(opt);
  const el = e.target.closest("[data-act]");
  if (el && actions[el.dataset.act] && !el.disabled) {
    if (!["mplay", "mreplay"].includes(el.dataset.act)) sfx.click();
    actions[el.dataset.act](el);
  }
});
app.addEventListener("change", (e) => {
  const key = e.target.dataset && e.target.dataset.setting;
  if (key) {
    settings[key] = e.target.checked;
    store.set(KEYS.settings, settings);
    if (key === "vibration" && settings.vibration) vibrate(30);
    if (key === "sound") sfx.click();
  }
});
document.addEventListener("keydown", (e) => {
  if (modalOpen()) { if (e.key === "Escape") modalRoot.querySelector("[data-modal-backdrop]")?.click(); return; }
  if (e.target.tagName === "INPUT") return;
  const opts = document.querySelectorAll("#options [data-opt], #options [data-tf]");
  if (opts.length && !answered) {
    const idx = "123456".indexOf(e.key) >= 0 ? "123456".indexOf(e.key) : "abcdef".indexOf(e.key.toLowerCase());
    if (idx >= 0 && opts[idx]) { e.preventDefault(); chooseOption(opts[idx]); }
  }
});

/* ---------- Ishga tushirish ---------- */
if ("serviceWorker" in navigator && location.protocol.startsWith("http") && !PREVIEW) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
// Testlash uchun ichki holat (faqat o'qish)
window.__uzquiz = {
  get game() { return game; }, get timer() { return timer; }, get pack() { return pack; }, get media() { return media; },
  get ROUNDS() { return pack ? pack.rounds : []; }, L, P,
  resetCatalogue() { catalogue = null; packs.clear(); },
};

migrateV1Storage();
if (PREVIEW) {
  const bar = document.createElement("div");
  bar.className = "preview-bar";
  bar.setAttribute("role", "note");
  bar.textContent = "👁️ Ko'rib chiqish rejimi — muharrirdagi qoralama";
  document.body.prepend(bar);
  openPack(PREVIEW_ID).then((p) => {
    if (!p) return showHome();
    const r = Number(params.get("r"));
    newGame("Sinov");
    if (Number.isInteger(r) && r > 0 && r < p.rounds.length) { game.round = r; save(); showIntro(); }
  });
} else {
  routeFromHash();
}
