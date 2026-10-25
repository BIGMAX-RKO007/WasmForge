# @wasmforge/case-converter

Pure standalone WebAssembly (WASM) module for bidirectional naming case transformations (camelCase, PascalCase, snake_case, SCREAMING_SNAKE_CASE, kebab-case, COBOL-CASE, Title Case, dot.case, path/case), adhering to WasmForge's Universal Envelope Protocol and C-ABI specifications.

## Features
- **Smart Tokenizer**: Splits on camelCase transitions (`fooBar` -> `foo`, `bar`), consecutive uppercase boundaries (`HTMLParser` -> `HTML`, `Parser`), hyphens, underscores, dots, slashes, and spaces.
- **12+ Distinct Casing Styles**: Provides simultaneous instant transformation into all mainstream programming and display formats.
- **Zero JS Glue**: Compiles into pure, host-agnostic `.wasm` with zero external imports (`Imports: []`).

## C-ABI Exports
```rust
pub extern "C" fn alloc(size: usize) -> *mut u8;
pub extern "C" fn dealloc(ptr: *mut u8, size: usize);
pub extern "C" fn dispatch(ptr: *const u8, len: usize) -> u64;
```
