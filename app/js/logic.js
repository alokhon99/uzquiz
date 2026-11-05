// Uzquiz — sof (UI'siz) o'yin mantig'i. Node.js testlarida ham ishlatiladi.
import { cyrToLat, toCyrillic } from "./script.js";

const APOSTROPHES = /[‘’ʻʼ`´′']/g;

/** Javobni solishtirish uchun normallashtirish (kirill matn avval lotinga o'giriladi). */
export function normalize(str) {
  return cyrToLat(String(str ?? ""))
    .replace(APOSTROPHES, "'")
    .toLocaleLowerCase("uz")
    .replace(/\s+/g, " ")
    .trim();
}

/** Matnli javob to'g'rimi? */
export function isTextCorrect(input, question) {
  return checkText(input, question).verdict === "ok";
}

/* ---------- 2.1: yumshoq (inson kabi) javob tekshiruvi ---------- */

/** Kirill yozuvini lotinga o'giradi va kichik harflarga keltiradi (lotin matn o'zgarmaydi). */
export function toLatin(str) {
  return cyrToLat(String(str ?? "")).toLocaleLowerCase("uz");
}

/** Solishtirish kaliti: yozuv, katta-kichik harf, tutuq belgisi, nuqta va boshqa belgilar ahamiyatsiz. */
export function looseKey(str) {
  return toLatin(normalize(str))
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/'/g, "")
    .replace(/kh/g, "x")
    .replace(/(?<![sc])h/g, "x") // Xiva / Hiva — ko'pchilik x va h ni almashtirib yozadi
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Damerau–Levenshtein masofasi (qo'shni harflar o'rni almashishi ham 1 xato). */
export function editDistance(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[m][n];
}

/** Nechta imlo xatosiga ruxsat: qisqa so'zlar va raqamlar aniq yozilishi kerak. */
export function typoAllowance(key) {
  const len = key.replace(/ /g, "").length;
  if (/\d/.test(key) || len <= 4) return 0;
  return len <= 7 ? 1 : 2;
}

function sameish(inputKey, targetKey, fuzzy) {
  if (!targetKey) return null;
  const a = inputKey.replace(/ /g, ""), b = targetKey.replace(/ /g, "");
  if (a === b) return "exact";
  if (fuzzy && editDistance(a, b) <= typoAllowance(targetKey)) return "typo";
  return null;
}

function containsWords(inputKey, kwKey, fuzzy) {
  const words = inputKey.split(" "), kw = kwKey.split(" ").filter(Boolean);
  if (!kw.length) return false;
  for (let i = 0; i + kw.length <= words.length; i++) {
    if (kw.every((w, j) => sameish(words[i + j], w, fuzzy))) return true;
  }
  return false;
}

/**
 * Yozma javobni inson-hakam kabi tekshiradi.
 * Natija: { verdict: "ok" | "partial" | "no", how: "exact" | "typo" | "keyword" | "partial" | null }
 * Savol maydonlari: answer, alts[], keywords[] (javobda shu so'z bo'lsa — to'liq ochko),
 * partial[] (yarim ochko), exact: true (imlo xatosiga ruxsat yo'q).
 */
export function checkText(input, q) {
  const k = looseKey(input);
  if (!k) return { verdict: "no", how: null };
  const fuzzy = !q.exact;
  for (const a of [q.answer, ...(q.alts || [])]) {
    const how = sameish(k, looseKey(a), fuzzy);
    if (how) return { verdict: "ok", how };
  }
  for (const kw of q.keywords || []) {
    if (containsWords(k, looseKey(kw), fuzzy)) return { verdict: "ok", how: "keyword" };
  }
  for (const p of q.partial || []) {
    const pk = looseKey(p);
    if (sameish(k, pk, fuzzy) || containsWords(k, pk, fuzzy)) return { verdict: "partial", how: "partial" };
  }
  return { verdict: "no", how: null };
}

/** Javobni so'zlarga va o'zbek harflariga ajratish (harf kataklari uchun). */
export function answerWords(answer, script = "lat") {
  if (script === "cyr") {
    // Kirillda har bir belgi — bitta harf (ш, ч, ў, ғ, ё, ю, я ham).
    return toCyrillic(normalize(answer)).split(" ")
      .map((w) => [...w.replace(/[^\p{L}\p{N}]/gu, "")])
      .filter((w) => w.length);
  }
  return normalize(answer)
    .split(" ")
    .map((w) => uzLetters(w.replace(/[^\p{L}\p{N}']/gu, "").replace(/^'+|'+$/g, "")))
    .filter((w) => w.length);
}

/** O'zbek lotin harflarini (o', g', sh, ch, ng) hisobga olgan holda so'zni harflarga ajratish. */
export function uzLetters(word) {
  const w = normalize(word).replace(/\s/g, "");
  const out = [];
  for (let i = 0; i < w.length; i++) {
    const two = w.slice(i, i + 2);
    if (two === "o'" || two === "g'" || two === "sh" || two === "ch") {
      out.push(two);
      i++;
    } else {
      out.push(w[i]);
    }
  }
  return out;
}

export function firstLetter(word) {
  return uzLetters(word)[0] || "";
}

export function lastLetter(word) {
  const l = uzLetters(word);
  return l[l.length - 1] || "";
}

/** Bosh harfni katta qilish (o' → O', sh → Sh). */
export function capLetter(l) {
  return l ? l.charAt(0).toLocaleUpperCase("uz") + l.slice(1) : "";
}

/** So'z zanjiri uchun yordam harfi. */
export function chainHintLetter(round, qIndex) {
  const qs = round.questions;
  if (qIndex === 0) return firstLetter(qs[0].answer);
  return lastLetter(qs[qIndex - 1].answer);
}

/** Ochko hisoblash. */
export function calcPoints({ correct, timeLeft, timeLimit, base = 10, timerOn = true }) {
  if (!correct) return 0;
  if (!timerOn || !timeLimit) return base;
  const t = Math.max(0, Math.min(timeLeft, timeLimit));
  return base + Math.ceil((5 * t) / timeLimit);
}

export function questionBase(q) {
  return q.points || 10;
}

export function maxScore(rounds, timerOn = true) {
  let s = 0;
  for (const r of rounds) for (const q of r.questions) s += questionBase(q) + (timerOn ? 5 : 0);
  return s;
}

export function totalQuestions(rounds) {
  return rounds.reduce((n, r) => n + r.questions.length, 0);
}

export function rankFor(accuracy) {
  if (accuracy >= 90) return { title: "Bilimlar sultoni", emoji: "👑" };
  if (accuracy >= 70) return { title: "Zukko", emoji: "🧠" };
  if (accuracy >= 50) return { title: "Bilimdon", emoji: "📚" };
  if (accuracy >= 30) return { title: "Izlanuvchi", emoji: "🔍" };
  return { title: "Yosh bilimdon", emoji: "🌱" };
}

export function starsFor(accuracy) {
  if (accuracy >= 85) return 3;
  if (accuracy >= 55) return 2;
  return 1;
}

export function shuffle(arr, rnd = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sanitizeName(name) {
  const n = String(name ?? "").replace(/\s+/g, " ").trim().slice(0, 20);
  return n || "O'yinchi";
}

/** Rekordlarni saralash va top-10 ni qoldirish. */
export function topRecords(records, limit = 10) {
  return records
    .slice()
    .sort((a, b) => b.score - a.score || b.date - a.date)
    .slice(0, limit);
}

/** Yangi rekordmi? Avvalgi eng yaxshi natijadan qat'iy katta bo'lishi kerak (tenglik — rekord emas). */
export function isNewRecord(prevRecords, score) {
  const best = (prevRecords || []).reduce((m, r) => Math.max(m, Number(r && r.score) || 0), -Infinity);
  return score > best;
}

/** Saqlangan o'yin holatini tekshirish (buzilgan ma'lumotdan himoya). */
export function isValidState(s, rounds) {
  if (!s || typeof s !== "object") return false;
  if (!Number.isInteger(s.round) || s.round < 0 || s.round >= rounds.length) return false;
  if (!Number.isInteger(s.q) || s.q < 0 || s.q > rounds[s.round].questions.length) return false;
  if (typeof s.score !== "number" || !Number.isFinite(s.score) || s.score < 0) return false;
  if (!Array.isArray(s.results) || s.results.length !== rounds.length) return false;
  if (!Array.isArray(s.orders) || s.orders.length !== rounds.length) return false;
  for (let r = 0; r < rounds.length; r++) {
    if (!Array.isArray(s.results[r])) return false;
    if (!Array.isArray(s.orders[r]) || s.orders[r].length !== rounds[r].questions.length) return false;
  }
  return true;
}

/* ---------- Savollar bazasini tekshirish va faylga yozish (muharrir va testlar uchun) ---------- */

export const CHAIN_ROUND_ID = 3;
const isStr = (v) => typeof v === "string";

/**
 * Savollar bazasini tekshiradi. Natija: { errors: [{ r, q, msg }], warnings: [...] }
 * r — raund indeksi (0..5), q — savol indeksi (0..6) yoki null (butun raund uchun).
 */
export function validateRounds(rounds) {
  const errors = [];
  const warnings = [];
  const err = (r, q, msg) => errors.push({ r, q, msg });
  const warn = (r, q, msg) => warnings.push({ r, q, msg });
  if (!Array.isArray(rounds) || rounds.length !== 6) {
    err(null, null, "O'yinda aynan 6 ta raund bo'lishi kerak");
    return { errors, warnings };
  }
  rounds.forEach((r, ri) => {
    if (!normalize(r.title)) err(ri, null, "Raund nomi bo'sh");
    if (!normalize(r.description)) err(ri, null, "Raund tavsifi bo'sh");
    if (!Number.isInteger(r.timeLimit) || r.timeLimit < 5 || r.timeLimit > 120) err(ri, null, "Vaqt 5 dan 120 soniyagacha butun son bo'lishi kerak");
    if (!Array.isArray(r.questions) || r.questions.length !== 7) {
      err(ri, null, "Raundda aynan 7 ta savol bo'lishi kerak");
      return;
    }
    r.questions.forEach((q, qi) => {
      const type = q.type || r.type;
      if (!normalize(q.text)) err(ri, qi, "Savol matni bo'sh");
      if (type === "options") {
        if (!Array.isArray(q.options) || q.options.length !== 4) {
          err(ri, qi, "Aynan 4 ta javob varianti kerak");
        } else {
          if (q.options.some((o) => !normalize(o))) err(ri, qi, "Bo'sh javob varianti bor");
          else if (new Set(q.options.map(normalize)).size !== 4) err(ri, qi, "Javob variantlari takrorlanmasligi kerak");
        }
        if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) err(ri, qi, "To'g'ri javob belgilanmagan");
      } else if (type === "text") {
        if (!isStr(q.answer) || !normalize(q.answer)) err(ri, qi, "To'g'ri javob bo'sh");
        if (q.alts && !Array.isArray(q.alts)) err(ri, qi, "Muqobil javoblar ro'yxat bo'lishi kerak");
      } else {
        err(ri, qi, "Savol turi noma'lum");
      }
      if (ri === 0 && !normalize(q.image) && !q.imageSvg) err(ri, qi, "1-raundda har bir savolga rasm kerak");
    });
    if (r.id === CHAIN_ROUND_ID) {
      for (let i = 1; i < r.questions.length; i++) {
        const prev = r.questions[i - 1].answer, cur = r.questions[i].answer;
        if (!isStr(prev) || !isStr(cur) || !normalize(prev) || !normalize(cur)) continue;
        const need = lastLetter(prev), got = firstLetter(cur);
        if (need !== got) err(ri, i, `So'z zanjiri buzilgan: javob «${capLetter(need)}» harfi bilan boshlanishi kerak (oldingi javob — «${prev}»), hozir «${capLetter(got)}»`);
      }
    }
    if (r.hiddenTheme !== undefined) {
      const theme = normalize(r.hiddenTheme);
      const last = r.questions[r.questions.length - 1];
      if (!theme) err(ri, null, "Yashirin mavzu bo'sh");
      if (!last || !last.final || (last.type || r.type) !== "text") err(ri, 6, "Oxirgi savol yashirin mavzuni yozish savoli bo'lishi kerak");
      else if (theme && normalize(last.answer) !== theme) err(ri, 6, `Yakuniy savol javobi yashirin mavzuga («${r.hiddenTheme}») teng bo'lishi kerak`);
      if (theme) {
        r.questions.slice(0, -1).forEach((q, qi) => {
          const all = [q.text, ...(q.options || []), q.fact || ""].map(normalize).join(" ");
          if (all.includes(theme)) warn(ri, qi, `Yashirin mavzu («${r.hiddenTheme}») oldindan ko'rinib qolmoqda`);
        });
        if (normalize(r.description).includes(theme)) warn(ri, null, "Yashirin mavzu raund tavsifida ko'rinib qolmoqda");
      }
    }
  });
  return { errors, warnings };
}

