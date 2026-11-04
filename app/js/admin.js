// Uzquiz — savollar muharriri. Savollarni tahrirlash, tekshirish, o'yinda sinash va GitHub'ga nashr qilish.
import * as L from "./logic.js";

const KEYS = { draft: "uzquiz.admin.draft", repo: "uzquiz.admin.repo", token: "uzquiz.admin.token" };
const DEFAULT_REPO = { owner: "alokhon99", repo: "uzquiz", targets: [{ branch: "main", path: "app/js/questions.js" }, { branch: "gh-pages", path: "js/questions.js" }] };
const LETTERS = "ABCD";

const root = document.getElementById("admin");
const modalRoot = document.getElementById("modal-root");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const clone = (x) => JSON.parse(JSON.stringify(x));
const qType = (r, q) => q.type || r.type;

let live = null;   // nashr qilingan (saytdagi) savollar
let draft = null;  // tahrirlanayotgan nusxa
let cur = 0;       // tanlangan raund
let lastCheck = { errors: [], warnings: [] };

/* ---------- Saqlash ---------- */
const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* e'tiborsiz */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* e'tiborsiz */ } },
};
function repoCfg() {
  const c = ls.get(KEYS.repo, null);
  return c && c.owner && c.repo && Array.isArray(c.targets) && c.targets.length ? c : clone(DEFAULT_REPO);
}
function getToken() {
  try { return sessionStorage.getItem(KEYS.token) || localStorage.getItem(KEYS.token) || ""; } catch { return ""; }
}
function setToken(t, remember) {
  try {
    sessionStorage.setItem(KEYS.token, t);
    if (remember) localStorage.setItem(KEYS.token, t); else localStorage.removeItem(KEYS.token);
  } catch { /* e'tiborsiz */ }
}
function forgetToken() {
  try { sessionStorage.removeItem(KEYS.token); localStorage.removeItem(KEYS.token); } catch { /* e'tiborsiz */ }
}
function saveDraft() {
  if (isDirty()) ls.set(KEYS.draft, { rounds: draft, savedAt: Date.now() });
  else ls.del(KEYS.draft);
}

const fileText = (rounds) => L.serializeRounds(rounds);
const isDirty = () => fileText(draft) !== fileText(live);
function changedQuestions(ri) {
  const a = L.cleanRounds(draft)[ri], b = L.cleanRounds(live)[ri];
  return a.questions.map((q, i) => JSON.stringify(q) !== JSON.stringify(b && b.questions[i]));
}
function changedCount() {
  let n = 0;
  draft.forEach((r, ri) => {
    n += changedQuestions(ri).filter(Boolean).length;
    const { questions: _a, ...ra } = L.cleanRounds(draft)[ri];
    const { questions: _b, ...rb } = L.cleanRounds(live)[ri];
    if (JSON.stringify(ra) !== JSON.stringify(rb)) n += 1;
  });
  return n;
}

/* ---------- Toast va modal ---------- */
let toastTimer;
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
}
function openModal(html, onClick) {
  modalRoot.innerHTML = `<div class="modal-backdrop" data-bd><div class="modal wide" role="dialog" aria-modal="true">${html}</div></div>`;
  const bd = modalRoot.firstElementChild;
  bd.addEventListener("click", (e) => {
    if (e.target === bd) return closeModal();
    const b = e.target.closest("[data-m]");
    if (b) onClick(b.dataset.m, b);
  });
}
function closeModal() { modalRoot.innerHTML = ""; }
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalRoot.firstElementChild && !modalRoot.querySelector("[data-busy]")) closeModal();
});

