# @wasm-forge/url-parser

Pure, standalone WebAssembly RFC 3986 URL Decomposition, Query Parameter Inspector & Reconstruction Engine.

## Features
- **RFC 3986 URL Breakdown**:
  - Scheme / Protocol
  - Username & Password (Userinfo)
  - Host, Hostname, and Port
  - Pathname and Path Segments array
  - Query String and Key-Value Parameters Map / List
  - Hash / Fragment Anchor
  - Origin Reconstitution
- **Query Parameter Inspector**:
  - Automatic URL-decoding of keys and values
  - Handling multi-value and duplicate keys
- **URL Rebuilder**:
  - Reconstructing valid canonical URLs from components
- **Zero Imports**: No external JS glue, zero `wasm-bindgen` bloat, host-agnostic C-ABI.
