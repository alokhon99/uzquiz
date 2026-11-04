// Question editor E2E tests. Run inside admin.html:
//   const m = await import('/__tests/admin-e2e.js?' + Date.now()); await m.run('<suite>')
// Publishing is tested against a mocked fetch — nothing is sent to GitHub.
import * as L from "/js/logic.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const A = () => window.__admin;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let out = [];
const check = (id, cond, detail = "") => out.push({ id, ok: !!cond, detail: cond ? "" : detail });
const type = (el, v) => { el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); };
const tab = (i) => $(`.tab[data-i="${i}"]`).click();

const suites = {
  // AD-01..08: editing, validation, draft persistence
  edit() {
    localStorage.removeItem("uzquiz.admin.draft");
    check("AD-01", $$(".tab").length === 6 && $$(".q-edit").length === 7 && $("#status").innerText.includes("Xato yo'q") && $("#publish-btn").disabled, "initial state");
    check("AD-01b", $$(".tab .badge").every((b) => b.hidden && getComputedStyle(b).display === "none"), "zero badges visible");
    check("AD-01c", getComputedStyle($("textarea")).fontFamily === getComputedStyle(document.body).fontFamily, "textarea font");
    // chain break in round 3
    tab(2);
    const ans = $('[data-q="2"][data-f="answer"]');
    type(ans, "Fil");
    const badge = $("#badge-2");
    check("AD-02", !badge.hidden && badge.textContent === "2" && $("#msgs-2").innerText.includes("«Z»") && $("#msgs-3").innerText.includes("«L»") && $("#publish-btn").disabled && $('[data-act="preview"]').disabled, $("#msgs-2").innerText);
    check("AD-03", $("#hint-3").innerText.includes("«L»") === true, $("#hint-3").innerText); // next question's hint follows the edit
    type($('[data-q="2"][data-f="answer"]'), "Zebra");
    check("AD-04", badge.hidden && !A().draft[2].questions[2].answer.includes("Fil") && !localStorage.getItem("uzquiz.admin.draft"), "revert clears error and draft");
    // duplicate options in round 2
    tab(1);
    const o1 = $('[data-q="0"][data-opt="1"]');
    type(o1, "12");
    check("AD-05", $("#msgs-0").innerText.includes("takrorlanmasligi") && $("#q-0").classList.contains("has-err"), "dup options");
    type($('[data-q="0"][data-opt="1"]'), "13");
    // real edit: question text + correct answer radio
    type($('[data-q="0"][data-f="text"]'), "O'zbekistonda nechta viloyat bor? (sinov)");
    const radio = $('[data-q="1"][data-correct="2"]');
    radio.click();
    check("AD-06", A().draft[1].questions[1].answer === 2 && $("#opt-1-2").classList.contains("correct") && !$("#opt-1-0").classList.contains("correct"), "radio");
    radio.closest(".opt-row").parentElement.querySelector('[data-correct="0"]').click();
    check("AD-07", $("#status").innerText.includes("1 ta o'zgarish") && $("#q-0").classList.contains("changed") && !$("#publish-btn").disabled && !!localStorage.getItem("uzquiz.admin.draft"), $("#status").innerText);
    // move a question (round 5) and back
    tab(4);
    const t0 = A().draft[4].questions[0].text;
    $('[data-act="down"][data-q="0"]').click();
    check("AD-08", A().draft[4].questions[1].text === t0, "move down");
    $('[data-act="up"][data-q="1"]').click();
    check("AD-08b", A().draft[4].questions[0].text === t0, "move up");
    // round 6 final question cannot move
    tab(5);
    check("AD-09", $('[data-act="up"][data-q="6"]').disabled && $('[data-act="down"][data-q="5"]').disabled, "final question locked last");
    type($('[data-rf="hiddenTheme"]'), "Buxoro");
    check("AD-10", $("#msgs-6").innerText.includes("yashirin mavzuga") || $("#msgs-round").innerText.includes("yashirin"), $("#msgs-6").innerText + " / " + $("#msgs-round").innerText);
    type($('[data-rf="hiddenTheme"]'), "Samarqand");
    // round 1: drop SVG flag → emoji required
    tab(0);
    $('[data-act="drop-svg"][data-q="2"]').click();
    check("AD-11", $("#msgs-2").innerText.includes("rasm kerak"), "svg removed requires emoji");
    type($('[data-q="2"][data-f="image"]'), "🇺🇿");
    check("AD-11b", !$("#msgs-2").innerText.trim(), $("#msgs-2").innerText);
  },
  afterReload() {
    const d = A().draft;
    check("AD-12", d[1].questions[0].text.endsWith("(sinov)") && d[0].questions[2].image === "🇺🇿" && $("#status").innerText.includes("o'zgarish"), "draft not restored");
  },
  // AD-13: mocked publish through the UI
  async publish() {
    const calls = [];
    const files = { main: { sha: "sha-main", content: btoa("old") }, "gh-pages": { sha: "sha-pages", content: btoa("old") } };
    const realFetch = window.fetch;
    window.fetch = async (url, opts = {}) => {
      calls.push({ url: String(url), method: opts.method || "GET", auth: opts.headers && opts.headers.Authorization, body: opts.body ? JSON.parse(opts.body) : null });
      const u = new URL(url);
      const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
      if (u.pathname === "/repos/alokhon99/uzquiz") return json(200, { permissions: { push: true } });
      const branch = u.searchParams.get("ref");
      if (!opts.method) return json(200, files[branch]);
      const b = JSON.parse(opts.body);
      return json(200, { commit: { sha: "c-" + b.branch, html_url: `https://github.com/alokhon99/uzquiz/commit/c-${b.branch}` } });
    };
    try {
      const expected = L.serializeRounds(A().draft);
      $("#publish-btn").click();
      check("AD-13", !!$(".modal") && $(".modal").innerText.includes("Savollarni nashr qilish"), "dialog");
      $("#pub-go").click(); // without token → shake, no call
      check("AD-13b", calls.length === 0 && $("#pub-token").classList.contains("shake"), "empty token");
      $("#pub-token").value = "test-token-for-mock";
      $("#pub-go").click();
      for (let i = 0; i < 40 && !$("#pub-go").textContent.includes("Nashr qilindi") && !$("#pub-go").textContent.includes("Qayta"); i++) await wait(50);
      const puts = calls.filter((c) => c.method === "PUT");
      const dec = (s) => new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)));
      check("AD-14", puts.length === 2 && puts.map((p) => p.body.branch).join() === "main,gh-pages", JSON.stringify(calls.map((c) => c.method + " " + c.url)));
      check("AD-15", puts.every((p) => dec(p.body.content) === expected), "content mismatch");
      check("AD-16", puts[0].url.endsWith("/contents/app/js/questions.js") && puts[1].url.endsWith("/contents/js/questions.js") && puts[0].body.sha === "sha-main" && puts[1].body.sha === "sha-pages", "paths/sha");
      check("AD-17", calls.every((c) => c.url.startsWith("https://api.github.com/") && c.auth === "Bearer test-token-for-mock"), "only GitHub API");
      check("AD-18", $("#pub-go").textContent.includes("Nashr qilindi") && !localStorage.getItem("uzquiz.admin.draft") && $("#status").innerText.includes("bir xil"), $("#pub-log").innerText);
      check("AD-19", !localStorage.getItem("uzquiz.admin.token") && sessionStorage.getItem("uzquiz.admin.token") === "test-token-for-mock", "token storage (not remembered)");
      $('[data-m="close"]').click();
      // error path: 401
      window.fetch = async () => new Response("{}", { status: 401 });
      type($('[data-rf="title"]'), A().draft[0].title + "!");
      $("#publish-btn").click();
      $("#pub-go").click();
      for (let i = 0; i < 40 && !$("#pub-go").textContent.includes("Qayta"); i++) await wait(50);
      check("AD-20", $("#pub-log").innerText.includes("Token noto'g'ri") && !$("#pub-go").disabled, $("#pub-log").innerText);
      $('[data-m="close"]').click();
    } finally {
      window.fetch = realFetch;
      sessionStorage.removeItem("uzquiz.admin.token");
    }
  },
};

export async function run(name) {
  out = [];
  try { await suites[name](); } catch (e) { out.push({ id: name, ok: false, detail: "EXCEPTION: " + e.message }); }
  return out.map((r) => `${r.ok ? "PASS" : "FAIL"} ${r.id}${r.detail ? " — " + r.detail : ""}`).join("\n");
}
