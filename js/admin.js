// Uzquiz 2.0 — paketlar muharriri: paketlar ro'yxati, paket/raund/savol tahriri, media yuklash,
// tekshiruv, o'yinda sinash va GitHub'ga nashr qilish (bitta commit: paket + media + katalog).
import * as L from "./logic.js";
import * as P from "./pack.js";
import { mediaStore } from "./mediastore.js";

const KEYS = { draft: (id) => `uzquiz.admin.draft.${id}`, repo: "uzquiz.admin.repo", token: "uzquiz.admin.token" };
const DEFAULT_REPO = { owner: "alokhon99", repo: "uzquiz", targets: [{ branch: "main", prefix: "app/" }, { branch: "gh-pages", prefix: "" }] };
const STATUS = { draft: "Qoralama", review: "Ko'rib chiqishda", published: "Nashr qilingan", archived: "Arxiv" };
const LETTERS = "ABCDEF";

const root = document.getElementById("admin");
const modalRoot = document.getElementById("modal-root");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const clone = (x) => JSON.parse(JSON.stringify(x));

let index = [];          // saytdagi katalog (barcha holatlar)
let live = null;         // saytdagi paket (tahrir boshlanganda)
let draft = null;        // { pack, pending: [src], savedAt }
let tab = "pack";        // "pack" | raund indeksi
let check = { errors: [], warnings: [] };
const previewUrls = new Map();

/* ---------- Saqlash ---------- */
const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch { /* e'tiborsiz */ } },
  keys() { try { return Object.keys(localStorage); } catch { return []; } },
};
const repoCfg = () => { const c = ls.get(KEYS.repo, null); return c && c.owner && c.repo ? { ...clone(DEFAULT_REPO), owner: c.owner, repo: c.repo } : clone(DEFAULT_REPO); };
const getToken = () => { try { return sessionStorage.getItem(KEYS.token) || localStorage.getItem(KEYS.token) || ""; } catch { return ""; } };
function setToken(t, remember) { try { sessionStorage.setItem(KEYS.token, t); if (remember) localStorage.setItem(KEYS.token, t); else localStorage.removeItem(KEYS.token); } catch { /* */ } }
function forgetToken() { try { sessionStorage.removeItem(KEYS.token); localStorage.removeItem(KEYS.token); } catch { /* */ } }
const localDraftIds = () => ls.keys().filter((k) => k.startsWith("uzquiz.admin.draft.")).map((k) => k.slice("uzquiz.admin.draft.".length));
const isDirty = () => !!draft && (!live || P.serializePack(draft.pack) !== P.serializePack(live) || draft.pending.length > 0);
function saveDraft() {
  if (!draft) return;
  if (isDirty()) { draft.savedAt = Date.now(); if (!ls.set(KEYS.draft(draft.pack.id), draft)) toast("⚠️ Qoralamani saqlab bo'lmadi (xotira to'la)"); }
  else ls.del(KEYS.draft(draft.pack.id));
}

/* ---------- Yo'l bo'yicha qiymat (data-path="rounds.0.questions.2.text") ---------- */
function getAt(obj, path) { return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj); }
function setAt(obj, path, val) {
  const ks = path.split("."); const last = ks.pop();
  const parent = ks.reduce((o, k) => o[k], obj);
  if (val === undefined) delete parent[last]; else parent[last] = val;
}

/* ---------- Toast va modal ---------- */
let toastTimer;
function toast(msg) { const t = document.getElementById("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 3000); }
function openModal(html, onClick) {
  modalRoot.innerHTML = `<div class="modal-backdrop" data-bd><div class="modal wide" role="dialog" aria-modal="true">${html}</div></div>`;
  const bd = modalRoot.firstElementChild;
  bd.addEventListener("click", (e) => { if (e.target === bd && !bd.hasAttribute("data-busy")) return closeModal(); const b = e.target.closest("[data-m]"); if (b) onClick(b.dataset.m, b); });
  bd.querySelector("input, button")?.focus();
}
function closeModal() { modalRoot.innerHTML = ""; }
function confirmBox(title, text, yes, onYes, danger = true) {
  openModal(`<div class="e">⚠️</div><h3>${esc(title)}</h3><p class="center note">${esc(text)}</p>
    <button class="btn ${danger ? "btn-danger" : "btn-primary"}" data-m="yes">${esc(yes)}</button><button class="btn btn-ghost" data-m="no">Bekor qilish</button>`,
    (m) => { closeModal(); if (m === "yes") onYes(); });
}
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modalRoot.firstElementChild && !modalRoot.querySelector("[data-busy]")) closeModal(); });

