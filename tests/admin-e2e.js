// Uzquiz 2.0 admin (pack editor) E2E tests. Run inside admin.html:
//   const m = await import('/__tests/admin-e2e.js?' + Date.now()); await m.run('<suite>')
// GitHub publishing is tested against a mocked fetch — nothing is sent anywhere.
import { mediaStore } from "/js/mediastore.js";
import * as P from "/js/pack.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const A = () => window.__admin;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms = 4000) { const t = Date.now(); while (Date.now() - t < ms) { const v = fn(); if (v) return v; await wait(40); } return fn(); }
let out = [];
const check = (id, cond, detail = "") => out.push({ id, ok: !!cond, detail: cond ? "" : detail });
const type = (el, v) => { if (typeof el === "string") el = $(el); el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); };
const choose = (el, v) => { if (typeof el === "string") el = $(el); el.value = v; el.dispatchEvent(new Event("change", { bubbles: true })); };
const act = (a, extra = "") => { const el = $(`[data-act="${a}"]${extra}`); if (!el) throw new Error("no " + a + extra); el.click(); return el; };
const errCount = () => A().check.errors.length;
const ID = "sinov-paketi";

async function setFile(input, file) {
  const dt = new DataTransfer(); dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
}
async function pngFile(w = 2000, h = 1000) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d"); x.fillStyle = "#7C5CFF"; x.fillRect(0, 0, w, h); x.fillStyle = "#FFC53D"; x.beginPath(); x.arc(w / 2, h / 2, h / 3, 0, 7); x.fill();
  const blob = await new Promise((r) => c.toBlob(r, "image/png"));
  return new File([blob], "rasm.png", { type: "image/png" });
}
function wavFile(seconds) {
  const rate = 8000, n = rate * seconds, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
  const w = (o, s) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
  w(0, "RIFF"); v.setUint32(4, 36 + n, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, "data"); v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128 + Math.round(60 * Math.sin(i / 8)));
  return new File([buf], `ovoz-${seconds}s.wav`, { type: "audio/wav" });
}

