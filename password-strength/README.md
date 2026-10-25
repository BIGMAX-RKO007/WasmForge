# @wasmforge/password-strength

> Pure standalone, host-agnostic WebAssembly module for entropy-based password strength analysis, crack time estimation, and breach risk evaluation.

## Overview

- **Standard C-ABI Exports**: `alloc`, `dealloc`, `dispatch`
- **Envelope Protocol Specification**:
  - `password/analyze`: Deep analysis of password character pools, entropy bits, brute-force crack time estimates (online 100/s, offline slow 10k/s, offline GPU cluster 10G/s), and 0-4 security rating.
- **Zero Host Dependencies**: Pure standalone module without `wasm-bindgen` or external imports. Instantiates natively in browser and backend runtimes.

## Protocol Schema

### `password/analyze`

**Request:**
```json
{
  "action": "password/analyze",
  "requestId": "req-123",
  "params": {
    "password": "correcthorsebatterystaple",
    "userInputs": ["admin", "example.com"]
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
    "password": "correcthorsebatterystaple",
    "passwordLength": 25,
    "score": 4,
    "scoreText": "Very Strong",
    "entropyBits": 117.5,
    "charsets": {
      "hasLower": true,
      "hasUpper": false,
      "hasDigits": false,
      "hasSymbols": false,
      "poolSize": 26
    },
    "crackTimes": {
      "online100PerSec": "centuries of centuries",
      "offlineSlowHash10kPerSec": "centuries of centuries",
      "offlineFastHash10GPerSec": "centuries of centuries"
    },
    "warning": null,
    "suggestions": ["Strong password! Your credentials are resilient against brute-force attacks."]
  }
}
```
