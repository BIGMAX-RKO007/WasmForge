# @wasmforge/rsa-key-pair

> Pure standalone, host-agnostic WebAssembly module for RSA Key Pair generation and standard PEM formatting (PKCS#1 & PKCS#8).

## Overview

- **Standard C-ABI Exports**: `alloc`, `dealloc`, `dispatch`
- **Envelope Protocol Specification**:
  - `rsa/generate`: Generate RSA public and private key pairs with configurable bit length (`1024`, `2048`, `4096`).
- **Cryptographic Encodings**:
  - **PKCS#8 PEM**: Modern standard (`BEGIN PRIVATE KEY` / `BEGIN PUBLIC KEY`)
  - **PKCS#1 PEM**: Traditional RSA format (`BEGIN RSA PRIVATE KEY` / `BEGIN RSA PUBLIC KEY`)
- **Zero Host Dependencies**: Self-contained CSPRNG compatible with both Node.js (via Hono) and browser runtimes without Emscripten or wasm-bindgen.

## Protocol Schema

### `rsa/generate`

**Request:**
```json
{
  "action": "rsa/generate",
  "requestId": "req-123",
  "params": {
    "bits": 2048,
    "seed": 123456789
  }
}
```

**Response:**
```json
{
  "code": 0,
  "msg": "ok",
  "requestId": "req-123",
  "data": {
    "bits": 2048,
    "privateKeyPkcs8Pem": "-----BEGIN PRIVATE KEY-----\n...",
    "publicKeyPkcs8Pem": "-----BEGIN PUBLIC KEY-----\n...",
    "privateKeyPkcs1Pem": "-----BEGIN RSA PRIVATE KEY-----\n...",
    "publicKeyPkcs1Pem": "-----BEGIN RSA PUBLIC KEY-----\n..."
  }
}
```
