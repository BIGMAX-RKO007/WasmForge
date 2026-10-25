# @wasmforge/toml-to-yaml

Pure standalone WebAssembly module converting TOML data into clean YAML format, following WasmForge's Universal Envelope Protocol and C-ABI specifications.

## Features
- **Host Agnostic & Zero Glue**: Pure C-ABI exports (`alloc`, `dealloc`, `dispatch`), zero external imports (`Imports: []`).
- **High Performance & Compliant**: Converts complex TOML configurations, nested tables, arrays of tables, and scalar properties into human-readable YAML documents.
- **Built-in Sample**: Provides representative multi-tier configuration template with `toml/sample`.
- **Dual-Runtime Compatible**: Runs identically inside Node.js/Bun servers and directly in modern web browsers.

## C-ABI Actions
- `toml/to-yaml`: Converts input TOML string to clean YAML string.
- `toml/sample`: Returns built-in multi-type configuration template.
