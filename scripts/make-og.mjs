/**
 * Genera og-image.png (1200×630) a partir de scripts/og.html
 * usando un Chromium headless en modo --screenshot.
 *
 * Uso:   node scripts/make-og.mjs
 *
 * Define CHROME_BIN si tu binario de Chrome/Chromium está en otra ruta:
 *   CHROME_BIN=/ruta/a/chrome node scripts/make-og.mjs
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const htmlPath = join(here, "og.html");
const outPath = join(root, "og-image.png");

const candidates = [
  process.env.CHROME_BIN,
  "google-chrome",
  "chromium",
  "chromium-browser",
].filter(Boolean);

let ok = false;
for (const bin of candidates) {
  try {
    execFileSync(
      bin,
      [
        "--headless",
        "--no-sandbox",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        "--window-size=1200,630",
        `--screenshot=${outPath}`,
        "--virtual-time-budget=4000",
        `file://${htmlPath}`,
      ],
      { stdio: "ignore" }
    );
    ok = true;
    console.log(`✓ og-image.png generada con: ${bin}`);
    break;
  } catch {
    /* prueba el siguiente candidato */
  }
}

if (!ok) {
  console.error(
    "No se encontró Chrome/Chromium. Define CHROME_BIN con la ruta al binario."
  );
  process.exit(1);
}
