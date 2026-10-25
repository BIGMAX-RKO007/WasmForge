# @wasm-forge/html-entities

Pure, standalone WebAssembly HTML5 Named & Numeric Character Reference Encoder and Decoder.

## Features
- **Comprehensive HTML5 Entity Encoding & Decoding**:
  - Encodes dangerous characters (`&`, `<`, `>`, `"`, `'`) for XSS sanitization.
  - Optional extensive mode for non-ASCII characters & symbols (`©`, `™`, `€`, `£`, etc.).
  - Decodes all standard named entities (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&copy;`, etc.).
  - Decodes decimal NCRs (`&#38;`) and hexadecimal NCRs (`&#x26;`).
- **Detailed Processing Metrics**:
  - `inputBytes`, `outputBytes`, `entitiesProcessed`, `ratio`.
- **Zero Imports**: No external JS glue, zero `wasm-bindgen` bloat, host-agnostic C-ABI.
