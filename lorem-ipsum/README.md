# @wasm-forge/lorem-ipsum

Pure, standalone WebAssembly Latin placeholder dummy text generator engine.

## Features
- **Unit generation**:
  - By Paragraphs (1 - 50)
  - By Sentences (1 - 100)
  - By Words (1 - 2000)
  - By Bytes (Target byte length)
- **Formatting options**:
  - Plain text (with customizable newline separators)
  - HTML tags (`<p>...</p>`, `<ul><li>...</li></ul>`, `<blockquote>`)
  - Markdown syntax
  - JSON array
- **Options**:
  - Traditional opening ("Lorem ipsum dolor sit amet...") toggle
  - Deterministic pseudo-random seed support (Linear Congruential Generator / PCG-like algorithm)
  - Average words per sentence and sentences per paragraph tuning
- **Zero Imports**: No external JS glue, zero `wasm-bindgen` bloat, host-agnostic C-ABI.
