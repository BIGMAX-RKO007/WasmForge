# WasmForge Tool #7: BIP-39 Blockchain Mnemonic Generator & Validator (bip39-generator)

> 纯 WebAssembly (wasm32-unknown-unknown) 区块链助记词生成、校验和校验与 512 位二进制种子派生机能，严格遵循比特币 BIP-39 工业标准与 WasmForge 通用信封协议 (Universal Envelope Protocol)。

---

## 🌟 机能亮点

- **完整 BIP-39 规范**：内置 2048 个标准英文助记词词表，支持 12、15、18、21、24 词助记词生成。
- **严格校验和检查**：根据初始熵（128 至 256 位）自动计算 SHA-256 校验和并核验合法性。
- **PBKDF2-HMAC-SHA512 种子派生**：2048 轮次迭代计算 512 位 (64 字节) 高安全性主种子，支持可选自定义安全盐口令 (Passphrase)。
- **纯单一文件零胶水**：编译产物仅 ~345 KB，零 wasm-bindgen 胶水代码，可在后端 Node.js (Hono) 与现代浏览器原生毫秒级运行。

---

## 📐 C-ABI 通用信封协议规格

### 1. 导出函数

```c
void* alloc(size_t size);
void dealloc(void* ptr, size_t size);
uint64_t dispatch(const uint8_t* ptr, size_t len);
```

### 2. 接口操作

#### 操作 A: `bip39/generate`

**请求参数:**
```json
{
  "action": "bip39/generate",
  "requestId": "req-bip-01",
  "params": {
    "wordCount": 12,
    "passphrase": "vault-salt-2026"
  }
}
```

**响应报文:**
```json
{
  "code": 0,
  "msg": "Success",
  "requestId": "req-bip-01",
  "data": {
    "mnemonic": "abandon amount liar amount expire adjust cage candy arch gather drum buyer",
    "words": ["abandon", "amount", "..."],
    "wordCount": 12,
    "entropyHex": "00000000000000000000000000000000",
    "seedHex": "5b56c4173... (128 hex chars)"
  }
}
```

#### 操作 B: `bip39/validate`

**请求参数:**
```json
{
  "action": "bip39/validate",
  "requestId": "req-bip-02",
  "params": {
    "mnemonic": "abandon amount liar amount expire adjust cage candy arch gather drum buyer",
    "passphrase": "vault-salt-2026"
  }
}
```

**响应报文:**
```json
{
  "code": 0,
  "msg": "Success",
  "requestId": "req-bip-02",
  "data": {
    "mnemonic": "abandon amount liar amount expire adjust cage candy arch gather drum buyer",
    "isValid": true,
    "wordCount": 12,
    "seedHex": "5b56c4173... (128 hex chars)"
  }
}
```
