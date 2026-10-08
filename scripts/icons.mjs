// Renders public/icon.svg to the PNG sizes the manifest and iOS need. Run once: node scripts/icons.mjs
import pw from "playwright"; const { chromium } = pw; // npm i -D playwright, or use a global install
import { readFileSync } from "node:fs";
const svg = readFileSync(new URL("../public/icon.svg", import.meta.url), "utf8");
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [size, name] of [[192, "icon-192.png"], [512, "icon-512.png"], [180, "apple-touch-icon.png"]]) {
  await page.setViewportSize({ width: size, height: size });
  // iOS rounds the corners itself and fills transparency with black, so its icon is full-bleed.
  const src = name === "apple-touch-icon.png" ? svg.replace('rx="112"', 'rx="0"') : svg;
  await page.setContent(`<style>html,body{margin:0}svg{width:${size}px;height:${size}px;display:block}</style>${src}`);
  await page.screenshot({ path: new URL(`../public/${name}`, import.meta.url).pathname, omitBackground: true });
}
await browser.close();
