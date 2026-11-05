// Uzquiz 2.0 unit / content tests. Run: node tests/run-tests.mjs
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as L from "../app/js/logic.js";
import * as P from "../app/js/pack.js";
import { ROUNDS as V1 } from "../tools/legacy/questions-v1.js";

const APP = fileURLToPath(new URL("../app/", import.meta.url));
const read = (p) => readFileSync(join(APP, p), "utf8");
const results = [];
function tc(id, name, fn) {
  try { const r = fn(); results.push(r === true || r === undefined ? { id, name, ok: true } : { id, name, ok: false, msg: String(r) }); }
  catch (e) { results.push({ id, name, ok: false, msg: e.message }); }
}
const eq = (a, b, m = "") => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };
const ok = (c, m) => { if (!c) throw new Error(m); };
const deep = (x) => JSON.parse(JSON.stringify(x));
const errs = (p) => P.validatePack(p).errors.map((e) => e.msg).join(" | ");

const index = JSON.parse(read("packs/index.json"));
const packIds = readdirSync(join(APP, "packs")).filter((d) => existsSync(join(APP, "packs", d, "pack.json")));
const packs = Object.fromEntries(packIds.map((id) => [id, JSON.parse(read(`packs/${id}/pack.json`))]));
const klassik = packs.klassik;