/* ---------- Chizish ---------- */
function render() {
  const r = draft[cur];
  root.style.setProperty("--accent", r.color || "var(--primary)");
  root.innerHTML = `
    <header class="a-head">
      <div class="brand"><div class="logo-mini" aria-hidden="true">Uz</div>
        <div><h1>Savollar muharriri</h1><small>Uzquiz · 6 raund × 7 savol</small></div></div>
      <a class="btn btn-secondary" href="./" target="_blank" rel="noopener">🎮 O'yinni ochish</a>
    </header>
    <div class="status-bar" id="status"></div>
    <nav class="tabs" role="tablist" aria-label="Raundlar">
      ${draft.map((x, i) => `<button class="tab" role="tab" aria-selected="${i === cur}" data-act="tab" data-i="${i}" style="--accent:${esc(x.color)}">
        <span aria-hidden="true">${esc(x.icon)}</span>${i + 1}. ${esc(x.title)}<span class="badge" id="badge-${i}" hidden></span></button>`).join("")}
    </nav>
    ${roundCard(r)}
    <div class="section-title">Savollar</div>
    ${r.questions.map((q, qi) => questionCard(r, q, qi)).join("")}
    <div class="publish-bar"><div class="inner">
      <div class="summary" id="summary"></div>
      <button class="btn btn-secondary" data-act="preview">▶ O'yinda sinash</button>
      <button class="btn btn-primary" data-act="publish" id="publish-btn">🚀 Nashr qilish</button>
    </div></div>`;
  refresh();
}

