# @wasm-forge/emoji-picker

Pure, standalone WebAssembly Emoji search, category indexing, and shortcode lookup engine.

## Features
- **Curated High-Density Database**:
  - Embedded categorized emojis covering Dev, Tech, Git, Smileys, Objects, and Symbols
- **Fast Full-Text Search**:
  - Search by character, English name, GitHub shortcode, category, or semantic keywords
- **Categories & Presets**:
  - List all categories with counts
  - Developer presets: "Dev & Git Commits", "Reactions & Emotions", "Cloud & Infra"
- **Zero Imports**: No external JS glue, zero `wasm-bindgen` bloat, host-agnostic C-ABI.
