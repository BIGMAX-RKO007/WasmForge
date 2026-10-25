# @wasm-forge/json-diff

Pure, standalone WebAssembly Deep Structural JSON Diff & RFC 6902 JSON Patch Engine.

## Features
- **Deep Hierarchical Comparison**:
  - Traverses nested objects and arrays of arbitrary depth.
  - Detects additions (`added`), removals (`removed`), modifications (`modified`), and type mutations (`type_changed`).
- **RFC 6902 Compliant JSON Patch**:
  - Automatically synthesizes compliant `add`, `remove`, `replace` operations array.
- **Detailed JSON Pointer Paths**:
  - Full RFC 6901 JSON pointer format (e.g. `/servers/0/url`, `/database/credentials/password`).
- **Summary Metrics**:
  - Total changes, additions count, removals count, modifications count.
- **Zero Imports**: No external JS glue, zero `wasm-bindgen` bloat, host-agnostic C-ABI.
