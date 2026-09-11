# Installation

## Before installing into an existing vault

Close Obsidian or switch away from the target vault. Commit or back up the vault if it is version-controlled. The installer is intentionally conservative, but an external backup is still good practice.

## Automated installation

Clone the repository and preview the exact changes:

```bash
git clone https://github.com/Asforaa/zen-obsidian.git
cd zen-obsidian
bun run verify
bun run install -- "/absolute/path/to/Vault" --dry-run --configure
```

If the preview is correct:

```bash
bun run install -- "/absolute/path/to/Vault" --configure
```

Options:

- `--configure`: selects Zen AMOLED, enables the Zen snippet and Vertical Tabs, and merges the shortcut preset.
- `--with-modern-outline`: installs and enables the optional patched Modern Outline build.
- `--replace`: replaces only conflicting Zen component files after backing them up.
- `--demo-note`: adds the included example notes; intended only for a disposable test vault.
- `--dry-run`: reports actions without writing.

Restart Obsidian after installation. Community plugins may require turning off Restricted Mode once before they can load.

## Manual installation

1. Copy `release/vertical-tabs` to `<vault>/.obsidian/plugins/brave-tabs`.
2. Install Hider 1.7.1 from Obsidian's community browser, or copy `vendor/hider/release` to `<vault>/.obsidian/plugins/obsidian-hider`.
3. In Hider settings, enable only **Hide status bar** and **Hide vault name** for the Zen preset.
4. Copy `theme/Zen AMOLED` to `<vault>/.obsidian/themes/Zen AMOLED`.
5. Copy `snippets/Zen Obsidian.css` to `<vault>/.obsidian/snippets/Zen Obsidian.css`.
6. In **Settings → Appearance**, select **Zen AMOLED** and enable **Zen Obsidian** under CSS snippets.
7. In **Settings → Community plugins**, enable **Vertical Tabs** and **Hider**.
8. Assign only the shortcuts you want from [Shortcuts](SHORTCUTS.md).

These steps do not replace the vault's workspace or other configuration files.

## Removing the kit

Disable Vertical Tabs, Hider, and the Zen Obsidian snippet, then select another theme. Vertical Tabs restores Obsidian's native horizontal tabs and right-sidebar toggle when disabled. Component folders may be deleted afterward while Obsidian is closed.
