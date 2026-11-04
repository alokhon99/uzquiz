// Uzquiz — asosiy ilova (UI va o'yin oqimi).
import { ROUNDS } from "./questions.js";
import * as L from "./logic.js";

const KEYS = { game: "uzquiz.game", records: "uzquiz.records", settings: "uzquiz.settings", name: "uzquiz.name" };
const TOTAL_Q = L.totalQuestions(ROUNDS);
const RING = 2 * Math.PI * 28;

/* ---------- Saqlash (localStorage) ---------- */
const store = {
  get(k, def) {
    try {
      const v = localStorage.getItem(k);
      return v == null ? def : JSON.parse(v);
    } catch {
      return def;
    }
  },
  set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* xotira to'la yoki taqiqlangan */ }
  },
  del(k) {
    try { localStorage.removeItem(k); } catch { /* e'tiborsiz */ }
  },
};

function loadSettings() {
  const def = { sound: true, vibration: true, timer: true };
  const s = store.get(KEYS.settings, def);
  if (!s || typeof s !== "object") return def;
  return {
    sound: typeof s.sound === "boolean" ? s.sound : def.sound,
    vibration: typeof s.vibration === "boolean" ? s.vibration : def.vibration,
    timer: typeof s.timer === "boolean" ? s.timer : def.timer,
  };
}

function loadRecords() {
  const r = store.get(KEYS.records, []);
  return Array.isArray(r)
    ? r.filter((x) => x && typeof x.score === "number" && typeof x.name === "string")
    : [];
}

function loadSavedGame() {
  const g = store.get(KEYS.game, null);
  return L.isValidState(g, ROUNDS) ? g : null;
}

let settings = loadSettings();
let game = null;
let timer = null;
let answered = false;
let lastResult = null;

const app = document.getElementById("app");
const modalRoot = document.getElementById("modal-root");

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const qType = (r, q) => q.type || r.type;
const qLimit = (r, q) => q.timeLimit || r.timeLimit;

function render(html, accent) {
  stopTimer();
  closeModal();
  app.style.setProperty("--accent", accent || "var(--primary)");
  app.innerHTML = `<section class="screen">${html}</section>`;
  app.scrollTop = 0;
  window.scrollTo(0, 0);
}

