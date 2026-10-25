# @wasmforge/json-to-csv

Pure standalone, host-agnostic WebAssembly module for flattening and transforming arbitrary JSON arrays into RFC 4180 compliant CSV tables. Supports custom delimiters, object flattening (dot notation), and header inclusion.

Part of the **WasmForge Industrial WebAssembly Suite**.

## Specification & Capabilities

- **Zero JavaScript Glue**: `Imports: []`. Instantiates natively via standard `WebAssembly.instantiate(bytes, {})`.
- **C-ABI Universal Envelope Protocol**:
  - `alloc(size: usize) -> *mut u8`
  - `dealloc(ptr: *mut u8, size: usize)`
  - `dispatch(ptr: *const u8, len: usize) -> u64` (packs `(out_ptr << 32) | out_len`)
- **Actions Supported**:
  - `json/to-csv`: Converts JSON records into CSV formatted text with configurable delimiters (`,`, `;`, `\t`, `|`).
  - `json/sample`: Returns an industrial employee roster JSON template.

## Build

```bash
cargo build --target wasm32-unknown-unknown --release
```
