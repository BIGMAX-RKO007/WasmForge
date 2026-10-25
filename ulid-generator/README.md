# WasmForge Tool #5: ULID Generator & Parser (ulid-generator)

> 纯 WebAssembly (wasm32-unknown-unknown) 高性能 ULID（可按时间字典排序的全局唯一标识符）生成与解析机能，严格遵循 Crockford's Base32 编码标准与 WasmForge 通用信封协议 (Universal Envelope Protocol)。

---

## 🌟 机能亮点

- **128 位精度与时间单调**：48 位毫秒时间戳 + 80 位高质量伪随机熵，保证毫秒内高并发生成与全局字典排序。
- **Crockford's Base32 规范**：26 字符长度，自动规避易混淆字符（I, L, O, U），完全大小写兼容与 URL 安全。
- **零胶水双端直跑**：编译产物仅 ~141 KB，不依赖 `wasm-bindgen` 与宿主环境特性，纯单一文件直接加载。
- **双向能力**：支持批量 `ulid/generate` 生成与 `ulid/parse` 毫秒级时间戳及 ISO 8601 UTC 字符串反向提取。

---

## 📐 C-ABI 通用信封协议规格

### 1. 导出函数

```c
void* alloc(size_t size);
void dealloc(void* ptr, size_t size);
uint64_t dispatch(uint64_t packed_ptr_len);
```

### 2. 接口操作

#### 操作 A: `ulid/generate`

**请求参数:**
```json
{
  "action": "ulid/generate",
  "requestId": "req-101",
  "params": {
    "count": 5,
    "timestampMs": 1729828800000,
    "seed": 12345678
  }
}
```

**响应报文:**
```json
{
  "code": 0,
  "msg": "Success",
  "requestId": "req-101",
  "data": {
    "ulids": [
      "01JB1S09G024HRDWT3J28P2C9Q",
      "01JB1S09G043TRKW700Y8E2M8G"
    ],
    "timestampMs": 1729828800000,
    "datetimeIso": "2024-10-25T04:00:00.000Z"
  }
}
```

#### 操作 B: `ulid/parse`

**请求参数:**
```json
{
  "action": "ulid/parse",
  "requestId": "req-102",
  "params": {
    "ulid": "01JB1S09G024HRDWT3J28P2C9Q"
  }
}
```

**响应报文:**
```json
{
  "code": 0,
  "msg": "Success",
  "requestId": "req-102",
  "data": {
    "ulid": "01JB1S09G024HRDWT3J28P2C9Q",
    "timestampMs": 1729828800000,
    "datetimeIso": "2024-10-25T04:00:00.000Z",
    "isValid": true
  }
}
```