function roundCard(r) {
  return `
    <section class="card round-card" aria-labelledby="round-h">
      <h3 id="round-h">${cur + 1}-raund sozlamalari ${r.id === L.CHAIN_ROUND_ID ? '<span class="tag">So\'z zanjiri</span>' : ""}</h3>
      <div class="grid4">
        <label class="f"><span>Belgi</span><input class="input big-emoji" data-rf="icon" value="${esc(r.icon)}" maxlength="8" /></label>
        <label class="f"><span>Raund nomi</span><input class="input" data-rf="title" value="${esc(r.title)}" maxlength="40" /></label>
        <label class="f"><span>Vaqt (soniya)</span><input class="input" type="number" min="5" max="120" step="1" data-rf="timeLimit" value="${esc(r.timeLimit)}" /></label>
        <label class="f"><span>Rang</span><input class="input" type="color" data-rf="color" value="${esc(r.color || "#7C5CFF")}" /></label>
      </div>
      <label class="f" style="margin-top:12px"><span>Tavsif (raund boshida ko'rsatiladi)</span><textarea class="input" data-rf="description" rows="2">${esc(r.description)}</textarea></label>
      ${r.hiddenTheme !== undefined ? `<label class="f" style="margin-top:12px"><span>Yashirin mavzu (7-savolning javobi bilan bir xil bo'lishi kerak)</span><input class="input" data-rf="hiddenTheme" value="${esc(r.hiddenTheme)}" /></label>` : ""}
      <div class="msgs" id="msgs-round" style="margin-top:12px"></div>
    </section>`;
}

function questionCard(r, q, qi) {
  const type = qType(r, q);
  const n = r.questions.length;
  const lockedLast = r.hiddenTheme !== undefined;
  const canUp = qi > 0 && !(lockedLast && qi === n - 1);
  const canDown = qi < n - 1 && !(lockedLast && qi >= n - 2);
  const picture = q.imageSvg
    ? `<div class="svg-prev"><div class="pic">${q.imageSvg}</div><div class="f"><span>Rasm: maxsus chizma (SVG)</span>
        <button class="btn btn-secondary" style="min-height:42px;font-size:14px" data-act="drop-svg" data-q="${qi}">Emoji rasm bilan almashtirish</button></div></div>`
    : `<label class="f"><span>Rasm (emoji)${cur === 0 ? " — majburiy" : " — ixtiyoriy"}</span>
        <input class="input big-emoji" style="max-width:110px" data-q="${qi}" data-f="image" value="${esc(q.image)}" maxlength="8" placeholder="🙂" /></label>`;
  const body = type === "options"
    ? `<div class="f"><span>Javob variantlari — to'g'ri javobni chapdagi harf bilan belgilang</span>
        ${q.options.map((o, oi) => `
          <div class="opt-row ${q.answer === oi ? "correct" : ""}" id="opt-${qi}-${oi}">
            <label class="radio" title="To'g'ri javob">${LETTERS[oi]}<input type="radio" name="correct-${qi}" data-q="${qi}" data-correct="${oi}" ${q.answer === oi ? "checked" : ""} aria-label="${LETTERS[oi]} — to'g'ri javob" /></label>
            <input class="input" data-q="${qi}" data-opt="${oi}" value="${esc(o)}" aria-label="${LETTERS[oi]} varianti" />
          </div>`).join("")}</div>`
    : `<div class="grid2">
        <label class="f"><span>To'g'ri javob</span><input class="input" data-q="${qi}" data-f="answer" value="${esc(q.answer)}" /></label>
        <label class="f"><span>Muqobil javoblar (vergul bilan)</span><input class="input" data-q="${qi}" data-f="alts" value="${esc((q.alts || []).join(", "))}" placeholder="masalan: Alisher Navoiy" /></label>
      </div>
      <div class="hint-line" id="hint-${qi}"></div>`;
  return `
    <article class="card q-edit" id="q-${qi}">
      <div class="q-top">
        <span class="q-num">${qi + 1}-savol</span>
        ${q.final ? `<span class="tag final">Yakuniy · ${q.points || 10} ochko · ${q.timeLimit || r.timeLimit} s</span>` : ""}
        <span class="tag">${type === "options" ? "4 variant" : "Yozma javob"}</span>
        <button class="icon-btn" data-act="up" data-q="${qi}" aria-label="Yuqoriga ko'chirish" ${canUp ? "" : "disabled"}>↑</button>
        <button class="icon-btn" data-act="down" data-q="${qi}" aria-label="Pastga ko'chirish" ${canDown ? "" : "disabled"}>↓</button>
      </div>
      ${type === "options" || q.image || q.imageSvg || cur === 0 ? picture : ""}
      <label class="f"><span>Savol matni</span><textarea class="input" rows="2" data-q="${qi}" data-f="text">${esc(q.text)}</textarea></label>
      ${body}
      <label class="f"><span>Qiziqarli fakt (javobdan keyin ko'rsatiladi, ixtiyoriy)</span><input class="input" data-q="${qi}" data-f="fact" value="${esc(q.fact)}" /></label>
      <div class="msgs" id="msgs-${qi}"></div>
    </article>`;
}

/* Inputlarni qayta chizmasdan holatni yangilash (fokus yo'qolmasligi uchun) */
function refresh() {
  lastCheck = L.validateRounds(draft);
  const { errors, warnings } = lastCheck;
  const r = draft[cur];
  const dirty = isDirty();
  const changes = dirty ? changedCount() : 0;

  draft.forEach((_, i) => {
    const b = document.getElementById(`badge-${i}`);
    const n = errors.filter((e) => e.r === i).length;
    if (b) { b.hidden = !n; b.textContent = n; }
  });
  const msgsHtml = (list) => list.map((m) => `<div class="msg ${m.kind}">${m.kind === "e" ? "⛔" : "⚠️"} ${esc(m.msg)}</div>`).join("");
  const forQ = (qi) => [...errors.filter((e) => e.r === cur && e.q === qi).map((e) => ({ ...e, kind: "e" })), ...warnings.filter((w) => w.r === cur && w.q === qi).map((w) => ({ ...w, kind: "w" }))];
  const roundMsgs = document.getElementById("msgs-round");
  if (roundMsgs) roundMsgs.innerHTML = msgsHtml([...errors.filter((e) => e.r === cur && e.q === null), ...errors.filter((e) => e.r === null)].map((e) => ({ ...e, kind: "e" })).concat(warnings.filter((w) => w.r === cur && w.q === null).map((w) => ({ ...w, kind: "w" }))));
  const changed = changedQuestions(cur);
  r.questions.forEach((q, qi) => {
    const list = forQ(qi);
    const box = document.getElementById(`msgs-${qi}`);
    if (box) box.innerHTML = msgsHtml(list);
    const card = document.getElementById(`q-${qi}`);
    if (card) {
      card.classList.toggle("has-err", list.some((m) => m.kind === "e"));
      card.classList.toggle("changed", changed[qi]);
    }
    const hint = document.getElementById(`hint-${qi}`);
    if (hint) {
      if (r.id === L.CHAIN_ROUND_ID) {
        const need = qi === 0 ? L.firstLetter(q.answer) : L.lastLetter(r.questions[qi - 1].answer);
        const letters = L.uzLetters(q.answer || "");
        hint.innerHTML = `O'yinchiga ko'rsatiladi: «<b>${esc(L.capLetter(need))}</b>» harfi bilan boshlanadi · ${letters.length} ta harf. Keyingi javob «<b>${esc(L.capLetter(L.lastLetter(q.answer || "")))}</b>» harfi bilan boshlanishi kerak.`;
      } else {
        hint.innerHTML = `O'yinchiga ko'rsatiladi: «<b>${esc(L.capLetter(L.firstLetter(q.answer || "")))}</b>» harfi bilan boshlanadi · ${L.uzLetters(q.answer || "").length} ta harf.`;
      }
    }
  });

  const status = document.getElementById("status");
  if (status) {
    status.innerHTML = `
      ${errors.length ? `<span class="pill err">⛔ ${errors.length} ta xato</span>` : `<span class="pill ok">✓ Xato yo'q</span>`}
      ${warnings.length ? `<span class="pill warn">⚠️ ${warnings.length} ta ogohlantirish</span>` : ""}
      ${dirty ? `<span class="pill dirty">✎ ${changes} ta o'zgarish (qoralama saqlangan)</span><button class="link-btn" data-act="discard">O'zgarishlarni bekor qilish</button>` : `<span class="pill">Saytdagi versiya bilan bir xil</span>`}
      <button class="link-btn" data-act="download">questions.js ni yuklab olish</button>`;
  }
  const summary = document.getElementById("summary");
  if (summary) summary.innerHTML = errors.length
    ? `Nashr qilishdan oldin <b>${errors.length} ta xato</b>ni tuzating`
    : dirty ? `<b>${changes} ta o'zgarish</b> nashr qilishga tayyor` : "O'zgarish yo'q";
  const pb = document.getElementById("publish-btn");
  if (pb) pb.disabled = !!errors.length || !dirty;
  const pv = root.querySelector('[data-act="preview"]');
  if (pv) pv.disabled = !!errors.length;
}

/* ---------- Tahrirlash ---------- */
function onEdit(e) {
  const t = e.target;
  const r = draft[cur];
  if (t.dataset.rf) {
    const k = t.dataset.rf;
    r[k] = k === "timeLimit" ? (t.value === "" ? NaN : Number(t.value)) : t.value;
    if (k === "color") root.style.setProperty("--accent", t.value);
    if (k === "title" || k === "icon") {
      const tab = root.querySelector(`.tab[data-i="${cur}"]`);
      if (tab) { tab.childNodes[1].textContent = r.icon; tab.childNodes[2].textContent = `${cur + 1}. ${r.title}`; }
    }
  } else if (t.dataset.q !== undefined) {
    const q = r.questions[+t.dataset.q];
    if (t.dataset.opt !== undefined) q.options[+t.dataset.opt] = t.value;
    else if (t.dataset.correct !== undefined) {
      q.answer = +t.dataset.correct;
      q.options.forEach((_, oi) => document.getElementById(`opt-${t.dataset.q}-${oi}`)?.classList.toggle("correct", oi === q.answer));
    } else if (t.dataset.f === "alts") q.alts = t.value.split(",").map((s) => s.trim()).filter(Boolean);
    else if (t.dataset.f) q[t.dataset.f] = t.value;
  } else return;
  saveDraft();
  refresh();
}
root.addEventListener("input", onEdit);
root.addEventListener("change", (e) => { if (e.target.dataset.correct !== undefined) onEdit(e); });

function move(qi, dir) {
  const qs = draft[cur].questions;
  const j = qi + dir;
  if (j < 0 || j >= qs.length) return;
  [qs[qi], qs[j]] = [qs[j], qs[qi]];
  saveDraft();
  render();
  document.getElementById(`q-${j}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
}

root.addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const qi = b.dataset.q !== undefined ? +b.dataset.q : null;
  switch (b.dataset.act) {
    case "tab": cur = +b.dataset.i; render(); window.scrollTo({ top: 0 }); break;
    case "up": move(qi, -1); break;
    case "down": move(qi, 1); break;
    case "drop-svg": {
      const q = draft[cur].questions[qi];
      delete q.imageSvg;
      q.image = q.image || "";
      saveDraft(); render();
      document.querySelector(`#q-${qi} [data-f="image"]`)?.focus();
      break;
    }
    case "discard":
      openModal(`<div class="e">↩️</div><h3>O'zgarishlar bekor qilinsinmi?</h3><p class="center">Barcha tahrirlar o'chadi va saytdagi versiya qayta yuklanadi.</p>
        <button class="btn btn-danger" data-m="yes">Ha, bekor qilish</button><button class="btn btn-ghost" data-m="no">Yo'q</button>`,
        (m) => { closeModal(); if (m === "yes") { draft = clone(live); ls.del(KEYS.draft); render(); toast("O'zgarishlar bekor qilindi"); } });
      break;
    case "download": download(); break;
    case "preview": preview(); break;
    case "publish": publishDialog(); break;
  }
});

