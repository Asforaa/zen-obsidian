# Compatibility and support boundary

- Tested targets: Obsidian 1.13.6 and a clean Obsidian 1.13.7 profile on Linux desktop.
- Declared minimum: Obsidian 1.8.0.
- Vertical Tabs is desktop-only.
- The legacy community plugin whose ID is `vertical-tabs` should be disabled to avoid two competing tab systems.
- Vertical Tabs uses internal Obsidian workspace structures for native context menus, sidebar placement, and split-session restoration. An Obsidian update can require a compatibility release.
- Zen AMOLED and the Zen snippet can be disabled independently.
- Disabling Vertical Tabs removes its body class, restores the horizontal tab strip, reveals all main workspace groups, and returns the original right-sidebar toggle to its native location.
- Custom themes and snippets that heavily restyle `.workspace-split`, `.view-header`, or the titlebar may conflict with the kit.

Please include the Obsidian version, operating system, installed theme, and reproduction steps in bug reports. Never attach an entire `.obsidian` directory without checking it for private plugin data.