/* ---------- Ma'lumot ---------- */
async function fetchJSON(url) { const r = await fetch(url, { cache: "no-cache" }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }
async function loadIndex() { try { const i = await fetchJSON(`packs/index.json?v=${Date.now()}`); index = Array.isArray(i.packs) ? i.packs : []; } catch { index = []; } }
async function mediaPreviewUrl(packId, src) {
  if (!src) return "";
  const key = `${packId}/${src}`;
  if (previewUrls.has(key)) return previewUrls.get(key);
  try { const b = await mediaStore.get(key); if (b) { const u = URL.createObjectURL(b); previewUrls.set(key, u); return u; } } catch { /* */ }
  return `packs/${packId}/${src}`;
}

/* ================= Paketlar ro'yxati ================= */
async function showList() {
  draft = null; live = null; tab = "pack";
  history.replaceState(null, "", location.pathname);
  await loadIndex();
  const locals = localDraftIds();
  const rows = [...index.map((e) => ({ ...e, local: locals.includes(e.id) })), ...locals.filter((id) => !index.some((e) => e.id === id)).map((id) => {
    const d = ls.get(KEYS.draft(id), null);
    return d && d.pack ? { ...P.catalogueEntry(d.pack), local: true, onlyLocal: true } : null;
  }).filter(Boolean)];
  root.innerHTML = `
    <header class="a-head">
      <div class="brand"><div class="logo-mini" aria-hidden="true">Uz</div><div><h1>Paketlar muharriri</h1><small>Uzquiz 2.0 · ${rows.length} ta paket</small></div></div>
      <a class="btn btn-secondary" href="./" target="_blank" rel="noopener">🎮 O'yin</a>
      <button class="btn btn-primary" data-act="newPack">＋ Yangi paket</button>
    </header>
    <div class="pack-rows">
      ${rows.length ? rows.map((p) => `
        <button class="card prow" data-act="edit" data-id="${esc(p.id)}">
          ${coverThumb(p)}
          <span class="prow-body"><b>${esc(p.title || "(nomsiz)")}</b>
            <small>${esc(p.id)} · ${p.roundCount} raund · ${p.questionCount} savol ${p.mediaTypes.map((t) => ({ image: "🖼️", audio: "🎵", video: "🎬" })[t]).join("")}</small></span>
          <span class="pill st-${esc(p.status)}">${esc(STATUS[p.status] || p.status)}</span>
          ${p.local ? `<span class="pill dirty">${p.onlyLocal ? "Faqat shu qurilmada" : "✎ Saqlanmagan"}</span>` : ""}
        </button>`).join("") : `<div class="card empty">Hozircha paket yo'q. «＋ Yangi paket» tugmasini bosing.</div>`}
    </div>
    <p class="note center">Paketlar GitHub'dagi <code>${esc(repoCfg().owner)}/${esc(repoCfg().repo)}</code> repozitoriyasida saqlanadi. O'zgarishlar avval shu brauzerda qoralama sifatida saqlanadi.</p>`;
}
function coverThumb(p) {
  const c = p.cover || {};
  if (c.type === "image" && c.src) return `<span class="cover sm"><img src="packs/${esc(p.id)}/${esc(c.src)}" alt="" onerror="this.remove()" /></span>`;
  return `<span class="cover sm"><span>${esc(c.value || "❓")}</span></span>`;
}

function newPackDialog() {
  openModal(`
    <div class="e">📦</div><h3>Yangi paket</h3>
    <label class="f"><span>Paket nomi</span><input class="input" id="np-title" maxlength="60" placeholder="masalan: 90-yillar estradasi" /></label>
    <label class="f"><span>ID (havolada ishlatiladi, keyin o'zgartirib bo'lmaydi)</span><input class="input" id="np-id" maxlength="40" placeholder="90-yillar-estradasi" /></label>
    <p class="note" id="np-err"></p>
    <button class="btn btn-primary" data-m="ok">Yaratish</button><button class="btn btn-ghost" data-m="no">Bekor qilish</button>`, (m) => {
    if (m === "no") return closeModal();
    const title = document.getElementById("np-title").value.trim();
    const id = document.getElementById("np-id").value.trim();
    const err = document.getElementById("np-err");
    if (!title) { err.textContent = "⛔ Nom kiriting"; return; }
    if (!/^[a-z0-9-]{2,40}$/.test(id)) { err.textContent = "⛔ ID: 2–40 ta kichik lotin harfi, raqam yoki «-»"; return; }
    if (index.some((e) => e.id === id) || localDraftIds().includes(id)) { err.textContent = "⛔ Bu ID band"; return; }
    closeModal();
    const pack = P.blankPack(id);
    pack.title = title;
    live = null;
    draft = { pack, pending: [], savedAt: Date.now() };
    saveDraft();
    showEditor();
  });
  const t = document.getElementById("np-title"), i = document.getElementById("np-id");
  t.addEventListener("input", () => { if (!i.dataset.touched) i.value = slug(t.value); });
  i.addEventListener("input", () => (i.dataset.touched = "1"));
}
function slug(s) {
  const map = { "o'": "o", "g'": "g", sh: "sh", ch: "ch", "ʻ": "", "’": "", "'": "" };
  return L.normalize(s).replace(/o'|g'|ʻ|’|'/g, (m) => map[m] ?? "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

async function openEditor(id) {
  let livePack = null;
  if (index.some((e) => e.id === id)) { try { livePack = await fetchJSON(`packs/${id}/pack.json?v=${Date.now()}`); } catch { /* faqat lokal */ } }
  live = livePack;
  const d = ls.get(KEYS.draft(id), null);
  if (d && d.pack && d.pack.id === id) draft = { pack: d.pack, pending: Array.isArray(d.pending) ? d.pending : [], savedAt: d.savedAt };
  else if (livePack) draft = { pack: clone(livePack), pending: [], savedAt: null };
  else return toast("Paketni ochib bo'lmadi");
  tab = "pack";
  showEditor();
  if (d && livePack && isDirty()) toast("Saqlangan qoralama tiklandi");
}

/* ================= Paket muharriri ================= */
function showEditor() {
  history.replaceState(null, "", `#${draft.pack.id}`);
  const p = draft.pack;
  const accent = typeof tab === "number" ? p.rounds[tab]?.color : "#7C5CFF";
  root.style.setProperty("--accent", accent || "#7C5CFF");
  root.innerHTML = `
    <header class="a-head">
      <button class="icon-btn" data-act="list" aria-label="Paketlar ro'yxatiga">←</button>
      <div class="brand"><div><h1 id="ed-title">${esc(p.title || "(nomsiz)")}</h1><small>${esc(p.id)} · <span class="pill st-${esc(p.status)}" style="padding:2px 8px">${esc(STATUS[p.status])}</span></small></div></div>
    </header>
    <div class="status-bar" id="status"></div>
    <nav class="tabs" role="tablist">
      <button class="tab" role="tab" aria-selected="${tab === "pack"}" data-act="tab" data-i="pack">📦 Paket<span class="badge" id="badge-pack" hidden></span></button>
      ${p.rounds.map((r, i) => `<button class="tab" role="tab" aria-selected="${tab === i}" data-act="tab" data-i="${i}" style="--accent:${esc(r.color)}"><span aria-hidden="true">${esc(r.icon)}</span>${i + 1}. ${esc(r.title)}<span class="badge" id="badge-${i}" hidden></span></button>`).join("")}
      ${p.rounds.length < P.LIMITS.rounds[1] ? `<button class="tab add" data-act="addRound">＋ Raund</button>` : ""}
    </nav>
    ${tab === "pack" ? packPanel(p) : roundPanel(p, tab)}
    <div class="publish-bar"><div class="inner">
      <div class="summary" id="summary"></div>
      <button class="btn btn-secondary" data-act="preview">▶ Sinash</button>
      <button class="btn btn-primary" data-act="publish" id="publish-btn">🚀 Saqlash</button>
    </div></div>`;
  hydratePreviews();
  refresh();
}

function packPanel(p) {
  return `
    <section class="card round-card">
      <h3>Paket sozlamalari</h3>
      <div class="grid2">
        <label class="f"><span>Nomi</span><input class="input" data-path="title" value="${esc(p.title)}" maxlength="60" /></label>
        <label class="f"><span>Toifa</span><select class="input" data-path="category">${P.CATEGORIES.map((c) => `<option value="${c.id}" ${p.category === c.id ? "selected" : ""}>${c.icon} ${esc(c.title)}</option>`).join("")}</select></label>
      </div>
      <label class="f" style="margin-top:12px"><span>Tavsif (katalog va paket sahifasida)</span><textarea class="input" rows="3" data-path="description" maxlength="300">${esc(p.description)}</textarea></label>
      <div class="grid3" style="margin-top:12px">
        <label class="f"><span>Yosh chegarasi</span><select class="input" data-path="ageRating">${P.AGE_RATINGS.map((a) => `<option ${p.ageRating === a ? "selected" : ""}>${a}</option>`).join("")}</select></label>
        <label class="f"><span>Narx</span><input class="input" value="Bepul (2.0-α)" disabled /></label>
        <label class="f"><span>Holat</span><input class="input" value="${esc(STATUS[p.status])}" disabled /></label>
      </div>
      <div class="grid2" style="margin-top:12px">
        <label class="check"><input type="checkbox" data-path="settings.speedBonus" data-kind="bool" ${p.settings?.speedBonus !== false ? "checked" : ""} /> Tezlik bonusi (+5 gacha)</label>
        <label class="check"><input type="checkbox" data-path="settings.showCorrect" data-kind="bool" ${p.settings?.showCorrect !== false ? "checked" : ""} /> Xato javobdan keyin to'g'ri javobni ko'rsatish</label>
      </div>
      <div class="msgs" id="msgs-pack" style="margin-top:12px"></div>
    </section>
    <section class="card round-card">
      <h3>Muqova</h3>
      ${mediaEditor(p.cover, "cover", { allowEmoji: true, allowNone: false, types: ["image"] })}
    </section>
    <section class="card round-card">
      <h3>Xavfli amallar</h3>
      <div class="btn-row">
        <button class="btn btn-secondary" data-act="duplicatePack">📄 Nusxa olish</button>
        <button class="btn btn-danger" data-act="discard" ${isDirty() ? "" : "disabled"}>↩️ Qoralamani bekor qilish</button>
      </div>
    </section>`;
}

function roundPanel(p, ri) {
  const r = p.rounds[ri];
  const base = `rounds.${ri}`;
  return `
    <section class="card round-card">
      <h3>${ri + 1}-raund</h3>
      <div class="grid4">
        <label class="f"><span>Belgi</span><input class="input big-emoji" data-path="${base}.icon" value="${esc(r.icon)}" maxlength="8" /></label>
        <label class="f"><span>Nomi</span><input class="input" data-path="${base}.title" value="${esc(r.title)}" maxlength="40" /></label>
        <label class="f"><span>Vaqt (s)</span><input class="input" type="number" min="5" max="120" data-kind="int" data-path="${base}.timeLimit" value="${esc(r.timeLimit)}" /></label>
        <label class="f"><span>Rang</span><input class="input" type="color" data-path="${base}.color" value="${esc(r.color || "#7C5CFF")}" /></label>
      </div>
      <div class="grid2" style="margin-top:12px">
        <label class="f"><span>Raund turi</span><select class="input" data-act-change="kind" data-path="${base}.kind">${Object.entries(P.ROUND_KINDS).map(([k, t]) => `<option value="${k}" ${r.kind === k ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <label class="f"><span>To'g'ri javob uchun ochko</span><input class="input" type="number" min="1" max="100" data-kind="int" data-path="${base}.points" value="${esc(r.points ?? 10)}" /></label>
      </div>
      <label class="f" style="margin-top:12px"><span>Tavsif (raund boshida ko'rsatiladi)</span><textarea class="input" rows="2" data-path="${base}.description">${esc(r.description)}</textarea></label>
      ${r.kind === "theme" ? `<label class="f" style="margin-top:12px"><span>Yashirin mavzu (oxirgi savol javobi bilan bir xil)</span><input class="input" data-path="${base}.hiddenTheme" value="${esc(r.hiddenTheme)}" /></label>` : ""}
      ${r.kind === "chain" ? `<p class="note">🔗 Har bir keyingi javob oldingi javobning oxirgi harfi bilan boshlanishi kerak. Barcha savollar yozma javobli.</p>` : ""}
      <div class="msgs" id="msgs-r${ri}" style="margin-top:12px"></div>
      <div class="btn-row" style="margin-top:12px">
        <button class="btn btn-secondary" data-act="moveRound" data-dir="-1" ${ri === 0 ? "disabled" : ""}>← Avvalga</button>
        <button class="btn btn-secondary" data-act="moveRound" data-dir="1" ${ri === p.rounds.length - 1 ? "disabled" : ""}>Keyinga →</button>
        <button class="btn btn-danger" data-act="delRound" ${p.rounds.length <= 1 ? "disabled" : ""}>🗑️ Raundni o'chirish</button>
      </div>
    </section>
    <div class="section-title">Savollar (${r.questions.length})</div>
    ${r.questions.map((q, qi) => questionCard(r, ri, q, qi)).join("")}
    ${r.questions.length < P.LIMITS.questions[1] ? `
      <div class="add-q">
        ${r.kind === "chain" ? `<button class="btn btn-secondary" data-act="addQ" data-type="text">＋ Savol qo'shish</button>` : `
        <button class="btn btn-secondary" data-act="addQ" data-type="choice">＋ Variantli</button>
        <button class="btn btn-secondary" data-act="addQ" data-type="truefalse">＋ Ha / Yo'q</button>
        <button class="btn btn-secondary" data-act="addQ" data-type="text">＋ Yozma</button>`}
      </div>` : ""}`;
}

function questionCard(r, ri, q, qi) {
  const base = `rounds.${ri}.questions.${qi}`;
  const n = r.questions.length;
  const lockLast = r.kind === "theme";
  const canUp = qi > 0 && !(lockLast && qi === n - 1);
  const canDown = qi < n - 1 && !(lockLast && qi >= n - 2);
  let answer = "";
  if (q.type === "choice") {
    answer = `<div class="f"><span>Javob variantlari (2–6) — to'g'risini harf bilan belgilang</span>
      ${q.options.map((o, oi) => `
        <div class="opt-row ${q.answer === oi ? "correct" : ""}">
          <label class="radio" title="To'g'ri javob">${LETTERS[oi]}<input type="radio" name="c-${ri}-${qi}" data-path="${base}.answer" data-kind="int" value="${oi}" ${q.answer === oi ? "checked" : ""} aria-label="${LETTERS[oi]} — to'g'ri" /></label>
          <input class="input" data-path="${base}.options.${oi}" value="${esc(o)}" aria-label="${LETTERS[oi]} varianti" />
          <button class="icon-btn" data-act="delOpt" data-path="${base}" data-i="${oi}" aria-label="Variantni o'chirish" ${q.options.length <= 2 ? "disabled" : ""}>✕</button>
        </div>`).join("")}
      ${q.options.length < 6 ? `<button class="link-btn" data-act="addOpt" data-path="${base}">＋ Variant qo'shish</button>` : ""}</div>`;
  } else if (q.type === "truefalse") {
    answer = `<div class="f"><span>To'g'ri javob</span><div class="btn-row">
      <label class="check tf"><input type="radio" name="tf-${ri}-${qi}" data-path="${base}.answer" data-kind="bool" value="true" ${q.answer === true ? "checked" : ""} /> ✓ Ha, to'g'ri</label>
      <label class="check tf"><input type="radio" name="tf-${ri}-${qi}" data-path="${base}.answer" data-kind="bool" value="false" ${q.answer === false ? "checked" : ""} /> ✕ Yo'q, noto'g'ri</label></div></div>`;
  } else {
    answer = `<div class="grid2">
      <label class="f"><span>To'g'ri javob</span><input class="input" data-path="${base}.answer" value="${esc(q.answer)}" /></label>
      <label class="f"><span>Muqobil javoblar (vergul bilan)</span><input class="input" data-path="${base}.alts" data-kind="list" value="${esc((q.alts || []).join(", "))}" /></label></div>`;
  }
  const typeSel = r.kind === "chain" || q.final ? "" : `<select class="input mini" data-act-change="qtype" data-path="${base}.type" aria-label="Savol turi">${Object.entries(P.Q_TYPES).map(([k, t]) => `<option value="${k}" ${q.type === k ? "selected" : ""}>${t}</option>`).join("")}</select>`;
  return `
    <article class="card q-edit" id="q-${ri}-${qi}">
      <div class="q-top">
        <span class="q-num">${qi + 1}-savol</span>
        ${q.final ? `<span class="tag final">Yakuniy · ${q.points || 20} ochko</span>` : typeSel}
        <button class="icon-btn" data-act="moveQ" data-dir="-1" data-i="${qi}" aria-label="Yuqoriga" ${canUp ? "" : "disabled"}>↑</button>
        <button class="icon-btn" data-act="moveQ" data-dir="1" data-i="${qi}" aria-label="Pastga" ${canDown ? "" : "disabled"}>↓</button>
        <button class="icon-btn" data-act="delQ" data-i="${qi}" aria-label="Savolni o'chirish" ${n <= 1 || q.final ? "disabled" : ""}>🗑️</button>
      </div>
      <label class="f"><span>Savol matni</span><textarea class="input" rows="2" data-path="${base}.text">${esc(q.text)}</textarea></label>
      <details class="media-ed" ${q.media ? "open" : ""}><summary>📎 Savol mediasi ${q.media ? `· ${mediaLabel(q.media)}` : "(ixtiyoriy)"}</summary>
        ${mediaEditor(q.media, `${base}.media`, { allowEmoji: true, allowNone: true })}</details>
      ${answer}
      <details class="media-ed" ${q.reveal ? "open" : ""}><summary>✨ Javobdan keyingi media ${q.reveal ? `· ${mediaLabel(q.reveal)}` : "(ixtiyoriy)"}</summary>
        ${mediaEditor(q.reveal, `${base}.reveal`, { allowEmoji: false, allowNone: true })}</details>
      <label class="f"><span>Qiziqarli fakt (ixtiyoriy)</span><input class="input" data-path="${base}.fact" value="${esc(q.fact)}" /></label>
      ${r.kind === "chain" || q.type === "text" ? `<div class="hint-line" id="hint-${ri}-${qi}"></div>` : ""}
      <div class="msgs" id="msgs-${ri}-${qi}"></div>
    </article>`;
}
const mediaLabel = (m) => ({ emoji: "Emoji", image: "Rasm", audio: "Audio", video: "Video" })[m.type] || m.type;

function mediaEditor(m, path, { allowEmoji = true, allowNone = true, types = ["image", "audio", "video"] } = {}) {
  const kinds = [...(allowNone ? [["none", "Yo'q"]] : []), ...(allowEmoji ? [["emoji", "Emoji"]] : []), ...types.map((t) => [t, mediaLabel({ type: t })])];
  const cur = m ? m.type : "none";
  const isFile = m && ["image", "audio", "video"].includes(m.type);
  const lim = isFile ? P.MEDIA_LIMITS[m.type] : null;
  return `
    <div class="med" data-med="${path}">
      <div class="seg" role="group" aria-label="Media turi">
        ${kinds.map(([k, t]) => `<button class="seg-btn ${cur === k ? "on" : ""}" data-act="mediaKind" data-path="${path}" data-kind="${k}">${t}</button>`).join("")}
      </div>
      ${m && m.type === "emoji" ? `<label class="f"><span>Emoji</span><input class="input big-emoji" style="max-width:110px" data-path="${path}.value" value="${esc(m.value)}" maxlength="8" /></label>` : ""}
      ${isFile ? `
        <div class="med-file">
          <div class="med-prev" data-preview="${path}">${m.src ? "" : `<span class="note">Fayl tanlanmagan</span>`}</div>
          <div class="f" style="flex:1">
            <label class="btn btn-secondary file-btn">📁 ${m.src ? "Faylni almashtirish" : "Fayl tanlash"}
              <input type="file" accept="${lim.types.join(",")}" data-upload="${path}" data-type="${m.type}" hidden /></label>
            <small class="note">${m.type === "image" ? "JPG, PNG, WebP · 5 MB gacha · avtomatik WebP 1280 px" : m.type === "audio" ? "MP3, M4A, OGG, WAV · 60 s · 5 MB gacha" : "MP4, WebM · 60 s · 30 MB gacha"}</small>
            ${m.src ? `<small class="note">Fayl: <code>${esc(m.src)}</code>${draft.pending.includes(m.src) ? " · <b>hali nashr qilinmagan</b>" : ""}</small>` : ""}
          </div>
        </div>
        ${m.type !== "audio" ? `<label class="f"><span>Tavsif (alt matn) — ko'rmaydiganlar uchun, majburiy</span><input class="input" data-path="${path}.alt" value="${esc(m.alt)}" /></label>` : ""}
        ${m.type !== "image" ? `<div class="grid3">
          <label class="f"><span>Boshlanish (s)</span><input class="input" type="number" min="0" step="0.1" data-kind="num" data-path="${path}.start" value="${esc(m.start ?? "")}" placeholder="0" /></label>
          <label class="f"><span>Tugash (s)</span><input class="input" type="number" min="0" step="0.1" data-kind="num" data-path="${path}.end" value="${esc(m.end ?? "")}" placeholder="oxirigacha" /></label>
          <label class="f"><span>Qayta ijro</span><input class="input" type="number" min="0" max="5" data-kind="int" data-path="${path}.maxReplays" value="${esc(m.maxReplays ?? 1)}" /></label>
        </div>` : ""}
        <fieldset class="rights"><legend>Huquq ma'lumoti (majburiy)</legend>
          <div class="grid3">
            <label class="f"><span>Manba</span><input class="input" data-path="${path}.rights.source" value="${esc(m.rights?.source)}" placeholder="masalan: o'zimiz suratga oldik" /></label>
            <label class="f"><span>Litsenziya</span><select class="input" data-path="${path}.rights.licence"><option value="">— tanlang —</option>${Object.entries(P.LICENCES).map(([k, t]) => `<option value="${k}" ${m.rights?.licence === k ? "selected" : ""}>${t}</option>`).join("")}</select></label>
            <label class="f"><span>Huquq egasi</span><input class="input" data-path="${path}.rights.holder" value="${esc(m.rights?.holder)}" /></label>
          </div>
        </fieldset>` : ""}
    </div>`;
}

async function hydratePreviews() {
  for (const el of root.querySelectorAll("[data-preview]")) {
    const m = getAt(draft.pack, el.dataset.preview);
    if (!m || !m.src) continue;
    const url = await mediaPreviewUrl(draft.pack.id, m.src);
    if (!el.isConnected) return;
    el.innerHTML = m.type === "image" ? `<img src="${esc(url)}" alt="" />` : m.type === "audio" ? `<audio controls preload="metadata" src="${esc(url)}"></audio>` : `<video controls playsinline preload="metadata" src="${esc(url)}"></video>`;
  }
}

/* ---------- Tekshiruv natijalarini ko'rsatish (qayta chizmasdan) ---------- */
function refresh() {
  if (!draft) return;
  check = P.validatePack(draft.pack);
  const { errors, warnings } = check;
  const p = draft.pack;
  const html = (list, kind) => list.map((m) => `<div class="msg ${kind}">${kind === "e" ? "⛔" : "⚠️"} ${esc(m.msg)}</div>`).join("");
  const at = (r, q) => html(errors.filter((e) => e.r === r && e.q === q), "e") + html(warnings.filter((w) => w.r === r && w.q === q), "w");
  const bp = document.getElementById("badge-pack");
  if (bp) { const n = errors.filter((e) => e.r === null).length; bp.hidden = !n; bp.textContent = n; }
  p.rounds.forEach((_, i) => { const b = document.getElementById(`badge-${i}`); if (b) { const n = errors.filter((e) => e.r === i).length; b.hidden = !n; b.textContent = n; } });
  const mp = document.getElementById("msgs-pack"); if (mp) mp.innerHTML = at(null, null);
  if (typeof tab === "number") {
    const r = p.rounds[tab];
    const mr = document.getElementById(`msgs-r${tab}`); if (mr) mr.innerHTML = at(tab, null);
    r.questions.forEach((q, qi) => {
      const box = document.getElementById(`msgs-${tab}-${qi}`); if (box) box.innerHTML = at(tab, qi);
      document.getElementById(`q-${tab}-${qi}`)?.classList.toggle("has-err", errors.some((e) => e.r === tab && e.q === qi));
      const hint = document.getElementById(`hint-${tab}-${qi}`);
      if (hint) {
        const need = r.kind === "chain" ? (qi === 0 ? L.firstLetter(q.answer || "") : L.lastLetter(r.questions[qi - 1].answer || "")) : L.firstLetter(q.answer || "");
        hint.innerHTML = `O'yinchiga: «<b>${esc(L.capLetter(need))}</b>» harfi bilan boshlanadi · ${L.uzLetters(q.answer || "").length} ta harf${r.kind === "chain" && qi < r.questions.length - 1 ? `. Keyingi javob «<b>${esc(L.capLetter(L.lastLetter(q.answer || "")))}</b>» bilan boshlanishi kerak` : ""}.`;
      }
    });
  }
  const dirty = isDirty();
  const st = document.getElementById("status");
  if (st) st.innerHTML = `
    ${errors.length ? `<span class="pill err">⛔ ${errors.length} ta xato</span>` : `<span class="pill ok">✓ Xato yo'q</span>`}
    ${warnings.length ? `<span class="pill warn">⚠️ ${warnings.length} ta ogohlantirish</span>` : ""}
    ${dirty ? `<span class="pill dirty">✎ Saqlanmagan o'zgarishlar${draft.pending.length ? ` · ${draft.pending.length} ta yangi fayl` : ""}</span>` : `<span class="pill">${live ? "Saytdagi versiya bilan bir xil" : "Yangi paket"}</span>`}`;
  const sum = document.getElementById("summary");
  if (sum) sum.innerHTML = errors.length ? `Nashr qilish uchun <b>${errors.length} ta xato</b>ni tuzating (qoralama sifatida saqlash mumkin)` : dirty ? "O'zgarishlar saqlashga tayyor" : "O'zgarish yo'q";
  const pb = document.getElementById("publish-btn"); if (pb) pb.disabled = !dirty && !!live;
  const pv = root.querySelector('[data-act="preview"]'); if (pv) pv.disabled = !!errors.length;
  const t = document.getElementById("ed-title"); if (t) t.textContent = p.title || "(nomsiz)";
}

/* ---------- Tahrirlash ---------- */
function coerce(el) {
  const k = el.dataset.kind;
  if (k === "bool") return el.type === "checkbox" ? el.checked : el.value === "true";
  if (k === "int") return el.value === "" ? undefined : Math.trunc(Number(el.value));
  if (k === "num") return el.value === "" ? undefined : Number(el.value);
  if (k === "list") { const a = el.value.split(",").map((s) => s.trim()).filter(Boolean); return a.length ? a : undefined; }
  return el.value;
}
function onEdit(e) {
  const el = e.target;
  const path = el.dataset.path;
  if (!path || !draft) return;
  if (el.type === "radio" && !el.checked) return;
  if (path.endsWith(".rights.source") || path.endsWith(".rights.licence") || path.endsWith(".rights.holder")) {
    const mp = path.replace(/\.rights\.\w+$/, "");
    const m = getAt(draft.pack, mp); if (m && !m.rights) m.rights = { source: "", licence: "", holder: "" };
  }
  setAt(draft.pack, path, coerce(el));
  if (path.endsWith(".answer") && el.type === "radio") {
    el.closest(".f")?.querySelectorAll(".opt-row").forEach((row) => row.classList.toggle("correct", row.querySelector("input[type=radio]").checked));
  }
  if (el.dataset.actChange === "kind") return changeKind(path, el.value);
  if (el.dataset.actChange === "qtype") return changeQType(path, el.value);
  if (/^rounds\.\d+\.(color|title|icon)$/.test(path)) {
    const tb = root.querySelector(`.tab[data-i="${tab}"]`);
    const r = draft.pack.rounds[tab];
    if (tb) { tb.style.setProperty("--accent", r.color); tb.childNodes[1] && (tb.childNodes[1].textContent = r.icon); tb.childNodes[2] && (tb.childNodes[2].textContent = `${tab + 1}. ${r.title}`); }
    if (path.endsWith("color")) root.style.setProperty("--accent", r.color);
  }
  saveDraft();
  refresh();
}
root.addEventListener("input", onEdit);
root.addEventListener("change", (e) => {
  if (e.target.dataset.upload) return onUpload(e.target);
  if (e.target.tagName === "SELECT" || e.target.type === "radio" || e.target.type === "checkbox") onEdit(e);
});

function changeKind(path, kind) {
  const ri = Number(path.split(".")[1]);
  const r = draft.pack.rounds[ri];
  r.kind = kind;
  if (kind === "chain") r.questions = r.questions.map((q) => (q.type === "text" ? q : { ...P.blankQuestion("text"), text: q.text, media: q.media, fact: q.fact }));
  if (kind === "theme") {
    if (r.hiddenTheme === undefined) r.hiddenTheme = "";
    if (!r.questions.some((q) => q.final)) r.questions.push({ ...P.blankQuestion("text"), text: "Yuqoridagi javoblarni qaysi yashirin mavzu birlashtiradi?", final: true, timeLimit: 60, points: 20 });
  } else {
    delete r.hiddenTheme;
    r.questions.forEach((q) => { if (q.final) { delete q.final; delete q.points; delete q.timeLimit; } });
  }
  saveDraft(); showEditor();
}
function changeQType(path, type) {
  const qPath = path.replace(/\.type$/, "");
  const q = getAt(draft.pack, qPath);
  const fresh = P.blankQuestion(type);
  const keep = { text: q.text, media: q.media, reveal: q.reveal, fact: q.fact };
  Object.keys(q).forEach((k) => delete q[k]);
  Object.assign(q, fresh, Object.fromEntries(Object.entries(keep).filter(([, v]) => v !== undefined)));
  saveDraft(); showEditor();
}

/* ---------- Media yuklash ---------- */
async function sha8(buf) {
  const h = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(h)].slice(0, 6).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function probeDuration(file, type) {
  return new Promise((resolve) => {
    const el = document.createElement(type);
    const u = URL.createObjectURL(file);
    el.preload = "metadata";
    el.onloadedmetadata = () => { URL.revokeObjectURL(u); resolve(el.duration); };
    el.onerror = () => { URL.revokeObjectURL(u); resolve(NaN); };
    el.src = u;
  });
}
/** Rasmni 1280 px gacha kichraytirib WebP ga o'giradi. */
async function toWebp(file) {
  const bmp = await createImageBitmap(file);
  const max = P.MEDIA_LIMITS.image.maxSide;
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise((r) => c.toBlob(r, "image/webp", 0.85));
  return blob && blob.type === "image/webp" ? blob : new Promise((r) => c.toBlob(r, "image/jpeg", 0.85));
}
export async function processUpload(file, type) {
  const lim = P.MEDIA_LIMITS[type];
  if (!lim.types.includes(file.type)) throw new Error(`Bu fayl turi qo'llab-quvvatlanmaydi (${file.type || "noma'lum"})`);
  if (file.size > lim.maxBytes) throw new Error(`Fayl juda katta: ${(file.size / 1048576).toFixed(1)} MB (ruxsat: ${lim.maxBytes / 1048576} MB)`);
  let blob = file, ext = (file.name.split(".").pop() || "").toLowerCase(), duration = null;
  if (type === "image") { blob = await toWebp(file); ext = blob.type === "image/webp" ? "webp" : "jpg"; }
  else {
    duration = await probeDuration(file, type);
    if (!Number.isFinite(duration)) throw new Error("Faylni o'qib bo'lmadi — u buzilgan bo'lishi mumkin");
    if (duration > lim.maxSeconds + 0.5) throw new Error(`Juda uzun: ${duration.toFixed(0)} s (ruxsat: ${lim.maxSeconds} s). Qisqaroq qism tayyorlang.`);
    ext = { "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/aac": "m4a", "audio/ogg": "ogg", "video/mp4": "mp4", "video/webm": "webm", "audio/wav": "wav", "audio/x-wav": "wav", "audio/wave": "wav" }[file.type] || ext;
  }
  const hash = await sha8(await blob.arrayBuffer());
  return { blob, src: `media/${hash}.${ext}`, duration };
}
async function onUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const path = input.dataset.upload, type = input.dataset.type;
  const label = input.closest(".file-btn");
  label.classList.add("busy");
  try {
    const { blob, src } = await processUpload(file, type);
    await mediaStore.put(`${draft.pack.id}/${src}`, blob);
    const m = getAt(draft.pack, path);
    const old = m.src;
    m.src = src;
    if (!draft.pending.includes(src)) draft.pending.push(src);
    if (old && old !== src && draft.pending.includes(old) && !P.mediaFiles(draft.pack).includes(old)) {
      draft.pending = draft.pending.filter((x) => x !== old);
      mediaStore.del(`${draft.pack.id}/${old}`).catch(() => {});
    }
    if (type !== "image" && m.end == null) { /* trimming ixtiyoriy */ }
    saveDraft();
    showEditor();
    toast(`✓ Fayl yuklandi (${(blob.size / 1024).toFixed(0)} KB)`);
  } catch (e) {
    toast("⛔ " + e.message);
    label.classList.remove("busy");
    input.value = "";
  }
}
function setMediaKind(path, kind) {
  const cur = getAt(draft.pack, path);
  if (kind === "none") setAt(draft.pack, path, undefined);
  else if (kind === "emoji") setAt(draft.pack, path, { type: "emoji", value: cur && cur.type === "emoji" ? cur.value : "🙂" });
  else if (!cur || cur.type !== kind) setAt(draft.pack, path, { type: kind, src: "", ...(kind !== "audio" ? { alt: "" } : {}), ...(kind !== "image" ? { maxReplays: 1 } : {}), rights: { source: "", licence: "", holder: "" } });
  prunePending();
  saveDraft(); showEditor();
}
function prunePending() {
  const used = P.mediaFiles(draft.pack);
  for (const src of draft.pending.filter((s) => !used.includes(s))) mediaStore.del(`${draft.pack.id}/${src}`).catch(() => {});
  draft.pending = draft.pending.filter((s) => used.includes(s));
}

/* ---------- Tugmalar ---------- */
root.addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]");
  if (!b || b.disabled) return;
  const p = draft && draft.pack;
  const r = p && typeof tab === "number" ? p.rounds[tab] : null;
  const i = b.dataset.i !== undefined ? +b.dataset.i : null;
  switch (b.dataset.act) {
    case "newPack": return newPackDialog();
    case "edit": return openEditor(b.dataset.id);
    case "list":
      return showList();
    case "tab": tab = b.dataset.i === "pack" ? "pack" : +b.dataset.i; showEditor(); window.scrollTo({ top: 0 }); return;
    case "addRound":
      p.rounds.push(P.blankRound()); tab = p.rounds.length - 1; saveDraft(); return showEditor();
    case "moveRound": {
      const j = tab + +b.dataset.dir; [p.rounds[tab], p.rounds[j]] = [p.rounds[j], p.rounds[tab]]; tab = j; saveDraft(); return showEditor();
    }
    case "delRound":
      return confirmBox("Raund o'chirilsinmi?", `«${r.title}» va undagi ${r.questions.length} ta savol o'chiriladi.`, "Ha, o'chirish", () => { p.rounds.splice(tab, 1); tab = Math.max(0, tab - 1); prunePending(); saveDraft(); showEditor(); });
    case "addQ": {
      const q = P.blankQuestion(b.dataset.type);
      const at = r.kind === "theme" ? r.questions.length - 1 : r.questions.length;
      r.questions.splice(at, 0, q); saveDraft(); showEditor();
      document.getElementById(`q-${tab}-${at}`)?.scrollIntoView({ block: "center" });
      return;
    }
    case "moveQ": { const j = i + +b.dataset.dir; [r.questions[i], r.questions[j]] = [r.questions[j], r.questions[i]]; saveDraft(); showEditor(); document.getElementById(`q-${tab}-${j}`)?.scrollIntoView({ block: "center" }); return; }
    case "delQ":
      return confirmBox("Savol o'chirilsinmi?", r.questions[i].text || `${i + 1}-savol`, "Ha, o'chirish", () => { r.questions.splice(i, 1); prunePending(); saveDraft(); showEditor(); });
    case "addOpt": { const q = getAt(p, b.dataset.path); q.options.push(""); saveDraft(); return showEditor(); }
    case "delOpt": {
      const q = getAt(p, b.dataset.path);
      q.options.splice(i, 1);
      if (q.answer === i) q.answer = 0; else if (q.answer > i) q.answer -= 1;
      saveDraft(); return showEditor();
    }
    case "mediaKind": return setMediaKind(b.dataset.path, b.dataset.kind);
    case "duplicatePack": return duplicateDialog();
    case "discard":
      return confirmBox("Qoralama bekor qilinsinmi?", live ? "Barcha saqlanmagan o'zgarishlar o'chadi, saytdagi versiya qayta yuklanadi." : "Bu paket hali nashr qilinmagan — u butunlay o'chadi.", "Ha, bekor qilish", async () => {
        for (const src of draft.pending) await mediaStore.del(`${p.id}/${src}`).catch(() => {});
        ls.del(KEYS.draft(p.id));
        if (live) { draft = { pack: clone(live), pending: [] }; showEditor(); } else showList();
        toast("Qoralama bekor qilindi");
      });
    case "preview": return preview();
    case "publish": return publishDialog();
  }
});

