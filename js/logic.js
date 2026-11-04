// Uzquiz — sof (UI'siz) o'yin mantig'i. Node.js testlarida ham ishlatiladi.

const APOSTROPHES = /[‘’ʻʼ`´′']/g;

/** Javobni solishtirish uchun normallashtirish. */
export function normalize(str) {
  return String(str ?? "")
    .replace(APOSTROPHES, "'")
    .toLocaleLowerCase("uz")
    .replace(/\s+/g, " ")
    .trim();
}

/** Matnli javob to'g'rimi? */
export function isTextCorrect(input, question) {
  const n = normalize(input);
  if (!n) return false;
  return [question.answer, ...(question.alts || [])].some((a) => normalize(a) === n);
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
