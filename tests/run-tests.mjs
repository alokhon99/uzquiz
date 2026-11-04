// Uzquiz unit/content tests (TC-01..TC-17, TC-57, TC-58). Run: node tests/run-tests.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { ROUNDS } from "../app/js/questions.js";
import * as L from "../app/js/logic.js";

const results = [];
function tc(id, name, fn) {
  try {
    const r = fn();
    if (r === true || r === undefined) results.push({ id, name, ok: true });
    else results.push({ id, name, ok: false, msg: String(r) });
  } catch (e) {
    results.push({ id, name, ok: false, msg: e.message });
  }
}
const eq = (a, b, m = "") => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };
const ok = (c, m) => { if (!c) throw new Error(m); };
const qt = (r, q) => q.type || r.type;

tc("TC-01", "6 rounds × 7 questions", () => {
  eq(ROUNDS.length, 6, "rounds");
  ROUNDS.forEach((r, i) => eq(r.questions.length, 7, `round ${i + 1}`));
  eq(L.totalQuestions(ROUNDS), 42);
});

tc("TC-02", "option questions valid", () => {
  for (const r of ROUNDS) r.questions.forEach((q, i) => {
    if (qt(r, q) !== "options") return;
    ok(Array.isArray(q.options) && q.options.length === 4, `R${r.id}Q${i + 1} needs 4 options`);
    ok(new Set(q.options.map(L.normalize)).size === 4, `R${r.id}Q${i + 1} duplicate options`);
    ok(q.options.every((o) => L.normalize(o)), `R${r.id}Q${i + 1} empty option`);
    ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4, `R${r.id}Q${i + 1} bad answer index`);
  });
});

tc("TC-03", "round 1 has pictures", () => {
  ROUNDS[0].questions.forEach((q, i) => ok(q.image || q.imageSvg, `R1Q${i + 1} no picture`));
});

tc("TC-04", "round 3 chain rule", () => {
  const qs = ROUNDS[2].questions;
  for (let i = 1; i < qs.length; i++) {
    const prev = L.lastLetter(qs[i - 1].answer), first = L.firstLetter(qs[i].answer);
    ok(prev === first, `Q${i} "${qs[i - 1].answer}" ends with "${prev}" but Q${i + 1} "${qs[i].answer}" starts with "${first}"`);
    eq(L.chainHintLetter(ROUNDS[2], i), first, `hint Q${i + 1}`);
  }
  ok(qs.every((q) => q.type === undefined && ROUNDS[2].type === "text"), "round 3 must be text");
});

tc("TC-05", "round 6 hidden theme structure", () => {
  const r = ROUNDS[5], qs = r.questions;
  qs.slice(0, 6).forEach((q, i) => eq(qt(r, q), "options", `Q${i + 1}`));
  const f = qs[6];
  eq(qt(r, f), "text"); eq(f.final, true); eq(f.points, 20);
  ok(L.normalize(f.answer) === L.normalize(r.hiddenTheme), "final answer must equal theme");
  // the theme word must not leak in Q1-6 text/options
  qs.slice(0, 6).forEach((q, i) => ok(![q.text, ...q.options].some((s) => L.normalize(s).includes("samarqand")), `theme leaked in Q${i + 1}`));
  ok(!L.normalize(r.description).includes("samarqand"), "theme leaked in description");
});

tc("TC-06", "Uzbek-only content", () => {
  const all = [];
  for (const r of ROUNDS) {
    all.push(r.title, r.description);
    for (const q of r.questions) all.push(q.text, ...(q.options || []), q.fact || "");
  }
  const cyr = all.filter((s) => /[Ѐ-ӿ]/.test(s));
  ok(!cyr.length, "Cyrillic found: " + cyr.join(" | "));
  const app = readFileSync(new URL("../app/js/app.js", import.meta.url), "utf8");
  const ui = [...app.matchAll(/>([^<>{}$`]*[A-Za-z][^<>{}$`]*)</g)].map((m) => m[1].trim()).filter(Boolean);
  const eng = ui.filter((t) => /\b(Next|Score|Start|Back|Settings|Play|Records|Share|Continue|Exit|Correct|Wrong)\b/.test(t));
  ok(!eng.length, "English UI text: " + eng.join(" | "));
});

tc("TC-07", "time limits", () => {
  eq(ROUNDS.map((r) => r.timeLimit), [20, 30, 45, 30, 30, 30]);
  eq(ROUNDS[5].questions[6].timeLimit, 60);
});

tc("TC-08", "text answer case/space", () => {
  const q = ROUNDS[2].questions[0];
  ["toshkent", "  TOSHKENT ", "Toshkent", "ToShKeNt"].forEach((v) => ok(L.isTextCorrect(v, q), `"${v}" rejected`));
});

tc("TC-09", "apostrophe variants", () => {
  const base = L.normalize("G'afur");
  ["G‘afur", "Gʻafur", "G`afur", "G’afur", "Gʼafur"].forEach((v) => eq(L.normalize(v), base, v));
});

tc("TC-10", "alternatives, wrong, empty", () => {
  const nav = ROUNDS[2].questions[6], sam = ROUNDS[5].questions[6];
  ok(L.isTextCorrect("Alisher Navoiy", nav), "Alisher Navoiy");
  ok(L.isTextCorrect("navoiy", nav), "navoiy");
  ok(L.isTextCorrect("Samarkand", sam), "Samarkand");
  ok(!L.isTextCorrect("Buxoro", sam), "Buxoro accepted");
  ok(!L.isTextCorrect("", sam) && !L.isTextCorrect("   ", sam) && !L.isTextCorrect(null, sam), "empty accepted");
});