function duplicateDialog() {
  openModal(`<div class="e">📄</div><h3>Paketdan nusxa</h3>
    <label class="f"><span>Yangi ID</span><input class="input" id="dup-id" value="${esc(draft.pack.id)}-2" maxlength="40" /></label><p class="note" id="dup-err"></p>
    <button class="btn btn-primary" data-m="ok">Nusxa yaratish</button><button class="btn btn-ghost" data-m="no">Bekor qilish</button>`, async (m) => {
    if (m === "no") return closeModal();
    const id = document.getElementById("dup-id").value.trim();
    if (!/^[a-z0-9-]{2,40}$/.test(id) || index.some((x) => x.id === id) || localDraftIds().includes(id)) { document.getElementById("dup-err").textContent = "⛔ ID noto'g'ri yoki band"; return; }
    closeModal();
    const pack = clone(draft.pack);
    pack.id = id; pack.title = `${pack.title} (nusxa)`; pack.status = "draft"; pack.publishedAt = null;
    // nusxada media fayllar yangi paket papkasiga ko'chiriladi
    const pending = [];
    for (const src of P.mediaFiles(pack)) {
      let blob = null;
      try { blob = await mediaStore.get(`${draft.pack.id}/${src}`); } catch { /* */ }
      if (!blob) { try { const res = await fetch(`packs/${draft.pack.id}/${src}`); if (res.ok) blob = await res.blob(); } catch { /* */ } }
      if (blob) { await mediaStore.put(`${id}/${src}`, blob); pending.push(src); }
    }
    live = null;
    draft = { pack, pending, savedAt: Date.now() };
    saveDraft(); tab = "pack"; showEditor(); toast("Nusxa yaratildi");
  });
}

