# Changelog

## 0.3.1 — 2026-09-11

- Added Tab Switcher 1.5.2 and the tested Markdown-only configuration as an optional, source-complete GPL component.
- Included Modern Outline and Tab Switcher in the standard installation, with `--without-modern-outline` and `--without-tab-switcher` opt-outs.
- Made the Local Graph setting close the pane immediately when switched off.
- Added the reversible compact-ribbon option, enabled by the Zen preset, which keeps the first four sidebar actions.
- Clarified that Bun is needed only for the automated installer and source builds, not for Obsidian runtime or manual installation.
- Refreshed the README image from a clean local installation.

## 0.3.0 — 2026-09-11

- Added opt-in Local Graph provisioning through Vertical Tabs instead of shipping a personal `workspace.json`.
- Added the reference Local Graph display/force preset and 34.76% lower-left sidebar height.
- Existing Local Graph panes and their sizing are preserved; missing panes are created once without duplication.
- Added a one-shot `Start Here` demo note linked to the other three examples, producing an immediate four-node Local Graph cluster.
- Made the Vertical Tabs Local Graph setting a complete on/off control: disabling it closes the pane immediately.

## 0.2.0 — 2026-09-11

- Added Hider 1.7.1 as an essential, licensed component.
- Added the minimal Zen Hider preset: hide the status bar and vault profile only.
- Preserved existing Hider installations and settings; configuration merges are opt-in and backed up.
- Added a complete conflict preflight so a refused file cannot leave a partial installation behind.
- Re-tested the public installation path in the clean demo vault.

## 0.1.0 — 2026-09-11

- Published Vertical Tabs 0.7.0 with native sidebar placement, drag ordering, full context menus, split sessions, safe close/restore, and sidebar commands.
- Added the essential Zen AMOLED 1.0.1 theme, derived from Vanilla AMOLED under the ISC License.
- Added the independently toggleable Zen Obsidian finishing snippet.
- Bundled the patched Modern Outline 1.1.7 as an optional component.
- Added a conservative installer with dry-run, opt-in configuration merging, conflict refusal, and backups.
- Verified the documented flow from a public clone into a clean local vault.
