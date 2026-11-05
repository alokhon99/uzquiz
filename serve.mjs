// Uzquiz uchun oddiy statik server (faqat lokal ishlab chiqish uchun): node serve.mjs [port]
import http from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { extname, join, normalize, basename } from "node:path";
import { fileURLToPath } from "node:url";

const base = fileURLToPath(new URL(".", import.meta.url));
const root = join(base, "app");
const testsRoot = join(base, "tests");
const uploadsDir = join(testsRoot, "_uploads");
const port = Number(process.env.PORT || process.argv[2] || 5173);
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".wav": "audio/wav", ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".ogg": "audio/ogg",
  ".mp4": "video/mp4", ".webm": "video/webm",
};

http.createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, "http://x").pathname);

    // POST /__upload/<name> — lokal test media fayllarini tests/_uploads/ ga saqlash (faqat dev uchun)
    if (req.method === "POST" && path.startsWith("/__upload/")) {
      const name = basename(path).replace(/[^a-z0-9._-]/gi, "");
      if (!name) throw new Error("bad name");
      const chunks = [];
      let size = 0;
      for await (const c of req) { size += c.length; if (size > 50 * 1024 * 1024) throw new Error("too big"); chunks.push(c); }
      await mkdir(uploadsDir, { recursive: true });
      await writeFile(join(uploadsDir, name), Buffer.concat(chunks));
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ ok: true, name, size }));
    }

    if (path.endsWith("/")) path += "index.html";
    // /__tests/* — faqat lokal E2E testlar uchun
    const dir = path.startsWith("/__tests/") ? testsRoot : root;
    if (dir === testsRoot) path = path.slice("/__tests".length);
    const file = normalize(join(dir, path));
    if (!file.startsWith(dir)) throw new Error("forbidden");
    const data = await readFile(file);
    const headers = { "Content-Type": types[extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-cache", "Accept-Ranges": "bytes" };
    // Range so'rovlari (Safari video/audio uchun talab qiladi)
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
    if (range) {
      const start = range[1] ? Number(range[1]) : Math.max(0, data.length - Number(range[2]));
      const end = range[1] && range[2] ? Math.min(Number(range[2]), data.length - 1) : data.length - 1;
      if (start >= data.length || start > end) { res.writeHead(416, { "Content-Range": `bytes */${data.length}` }); return res.end(); }
      res.writeHead(206, { ...headers, "Content-Range": `bytes ${start}-${end}/${data.length}`, "Content-Length": end - start + 1 });
      return res.end(data.subarray(start, end + 1));
    }
    res.writeHead(200, { ...headers, "Content-Length": data.length });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Topilmadi");
  }
})
  .on("error", (e) => {
    if (e.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use — Uzquiz may already be running at http://localhost:${port}`);
      console.error(`Use another port:  node serve.mjs ${port + 1}`);
      process.exit(1);
    }
    throw e;
  })
  .listen(port, () => console.log(`Uzquiz: http://localhost:${port}`));
