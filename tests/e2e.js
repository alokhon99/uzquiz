// Uzquiz E2E test runner. Executed inside the running app page:
//   const m = await import('/__tests/e2e.js?' + Date.now()); await m.run('<suite>')
// Suites that need a page reload are split into parts (…1, …2) and keep data in sessionStorage.

const U = () => window.__uzquiz;
const app = () => document.getElementById("app");
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const txt = () => app().innerText;
// innerText follows CSS text-transform, so labels like "Raund 1 / 6" are compared case-insensitively
const has = (s) => txt().toLowerCase().includes(s.toLowerCase());
const S = {
  get: (k) => JSON.parse(sessionStorage.getItem("e2e." + k) || "null"),
  set: (k, v) => sessionStorage.setItem("e2e." + k, JSON.stringify(v)),
};

let out = [];
const errors = [];
function check(id, cond, detail = "") {
  out.push({ id, ok: !!cond, detail: cond ? "" : detail });
}
function installErrorTrap() {
  if (window.__e2eTrap) return;
  window.__e2eTrap = true;
  window.addEventListener("error", (e) => errors.push(String(e.message)));
  window.addEventListener("unhandledrejection", (e) => errors.push(String(e.reason)));
  const ce = console.error;
  console.error = (...a) => { errors.push(a.join(" ")); ce.apply(console, a); };
}
const ENG = /\b(Next|Score|Start|Back|Settings|Play|Records|Share|Continue|Exit|Correct|Wrong|Question|Round)\b/;
const engHits = [];
function scan(screen) {
  const t = txt();
  if (ENG.test(t)) engHits.push(`${screen}: ${t.match(ENG)[0]}`);
}

function click(sel) {
  const el = typeof sel === "string" ? $(sel) : sel;
  if (!el) throw new Error("no element " + sel);
  el.click();
  return el;
}
const act = (a) => click(`[data-act="${a}"]`);

function cur() {
  const g = U().game;
  const r = U().ROUNDS[g.round];
  const q = r.questions[g.q];
  return { g, r, q, type: q.type || r.type };
}

function answer(correct = true) {
  const { q, type } = cur();
  if (type === "options") {
    const target = correct ? q.answer : (q.answer + 1) % 4;
    click(`[data-opt="${target}"]`);
  } else {
    $("#answer").value = correct ? q.answer : "xatojavob";
    $("#text-form").requestSubmit();
  }
}

