# 1.2 Hash Text (多算法文本哈希计算器 WASM)

WasmForge 实用工具重构工程第二弹：基于 Rust 构建的高性能纯单一 WebAssembly 模块。

## 🎯 功能特性

- **纯单一 WASM**：无任何 JS 胶水代码，宿主无关（Host-Agnostic）。
- **极速微秒级哈希**：基于 RustCrypto 原生实现，彻底告别老旧卡顿的 `crypto-js`。
- **支持算法**：
  - MD5 (128-bit)
  - SHA-1 (160-bit)
  - SHA-224, SHA-256, SHA-384, SHA-512
  - SHA3-224, SHA3-256, SHA3-384, SHA3-512
  - RIPEMD-160
- **双工作模式**：
  - `hash/calc`：指定算法单点极速计算
  - `hash/all`：一键并行计算 6 大主流哈希（MD5, SHA1, SHA256, SHA512, SHA3-256, RIPEMD160）
- **通用信封契约**：标准 `alloc` / `dealloc` / `dispatch` 3 符号 ABI。

## 🛠️ 构建与部署

```bash
# 本地测试
npm test # 或 cargo test

# 编译 release wasm 并发布
npm run deploy
```