/* ---------- Ovoz va tebranish ---------- */
let audioCtx = null;
function tone(freqs, dur = 0.12, type = "sine", gain = 0.08) {
  if (!settings.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    freqs.forEach((f, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      const t = audioCtx.currentTime + i * dur;
      o.type = type;
      o.frequency.value = f;
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(audioCtx.destination);
      o.start(t);
      o.stop(t + dur);
    });
  } catch { /* ovoz qo'llab-quvvatlanmaydi */ }
}
const sfx = {
  correct: () => tone([660, 880], 0.11, "triangle"),
  wrong: () => tone([220, 160], 0.16, "sawtooth", 0.05),
  tick: () => tone([1000], 0.04, "square", 0.02),
  win: () => tone([523, 659, 784, 1046], 0.13, "triangle"),
  click: () => tone([440], 0.04, "sine", 0.03),
};
function vibrate(p) {
  // BUG-01: brauzer foydalanuvchi teginishidan oldin tebranishni bloklaydi va konsolga xato yozadi
  const activated = !navigator.userActivation || navigator.userActivation.hasBeenActive;
  if (settings.vibration && navigator.vibrate && activated) {
    try { navigator.vibrate(p); } catch { /* e'tiborsiz */ }
  }
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ---------- Modal ---------- */
function openModal({ emoji, title, text, actions }) {
  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-modal-backdrop>
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="e" aria-hidden="true">${emoji}</div>
        <h3 id="modal-title">${esc(title)}</h3>
        <p>${esc(text)}</p>
        ${actions.map((a, i) => `<button class="btn ${a.cls}" data-modal-act="${i}">${esc(a.label)}</button>`).join("")}
      </div>
    </div>`;
  const handler = (e) => {
    const b = e.target.closest("[data-modal-act]");
    if (b) {
      const a = actions[+b.dataset.modalAct];
      closeModal();
      a.onClick && a.onClick();
    } else if (e.target.hasAttribute("data-modal-backdrop")) {
      const cancel = actions.find((a) => a.cancel);
      closeModal();
      cancel && cancel.onClick && cancel.onClick();
    }
  };
  modalRoot.firstElementChild.addEventListener("click", handler);
  modalRoot.querySelector("[data-modal-act]").focus();
}
function closeModal() {
  modalRoot.innerHTML = "";
}
const modalOpen = () => !!modalRoot.firstElementChild;

/* ---------- Taymer ---------- */
function startTimer(limit, onTimeout) {
  stopTimer();
  timer = { limit, remaining: limit, last: performance.now(), running: true, onTimeout, lastSec: limit };
  timer.id = setInterval(tickTimer, 100);
  drawTimer();
}
function tickTimer() {
  if (!timer || !timer.running) return;
  const now = performance.now();
  timer.remaining = Math.max(0, timer.remaining - (now - timer.last) / 1000);
  timer.last = now;
  const sec = Math.ceil(timer.remaining);
  if (sec !== timer.lastSec) {
    timer.lastSec = sec;
    if (sec <= 5 && sec > 0) sfx.tick();
  }
  drawTimer();
  if (timer.remaining <= 0) {
    const cb = timer.onTimeout;
    stopTimer();
    cb && cb();
  }
}
function drawTimer() {
  const el = document.getElementById("timer");
  if (!el || !timer) return;
  const sec = Math.ceil(timer.remaining);
  el.querySelector(".num").textContent = sec;
  el.querySelector(".bar").style.strokeDashoffset = String(RING * (1 - timer.remaining / timer.limit));
  el.classList.toggle("low", sec <= 5);
  el.setAttribute("aria-label", `Qolgan vaqt: ${sec} soniya`);
}
function pauseTimer() {
  if (timer && timer.running) {
    tickTimer();
    if (timer) timer.running = false;
  }
}
function resumeTimer() {
  if (timer && !timer.running) {
    timer.last = performance.now();
    timer.running = true;
  }
}
function stopTimer() {
  if (timer) clearInterval(timer.id);
  timer = null;
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseTimer();
  else if (!modalOpen()) resumeTimer();
});

/* ---------- O'yin holati ---------- */
function save() {
  if (game) store.set(KEYS.game, game);
}

function newGame(name) {
  game = {
    v: 1,
    name,
    round: 0,
    q: 0,
    phase: "intro",
    score: 0,
    streak: 0,
    timerOn: settings.timer,
    results: ROUNDS.map(() => []),
    orders: ROUNDS.map((r) => r.questions.map((q) => (qType(r, q) === "options" ? L.shuffle(q.options.map((_, i) => i)) : null))),
    startedAt: Date.now(),
  };
  save();
  showIntro();
}

function resumeGame(g) {
  game = g;
  if (typeof game.timerOn !== "boolean") game.timerOn = true;
  if (typeof game.streak !== "number") game.streak = 0;
  if (game.phase === "roundEnd") return showRoundEnd();
  if (game.phase === "intro") return showIntro();
  if (game.phase === "feedback") return nextQuestion();
  // savol o'rtasida to'xtagan bo'lsa — savol yangi taymer bilan qayta boshlanadi
  if (game.q >= ROUNDS[game.round].questions.length) return showRoundEnd();
  showQuestion();
}

/* ---------- Ekranlar ---------- */
function showHome() {
  game = null;
  const saved = loadSavedGame();
  const records = loadRecords();
  const best = records.length ? L.topRecords(records, 1)[0] : null;
  const name = store.get(KEYS.name, "");
  render(`
    <div class="logo">
      <div class="logo-mark" aria-hidden="true">Uz</div>
      <h1>Uzquiz</h1>
      <p>Bilimingizni sinang — 6 raund, ${TOTAL_Q} ta savol</p>
    </div>
    <div class="chips" aria-hidden="true">
      ${ROUNDS.map((r) => `<span class="chip">${r.icon} ${esc(r.title)}</span>`).join("")}
    </div>
    <div class="spacer"></div>
    ${best ? `
      <div class="card best">
        <div style="font-size:30px" aria-hidden="true">🏆</div>
        <div style="flex:1"><small class="muted">Eng yaxshi natija</small><div class="big">${best.score} ochko</div></div>
        <small class="muted">${esc(best.name)}</small>
      </div>` : ""}
    ${saved ? `
      <button class="btn btn-success" data-act="continue">▶ Davom ettirish
        <small style="font-weight:700;opacity:.8">· ${saved.round + 1}-raund, ${Math.min(saved.q + 1, 7)}-savol · ${saved.score} ochko</small>
      </button>` : ""}
    <div class="field">
      <label for="name">Ismingiz</label>
      <input id="name" class="input" maxlength="20" autocomplete="nickname" placeholder="Ismingizni kiriting" value="${esc(name)}" enterkeyhint="go" />
    </div>
    <button class="btn btn-primary" data-act="start">🚀 O'yinni boshlash</button>
    <div class="menu-grid">
      <button class="menu-tile" data-act="howto"><span class="e" aria-hidden="true">📖</span>Qanday o'ynaladi?</button>
      <button class="menu-tile" data-act="records"><span class="e" aria-hidden="true">🏆</span>Rekordlar</button>
      <button class="menu-tile" data-act="settings"><span class="e" aria-hidden="true">⚙️</span>Sozlamalar</button>
    </div>
  `);
  const input = document.getElementById("name");
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); actions.start(); }
  });
}

function showIntro() {
  const r = ROUNDS[game.round];
  game.phase = "intro";
  save();
  const qs = r.questions.length;
  const typeLabel = r.type === "text" ? "Yozma javob" : "4 ta variant";
  render(`
    <div class="topbar">
      <button class="icon-btn" data-act="exit" aria-label="O'yindan chiqish">✕</button>
      <h2></h2>
      <div class="score-pill">⭐ ${game.score}</div>
    </div>
    <div class="intro-badge" aria-hidden="true">${r.icon}</div>
    <div class="intro-step">Raund ${game.round + 1} / ${ROUNDS.length}</div>
    <h1 class="intro-title">${esc(r.title)}</h1>
    <div class="round-dots" aria-hidden="true">
      ${ROUNDS.map((_, i) => `<i class="${i < game.round ? "done" : i === game.round ? "cur" : ""}"></i>`).join("")}
    </div>
    <div class="card center"><p style="margin:0;line-height:1.5">${esc(r.description)}</p></div>
    <div class="rules">
      <div class="card"><b>${qs}</b><span>savol</span></div>
      <div class="card"><b>${game.timerOn ? `${r.timeLimit}s` : "∞"}</b><span>har savolga</span></div>
      <div class="card"><b>${r.id === 6 ? "🕵️" : r.type === "text" ? "⌨️" : "🔘"}</b><span>${r.id === 6 ? "Mavzuni toping" : typeLabel}</span></div>
    </div>
    <div class="spacer"></div>
    <button class="btn btn-primary" data-act="beginRound">Boshlash</button>
  `, r.color);
  app.querySelector("[data-act=beginRound]").focus({ preventScroll: true });
}

function showQuestion() {
  const r = ROUNDS[game.round];
  const q = r.questions[game.q];
  const type = qType(r, q);
  const limit = qLimit(r, q);
  game.phase = "question";
  save();
  answered = false;

  let body = "";
  if (type === "options") {
    const order = game.orders[game.round][game.q];
    body = `<div class="options" id="options" role="group" aria-label="Javob variantlari">
      ${order.map((oi, i) => `<button class="option" data-opt="${oi}"><span class="key">${"ABCD"[i]}</span><span>${esc(q.options[oi])}</span></button>`).join("")}
    </div>`;
  } else {
    const isChain = r.id === 3;
    const letter = isChain ? L.chainHintLetter(r, game.q) : L.firstLetter(q.answer);
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

  const image = q.imageSvg
    ? `<div class="q-image">${q.imageSvg}</div>`
    : q.image ? `<div class="q-image" role="img" aria-label="Savol rasmi">${q.image}</div>` : "";

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
    </div>
    <div class="card q-card">
      ${image}
      <p class="q-text">${esc(q.text)}</p>
    </div>
    ${body}
    <div id="fb"></div>
  `, r.color);

  if (type === "text") {
    const form = document.getElementById("text-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      submitText();
    });
    // mobil klaviatura savolni yopib qo'ymasligi uchun fokusni biroz kechiktiramiz
    setTimeout(() => document.getElementById("answer")?.focus({ preventScroll: true }), 250);
  }
  if (game.timerOn) startTimer(limit, () => finishAnswer(false, "timeout"));
}

