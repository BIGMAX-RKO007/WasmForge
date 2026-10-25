# @wasmforge/base64-string

Pure standalone, host-agnostic WebAssembly module for encoding UTF-8 text into Standard and URL-Safe Base64 format and decoding Base64 back to string.

Part of the **WasmForge Industrial WebAssembly Suite**.

## Specification & Capabilities

- **Zero JavaScript Glue**: `Imports: []`. Instantiates natively via standard `WebAssembly.instantiate(bytes, {})`.
- **C-ABI Universal Envelope Protocol**:
  - `alloc(size: usize) -> *mut u8`
  - `dealloc(ptr: *mut u8, size: usize)`
  - `dispatch(ptr: *const u8, len: usize) -> u64` (packs `(out_ptr << 32) | out_len`)
- **Actions Supported**:
  - `base64/encode`: Encodes UTF-8 string into standard or URL-safe Base64 with padding options.
  - `base64/decode`: Decodes Base64 string to original UTF-8 text.
  - `base64/sample`: Returns sample payload for demonstration.

## Build

```bash
cargo build --target wasm32-unknown-unknown --release
```
