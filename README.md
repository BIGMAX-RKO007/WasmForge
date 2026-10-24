# WebAssembly (WASM) 多语言工厂项目

本项目是一个探索与沉淀 WebAssembly (WASM) 模块的“WASM 工厂”仓库，支持将多种语言编写的高性能计算与业务逻辑编译为 WASM，并分发嵌入到浏览器、Node.js 服务端、边缘计算等各类宿主场景中。

当前仓库包含核心方案与一个统一的跨端测试验证工程：
- **`ts-wasm`**：基于 **AssemblyScript**（TypeScript 语法子集）构建的 WASM 项目。
- **`rs-wasm`**：基于 **Rust + wasm-pack + wasm-bindgen** 构建的工业级 WASM 项目。
- **`hono-htmx`**：基于 **Hono (Node.js 后端) + HTMX (超媒体前端)** 构建的**跨端综合测试场**，支持将 Rust 与 TS 编译的 WASM 模块无缝加载于「后端 Hono SSR/API」和「前端浏览器客户端」双场景下，并进行一致性与性能横向对比。

---

## 📚 详细设计与沉淀文档索引

为了完整记录本项目的设计精髓、演进思考与实战避坑经验，我们在 `docs/` 目录下建立了成体系的技术专稿：

| 文档 | 核心主题 | 说明 |
| :--- | :--- | :--- |
| **[01. 初衷、愿景与架构哲学](file:///c:/Users/FX/Projects/wasm/docs/01_VISION_AND_PHILOSOPHY.md)** | 为什么做 WASM 工厂？纯单一文件的追求 | 详述多端异构痛点、Rust/TS选型考量、宿主无关性（Host-Agnostic）的终极价值。 |
| **[02. 系统架构与详细设计说明书](file:///c:/Users/FX/Projects/wasm/docs/02_ARCHITECTURE_AND_DESIGN.md)** | 架构图、模块分层、C-ABI 规范 | 包含 Mermaid 全景架构图、WASM 基础设施层设计、线性内存与数据打包通信协议。 |
| **[03. 项目演进历程与思考过程](file:///c:/Users/FX/Projects/wasm/docs/03_DEVELOPMENT_JOURNEY.md)** | 4 个演进阶段的认知跃迁 | 记录从 TS 原型、Rust 接入、胶水包装到最终“破除胶水壁垒、纯净单一 WASM”的觉悟。 |
| **[04. 踩坑全记录与避坑技术指南](file:///c:/Users/FX/Projects/wasm/docs/04_PITFALLS_AND_SOLUTIONS.md)** | 5 大典型坑与深度剖析 | MSVC 链接器缺失、wasm-opt 网络断连、Rust 内存释放 unreachable 恐慌排查、MIME 类型等。 |
| **[05. 运行指南与全套常用命令手册](file:///c:/Users/FX/Projects/wasm/docs/05_OPERATIONS_AND_COMMANDS.md)** | 全量开发/构建/部署命令 | Rust 生产线、TS 生产线、Hono 测试场常用命令，以及工厂扩容新功能的标准流程。 |
| **[06. 统一接口通信规范 (Envelope Protocol)](file:///c:/Users/FX/Projects/wasm/docs/06_INTERFACE_SPECIFICATION.md)** | 标准输入输出信封契约 | 确立极简 3 符号 ABI (`alloc`/`dealloc`/`dispatch`)，规范 JSON 请求/响应信封与错误码体系。 |
| **[07. it-tools 全功能领域分类与 WASM 赋能全景手册](file:///c:/Users/FX/Projects/wasm/docs/07_IT_TOOLS_DOMAIN_CAPABILITIES.md)** | 10 大领域 85 项机能全景 | 将业界最火开源工具箱 `it-tools` 完整按领域拆解分类，给出每项机能的 WASM 改造价值评估与 Rust Crate 推荐。 |

---

## 目录结构

```text
wasm/
├── README.md                  # 本文档：项目背景、搭建步骤与全方位对比指南
├── package.json               # 根目录基础配置
├── ts-wasm/                   # [方案一] AssemblyScript 实现方案
│   ├── assembly/
│   │   ├── index.ts           # 核心逻辑 (add, greet)
│   │   └── tsconfig.json
│   ├── build/                 # 编译产物 (release.wasm, release.js, release.d.ts)
│   ├── test/                  # 自动化测试 (node --test)
│   ├── index.html             # 浏览器预览
│   ├── asconfig.json          # AssemblyScript 编译配置
│   └── package.json           # npm run asbuild / npm test / npm start
│
├── rs-wasm/                   # [方案二] Rust + wasm-pack 实现方案
│   ├── Cargo.toml             # Rust 项目配置与 wasm-bindgen 依赖
│   ├── src/
│   │   └── lib.rs             # 核心逻辑 (add, greet) 与原生单元测试
│   ├── pkg/                   # 浏览器端产物 (--target web)
│   ├── pkg-node/              # Node.js 服务端产物 (--target nodejs)
│   ├── test/
│   │   └── index.js           # Node.js 宿主测试 (node --test)
│   ├── index.html             # 现代化交互式 Web 演示页面
│   └── package.json           # npm run build / npm test / npm start
│
└── hono-htmx/                 # [综合测试场] Hono + HTMX 双端 WASM 运行环境
    ├── src/
    │   ├── infrastructure/
    │   │   └── wasm/
    │   │       ├── wasm-engine.js        # 通用 WASM 执行核心 (C-ABI/内存管理/字符串编解码)
    │   │       └── wasm-loader.node.js   # Node.js 后端加载器 (直接读取单一 .wasm)
    │   └── server.js                     # Hono 服务端 (静态托管 + HTMX API 接口)
    ├── public/
    │   ├── infrastructure/
    │   │   └── wasm/
    │   │       ├── wasm-engine.js        # 浏览器端通用 WASM 执行核心
    │   │       └── wasm-loader.browser.js # 浏览器端加载器 (fetch + 实例化)
    │   ├── wasm/                         # 纯单一 WASM 存放目录 (仅两个二进制文件!)
    │   │   ├── rs.wasm                   # 纯净 Rust WASM 单文件 (~24 KB)
    │   │   └── ts.wasm                   # 纯净 AssemblyScript WASM 单文件 (~5 KB)
    │   └── index.html                    # HTMX 异步交互 + 浏览器原生 WASM 仪表盘
    └── package.json                      # npm start
```

---

## Rust WASM 项目 (`rs-wasm`) 搭建全记录

以下记录了在当前 Windows 环境下，从零通过 `mise` 配置工具链并创建 `rs-wasm` 项目的完整可复现步骤：

### 第一步：通过 `mise` 安装 Rust 与 WASM 工具链

利用开发环境版本管理工具 `mise` 安装 Rust 工具链与 `wasm-pack`：

1. **安装 Rust 工具链**：
   ```powershell
   # 安装 GNU 目标工具链（免去 Windows MSVC/Visual Studio C++ Build Tools 依赖）
   mise use -g rust@stable-x86_64-pc-windows-gnu
   ```

2. **安装 `wasm-pack` 打包器**：
   ```powershell
   # 通过 mise 的 aqua 后端快速安装 wasm-pack 二进制
   mise use -g aqua:wasm-bindgen/wasm-pack
   ```

3. **添加 WebAssembly 编译目标**：
   ```powershell
   rustup target add wasm32-unknown-unknown
   ```

4. **验证工具链版本**：
   ```powershell
   rustc --version       # 例: rustc 1.99.1
   cargo --version       # 例: cargo 1.99.1
   wasm-pack --version   # 例: wasm-pack 0.15.0
   ```

---

### 第二步：创建 `rs-wasm` 项目与配置 `Cargo.toml`

在 `rs-wasm/Cargo.toml` 中配置 `cdylib` 动态库类型，并声明 `wasm-bindgen`：

```toml
[package]
name = "rs-wasm"
version = "0.1.0"
edition = "2021"
description = "Rust WebAssembly Module"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2"

[dev-dependencies]
wasm-bindgen-test = "0.3"

# 禁用 release 自动下载外置 wasm-opt（防止跨国网络超时，由 lto 与 opt-level 保证优化）
[package.metadata.wasm-pack.profile.release]
wasm-opt = false

[profile.release]
opt-level = "s"
lto = true
```

---

### 第三步：编写核心 Rust WASM 逻辑 (`src/lib.rs`)

编写暴露给宿主环境的函数：
- `add(a, b)`：基础数值运算，与 `ts-wasm` 对齐；
- `greet(name)`：字符串传递与内存交互，展示 `wasm-bindgen` 跨边界胶水层的能力。

```rust
use wasm_bindgen::prelude::*;

/// 基础加法运算，与 ts-wasm 的 add(a, b) 对齐
#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

/// 字符串问候函数，展示 Rust + wasm-bindgen 的内存与字符串传递能力
#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! This is WebAssembly powered by Rust 🦀", name)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add() {
        assert_eq!(add(1, 2), 3);
        assert_eq!(add(-5, 10), 5);
    }

    #[test]
    fn test_greet() {
        assert_eq!(
            greet("Rust"),
            "Hello, Rust! This is WebAssembly powered by Rust 🦀"
        );
    }
}
```

---

### 第四步：多目标编译（Web 浏览器 + Node.js）

Rust 配合 `wasm-pack` 可以针对不同的运行时生成定制胶水代码：

1. **编译为 Web 浏览器 ESM 目标**（输出至 `pkg/` 目录）：
   ```powershell
   wasm-pack build --target web --out-dir pkg
   ```
   > 产物包含 `rs_wasm.js`（ES Module 导出 `init()`, `add()`, `greet()`）与 `rs_wasm_bg.wasm`。

2. **编译为 Node.js 运行时目标**（输出至 `pkg-node/` 目录）：
   ```powershell
   wasm-pack build --target nodejs --out-dir pkg-node
   ```
   > 产物自动使用 Node.js 的 `fs` 同步读取并实例化 WASM，便于后端服务引入。

---

### 第五步：工程脚本集成与自动化测试

为了拥有与 `ts-wasm` 一致的前端开发体验，在 `rs-wasm/package.json` 中配置了标准 npm 脚本：

```json
{
  "name": "rs-wasm",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build:web": "wasm-pack build --target web --out-dir pkg",
    "build:node": "wasm-pack build --target nodejs --out-dir pkg-node",
    "build": "npm run build:web && npm run build:node",
    "test": "node --test test/index.js",
    "start": "npx serve ."
  }
}
```

并在 `rs-wasm/test/index.js` 中使用 Node.js 内置测试器测试构建产物：
```javascript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { add, greet } = require("../pkg-node/rs_wasm.js");

describe("rs-wasm tests", () => {
  it("add(1, 2) should return 3", () => {
    assert.equal(add(1, 2), 3);
  });
  it("greet('Rust') should return formatted greeting string", () => {
    assert.equal(
      greet("Rust"),
      "Hello, Rust! This is WebAssembly powered by Rust 🦀"
    );
  });
});
```

---

## 快速运行与验证

### 1. 运行 `rs-wasm` (Rust)

```powershell
cd rs-wasm

# 编译所有目标 (web + node)
npm run build

# 运行自动化测试
npm test

# 启动本地服务在浏览器预览现代化 UI
npm start
```
浏览器打开 `http://localhost:3000` 即可在可视化界面中实时调试加法与字符串问候。

### 2. 运行 `ts-wasm` (AssemblyScript)

```powershell
cd ts-wasm

# 编译 debug & release wasm (包含 add 和 greet)
npm run asbuild

# 运行自动化测试
npm test

# 启动本地网页服务
npm start
```

### 3. 运行 `hono-htmx` (跨端综合测试基准)

```powershell
cd hono-htmx

# 一键自动同步并启动 Hono 服务
npm start
```
打开浏览器访问 `http://localhost:3000`：
- **后端场景**：通过 HTMX 发送异步表单到 Hono，后端调用 WASM 并局部刷新 HTML 视图与服务端耗时。
- **前端场景**：浏览器通过 ES Module 原生加载并调用 Rust / TS WASM 模块，零网络延迟计算。
- **4 维度矩阵基准**：一键并行测试【后端 Rust】、【后端 TS】、【前端 Rust】、【前端 TS】，校验逻辑一致性、运行耗时与模块体积。

---

## 技术方案横向对比与选型指南

| 评估维度 | AssemblyScript (`ts-wasm`) | Rust (`rs-wasm`) |
| :--- | :--- | :--- |
| **上手门槛** | 极低（TS 前端工程师友好） | 中高（需掌握 Rust 所有权与生命周期） |
| **运行时机制** | 需自带轻量 GC 与内存分配器打入 WASM | **零运行时 GC**，编译为纯净原生指令 |
| **内存/体积** | 模块虽小但包含运行时 GC，有潜在垃圾回收抖动 | 内存分配精确受控，极致性能与预测性 |
| **复杂类型支持** | 基础类型极快，复杂对象跨边界交互需额外工具 | `wasm-bindgen` 与 `serde` 生态无缝支持结构体/JSON |
| **生态库丰富度** | 较弱（无法直接复用 npm 已有的 JS 库） | 极强（[crates.io](https://crates.io) 绝大部分加解密、算法、解析库皆可编译） |
| **跨场景通用性** | 主要针对 JS/Web/Node 宿主 | **全场景通用**（Web、Node、WASI、Envoy网关插件、Go/Python/C++ 宿主） |

### 选型建议：
- **选择 AssemblyScript (`ts-wasm`)**：纯前端/Node 场景、轻量数据计算、希望前端团队零成本快速上手。
- **选择 Rust (`rs-wasm`)**：作为工业级 **“WASM 工厂”** 的基石，承载复杂加密、音视频/图像处理、语法解析、规则引擎，并需要分发至多语言及非 JS 宿主环境。

---

## 常用核心命令手册 (纯单一 WASM 工作流)

### 1. Rust 项目 (`rs-wasm`) 命令清单

```powershell
# 1. 切换到项目目录
cd C:\Users\FX\Projects\wasm\rs-wasm

# 2. 下载与校验依赖
cargo check

# 3. 编译为纯净单一 WASM 文件（无第三方 JS 胶水）
cargo build --target wasm32-unknown-unknown --release

# 4. 产物位置：
# target\wasm32-unknown-unknown\release\rs_wasm.wasm

# 5. 重命名并拷贝至 hono-htmx 的单一 WASM 目录 (同时供前后端消费)
Copy-Item target\wasm32-unknown-unknown\release\rs_wasm.wasm ..\hono-htmx\public\wasm\rs.wasm

# [快捷命令] 编译并自动导出
npm run deploy
```

---

### 2. AssemblyScript 项目 (`ts-wasm`) 命令清单

```powershell
# 1. 切换到项目目录
cd C:\Users\FX\Projects\wasm\ts-wasm

# 2. 下载与校验依赖
npm install

# 3. 编译为纯净单一 WASM 文件（--bindings none，不生成 .js）
npx asc assembly/index.ts --outFile build/ts.wasm -O3 --bindings none

# 4. 产物位置：
# build\ts.wasm

# 5. 重命名并拷贝至 hono-htmx 的单一 WASM 目录 (同时供前后端消费)
Copy-Item build\ts.wasm ..\hono-htmx\public\wasm\ts.wasm

# [快捷命令] 编译并自动导出
npm run deploy
```

---

### 3. Hono + HTMX 基础设施运行命令

```powershell
# 1. 切换到测试场目录
cd C:\Users\FX\Projects\wasm\hono-htmx

# 2. 启动服务 (内置基础设施加载 public/wasm/ 下的纯单一 WASM 文件)
npm start

# 3. 访问测试界面
# 浏览器打开 http://localhost:3000
```
