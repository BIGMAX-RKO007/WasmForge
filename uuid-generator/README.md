# 1.4 UUID Generator & Validator (UUID 生成与校验器 WASM)

WasmForge 实用工具重构工程第四弹：基于 Rust 构建的纯单一 WebAssembly 模块。

## 🎯 功能特性

- **纯单一 WASM**：无任何 JS 胶水代码，纯 C-ABI 极简 3 符号协议。
- **RFC 4122 & RFC 9562 标准**：
  - `uuid/v4`：随机 UUID 生成（支持批量 count、大小写、连字符控制）
  - `uuid/v7`：毫秒时间戳单调有序 UUID 生成（替代传统 v1，适配分布式数据库主键）
  - `uuid/parse`：UUID 格式校验与版本/变体解构（返回 hyphenated, simple, urn）

## 🛠️ 构建与部署

```bash
npm test # 或 cargo test
npm run deploy # 编译并发布至 hono-htmx
```
