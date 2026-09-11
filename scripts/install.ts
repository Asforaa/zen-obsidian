import { access, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const vaultArgument = args.find((arg) => !arg.startsWith("--"));
if (!vaultArgument || args.includes("--help")) {
  console.log("Usage: bun scripts/install.ts /absolute/path/to/vault [--configure] [--without-modern-outline] [--without-tab-switcher] [--replace] [--demo-note] [--dry-run]");
  process.exit(vaultArgument ? 0 : 1);
}

const dryRun = args.includes("--dry-run");
const configure = args.includes("--configure");
const replace = args.includes("--replace");
const withModernOutline = !args.includes("--without-modern-outline");
const withTabSwitcher = !args.includes("--without-tab-switcher");
const demoNote = args.includes("--demo-note");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const vault = resolve(vaultArgument);
const obsidian = join(vault, ".obsidian");
const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
const backupRoot = join(obsidian, "zen-obsidian-backups", stamp);
const actions: string[] = [];

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function sameFile(source: string, target: string): Promise<boolean> {
  if (!(await exists(target))) return false;
  const [left, right] = await Promise.all([readFile(source), readFile(target)]);
  return left.equals(right);
}

async function installFile(source: string, target: string): Promise<void> {
  if (await sameFile(source, target)) {
    actions.push(`skip identical ${relative(vault, target)}`);
    return;
  }

  if (await exists(target)) {
    if (!replace) {
      throw new Error(`Refusing to replace ${target}. Re-run with --replace to back it up first.`);
    }
    const backup = join(backupRoot, relative(obsidian, target));
    actions.push(`backup ${relative(vault, target)} -> ${relative(vault, backup)}`);
    if (!dryRun) {
      await mkdir(dirname(backup), { recursive: true });
      await cp(target, backup);
    }
  }

  actions.push(`install ${relative(vault, target)}`);
  if (!dryRun) {
    await mkdir(dirname(target), { recursive: true });
    await cp(source, target);
  }
}

async function installDirectory(source: string, target: string): Promise<void> {
  for (const entry of new Bun.Glob("**/*").scanSync({ cwd: source, onlyFiles: true })) {
    await installFile(join(source, entry), join(target, entry));
  }
}

async function preflightFile(source: string, target: string): Promise<void> {
  if (!(await exists(target)) || (await sameFile(source, target)) || replace) return;
  throw new Error(`Refusing to replace ${target}. Re-run with --replace to back it up first.`);
}

async function preflightDirectory(source: string, target: string): Promise<void> {
  for (const entry of new Bun.Glob("**/*").scanSync({ cwd: source, onlyFiles: true })) {
    await preflightFile(join(source, entry), join(target, entry));
  }
}

async function readJson<T>(path: string, fallback: T): Promise<T> {
  if (!(await exists(path))) return fallback;
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function writeMergedJson(path: string, value: unknown): Promise<void> {
  const next = `${JSON.stringify(value, null, 2)}\n`;
  if ((await exists(path)) && (await readFile(path, "utf8")) === next) {
    actions.push(`skip unchanged ${relative(vault, path)}`);
    return;
  }
  if (await exists(path)) {
    const backup = join(backupRoot, relative(obsidian, path));
    actions.push(`backup ${relative(vault, path)} -> ${relative(vault, backup)}`);
    if (!dryRun) {
      await mkdir(dirname(backup), { recursive: true });
      await cp(path, backup);
    }
  }
  actions.push(`merge ${relative(vault, path)}`);
  if (!dryRun) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, next);
  }
}

const hiderTarget = join(obsidian, "plugins", "obsidian-hider");
await preflightDirectory(join(root, "release", "vertical-tabs"), join(obsidian, "plugins", "brave-tabs"));
if (!(await exists(join(hiderTarget, "manifest.json"))) || replace) {
  await preflightDirectory(join(root, "vendor", "hider", "release"), hiderTarget);
}
await preflightDirectory(join(root, "theme", "Zen AMOLED"), join(obsidian, "themes", "Zen AMOLED"));
await preflightFile(join(root, "snippets", "Zen Obsidian.css"), join(obsidian, "snippets", "Zen Obsidian.css"));
if (withModernOutline) {
  await preflightDirectory(join(root, "optional", "modern-outline", "release"), join(obsidian, "plugins", "modern-outline"));
}
if (withTabSwitcher) {
  await preflightDirectory(join(root, "optional", "tab-switcher", "release"), join(obsidian, "plugins", "cycle-through-panes"));
}
if (demoNote) await preflightDirectory(join(root, "examples"), vault);

if (!dryRun) {
  await mkdir(vault, { recursive: true });
  await mkdir(obsidian, { recursive: true });
}

await installDirectory(join(root, "release", "vertical-tabs"), join(obsidian, "plugins", "brave-tabs"));
if ((await exists(join(hiderTarget, "manifest.json"))) && !replace) {
  actions.push("keep existing .obsidian/plugins/obsidian-hider (use --replace to install the bundled build)");
} else {
  await installDirectory(join(root, "vendor", "hider", "release"), hiderTarget);
}
await installDirectory(join(root, "theme", "Zen AMOLED"), join(obsidian, "themes", "Zen AMOLED"));
await installFile(join(root, "snippets", "Zen Obsidian.css"), join(obsidian, "snippets", "Zen Obsidian.css"));

