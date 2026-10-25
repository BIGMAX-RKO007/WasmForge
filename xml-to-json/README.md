# @wasmforge/xml-to-json

Pure standalone, host-agnostic WebAssembly module for parsing XML documents into JSON trees, supporting attributes, repeated child element arrays, self-closing tags, and CDATA blocks.

Part of the **WasmForge Industrial WebAssembly Suite**.

## Specification & Capabilities

- **Zero JavaScript Glue**: `Imports: []`. Instantiates natively via standard `WebAssembly.instantiate(bytes, {})`.
- **C-ABI Universal Envelope Protocol**:
  - `alloc(size: usize) -> *mut u8`
  - `dealloc(ptr: *mut u8, size: usize)`
  - `dispatch(ptr: *const u8, len: usize) -> u64` (packs `(out_ptr << 32) | out_len`)
- **Actions Supported**:
  - `xml/to-json`: Converts an XML document string into compact, 2-space, or 4-space indented JSON.
  - `xml/sample`: Returns an industrial bookstore XML document for preview and testing.

## Build

```bash
cargo build --target wasm32-unknown-unknown --release
```
