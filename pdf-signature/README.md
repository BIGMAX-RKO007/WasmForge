# @wasmforge/pdf-signature

> Pure standalone, host-agnostic WebAssembly module for inspecting PDF digital signatures (/Type /Sig), verifying ByteRange coverage, and extracting signer certificates & timestamps.

## Overview

- **Standard C-ABI Exports**: `alloc`, `dealloc`, `dispatch`
- **Envelope Protocol Specification**:
  - `pdf/inspect`: Parses arbitrary PDF documents (Base64), extracts digital signatures, signer name, reason, signing time, location, SubFilter (`adbe.pkcs7.detached`, `ETSI.CAdES.detached`), and validates whether the ByteRange bounds cover the file properly.
  - `pdf/sample`: Returns a standard synthetic PDF document with an embedded valid digital signature for instantaneous benchmarking.
- **Zero Host Dependencies**: Pure standalone module without `wasm-bindgen` or external imports. Instantiates natively in browser and backend runtimes.

## Protocol Schema

### `pdf/inspect`

**Request:**
```json
{
  "action": "pdf/inspect",
  "requestId": "req-123",
  "params": {
    "pdfBase64": "JVBERi0xLjc..."
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
    "validPdf": true,
    "pdfVersion": "1.7",
    "fileSizeBytes": 1068,
    "hasSignatures": true,
    "signatureCount": 1,
    "signatures": [
      {
        "index": 0,
        "signerName": "WasmForge Official Digital Authority",
        "filter": "Adobe.PPKLite",
        "subFilter": "adbe.pkcs7.detached",
        "signDate": "2026-10-25 11:30:00 +09:00",
        "reason": "WASM Industrial Grade Release Certification",
        "location": "Tokyo, Japan",
        "contactInfo": "cert@wasmforge.org",
        "byteRange": [0, 450, 962, 106],
        "byteRangeValid": true,
        "byteRangeDetails": "Valid ByteRange: Part 1 (0..450), Part 2 (962..1068) covers total 556 bytes",
        "signatureLengthBytes": 256,
        "signatureHexSample": "308201fa06092a864886f70d010702a0..."
      }
    ],
    "summary": "Found 1 valid digital signature(s) embedded in PDF document."
  }
}
```
