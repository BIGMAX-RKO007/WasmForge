# @wasmforge/color-converter

Pure standalone WebAssembly (WASM) module for bidirectional color space transformations (HEX, RGB, HSL, HSV, CMYK) and WCAG 2.1 accessibility metrics calculation, adhering to WasmForge's Universal Envelope Protocol and C-ABI specifications.

## Features
- **Auto Format Detection**: Accepts raw HEX (`#fff`, `#38bdf8`, `#112233aa`), functional notation (`rgb(...)`, `rgba(...)`, `hsl(...)`, `hsv(...)`, `cmyk(...)`) or plain whitespace-separated numbers.
- **Full Spectrum Conversions**: Computes RGB(A), HEX(8), HSL, HSV, and CMYK models with accurate rounding.
- **Accessibility & Contrast**: Evaluates WCAG 2.1 relative luminance and contrast ratios against pure white and pure black.
- **Zero JS Glue**: Compiles into pure, host-agnostic `.wasm` with zero external imports (`Imports: []`).

## C-ABI Exports
```rust
pub extern "C" fn alloc(size: usize) -> *mut u8;
pub extern "C" fn dealloc(ptr: *mut u8, size: usize);
pub extern "C" fn dispatch(ptr: *const u8, len: usize) -> u64;
```
