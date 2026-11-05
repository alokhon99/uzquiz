// Builds the demo pack "Diqqat sinovi": original SVG pictures + canvas-recorded videos
// (videos come from tests/tools/make-videos.html → tests/_uploads/).
import { writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { serializePack, validatePack } from "../app/js/pack.js";

const dir = "app/packs/diqqat/media";
mkdirSync(dir, { recursive: true });
for (const v of ["toplar.mp4", "ranglar.mp4", "shakllar.mp4"]) {
  const src = `tests/_uploads/${v}`;
  if (!existsSync(src)) { console.error("missing", src, "— run tests/tools/make-videos.html first"); process.exit(1); }
  copyFileSync(src, `${dir}/${v}`);
}

const svg = (body, w = 400, h = 300) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" rx="18" fill="#241A55"/>${body}</svg>\n`;
const star = (cx, cy, r, fill) => {
  const p = [];
  for (let i = 0; i < 10; i++) { const a = (Math.PI / 5) * i - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; p.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`); }
  return `<polygon points="${p.join(" ")}" fill="${fill}"/>`;
};
// 7 stars scattered
const stars = [[70, 80], [190, 60], [320, 90], [110, 190], [240, 170], [340, 220], [180, 250]].map(([x, y], i) => star(x, y, 26 - (i % 3) * 4, "#FFC53D")).join("");
writeFileSync(`${dir}/yulduzlar.svg`, svg(stars));
// 6 red vs 4 blue circles
const dots = [[60, 70, "r"], [150, 60, "b"], [250, 80, "r"], [340, 70, "r"], [90, 170, "b"], [190, 160, "r"], [290, 180, "b"], [70, 250, "r"], [180, 250, "b"], [320, 250, "r"]]
  .map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="28" fill="${c === "r" ? "#FF4D6D" : "#3DA9FF"}"/>`).join("");
writeFileSync(`${dir}/doiralar.svg`, svg(dots));
// clock showing 3:00
const ticks = Array.from({ length: 12 }, (_, i) => { const a = (Math.PI / 6) * i; return `<line x1="${200 + 105 * Math.sin(a)}" y1="${150 - 105 * Math.cos(a)}" x2="${200 + 120 * Math.sin(a)}" y2="${150 - 120 * Math.cos(a)}" stroke="#F5F3FF" stroke-width="${i % 3 ? 3 : 6}" stroke-linecap="round"/>`; }).join("");
writeFileSync(`${dir}/soat.svg`, svg(`<circle cx="200" cy="150" r="130" fill="#120C2B" stroke="#7C5CFF" stroke-width="8"/>${ticks}<line x1="200" y1="150" x2="200" y2="62" stroke="#F5F3FF" stroke-width="7" stroke-linecap="round"/><line x1="200" y1="150" x2="268" y2="150" stroke="#FFC53D" stroke-width="10" stroke-linecap="round"/><circle cx="200" cy="150" r="9" fill="#FF4D8D"/>`));
// cover
writeFileSync(`${dir}/muqova.svg`, svg(`<circle cx="200" cy="150" r="95" fill="#F5F3FF"/><circle cx="200" cy="150" r="55" fill="#7C5CFF"/><circle cx="200" cy="150" r="24" fill="#120C2B"/><circle cx="215" cy="135" r="9" fill="#fff"/>`));

const OWN = { source: "Uzquiz jamoasi (o'zimiz chizgan)", licence: "own", holder: "Uzquiz" };
const img = (src, alt) => ({ type: "image", src: `media/${src}`, alt, rights: OWN });
const vid = (src, alt, extra = {}) => ({ type: "video", src: `media/${src}`, alt, maxReplays: 1, rights: OWN, ...extra });
const pack = {
  schema: 2,
  id: "diqqat",
  title: "Diqqat sinovi",
  description: "Rasm va qisqa videolarni kuzating: sanang, eslab qoling va farqini toping. Ko'z va xotira uchun mashq!",
  category: "mantiq",
  cover: img("muqova.svg", "Katta ko'z belgisi"),
  ageRating: "0+",
  status: "published",
  publishedAt: "2026-11-05",
  price: 0,
  settings: { speedBonus: true, showCorrect: true },
  rounds: [
    {
      title: "Rasmga qara", icon: "🖼️", color: "#7C5CFF", kind: "standard", timeLimit: 20, points: 10,
      description: "Rasmni diqqat bilan ko'ring va savolga javob bering.",
      questions: [
        { type: "choice", text: "Rasmda nechta yulduz bor?", media: img("yulduzlar.svg", "To'q fonda tarqoq sariq yulduzlar"), options: ["5", "6", "7", "8"], answer: 2 },
        { type: "choice", text: "Qaysi rangdagi doiralar ko'proq?", media: img("doiralar.svg", "Qizil va ko'k doiralar"), options: ["Qizil", "Ko'k", "Teng"], answer: 0, fact: "6 ta qizil va 4 ta ko'k doira bor edi." },
        { type: "truefalse", text: "Soat 3:00 ni ko'rsatyaptimi?", media: img("soat.svg", "Mil ko'rsatkichli soat"), answer: true },
      ],
    },
    {
      title: "Videoni kuzat", icon: "🎬", color: "#FF4D8D", kind: "standard", timeLimit: 25, points: 15,
      description: "▶ tugmasini bosing va videoni oxirigacha kuzating. Taymer video boshlanganda ishga tushadi. Videoni bir marta qayta ko'rish mumkin.",
      questions: [
        { type: "choice", text: "Ekrandan nechta to'p o'tdi?", media: vid("toplar.mp4", "Rangli to'plar ekran bo'ylab chapdan o'ngga o'tadi"), options: ["3", "4", "5", "6"], answer: 2 },
        { type: "choice", text: "Oxirgi kvadrat qaysi rangda edi?", media: vid("ranglar.mp4", "Turli joylarda rangli kvadratlar navbatma-navbat chiqadi"), options: ["Qizil", "Ko'k", "Yashil", "Sariq"], answer: 3 },
        { type: "choice", text: "Qaysi shakl ko'rinmadi?", media: vid("shakllar.mp4", "Markazda shakllar birin-ketin paydo bo'ladi", { start: 0.3, end: 5.6 }), options: ["Doira", "Uchburchak", "Kvadrat", "Yulduz"], answer: 3, fact: "Doira, uchburchak, kvadrat va romb ko'rsatildi — yulduz yo'q edi." },
      ],
    },
  ],
};
const v = validatePack(pack);
if (v.errors.length) { console.error(v.errors); process.exit(1); }
writeFileSync("app/packs/diqqat/pack.json", serializePack(pack));
console.log("diqqat: 4 images, 3 videos");
