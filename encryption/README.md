# WasmForge Tool #6: AES-GCM Authenticated Symmetric Encryption (encryption)

> 纯 WebAssembly (wasm32-unknown-unknown) 密码学级别对称加密解密机能，支持 AES-256-GCM 与 AES-128-GCM 认证加密 (AEAD)，严格遵循 WasmForge 通用信封协议 (Universal Envelope Protocol)。

---

## 🌟 机能亮点

- **AEAD 认证加密 (NIST 标准)**：采用现代最安全的 Galois/Counter Mode (GCM)，在加密数据的同时生成 128 位认证标签 (Authentication Tag)，杜绝任何密文篡改或填充攻击（CCA 免疫）。
- **SHA-256 密钥派生**：支持任意长度的用户助记词/口令密码，自动派生 256 位 / 128 位密钥。
- **灵活的数据表示**：同时支持 Base64 与十六进制 (Hex) 编码输出，自带 96 位 (12 字节) 动态 Nonce 生成与校验。
- **纯单一文件零胶水**：编译产物仅 ~206 KB，零 wasm-bindgen 胶水代码，可在后端 Node.js (Hono) 与现代浏览器原生高速运行。

---

## 📐 C-ABI 通用信封协议规格

### 1. 导出函数

```c
void* alloc(size_t size);
void dealloc(void* ptr, size_t size);
uint64_t dispatch(const uint8_t* ptr, size_t len);
```

### 2. 接口操作

#### 操作 A: `aes/encrypt`

**请求参数:**
```json
{
  "action": "aes/encrypt",
  "requestId": "req-enc-01",
  "params": {
    "text": "Secret Financial Report 2026",
    "secretKey": "my-vault-passphrase-888",
    "keyBits": 256,
    "format": "base64"
  }
}
```

**响应报文:**
```json
{
  "code": 0,
  "msg": "Success",
  "requestId": "req-enc-01",
  "data": {
    "ciphertext": "xU38sFj9Z12...==",
    "nonce": "aBcDeFgHiJkL",
    "algorithm": "AES-256-GCM",
    "format": "base64",
    "originalBytes": 27
  }
}
```

#### 操作 B: `aes/decrypt`

**请求参数:**
```json
{
  "action": "aes/decrypt",
  "requestId": "req-dec-01",
  "params": {
    "ciphertext": "xU38sFj9Z12...==",
    "secretKey": "my-vault-passphrase-888",
    "nonce": "aBcDeFgHiJkL",
    "keyBits": 256,
    "format": "base64"
  }
}
```

**响应报文:**
```json
{
  "code": 0,
  "msg": "Success",
  "requestId": "req-dec-01",
  "data": {
    "plaintext": "Secret Financial Report 2026",
    "verified": true,
    "algorithm": "AES-256-GCM"
  }
}
```
