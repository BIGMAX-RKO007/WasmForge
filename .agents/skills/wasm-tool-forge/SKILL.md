---
name: wasm-tool-forge
description: End-to-end industrial pipeline to refactor developer tools and utility functions into pure, standalone, host-agnostic WebAssembly (.wasm) modules following WasmForge's Universal Envelope Protocol and C-ABI specifications. Covers Cargo crate scaffolding, pure C-ABI exports, single-file release build without JS glue, hono-htmx dual-runtime integration, and automated verification. Use when asked to 重构wasm机能、开发wasm工具、制作wasm模块、WASM重构、add wasm tool, refactor tool to wasm.
---

# WASM Tool Forge (机能重构与产出工作流规范)

本 Skill 定义了将日常工具与实用函数重构为工业级、宿主无关、单一文件 WebAssembly 模块的标准流水线（SOP）。

---

## 🎯 核心架构铁律 (Core Axioms)

1. **绝对纯净单一文件 (`.wasm`)**：
   - 严禁生成任何针对特定运行时（如 Node.js 或 Web）的 JavaScript 胶水代码（如 `wasm-bindgen` JS 包装器）。
   - 目标 target 必须为 `wasm32-unknown-unknown`。
2. **极简 3 符号 C-ABI 原则**：
   无论内部包含多少算法，模块仅对外导出 3 个标准符号：
   - `alloc(size: usize) -> *mut u8`
   - `dealloc(ptr: *mut u8, size: usize)`
   - `dispatch(ptr: *const u8, len: usize) -> u64` (高32位指针，低32位长度)
3. **内存管理安全规范**：
   - 分配与释放统一采用 `Box<[u8]>` 切片方案，严禁在 `dealloc` 中使用与容量不一致的 `Vec::from_raw_parts`，防止 `RuntimeError: unreachable` 崩溃。
4. **统一信封契约 (Universal Envelope Protocol)**：
   - 入参：JSON 格式 `{ action, requestId, params }`。
   - 出参：JSON 格式 `{ code, msg, requestId, data }`。
   - 内部发生错误时严禁 panic，必须捕获并返回 `code != 0` 的错误信封。
5. **单闭环交付节奏**：
   - 必须独立一个一个做，每个机能建立同名文件夹，产物发布到 `hono-htmx/public/wasm/`，并通过后端 API 与前端 UI 双端实测验证。

---

## 📋 9 步标准作业程序 (9-Step SOP)

### 步骤 1：机能定义与信封设计
明确工具的 `action` 路由名称、入参参数类型与响应结构体。
- 路由规则：`领域/子动作`（如 `hash/calc`、`hash/all`、`token/generate`）。
- 错误码规划：`0` 为成功，`4001` 为入参格式错误，`4002` 为参数校验错误，`5000` 为计算异常。

### 步骤 2：创建独立同名工程
在项目根目录下创建专用子目录（如 `<tool-name>/`），包含以下骨架：
- `<tool-name>/Cargo.toml`
- `<tool-name>/src/lib.rs`
- `<tool-name>/package.json`
- `<tool-name>/README.md`

#### `Cargo.toml` 标准模板：
```toml
[package]
name = "<tool-name>"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
serde = { version = "1.0", default-features = false, features = ["alloc", "derive"] }
serde_json = { version = "1.0", default-features = false, features = ["alloc"] }
# 加入算法所需的轻量 crate (确保无 OS 依赖)

[profile.release]
opt-level = "s"
lto = true
codegen-units = 1
panic = "abort"
```

#### `package.json` 标准模板：
```json
{
  "name": "<tool-name>",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build:wasm": "cargo build --target wasm32-unknown-unknown --release",
    "export": "powershell -Command \"Copy-Item target/wasm32-unknown-unknown/release/<crate_name>.wasm ../hono-htmx/public/wasm/<tool-name>.wasm\"",
    "deploy": "npm run build:wasm ; npm run export",
    "test": "cargo test"
  }
}
```

### 步骤 3：编写 C-ABI 与信封调度 (`src/lib.rs`)
```rust
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct Request {
    action: String,
    #[serde(rename = "requestId")]
    request_id: Option<String>,
    #[serde(default)]
    params: serde_json::Value,
}

#[derive(Serialize)]
struct Response<T: Serialize> {
    code: i32,
    msg: String,
    #[serde(rename = "requestId", skip_serializing_if = "Option::is_none")]
    request_id: Option<String>,
    data: Option<T>,
}

fn handle_dispatch(input: &[u8]) -> String {
    // 业务路由与错误拦截
}

// -----------------------------------------------------------------------------
// Universal C-ABI Exports (alloc, dealloc, dispatch)
// -----------------------------------------------------------------------------

#[no_mangle]
pub extern "C" fn alloc(size: usize) -> *mut u8 {
    let buf = vec![0u8; size].into_boxed_slice();
    Box::into_raw(buf) as *mut u8
}

#[no_mangle]
pub extern "C" fn dealloc(ptr: *mut u8, size: usize) {
    if !ptr.is_null() && size > 0 {
        unsafe {
            let slice = std::slice::from_raw_parts_mut(ptr, size);
            drop(Box::from_raw(slice));
        }
    }
}

#[no_mangle]
pub extern "C" fn dispatch(ptr: *const u8, len: usize) -> u64 {
    let input_slice = unsafe { std::slice::from_raw_parts(ptr, len) };
    let response_json = handle_dispatch(input_slice);

    let boxed = response_json.into_bytes().into_boxed_slice();
    let out_len = boxed.len() as u64;
    let out_ptr = Box::into_raw(boxed) as *mut u8 as u64;
    (out_ptr << 32) | (out_len & 0xFFFFFFFF)
}
```

### 步骤 4：本地单元测试
在提交与编译前必须编写并通过测试：
```bash
cargo test
```

### 步骤 5：发布单一 `.wasm` 到测试场
```bash
cargo build --target wasm32-unknown-unknown --release
# 将产物复制到 hono-htmx/public/wasm/<tool-name>.wasm
```

### 步骤 6：Hono 服务端集成
在 `hono-htmx/src/server.js` 中：
1. 载入新 WASM 模块。
2. 暴露 `/api/backend/<tool-name>/...` 端点，支持 HTMX 表单与 JSON 调用。
3. 统计端点 `/api/stats` 加入新模块体积监控。

### 步骤 7：HTMX + 前端原生 WASM 界面集成
在 `hono-htmx/public/index.html` 中：
1. 增加工具专属操作卡片（包含 HTMX 局部刷新与前端原生执行双按钮）。
2. 在前端 `bootstrap()` 异步加载 `<tool-name>.wasm` 到 `window.wasmContext`。
3. 挂载浏览器端直接调度函数 `window.runFrontend<ToolName>()`。

### 步骤 8：双端真实运行验证
1. 执行 `curl.exe` 测试后端 API 正确性。
2. 通过 `browser_subagent` 在真实浏览器测试 UI 点击、输入联动与本地 WASM 运算。

### 步骤 9：文档更新与 Git 提交
1. 编写 `<tool-name>/README.md`。
2. 更新根目录 `README.md` 与进度日志。
3. 执行 `git commit` 并推送到远程仓库。
