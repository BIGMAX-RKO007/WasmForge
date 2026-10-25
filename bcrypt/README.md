# 1.3 Bcrypt (密码哈希生成与比对校验 WASM)

WasmForge 实用工具重构工程第三弹：基于 Rust 构建的高性能纯单一 WebAssembly 模块。

## 🎯 功能特性

- **纯单一 WASM**：无 JS 胶水代码，统一 C-ABI 极简 3 符号协议。
- **高性能密码安全**：替代低效卡顿的纯 JS `bcryptjs`，提供纳秒级 Blowfish 密钥编排与多轮哈希。
- **双工作模式**：
  - `bcrypt/hash`：输入明文密码与 rounds (4~16) 计算安全加盐密文。
  - `bcrypt/verify`：输入明文密码与密文执行恒定时间安全比对。

## 🛠️ 构建与部署

```bash
npm test # 或 cargo test
npm run deploy # 编译 wasm32-unknown-unknown 并发布
```