tc("TC-11", "points", () => {
  eq(L.calcPoints({ correct: true, timeLeft: 20, timeLimit: 20 }), 15, "full");
  eq(L.calcPoints({ correct: true, timeLeft: 10, timeLimit: 20 }), 13, "half");
  eq(L.calcPoints({ correct: true, timeLeft: 0, timeLimit: 20 }), 10, "zero");
  eq(L.calcPoints({ correct: false, timeLeft: 20, timeLimit: 20 }), 0, "wrong");
  eq(L.calcPoints({ correct: true, timeLeft: 60, timeLimit: 60, base: 20 }), 25, "final");
  eq(L.calcPoints({ correct: true, timeLeft: 20, timeLimit: 20, timerOn: false }), 10, "timer off");
  eq(L.calcPoints({ correct: true, timeLeft: 99, timeLimit: 20 }), 15, "clamp high");
  eq(L.calcPoints({ correct: true, timeLeft: -3, timeLimit: 20 }), 10, "clamp low");
});

tc("TC-12", "max score", () => {
  eq(L.maxScore(ROUNDS, true), 640);
  eq(L.maxScore(ROUNDS, false), 430);
});

tc("TC-13", "ranks", () => {
  eq(L.rankFor(95).title, "Bilimlar sultoni");
  eq(L.rankFor(90).title, "Bilimlar sultoni");
  eq(L.rankFor(70).title, "Zukko");
  eq(L.rankFor(69).title, "Bilimdon");
  eq(L.rankFor(30).title, "Izlanuvchi");
  eq(L.rankFor(29).title, "Yosh bilimdon");
  eq(L.rankFor(0).title, "Yosh bilimdon");
});

tc("TC-14", "sanitizeName", () => {
  eq(L.sanitizeName(""), "O'yinchi");
  eq(L.sanitizeName("   "), "O'yinchi");
  eq(L.sanitizeName(undefined), "O'yinchi");
  eq(L.sanitizeName("A".repeat(25)).length, 20);
  eq(L.sanitizeName("  Ali   Vali "), "Ali Vali");
});

tc("TC-15", "topRecords", () => {
  const recs = Array.from({ length: 15 }, (_, i) => ({ name: "x" + i, score: i % 5, date: i }));
  const t = L.topRecords(recs);
  eq(t.length, 10);
  ok(t.every((r, i) => i === 0 || t[i - 1].score > r.score || (t[i - 1].score === r.score && t[i - 1].date >= r.date)), "order");
  eq(t[0], { name: "x14", score: 4, date: 14 });
});

tc("TC-16", "isValidState", () => {
  const good = { round: 0, q: 0, score: 0, results: ROUNDS.map(() => []), orders: ROUNDS.map((r) => r.questions.map(() => null)) };
  ok(L.isValidState(good, ROUNDS), "good rejected");
  const bad = [null, "x", 5, {}, { ...good, round: 6 }, { ...good, round: -1 }, { ...good, score: -5 }, { ...good, score: NaN },
    { ...good, results: [] }, { ...good, orders: null }, { ...good, q: 99 }, { ...good, orders: ROUNDS.map(() => []) }];
  bad.forEach((b, i) => ok(!L.isValidState(b, ROUNDS), `bad #${i} accepted`));
});

tc("TC-17", "shuffle", () => {
  const a = [0, 1, 2, 3];
  const s = L.shuffle(a);
  eq(a, [0, 1, 2, 3], "mutated");
  eq(s.slice().sort(), [0, 1, 2, 3], "not a permutation");
});

tc("TC-57", "bundle < 300 KB", () => {
  const dir = fileURLToPath(new URL("../app/", import.meta.url));
  const size = (p) => statSync(p).isDirectory() ? readdirSync(p).reduce((s, f) => s + size(join(p, f)), 0) : statSync(p).size;
  const kb = size(dir) / 1024;
  ok(kb < 300, `bundle ${kb.toFixed(1)} KB`);
});

tc("TC-58", "manifest & SW cache list", () => {
  const m = JSON.parse(readFileSync(new URL("../app/manifest.webmanifest", import.meta.url), "utf8"));
  ok(m.name && m.short_name && m.icons?.length && m.display === "standalone" && m.lang === "uz", "manifest fields");
  const sw = readFileSync(new URL("../app/sw.js", import.meta.url), "utf8");
  ["index.html", "css/styles.css", "js/app.js", "js/logic.js", "js/questions.js", "icon.svg", "manifest.webmanifest"]
    .forEach((f) => ok(sw.includes(`./${f}`), `SW does not cache ${f}`));
});

tc("TC-61", "isNewRecord (BUG-06 regression)", () => {
  ok(L.isNewRecord([], 0), "first game is a record");
  ok(L.isNewRecord([{ score: 100 }], 101), "higher");
  ok(!L.isNewRecord([{ score: 100 }], 100), "tie is not a record");
  ok(!L.isNewRecord([{ score: 100 }, { score: 50 }], 80), "lower");
});

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.id}  ${r.name}${r.ok ? "" : "  → " + r.msg}`);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
