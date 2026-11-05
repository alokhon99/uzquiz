// One-off: converts the v1 question bank (app/js/questions.js) into the "klassik" pack.
import { writeFileSync, mkdirSync } from "node:fs";
import { ROUNDS } from "./legacy/questions-v1.js";
import { migrateV1, serializePack, validatePack } from "../app/js/pack.js";

const flag = ROUNDS[0].questions.find((q) => q.imageSvg).imageSvg
  .replace(' role="img" aria-label="Bayroq"', "");
mkdirSync("app/packs/klassik/media", { recursive: true });
writeFileSync("app/packs/klassik/media/uz-flag.svg", flag.trim() + "\n");
const pack = migrateV1(ROUNDS);
const v = validatePack(pack);
if (v.errors.length) { console.error(v.errors); process.exit(1); }
writeFileSync("app/packs/klassik/pack.json", serializePack(pack));
console.log("klassik:", pack.rounds.length, "rounds,", pack.rounds.reduce((n, r) => n + r.questions.length, 0), "questions");
