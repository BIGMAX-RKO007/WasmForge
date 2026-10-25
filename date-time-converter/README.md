# @wasmforge/date-time-converter

Pure standalone WebAssembly (WASM) module for Date & Time format transformations, Unix Timestamp calculations (seconds/milliseconds), ISO 8601 parsing, and cross-timezone projections, adhering to WasmForge's Universal Envelope Protocol and C-ABI specifications.

## Features
- **Flexible Input Parsing**: Automatically parses 10-digit Unix timestamps (seconds), 13-digit timestamps (milliseconds), ISO 8601 / RFC 3339 strings, and common human-readable date formats.
- **Multi-Format Projections**: Instantaneous conversion to ISO 8601, RFC 2822, UTC, CST (+08:00), JST (+09:00), EST (-05:00), day of week, day of year, week number, and leap year detection.
- **Zero JS Glue**: Compiles into pure, host-agnostic `.wasm` with zero external imports (`Imports: []`).

## C-ABI Exports
```rust
pub extern "C" fn alloc(size: usize) -> *mut u8;
pub extern "C" fn dealloc(ptr: *mut u8, size: usize);
pub extern "C" fn dispatch(ptr: *const u8, len: usize) -> u64;
```
