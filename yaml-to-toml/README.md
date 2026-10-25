# @wasmforge/yaml-to-toml

Pure standalone WebAssembly module converting YAML data into TOML format, following WasmForge's Universal Envelope Protocol and C-ABI specifications.

## Features
- **Host Agnostic & Zero Glue**: Pure C-ABI exports (`alloc`, `dealloc`, `dispatch`), zero external imports (`Imports: []`).
- **Standard TOML Compliance**: Parses complex YAML structures, nested tables, arrays of tables (`[[...]]`), and converts them into compliant TOML configurations.
- **Built-in Sample**: Provides representative multi-tier configuration template with `yaml/sample`.
- **Dual-Runtime Compatible**: Runs identically inside Node.js/Bun servers and directly in modern web browsers.

## C-ABI Actions
- `yaml/to-toml`: Converts input YAML string to formatted TOML string.
- `yaml/sample`: Returns built-in multi-type configuration template.