const ROUND_KEYS = ["id", "title", "icon", "color", "description", "type", "timeLimit", "hiddenTheme", "questions"];
const Q_KEYS = ["type", "final", "timeLimit", "points", "image", "imageSvg", "text", "options", "answer", "alts", "fact"];

function pick(obj, keys) {
  const out = {};
  for (const k of keys) {
    const v = obj[k];
    if (v === undefined || v === null) continue;
    if (isStr(v) && k !== "answer" && !v.trim()) continue;
    if (Array.isArray(v) && !v.length && k !== "questions") continue;
    out[k] = isStr(v) ? v.trim() : Array.isArray(v) ? v.map((x) => (isStr(x) ? x.trim() : x)) : v;
  }
  return out;
}

/** Bazani standart (tartibli, keraksiz maydonlarsiz) ko'rinishga keltiradi. */
export function cleanRounds(rounds) {
  return rounds.map((r) => ({ ...pick(r, ROUND_KEYS), questions: r.questions.map((q) => pick(q, Q_KEYS)) }));
}

/** questions.js fayli matnini yaratadi (muharrir shu faylni GitHub'ga yozadi). */
export function serializeRounds(rounds) {
  return (
    "// Uzquiz savollar bazasi. Bu fayl savollar muharriri (admin.html) tomonidan yaratiladi.\n" +
    "// Variantli savollarda `answer` — `options` dagi to'g'ri javob indeksi (0–3).\n" +
    "// Matnli savollarda `answer` — asosiy javob, `alts` — qabul qilinadigan muqobillar.\n" +
    "export const ROUNDS = " + JSON.stringify(cleanRounds(rounds), null, 2) + ";\n"
  );
}
