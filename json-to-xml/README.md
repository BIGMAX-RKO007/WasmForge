# @wasmforge/json-to-xml

Pure standalone, host-agnostic WebAssembly module for serializing JSON structures into compliant XML documents, with support for attributes (`@attr`), inner text (`$text`), array expansion, and customizable indentation.

Part of the **WasmForge Industrial WebAssembly Suite**.

## Specification & Capabilities

- **Zero JavaScript Glue**: `Imports: []`. Instantiates natively via standard `WebAssembly.instantiate(bytes, {})`.
- **C-ABI Universal Envelope Protocol**:
  - `alloc(size: usize) -> *mut u8`
  - `dealloc(ptr: *mut u8, size: usize)`
  - `dispatch(ptr: *const u8, len: usize) -> u64` (packs `(out_ptr << 32) | out_len`)
- **Actions Supported**:
  - `json/to-xml`: Converts a JSON string into formatted (or compact) XML documents.
  - `json/sample`: Returns an industrial bookstore JSON template for preview and testing.

## Build

```bash
cargo build --target wasm32-unknown-unknown --release
```
