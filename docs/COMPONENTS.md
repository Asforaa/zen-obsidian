# Components

## Essential: Zen AMOLED

The exact setup depends on Vanilla AMOLED's compact dark color foundation. This repository bundles a pinned, minimally modified derivative as **Zen AMOLED** so the result is reproducible and does not overwrite an existing Vanilla AMOLED installation. It also pins the setup's blue-violet accent variables instead of inheriting a machine's current accent.

## Essential: Vertical Tabs

Vertical Tabs is the functional and structural layer. It:

- places Tabs first in the native left-sidebar switcher;
- hides the horizontal root tab strip only while enabled;
- supports immediate activation, drag ordering, hover-close, and middle-click close;
- opens Obsidian's complete native context menu without focusing an inactive note;
- represents split panes as one persistent grouped session in the same list position;
- protects main-note close and undo-close behavior from sidebar focus;
- supplies commands for Files/Tabs switching and full sidebar toggles;
- adds the rounded, inset writing surface, stable right-sidebar control, edge fades, and breadcrumb transition.
- can idempotently provision one Local Graph as a separate lower-left section, using the reference 34.76% sidebar height.
- can reduce the left ribbon to its first four actions through a reversible Zen preset toggle.

The Local Graph option is off in the standalone plugin and enabled by the Zen installer preset. It reuses any existing Local Graph pane and does not overwrite or ship `workspace.json`. Turning the setting off closes the pane immediately and stops its recreation.

## Essential: Hider

Hider 1.7.1 removes two pieces of native chrome that otherwise remain visible in a clean vault:

- **Hide status bar** removes backlinks, properties, word count, character count, and status icons from the bottom-right edge.
- **Hide vault name** removes the vault switcher, help, and settings block from the bottom-left sidebar.

The automated installer preserves an existing Hider installation and, with explicit `--configure`, merges only `hideStatus: true` and `hideVault: true` into its settings. Every changed Hider data file is backed up first.

## Essential for the complete look: Zen Obsidian CSS

The snippet contains the small global rules that should remain independently toggleable:

- centered Omnisearch and command palette;
- hidden native desktop window-control buttons;
- hidden duplicate File Explorer new-note button.

## Included by default: Modern Outline

The bundled patch keeps the minimap attached after restarts and sidebar focus, and updates the active section immediately during note scrolling. Use `--without-modern-outline` to leave it out.

## Included by default: Tab Switcher

The bundled Tab Switcher 1.5.2 build and Zen preset provide the reference keyboard behavior:

- `Ctrl+Tab` and `Ctrl+Shift+Tab` cycle main Markdown note tabs only;
- sidebar views such as Files, Vertical Tabs, and Local Graph are excluded;
- switching happens immediately without a modal;
- all editor splits and pinned notes remain eligible.

The complete corresponding upstream source and GNU GPL v3 license are included under `optional/tab-switcher/source`.

Use `--without-tab-switcher` to leave it and its shortcuts out.