function preview() {
  if (check.errors.length) return toast("Avval xatolarni tuzating");
  ls.set(KEYS.draft(draft.pack.id), { ...draft, savedAt: Date.now() });
  window.open(`./?preview=${encodeURIComponent(draft.pack.id)}&r=${typeof tab === "number" ? tab : 0}`, "_blank", "noopener");
}

/* ================= GitHub'ga yozish (bitta commit) ================= */
const b64 = (buf) => { const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf); let bin = ""; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(bin); };
const unb64 = (s) => new TextDecoder().decode(Uint8Array.from(atob(String(s).replace(/\s/g, "")), (c) => c.charCodeAt(0)));
const utf8 = (s) => new TextEncoder().encode(s);

async function gh(path, token, opts = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28", ...(opts.body ? { "Content-Type": "application/json" } : {}) },
  });
  let data = null;
  try { data = await res.json(); } catch { /* */ }
  if (!res.ok) {
    const msg = res.status === 401 ? "Token noto'g'ri yoki muddati tugagan"
      : res.status === 403 ? "Ruxsat yo'q — tokenga «Contents: Read and write» ruxsatini bering"
      : res.status === 404 ? "Repozitoriy topilmadi (yoki tokenda bu repozitoriyga ruxsat yo'q)"
      : res.status === 409 || res.status === 422 ? "Repozitoriy shu payt boshqa joyda o'zgardi — qayta urinib ko'ring"
      : `GitHub xatosi (${res.status})`;
    const err = new Error(msg); err.status = res.status; throw err;
  }
  return data;
}

