# @wasmforge/json-to-toml

Pure standalone WebAssembly module converting JSON data into TOML format, following WasmForge's Universal Envelope Protocol and C-ABI specifications.

## Features
- **Host Agnostic & Zero Glue**: Pure C-ABI exports (`alloc`, `dealloc`, `dispatch`), zero external imports (`Imports: []`).
- **TOML Table Root Enforced**: Automatically wraps non-table root items (such as arrays) into compliant TOML structures.
- **Built-in Sample**: Provides representative multi-tier configuration template with `json/sample`.
- **Dual-Runtime Compatible**: Runs identically inside Node.js/Bun servers and directly in modern web browsers.

## C-ABI Actions
- `json/to-toml`: Converts input JSON string to TOML string.
- `json/sample`: Returns built-in multi-type configuration template.
