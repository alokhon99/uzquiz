// Generates the demo pack "Tovushlar va ritm" with original, synthesised audio (WAV, 16 kHz mono).
import { writeFileSync, mkdirSync } from "node:fs";
import { serializePack, validatePack } from "../app/js/pack.js";

const RATE = 16000;
const dir = "app/packs/tovushlar/media";
mkdirSync(dir, { recursive: true });

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.max(-1, Math.min(1, s)) * 32767 | 0, i * 2));
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVE", 8);
  h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24); h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}
const silence = (sec) => new Float32Array(Math.round(sec * RATE));
function tone(freq, sec, vol = 0.45) {
  const n = Math.round(sec * RATE), out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / RATE, env = Math.min(1, t / 0.02) * Math.min(1, (sec - t) / 0.08);
    out[i] = vol * env * (Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(4 * Math.PI * freq * t)) / 1.3;
  }
  return out;
}
function drum(sec = 0.25) {
  const n = Math.round(sec * RATE), out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / RATE, f = 140 * Math.exp(-t * 18) + 50;
    out[i] = 0.9 * Math.exp(-t * 14) * Math.sin(2 * Math.PI * f * t) + 0.15 * Math.exp(-t * 40) * (Math.random() * 2 - 1);
  }
  return out;
}
const cat = (...parts) => { const n = parts.reduce((s, p) => s + p.length, 0), o = new Float32Array(n); let k = 0; parts.forEach((p) => { o.set(p, k); k += p.length; }); return o; };
const beats = (count, gap) => cat(silence(0.3), ...Array.from({ length: count }, () => cat(drum(0.25), silence(Math.max(0, gap - 0.25)))), silence(0.3));
const NOTE = { do: 261.63, re: 293.66, mi: 329.63, fa: 349.23, sol: 392.0, lya: 440.0, si: 493.88, do2: 523.25 };
const melody = (notes, len = 0.42) => cat(silence(0.3), ...notes.map((n) => cat(tone(NOTE[n], len), silence(0.06))), silence(0.3));

const files = {
  "ritm-4.wav": beats(4, 0.6),
  "ritm-6.wav": beats(6, 0.38),
  "ritm-tezlashadi.wav": cat(beats(4, 0.8), silence(0.4), beats(4, 0.3)),
  "ritm-7.wav": beats(7, 0.42),
  "ohang-kotariladi.wav": melody(["do", "re", "mi", "fa", "sol"]),
  "ohang-pasayadi.wav": melody(["sol", "fa", "mi", "re", "do"]),
  "ikki-nota.wav": cat(silence(0.3), tone(NOTE.do, 0.7), silence(0.5), tone(NOTE.lya, 0.7), silence(0.3)),
  "bir-xil.wav": cat(silence(0.3), tone(NOTE.mi, 0.7), silence(0.5), tone(NOTE.mi, 0.7), silence(0.3)),
  "olti-nota.wav": melody(["do", "mi", "sol", "mi", "do2", "sol"], 0.36),
};
for (const [name, s] of Object.entries(files)) writeFileSync(`${dir}/${name}`, wav(s));

const OWN = { source: "Uzquiz jamoasi (sintez qilingan)", licence: "own", holder: "Uzquiz" };
const audio = (src, extra = {}) => ({ type: "audio", src: `media/${src}`, alt: "Tovush", maxReplays: 1, rights: OWN, ...extra });
const pack = {
  schema: 2,
  id: "tovushlar",
  title: "Tovushlar va ritm",
  description: "Quloqlaringizni sinang! Zarbalarni sanang, ohang qayerga ketayotganini toping va notalarni solishtiring. Barcha savollar — tovushli.",
  category: "musiqa",
  cover: { type: "emoji", value: "🥁" },
  ageRating: "0+",
  status: "published",
  publishedAt: "2026-11-05",
  price: 0,
  settings: { speedBonus: true, showCorrect: true },
  rounds: [
    {
      title: "Ritmni sana", icon: "🥁", color: "#FF8A3D", kind: "standard", timeLimit: 20, points: 10,
      description: "▶ tugmasini bosing va zarbalarni diqqat bilan tinglang. Taymer tovush boshlanganda ishga tushadi.",
      questions: [
        { type: "choice", text: "Nechta zarba eshitdingiz?", media: audio("ritm-4.wav"), options: ["3", "4", "5", "6"], answer: 1 },
        { type: "choice", text: "Bu safar-chi? Nechta zarba?", media: audio("ritm-6.wav"), options: ["5", "6", "7", "8"], answer: 1, fact: "Tez ritmda zarbalarni sanash qiyinroq — miyamiz ularni guruhlab qabul qiladi." },
        { type: "truefalse", text: "Ikkinchi qismda zarbalar birinchisiga qaraganda tezroqmi?", media: audio("ritm-tezlashadi.wav"), answer: true },
        { type: "truefalse", text: "Zarbalar soni juft sonmi?", media: audio("ritm-7.wav"), answer: false, fact: "7 ta zarba bor edi — bu toq son." },
      ],
    },
    {
      title: "Ohang sirlari", icon: "🎼", color: "#3DA9FF", kind: "standard", timeLimit: 25, points: 10,
      description: "Notalar balandligini solishtiring: ohang ko'tariladimi, pasayadimi yoki bir xil qoladimi?",
      questions: [
        { type: "choice", text: "Ohang ko'tariladimi yoki pasayadimi?", media: audio("ohang-kotariladi.wav"), options: ["Ko'tariladi", "Pasayadi", "Bir xil qoladi"], answer: 0, fact: "Bu do-re-mi-fa-sol — gamma bo'ylab yuqoriga harakat." },
        { type: "choice", text: "Bu ohang qaysi tomonga harakatlanadi?", media: audio("ohang-pasayadi.wav"), options: ["Ko'tariladi", "Pasayadi", "Bir xil qoladi"], answer: 1 },
        { type: "choice", text: "Qaysi nota balandroq?", media: audio("ikki-nota.wav"), options: ["Birinchisi", "Ikkinchisi", "Ikkalasi bir xil"], answer: 1, fact: "Birinchisi «do», ikkinchisi «lya» — lya balandroq." },
        { type: "truefalse", text: "Ikkala tovush bir xil balandlikdami?", media: audio("bir-xil.wav"), answer: true },
        { type: "choice", text: "Ohangda nechta nota bor?", media: audio("olti-nota.wav", { maxReplays: 2 }), options: ["4", "5", "6", "7"], answer: 2 },
      ],
    },
  ],
};
const v = validatePack(pack);
if (v.errors.length) { console.error(v.errors); process.exit(1); }
writeFileSync("app/packs/tovushlar/pack.json", serializePack(pack));
console.log("tovushlar:", Object.keys(files).length, "audio files");
