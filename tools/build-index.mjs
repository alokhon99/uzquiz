// Rebuilds app/packs/index.json from every app/packs/*/pack.json (the admin does the same in the browser).
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { catalogueEntry, serializeIndex, validatePack } from "../app/js/pack.js";

const dir = "app/packs";
const entries = [];
let bad = 0;
for (const id of readdirSync(dir)) {
  const f = `${dir}/${id}/pack.json`;
  if (!existsSync(f)) continue;
  const pack = JSON.parse(readFileSync(f, "utf8"));
  const v = validatePack(pack);
  if (v.errors.length) { bad++; console.error(id, v.errors); }
  entries.push(catalogueEntry(pack));
}
writeFileSync(`${dir}/index.json`, serializeIndex(entries));
console.log(entries.map((e) => `${e.id} (${e.questionCount}q, ${e.status}, media: ${e.mediaTypes.join("/") || "-"})`).join("\n"));
process.exit(bad ? 1 : 0);
