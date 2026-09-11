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

## Essential for the complete look: Zen Obsidian CSS

The snippet contains the small global rules that should remain independently toggleable:

- centered Omnisearch and command palette;
- hidden native desktop window-control buttons;
- hidden duplicate File Explorer new-note button.

## Optional: Modern Outline

The bundled patch keeps the minimap attached after restarts and sidebar focus, and updates the active section immediately during note scrolling. It is not required for Vertical Tabs or the shell.

## Deliberately not bundled

Omnisearch, QuickAdd, Commander, Excalidraw, Agentation Bridge, personal fonts, and the rest of the original vault workflow are not required for the layout. Install them independently if you want their behavior.
