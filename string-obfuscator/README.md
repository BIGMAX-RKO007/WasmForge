# @wasm-forge/string-obfuscator

Pure, standalone WebAssembly sensitive string desensitization, privacy masking, and text obfuscation engine.

## Features
- **Sensitive Data Masking**:
  - Email masking (`john.doe@example.com` -> `j***e@example.com`)
  - Phone / Mobile masking (`13812345678` -> `138****5678`, `+1 555-123-4567` -> `+1 555-***-4567`)
  - Credit Card / Bank Card masking (`4532 1234 5678 9012` -> `4532 **** **** 9012`)
  - API Key / Token masking (`sk_live_1234567890abcdef` -> `sk_live_****...cdef`)
  - SSN / National ID masking (`123-45-6789` -> `***-**-6789`)
  - Custom middle / prefix / suffix masking with custom symbols (`*`, `#`, `X`)
- **Obfuscation Modes**:
  - Leet Speak (`E` -> `3`, `A` -> `4`, `O` -> `0`, `I` -> `1`, `T` -> `7`, etc.)
  - ROT13 / Caesar cipher
  - Character Reversal / Inversion
  - Hex / Unicode Entity encoding
  - Zero-width space injection
- **Automated Log Sanitizer**:
  - Detects all sensitive patterns across multi-line logs/texts in a single pass and produces sanitized output with an audit manifest.
- **Zero Imports**: No external JS glue, zero `wasm-bindgen` bloat, host-agnostic C-ABI.