/* ---------- A. Content integrity (all packs) ---------- */
tc("U-01", "every pack.json passes validatePack with no errors or warnings", () => {
  for (const [id, p] of Object.entries(packs)) {
    const v = P.validatePack(p);
    ok(!v.errors.length, `${id}: ${v.errors.map((e) => e.msg).join("; ")}`);
    ok(!v.warnings.length, `${id} warnings: ${v.warnings.map((e) => e.msg).join("; ")}`);
    ok(p.id === id, `${id}: id does not match folder`);
  }
});
tc("U-02", "index.json lists every pack exactly once and matches catalogueEntry", () => {
  eq(index.packs.map((e) => e.id).sort(), packIds.sort(), "ids");
  for (const e of index.packs) eq(e, P.catalogueEntry(packs[e.id]), `entry ${e.id}`);
  ok(index.packs.every((e) => e.price === 0), "2.0-α: all packs free");
});
tc("U-03", "every referenced media file exists and respects size limits", () => {
  for (const [id, p] of Object.entries(packs)) {
    for (const src of P.mediaFiles(p)) {
      const f = join(APP, "packs", id, src);
      ok(existsSync(f), `${id}: missing ${src}`);
      const type = /\.(mp4|webm)$/.test(src) ? "video" : /\.(wav|mp3|m4a|ogg)$/.test(src) ? "audio" : "image";
      ok(statSync(f).size <= P.MEDIA_LIMITS[type].maxBytes, `${id}: ${src} too big`);
    }
  }
});
tc("U-04", "no orphan media files (every file in media/ is used)", () => {
  for (const [id, p] of Object.entries(packs)) {
    const dir = join(APP, "packs", id, "media");
    if (!existsSync(dir)) continue;
    const used = P.mediaFiles(p).map((s) => s.replace(/^media\//, ""));
    const orphans = readdirSync(dir).filter((f) => !used.includes(f));
    ok(!orphans.length, `${id}: unused ${orphans.join(", ")}`);
  }
});
tc("U-05", "Klassik rounds 2–6 are a faithful migration of the v1 question bank", () => {
  const v1 = P.migrateV1(V1);
  eq(klassik.rounds.slice(1), v1.rounds.slice(1), "rounds 2–6 != migrateV1(v1)");
  eq(klassik.rounds.map((r) => r.questions.length), [7, 7, 7, 7, 7, 7]);
  eq(klassik.rounds.map((r) => r.kind), ["standard", "standard", "chain", "standard", "standard", "theme"]);
  eq(klassik.rounds.map((r) => r.timeLimit), [45, 30, 45, 30, 30, 30]);
});
tc("U-34", "Rasminka (2.1): 7 picture riddles with typed answers", () => {
  const r = klassik.rounds[0];
  eq(r.title, "Rasminka");
  ok(r.questions.every((q) => q.type === "text" && q.media && q.media.type === "image"), "all text + image");
  ok(new Set(r.questions.map((q) => q.media.src)).size === 7, "7 distinct pictures");
  ok(r.questions.every((q) => L.isTextCorrect(q.answer, q)), "own answer accepted");
  ok(r.questions.every((q) => (q.partial || []).every((x) => L.checkText(x, q).verdict === "partial")), "partials give half");
});
tc("U-06", "Klassik word chain and hidden theme", () => {
  const ch = klassik.rounds[2];
  for (let i = 1; i < 7; i++) eq(L.firstLetter(ch.questions[i].answer), L.lastLetter(ch.questions[i - 1].answer), `chain ${i}`);
  const th = klassik.rounds[5];
  ok(th.questions[6].final && L.normalize(th.questions[6].answer) === L.normalize(th.hiddenTheme), "theme");
});
tc("U-07", "Uzbek-only content (no Cyrillic) in every pack", () => {
  for (const [id, p] of Object.entries(packs)) ok(!/[Ѐ-ӿ]/.test(JSON.stringify(p)), `${id}: Cyrillic found`);
});
tc("U-08", "every file media has alt text (image/video) and a rights record", () => {
  for (const [id, p] of Object.entries(packs)) {
    for (const r of p.rounds) for (const q of r.questions) for (const m of [q.media, q.reveal]) {
      if (!m || m.type === "emoji") continue;
      ok(m.rights && m.rights.source && P.LICENCES[m.rights.licence] && m.rights.holder, `${id}: rights missing for ${m.src}`);
      if (m.type !== "audio") ok(m.alt, `${id}: alt missing for ${m.src}`);
    }
  }
});

/* ---------- B2. 2.1 lenient matching ---------- */
tc("U-35", "Cyrillic/Latin, punctuation and x/h are ignored", () => {
  const q = { answer: "U.S. Polo Assn", alts: ["US Polo"], keywords: ["polo"] };
  ["us polo", "U.S Polo.", "Ю.С. Поло", "Polo", "U.S. POLO ASSN"].forEach((v) => eq(L.checkText(v, q).verdict, "ok", v));
  ["Хива", "Khiva", "Hiva", "xiva"].forEach((v) => eq(L.checkText(v, { answer: "Xiva" }).verdict, "ok", v));
  eq(L.checkText("Улуғбек", { answer: "Ulug'bek" }).verdict, "ok");
  eq(L.toLatin("Шўрва"), "sho'rva");
});
tc("U-36", "typo tolerance scales with length; numbers and short words must be exact", () => {
  eq(L.checkText("Registn", { answer: "Registon" }).how, "typo");
  eq(L.checkText("Smaraqand", { answer: "Samarqand" }).how, "typo");      // transposition
  eq(L.checkText("Rgstn", { answer: "Registon" }).verdict, "no");          // 3 errors
  eq(L.checkText("Oh", { answer: "Osh" }).verdict, "no");                  // ≤4 letters exact
  eq(L.checkText("1992", { answer: "1991" }).verdict, "no");               // numbers exact
  eq(L.checkText("Registn", { answer: "Registon", exact: true }).verdict, "no");
});
tc("U-37", "key words and partial answers", () => {
  const q = { answer: "Nyuton", alts: ["Isaak Nyuton"], keywords: ["newton"], partial: ["tortishish qonuni", "gravitatsiya"] };
  eq(L.checkText("Isaac Newton", q).how, "keyword");
  eq(L.checkText("butun olam tortishish qonuni", q).verdict, "partial");
  eq(L.checkText("Gravitatsiya", q).verdict, "partial");
  eq(L.checkText("Eynshteyn", q).verdict, "no");
  eq(L.checkText("   ", q).verdict, "no");
});
tc("U-38", "validator: bad lists, unknown hint, partial that is really correct, short key word", () => {
  const base = deep(klassik), q = base.rounds[0].questions[0];
  q.hint = "maybe"; q.partial = ["osh"]; q.keywords = ["os"];
  const v = P.validatePack(base);
  ok(v.errors.some((e) => e.msg.includes("Ishora")), "hint");
  ok(v.errors.some((e) => e.msg.includes("qisman javob bo'la olmaydi")), "partial==answer");
  ok(v.warnings.some((e) => e.msg.includes("juda qisqa")), "short keyword");
  const b2 = deep(klassik); b2.rounds[0].questions[1].alts = ["", "x"];
  ok(P.validatePack(b2).errors.some((e) => e.msg.includes("bo'sh qiymat")), "empty alt");
});
tc("U-39", "answerWords splits words and strips punctuation for letter boxes", () => {
  eq(L.answerWords("U.S. Polo"), [["u", "s"], ["p", "o", "l", "o"]]);
  eq(L.answerWords("Do'ppi"), [["d", "o'", "p", "p", "i"]]);
});

/* ---------- B. Answer & scoring logic (carried over from 1.x) ---------- */
tc("U-10", "text answers: case, spaces, apostrophes, alternatives", () => {
  const q = klassik.rounds[2].questions[0];
  ["toshkent", "  TOSHKENT ", "ToShKeNt"].forEach((v) => ok(L.isTextCorrect(v, q), v));
  ["G‘afur", "Gʻafur", "G`afur", "G’afur"].forEach((v) => eq(L.normalize(v), L.normalize("G'afur"), v));
  ok(L.isTextCorrect("Alisher Navoiy", klassik.rounds[2].questions[6]), "alt");
  ok(!L.isTextCorrect("Buxoro", klassik.rounds[5].questions[6]) && !L.isTextCorrect("  ", q), "wrong/empty");
});
tc("U-11", "points & speed bonus", () => {
  eq(L.calcPoints({ correct: true, timeLeft: 20, timeLimit: 20 }), 15);
  eq(L.calcPoints({ correct: true, timeLeft: 10, timeLimit: 20 }), 13);
  eq(L.calcPoints({ correct: true, timeLeft: 0, timeLimit: 20, base: 15 }), 15);
  eq(L.calcPoints({ correct: false, timeLeft: 20, timeLimit: 20 }), 0);
  eq(L.calcPoints({ correct: true, timeLeft: 20, timeLimit: 20, timerOn: false }), 10);
});
tc("U-12", "maxScore per pack", () => {
  eq(P.maxScore(klassik, true), 640);
  eq(P.maxScore(klassik, false), 430);
  eq(P.maxScore(packs.diqqat, true), 3 * 15 + 3 * 20);
  const p = deep(packs.diqqat); p.settings.speedBonus = false;
  eq(P.maxScore(p, true), 3 * 10 + 3 * 15, "speed bonus off");
});
tc("U-13", "ranks, stars, names, records", () => {
  eq([95, 70, 69, 30, 29].map((a) => L.rankFor(a).title), ["Bilimlar sultoni", "Zukko", "Bilimdon", "Izlanuvchi", "Yosh bilimdon"]);
  eq(L.sanitizeName("   "), "O'yinchi");
  eq(L.sanitizeName("A".repeat(25)).length, 20);
  ok(!L.isNewRecord([{ score: 100 }], 100) && L.isNewRecord([], 0), "isNewRecord");
  eq(L.topRecords(Array.from({ length: 15 }, (_, i) => ({ score: i % 5, date: i }))).length, 10);
});

/* ---------- C. Pack format rules ---------- */
tc("U-20", "validatePack catches broken packs", () => {
  let p = deep(packs.diqqat); p.rounds[0].questions[0].options[1] = p.rounds[0].questions[0].options[0];
  ok(errs(p).includes("takrorlanmasligi"), "duplicate options");
  p = deep(packs.diqqat); p.rounds[0].questions[0].options = ["Faqat bitta"]; p.rounds[0].questions[0].answer = 0;
  ok(errs(p).includes("Variantlar soni"), "too few options");
  p = deep(packs.diqqat); p.rounds[0].questions[0].options.push("a", "b", "c");
  ok(errs(p).includes("Variantlar soni"), "too many options (7)");
  p = deep(packs.diqqat); p.rounds[1].questions[0].media.alt = "";
  ok(errs(p).includes("alt matn"), "video alt");
  p = deep(packs.tovushlar); delete p.rounds[0].questions[0].media.rights;
  ok(errs(p).includes("uquq"), "rights");
  p = deep(packs.diqqat); p.rounds[1].questions[2].media.end = 0.1;
  ok(errs(p).includes("ugash vaqti"), "trim end <= start");
  p = deep(packs.diqqat); p.rounds[0].questions[2].answer = "ha";
  ok(errs(p).includes("Ha / Yo'q"), "truefalse answer type");
  p = deep(klassik); p.rounds[2].questions[2].answer = "Fil";
  ok(/zanjiri buzilgan.*«Z»/.test(errs(p)), "chain");
  p = deep(klassik); p.rounds[2].questions[1].type = "choice"; p.rounds[2].questions[1].options = ["a", "b"]; p.rounds[2].questions[1].answer = 0;
  ok(errs(p).includes("yozma javobli"), "chain requires text");
  p = deep(klassik); p.rounds[5].hiddenTheme = "Buxoro";
  ok(errs(p).includes("yashirin mavzuga"), "theme");
  p = deep(klassik); p.rounds = [];
  ok(errs(p).includes("Raundlar soni"), "rounds 0");
  p = deep(klassik); while (p.rounds.length < 11) p.rounds.push(deep(p.rounds[0]));
  ok(errs(p).includes("Raundlar soni"), "rounds 11");
  p = deep(klassik); p.rounds[0].questions = Array.from({ length: 21 }, () => deep(klassik.rounds[0].questions[0]));
  ok(errs(p).includes("ta savol"), "questions 21");
  p = deep(klassik); p.id = "Bad ID";
  ok(errs(p).includes("Paket ID"), "id");
  p = deep(klassik); p.category = "nope";
  ok(errs(p).includes("Toifa"), "category");
  p = deep(klassik); p.rounds[1].questions[0].final = true;
  ok(errs(p).includes("Yakuniy savol"), "final outside theme");
  p = deep(packs.diqqat); p.rounds[1].questions[0].media.maxReplays = 9;
  ok(errs(p).includes("ayta"), "replays");
});
tc("U-21", "blank templates are valid once filled", () => {
  const p = P.blankPack("test-paket");
  ok(errs(p).includes("Paket nomi"), "blank must fail");
  p.title = "Sinov"; p.description = "Tavsif";
  const q = p.rounds[0].questions[0]; q.text = "2+2?"; q.options = ["3", "4", "5", "6"]; q.answer = 1;
  eq(P.validatePack(p).errors, [], "filled blank");
  const th = P.blankRound("theme");
  eq(th.questions.at(-1).final, true, "theme round ends with final question");
});
tc("U-22", "catalogue helpers: visible, search, new", () => {
  const list = [{ id: "a", title: "Kino klassikasi", description: "filmlar", category: "kino", status: "published", publishedAt: "2026-11-01" },
    { id: "b", title: "Qoralama", description: "", category: "kino", status: "draft" },
    { id: "c", title: "Tarix", description: "Amir Temur davri", category: "tarix", status: "published", publishedAt: "2026-10-01" },
    { id: "d", title: "Eski", description: "", category: "tarix", status: "archived" }];
  eq(P.visiblePacks({ packs: list }).map((p) => p.id), ["a", "c"], "visible + newest first");
  eq(P.searchPacks(P.visiblePacks({ packs: list }), { query: "temur" }).map((p) => p.id), ["c"], "search desc");
  eq(P.searchPacks(P.visiblePacks({ packs: list }), { category: "kino" }).map((p) => p.id), ["a"], "category");
  eq(P.searchPacks(P.visiblePacks({ packs: list }), { query: "KINO" }).map((p) => p.id), ["a"], "case-insensitive");
  const now = Date.parse("2026-11-05");
  ok(P.isNew(list[0], now) && !P.isNew(list[2], now), "isNew 14 days");
  eq(P.visiblePacks(null), [], "null index");
});
tc("U-23", "isValidGame guards saved games per pack", () => {
  const g = { packId: "diqqat", round: 0, q: 0, score: 0, results: [[], []], orders: [[[0, 1, 2, 3], [0, 1, 2], null], [[0, 1, 2, 3], [3, 2, 1, 0], [0, 1, 2, 3]]] };
  ok(P.isValidGame(g, packs.diqqat), "valid");
  ok(!P.isValidGame({ ...g, packId: "klassik" }, packs.diqqat), "other pack");
  ok(!P.isValidGame({ ...g, round: 2 }, packs.diqqat), "round range");
  ok(!P.isValidGame({ ...g, orders: [[[0, 1], [0, 1, 2], null], g.orders[1]] }, packs.diqqat), "option order length");
  ok(!P.isValidGame(null, packs.diqqat) && !P.isValidGame("x", packs.diqqat), "garbage");
});
tc("U-24", "serializePack / serializeIndex are stable", () => {
  for (const id of packIds) eq(read(`packs/${id}/pack.json`), P.serializePack(packs[id]), `${id} not canonical`);
  eq(read("packs/index.json"), P.serializeIndex(index.packs), "index not canonical");
});

/* ---------- D. App shell ---------- */
tc("U-30", "service worker precaches every shell file that exists", () => {
  const sw = read("sw.js");
  for (const f of ["index.html", "css/styles.css", "js/app.js", "js/logic.js", "js/pack.js", "js/mediastore.js", "icon.svg", "manifest.webmanifest", "packs/index.json"]) {
    ok(sw.includes(`./${f}`), `SW does not cache ${f}`);
    ok(existsSync(join(APP, f)), `${f} missing`);
  }
  ok(!/questions\.js/.test(sw), "SW still references removed questions.js");
});
tc("U-31", "app code bundle < 300 KB (media excluded)", () => {
  const size = (p) => statSync(p).isDirectory() ? readdirSync(p).reduce((s, f) => s + (f === "packs" ? 0 : size(join(p, f))), 0) : statSync(p).size;
  const kb = size(APP) / 1024;
  ok(kb < 300, `${kb.toFixed(1)} KB`);
});
tc("U-32", "manifest valid", () => {
  const m = JSON.parse(read("manifest.webmanifest"));
  ok(m.name && m.icons?.length && m.display === "standalone" && m.lang === "uz", "fields");
});
tc("U-33", "no UI text in English", () => {
  const src = read("js/app.js") + read("js/admin.js");
  const ui = [...src.matchAll(/>([^<>{}$`]*[A-Za-z][^<>{}$`]*)</g)].map((m) => m[1].trim()).filter(Boolean);
  const eng = ui.filter((t) => /\b(Next|Score|Start|Back|Settings|Play|Records|Share|Continue|Exit|Save|Delete|Upload|Cancel)\b/.test(t));
  ok(!eng.length, eng.join(" | "));
});

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.id}  ${r.name}${r.ok ? "" : "  → " + r.msg}`);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
