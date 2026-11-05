// Uzquiz 2.0 — savollar paketi formati (schema 2): tekshirish, katalog yozuvi, v1 dan ko'chirish.
// Sof funksiyalar — brauzerda ham, Node.js testlarida ham ishlaydi.
import { normalize, firstLetter, lastLetter, capLetter, looseKey, checkText } from "./logic.js";

export const SCHEMA = 2;
export const LIMITS = { rounds: [1, 10], questions: [1, 20], options: [2, 6], time: [5, 120] };
export const MEDIA_LIMITS = {
  image: { types: ["image/jpeg", "image/png", "image/webp"], maxBytes: 5 * 1024 * 1024, maxSide: 1280 },
  audio: { types: ["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/ogg", "audio/wav", "audio/x-wav", "audio/wave"], maxBytes: 5 * 1024 * 1024, maxSeconds: 60 },
  video: { types: ["video/mp4", "video/webm"], maxBytes: 30 * 1024 * 1024, maxSeconds: 60 },
};
export const CATEGORIES = [
  { id: "umumiy", title: "Umumiy bilim", icon: "🧠" },
  { id: "kino", title: "Kino", icon: "🎬" },
  { id: "musiqa", title: "Musiqa", icon: "🎵" },
  { id: "tarix", title: "Tarix", icon: "🏛️" },
  { id: "sport", title: "Sport", icon: "⚽" },
  { id: "bolalar", title: "Bolalar", icon: "🧸" },
  { id: "mantiq", title: "Mantiq va diqqat", icon: "🧩" },
];
export const ROUND_KINDS = { standard: "Oddiy", chain: "So'z zanjiri", theme: "Yashirin mavzu" };
export const Q_TYPES = { choice: "Variantli", text: "Yozma javob", truefalse: "Ha / Yo'q" };
export const LICENCES = { own: "O'zimizniki", licensed: "Litsenziyalangan", "public-domain": "Jamoat mulki", cc: "Creative Commons" };
export const AGE_RATINGS = ["0+", "6+", "12+", "16+"];

const FILE_MEDIA = ["image", "audio", "video"];
const isStr = (v) => typeof v === "string";
const nonEmpty = (v) => isStr(v) && normalize(v) !== "";

export function roundOf(pack, ri) { return pack.rounds[ri]; }
export function questionPoints(round, q) { return q.points || round.points || 10; }
export function questionTime(round, q) { return q.timeLimit || round.timeLimit || 30; }
export function totalQuestions(pack) { return pack.rounds.reduce((n, r) => n + r.questions.length, 0); }
export function maxScore(pack, timerOn = true) {
  const bonus = timerOn && pack.settings?.speedBonus !== false ? 5 : 0;
  return pack.rounds.reduce((s, r) => s + r.questions.reduce((t, q) => t + questionPoints(r, q) + bonus, 0), 0);
}
export function mediaTypes(pack) {
  const set = new Set();
  for (const r of pack.rounds) for (const q of r.questions) for (const m of [q.media, q.reveal]) if (m && FILE_MEDIA.includes(m.type)) set.add(m.type);
  return ["image", "audio", "video"].filter((t) => set.has(t));
}
/** Taxminiy o'yin vaqti (daqiqa): har savolga ~ yarim vaqt + 6 s. */
export function estMinutes(pack) {
  const sec = pack.rounds.reduce((s, r) => s + r.questions.reduce((t, q) => t + questionTime(r, q) / 2 + 6, 0), 0);
  return Math.max(1, Math.round(sec / 60));
}
/** Paketdagi barcha fayl media manzillari (nisbiy). */
export function mediaFiles(pack) {
  const out = [];
  const add = (m) => m && FILE_MEDIA.includes(m.type) && m.src && out.push(m.src);
  add(pack.cover);
  for (const r of pack.rounds) for (const q of r.questions) { add(q.media); add(q.reveal); }
  return [...new Set(out)];
}

export function catalogueEntry(pack) {
  return {
    id: pack.id,
    title: pack.title,
    description: pack.description,
    category: pack.category,
    cover: pack.cover,
    ageRating: pack.ageRating,
    status: pack.status,
    publishedAt: pack.publishedAt || null,
    price: pack.price || 0,
    questionCount: totalQuestions(pack),
    roundCount: pack.rounds.length,
    mediaTypes: mediaTypes(pack),
    estMinutes: estMinutes(pack),
  };
}

