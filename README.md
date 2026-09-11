# Zen Obsidian

A quiet, AMOLED-black, note-first Obsidian desktop setup with native-feeling vertical tabs.

![Zen Obsidian](assets/zen-obsidian.png)

This repository is a modular kit, not a replacement `.obsidian` folder. It does not contain a workspace snapshot, personal notes, plugin data, credentials, or a complete hotkey file.

[Download the latest release](https://github.com/Asforaa/zen-obsidian/releases/latest) or use the source-based installer below.

## What is included

| Layer | Status | Purpose |
|---|---|---|
| **Zen AMOLED** | Essential | The exact color-variable foundation, derived from Vanilla AMOLED under its ISC License. |
| **Vertical Tabs** | Essential | Native left-sidebar tabs, split sessions, full native menus, safe close/restore, and the contained writing surface. |
| **Hider** | Essential | Removes the vault profile block and editor status bar using the bundled two-flag preset. |
| **Zen Obsidian CSS** | Essential for the complete look | Centers launchers, removes redundant window chrome, and hides the duplicate File Explorer new-note control. |
| **Modern Outline patch** | Optional | An always-available document minimap with immediate scroll tracking. |

The theme is installed as **Zen AMOLED**, beside—not over—the upstream Vanilla AMOLED theme.

## Safe automated installation

Requires [Bun](https://bun.sh/).

```bash
git clone https://github.com/Asforaa/zen-obsidian.git
cd zen-obsidian
bun run verify
bun run install -- "/absolute/path/to/your/vault" --dry-run --configure
bun run install -- "/absolute/path/to/your/vault" --configure
```

Add `--with-modern-outline` if you also want the patched outline. Add `--demo-note` only for a disposable test vault.

The installer:

- never touches Markdown notes unless `--demo-note` is explicitly supplied;
- preserves unrelated plugins, snippets, settings, and shortcuts;
- skips identical files;
- refuses to replace different existing component files;
- backs up every JSON file before an opt-in configuration merge.

If you deliberately want to update an existing Zen component, add `--replace`. The replaced files are backed up under `.obsidian/zen-obsidian-backups/` first.

See [Installation](docs/INSTALLATION.md), [Components](docs/COMPONENTS.md), [Shortcuts](docs/SHORTCUTS.md), and [Compatibility](docs/COMPATIBILITY.md).

## Release downloads

- `vertical-tabs-*.zip` — the installable plugin build.
- `zen-amoled-*.zip` — the essential theme.
- `hider-*.zip` — Hider's upstream build plus the two-flag Zen preset.
- `zen-obsidian.css` — the finishing snippet.

These are separate on purpose: existing vault users can install only the layers they want without extracting a complete configuration directory.

## Build Vertical Tabs

```bash
cd packages/vertical-tabs
bun install
bun run check
bun run build
```

## Privacy boundary

This project intentionally excludes `workspace.json`, full `appearance.json` and `hotkeys.json` files, enabled-plugin dumps, LiveSync data, and personal vault content.

## License

Zen Obsidian and Vertical Tabs are MIT licensed. Bundled derivatives retain their upstream notices; see [Third-party notices](THIRD_PARTY_NOTICES.md).
