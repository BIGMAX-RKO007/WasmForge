# @wasm-forge/basic-auth-generator

Pure, standalone WebAssembly RFC 7617 HTTP Basic Authentication Header & Snippet Generator.

## Features
- **RFC 7617 HTTP Basic Authentication**:
  - Encodes `username:password` into standard Base64 Authorization tokens.
  - Generates ready-to-use HTTP header `Authorization: Basic <base64>`.
- **Client & Proxy Snippets**:
  - `curl` command line with `-H "Authorization: ..."` and `-u "username:password"`.
  - JavaScript `fetch` options dictionary snippet.
  - Python `requests.get(..., auth=(...))` snippet.
  - Nginx `auth_basic` configuration directives.
- **Header Decoder / Parser**:
  - Reverse decodes `Authorization: Basic ...` headers back to username and password.
- **Zero Imports**: No external JS glue, zero `wasm-bindgen` bloat, host-agnostic C-ABI.
