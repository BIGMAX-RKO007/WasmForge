# WasmForge Tool #8: HMAC Generator & Verifier (hmac-generator)

> 纯 WebAssembly (wasm32-unknown-unknown) 基于密钥的消息认证码 (HMAC) 生成与恒定时间防侧信道比对校验机能，严格遵循 RFC 2104 / RFC 4231 规范与 WasmForge 通用信封协议 (Universal Envelope Protocol)。

---

## 🌟 机能亮点

- **全算法矩阵覆盖**：原生集成 5 大主流哈希消息认证算法：
  - HMAC-MD5 (128-bit)
  - HMAC-SHA1 (160-bit)
  - HMAC-SHA256 (256-bit)
  - HMAC-SHA512 (512-bit)
  - HMAC-SHA3-256 (Keccak 256-bit)
- **恒定时间防侧信道时序攻击**：内置 `Mac::verify_slice` 恒定时间验证算法，杜绝因比较延迟泄露密钥的 Timing Attack。
- **纯单一文件零胶水**：产物仅 ~220 KB，零 wasm-bindgen 依赖，支持 Hex 与 Base64 自由格式切换。

---

## 📐 C-ABI 通用信封协议规格

### 1. 导出函数

```c
void* alloc(size_t size);
void dealloc(void* ptr, size_t size);
uint64_t dispatch(const uint8_t* ptr, size_t len);
```

### 2. 接口操作

#### 操作 A: `hmac/all`

**请求参数:**
```json
{
  "action": "hmac/all",
  "requestId": "req-hmac-01",
  "params": {
    "text": "The quick brown fox jumps over the lazy dog",
    "secretKey": "key",
    "format": "hex"
  }
}
```

**响应报文:**
```json
{
  "code": 0,
  "msg": "Success",
  "requestId": "req-hmac-01",
  "data": {
    "md5": "80070713463e7749b90c2dc24911e275",
    "sha1": "de7c9b85b8b78aa6bc8a7a36f70a90701c9db4d9",
    "sha256": "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8",
    "sha512": "b42af09057bac1e2d41708e48a702e7... (128 hex chars)",
    "sha3_256": "81f137e0e7a16e8... (64 hex chars)",
    "format": "hex"
  }
}
```

#### 操作 B: `hmac/verify`

**请求参数:**
```json
{
  "action": "hmac/verify",
  "requestId": "req-hmac-02",
  "params": {
    "text": "The quick brown fox jumps over the lazy dog",
    "secretKey": "key",
    "hmac": "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8",
    "algorithm": "sha256",
    "format": "hex"
  }
}
```

**响应报文:**
```json
{
  "code": 0,
  "msg": "Success",
  "requestId": "req-hmac-02",
  "data": {
    "valid": true,
    "algorithm": "sha256"
  }
}
```
