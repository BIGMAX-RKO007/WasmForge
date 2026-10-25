# @wasmforge/git-memo

Pure standalone WebAssembly module for interactive Git commands cheatsheet, categorization, fuzzy keyword searching, and scenario-based recipe solutions.

## Features
- **Categorized Indexing**: Setup, Basics, Branching, Stashing, History, Undoing, Remote, Tags, Plumbing.
- **Scenario Recipes**: Fast answers to "How do I undo the last commit?", "How to stash untracked files?", "How to discard local unstaged changes?", etc.
- **Search Engine**: Fuzzy search across command strings, titles, descriptions, and tags.
- **Standard Protocol**: WasmForge Universal C-ABI (`alloc`, `dealloc`, `dispatch`).
- **Zero Dependencies**: Pure WASM without `wasm-bindgen` or external imports.
