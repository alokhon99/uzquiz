// Muharrirdagi hali nashr qilinmagan media fayllar uchun IndexedDB ombori.
// Kalit: "<packId>/<src>" (masalan, "kino-90/media/ab12cd.webp"), qiymat: Blob.
const DB = "uzquiz-admin";
const STORE = "media";

function open() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("IndexedDB yo'q"));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function tx(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const st = t.objectStore(STORE);
    const out = fn(st);
    t.oncomplete = () => { db.close(); resolve(out && "result" in out ? out.result : undefined); };
    t.onerror = () => { db.close(); reject(t.error); };
  });
}
export const mediaStore = {
  put: (key, blob) => tx("readwrite", (s) => s.put(blob, key)),
  get: (key) => tx("readonly", (s) => s.get(key)),
  del: (key) => tx("readwrite", (s) => s.delete(key)),
  keys: () => tx("readonly", (s) => s.getAllKeys()),
};
