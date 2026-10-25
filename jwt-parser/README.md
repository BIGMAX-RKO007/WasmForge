# @wasm-forge/jwt-parser

Pure, standalone WebAssembly JWT (JSON Web Token) header, payload, claims, and expiration inspector engine.

## Features
- **Keyless Decoding**:
  - Safe Base64URL parsing of Header & Payload without requiring private or public keys
- **Standard Claims Validation**:
  - `exp` (Expiration Time), `iat` (Issued At), `nbf` (Not Before), `iss` (Issuer), `sub` (Subject), `aud` (Audience)
  - Relative time calculations (Expired / Active / Remaining duration)
- **Signature Inspection**:
  - Algorithm (`alg`), Type (`typ`), and Signature binary representation preview
- **Zero Imports**: No external JS glue, zero `wasm-bindgen` bloat, host-agnostic C-ABI.
