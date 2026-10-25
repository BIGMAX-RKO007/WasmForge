# 1.1 Token Generator (令牌与密码生成器 WASM)

WasmForge 实用工具重构工程第一弹：基于 Rust 构建的纯单一 WebAssembly 模块。

## 🎯 功能特性

- **纯单一 WASM**：无任何 `wasm-bindgen` 或外部 JS 胶水代码，宿主无关。
- **信封通信契约 (Envelope Protocol)**：通过标准 `alloc` / `dealloc` / `dispatch` 进行 JSON 载荷通信。
- **丰富配置**：
  - 动态长度指定（4 ~ 65536）
  - 大写字母 (A-Z)、小写字母 (a-z)、数字 (0-9)、特殊符号自定义开关
  - 自定义字符表（覆盖预设开关）
  - 密码学熵值（Entropy Bits）实时评估
  - 支持单次生成 (`token/generate`) 与批量生成 (`token/batch`)

## 🛠️ 构建与部署

```bash
# 1. 运行本地单元测试
npm test # 或 cargo test

# 2. 编译纯 release .wasm
npm run build:wasm

# 3. 同步至 hono-htmx 测试场
npm run export

# 4. 一键构建并发布
npm run deploy
```

## 📋 C-ABI 与信封示例

### 请求示例 (`token/generate`)

```json
{
  "action": "token/generate",
  "requestId": "req-001",
  "params": {
    "length": 32,
    "withUppercase": true,
    "withLowercase": true,
    "withNumbers": true,
    "withSymbols": true
  }
}
```

### 响应示例

```json
{
  "code": 0,
  "msg": "success",
  "requestId": "req-001",
  "data": {
    "token": "PvYtPUDr33kReedIMTSwlvTiWyqCUlUx",
    "length": 32,
    "charsetSize": 87,
    "entropyBits": 206.2
  }
}
```
