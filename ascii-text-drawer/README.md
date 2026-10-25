# @wasm-forge/ascii-text-drawer

Pure, standalone WebAssembly ASCII art banner generator and Figlet-style text drawer engine.

## Features
- **Built-in Font Styles**:
  - `Standard` (Classic 5-row ASCII banner)
  - `Slant` (Dynamic italic style)
  - `Block` (Heavy high-contrast glyphs)
  - `Small` (3-row compact terminal header)
- **Customizable Glyphs**:
  - Optional custom character mask/fill replacement (`#`, `@`, `*`, `+`, etc.)
- **Banner Layout**:
  - Multi-line rendering with automatic line-wrapping and spacing controls
- **Zero Imports**: No external JS glue, zero `wasm-bindgen` bloat, host-agnostic C-ABI.
