# @wasm-forge/otp-generator

Pure, standalone WebAssembly TOTP (Time-based One-Time Password, RFC 6238) and HOTP (HMAC-based One-Time Password, RFC 4226) generation and verification engine.

## Features
- **RFC 6238 TOTP**:
  - Time-step token generation (Google Authenticator, Authy, 1Password compatible)
  - Configurable period (30s, 60s), digits (6 or 8), and algorithm (SHA-1)
  - Remaining step time countdown calculation
- **RFC 4226 HOTP**:
  - Event/counter-based token generation
- **Verification Engine**:
  - Clock-skew window verification ($\pm 1$ period)
- **Key & URI Helper**:
  - RFC 4648 Base32 secret decoding
  - Standard `otpauth://` URI generation for authenticator apps
- **Zero Imports**: No external JS glue, zero `wasm-bindgen` bloat, host-agnostic C-ABI.
