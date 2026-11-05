// Uzquiz — o'zbek lotin ↔ kirill yozuvi (2.2). UI'siz qism Node testlarida ham ishlaydi.
// O'yinchi «Sozlamalar → Yozuv» orqali tanlaydi. Matnlar va paket mazmuni qaysi yozuvda
// yozilgan bo'lishidan qat'i nazar, ekranda tanlangan yozuvda ko'rsatiladi.

const APOS = /[‘’ʻʼ`´′']/;
const LAT_VOWELS = "aeiou";
const CYR_VOWELS = "аеёиоуўэюя";
const HAS_LAT = /[A-Za-z]/;
const HAS_CYR = /[Ѐ-ӿ]/;

/** Kirillga o'girilmaydigan so'zlar (brend va texnik nomlar). */
const KEEP = new Set(["uzquiz", "github", "chrome", "iphone", "ipad", "ios", "android", "pwa", "webp", "mp3", "mp4", "wav", "ok"]);

const L2C = { a: "а", b: "б", d: "д", f: "ф", g: "г", h: "ҳ", i: "и", j: "ж", k: "к", l: "л", m: "м", n: "н", o: "о", p: "п", q: "қ", r: "р", s: "с", t: "т", u: "у", v: "в", x: "х", z: "з", c: "с", w: "в" };
const C2L = { а: "a", б: "b", в: "v", г: "g", ғ: "g'", д: "d", ё: "yo", ж: "j", з: "z", и: "i", й: "y", к: "k", қ: "q", л: "l", м: "m", н: "n", о: "o", ў: "o'", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x", ҳ: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "'", ь: "", ы: "i", э: "e", ю: "yu", я: "ya" };

const isLatLetter = (c) => !!c && /[a-z]/i.test(c);
const isCyrLetter = (c) => !!c && HAS_CYR.test(c);

/** Bu so'z kirillga o'girilmasin: kimyoviy formula, brend, havola, inglizcha yozuv va h.k. */
function keepWord(tok) {
  const bare = tok.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
  if (!HAS_LAT.test(tok)) return true;
  if (KEEP.has(bare)) return true;
  if (/[₀-₉⁰-⁹]/.test(tok)) return true;                  // H₂O, CO₂
  if (/\d/.test(tok) && /[A-Z]/.test(tok)) return true;     // 3D, MP4
  if (/c(?!h)|w/i.test(tok)) return true;                   // NaCl, Newton — o'zbek alifbosida yo'q harflar
  if (/^[a-z]+[A-Z]/.test(tok)) return true;                // iPhone, eBay
  if (/https?:|www\.|@|#\/|\.(com|uz|io|org)\b/i.test(tok)) return true;
  return false;
}

function wordToCyr(w) {
  let out = "";
  const allUpper = w.length > 1 && w === w.toUpperCase() && /[A-Z]{2}/.test(w);
  for (let i = 0; i < w.length; i++) {
    const ch = w[i], lo = ch.toLowerCase(), up = ch !== lo;
    const n1 = w[i + 1] || "", n1l = n1.toLowerCase(), prev = w[i - 1] || "";
    let cy = null, step = 1;
    if ((lo === "o" || lo === "g") && APOS.test(n1)) { cy = lo === "o" ? "ў" : "ғ"; step = 2; }
    else if (lo === "s" && n1l === "h") { cy = "ш"; step = 2; }
    else if (lo === "c" && n1l === "h") { cy = "ч"; step = 2; }
    else if (lo === "y" && n1l === "o" && !APOS.test(w[i + 2] || "")) { cy = "ё"; step = 2; }
    else if (lo === "y" && n1l === "u") { cy = "ю"; step = 2; }
    else if (lo === "y" && n1l === "a") { cy = "я"; step = 2; }
    else if (lo === "y" && n1l === "e") { cy = "е"; step = 2; }
    else if (lo === "y") cy = "й";
    else if (lo === "e") cy = !isLatLetter(prev) || LAT_VOWELS.includes(prev.toLowerCase()) ? "э" : "е";
    else if (APOS.test(ch)) cy = isLatLetter(prev) && isLatLetter(n1) ? "ъ" : ch;
    else if (L2C[lo]) cy = L2C[lo];
    if (cy === null) { out += ch; continue; }
    out += up || (allUpper && cy !== ch) ? cy.toUpperCase() : cy;
    i += step - 1;
  }
  return out;
}

/** Lotin → kirill (katta-kichik harf saqlanadi). */
export function toCyrillic(text) {
  return String(text ?? "").split(/(\s+)/).map((tok) => (/^\s+$/.test(tok) || keepWord(tok) ? tok : wordToCyr(tok))).join("");
}

/** Kirill → lotin (katta-kichik harf saqlanadi). */
export function cyrToLat(text) {
  const s = String(text ?? "");
  if (!HAS_CYR.test(s)) return s;
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i], lo = ch.toLowerCase(), up = ch !== lo;
    if (!isCyrLetter(ch)) { out += ch; continue; }
    const prev = (s[i - 1] || "").toLowerCase();
    let la;
    if (lo === "е") la = !isCyrLetter(prev) || CYR_VOWELS.includes(prev) || prev === "ъ" || prev === "ь" ? "ye" : "e";
    else la = C2L[lo] ?? ch;
    if (up && la) {
      const nextUp = s[i + 1] && isCyrLetter(s[i + 1]) && s[i + 1] !== s[i + 1].toLowerCase();
      const prevUp = s[i - 1] && isCyrLetter(s[i - 1]) && s[i - 1] !== s[i - 1].toLowerCase();
      la = nextUp || prevUp ? la.toUpperCase() : la.charAt(0).toUpperCase() + la.slice(1);
    }
    out += la;
  }
  return out;
}

/** Matnni tanlangan yozuvga keltirish: "lat" yoki "cyr". */
export function convert(text, script) {
  const s = String(text ?? "");
  if (script === "cyr") return HAS_LAT.test(s) ? toCyrillic(s) : s;
  return HAS_CYR.test(s) ? cyrToLat(s) : s;
}

/* ---------- DOM: ekrandagi matnlarni avtomatik o'girish ---------- */
const ATTRS = ["placeholder", "aria-label", "title", "alt"];
const skip = (el) => !el || el.closest?.("[data-keep], script, style, textarea, code");

function convertNode(node, script) {
  if (node.nodeType === 3) {
    if (skip(node.parentElement)) return;
    const v = convert(node.data, script);
    if (v !== node.data) node.data = v;
    return;
  }
  if (node.nodeType !== 1 || skip(node)) return;
  for (const a of ATTRS) {
    const old = node.getAttribute(a);
    if (old) { const v = convert(old, script); if (v !== old) node.setAttribute(a, v); }
  }
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n;
  while ((n = walker.nextNode())) {
    if (n.nodeType === 3) convertNode(n, script);
    else if (!skip(n)) for (const a of ATTRS) { const old = n.getAttribute(a); if (old) { const v = convert(old, script); if (v !== old) n.setAttribute(a, v); } }
  }
}

/** Butun sahifani kuzatib, yangi paydo bo'lgan matnlarni tanlangan yozuvga o'giradi. */
export function watchScript(root, getScript) {
  const run = (node) => convertNode(node, getScript());
  const obs = new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === "childList") m.addedNodes.forEach(run);
      else if (m.type === "characterData") run(m.target);
      else if (m.type === "attributes") run(m.target);
    }
  });
  obs.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  run(root);
  return { refresh: () => run(root), stop: () => obs.disconnect() };
}
