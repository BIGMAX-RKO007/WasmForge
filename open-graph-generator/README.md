# @wasm-forge/open-graph-generator

Pure, standalone WebAssembly Open Graph Protocol & Twitter Card Meta Tags and JSON-LD Generator.

## Features
- **Open Graph Protocol (OGP)**:
  - Generates `og:title`, `og:description`, `og:url`, `og:image`, `og:image:alt`, `og:site_name`, `og:type`, `og:locale`.
- **Twitter Cards Specification**:
  - Generates `twitter:card` (summary, summary_large_image), `twitter:title`, `twitter:description`, `twitter:image`, `twitter:site`, `twitter:creator`.
- **Schema.org Structured Data (JSON-LD)**:
  - Generates standard Article or WebSite schema JSON-LD script payload for Google SEO.
- **Social Media Preview Payload**:
  - Provides structured preview data for real-time card mocking.
- **Zero Imports**: No external JS glue, zero `wasm-bindgen` bloat, host-agnostic C-ABI.