/* ------------------------------------------------------------------ */
const suites = {
  // TC-18, 19, 20, 59, 60 — fresh storage, home screen
  home() {
    const t = txt();
    check("TC-18", t.includes("Uzquiz") && $('[data-act="start"]') && $('[data-act="howto"]') && $('[data-act="records"]') && $('[data-act="settings"]'), "home buttons missing");
    check("TC-18b", !$('[data-act="continue"]') && !t.includes("Eng yaxshi natija"), "continue/best should be hidden on clean storage");
    scan("home");
    act("howto");
    const h = txt();
    check("TC-19", U().ROUNDS.every((r) => h.includes(r.title)) && h.includes("Ochkolar"), "howto content");
    scan("howto");
    act("home");
    check("TC-19b", !!$('[data-act="start"]'), "back to home");
    act("records");
    check("TC-20", txt().includes("Hozircha rekordlar yo'q"), "records empty state");
    scan("records");
    act("home");
    act("settings");
    scan("settings");
    act("home");
    check("TC-60", document.documentElement.lang === "uz" && $$("button").every((b) => b.innerText.trim() || b.getAttribute("aria-label")), "lang/labels");
  },

  // TC-21 part 1
  settings1() {
    act("settings");
    $$("[data-setting]").forEach((i) => { i.click(); });
    S.set("settings", $$("[data-setting]").map((i) => i.checked));
  },
  // TC-21 part 2 (after reload) — restore defaults afterwards
  settings2() {
    act("settings");
    const now = $$("[data-setting]").map((i) => i.checked);
    check("TC-21", JSON.stringify(now) === JSON.stringify(S.get("settings")) && now.every((v) => v === false), `persisted ${now}`);
    $$("[data-setting]").forEach((i) => { if (!i.checked) i.click(); });
    check("TC-21b", $$("[data-setting]").every((i) => i.checked), "restore defaults");
    act("home");
  },

  // Full perfect game — TC-23..25, 30, 32, 33, 35..42, 56, 59
  async full() {
    $("#name").value = "Dilnoza";
    act("start");
    check("TC-23", has("Raund 1 / 6") && has("Rasmli savollar") && $('[data-act="beginRound"]'), "intro");
    scan("intro");
    S.set("orders1", U().game.orders);
    let sumPoints = 0;
    let streakSeen = false;
    for (let ri = 0; ri < 6; ri++) {
      if (ri > 0) check(`TC-23.${ri}`, has(`Raund ${ri + 1} / 6`), `intro round ${ri + 1}`);
      act("beginRound");
      for (let qi = 0; qi < 7; qi++) {
        const { g, r, q, type } = cur();
        const t = txt();
        if (ri === 0 && qi === 0) {
          check("TC-24", t.includes("Savol 1 / 7") && $("#score") && $("#progress") && $("#timer .num").textContent === "20" && $(".q-image") && $$("[data-opt]").length === 4, "question screen elements");
          scan("question");
        }
        if (ri === 2 && qi === 0) {
          const hint = $(".hint-text").innerText;
          check("TC-30", hint.includes("«T»") && hint.includes("7 ta harf") && $$(".letters i").length === 7 && $("#answer"), `hint: ${hint}`);
        }
        if (ri === 2 && qi === 1) check("TC-33", $(".hint-text").innerText.includes("«T»"), $(".hint-text").innerText);
        if (ri === 2 && qi === 3) check("TC-33b", $(".hint-text").innerText.includes("«A»"), $(".hint-text").innerText);
        if (ri === 5 && qi < 6) check(`TC-35.${qi + 1}`, !/samarqand/i.test(t), "theme visible before Q7");
        if (ri === 0 && qi === 3) { check("TC-37", t.includes("🔥 3 ketma-ket"), "streak badge"); streakSeen = true; }

        const before = g.score;
        if (ri === 2 && qi === 0) {
          $("#answer").value = "  toshkent ";
          $("#answer").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
          $("#text-form").requestSubmit();
          check("TC-32", U().game.results[2][0]?.c === true, "' toshkent ' not accepted");
        } else {
          answer(true);
        }
        const res = U().game.results[ri][qi];
        sumPoints += res.p;
        if (ri === 0 && qi === 0) {
          const correctBtn = $(`[data-opt="${q.answer}"]`);
          check("TC-25", res.c && correctBtn.classList.contains("correct") && $("#options").classList.contains("locked") && txt().includes("To'g'ri!") && res.p >= 14 && $("#score").textContent.includes(String(before + res.p)), `points ${res.p}`);
          scan("feedback");
        }
        if (ri === 5 && qi === 6) {
          check("TC-36", res.c && res.p >= 20 && res.p <= 25 && txt().includes("Yashirin mavzu: Samarqand"), `final ${res.p}`);
        }
        if (!res.c) check(`ANS.${ri + 1}.${qi + 1}`, false, "correct answer not accepted");
        act("next");
      }
      const t = txt();
      check(`TC-38.${ri + 1}`, t.includes("7 / 7") && t.includes(`+${U().game.results[ri].reduce((s, x) => s + x.p, 0)}`) && t.includes(String(U().game.score)), "round result");
      if (ri === 0) scan("roundEnd");
      act("nextRound");
    }
    const t = txt();
    const score = Number($(".result-score").textContent);
    check("TC-39", t.includes("42/42") && t.includes("100%") && t.includes("Bilimlar sultoni") && $$(".stars span:not(.off)").length === 3 && $$(".bd-row .val").every((v) => v.textContent === "7/7") && score === sumPoints, `score ${score} vs ${sumPoints}`);
    scan("final");
    const recs = JSON.parse(localStorage.getItem("uzquiz.records") || "[]");
    check("TC-40", recs.length === 1 && recs[0].score === score && recs[0].name === "Dilnoza" && recs[0].correct === 42 && !localStorage.getItem("uzquiz.game"), "record saved");
    // TC-42 share fallback (desktop Chromium may have no navigator.share)
    const origShare = navigator.share;
    try { Object.defineProperty(navigator, "share", { value: undefined, configurable: true }); } catch {}
    act("share");
    await wait(300);
    check("TC-42", $("#toast").classList.contains("show") && $("#toast").textContent.length > 0, "toast");
    try { Object.defineProperty(navigator, "share", { value: origShare, configurable: true }); } catch {}
    act("home");
    check("TC-40b", txt().includes("Eng yaxshi natija") && txt().includes(`${score} ochko`), "best on home");
    act("records");
    check("TC-40c", txt().includes("Dilnoza") && txt().includes(String(score)), "records list");
    act("home");
    check("TC-56", !streakSeen || errors.length === 0, errors.join(" | "));
  },

  // TC-26, 27, 28, 29, 31, 34, 41, 43, 44, 50
  async mixed() {
    act("start");
    const o1 = S.get("orders1");
    const o2 = U().game.orders;
    check("TC-29", JSON.stringify(o1) !== JSON.stringify(o2), "orders identical across games");
    act("beginRound");
    // Q1 wrong
    let { q } = cur();
    answer(false);
    const wrongBtn = $(`[data-opt="${(q.answer + 1) % 4}"]`);
    check("TC-26", wrongBtn.classList.contains("wrong") && $(`[data-opt="${q.answer}"]`).classList.contains("correct") && txt().includes("Noto'g'ri") && txt().includes("To'g'ri javob") && U().game.results[0][0].p === 0, "wrong feedback");
    act("next");
    // Q2 double tap
    ({ q } = cur());
    const scoreBefore = U().game.score;
    const b1 = $(`[data-opt="${q.answer}"]`), b2 = $(`[data-opt="${(q.answer + 1) % 4}"]`);
    b1.click(); b2.click(); b1.click();
    check("TC-27", U().game.results[0].filter(Boolean).length === 2 && U().game.results[0][1].c === true && !b2.classList.contains("wrong") && U().game.score - scoreBefore === U().game.results[0][1].p, "double tap");
    act("next");
    // Q3 timeout
    ({ q } = cur());
    U().timer.remaining = 0.05;
    await wait(400);
    check("TC-28", txt().includes("Vaqt tugadi") && U().game.results[0][2].p === 0 && $(`[data-opt="${q.answer}"]`).classList.contains("correct") && $("#options").classList.contains("locked"), "timeout");
    act("next");
    // Q4 exit dialog pauses timer
    act("exit");
    const t0 = U().timer.remaining;
    check("TC-43", !!$(".modal") && txt() !== "" && document.querySelector(".modal").innerText.includes("O'yindan chiqasizmi?"), "dialog");
    await wait(1500);
    check("TC-43b", Math.abs(U().timer.remaining - t0) < 0.15, `timer moved ${t0} -> ${U().timer.remaining}`);
    click('[data-modal-act="0"]');
    await wait(1200);
    check("TC-44", !$(".modal") && U().timer.remaining < t0 - 0.8, `timer not resumed ${t0} -> ${U().timer.remaining}`);
    // Q4: visibility hidden pauses
    Object.defineProperty(document, "hidden", { get: () => true, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    const t1 = U().timer.remaining;
    await wait(1500);
    const t2 = U().timer.remaining;
    Object.defineProperty(document, "hidden", { get: () => false, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    check("TC-50", Math.abs(t2 - t1) < 0.15, `timer moved while hidden ${t1} -> ${t2}`);
    delete document.hidden;
    answer(true); act("next");
    answer(true); act("next");
    answer(true); act("next");
    answer(true); act("next"); // to round end
    act("nextRound"); act("beginRound");
    for (let i = 0; i < 7; i++) { answer(true); act("next"); }
    act("nextRound"); act("beginRound");
    // Round 3: empty submit, skip
    $("#answer").value = "   ";
    $("#text-form").requestSubmit();
    check("TC-31", !U().game.results[2][0] && $("#answer").classList.contains("shake") && !$("#fb").innerHTML, "empty submit recorded");
    act("skip");
    check("TC-34", txt().includes("O'tkazib yuborildi") && U().game.results[2][0].p === 0 && txt().includes("Toshkent"), "skip");
    // wrong text answer
    act("next");
    $("#answer").value = "Olma";
    $("#text-form").requestSubmit();
    check("TC-34b", txt().includes("Noto'g'ri") && txt().includes("Tarvuz"), "wrong text");
    act("next");
    // exit → home shows continue
    act("exit");
    click('[data-modal-act="1"]');
    const cont = $('[data-act="continue"]');
    check("TC-45", cont && cont.innerText.includes("3-raund") && cont.innerText.includes("3-savol") && cont.innerText.includes(`${U().game === null ? JSON.parse(localStorage.getItem("uzquiz.game")).score : "?"} ochko`), cont ? cont.innerText : "no continue");
    // TC-48: start with saved game → confirm; backdrop/escape cancel
    act("start");
    check("TC-48", !!$(".modal") && $(".modal").innerText.includes("Yangi o'yin boshlansinmi?"), "confirm dialog");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    check("TC-53", !$(".modal") && !!localStorage.getItem("uzquiz.game") && !!$('[data-act="continue"]'), "escape should cancel");
    act("start");
    click("[data-modal-backdrop]");
    check("TC-53b", !$(".modal") && !!localStorage.getItem("uzquiz.game"), "backdrop should cancel");
    act("start");
    click('[data-modal-act="1"]'); // Bekor qilish
    check("TC-48b", !!localStorage.getItem("uzquiz.game"), "cancel kept game");
    act("start");
    click('[data-modal-act="0"]'); // Ha
    check("TC-48c", has("Raund 1 / 6") && U().game.score === 0 && U().game.results.every((r) => r.length === 0), "new game started");
    act("exit");
    click('[data-modal-act="1"]');
  },

  // TC-46/47/22 — part 1: play round 1 + 3 questions of round 2, go to Q4
  persist1() {
    act("start");
    if ($(".modal")) click('[data-modal-act="0"]');
    act("beginRound");
    for (let i = 0; i < 7; i++) { answer(true); act("next"); }
    act("nextRound"); act("beginRound");
    for (let i = 0; i < 3; i++) { answer(i !== 1); act("next"); }
    S.set("p1", { round: U().game.round, q: U().game.q, score: U().game.score });
  },
  persist2() {
    const p = S.get("p1");
    check("TC-22", $("#name").value === "Dilnoza", `name prefill "${$("#name").value}"`);
    const cont = $('[data-act="continue"]');
    check("TC-45b", cont && cont.innerText.includes("2-raund") && cont.innerText.includes("4-savol") && cont.innerText.includes(`${p.score} ochko`), cont ? cont.innerText : "no continue");
    act("continue");
    check("TC-46", U().game.round === 1 && U().game.q === 3 && U().game.score === p.score && txt().includes("Savol 4 / 7") && U().timer && U().timer.remaining > 29, JSON.stringify({ r: U().game.round, q: U().game.q, s: U().game.score }));
    answer(true); // feedback shown, then reload
    S.set("p2", { score: U().game.score, answered: U().game.results[1].length });
  },
  persist3() {
    const p = S.get("p2");
    act("continue");
    check("TC-47", U().game.round === 1 && U().game.q === 4 && U().game.score === p.score && U().game.results[1].length === p.answered && txt().includes("Savol 5 / 7"), JSON.stringify({ q: U().game.q, s: U().game.score, exp: p }));
    act("exit");
    click('[data-modal-act="1"]');
  },

  // TC-52: timer off
  timerOff() {
    act("settings");
    const t = $('[data-setting="timer"]');
    if (t.checked) t.click();
    act("home");
    act("start");
    if ($(".modal")) click('[data-modal-act="0"]');
    act("beginRound");
    check("TC-52", !$("#timer") && txt().includes("Vaqt cheklanmagan"), "timer visible");
    answer(true);
    check("TC-52b", U().game.results[0][0].p === 10, `points ${U().game.results[0][0].p}`);
    act("next");
    act("exit");
    click('[data-modal-act="1"]');
    act("settings");
    $('[data-setting="timer"]').click();
    act("home");
  },

  // TC-49 part 1 — write corrupt data (then reload)
  corrupt1() {
    localStorage.setItem("uzquiz.game", "{not json");
    localStorage.setItem("uzquiz.records", '{"a":1}');
    localStorage.setItem("uzquiz.settings", "null");
    localStorage.setItem("uzquiz.name", "[[[");
  },
  corrupt2() {
    check("TC-49", !!$('[data-act="start"]') && !$('[data-act="continue"]') && txt().includes("Uzquiz"), "home not rendered");
    act("records");
    check("TC-49b", txt().includes("Hozircha rekordlar yo'q"), "records corrupt");
    act("home");
    act("settings");
    check("TC-49c", $$("[data-setting]").every((i) => i.checked), "settings defaults");
    act("home");
    localStorage.setItem("uzquiz.game", JSON.stringify({ round: 2, q: 1, score: 50, results: [[]], orders: [] }));
  },
  corrupt3() {
    check("TC-49d", !$('[data-act="continue"]'), "structurally invalid game accepted");
  },

  // Regression checks for iteration-1 bugs (run at 375 × 812 unless noted)
  async regression() {
    check("BUG-09", !app().hasAttribute("aria-live") && $("#toast").getAttribute("aria-live") === "polite", "aria-live still on #app");
    act("start");
    if ($(".modal")) click('[data-modal-act="0"]');
    act("beginRound");
    for (let r = 0; r < 2; r++) {
      for (let i = 0; i < 7; i++) { answer(true); act("next"); }
      act("nextRound"); act("beginRound");
    }
    // Round 3 — skip button single line (BUG-02)
    const skip = $('[data-act="skip"]'), submit = $('#text-form [type="submit"]');
    check("BUG-02", Math.abs(skip.offsetHeight - submit.offsetHeight) < 2 && skip.scrollWidth <= skip.clientWidth + 1, `skip h=${skip.offsetHeight} submit h=${submit.offsetHeight}`);
    act("skip");
    const boxes = $$(".letters i").map((b) => b.textContent).join("");
    check("BUG-07", boxes === "TOShKENT" || boxes.toLowerCase() === "toshkent", `boxes "${boxes}"`);
    act("next");
    for (let i = 1; i < 7; i++) { answer(true); act("next"); }
    act("nextRound");
    for (let r = 3; r < 5; r++) {
      act("beginRound");
      for (let i = 0; i < 7; i++) { answer(true); act("next"); }
      act("nextRound");
    }
    act("beginRound");
    for (let i = 0; i < 6; i++) { answer(true); act("next"); }
    answer(true);
    const fb = $("#fb").innerText;
    check("BUG-08", (fb.match(/Samarqand/g) || []).length === 2 && !fb.includes("To'g'ri javob"), fb); // reveal + fact only
    act("next");
    // BUG-06: make the stored best equal to this game's score → no "new record"
    const score = U().game.score;
    localStorage.setItem("uzquiz.records", JSON.stringify([{ name: "Oldingi", score, correct: 40, date: 1 }]));
    act("nextRound");
    check("BUG-06", !txt().includes("Yangi rekord"), "tie shown as new record");
    const home = $('[data-act="home"]'), share = $('[data-act="share"]');
    check("BUG-03", home.scrollWidth <= home.clientWidth + 1 && Math.abs(home.offsetHeight - share.offsetHeight) < 2 && home.offsetHeight < 60, `home h=${home.offsetHeight}`);
    act("home");
  },

  // BUG-04 / BUG-05 — run at 320 × 568
  small() {
    const cta = $('[data-act="start"]').getBoundingClientRect();
    check("BUG-05", cta.bottom <= innerHeight, `CTA bottom ${cta.bottom} > ${innerHeight}`);
    act("start");
    if ($(".modal")) click('[data-modal-act="0"]');
    act("beginRound");
    let worst = 0;
    for (let ri = 0; ri < 6; ri++) {
      for (let i = 0; i < 7; i++) {
        const { type } = cur();
        const last = type === "options" ? $$(".option").at(-1) : $('#text-form [type="submit"]');
        worst = Math.max(worst, last.getBoundingClientRect().bottom);
        if (last.getBoundingClientRect().bottom > innerHeight) out.push({ id: `BUG-04.R${ri + 1}Q${i + 1}`, ok: false, detail: `bottom ${Math.round(last.getBoundingClientRect().bottom)}` });
        answer(true); act("next");
      }
      act("nextRound");
      if (ri < 5) act("beginRound");
    }
    check("BUG-04", worst <= innerHeight, `worst bottom ${Math.round(worst)} > ${innerHeight}`);
    act("home");
  },

  // BUG-10 regression part 1: exit from round-result screen, then reload
  roundEndExit1() {
    act("start");
    if ($(".modal")) click('[data-modal-act="0"]');
    act("beginRound");
    for (let i = 0; i < 7; i++) { answer(true); act("next"); }
    check("BUG-10", !!$('[data-act="exit"]'), "no exit button on round result");
    act("exit");
    click('[data-modal-act="1"]');
    check("BUG-10b", !!$('[data-act="continue"]'), "continue missing after exit");
    S.set("re", U().game === null ? JSON.parse(localStorage.getItem("uzquiz.game")).score : -1);
  },
  roundEndExit2() {
    act("continue");
    check("BUG-10c", txt().includes("1-raund yakunlandi".toUpperCase()) || has("1-raund yakunlandi"), "not on round result");
    act("nextRound");
    check("BUG-10d", has("Raund 2 / 6") && U().game.score === S.get("re"), "next round after resume");
    act("exit");
    click('[data-modal-act="1"]');
  },

  // TC-51
  clearRecords() {
    localStorage.setItem("uzquiz.records", JSON.stringify([{ name: "A", score: 10, correct: 1, date: 1 }]));
    act("records");
    act("clearRecords");
    click('[data-modal-act="0"]');
    check("TC-51", txt().includes("Hozircha rekordlar yo'q") && !localStorage.getItem("uzquiz.records"), "records not cleared");
    act("home");
  },
};

export async function run(name) {
  out = [];
  installErrorTrap();
  try {
    await suites[name]();
  } catch (e) {
    out.push({ id: name, ok: false, detail: "EXCEPTION: " + e.message });
  }
  if (engHits.length) out.push({ id: "TC-59", ok: false, detail: engHits.join(", ") });
  else if (["home", "full"].includes(name)) out.push({ id: "TC-59", ok: true, detail: "" });
  out.push({ id: "errors", ok: errors.length === 0, detail: errors.join(" | ") });
  return out.map((r) => `${r.ok ? "PASS" : "FAIL"} ${r.id}${r.detail ? " — " + r.detail : ""}`).join("\n");
}
