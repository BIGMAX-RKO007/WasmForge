# @wasmforge/yaml-to-json

Pure standalone WebAssembly module converting YAML data into JSON format with configurable indentation, following WasmForge's Universal Envelope Protocol and C-ABI specifications.

## Features
- **Host Agnostic & Zero Glue**: Pure C-ABI exports (`alloc`, `dealloc`, `dispatch`), zero external imports (`Imports: []`).
- **Configurable Indentation**: Supports compact (0-space) or pretty-printed JSON (2 spaces, 4 spaces).
- **Built-in Sample**: Provides representative multi-tier YAML sample configuration with `yaml/sample`.
- **Dual-Runtime Compatible**: Runs identically inside Node.js/Bun servers and directly in modern web browsers.

## C-ABI Actions
- `yaml/to-json`: Converts input YAML string to formatted JSON string.
- `yaml/sample`: Returns built-in multi-type YAML template.