/**
 * Paketni (pack.json + yangi media + yangilangan index.json) har bir branch'ga bitta commit bilan yozadi.
 * files: [{ path (paket papkasiga nisbiy emas — "packs/..." ), bytes: Uint8Array }]
 */
export async function publishPack({ token, cfg, pack, mediaBlobs, message, log }) {
  const { owner, repo, targets } = cfg;
  const api = `/repos/${owner}/${repo}`;
  log("GitHub bilan bog'lanilmoqda…");
  const info = await gh(api, token);
  if (info.permissions && info.permissions.push === false) throw new Error("Bu tokenda repozitoriyga yozish huquqi yo'q");
  log(`Repozitoriy: ${owner}/${repo}`, "ok");
  // Media bloblari bir marta yaratiladi va ikkala branch'da ishlatiladi
  const mediaShas = {};
  let k = 0;
  for (const [src, blob] of Object.entries(mediaBlobs)) {
    k++;
    log(`Fayl yuklanmoqda ${k}/${Object.keys(mediaBlobs).length}: ${src} (${(blob.size / 1024).toFixed(0)} KB)…`);
    const res = await gh(`${api}/git/blobs`, token, { method: "POST", body: JSON.stringify({ content: b64(await blob.arrayBuffer()), encoding: "base64" }) });
    mediaShas[src] = res.sha;
  }
  if (k) log(`${k} ta media fayl yuklandi`, "ok");
  const packText = P.serializePack(pack);
  const packBlob = await gh(`${api}/git/blobs`, token, { method: "POST", body: JSON.stringify({ content: b64(utf8(packText)), encoding: "base64" }) });
  const commits = [];
  for (const t of targets) {
    const ref = await gh(`${api}/git/ref/heads/${encodeURIComponent(t.branch)}`, token);
    const head = ref.object.sha;
    const commit = await gh(`${api}/git/commits/${head}`, token);
    // index.json: shu branch'dagi versiyani olib, paket yozuvini yangilaymiz
    let entries = [];
    try {
      const f = await gh(`${api}/contents/${t.prefix}packs/index.json?ref=${encodeURIComponent(t.branch)}`, token);
      const idx = JSON.parse(unb64(f.content));
      entries = Array.isArray(idx.packs) ? idx.packs : [];
    } catch (e) { if (e.status !== 404) throw e; }
    entries = entries.filter((x) => x.id !== pack.id).concat([P.catalogueEntry(pack)]);
    const idxBlob = await gh(`${api}/git/blobs`, token, { method: "POST", body: JSON.stringify({ content: b64(utf8(P.serializeIndex(entries))), encoding: "base64" }) });
    const tree = [
      { path: `${t.prefix}packs/${pack.id}/pack.json`, mode: "100644", type: "blob", sha: packBlob.sha },
      { path: `${t.prefix}packs/index.json`, mode: "100644", type: "blob", sha: idxBlob.sha },
      ...Object.entries(mediaShas).map(([src, sha]) => ({ path: `${t.prefix}packs/${pack.id}/${src}`, mode: "100644", type: "blob", sha })),
    ];
    const newTree = await gh(`${api}/git/trees`, token, { method: "POST", body: JSON.stringify({ base_tree: commit.tree.sha, tree }) });
    const c = await gh(`${api}/git/commits`, token, { method: "POST", body: JSON.stringify({ message, tree: newTree.sha, parents: [head] }) });
    await gh(`${api}/git/refs/heads/${encodeURIComponent(t.branch)}`, token, { method: "PATCH", body: JSON.stringify({ sha: c.sha }) });
    commits.push({ branch: t.branch, sha: c.sha, url: `https://github.com/${owner}/${repo}/commit/${c.sha}` });
    log(`${t.branch}: saqlandi`, "ok");
  }
  return commits;
}

