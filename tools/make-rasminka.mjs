// «Rasminka» — Klassik paketining 1-raundi (2.1): 7 ta rasmli topishmoq, javob yoziladi.
// Rasmlar Uzquiz jamoasi tomonidan SVG'da chizilgan (huquq: o'zimizniki).
// Ishga tushirish: node tools/make-rasminka.mjs
import { writeFileSync, readFileSync, mkdirSync, existsSync, unlinkSync } from "node:fs";

if (!process.argv.includes("--force")) {
  console.error("Diqqat: bu skript Klassik paketining 1-raundini demo savollar bilan ALMASHTIRADI.\n" +
    "Jamoa muharrirda nashr qilgan savollar o'chib ketadi. Rostdan ham kerak bo'lsa: node tools/make-rasminka.mjs --force");
  process.exit(1);
}
const DIR = new URL("../app/packs/klassik/", import.meta.url);
const MEDIA = new URL("media/", DIR);
mkdirSync(MEDIA, { recursive: true });

const svg = (body, bg = ["#1E1648", "#0E0A24"]) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="640" height="400">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient></defs>
<rect width="640" height="400" fill="url(#bg)"/>
${body}
</svg>
`;

const stars = (n, seed = 1, maxY = 200) => {
  let s = seed, out = "";
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < n; i++) out += `<circle cx="${(rnd() * 640).toFixed(0)}" cy="${(rnd() * maxY).toFixed(0)}" r="${(rnd() * 1.6 + 0.4).toFixed(1)}" fill="#fff" opacity="${(rnd() * 0.6 + 0.3).toFixed(2)}"/>`;
  return out;
};

const IMAGES = {
  // 1. Qozonda osh
  "qozon.svg": svg(`
  <ellipse cx="320" cy="350" rx="230" ry="26" fill="#000" opacity=".35"/>
  <!-- olov -->
  <path d="M230 360 q20-50 40-10 q10-40 30 0 q15-45 35 0 q15-40 30 0 q20-50 45 10z" fill="#FF8A3D" opacity=".9"/>
  <path d="M255 362 q15-30 28-5 q12-28 26 0 q14-30 28 0 q12-26 30 5z" fill="#FFD166"/>
  <!-- qozon -->
  <path d="M120 200 h400 q-10 130-200 150 q-190-20-200-150z" fill="#2B2B33"/>
  <path d="M120 200 h400 q-4 30-14 50 h-372 q-10-20-14-50z" fill="#3A3A45"/>
  <rect x="100" y="188" width="440" height="22" rx="11" fill="#4A4A57"/>
  <path d="M96 199 q-40 0-40 28" stroke="#4A4A57" stroke-width="12" fill="none" stroke-linecap="round"/>
  <path d="M544 199 q40 0 40 28" stroke="#4A4A57" stroke-width="12" fill="none" stroke-linecap="round"/>
  <!-- guruch tepasi -->
  <path d="M140 196 q180-150 360 0z" fill="#F4E6C3"/>
  <g fill="#E07A1F">
    <rect x="200" y="150" width="70" height="9" rx="4" transform="rotate(-18 235 154)"/>
    <rect x="300" y="120" width="80" height="9" rx="4" transform="rotate(8 340 124)"/>
    <rect x="370" y="155" width="70" height="9" rx="4" transform="rotate(24 405 159)"/>
    <rect x="250" y="175" width="60" height="8" rx="4" transform="rotate(4 280 179)"/>
    <rect x="330" y="168" width="55" height="8" rx="4" transform="rotate(-12 357 172)"/>
  </g>
  <g fill="#F7C548"><rect x="230" y="128" width="50" height="7" rx="3" transform="rotate(-30 255 131)"/><rect x="390" y="135" width="46" height="7" rx="3" transform="rotate(30 413 138)"/></g>
  <g fill="#FFF" opacity=".9">${Array.from({ length: 60 }, (_, i) => `<ellipse cx="${160 + ((i * 53) % 320)}" cy="${190 - ((i * 37) % 70) * (1 - Math.abs(((160 + ((i * 53) % 320)) - 320) / 200))}" rx="4" ry="1.6" transform="rotate(${(i * 29) % 180} ${160 + ((i * 53) % 320)} 180)"/>`).join("")}</g>
  <!-- sarimsoq -->
  <g transform="translate(320 92)"><ellipse rx="26" ry="22" fill="#FBF3E4"/><path d="M-10-20 q10 20 0 40 M8-20 q-6 20 0 40" stroke="#E6D5B8" stroke-width="3" fill="none"/><path d="M0-22 v-12" stroke="#CDBA94" stroke-width="5" stroke-linecap="round"/></g>
  <!-- kapgir -->
  <g transform="rotate(28 520 120)"><rect x="512" y="10" width="12" height="160" rx="6" fill="#8C5A2B"/><ellipse cx="518" cy="188" rx="34" ry="24" fill="#9AA0A6"/>
  ${[-14, 0, 14].map((dx) => [-8, 6].map((dy) => `<circle cx="${518 + dx}" cy="${188 + dy}" r="3.5" fill="#5F656B"/>`).join("")).join("")}</g>
  <!-- bug' -->
  ${[0, 1, 2].map((i) => `<path d="M${260 + i * 50} 60 q-14-20 0-40 q14-20 0-40" stroke="#fff" stroke-width="5" fill="none" opacity=".25" stroke-linecap="round"/>`).join("")}
  `, ["#3A1E14", "#140A06"]),

  // 2. Chust do'ppisi
  "doppi.svg": svg(`
  <ellipse cx="320" cy="335" rx="210" ry="30" fill="#000" opacity=".35"/>
  <!-- tanasi (to'rt qirrali) -->
  <path d="M130 300 L170 150 Q320 95 470 150 L510 300 Q320 335 130 300z" fill="#101014"/>
  <path d="M320 112 L320 318" stroke="#2A2A33" stroke-width="3"/>
  <path d="M170 150 Q320 210 470 150" stroke="#2A2A33" stroke-width="3" fill="none"/>
  <!-- jiyak -->
  <path d="M130 300 Q320 335 510 300 L506 280 Q320 316 134 280z" fill="#F2F2F2"/>
  <path d="M134 280 Q320 316 506 280" stroke="#101014" stroke-width="2" stroke-dasharray="6 6" fill="none"/>
  <!-- qalampir naqshlari -->
  ${[[220, 230, -8], [418, 230, 8]].map(([x, y, r]) => `
  <g transform="translate(${x} ${y}) rotate(${r})">
    <path d="M0 -55 C 40 -40, 42 20, 4 52 C 0 30, -14 10, -10 -10 C -8 -30, -6 -45, 0 -55z" fill="#F7F7F7"/>
    <path d="M0 -55 C -6 -66, 4 -74, 10 -70" stroke="#F7F7F7" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M2 -40 C 22 -28, 22 10, 4 34" stroke="#101014" stroke-width="3" fill="none"/>
    <circle cx="-26" cy="-30" r="5" fill="#F7F7F7"/><circle cx="30" cy="40" r="5" fill="#F7F7F7"/>
  </g>`).join("")}
  <!-- burchak kamonlari -->
  ${[[178, 160], [462, 160]].map(([x, y]) => `<path d="M${x - 14} ${y + 10} q14-30 28 0" stroke="#F7F7F7" stroke-width="5" fill="none" stroke-linecap="round"/>`).join("")}
  <path d="M300 130 q20-22 40 0" stroke="#F7F7F7" stroke-width="5" fill="none" stroke-linecap="round"/>
  `, ["#1B3A5C", "#0A1626"]),

  // 3. Paxta chanog'i
  "paxta.svg": svg(`
  ${stars(0)}
  <circle cx="540" cy="70" r="40" fill="#FFD166" opacity=".9"/>
  <path d="M0 330 q160-40 320 0 t320 0 v70 h-640z" fill="#2E5E2A"/>
  <!-- poya -->
  <path d="M320 400 C 318 340, 330 300, 320 250" stroke="#5B3A1E" stroke-width="10" fill="none" stroke-linecap="round"/>
  <path d="M322 320 C 360 300, 400 300, 430 280" stroke="#5B3A1E" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M318 300 C 280 290, 250 290, 220 275" stroke="#5B3A1E" stroke-width="6" fill="none" stroke-linecap="round"/>
  <!-- barglar -->
  <path d="M430 280 c40-30 80-10 70 30 c-30 20-70 10-70-30z" fill="#3F8A3A"/>
  <path d="M220 275 c-40-30-80-10-70 30 c30 20 70 10 70-30z" fill="#3F8A3A"/>
  <!-- chanoq (qo'ng'ir kosacha) -->
  <path d="M250 250 q70 40 140 0 l-20 30 q-50 25-100 0z" fill="#6B4423"/>
  <path d="M262 252 l-16-26 M378 252 l16-26 M320 262 v-24" stroke="#6B4423" stroke-width="10" stroke-linecap="round"/>
  <!-- oq tolalar -->
  <g fill="#FFFFFF">
    <circle cx="275" cy="200" r="48"/><circle cx="365" cy="200" r="48"/><circle cx="320" cy="160" r="52"/>
    <circle cx="300" cy="225" r="34"/><circle cx="342" cy="225" r="34"/>
  </g>
  <g fill="none" stroke="#E4E6EE" stroke-width="3"><path d="M270 190 q15-20 30-5"/><path d="M340 180 q15-18 30 0"/><path d="M305 140 q15-14 30 0"/></g>
  <!-- ikkinchi kichik chanoq -->
  <g transform="translate(470 230) scale(.45)"><g fill="#FFFFFF"><circle cx="-45" cy="0" r="48"/><circle cx="45" cy="0" r="48"/><circle cx="0" cy="-40" r="52"/></g><path d="M-70 40 q70 40 140 0" stroke="#6B4423" stroke-width="18" fill="none" stroke-linecap="round"/></g>
  <g transform="translate(170 228) scale(.4)"><g fill="#FFFFFF"><circle cx="-45" cy="0" r="48"/><circle cx="45" cy="0" r="48"/><circle cx="0" cy="-40" r="52"/></g><path d="M-70 40 q70 40 140 0" stroke="#6B4423" stroke-width="18" fill="none" stroke-linecap="round"/></g>
  `, ["#5DA9E9", "#BFE3FF"]),

  // 4. Kalta Minor (Xiva)
  "kalta-minor.svg": svg(`
  <circle cx="110" cy="80" r="36" fill="#FFE29A"/>
  <path d="M0 330 h640 v70 h-640z" fill="#C9A26B"/>
  <!-- qal'a devori -->
  <path d="M0 300 h640 v40 h-640z" fill="#B88A55"/>
  ${Array.from({ length: 16 }, (_, i) => `<path d="M${i * 40 + 4} 300 q16-24 32 0z" fill="#B88A55"/>`).join("")}
  <!-- minora: keng, kalta, yo'l-yo'l koshinlar -->
  <path d="M220 330 L245 90 Q320 78 395 90 L420 330z" fill="#E7C98E"/>
  ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
    const y = 110 + i * 28, t = (y - 90) / 240, xl = 245 - 25 * t, xr = 395 + 25 * t;
    const col = ["#1F8FB3", "#2DB6C8", "#F4F1E8", "#1F6E9C"][i % 4];
    return `<path d="M${xl} ${y} L${xr} ${y} L${xr + 2.1} ${y + 14} L${xl - 2.1} ${y + 14}z" fill="${col}"/>` +
      (i % 2 ? Array.from({ length: 9 }, (_, k) => `<rect x="${xl + 10 + k * ((xr - xl - 20) / 9)}" y="${y + 4}" width="8" height="6" fill="#0E4B6B" opacity=".6"/>`).join("") : "");
  }).join("")}
  <path d="M245 90 Q320 78 395 90 L393 104 Q320 92 247 104z" fill="#2DB6C8"/>
  <!-- eshik -->
  <path d="M300 330 v-46 q20-26 40 0 v46z" fill="#6B4A2A"/>
  <!-- yonidagi kichik gumbaz -->
  <path d="M460 300 v-50 h100 v50z" fill="#D9B680"/>
  <path d="M470 250 q40-60 80 0z" fill="#2DB6C8"/>
  <path d="M80 300 v-40 h90 v40z" fill="#D9B680"/>
  <path d="M90 260 q35-46 70 0z" fill="#1F8FB3"/>
  `, ["#F7B26A", "#FBE3B9"]),

  // 5. Ulug'bek rasadxonasi sekstanti
  "sekstant.svg": svg(`
  ${stars(90, 7, 260)}
  <path d="M560 60 a28 28 0 1 0 22 46 a22 22 0 1 1 -22 -46z" fill="#FFE29A"/>
  <!-- tepalik va bino kesimi -->
  <path d="M0 360 q320-50 640 0 v40 h-640z" fill="#2A2244"/>
  <!-- yer ostidagi ulkan yoy -->
  <path d="M120 360 A230 230 0 0 1 350 130" stroke="#C8A16A" stroke-width="44" fill="none"/>
  <path d="M120 360 A230 230 0 0 1 350 130" stroke="#8E6A3E" stroke-width="44" fill="none" stroke-dasharray="2 22" opacity=".9"/>
  <path d="M150 360 A200 200 0 0 1 350 160" stroke="#E9D3A8" stroke-width="6" fill="none"/>
  <path d="M90 360 A260 260 0 0 1 350 100" stroke="#E9D3A8" stroke-width="6" fill="none"/>
  <!-- darajalar -->
  ${Array.from({ length: 19 }, (_, i) => {
    const a = Math.PI + (i / 18) * (Math.PI / 2), cx = 350, cy = 360;
    const r1 = 255, r2 = i % 3 ? 245 : 238;
    return `<line x1="${(cx + r1 * Math.cos(a)).toFixed(1)}" y1="${(cy + r1 * Math.sin(a)).toFixed(1)}" x2="${(cx + r2 * Math.cos(a)).toFixed(1)}" y2="${(cy + r2 * Math.sin(a)).toFixed(1)}" stroke="#3B2A16" stroke-width="2"/>`;
  }).join("")}
  <!-- zinapoya -->
  ${Array.from({ length: 8 }, (_, i) => `<rect x="${360 + i * 14}" y="${360 - (i + 1) * 26}" width="14" height="${(i + 1) * 26}" fill="#6B5233"/>`).join("")}
  <!-- yulduzlarga chiziq -->
  <line x1="350" y1="360" x2="470" y2="60" stroke="#FFD166" stroke-width="2" stroke-dasharray="6 6" opacity=".8"/>
  <g transform="translate(470 60)"><path d="M0-14 L4-4 L14 0 L4 4 L0 14 L-4 4 L-14 0 L-4-4z" fill="#FFD166"/></g>
  <!-- olim siluyeti -->
  <g fill="#120C2B"><circle cx="520" cy="290" r="12"/><path d="M505 360 q0-55 15-58 q15 3 15 58z"/><path d="M510 280 q10-16 20 0z"/></g>
  `, ["#0B1640", "#1D1446"]),

  // 6. Daraxt va olma
  "olma.svg": svg(`
  <path d="M0 330 q320-30 640 0 v70 h-640z" fill="#4C9A3F"/>
  <!-- daraxt -->
  <path d="M190 340 q10-80 0-150 q-5-30 14-40 q20 10 14 40 q-10 70 6 150z" fill="#7A4B25"/>
  <g fill="#2F7D32"><circle cx="205" cy="120" r="90"/><circle cx="130" cy="150" r="60"/><circle cx="280" cy="150" r="65"/><circle cx="170" cy="70" r="55"/><circle cx="250" cy="72" r="55"/></g>
  <g fill="#E53935">${[[150, 120], [240, 100], [290, 170], [120, 170], [200, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10"/>`).join("")}</g>
  <!-- tushayotgan olma -->
  <g transform="translate(330 150)"><circle r="16" fill="#E53935"/><path d="M0-16 q2-10 8-12" stroke="#5B3A1E" stroke-width="3" fill="none"/><path d="M4-18 q10-8 16 0 q-8 6-16 0z" fill="#43A047"/></g>
  <path d="M330 178 v60" stroke="#fff" stroke-width="3" stroke-dasharray="6 8" opacity=".8"/>
  <path d="M320 232 l10 14 l10-14" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/>
  <!-- daraxt tagida o'tirgan odam (parik, kitob) -->
  <g transform="translate(330 270)">
    <path d="M-40 60 q0-50 40-56 q40 6 40 56z" fill="#3B3F7A"/>
    <circle cx="0" cy="-20" r="20" fill="#F1C7A1"/>
    <path d="M-24-22 q2-26 24-28 q22 2 24 28 q4 30-4 40 q-4-20-6-30 q-14 6-28 0 q-2 10-6 30 q-8-10-4-40z" fill="#EDEDED"/>
    <rect x="-30" y="22" width="34" height="24" rx="3" fill="#C62828" transform="rotate(-10)"/>
    <line x1="-14" y1="22" x2="-12" y2="44" stroke="#FFCDD2" stroke-width="2"/>
  </g>
  <!-- savol belgisi -->
  <text x="420" y="230" font-family="Arial, sans-serif" font-weight="900" font-size="64" fill="#FFD166">?</text>
  `, ["#8ED0FF", "#E5F6FF"]),

  // 7. Uch madrasa
  "uch-madrasa.svg": svg(`
  <path d="M0 330 h640 v70 h-640z" fill="#D8C29A"/>
  ${[[20, 0.8], [220, 1], [440, 0.8]].map(([x, s]) => {
    const w = 180 * s, h = 230 * s, top = 330 - h, cx = x + 90;
    const pw = 86 * s;
    return `
    <g>
      <!-- minoralar -->
      <rect x="${cx - w / 2 - 10}" y="${top - 30 * s}" width="${18 * s}" height="${h + 30 * s}" fill="#C9A46A"/>
      <rect x="${cx + w / 2 - 8 * s}" y="${top - 30 * s}" width="${18 * s}" height="${h + 30 * s}" fill="#C9A46A"/>
      <rect x="${cx - w / 2 - 14}" y="${top - 40 * s}" width="${26 * s}" height="${12 * s}" fill="#1F8FB3"/>
      <rect x="${cx + w / 2 - 12 * s}" y="${top - 40 * s}" width="${26 * s}" height="${12 * s}" fill="#1F8FB3"/>
      <!-- old devor -->
      <rect x="${cx - w / 2}" y="${top}" width="${w}" height="${h}" fill="#E2C48F"/>
      <!-- gumbaz -->
      <path d="M${cx + w / 2 - 5} ${top + 10} q${24 * s}-${70 * s} ${48 * s} 0z" fill="#2DB6C8"/>
      <!-- peshtoq -->
      <rect x="${cx - pw / 2 - 10 * s}" y="${top - 14 * s}" width="${pw + 20 * s}" height="${h + 14 * s}" fill="#1F6E9C"/>
      <path d="M${cx - pw / 2} ${330} v-${h * 0.62} q${pw / 2}-${pw * 0.9} ${pw} 0 v${h * 0.62}z" fill="#0E3B57"/>
      <path d="M${cx - pw / 2 + 8 * s} ${330} v-${h * 0.56} q${pw / 2 - 8 * s}-${pw * 0.75} ${pw - 16 * s} 0 v${h * 0.56}z" fill="#163E5C" stroke="#2DB6C8" stroke-width="${2 * s}"/>
      ${Array.from({ length: 6 }, (_, i) => `<rect x="${cx - pw / 2 - 6 * s + i * (pw + 12 * s) / 6}" y="${top - 8 * s}" width="${(pw + 12 * s) / 6 - 3}" height="${8 * s}" fill="${i % 2 ? "#F4F1E8" : "#2DB6C8"}"/>`).join("")}
      <!-- kichik ravoqlar -->
      ${[-1, 1].map((d) => `<path d="M${cx + d * (pw / 2 + 26 * s) - 12 * s} ${330 - 40 * s} v-${40 * s} q${12 * s}-${20 * s} ${24 * s} 0 v${40 * s}z" fill="#9A7A45"/><path d="M${cx + d * (pw / 2 + 26 * s) - 12 * s} ${top + 70 * s} v-${36 * s} q${12 * s}-${18 * s} ${24 * s} 0 v${36 * s}z" fill="#9A7A45"/>`).join("")}
    </g>`;
  }).join("")}
  `, ["#7EC8F2", "#F7E7C4"]),

  // Javobdan keyingi rasm: Xiva
  "xiva-reveal.svg": svg(`
  <rect x="40" y="40" width="560" height="320" rx="28" fill="#fff" opacity=".06"/>
  <text x="320" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="78" fill="#FFD166">XIVA</text>
  <text x="320" y="210" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="30" fill="#FFFFFF">Ichan qal'a · Kalta Minor</text>
  <text x="320" y="262" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#B9B3E6">Balandligi ~29 m · diametri ~14 m</text>
  <text x="320" y="310" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#B9B3E6">UNESCO Butunjahon merosi (1990)</text>
  `),
};

for (const [name, s] of Object.entries(IMAGES)) writeFileSync(new URL(name, MEDIA), s);
const old = new URL("uz-flag.svg", MEDIA);
if (existsSync(old)) unlinkSync(old);

const own = { source: "Uzquiz jamoasi", licence: "own", holder: "Uzquiz" };
const img = (src, alt) => ({ type: "image", src: `media/${src}`, alt, rights: { ...own } });

const ROUND = {
  title: "Rasminka",
  icon: "🖼️",
  color: "#7C5CFF",
  description: "Rasmga diqqat bilan qarang, mantiqni toping va javobni o'zingiz yozing. Variantlar yo'q — faqat zukkoligingiz! Yozish xatolari va kirill yozuvi ham qabul qilinadi.",
  kind: "standard",
  timeLimit: 45,
  points: 10,
  questions: [
    {
      type: "text", text: "Bu qaysi milliy taom?",
      media: img("qozon.svg", "Olov ustidagi qora qozonda guruch, sariq va to'q sariq sabzi, ustida sarimsoq piyoz; yonida kapgir"),
      answer: "Osh", alts: ["Palov", "Plov", "Osh palov", "Oshi palov"], keywords: ["palov"], hint: "count",
      fact: "«Palov madaniyati va an'analari» 2016-yilda YUNESKOning nomoddiy madaniy meros ro'yxatiga kiritilgan.",
    },
    {
      type: "text", text: "Bu bosh kiyim qanday ataladi?",
      media: img("doppi.svg", "Qora to'rt qirrali bosh kiyim, ustida oq qalampir shaklidagi naqshlar"),
      answer: "Do'ppi", alts: ["Chust do'ppi", "Chust do'ppisi", "Tyubeteyka"], keywords: ["do'ppi"], hint: "letters",
      fact: "Qora fonda oq «qalampir» naqshli bu do'ppi Chust do'ppisi deb ataladi. Qalampir yovuz ko'zdan asraydi deb hisoblangan.",
    },
    {
      type: "text", text: "O'zbekistonda «oq oltin» deb ataladigan bu o'simlik nima?",
      media: img("paxta.svg", "Oq momiq tolali chanoqlari ochilgan o'simlik shoxi, quyoshli dala"),
      answer: "Paxta", alts: ["G'o'za", "Paxta o'simligi"], hint: "count",
      fact: "Paxta chanoqlari O'zbekiston Respublikasi Davlat gerbida bug'doy boshoqlari bilan birga tasvirlangan.",
    },
    {
      type: "text", text: "Bu keng va kalta, oxiriga yetkazilmagan minora qaysi shaharda joylashgan?",
      media: img("kalta-minor.svg", "Ko'k va feruza koshinli yo'l-yo'l keng, past minora, atrofida qal'a devori"),
      reveal: img("xiva-reveal.svg", "Xiva, Ichan qal'a, Kalta Minor haqida ma'lumot kartasi"),
      answer: "Xiva", alts: ["Khiva", "Ichan qal'a"], partial: ["Xorazm"], hint: "none",
      fact: "Kalta Minor 1851-yilda qurila boshlangan. Muhammad Aminxon vafotidan so'ng qurilish to'xtab qolgan.",
    },
    {
      type: "text", text: "Yer ostiga qazilgan bu ulkan yoy qaysi olimning rasadxonasiga tegishli?",
      media: img("sekstant.svg", "Tungi osmon ostida yerga chuqur kirib borgan ulkan darajali yoy, zinapoya va yulduzga yo'nalgan chiziq"),
      answer: "Ulug'bek", alts: ["Mirzo Ulug'bek", "Ulugbek"], keywords: ["ulug'bek"], partial: ["Samarqand"], hint: "letters",
      fact: "Ulug'bek rasadxonasi XV asrda Samarqandda qurilgan. «Ziji jadidi Ko'ragoniy» jadvalida 1018 ta yulduz o'rni ko'rsatilgan.",
    },
    {
      type: "text", text: "Rasm qaysi olim va uning mashhur kashfiyotiga ishora qilmoqda? Olimning ismini yozing.",
      media: img("olma.svg", "Olma daraxti ostida parikli kishi kitob bilan o'tiribdi, uning tepasiga olma tushmoqda"),
      answer: "Nyuton", alts: ["Isaak Nyuton", "Newton", "Isaac Newton", "Nyuton Isaak"], keywords: ["nyuton", "newton"], partial: ["Tortishish qonuni", "Gravitatsiya", "Tortishish"], hint: "count",
      fact: "Rivoyatga ko'ra, daraxtdan tushgan olma Isaak Nyutonni butun olam tortishish qonuni haqida o'ylashga undagan.",
    },
    {
      type: "text", text: "Uchta madrasa bir-biriga qarab turgan bu mashhur maydon qanday ataladi?",
      media: img("uch-madrasa.svg", "Uchta baland peshtoqli, minorali va feruza gumbazli madrasa bir maydonda"),
      answer: "Registon", alts: ["Registon maydoni", "Registan"], keywords: ["registon"], partial: ["Samarqand"], hint: "letters",
      fact: "Registon maydonini Ulug'bek (XV asr), Sherdor va Tillakori (XVII asr) madrasalari o'rab turadi.",
    },
  ],
};

const packUrl = new URL("pack.json", DIR);
const pack = JSON.parse(readFileSync(packUrl, "utf8"));
pack.rounds[0] = ROUND;
pack.description = "Asl Uzquiz o'yini: «Rasminka» rasmli topishmoqlari, bilimdonlar bellashuvi, so'z zanjiri, kino, musiqa va yashirin mavzu — 6 raund, 42 savol.";
writeFileSync(packUrl, JSON.stringify(pack, null, 2) + "\n");
console.log("Rasminka: 7 savol, rasmlar →", Object.keys(IMAGES).join(", "));
