# @wasm-forge/url-encoder-decoder

Pure, standalone WebAssembly RFC 3986 URL Percent-Encoding and Decoding Engine.

## Features
- **Flexible Encoding Modes**:
  - `component`: Strict `encodeURIComponent` escaping all non-unreserved chars
  - `rfc3986`: Strict RFC 3986 (only `A-Z a-z 0-9 - . _ ~` unreserved)
  - `uri`: Preserves URL structural delimiters (`: / ? # [ ] @ ! $ & ' ( ) * + , ; =`)
  - `form`: `application/x-www-form-urlencoded` (spaces encoded as `+`)
- **Robust Decoding**:
  - Full UTF-8 multibyte percent sequence reconstruction
  - Optional `+` to space conversion
- **Zero Imports**: No external JS glue, zero `wasm-bindgen` bloat, host-agnostic C-ABI.