function publishDialog() {
  const p = draft.pack;
  const cfg = repoCfg();
  const saved = getToken();
  const remembered = (() => { try { return !!localStorage.getItem(KEYS.token); } catch { return false; } })();
  const hasErr = check.errors.length > 0;
  const statusOpts = Object.entries(STATUS).map(([k, t]) => {
    const blocked = hasErr && (k === "published" || k === "review");
    return `<label class="check st"><input type="radio" name="pub-st" value="${k}" ${p.status === k && !blocked ? "checked" : ""} ${blocked ? "disabled" : ""} /> ${t}${blocked ? " — avval xatolarni tuzating" : ""}</label>`;
  }).join("");
  openModal(`
    <div class="e">🚀</div><h3>Paketni saqlash</h3>
    <p class="note center"><b>${esc(p.title)}</b> → <code>${esc(cfg.owner)}/${esc(cfg.repo)}</code>${draft.pending.length ? ` · ${draft.pending.length} ta yangi media fayl` : ""}</p>
    <div class="f"><span>Holat</span><div class="st-list">${statusOpts}</div>
      <small class="note">Faqat «Nashr qilingan» paketlar o'yinchilarga ko'rinadi. «Arxiv» — katalogdan yashiriladi.</small></div>
    <label class="f"><span>Izoh</span><input class="input" id="pub-msg" value="${esc(live ? "Paket yangilandi" : "Yangi paket")}: ${esc(p.title)}" maxlength="100" /></label>
    <label class="f"><span>GitHub token</span><input class="input" id="pub-token" type="password" autocomplete="off" spellcheck="false" placeholder="github_pat_…" value="${esc(saved)}" /></label>
    <label class="check"><input type="checkbox" id="pub-remember" ${remembered ? "checked" : ""} /> Shu qurilmada eslab qolish</label>
    <p class="note">Token: <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">fine-grained token</a> → faqat <b>${esc(cfg.repo)}</b> → <b>Contents — Read and write</b>. Token faqat shu brauzerda saqlanadi va faqat GitHub'ga yuboriladi.</p>
    <details class="repo"><summary>Repozitoriy sozlamalari</summary>
      <div class="grid2" style="margin-top:10px">
        <label class="f"><span>Egasi</span><input class="input" id="pub-owner" value="${esc(cfg.owner)}" /></label>
        <label class="f"><span>Repozitoriy</span><input class="input" id="pub-repo" value="${esc(cfg.repo)}" /></label>
      </div></details>
    <div class="log" id="pub-log"></div>
    <button class="btn btn-primary" data-m="go" id="pub-go">Saqlash</button>
    ${saved ? `<button class="btn btn-ghost" data-m="forget">Saqlangan tokenni o'chirish</button>` : ""}
    <button class="btn btn-ghost" data-m="close">Yopish</button>`, async (m, btn) => {
    if (m === "close") return closeModal();
    if (m === "forget") { forgetToken(); document.getElementById("pub-token").value = ""; btn.remove(); return toast("Token o'chirildi"); }
    if (m !== "go") return;
    const status = modalRoot.querySelector('input[name="pub-st"]:checked')?.value;
    const token = document.getElementById("pub-token").value.trim();
    const logEl = document.getElementById("pub-log");
    if (!status) { logEl.innerHTML = `<div class="bad">Holatni tanlang</div>`; return; }
    if (!token) { document.getElementById("pub-token").classList.add("shake"); return; }
    const newCfg = { ...cfg, owner: document.getElementById("pub-owner").value.trim(), repo: document.getElementById("pub-repo").value.trim() };
    ls.set(KEYS.repo, { owner: newCfg.owner, repo: newCfg.repo });
    setToken(token, document.getElementById("pub-remember").checked);
    const pack = clone(draft.pack);
    pack.status = status;
    if (status === "published" && !pack.publishedAt) pack.publishedAt = new Date().toISOString().slice(0, 10);
    btn.disabled = true; btn.textContent = "Saqlanmoqda…";
    modalRoot.firstElementChild.setAttribute("data-busy", "");
    logEl.innerHTML = "";
    const log = (text, state = "") => logEl.insertAdjacentHTML("beforeend", `<div class="${state}">${esc(text)}</div>`);
    try {
      const mediaBlobs = {};
      for (const src of draft.pending) {
        const blob = await mediaStore.get(`${pack.id}/${src}`);
        if (!blob) throw new Error(`Fayl topilmadi: ${src} — uni qayta yuklang`);
        mediaBlobs[src] = blob;
      }
      const commits = await publishPack({ token, cfg: newCfg, pack, mediaBlobs, message: `${document.getElementById("pub-msg").value.trim() || "Paket yangilandi"} (muharrir)`, log });
      for (const src of draft.pending) await mediaStore.del(`${pack.id}/${src}`).catch(() => {});
      draft = { pack, pending: [], savedAt: null };
      live = clone(pack);
      ls.del(KEYS.draft(pack.id));
      log(status === "published" ? "Tayyor! Sayt odatda 1–10 daqiqada yangilanadi." : "Saqlandi. O'yinchilar bu paketni hali ko'rmaydi.", "ok");
      commits.forEach((c) => logEl.insertAdjacentHTML("beforeend", `<div class="ok"><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.branch)} commit</a></div>`));
      btn.textContent = "✓ Saqlandi";
      modalRoot.firstElementChild.removeAttribute("data-busy");
      const close = modalRoot.querySelector('[data-m="close"]');
      if (close) close.addEventListener("click", () => showEditor(), { once: true });
    } catch (e) {
      log(e.message || String(e), "bad");
      btn.disabled = false; btn.textContent = "Qayta urinish";
      modalRoot.firstElementChild?.removeAttribute("data-busy");
    }
  });
}

/* ---------- Ishga tushirish ---------- */
window.__admin = { get draft() { return draft; }, get live() { return live; }, get check() { return check; }, publishPack, processUpload, openEditor, showList };
const startId = location.hash.slice(1);
if (startId && /^[a-z0-9-]{2,40}$/.test(startId)) loadIndex().then(() => openEditor(startId)); else showList();
