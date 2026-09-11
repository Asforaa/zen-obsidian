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

The preset explicitly removes `Ctrl+E`, `Ctrl+W`, and `Ctrl+Shift+T` from the corresponding native commands so the safe Vertical Tabs commands have one owner. Existing JSON files are backed up before this opt-in merge.

`Ctrl+Tab` is intentionally not assigned by this repository. The original setup currently uses the separate Tab Switcher plugin with a Markdown-only filter; that dependency is not necessary for the visual kit.