function chooseOption(btn) {
  if (answered || modalOpen()) return;
  const r = ROUNDS[game.round];
  const q = r.questions[game.q];
  const picked = +btn.dataset.opt;
  const correct = picked === q.answer;
  const box = document.getElementById("options");
  box.classList.add("locked");
  if (!correct) btn.classList.add("wrong");
  finishAnswer(correct, correct ? "ok" : "wrong");
}

function submitText() {
  if (answered || modalOpen()) return;
  const input = document.getElementById("answer");
  const val = input.value;
  if (!L.normalize(val)) {
    input.classList.remove("shake");
    void input.offsetWidth;
    input.classList.add("shake");
    vibrate(30);
    return;
  }
  const q = ROUNDS[game.round].questions[game.q];
  const correct = L.isTextCorrect(val, q);
  finishAnswer(correct, correct ? "ok" : "wrong");
}

function finishAnswer(correct, reason) {
  if (answered) return;
  answered = true;
  const r = ROUNDS[game.round];
  const q = r.questions[game.q];
  const type = qType(r, q);
  const limit = qLimit(r, q);
  const timeLeft = timer ? timer.remaining : 0;
  stopTimer();

  const points = L.calcPoints({ correct, timeLeft, timeLimit: limit, base: L.questionBase(q), timerOn: game.timerOn });
  game.results[game.round][game.q] = { c: correct, p: points };
  game.score += points;
  game.streak = correct ? game.streak + 1 : 0;
  game.phase = "feedback";
  save();

  // vizual belgilash
  if (type === "options") {
    const box = document.getElementById("options");
    box.classList.add("locked");
    box.querySelector(`[data-opt="${q.answer}"]`)?.classList.add("correct");
  } else {
    const input = document.getElementById("answer");
    if (input) {
      input.disabled = true;
      input.blur();
    }
    document.querySelectorAll("#text-form button").forEach((b) => (b.disabled = true));
    // BUG-07: yordam kataklarida to'g'ri so'zni ko'rsatish
    const boxes = document.querySelectorAll(".letters i");
    L.uzLetters(q.answer).forEach((l, i) => {
      if (!boxes[i]) return;
      boxes[i].textContent = L.capLetter(l);
      boxes[i].classList.add(correct ? "ok" : "bad");
    });
  }
  document.getElementById("progress").style.width = `${((game.q + 1) / r.questions.length) * 100}%`;
  const pill = document.getElementById("score");
  pill.textContent = `⭐ ${game.score}`;
  if (correct) pill.classList.add("bump");

  if (correct) { sfx.correct(); vibrate(25); } else { sfx.wrong(); vibrate([40, 60, 40]); }

  const correctText = type === "options" ? q.options[q.answer] : q.answer;
  const title = correct ? "To'g'ri! 🎉" : reason === "timeout" ? "Vaqt tugadi ⏰" : reason === "skip" ? "O'tkazib yuborildi ⏭️" : "Noto'g'ri 😕";
  const last = game.q === r.questions.length - 1;
  document.getElementById("fb").innerHTML = `
    <div class="feedback ${correct ? "ok" : "bad"}" role="alert">
      <div class="fb-title"><span>${title}</span><span class="pts">+${points}</span></div>
      ${q.final ? `<div class="theme-reveal">🕵️ Yashirin mavzu: ${esc(r.hiddenTheme)}</div>` : ""}
      ${(correct && type === "options") || q.final ? "" : `<div class="fb-answer">To'g'ri javob: <b>${esc(correctText)}</b></div>`}
      ${q.fact ? `<div class="fb-fact">💡 ${esc(q.fact)}</div>` : ""}
      <button class="btn btn-primary" data-act="next">${last ? "Raund natijasi" : "Keyingi"} →</button>
    </div>`;
  const nextBtn = app.querySelector("[data-act=next]");
  nextBtn.focus({ preventScroll: true });
  nextBtn.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function nextQuestion() {
  const r = ROUNDS[game.round];
  if (game.q + 1 < r.questions.length) {
    game.q += 1;
    showQuestion();
  } else {
    game.q = r.questions.length;
    showRoundEnd();
  }
}

function roundStats(ri, g = game) {
  const res = g.results[ri] || [];
  return {
    correct: res.filter((x) => x && x.c).length,
    points: res.reduce((s, x) => s + (x ? x.p : 0), 0),
    total: ROUNDS[ri].questions.length,
  };
}

function showRoundEnd() {
  const r = ROUNDS[game.round];
  game.phase = "roundEnd";
  save();
  const st = roundStats(game.round);
  const lastRound = game.round === ROUNDS.length - 1;
  const emoji = st.correct === st.total ? "🏆" : st.correct >= 5 ? "🎉" : st.correct >= 3 ? "👍" : "💪";
  const msg = st.correct === st.total ? "Mukammal! Barcha javoblar to'g'ri!" : st.correct >= 5 ? "Ajoyib natija!" : st.correct >= 3 ? "Yaxshi, davom eting!" : "Taslim bo'lmang, keyingisi albatta yaxshiroq bo'ladi!";
  render(`
    <div class="topbar">
      <button class="icon-btn" data-act="exit" aria-label="O'yindan chiqish">✕</button>
      <h2></h2>
    </div>
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
    <div class="round-dots" aria-hidden="true">
      ${ROUNDS.map((_, i) => `<i class="${i <= game.round ? "done" : ""}"></i>`).join("")}
    </div>
    <div class="spacer"></div>
    <button class="btn btn-primary" data-act="nextRound">${lastRound ? "🏁 Natijalarni ko'rish" : "Keyingi raund →"}</button>
  `, r.color);
  if (st.correct === st.total) sfx.win();
}

function finishGame() {
  if (!game) return;
  const correct = ROUNDS.reduce((s, _, i) => s + roundStats(i).correct, 0);
  const accuracy = Math.round((correct / TOTAL_Q) * 100);
  lastResult = {
    name: game.name,
    score: game.score,
    correct,
    accuracy,
    timerOn: game.timerOn,
    perRound: ROUNDS.map((_, i) => roundStats(i)),
  };
  const records = loadRecords();
  lastResult.isBest = L.isNewRecord(records, game.score);
  records.push({ name: game.name, score: game.score, correct, date: Date.now() });
  store.set(KEYS.records, L.topRecords(records, 50));
  store.del(KEYS.game);
  game = null;
  showFinal();
}

function showFinal() {
  const res = lastResult;
  if (!res) return showHome();
  const rank = L.rankFor(res.accuracy);
  const stars = L.starsFor(res.accuracy);
  const max = L.maxScore(ROUNDS, res.timerOn);
  const isBest = !!res.isBest;
  render(`
    <div class="result-hero">
      <div class="emoji" aria-hidden="true">${rank.emoji}</div>
      <div class="intro-step">O'yin yakunlandi</div>
      <h2>${esc(rank.title)}</h2>
      <div class="stars" aria-label="${stars} yulduz">${[1, 2, 3].map((i) => `<span class="${i <= stars ? "" : "off"}">⭐</span>`).join("")}</div>
      <div class="result-score">${res.score}</div>
      <div class="muted">${esc(res.name)} · ${max} ochkodan${isBest ? " · 🏆 Yangi rekord!" : ""}</div>
    </div>
    <div class="stat-row">
      <div class="card stat"><b>${res.correct}/${TOTAL_Q}</b><span>to'g'ri</span></div>
      <div class="card stat"><b>${res.accuracy}%</b><span>aniqlik</span></div>
      <div class="card stat"><b>${ROUNDS.length}</b><span>raund</span></div>
    </div>
    <div class="card breakdown">
      ${ROUNDS.map((r, i) => {
        const st = res.perRound[i];
        return `<div class="bd-row"><span class="e" aria-hidden="true">${r.icon}</span><span class="name">${esc(r.title)}</span>
          <span class="bar" aria-hidden="true"><i style="width:${(st.correct / st.total) * 100}%"></i></span>
          <span class="val">${st.correct}/${st.total}</span></div>`;
      }).join("")}
    </div>
    <button class="btn btn-primary" data-act="replay">🔄 Qayta o'ynash</button>
    <div class="btn-row">
      <button class="btn btn-secondary" data-act="share">📤 Ulashish</button>
      <button class="btn btn-secondary" data-act="home">🏠 Bosh sahifa</button>
    </div>
  `);
  sfx.win();
  vibrate([30, 50, 30, 50, 60]);
  if (res.accuracy >= 70) confetti();
}

function showHowto() {
  render(`
    <div class="topbar"><button class="icon-btn" data-act="home" aria-label="Orqaga">←</button><h2>Qanday o'ynaladi?</h2></div>
    <div class="card"><p style="margin:0;line-height:1.5">Uzquiz — ${ROUNDS.length} raunddan iborat viktorina. Har raundda ${ROUNDS[0].questions.length} ta savol bor. Tez va to'g'ri javob bering — ko'proq ochko to'plang!</p></div>
    <div class="list">
      ${ROUNDS.map((r) => `
        <div class="card how-item"><span class="e" aria-hidden="true">${r.icon}</span>
          <div><h4>${r.id}. ${esc(r.title)}</h4><p>${esc(r.description)}</p></div></div>`).join("")}
      <div class="card how-item"><span class="e" aria-hidden="true">⭐</span>
        <div><h4>Ochkolar</h4><p>To'g'ri javob — 10 ochko, yashirin mavzu — 20 ochko. Tez javob uchun qo'shimcha +5 gacha bonus. Noto'g'ri javob, o'tkazib yuborish yoki vaqt tugashi — 0 ochko.</p></div></div>
      <div class="card how-item"><span class="e" aria-hidden="true">💾</span>
        <div><h4>Saqlash</h4><p>O'yin har javobdan keyin avtomatik saqlanadi. Chiqib ketsangiz, bosh sahifada «Davom ettirish» tugmasi paydo bo'ladi.</p></div></div>
    </div>
    <button class="btn btn-primary" data-act="home">Tushunarli</button>
  `);
}

function showRecords() {
  const recs = L.topRecords(loadRecords(), 10);
  render(`
    <div class="topbar"><button class="icon-btn" data-act="home" aria-label="Orqaga">←</button><h2>Rekordlar</h2></div>
    ${recs.length ? `
      <div class="list">
        ${recs.map((r, i) => `
          <div class="card rec"><span class="pos">${i + 1}</span>
            <div class="who"><b>${esc(r.name)}</b><small>${formatDate(r.date)} · ${r.correct ?? "?"}/${TOTAL_Q} to'g'ri</small></div>
            <span class="sc">${r.score}</span></div>`).join("")}
      </div>
      <div class="spacer"></div>
      <button class="btn btn-danger" data-act="clearRecords">🗑️ Rekordlarni tozalash</button>` : `
      <div class="empty card"><span class="e" aria-hidden="true">🏆</span>Hozircha rekordlar yo'q.<br/>Birinchi o'yinni o'ynang va natijangiz shu yerda paydo bo'ladi!</div>
      <div class="spacer"></div>
      <button class="btn btn-primary" data-act="home">O'yinni boshlash</button>`}
  `);
}

function showSettings() {
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
    <p class="muted center" style="font-size:12px">Uzquiz MVP 1.0 · Barcha ma'lumotlar faqat qurilmangizda saqlanadi</p>
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
  const c = document.getElementById("confetti");
  const ctx = c.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  c.width = innerWidth * dpr;
  c.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const colors = ["#7C5CFF", "#FF4D8D", "#FFC53D", "#22D39A", "#3DA9FF"];
  const parts = Array.from({ length: 140 }, () => ({
    x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.5,
    w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
    vx: -1.5 + Math.random() * 3, vy: 2 + Math.random() * 3.5,
    r: Math.random() * Math.PI, vr: -0.2 + Math.random() * 0.4,
    color: colors[(Math.random() * colors.length) | 0],
  }));
  const end = performance.now() + 3500;
  (function frame(now) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    parts.forEach((p) => {
      p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vy += 0.03;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    });
    if (now < end) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })(performance.now());
}

/* ---------- Ulashish ---------- */
async function share() {
  if (!lastResult) return;
  const rank = L.rankFor(lastResult.accuracy);
  const text = `Men Uzquiz o'yinida ${lastResult.score} ochko to'pladim va «${rank.title}» ${rank.emoji} unvonini oldim! ${lastResult.correct}/${TOTAL_Q} to'g'ri javob. Siz ham sinab ko'ring!`;
  try {
    if (navigator.share) {
      await navigator.share({ title: "Uzquiz", text });
      return;
    }
  } catch (e) {
    if (e && e.name === "AbortError") return;
  }
  try {
    await navigator.clipboard.writeText(text);
    toast("Natija nusxalandi 📋");
  } catch {
    toast(text);
  }
}

/* ---------- Harakatlar ---------- */
const actions = {
  start() {
    const input = document.getElementById("name");
    const name = L.sanitizeName(input ? input.value : "");
    store.set(KEYS.name, name === "O'yinchi" && !(input && input.value.trim()) ? "" : name);
    const saved = loadSavedGame();
    if (saved) {
      openModal({
        emoji: "⚠️",
        title: "Yangi o'yin boshlansinmi?",
        text: "Sizda tugallanmagan o'yin bor. Yangi o'yin boshlasangiz, u o'chib ketadi.",
        actions: [
          { label: "Ha, yangi o'yin", cls: "btn-primary", onClick: () => { store.del(KEYS.game); newGame(name); } },
          { label: "Bekor qilish", cls: "btn-ghost", cancel: true },
        ],
      });
    } else {
      newGame(name);
    }
  },
  continue() {
    const saved = loadSavedGame();
    if (saved) resumeGame(saved);
    else showHome();
  },
  beginRound() { showQuestion(); },
  next() { nextQuestion(); },
  skip() { if (!answered && !modalOpen()) finishAnswer(false, "skip"); },
  nextRound() {
    if (game.round < ROUNDS.length - 1) {
      game.round += 1;
      game.q = 0;
      showIntro();
    } else {
      finishGame();
    }
  },
  exit() {
    pauseTimer();
    openModal({
      emoji: "🚪",
      title: "O'yindan chiqasizmi?",
      text: "Natijangiz saqlanadi — bosh sahifadan «Davom ettirish» orqali qaytishingiz mumkin.",
      actions: [
        { label: "Davom etish", cls: "btn-primary", cancel: true, onClick: () => resumeTimer() },
        { label: "Chiqish", cls: "btn-danger", onClick: () => { stopTimer(); save(); showHome(); } },
      ],
    });
  },
  home() { showHome(); },
  howto() { showHowto(); },
  records() { showRecords(); },
  settings() { showSettings(); },
  replay() { newGame(lastResult ? lastResult.name : L.sanitizeName(store.get(KEYS.name, ""))); },
  share() { share(); },
  clearRecords() {
    openModal({
      emoji: "🗑️",
      title: "Rekordlar o'chirilsinmi?",
      text: "Barcha saqlangan natijalar butunlay o'chiriladi.",
      actions: [
        { label: "Ha, o'chirish", cls: "btn-danger", onClick: () => { store.del(KEYS.records); showRecords(); toast("Rekordlar tozalandi"); } },
        { label: "Bekor qilish", cls: "btn-ghost", cancel: true },
      ],
    });
  },
};

app.addEventListener("click", (e) => {
  const opt = e.target.closest("[data-opt]");
  if (opt) return chooseOption(opt);
  const el = e.target.closest("[data-act]");
  if (el && actions[el.dataset.act]) {
    sfx.click();
    actions[el.dataset.act]();
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

// Klaviatura: 1–4 yoki A–D bilan variant tanlash, Enter — keyingi
document.addEventListener("keydown", (e) => {
  if (modalOpen()) {
    if (e.key === "Escape") {
      const bd = modalRoot.querySelector("[data-modal-backdrop]");
      bd && bd.click();
    }
    return;
  }
  if (e.target.tagName === "INPUT") return;
  const opts = document.querySelectorAll("#options [data-opt]");
  if (opts.length && !answered) {
    const idx = "1234".indexOf(e.key) >= 0 ? "1234".indexOf(e.key) : "abcd".indexOf(e.key.toLowerCase());
    if (idx >= 0 && opts[idx]) { e.preventDefault(); chooseOption(opts[idx]); }
  }
});

/* ---------- Ishga tushirish ---------- */
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

// Testlash uchun ichki holatga kirish (faqat o'qish uchun)
window.__uzquiz = { get game() { return game; }, get timer() { return timer; }, ROUNDS, L };

showHome();
