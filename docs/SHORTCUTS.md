# Shortcut preset

Shortcuts are opt-in. Vertical Tabs registers commands without forcing defaults.

The automated `--configure` preset adds these bindings while preserving unrelated hotkeys:

| Shortcut | Command |
|---|---|
| `Ctrl+E` | Toggle Vertical Tabs and File Explorer |
| `Ctrl+Shift+E` | Show Vertical Tabs directly |
| `Ctrl+W` | Close the remembered main-workspace tab |
| `Ctrl+Shift+T` | Restore the latest closed main-workspace tab |
| `Alt+B` | Toggle the left sidebar |
| `Alt+Shift+B` | Toggle the right sidebar |
| `Ctrl+Tab` | Tab Switcher: cycle to the previous main Markdown note |
| `Ctrl+Shift+Tab` | Tab Switcher: reverse through main Markdown notes |

The preset explicitly removes `Ctrl+E`, `Ctrl+W`, and `Ctrl+Shift+T` from the corresponding native commands so the safe Vertical Tabs commands have one owner. Existing JSON files are backed up before this opt-in merge.

The standard configured installation adds the two `Ctrl+Tab` bindings. Use `--without-tab-switcher` to omit the plugin, its preset, and both bindings. Its preset excludes sidebar views, hides the modal, and switches immediately.