const suites = {
  async list() {
    await until(() => $(".pack-rows"));
    const rows = $$(".prow");
    check("AD-01", rows.length >= 3 && rows.every((r) => r.querySelector(".pill")) && $('[data-act="newPack"]'), `rows ${rows.length}`);
  },

  async create() {
    localStorage.removeItem(`uzquiz.admin.draft.${ID}`);
    act("newPack");
    type("#np-title", "Sinov paketi");
    check("AD-02a", $("#np-id").value === ID, $("#np-id").value);
    type("#np-id", "klassik");
    $('[data-m="ok"]').click();
    check("AD-02b", $("#np-err").innerText.includes("band"), $("#np-err").innerText);
    type("#np-id", ID);
    $('[data-m="ok"]').click();
    await until(() => $("#status"));
    check("AD-02", A().draft.pack.id === ID && A().draft.pack.status === "draft" && errCount() > 0 && !!localStorage.getItem(`uzquiz.admin.draft.${ID}`), `errors ${errCount()}`);
  },

  async edit() {
    act("tab", '[data-i="pack"]');
    type('[data-path="description"]', "Avtomatik test uchun yaratilgan paket.");
    choose('[data-path="category"]', "mantiq");
    choose('[data-path="ageRating"]', "12+");
    const sb = $('[data-path="settings.speedBonus"]'); sb.click();
    check("AD-03", A().draft.pack.category === "mantiq" && A().draft.pack.ageRating === "12+" && A().draft.pack.settings.speedBonus === false, JSON.stringify(A().draft.pack.settings));
    // round 1: standard with choice + truefalse + text
    act("tab", '[data-i="0"]');
    type('[data-path="rounds.0.title"]', "Birinchi raund");
    type('[data-path="rounds.0.questions.0.text"]', "Ikki karra ikki necha?");
    ["3", "4", "5", "6"].forEach((v, i) => type(`[data-path="rounds.0.questions.0.options.${i}"]`, v));
    $('[data-path="rounds.0.questions.0.answer"][value="1"]').click();
    act("addOpt", '[data-path="rounds.0.questions.0"]');
    check("AD-05a", A().draft.pack.rounds[0].questions[0].options.length === 5 && $$('[data-path^="rounds.0.questions.0.options."]').length === 5, "add option");
    check("AD-05b", $("#msgs-0-0").innerText.includes("Bo'sh javob varianti"), $("#msgs-0-0").innerText);
    $$('[data-act="delOpt"][data-path="rounds.0.questions.0"]')[4].click();
    check("AD-05c", A().draft.pack.rounds[0].questions[0].options.length === 4 && A().draft.pack.rounds[0].questions[0].answer === 1, "remove option keeps answer");
    act("addQ", '[data-type="truefalse"]');
    type('[data-path="rounds.0.questions.1.text"]', "Yer quyosh atrofida aylanadimi?");
    $('[data-path="rounds.0.questions.1.answer"][value="true"]').click();
    act("addQ", '[data-type="text"]');
    type('[data-path="rounds.0.questions.2.text"]', "O'zbekiston poytaxti?");
    type('[data-path="rounds.0.questions.2.answer"]', "Toshkent");
    type('[data-path="rounds.0.questions.2.alts"]', "Tashkent, Toshkent shahri");
    check("AD-05", A().draft.pack.rounds[0].questions.length === 3 && A().draft.pack.rounds[0].questions[1].answer === true && A().draft.pack.rounds[0].questions[2].alts.length === 2, JSON.stringify(A().draft.pack.rounds[0].questions.map((q) => q.type)));
    // round 2: theme
    act("addRound");
    check("AD-04a", A().draft.pack.rounds.length === 2 && $('.tab[aria-selected="true"]').dataset.i === "1", "add round");
    choose('[data-path="rounds.1.kind"]', "theme");
    const r2 = A().draft.pack.rounds[1];
    check("AD-04", r2.kind === "theme" && r2.questions.at(-1).final && r2.hiddenTheme === "" && $('[data-path="rounds.1.hiddenTheme"]'), JSON.stringify(r2.questions.map((q) => q.type)));
    type('[data-path="rounds.1.title"]', "Mavzu");
    type('[data-path="rounds.1.hiddenTheme"]', "Futbol");
    type('[data-path="rounds.1.questions.0.text"]', "11 o'yinchidan iborat jamoa o'yini?");
    ["Futbol", "Tennis", "Shaxmat", "Boks"].forEach((v, i) => type(`[data-path="rounds.1.questions.0.options.${i}"]`, v));
    check("AD-04w", A().check.warnings.some((w) => w.msg.includes("oldindan")), "theme leak warning");
    ["Tepki", "Tennis", "Shaxmat", "Boks"].forEach((v, i) => type(`[data-path="rounds.1.questions.0.options.${i}"]`, v));
    type('[data-path="rounds.1.questions.0.text"]', "To'pni oyoq bilan urish nima deyiladi?");
    type('[data-path="rounds.1.questions.1.answer"]', "Futbol");
    check("AD-04b", !A().check.errors.some((e) => e.r === 1), JSON.stringify(A().check.errors.filter((e) => e.r === 1)));
    // final question cannot move/delete
    check("AD-04c", $('[data-act="delQ"][data-i="1"]').disabled && $('[data-act="moveQ"][data-i="1"][data-dir="-1"]').disabled, "final locked");
    check("AD-13a", JSON.parse(localStorage.getItem(`uzquiz.admin.draft.${ID}`)).pack.rounds[1].hiddenTheme === "Futbol", "draft autosaved");
  },
  async afterReload() {
    await until(() => A().draft);
    check("AD-13", A().draft.pack.id === ID && A().draft.pack.rounds.length === 2 && A().draft.pack.rounds[0].questions[2].answer === "Toshkent", "draft restored after reload");
  },

  async upload() {
    act("tab", '[data-i="0"]');
    $('#q-0-0 details.media-ed').open = true;
    act("mediaKind", '[data-path="rounds.0.questions.0.media"][data-kind="image"]');
    check("AD-08a", A().check.errors.some((e) => e.r === 0 && e.q === 0 && e.msg.includes("fayl tanlanmagan")), "file required");
    // wrong type
    await setFile($('[data-upload="rounds.0.questions.0.media"]'), new File(["salom"], "matn.txt", { type: "text/plain" }));
    await wait(200);
    check("AD-07a", $("#toast").innerText.includes("qo'llab-quvvatlanmaydi"), $("#toast").innerText);
    // real PNG 2000×1000 → WebP ≤ 1280
    await setFile($('[data-upload="rounds.0.questions.0.media"]'), await pngFile());
    await until(() => A().draft.pack.rounds[0].questions[0].media.src, 5000);
    const m = A().draft.pack.rounds[0].questions[0].media;
    const blob = await mediaStore.get(`${ID}/${m.src}`);
    const bmp = blob && await createImageBitmap(blob);
    check("AD-06", /^media\/[0-9a-f]{12}\.webp$/.test(m.src) && blob.type === "image/webp" && bmp.width === 1280 && bmp.height === 640 && A().draft.pending.includes(m.src), `${m.src} ${blob && blob.type} ${bmp && bmp.width}x${bmp && bmp.height}`);
    await until(() => $('[data-preview="rounds.0.questions.0.media"] img'));
    check("AD-06b", $('[data-preview="rounds.0.questions.0.media"] img').src.startsWith("blob:"), "preview from local blob");
    const qErr = () => A().check.errors.filter((e) => e.r === 0 && e.q === 0).map((e) => e.msg).join(" | ");
    check("AD-08", qErr().includes("alt matn") && qErr().includes("huquq"), qErr());
    type('[data-path="rounds.0.questions.0.media.alt"]', "Binafsha fonda sariq doira");
    type('[data-path="rounds.0.questions.0.media.rights.source"]', "Avtotest");
    choose('[data-path="rounds.0.questions.0.media.rights.licence"]', "own");
    type('[data-path="rounds.0.questions.0.media.rights.holder"]', "Uzquiz");
    check("AD-08b", !qErr(), qErr());
    // audio > 60 s rejected
    act("tab", '[data-i="0"]');
    $('#q-0-1 details.media-ed').open = true;
    act("mediaKind", '[data-path="rounds.0.questions.1.media"][data-kind="audio"]');
    await setFile($('[data-upload="rounds.0.questions.1.media"]'), wavFile(61));
    await until(() => $("#toast").innerText.includes("uzun"), 4000);
    check("AD-07", $("#toast").innerText.includes("Juda uzun") && !A().draft.pack.rounds[0].questions[1].media.src, $("#toast").innerText);
    // 3 s audio accepted, then switch back to none (pending cleaned up)
    await setFile($('[data-upload="rounds.0.questions.1.media"]'), wavFile(3));
    await until(() => A().draft.pack.rounds[0].questions[1].media && A().draft.pack.rounds[0].questions[1].media.src, 4000);
    const asrc = A().draft.pack.rounds[0].questions[1].media.src;
    act("mediaKind", '[data-path="rounds.0.questions.1.media"][data-kind="none"]');
    await wait(150);
    check("AD-07b", !A().draft.pending.includes(asrc) && !(await mediaStore.get(`${ID}/${asrc}`)), "unused upload removed");
    check("AD-09a", errCount() === 0, JSON.stringify(A().check.errors));
  },

  async preview() {
    let opened = "";
    const orig = window.open; window.open = (u) => { opened = u; return null; };
    act("tab", '[data-i="0"]');
    act("preview");
    window.open = orig;
    check("AD-09", opened === `./?preview=${ID}&r=0` && JSON.parse(localStorage.getItem(`uzquiz.admin.draft.${ID}`)).pack.title === "Sinov paketi", opened);
    sessionStorage.setItem("e2e.previewUrl", opened);
  },

  async publish() {
    const calls = [];
    const real = window.fetch;
    const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
    let blobN = 0;
    window.fetch = async (url, opts = {}) => {
      const u = new URL(String(url), location.href);
      if (u.origin !== "https://api.github.com") return real(url, opts);
      const body = opts.body ? JSON.parse(opts.body) : null;
      calls.push({ m: opts.method || "GET", p: u.pathname + u.search, body, auth: opts.headers && opts.headers.Authorization });
      const p = u.pathname;
      if (p === "/repos/alokhon99/uzquiz") return json(200, { permissions: { push: true } });
      if (p.endsWith("/git/blobs")) return json(201, { sha: `blob${++blobN}` });
      if (p.includes("/git/ref/heads/")) return json(200, { object: { sha: `head-${p.split("/").pop()}` } });
      if (p.includes("/git/commits/")) return json(200, { tree: { sha: `tree-${p.split("/").pop()}` } });
      if (p.includes("/contents/")) return json(200, { content: btoa(JSON.stringify({ schema: 2, packs: [{ id: "klassik", title: "K" }] })) });
      if (p.endsWith("/git/trees")) return json(201, { sha: `newtree${calls.length}` });
      if (p.endsWith("/git/commits")) return json(201, { sha: `commit-${body.tree}` });
      if (p.includes("/git/refs/heads/")) return json(200, {});
      return json(404, {});
    };
    try {
      const pendingBefore = A().draft.pending.slice();
      act("publish");
      check("AD-10a", $('input[name="pub-st"][value="published"]') && !$('input[name="pub-st"][value="published"]').disabled, "publish allowed without errors");
      $('input[name="pub-st"][value="published"]').click();
      $("#pub-token").value = "test-token-for-mock";
      $("#pub-go").click();
      await until(() => $("#pub-go").textContent.includes("Saqlandi") || $("#pub-go").textContent.includes("Qayta"), 8000);
      const trees = calls.filter((c) => c.p.endsWith("/git/trees"));
      const paths = trees.map((t) => t.body.tree.map((x) => x.path).sort());
      const media = pendingBefore[0];
      check("AD-10", trees.length === 2 && JSON.stringify(paths[0]) === JSON.stringify([`app/packs/${ID}/${media}`, `app/packs/${ID}/pack.json`, "app/packs/index.json"].sort()) && JSON.stringify(paths[1]) === JSON.stringify([`packs/${ID}/${media}`, `packs/${ID}/pack.json`, "packs/index.json"].sort()), JSON.stringify(paths));
      check("AD-10b", trees[0].body.base_tree === "tree-head-main" && trees[1].body.base_tree === "tree-head-gh-pages", "base trees");
      const refs = calls.filter((c) => c.m === "PATCH");
      check("AD-10c", refs.length === 2 && refs[0].p.endsWith("/git/refs/heads/main") && refs[1].p.endsWith("/git/refs/heads/gh-pages"), JSON.stringify(refs.map((r) => r.p)));
      const blobs = calls.filter((c) => c.p.endsWith("/git/blobs"));
      const dec = (s) => new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)));
      const packJson = blobs.map((b) => { try { return JSON.parse(dec(b.body.content)); } catch { return null; } }).find((x) => x && x.id === ID);
      const idx = blobs.map((b) => { try { return JSON.parse(dec(b.body.content)); } catch { return null; } }).filter((x) => x && Array.isArray(x.packs));
      check("AD-10d", packJson && packJson.status === "published" && packJson.publishedAt && idx.length === 2 && idx.every((i) => i.packs.some((e) => e.id === ID && e.status === "published") && i.packs.some((e) => e.id === "klassik")), "pack/index content");
      check("AD-10e", blobs.length === 1 + 1 + 2, `blobs ${blobs.length} (media once, pack once, index per branch)`);
      check("AD-10f", calls.every((c) => c.auth === "Bearer test-token-for-mock"), "auth");
      check("AD-10g", A().draft.pending.length === 0 && !(await mediaStore.get(`${ID}/${media}`)) && !localStorage.getItem(`uzquiz.admin.draft.${ID}`) && !localStorage.getItem("uzquiz.admin.token"), "cleanup");
      $('[data-m="close"]').click();
      // 401
      window.fetch = async (url, o) => (String(url).startsWith("https://api.github.com") ? new Response("{}", { status: 401 }) : real(url, o));
      act("tab", '[data-i="0"]');
      type('[data-path="rounds.0.title"]', "Birinchi raund!");
      act("publish"); $('input[name="pub-st"][value="draft"]').click(); $("#pub-go").click();
      await until(() => $("#pub-go").textContent.includes("Qayta"), 4000);
      check("AD-11", $("#pub-log").innerText.includes("Token noto'g'ri") && !$("#pub-go").disabled, $("#pub-log").innerText);
      $('[data-m="close"]').click();
    } finally {
      window.fetch = real;
      sessionStorage.removeItem("uzquiz.admin.token");
    }
  },

  async duplicate() {
    await A().openEditor("diqqat");
    await until(() => A().draft && A().draft.pack.id === "diqqat");
    act("duplicatePack");
    type("#dup-id", "diqqat-nusxa");
    $('[data-m="ok"]').click();
    await until(() => A().draft.pack.id === "diqqat-nusxa", 8000);
    const d = A().draft;
    const files = P.mediaFiles(d.pack);
    const stored = await Promise.all(files.map((f) => mediaStore.get(`diqqat-nusxa/${f}`)));
    check("AD-12", d.pack.status === "draft" && d.pack.title.includes("nusxa") && files.length === 7 && stored.every(Boolean) && d.pending.length === 7, `${files.length} files, ${stored.filter(Boolean).length} stored`);
  },

  async discard() {
    act("tab", '[data-i="pack"]');
    act("discard");
    $('[data-m="yes"]').click();
    await until(() => $(".pack-rows"), 4000);
    await wait(200);
    const keys = await mediaStore.keys();
    check("AD-14", !$('[data-id="diqqat-nusxa"]') && !localStorage.getItem("uzquiz.admin.draft.diqqat-nusxa") && !keys.some((k) => k.startsWith("diqqat-nusxa/")), "new draft discarded with its media");
  },
  // 2.1: javobni tekshirish qoidalari (Rasminka)
  async rules() {
    localStorage.removeItem("uzquiz.admin.draft.klassik");
    await until(() => $(".pack-rows"));
    $('[data-id="klassik"]').click();
    await until(() => $('.tab[data-i="0"]'), 4000);
    act("tab", '[data-i="0"]');
    const box = await until(() => $("#q-0-3 .ans-ed"));
    check("AD-20", box && box.open && box.querySelector('[data-path$=".partial"]').value === "Xorazm" && box.querySelector('select[data-path$=".hint"]').value === "none", "fields filled from pack");
    const t = box.querySelector(".try-ans"), res = () => $("#try-0-3").className;
    type(t, "Хива"); const a = res();
    type(t, "Xorazm"); const b = res();
    type(t, "Buxoro"); const c = res();
    check("AD-21", a.includes("ok") && b.includes("partial") && c.includes("no"), [a, b, c].join(" / "));
    type(box.querySelector('[data-path$=".partial"]'), "Xorazm, Xiva");
    check("AD-22", errCount() === 1 && $("#q-0-3 .msgs").innerText.includes("qisman javob bo'la olmaydi"), $("#q-0-3 .msgs").innerText);
    type(box.querySelector('[data-path$=".partial"]'), "Xorazm");
    choose(box.querySelector('select[data-path$=".hint"]'), "count");
    box.querySelector('[data-path$=".exact"]').click();
    const q = A().draft.pack.rounds[0].questions[3];
    check("AD-23", errCount() === 0 && q.hint === "count" && q.exact === true && q.partial.join() === "Xorazm", JSON.stringify(q.partial));
    act("tab", '[data-i="pack"]'); act("discard"); $('[data-m="yes"]').click();
    await until(() => $(".pack-rows"), 4000);
    check("AD-24", !localStorage.getItem("uzquiz.admin.draft.klassik"), "draft discarded");
  },
};

export async function run(name) {
  out = [];
  try { await suites[name](); } catch (e) { out.push({ id: name, ok: false, detail: "EXCEPTION: " + e.message + " " + (e.stack || "").split("\n")[1] }); }
  return out.map((r) => `${r.ok ? "PASS" : "FAIL"} ${r.id}${r.detail ? " — " + r.detail : ""}`).join("\n");
}
