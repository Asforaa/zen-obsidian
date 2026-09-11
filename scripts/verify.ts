import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const required = [
  "release/vertical-tabs/main.js",
  "release/vertical-tabs/manifest.json",
  "release/vertical-tabs/styles.css",
  "packages/vertical-tabs/src/main.ts",
  "theme/Zen AMOLED/manifest.json",
  "theme/Zen AMOLED/theme.css",
  "theme/Zen AMOLED/LICENSE",
  "snippets/Zen Obsidian.css",
  "optional/modern-outline/release/main.js",
  "optional/modern-outline/source/LICENSE",
];

for (const path of required) await access(resolve(root, path));
const pluginManifest = JSON.parse(await readFile(resolve(root, "release/vertical-tabs/manifest.json"), "utf8"));
const themeManifest = JSON.parse(await readFile(resolve(root, "theme/Zen AMOLED/manifest.json"), "utf8"));
if (pluginManifest.name !== "Vertical Tabs" || pluginManifest.id !== "brave-tabs") {
  throw new Error("Unexpected Vertical Tabs manifest identity");
}
if (themeManifest.name !== "Zen AMOLED") throw new Error("Unexpected theme identity");
console.log(`Verified ${required.length} required files.`);
console.log(`Vertical Tabs ${pluginManifest.version}; ${themeManifest.name} ${themeManifest.version}.`);

