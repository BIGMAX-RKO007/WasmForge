# @wasmforge/json-to-yaml

Pure standalone WebAssembly module converting JSON data into human-readable YAML format, following WasmForge's Universal Envelope Protocol and C-ABI specifications.

## Features
- **Host Agnostic & Zero Glue**: Pure C-ABI exports (`alloc`, `dealloc`, `dispatch`), zero external imports (`Imports: []`).
- **High Performance & Compliant**: Converts complex JSON trees, nested mappings, arrays, and primitives into clean YAML documents.
- **Built-in Sample**: Provides representative multi-tier configuration template with `json/sample`.
- **Dual-Runtime Compatible**: Runs identically inside Node.js/Bun servers and directly in modern web browsers.

## C-ABI Actions
- `json/to-yaml`: Converts input JSON string to clean YAML string.
- `json/sample`: Returns built-in multi-type configuration template.