function download() {
  const blob = new Blob([fileText(draft)], { type: "text/javascript" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "questions.js";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function preview() {
  if (lastCheck.errors.length) return toast("Avval xatolarni tuzating");
  ls.set(KEYS.draft, { rounds: draft, savedAt: Date.now() });
  window.open(`./?preview=1&r=${cur}`, "_blank", "noopener");
}

/* ---------- GitHub'ga nashr qilish ---------- */
const b64 = (s) => { const bytes = new TextEncoder().encode(s); let bin = ""; bytes.forEach((x) => (bin += String.fromCharCode(x))); return btoa(bin); };
const unb64 = (s) => new TextDecoder().decode(Uint8Array.from(atob(String(s).replace(/\s/g, "")), (c) => c.charCodeAt(0)));

async function gh(path, token, opts = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28", ...(opts.body ? { "Content-Type": "application/json" } : {}) },
  });
  let data = null;
  try { data = await res.json(); } catch { /* bo'sh javob */ }
  if (!res.ok) {
    const msg = res.status === 401 ? "Token noto'g'ri yoki muddati tugagan"
      : res.status === 403 ? "Ruxsat yo'q — tokenga «Contents: Read and write» ruxsatini bering"
      : res.status === 404 ? "Repozitoriy yoki fayl topilmadi (yoki tokenda bu repozitoriyga ruxsat yo'q)"
      : res.status === 409 ? "Fayl shu payt boshqa joyda o'zgartirildi — qayta urinib ko'ring"
      : res.status === 422 ? "GitHub so'rovni qabul qilmadi"
      : `GitHub xatosi (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

/** Barcha maqsadli branch'larga questions.js ni yozadi. log(text, state) — jarayonni ko'rsatish. */
export async function publish({ token, cfg, content, message, log }) {
  const { owner, repo, targets } = cfg;
  log("GitHub bilan bog'lanilmoqda…");
  const info = await gh(`/repos/${owner}/${repo}`, token);
  if (info.permissions && info.permissions.push === false) throw new Error("Bu tokenda repozitoriyga yozish huquqi yo'q");
  log(`Repozitoriy: ${owner}/${repo}`, "ok");
  const commits = [];
  for (const t of targets) {
    const url = `/repos/${owner}/${repo}/contents/${t.path.split("/").map(encodeURIComponent).join("/")}`;
    log(`${t.branch}: ${t.path} o'qilmoqda…`);
    let sha;
    try {
      const file = await gh(`${url}?ref=${encodeURIComponent(t.branch)}`, token);
      sha = file.sha;
      if (unb64(file.content) === content) { log(`${t.branch}: o'zgarish yo'q, o'tkazib yuborildi`, "ok"); continue; }
    } catch (e) {
      if (e.status !== 404) throw e;
    }
    const res = await gh(url, token, { method: "PUT", body: JSON.stringify({ message, content: b64(content), branch: t.branch, ...(sha ? { sha } : {}) }) });
    commits.push({ branch: t.branch, url: res.commit && res.commit.html_url, sha: res.commit && res.commit.sha });
    log(`${t.branch}: saqlandi`, "ok");
  }
  return commits;
}

function publishDialog() {
  if (lastCheck.errors.length) return toast("Avval xatolarni tuzating");
  const cfg = repoCfg();
  const saved = getToken();
  const remembered = (() => { try { return !!localStorage.getItem(KEYS.token); } catch { return false; } })();
  openModal(`
    <div class="e">🚀</div>
    <h3>Savollarni nashr qilish</h3>
    <p class="note center">${changedCount()} ta o'zgarish <b>${esc(cfg.owner)}/${esc(cfg.repo)}</b> repozitoriyasiga yoziladi. Sayt bir necha daqiqada yangilanadi.</p>
    <label class="f"><span>Nima o'zgardi? (izoh)</span><input class="input" id="pub-msg" value="Savollar yangilandi" maxlength="100" /></label>
    <label class="f"><span>GitHub token</span><input class="input" id="pub-token" type="password" autocomplete="off" spellcheck="false" placeholder="github_pat_…" value="${esc(saved)}" /></label>
    <label class="check"><input type="checkbox" id="pub-remember" ${remembered ? "checked" : ""} /> Shu qurilmada eslab qolish</label>
    <p class="note">Token kerak bo'ladi: <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">yangi «fine-grained» token yarating</a> → <i>Repository access</i>: faqat <b>${esc(cfg.repo)}</b> → <i>Permissions</i>: <b>Contents — Read and write</b>. Token faqat shu brauzerda saqlanadi va faqat GitHub'ga yuboriladi.</p>
    <details class="repo"><summary>Repozitoriy sozlamalari</summary>
      <div class="grid2" style="margin-top:10px">
        <label class="f"><span>Egasi</span><input class="input" id="pub-owner" value="${esc(cfg.owner)}" /></label>
        <label class="f"><span>Repozitoriy</span><input class="input" id="pub-repo" value="${esc(cfg.repo)}" /></label>
      </div>
      <p class="note">Yoziladigan fayllar: ${cfg.targets.map((t) => `<code>${esc(t.branch)}:${esc(t.path)}</code>`).join(", ")}</p>
    </details>
    <div class="log" id="pub-log"></div>
    <button class="btn btn-primary" data-m="go" id="pub-go">Nashr qilish</button>
    ${saved ? `<button class="btn btn-ghost" data-m="forget">Saqlangan tokenni o'chirish</button>` : ""}
    <button class="btn btn-ghost" data-m="close">Yopish</button>`, async (m, btn) => {
    if (m === "close") return closeModal();
    if (m === "forget") { forgetToken(); document.getElementById("pub-token").value = ""; btn.remove(); return toast("Token o'chirildi"); }
    if (m !== "go") return;
    const token = document.getElementById("pub-token").value.trim();
    const message = document.getElementById("pub-msg").value.trim() || "Savollar yangilandi";
    const owner = document.getElementById("pub-owner").value.trim();
    const repo = document.getElementById("pub-repo").value.trim();
    const logEl = document.getElementById("pub-log");
    if (!token) { document.getElementById("pub-token").classList.add("shake"); return; }
    const newCfg = { ...cfg, owner, repo };
    ls.set(KEYS.repo, newCfg);
    setToken(token, document.getElementById("pub-remember").checked);
    btn.disabled = true;
    btn.textContent = "Nashr qilinmoqda…";
    modalRoot.firstElementChild.setAttribute("data-busy", "");
    logEl.innerHTML = "";
    const log = (text, state = "") => { logEl.insertAdjacentHTML("beforeend", `<div class="${state}">${esc(text)}</div>`); };
    try {
      const commits = await publish({ token, cfg: newCfg, content: fileText(draft), message: `${message} (savollar muharriri)`, log });
      live = clone(draft);
      ls.del(KEYS.draft);
      log(commits.length ? "Tayyor! Sayt odatda 1–10 daqiqada yangilanadi." : "Saytdagi versiya allaqachon shu holatda.", "ok");
      commits.forEach((c) => c.url && logEl.insertAdjacentHTML("beforeend", `<div class="ok"><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.branch)} commit</a></div>`));
      btn.textContent = "✓ Nashr qilindi";
      refresh();
    } catch (e) {
      log(e.message || String(e), "bad");
      btn.disabled = false;
      btn.textContent = "Qayta urinish";
    } finally {
      modalRoot.firstElementChild?.removeAttribute("data-busy");
    }
  });
}

/* ---------- Ishga tushirish ---------- */
async function init() {
  try {
    const mod = await import(`./questions.js?v=${Date.now()}`);
    live = L.cleanRounds(mod.ROUNDS);
  } catch (e) {
    root.innerHTML = `<p class="msg e" style="margin-top:30vh">Savollarni yuklab bo'lmadi: ${esc(e.message)}</p>`;
    return;
  }
  const saved = ls.get(KEYS.draft, null);
  draft = clone(live);
  if (saved && Array.isArray(saved.rounds) && saved.rounds.length === live.length) {
    try {
      L.cleanRounds(saved.rounds);
      draft = saved.rounds;
    } catch { ls.del(KEYS.draft); }
  }
  render();
  if (isDirty()) toast("Saqlangan qoralama tiklandi");
}

window.__admin = { get draft() { return draft; }, get live() { return live; }, publish, refresh: () => refresh() };
init();
