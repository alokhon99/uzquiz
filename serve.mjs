// Uzquiz uchun oddiy statik server: node serve.mjs [port]
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const base = fileURLToPath(new URL(".", import.meta.url));
const root = join(base, "app");
const testsRoot = join(base, "tests");
const port = Number(process.env.PORT || process.argv[2] || 5173);
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".json": "application/json", ".png": "image/png",
};

http.createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (path.endsWith("/")) path += "index.html";
    // /__tests/* — faqat lokal E2E testlar uchun
    const dir = path.startsWith("/__tests/") ? testsRoot : root;
    if (dir === testsRoot) path = path.slice("/__tests".length);
    const file = normalize(join(dir, path));
    if (!file.startsWith(dir)) throw new Error("forbidden");
    const data = await readFile(file);
    res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
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