if (withModernOutline) {
  await installDirectory(join(root, "optional", "modern-outline", "release"), join(obsidian, "plugins", "modern-outline"));
}
if (withTabSwitcher) {
  await installDirectory(join(root, "optional", "tab-switcher", "release"), join(obsidian, "plugins", "cycle-through-panes"));
}

if (demoNote) {
  await installDirectory(join(root, "examples"), vault);
}

if (configure) {
  const appearancePath = join(obsidian, "appearance.json");
  const appearance = await readJson<Record<string, unknown>>(appearancePath, {});
  const snippets = Array.isArray(appearance.enabledCssSnippets)
    ? appearance.enabledCssSnippets.filter((item): item is string => typeof item === "string")
    : [];
  if (!snippets.includes("Zen Obsidian")) snippets.push("Zen Obsidian");
  appearance.cssTheme = "Zen AMOLED";
  appearance.theme = "obsidian";
  appearance.enabledCssSnippets = snippets;
  await writeMergedJson(appearancePath, appearance);

  const pluginsPath = join(obsidian, "community-plugins.json");
  const plugins = await readJson<unknown[]>(pluginsPath, []);
  const enabled = plugins.filter((item): item is string => typeof item === "string");
  for (const id of [
    "brave-tabs",
    "obsidian-hider",
    ...(withModernOutline ? ["modern-outline"] : []),
    ...(withTabSwitcher ? ["cycle-through-panes"] : []),
  ]) {
    if (!enabled.includes(id)) enabled.push(id);
  }
  await writeMergedJson(pluginsPath, enabled);

  const hotkeysPath = join(obsidian, "hotkeys.json");
  const hotkeys = await readJson<Record<string, unknown>>(hotkeysPath, {});
  Object.assign(hotkeys, {
    "markdown:toggle-preview": [],
    "file-explorer:open": [],
    "workspace:close": [],
    "workspace:undo-close-pane": [],
    "brave-tabs:toggle-tabs-file-explorer": [{ modifiers: ["Mod"], key: "E" }],
    "brave-tabs:show-vertical-tabs": [{ modifiers: ["Mod", "Shift"], key: "E" }],
    "brave-tabs:close-active-main-tab": [{ modifiers: ["Mod"], key: "W" }],
    "brave-tabs:undo-close-main-tab": [{ modifiers: ["Mod", "Shift"], key: "T" }],
    "brave-tabs:toggle-left-sidebar": [{ modifiers: ["Alt"], key: "B" }],
    "brave-tabs:toggle-right-sidebar": [{ modifiers: ["Alt", "Shift"], key: "B" }],
    ...(withTabSwitcher ? {
      "cycle-through-panes:focus-on-last-active-pane": [{ modifiers: ["Mod"], key: "Tab" }],
      "cycle-through-panes:focus-on-last-active-pane-reverse": [{ modifiers: ["Mod", "Shift"], key: "Tab" }],
    } : {}),
  });
  await writeMergedJson(hotkeysPath, hotkeys);

  const hiderDataPath = join(obsidian, "plugins", "obsidian-hider", "data.json");
  const hiderData = await readJson<Record<string, unknown>>(hiderDataPath, {});
  const hiderPreset = await readJson<Record<string, unknown>>(join(root, "presets", "hider.json"), {});
  Object.assign(hiderData, hiderPreset);
  await writeMergedJson(hiderDataPath, hiderData);

  if (withTabSwitcher) {
    const tabSwitcherDataPath = join(obsidian, "plugins", "cycle-through-panes", "data.json");
    const tabSwitcherData = await readJson<Record<string, unknown>>(tabSwitcherDataPath, {});
    const tabSwitcherPreset = await readJson<Record<string, unknown>>(join(root, "optional", "tab-switcher", "preset.json"), {});
    Object.assign(tabSwitcherData, tabSwitcherPreset);
    await writeMergedJson(tabSwitcherDataPath, tabSwitcherData);
  }
}

if (configure || demoNote) {
  const verticalTabsDataPath = join(obsidian, "plugins", "brave-tabs", "data.json");
  const verticalTabsData = await readJson<Record<string, unknown>>(verticalTabsDataPath, {});
  if (configure) {
    const verticalTabsPreset = await readJson<Record<string, unknown>>(join(root, "presets", "vertical-tabs.json"), {});
    Object.assign(verticalTabsData, verticalTabsPreset);
  }
  if (demoNote) verticalTabsData.demoStartNote = "Start Here.md";
  await writeMergedJson(verticalTabsDataPath, verticalTabsData);
}

console.log(actions.join("\n"));
console.log(dryRun ? "Dry run complete; nothing was written." : "Installation complete. Restart Obsidian and open the target vault.");
