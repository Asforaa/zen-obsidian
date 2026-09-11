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
  "vendor/hider/release/main.js",
  "vendor/hider/release/manifest.json",
  "vendor/hider/release/styles.css",
  "vendor/hider/LICENSE",
  "presets/hider.json",
  "presets/vertical-tabs.json",
  "examples/Start Here.md",
  "optional/modern-outline/release/main.js",
  "optional/modern-outline/source/LICENSE",
  "optional/tab-switcher/release/main.js",
  "optional/tab-switcher/release/manifest.json",
  "optional/tab-switcher/preset.json",
  "optional/tab-switcher/source/src/main.ts",
  "optional/tab-switcher/LICENSE",
];

for (const path of required) await access(resolve(root, path));
const pluginManifest = JSON.parse(await readFile(resolve(root, "release/vertical-tabs/manifest.json"), "utf8"));
const themeManifest = JSON.parse(await readFile(resolve(root, "theme/Zen AMOLED/manifest.json"), "utf8"));
const hiderManifest = JSON.parse(await readFile(resolve(root, "vendor/hider/release/manifest.json"), "utf8"));
const tabSwitcherManifest = JSON.parse(await readFile(resolve(root, "optional/tab-switcher/release/manifest.json"), "utf8"));
if (pluginManifest.name !== "Vertical Tabs" || pluginManifest.id !== "brave-tabs") {
  throw new Error("Unexpected Vertical Tabs manifest identity");
}
if (themeManifest.name !== "Zen AMOLED") throw new Error("Unexpected theme identity");
if (hiderManifest.id !== "obsidian-hider" || hiderManifest.version !== "1.7.1") {
  throw new Error("Unexpected Hider release");
}
if (tabSwitcherManifest.id !== "cycle-through-panes" || tabSwitcherManifest.version !== "1.5.2") {
  throw new Error("Unexpected Tab Switcher release");
}
console.log(`Verified ${required.length} required files.`);
console.log(`Vertical Tabs ${pluginManifest.version}; ${themeManifest.name} ${themeManifest.version}; Hider ${hiderManifest.version}; Tab Switcher ${tabSwitcherManifest.version}.`);
