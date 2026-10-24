# 03. 项目演进历程与思考过程

---

## 阶段一：用 AssemblyScript 跑通最小可行原型 (`ts-wasm`)

### 思考与尝试
在项目初始阶段，我们的首要目标是验证 WebAssembly 的可行性。
我们选择从前端开发者熟悉的 TypeScript 语法切入，采用 AssemblyScript 初始化了 `ts-wasm` 项目：
- 通过 `npx asinit .` 生成了标准脚手架；
- 编写了一个简单的 `add(a: i32, b: i32): i32`；
- 使用 `asc assembly/index.ts --target release` 编译出第一批 WASM 产物；
- 通过 `node --test` 和浏览器静态服务器验证了加法计算。

### 阶段结论
AssemblyScript 上手极其迅速，让我们在极短时间内确立了对 WASM 生态的信心。然而我们很快意识到：仅支持纯数值计算并不能应对复杂的实际业务场景，同时我们需要引入工业级语言 Rust。

---

## 阶段二：引入 Rust 工具链与 wasm-pack 方案 (`rs-wasm`)

### 思考与尝试
为了让工厂具备生产高计算密度、复杂安全算法的能力，我们启动了 `rs-wasm` 项目：
1. **环境初始化**：利用统一版本管理工具 `mise` 安装了 Rust 编译器（`rustc 1.99.1`）、包管理器 `cargo` 以及打包工具 `wasm-pack`；
2. **胶水框架试水**：引入了 Rust WASM 领域最主流的 `wasm-bindgen`，并在 `src/lib.rs` 中编写了 `add` 和 `greet` 函数；
3. **双目标构建**：尝试通过 `wasm-pack build --target web` 和 `wasm-pack build --target nodejs` 分别导出面向浏览器和 Node.js 的产物；
4. **验证通过**：Node 原生测试全部通过，浏览器页面成功跑起。

### 遇到的痛点
我们发现 `wasm-pack` 针对 Web 生成了一套 `pkg/`（ESM 胶水），针对 Node 生成了另一套 `pkg-node/`（CJS 胶水）。
**此时引发了关键反思**：
> 如果每增加一种运行环境（如 Python、Go、Java、微服务、边缘容器），我们都要重新构建或者引入对应的定制胶水，那么这个“WASM 工厂”的产物是严重碎片化、不可控的。

---

## 阶段三：构建多端综合测试场 (`hono-htmx`)

### 思考与尝试
为了客观评估不同语言编译出的 WASM 在不同场景下的表现，我们建立了 `hono-htmx` 综合测试场：
- **后端选择 Hono**：轻量级、零冷启动开销、基于标准 Web Standards API，是当前现代服务端的代表；
- **前端选择 HTMX**：通过超媒体属性（`hx-post`、`hx-swap`）直接由后端驱动页面局部刷新，无需构建臃肿的前端框架；
- **四维矩阵构建**：在同一个单页控制台中，同时把【后端 Rust】、【后端 TS】、【前端 Rust】、【前端 TS】拉出来跑马对比。

---

## 阶段四：关键觉悟——向“纯净单一 WASM 架构”彻底跃迁

### 核心决策
在测试场搭建初期，我们写了一个脚本把 `wasm-pack` 和 `asc` 生成的 `.js` 包装文件复制到 `hono-htmx` 中。
但用户提出了极具战略眼光的架构要求：
> **“我希望 hono-htmx 中只包含单一 wasm 文件，读取 wasm 文件的机能请在 hono-htmx 中作为基础设施来实现！”**

这一决策瞬间点亮了整个项目的终极架构路径：
1. **剥离胶水依赖**：
   - 彻底删除 `rs-wasm` 中的 `wasm-bindgen` 运行时绑定；
   - 彻底关闭 `ts-wasm` 的 `--bindings esm` 包装器。
2. **统一标准 C-ABI**：
   - 确立 `add(i32, i32) -> i32`；
   - 确立通用指针与内存打包协议：`greet(ptr, len) -> u64 ((ptr << 32) | len)`；
   - 确立标准的 `alloc` 与 `dealloc` 内存管理接口。
3. **下沉基础设施层**：
   - 在 `hono-htmx` 中自研 `WasmEngine`，无论面对谁编译出的 `.wasm`，都使用同一套机制完成加载、内存写入、调用与结果解析。

**至此，WASM 工厂真正实现了工业级的“宿主无关、即插即用”！**
