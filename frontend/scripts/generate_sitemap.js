// frontend/scripts/generate_sitemap.js
import { SitemapStream, streamToPromise } from "sitemap";
import { writeFileSync, readdirSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildSitemap() {
  const distDir = resolve(__dirname, "../dist");
  const backendStatic = resolve(__dirname, "../../backend/server/static");
  const hostname = "https://scoregenius.io";

  // Pages that must never be submitted for indexing. `app.html` is the PWA
  // shell, which robots.txt already keeps crawlers out of; `404.html` is the
  // error page, and listing it in a sitemap asserts that a real page lives at
  // /404; `splash_screen.html` is an internal PWA asset with no standalone
  // content. All three were being submitted.
  const notIndexable = new Set(["app.html", "404.html", "splash_screen.html"]);

  const pages = readdirSync(distDir)
    .filter((f) => f.endsWith(".html") && !notIndexable.has(f))
    .map((f) => (f === "index.html" ? "/" : `/${f.replace(".html", "")}`));

  const smStream = new SitemapStream({ hostname });
  pages.forEach((url) => smStream.write({ url, changefreq: "weekly" }));
  smStream.end();
  const xml = (await streamToPromise(smStream)).toString();

  mkdirSync(backendStatic, { recursive: true }); // 👈 ensure static/ exists
  writeFileSync(resolve(distDir, "sitemap.xml"), xml, "utf-8");
  writeFileSync(resolve(backendStatic, "sitemap.xml"), xml, "utf-8");

  console.log("✅ sitemap.xml written with", pages.length, "routes");
}

buildSitemap().catch((err) => {
  console.error("❌ sitemap generation failed", err);
  process.exit(1);
});
