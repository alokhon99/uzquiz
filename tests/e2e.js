// Uzquiz 2.0 game E2E tests. Run inside the app page (served by serve.mjs):
//   const m = await import('/__tests/e2e.js?' + Date.now()); await m.run('<suite>')
// Suites ending in 1/2 need a page reload in between (state kept in sessionStorage).

const U = () => window.__uzquiz;
const app = () => document.getElementById("app");
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const txt = () => app().innerText;
const has = (s) => txt().toLowerCase().includes(s.toLowerCase());
const S = { get: (k) => JSON.parse(sessionStorage.getItem("e2e." + k) || "null"), set: (k, v) => sessionStorage.setItem("e2e." + k, JSON.stringify(v)) };
async function until(fn, ms = 4000, step = 50) { const t = Date.now(); while (Date.now() - t < ms) { const v = fn(); if (v) return v; await wait(step); } return fn(); }

let out = [];
const errors = [];
const check = (id, cond, detail = "") => out.push({ id, ok: !!cond, detail: cond ? "" : detail });
function trap() {
  if (window.__e2eTrap) return;
  window.__e2eTrap = true;
  window.addEventListener("error", (e) => errors.push(String(e.message)));
  window.addEventListener("unhandledrejection", (e) => errors.push(String(e.reason)));
  const ce = console.error; console.error = (...a) => { errors.push(a.join(" ")); ce.apply(console, a); };
}
const click = (sel) => { const el = typeof sel === "string" ? $(sel) : sel; if (!el) throw new Error("no element " + sel); el.click(); return el; };
const act = (a) => click(`[data-act="${a}"]`);
const cur = () => { const g = U().game, r = U().pack.rounds[g.round]; return { g, r, q: r.questions[g.q] }; };

async function home() {
  if (!$("#pack-list") && $('[data-act="home"]')) $('[data-act="home"]').click();
  if (!(await until(() => $("#pack-list"), 4000))) throw new Error("catalogue did not render");
}
async function openPack(id) { await home(); click(`#pack-list [data-id="${id}"]`); await until(() => U().pack && U().pack.id === id && $(".detail-hero")); }
async function startPack(id, name = "Sinovchi") {
  await openPack(id);
  $("#name").value = name;
  act("start");
  if ($(".modal")) click('[data-modal-act="0"]');
  await until(() => $('[data-act="beginRound"]'));
}
function answer(correct = true) {
  const { q } = cur();
  if (q.type === "choice") click(`[data-opt="${correct ? q.answer : (q.answer + 1) % q.options.length}"]`);
  else if (q.type === "truefalse") click(`[data-tf="${correct ? q.answer : !q.answer}"]`);
  else { $("#answer").value = correct ? q.answer : "xatojavob"; $("#text-form").requestSubmit(); }
}
async function playRound(correct = true) {
  act("beginRound");
  const n = cur().r.questions.length;
  for (let i = 0; i < n; i++) { await until(() => $("#options, #text-form")); answer(correct); act("next"); }
}
async function playMedia() {
  const box = await until(() => { const b = $('.q-card [data-media="main"]'); return b && b._st ? b : null; });
  box._st.el.muted = true;
  click(box.querySelector('[data-act="mplay"]'));
  await until(() => box._st.playing, 4000);
  return box._st;
}

