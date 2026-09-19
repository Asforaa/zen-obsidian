# Tab Switcher upstream record

- Project: [Vinzent03/tab-switcher](https://github.com/Vinzent03/tab-switcher)
- Version and tag: `1.5.2`
- Source commit: `cd1672a52713013c789e8ade47ac77ce3879cbfa`
- License: GNU GPL v3, preserved in `LICENSE` and `source/LICENSE`

The bundled build keeps the upstream plugin identity and adds one Zen behavior patch: a held MRU cycle snapshots tab activity, allows immediate tab previews, and restores that snapshot before committing only the tab selected when the modifier is released. This prevents intermediate previews from becoming the previous tab.

The Zen preset selects Markdown views only, hides the switcher modal, uses immediate focus, includes all splits, and includes pinned notes.
