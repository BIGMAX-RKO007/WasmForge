# @wasmforge/base64-file

Pure standalone WebAssembly (WASM) module for Base64 File & Data URL conversion and inspection, adhering to WasmForge's Universal Envelope Protocol and C-ABI specifications.

## Features
- **File to Data URL**: Formats raw base64 data into standard RFC 2397 Data URLs (`data:<mime>;base64,<data>`), automatically guessing MIME type by file extension if omitted.
- **Data URL to Base64 & Metadata**: Parses Data URLs, extracts MIME type, raw base64 body, and computes exact decoded binary byte count.
- **Sample Generation**: Built-in SVG / 1x1 PNG sample generator for instant prototyping.
- **Zero JS Glue**: Compiles into pure, host-agnostic `.wasm` with zero external imports (`Imports: []`).

## C-ABI Exports
```rust
pub extern "C" fn alloc(size: usize) -> *mut u8;
pub extern "C" fn dealloc(ptr: *mut u8, size: usize);
pub extern "C" fn dispatch(ptr: *const u8, len: usize) -> u64;
```