/** Katalog: faqat nashr qilingan paketlar, yangilari oldinda. */
export function visiblePacks(index) {
  const list = (index && Array.isArray(index.packs) ? index.packs : []).filter((p) => p && p.status === "published");
  return list.sort((a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")) || a.title.localeCompare(b.title));
}
export function isNew(entry, now = Date.now(), days = 14) {
  if (!entry.publishedAt) return false;
  const t = Date.parse(entry.publishedAt);
  return Number.isFinite(t) && now - t >= 0 && now - t <= days * 86400000;
}
export function searchPacks(list, { query = "", category = "" } = {}) {
  const q = normalize(query);
  return list.filter((p) => (!category || p.category === category) && (!q || normalize(`${p.title} ${p.description}`).includes(q)));
}

/* ---------- Tekshirish ---------- */
function checkMedia(m, where, err, { requireRights = true } = {}) {
  if (!m) return;
  if (m.type === "emoji") { if (!nonEmpty(m.value)) err(`${where}: emoji bo'sh`); return; }
  if (!FILE_MEDIA.includes(m.type)) return err(`${where}: media turi noma'lum`);
  if (!nonEmpty(m.src)) err(`${where}: fayl tanlanmagan`);
  if ((m.type === "image" || m.type === "video") && !nonEmpty(m.alt)) err(`${where}: tavsif (alt matn) majburiy`);
  if (requireRights && (!m.rights || !nonEmpty(m.rights.source) || !LICENCES[m.rights.licence] || !nonEmpty(m.rights.holder))) err(`${where}: huquq ma'lumoti (manba, litsenziya, egasi) to'ldirilmagan`);
  if (m.type !== "image") {
    if (m.start != null && (!(m.start >= 0) || !Number.isFinite(m.start))) err(`${where}: boshlanish vaqti noto'g'ri`);
    if (m.end != null && (!Number.isFinite(m.end) || m.end <= (m.start || 0))) err(`${where}: tugash vaqti boshlanishdan katta bo'lishi kerak`);
    if (m.maxReplays != null && !(Number.isInteger(m.maxReplays) && m.maxReplays >= 0 && m.maxReplays <= 5)) err(`${where}: qayta tinglashlar soni 0–5`);
  }
}

/**
 * Paketni tekshiradi. Natija: { errors, warnings } — har biri { r, q, msg } (r/q = null — paket/raund darajasi).
 */
export function validatePack(pack) {
  const errors = [], warnings = [];
  const E = (r, q, msg) => errors.push({ r, q, msg });
  const W = (r, q, msg) => warnings.push({ r, q, msg });
  if (!pack || typeof pack !== "object") { E(null, null, "Paket topilmadi"); return { errors, warnings }; }
  if (!/^[a-z0-9-]{2,40}$/.test(pack.id || "")) E(null, null, "Paket ID: 2–40 ta kichik lotin harfi, raqam yoki «-»");
  if (!nonEmpty(pack.title)) E(null, null, "Paket nomi bo'sh");
  if (!nonEmpty(pack.description)) E(null, null, "Paket tavsifi bo'sh");
  if (!CATEGORIES.some((c) => c.id === pack.category)) E(null, null, "Toifa tanlanmagan");
  if (!AGE_RATINGS.includes(pack.ageRating)) E(null, null, "Yosh chegarasi tanlanmagan");
  if (!pack.cover) E(null, null, "Muqova (rasm yoki emoji) tanlanmagan");
  else checkMedia(pack.cover, "Muqova", (m) => E(null, null, m));
  if (!["draft", "review", "published", "archived"].includes(pack.status)) E(null, null, "Holat noma'lum");
  const rounds = Array.isArray(pack.rounds) ? pack.rounds : [];
  if (rounds.length < LIMITS.rounds[0] || rounds.length > LIMITS.rounds[1]) E(null, null, `Raundlar soni ${LIMITS.rounds[0]}–${LIMITS.rounds[1]} bo'lishi kerak`);
  rounds.forEach((r, ri) => {
    if (!nonEmpty(r.title)) E(ri, null, "Raund nomi bo'sh");
    if (!ROUND_KINDS[r.kind]) E(ri, null, "Raund turi noma'lum");
    if (!Number.isInteger(r.timeLimit) || r.timeLimit < LIMITS.time[0] || r.timeLimit > LIMITS.time[1]) E(ri, null, `Vaqt ${LIMITS.time[0]}–${LIMITS.time[1]} soniya bo'lishi kerak`);
    if (r.points != null && !(Number.isInteger(r.points) && r.points >= 1 && r.points <= 100)) E(ri, null, "Ochko 1–100 bo'lishi kerak");
    const qs = Array.isArray(r.questions) ? r.questions : [];
    if (qs.length < LIMITS.questions[0] || qs.length > LIMITS.questions[1]) E(ri, null, `Raundda ${LIMITS.questions[0]}–${LIMITS.questions[1]} ta savol bo'lishi kerak`);
    qs.forEach((q, qi) => {
      if (!nonEmpty(q.text)) E(ri, qi, "Savol matni bo'sh");
      if (q.type === "choice") {
        const o = Array.isArray(q.options) ? q.options : [];
        if (o.length < LIMITS.options[0] || o.length > LIMITS.options[1]) E(ri, qi, `Variantlar soni ${LIMITS.options[0]}–${LIMITS.options[1]} bo'lishi kerak`);
        else if (o.some((x) => !nonEmpty(x))) E(ri, qi, "Bo'sh javob varianti bor");
        else if (new Set(o.map(normalize)).size !== o.length) E(ri, qi, "Javob variantlari takrorlanmasligi kerak");
        if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= o.length) E(ri, qi, "To'g'ri javob belgilanmagan");
      } else if (q.type === "text") {
        if (!nonEmpty(q.answer)) E(ri, qi, "To'g'ri javob bo'sh");
        for (const f of ["alts", "keywords", "partial"]) {
          if (q[f] != null && (!Array.isArray(q[f]) || q[f].some((x) => !nonEmpty(x)))) E(ri, qi, `«${f}» ro'yxatida bo'sh qiymat bor`);
        }
        if (q.hint != null && !["letters", "count", "none"].includes(q.hint)) E(ri, qi, "Ishora turi noma'lum");
        (q.keywords || []).forEach((k) => { if (nonEmpty(k) && looseKey(k).replace(/ /g, "").length < 3) W(ri, qi, `Kalit so'z «${k}» juda qisqa — tasodifiy javoblar ham qabul qilinishi mumkin`); });
        if (nonEmpty(q.answer)) (q.partial || []).forEach((x) => { if (nonEmpty(x) && checkText(x, { ...q, partial: [] }).verdict === "ok") E(ri, qi, `«${x}» qisman javob bo'la olmaydi — u to'liq to'g'ri deb qabul qilinadi`); });
      } else if (q.type === "truefalse") {
        if (typeof q.answer !== "boolean") E(ri, qi, "To'g'ri javob (Ha / Yo'q) belgilanmagan");
      } else E(ri, qi, "Savol turi noma'lum");
      checkMedia(q.media, "Savol mediasi", (m) => E(ri, qi, m));
      checkMedia(q.reveal, "Javobdan keyingi media", (m) => E(ri, qi, m));
    });
    if (r.kind === "chain") {
      qs.forEach((q, qi) => { if (q.type !== "text") E(ri, qi, "So'z zanjiri raundida barcha savollar yozma javobli bo'lishi kerak"); });
      for (let i = 1; i < qs.length; i++) {
        const prev = qs[i - 1].answer, cur = qs[i].answer;
        if (!nonEmpty(prev) || !nonEmpty(cur) || qs[i - 1].type !== "text" || qs[i].type !== "text") continue;
        const need = lastLetter(prev), got = firstLetter(cur);
        if (need !== got) E(ri, i, `So'z zanjiri buzilgan: javob «${capLetter(need)}» harfi bilan boshlanishi kerak (oldingi javob — «${prev}»), hozir «${capLetter(got)}»`);
      }
    }
    if (r.kind === "theme") {
      const theme = normalize(r.hiddenTheme);
      const last = qs[qs.length - 1];
      if (!theme) E(ri, null, "Yashirin mavzu bo'sh");
      if (qs.length < 2) E(ri, null, "Yashirin mavzu raundida kamida 2 ta savol bo'lishi kerak");
      if (!last || !last.final || last.type !== "text") E(ri, qs.length - 1, "Oxirgi savol yashirin mavzuni yozish savoli bo'lishi kerak");
      else if (theme && normalize(last.answer) !== theme) E(ri, qs.length - 1, `Yakuniy savol javobi yashirin mavzuga («${r.hiddenTheme}») teng bo'lishi kerak`);
      if (theme) {
        qs.slice(0, -1).forEach((q, qi) => {
          const all = [q.text, ...(q.options || []), q.fact || "", q.media?.alt || ""].map(normalize).join(" ");
          if (all.includes(theme)) W(ri, qi, `Yashirin mavzu («${r.hiddenTheme}») oldindan ko'rinib qolmoqda`);
        });
        if (normalize(r.description).includes(theme)) W(ri, null, "Yashirin mavzu raund tavsifida ko'rinib qolmoqda");
      }
    }
    qs.forEach((q, qi) => { if (q.final && r.kind !== "theme") E(ri, qi, "«Yakuniy savol» faqat yashirin mavzu raundida bo'ladi"); });
  });
  return { errors, warnings };
}

/* ---------- v1 (MVP 1.x) savollar bazasidan ko'chirish ---------- */
export function migrateV1(rounds, { id = "klassik", flagSrc = "media/uz-flag.svg" } = {}) {
  const kindOf = (r) => (r.id === 3 ? "chain" : r.hiddenTheme !== undefined ? "theme" : "standard");
  const OWN = { source: "Uzquiz jamoasi", licence: "own", holder: "Uzquiz" };
  return {
    schema: SCHEMA,
    id,
    title: "Uzquiz Klassik",
    description: "Asl Uzquiz o'yini: rasmli savollar, bilimdonlar bellashuvi, so'z zanjiri, kino, musiqa va yashirin mavzu — 6 raund, 42 savol.",
    category: "umumiy",
    cover: { type: "emoji", value: "🇺🇿" },
    ageRating: "6+",
    status: "published",
    publishedAt: "2026-11-04",
    price: 0,
    settings: { speedBonus: true, showCorrect: true },
    rounds: rounds.map((r) => {
      const kind = kindOf(r);
      const out = { title: r.title, icon: r.icon, color: r.color, description: r.description, kind, timeLimit: r.timeLimit, points: 10 };
      if (kind === "theme") out.hiddenTheme = r.hiddenTheme;
      out.questions = r.questions.map((q) => {
        const type = (q.type || r.type) === "options" ? "choice" : "text";
        const nq = { type, text: q.text };
        if (q.image) nq.media = { type: "emoji", value: q.image };
        if (q.imageSvg) nq.media = { type: "image", src: flagSrc, alt: "Ko'k, oq va yashil yo'lli, oy va 12 yulduzli bayroq", rights: OWN };
        if (type === "choice") { nq.options = q.options.slice(); nq.answer = q.answer; }
        else { nq.answer = q.answer; if (q.alts && q.alts.length) nq.alts = q.alts.slice(); }
        if (q.final) { nq.final = true; nq.timeLimit = q.timeLimit; nq.points = q.points; }
        if (q.fact) nq.fact = q.fact;
        return nq;
      });
      return out;
    }),
  };
}

/** Paket JSON matni (barqaror, chiroyli formatda). */
export function serializePack(pack) { return JSON.stringify(pack, null, 2) + "\n"; }
export function serializeIndex(entries) {
  return JSON.stringify({ schema: SCHEMA, packs: entries.slice().sort((a, b) => a.id.localeCompare(b.id)) }, null, 2) + "\n";
}

/** Yangi bo'sh paket shabloni (admin uchun). */
export function blankPack(id = "yangi-paket") {
  return {
    schema: SCHEMA, id, title: "", description: "", category: "umumiy", cover: { type: "emoji", value: "❓" }, ageRating: "6+",
    status: "draft", publishedAt: null, price: 0, settings: { speedBonus: true, showCorrect: true },
    rounds: [blankRound()],
  };
}
export function blankRound(kind = "standard") {
  const r = { title: "Yangi raund", icon: "⭐", color: "#7C5CFF", description: "", kind, timeLimit: 30, points: 10, questions: [] };
  if (kind === "theme") { r.hiddenTheme = ""; r.questions = [blankQuestion("choice"), { ...blankQuestion("text"), final: true, timeLimit: 60, points: 20 }]; }
  else r.questions = [blankQuestion(kind === "chain" ? "text" : "choice")];
  return r;
}
export function blankQuestion(type = "choice") {
  if (type === "text") return { type, text: "", answer: "" };
  if (type === "truefalse") return { type, text: "", answer: true };
  return { type: "choice", text: "", options: ["", "", "", ""], answer: 0 };
}

/** Saqlangan o'yin holatini paket bo'yicha tekshirish. */
export function isValidGame(s, pack) {
  if (!s || typeof s !== "object" || !pack || s.packId !== pack.id) return false;
  const R = pack.rounds;
  if (!Number.isInteger(s.round) || s.round < 0 || s.round >= R.length) return false;
  if (!Number.isInteger(s.q) || s.q < 0 || s.q > R[s.round].questions.length) return false;
  if (typeof s.score !== "number" || !Number.isFinite(s.score) || s.score < 0) return false;
  if (!Array.isArray(s.results) || s.results.length !== R.length) return false;
  if (!Array.isArray(s.orders) || s.orders.length !== R.length) return false;
  for (let r = 0; r < R.length; r++) {
    if (!Array.isArray(s.results[r])) return false;
    if (!Array.isArray(s.orders[r]) || s.orders[r].length !== R[r].questions.length) return false;
    for (let q = 0; q < R[r].questions.length; q++) {
      const o = s.orders[r][q], Q = R[r].questions[q];
      if (Q.type === "choice") { if (!Array.isArray(o) || o.length !== Q.options.length) return false; }
    }
  }
  return true;
}
