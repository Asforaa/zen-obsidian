# Vertical Tabs for Obsidian

A local Obsidian plugin that mirrors the current main-workspace tabs in a native left-sidebar view.

- Tabs is the first native sidebar tab, before Files, Search, and Bookmarks.
- Switching sidebar tabs swaps the full sidebar content without overlays.
- While Vertical Tabs is enabled, the native horizontal tab strip, new-tab button, and tab-list dropdown are hidden. The existing right-sidebar toggle is anchored once to the writing container beside the active view controls, so switching tabs cannot make it flicker.
- The redundant current-view book control is hidden, and matching 48px fades blend scrolling note content into the top and bottom edges.
- The main writing workspace uses `#0d0d0d` inside a rounded container, while both sidebars remain pure black. Only the 12px top and bottom shell gaps remain.
- The left sidebar header, collapse control, and ribbon content are offset by 12px to align with the writing container's top edge.
- The right sidebar uses the same 12px top offset, aligning its icon row with the writing container and left sidebar.
- The sidebar tab header uses a tighter 2px left inset so its icons sit closer to the ribbon controls.
- `Alt+B` toggles the left sidebar while Vertical Tabs is enabled.
- `Alt+Shift+B` toggles the right sidebar while Vertical Tabs is enabled.
- `Ctrl+E` toggles the left sidebar view between Vertical Tabs and File Explorer; `Ctrl+Shift+E` remains a direct shortcut to Vertical Tabs.
- `Ctrl+W` closes the remembered active main-workspace tab even when Files, Vertical Tabs, or another sidebar view currently owns focus.
- `Ctrl+Shift+T` restores the newest closed main-workspace tab while skipping closed Vertical Tabs and other sidebar history entries.
- When the right sidebar is collapsed, the writing container keeps a matching 12px right inset; opening the sidebar removes that inset.
- Native separator lines inside both sidebars are visually removed without disabling their resize handles.
- The native ribbon spacer pseudo-element is also borderless, removing the underline beneath the top-left collapse control.
- The writing container omits its left border so it does not recreate a separator beside the left sidebar or collapsed ribbon.
- The outer-right resize handle remains functional but is visually transparent, removing its final separator line.
- If Obsidian reparents the right-sidebar toggle while opening the sidebar, Vertical Tabs returns it to the unified header so it remains available for closing.
- During left-sidebar transitions, Obsidian's temporary duplicate right-toggle is hidden before paint while its native node remains untouched.
- Disabling Vertical Tabs restores the horizontal strip and returns the same right-sidebar toggle to its original native location.
- Pressing a row activates that existing Obsidian tab immediately, while render deferral keeps drag initiation reliable.
- Dragging a normal row reorders it; dragging either member of a split session moves the complete session as one block.
- A split layout is one persistent tab-session at its existing list position. Clicking a normal tab shows only that note; clicking either split member restores every pane in the saved split.
- Right-clicking any row opens Obsidian's exact native tab menu and keeps it open until normal dismissal. Native active-state checks are spoofed synchronously and restored before paint, so the target editor never appears or receives focus.
- The complete active note breadcrumb, including its folder path and filename, uses a relaxed blur-in transition when switching pages.
- A tab's close button is visible only while that exact row is hovered.
- Tabs close only from an explicit close or middle-click action.
- The plugin never expires, merges, deduplicates, or automatically closes tabs.

## Shortcut policy

Vertical Tabs registers commands but does not force default shortcuts into a vault. Assign shortcuts through **Settings → Hotkeys**, or apply the optional Zen Obsidian preset with its non-destructive installer. This keeps an existing vault's keyboard setup under the user's control.

## Compatibility

- Requires Obsidian 1.8.0 or newer on desktop.
- Uses internal workspace structures for native tab menus, split-session restoration, and sidebar placement. Obsidian updates can require compatibility fixes.
- The legacy community plugin with ID `vertical-tabs` should be disabled when this plugin is active.
