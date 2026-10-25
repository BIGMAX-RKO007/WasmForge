# @wasm-forge/numeronym-generator

Pure, standalone WebAssembly Numeronym abbreviation generator and dictionary engine.

## Features
- **Numeronym Generation**:
  - Converts single words into classic numeronyms (e.g., `internationalization` -> `i18n`, `kubernetes` -> `k8s`)
  - Full sentence / passage numeronymizer with casing & punctuation preservation
  - Minimum word length threshold tuning (e.g. >= 4, >= 6)
- **Batch Processing**:
  - Detailed breakdown table with original word, omitted count, numeronym, and character savings percentage
- **Dictionary Lookup / Expansion**:
  - Reverse lookup for common developer numeronyms (`i18n`, `l10n`, `a11y`, `k8s`, `o11y`, `p13n`, `v12n`)
- **Zero Imports**: No external JS glue, zero `wasm-bindgen` bloat, host-agnostic C-ABI.