/* ------------------------------------------------------------------ */
const suites = {
  async catalogue() {
    await home();
    const cards = $$("#pack-list .pack-card");
    check("V-01", cards.length === 3 && cards.every((c) => c.querySelector(".cover") && c.querySelector(".pc-title") && /\d+ savol · ~\d+ daq/.test(c.innerText) && c.innerText.includes("Bepul")), `cards ${cards.length}`);
    check("V-01b", $$("#pack-list .pack-card").some((c) => c.innerText.includes("Diqqat") && c.querySelector('[title="video"]')), "media icons");
    const s = $("#search"); s.value = "ritm"; s.dispatchEvent(new Event("input"));
    await wait(100);
    check("V-02", $$("#pack-list .pack-card").map((c) => c.dataset.id).join() === "tovushlar" && document.activeElement.id === "search", $$("#pack-list .pack-card").map((c) => c.dataset.id).join());
    const s2 = $("#search"); s2.value = "zzzz"; s2.dispatchEvent(new Event("input")); await wait(100);
    check("V-04", has("Hech narsa topilmadi"), "empty state");
    const s3 = $("#search"); s3.value = ""; s3.dispatchEvent(new Event("input")); await wait(100);
    click([...$$('[data-act="cat"]')].find((b) => b.innerText.includes("Mantiq")));
    await wait(50);
    check("V-03", $$("#pack-list .pack-card").map((c) => c.dataset.id).join() === "diqqat", "category filter");
    click('[data-act="cat"][data-id=""]'); await wait(50);
    check("V-03b", $$("#pack-list .pack-card").length === 3, "Hammasi");
    await openPack("tovushlar");
    const t = txt();
    check("V-05", $(".cover.lg") && t.includes("Tovushlar va ritm") && t.includes("Musiqa") && t.includes("0+") && t.includes("Bepul") && /2\s*raund/.test(t) && /9\s*savol/.test(t) && t.includes("Tovushlar") && $$(".lr").length === 2 && $("#name") && $('[data-act="start"]'), t.slice(0, 200));
    check("V-07a", location.hash === "#/pack/tovushlar", location.hash);
    // share pack (fallback)
    const orig = navigator.share; let copied = "";
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    const origClip = navigator.clipboard && navigator.clipboard.writeText;
    if (navigator.clipboard) navigator.clipboard.writeText = async (x) => { copied = x; };
    act("sharePack"); await wait(150);
    check("V-08", copied.includes("#/pack/tovushlar") && $("#toast").classList.contains("show"), copied);
    Object.defineProperty(navigator, "share", { value: orig, configurable: true });
    if (navigator.clipboard && origClip) navigator.clipboard.writeText = origClip;
    act("home"); await wait(50);
    check("V-06", !!$("#pack-list") && location.hash === "", location.hash);
  },
  deeplink1() { location.hash = "#/pack/tovushlar"; },
  async deeplink2() {
    await until(() => $(".detail-hero"));
    check("V-07", U().pack.id === "tovushlar" && has("Tovushlar va ritm"), "deep link");
  },

  async klassikFull() {
    await startPack("klassik", "Dilnoza");
    let sum = 0;
    for (let ri = 0; ri < 6; ri++) {
      check(`V-10.intro${ri + 1}`, has(`Raund ${ri + 1} / 6`), "intro");
      await playRound(true);
      sum += U().game.results[ri].reduce((s, x) => s + x.p, 0);
      check(`V-10.round${ri + 1}`, has("7 / 7"), "round result");
      act("nextRound");
    }
    await until(() => $(".result-score"));
    const score = Number($(".result-score").textContent);
    check("V-10", txt().includes("42/42") && txt().includes("100%") && has("Bilimlar sultoni") && score === sum, `score ${score} sum ${sum}`);
    await until(() => $$("#recs .cont-card").length);
    check("V-11", $$("#recs .cont-card").length === 2, "recommendations");
    const orig = navigator.share; let shared = null;
    Object.defineProperty(navigator, "share", { value: async (d) => { shared = d; }, configurable: true });
    act("share"); await wait(100);
    Object.defineProperty(navigator, "share", { value: orig, configurable: true });
    check("V-12", shared && shared.text.includes("Uzquiz Klassik") && shared.url.endsWith("#/pack/klassik"), JSON.stringify(shared));
    const recs = JSON.parse(localStorage.getItem("uzquiz.records"));
    check("V-13", recs.some((r) => r.packId === "klassik" && r.packTitle === "Uzquiz Klassik" && r.score === score && r.total === 42) && !localStorage.getItem("uzquiz.game.klassik"), "record");
    act("home");
  },

  async media() {
    await startPack("diqqat");
    act("beginRound");
    await until(() => $(".media-box.img"));
    const t0 = U().timer;
    check("V-20a", t0 && (t0.started === false || $(".media-box.img").classList.contains("ready")), "timer waits for image");
    await until(() => $(".media-box.img.ready"));
    await wait(150);
    check("V-20", U().timer.started && U().timer.running, "timer after image load");
    answer(true); act("next");
    answer(true); act("next");
    // True/False
    const { q } = cur();
    check("V-26a", q.type === "truefalse" && $$("#options [data-tf]").length === 2, "tf buttons");
    click(`[data-tf="${!q.answer}"]`);
    check("V-26", $(`[data-tf="${!q.answer}"]`).classList.contains("wrong") && $(`[data-tf="${q.answer}"]`).classList.contains("correct") && U().game.results[0][2].p === 0, "tf marking");
    act("next"); act("nextRound"); act("beginRound");
    // Video 1: waits, plays, replays
    await until(() => $(".media-box.video"));
    await wait(300);
    check("V-21", U().timer && !U().timer.started && !U().timer.running && $("#timer").classList.contains("waiting") && $("#wait-chip"), "timer waiting before play");
    const r0 = U().timer.remaining; await wait(800);
    check("V-21b", U().timer.remaining === r0, "timer did not move");
    const st = await playMedia();
    await wait(400);
    check("V-22", U().timer.started && U().timer.running && U().timer.remaining < r0 && !$("#wait-chip"), "timer started with playback");
    await until(() => st.ended, 9000);
    const rb = $(".q-card .replay");
    check("V-23a", !rb.hidden && rb.innerText.includes("Qayta (1)"), rb.innerText);
    click(rb);
    await until(() => st.playing, 3000);
    await until(() => st.ended, 9000);
    check("V-23", rb.hidden && $(".q-card [data-act=mplay]").disabled && st.plays === 2, `plays ${st.plays}`);
    answer(true); act("next");
    // Video 2: answer while playing stops playback
    const st2 = await playMedia();
    await wait(500);
    answer(true);
    check("V-24", st2.el.paused && $$(".q-card [data-act=mplay]").every((b) => b.disabled), "stops on answer");
    act("next");
    // Video 3: trimmed 0.3 – 5.6
    const st3 = await playMedia();
    await wait(200);
    const startedAt = st3.el.currentTime;
    await until(() => st3.ended, 9000);
    check("V-25", startedAt >= 0.25 && st3.el.currentTime >= 5.5 && st3.el.currentTime < 5.95 && st3.el.paused, `start ${startedAt} end ${st3.el.currentTime}`);
    answer(true); act("next");
    check("V-25b", has("2-raund yakunlandi"), "round end");
    act("nextRound");
    act("home");
  },

  async audio() {
    await startPack("tovushlar");
    act("beginRound");
    const st = await playMedia();
    await wait(300);
    const t = U().timer;
    check("V-27a", t.started && t.running, "audio starts timer");
    st.el.dispatchEvent(new Event("waiting"));
    const r1 = U().timer.remaining; await wait(600);
    check("V-27", !U().timer.running && Math.abs(U().timer.remaining - r1) < 0.05 && $(".media-box.audio").classList.contains("buffering"), "paused while buffering");
    st.el.dispatchEvent(new Event("playing")); await wait(400);
    check("V-27b", U().timer.running && U().timer.remaining < r1, "resumed");
    answer(true);
    check("V-27c", st.el.paused, "audio stopped");
    act("next");
    // MD-07: next question media requested in advance
    const next = U().pack.rounds[0].questions[2].media.src;
    const pre = await until(() => performance.getEntriesByType("resource").some((e) => e.name.includes(next.split("/").pop())), 3000);
    check("V-29", pre, "preload " + next);
    act("exit"); click('[data-modal-act="1"]');
  },

  async mediaFail() {
    await openPack("diqqat");
    U().pack.rounds[0].questions[0].media.src = "media/yoq-fayl.svg"; // simulate missing file
    act("start"); if ($(".modal")) click('[data-modal-act="0"]');
    act("beginRound");
    await until(() => $('[data-act="mediaSkip"]'), 6000);
    check("V-28a", has("Media yuklanmadi") && $(".media-box.failed") && (!U().timer || !U().timer.running), "failure panel");
    act("mediaSkip");
    check("V-28b", U().game.results[0][0].x === true && U().game.results[0][0].p === 0 && has("hisobga olinmadi"), JSON.stringify(U().game.results[0][0]));
    act("next");
    answer(true); act("next"); answer(true); act("next");
    check("V-28c", has("2 / 2"), "round total excludes failed question");
    act("nextRound");
    await playRound(true); act("nextRound");
    await until(() => $(".result-score"));
    check("V-28", txt().includes("5/5") && txt().includes("100%"), txt().slice(0, 300));
    location.reload();
  },

  async back() {
    await startPack("diqqat");
    act("beginRound");
    await until(() => $(".media-box.img.ready"));
    answer(true); act("next");
    history.back();
    await until(() => $(".modal"));
    check("V-30", $(".modal") && $(".modal").innerText.includes("O'yindan chiqasizmi?") && location.hash === "#/play/diqqat", location.hash);
    click('[data-modal-act="0"]');
    check("V-30b", !$(".modal") && U().game && $("#options"), "continues");
    act("exit"); click('[data-modal-act="1"]');
    await until(() => $(".detail-hero"));
    check("V-31", $('[data-act="continue"]') && $('[data-act="continue"]').innerText.includes("1-raund") && location.hash === "#/pack/diqqat", txt().slice(0, 100));
  },

  async multi1() {
    await startPack("tovushlar");
    act("beginRound"); await playMedia(); answer(true); act("next");
    const s1 = U().game.score;
    act("exit"); click('[data-modal-act="1"]');
    await home();
    const row = $$(".cont-row .cont-card").map((c) => c.dataset.id);
    check("V-32", row.includes("diqqat") && row.includes("tovushlar") && $$(".badge-s.cont").length === 2, row.join());
    S.set("multi", { tovushlar: s1, diqqat: JSON.parse(localStorage.getItem("uzquiz.game.diqqat")).score });
  },
  async multi2() {
    const exp = S.get("multi");
    await home();
    click('.cont-row [data-id="tovushlar"]'); await until(() => $(".detail-hero"));
    act("continue");
    await until(() => U().game);
    const a = U().game.packId === "tovushlar" && U().game.score === exp.tovushlar && U().game.q === 1;
    act("exit"); click('[data-modal-act="1"]');
    await openPack("diqqat"); act("continue"); await until(() => U().game);
    const b = U().game.packId === "diqqat" && U().game.score === exp.diqqat;
    check("V-33", a && b, JSON.stringify({ a, b }));
    act("exit"); click('[data-modal-act="1"]');
  },

  migrate1() {
    localStorage.clear();
    const v1 = { v: 1, name: "Eski", round: 1, q: 2, phase: "question", score: 35, streak: 2, timerOn: true,
      results: [[{ c: true, p: 15 }, { c: true, p: 10 }, { c: true, p: 10 }, { c: false, p: 0 }, { c: false, p: 0 }, { c: false, p: 0 }, { c: false, p: 0 }], [{ c: false, p: 0 }, { c: false, p: 0 }], [], [], [], []],
      orders: [[0, 1, 2, 3, 4, 5, 6].map(() => [0, 1, 2, 3]), [0, 1, 2, 3, 4, 5, 6].map(() => [3, 2, 1, 0]), Array(7).fill(null), [0, 1, 2, 3, 4, 5, 6].map(() => [0, 1, 2, 3]), [0, 1, 2, 3, 4, 5, 6].map(() => [0, 1, 2, 3]), [...Array(6).fill([0, 1, 2, 3]), null]], startedAt: 1 };
    localStorage.setItem("uzquiz.game", JSON.stringify(v1));
    localStorage.setItem("uzquiz.records", JSON.stringify([{ name: "Eski", score: 400, correct: 35, date: 1 }]));
  },
  async migrate2() {
    await home();
    check("V-34a", !localStorage.getItem("uzquiz.game") && !!localStorage.getItem("uzquiz.game.klassik") && $('.cont-row [data-id="klassik"]'), "game migrated");
    await openPack("klassik"); act("continue"); await until(() => U().game);
    check("V-34b", U().game.round === 1 && U().game.q === 2 && U().game.score === 35 && has("Savol 3 / 7"), JSON.stringify({ r: U().game.round, q: U().game.q }));
    act("exit"); click('[data-modal-act="1"]');
    await home(); act("records");
    check("V-34", has("Uzquiz Klassik") && has("400"), txt().slice(0, 200));
    act("home");
  },

  async offline() {
    const real = window.fetch;
    window.fetch = (u, o) => (String(u).includes("packs/index.json") ? Promise.reject(new TypeError("offline")) : real(u, o));
    try {
      await home();
      U().resetCatalogue();
      act("settings"); act("home");
      await until(() => $('[data-act="retry"]'));
      check("V-35", has("yuklab bo'lmadi") && $('[data-act="retry"]'), txt().slice(0, 150));
    } finally { window.fetch = real; }
    act("retry");
    await until(() => $("#pack-list"));
    check("V-36", $$("#pack-list .pack-card").length === 3, "retry recovers");
  },

  corrupt1() {
    localStorage.setItem("uzquiz.game.diqqat", "{bad json");
    localStorage.setItem("uzquiz.game.tovushlar", JSON.stringify({ packId: "tovushlar", round: 9 }));
    localStorage.setItem("uzquiz.records", '{"x":1}');
    localStorage.setItem("uzquiz.settings", "null");
  },
  async corrupt2() {
    await home();
    check("V-37", $$("#pack-list .pack-card").length === 3 && errors.length === 0, errors.join("|"));
    await openPack("tovushlar");
    check("V-37b", !$('[data-act="continue"]') && $('[data-act="start"]'), "invalid save ignored");
    await home(); act("records");
    check("V-37c", has("Hozircha rekordlar yo'q"), "records");
    act("home");
    localStorage.clear();
  },

  async timerOff() {
    await home(); act("settings");
    const t = $('[data-setting="timer"]'); if (t.checked) t.click();
    act("home");
    await startPack("klassik"); act("beginRound");
    check("V-38", !$("#timer") && has("Vaqt cheklanmagan"), "no timer");
    answer(true);
    check("V-38b", U().game.results[0][0].p === 10, `points ${U().game.results[0][0].p}`);
    act("next"); act("exit"); click('[data-modal-act="1"]');
    await home(); act("settings"); $('[data-setting="timer"]').click(); act("home");
    localStorage.removeItem("uzquiz.game.klassik");
  },

  // 1.x regression on the Klassik pack
  async klassikRegress() {
    await startPack("klassik"); act("beginRound");
    let { q } = cur();
    answer(false);
    check("V-50", $(`[data-opt="${(q.answer + 1) % 4}"]`).classList.contains("wrong") && $(`[data-opt="${q.answer}"]`).classList.contains("correct") && has("Noto'g'ri") && has("To'g'ri javob"), "wrong");
    act("next");
    ({ q } = cur());
    const b1 = $(`[data-opt="${q.answer}"]`), b2 = $(`[data-opt="${(q.answer + 1) % 4}"]`);
    b1.click(); b2.click();
    check("V-51", U().game.results[0].filter(Boolean).length === 2 && U().game.results[0][1].c && !b2.classList.contains("wrong"), "double tap");
    act("next");
    U().timer.remaining = 0.05; await wait(400);
    check("V-52", has("Vaqt tugadi") && U().game.results[0][2].p === 0, "timeout");
    act("next");
    act("exit"); const t0 = U().timer.remaining; await wait(800);
    check("V-53", Math.abs(U().timer.remaining - t0) < 0.15, "pause on dialog");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    check("V-54", !$(".modal") && U().timer.running, "escape = continue");
    Object.defineProperty(document, "hidden", { get: () => true, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    const t1 = U().timer.remaining; await wait(800);
    Object.defineProperty(document, "hidden", { get: () => false, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    delete document.hidden;
    check("V-55", Math.abs(U().timer.remaining - t1) < 0.15, "pause when hidden");
    for (let i = 3; i < 7; i++) { answer(true); act("next"); }
    act("nextRound"); await playRound(true); act("nextRound"); act("beginRound");
    check("V-56", $(".hint-text").innerText.includes("«T»") && $(".hint-text").innerText.includes("7 ta harf"), $(".hint-text").innerText);
    $("#answer").value = "  "; $("#text-form").requestSubmit();
    check("V-57", !U().game.results[2][0] && $("#answer").classList.contains("shake"), "empty");
    act("skip");
    check("V-58", has("O'tkazib yuborildi") && $$(".letters i").map((b) => b.textContent).join("").toLowerCase() === "toshkent", "skip + letters");
    act("next");
    check("V-59", $(".hint-text").innerText.includes("«T»"), "chain hint 2");
    for (let i = 1; i < 7; i++) { answer(true); act("next"); }
    act("nextRound"); await playRound(true); act("nextRound"); await playRound(true); act("nextRound");
    act("beginRound");
    for (let i = 0; i < 6; i++) { check(`V-5A.${i}`, !/samarqand/i.test(txt()), "theme leak"); answer(true); act("next"); }
    answer(true);
    check("V-5B", has("Yashirin mavzu: Samarqand"), "theme reveal");
    act("next"); act("nextRound");
    await until(() => $(".result-score"));
    act("home");
  },

  async small() {
    await home();
    check("V-60a", document.documentElement.scrollWidth <= innerWidth && $$("#pack-list .pack-card")[0].getBoundingClientRect().bottom <= innerHeight, "catalogue on small screen");
    await startPack("diqqat"); act("beginRound");
    let worst = 0;
    for (let ri = 0; ri < 2; ri++) {
      const n = cur().r.questions.length;
      for (let i = 0; i < n; i++) {
        await until(() => $("#options"));
        await wait(100);
        worst = Math.max(worst, $$(".option").at(-1).getBoundingClientRect().bottom);
        answer(true); act("next");
      }
      act("nextRound"); if (ri === 0) act("beginRound");
    }
    check("V-60", worst <= innerHeight && document.documentElement.scrollWidth <= innerWidth, `worst ${Math.round(worst)} > ${innerHeight}`);
    act("home");
  },
};

export async function run(name) {
  out = [];
  trap();
  try { await suites[name](); } catch (e) { out.push({ id: name, ok: false, detail: "EXCEPTION: " + e.message + " " + (e.stack || "").split("\n")[1] }); }
  out.push({ id: "errors", ok: errors.length === 0, detail: errors.join(" | ") });
  return out.map((r) => `${r.ok ? "PASS" : "FAIL"} ${r.id}${r.detail ? " — " + r.detail : ""}`).join("\n");
}
