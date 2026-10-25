# @wasm-forge/device-information

Pure, standalone WebAssembly User-Agent Parser, Device Classifier & Client Capability Profiler.

## Features
- **High Precision UA Parsing**:
  - Browser detection (Chrome, Safari, Firefox, Edge, Opera, WeChat, Mobile Safari, etc.) with versions.
  - Operating System detection (Windows, macOS, iOS, Android, Linux, Chrome OS) with versions.
  - Device form factor (Desktop, Mobile, Tablet, Bot/Crawler, Headless).
  - CPU Architecture (x86_64, arm64, arm, x86).
  - Engine detection (Blink, WebKit, Gecko, Trident).
- **Client Capability Enrichment**:
  - Screen resolution & aspect ratio normalization.
  - Bot / Spider detection and headless automation flag.
- **Zero Imports**: No external JS glue, zero `wasm-bindgen` bloat, host-agnostic C-ABI.
