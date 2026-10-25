# @wasmforge/toml-to-json

Pure standalone WebAssembly module converting TOML data into JSON format with configurable indentation, following WasmForge's Universal Envelope Protocol and C-ABI specifications.

## Features
- **Host Agnostic & Zero Glue**: Pure C-ABI exports (`alloc`, `dealloc`, `dispatch`), zero external imports (`Imports: []`).
- **Flexible Indentation**: Supports compact (0-space) or pretty-printed JSON (2 spaces, 4 spaces).
- **Built-in Sample**: Provides representative multi-tier configuration template with `toml/sample`.
- **Dual-Runtime Compatible**: Runs identically inside Node.js/Bun servers and directly in modern web browsers.

## C-ABI Actions
- `toml/to-json`: Converts input TOML string to formatted JSON string.
- `toml/sample`: Returns built-in multi-type configuration template.
