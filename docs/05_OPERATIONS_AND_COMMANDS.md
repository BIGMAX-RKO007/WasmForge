# 05. 运行指南与全套常用命令手册

本手册汇集了 WASM 工厂日常开发、依赖管理、纯 WASM 编译、产物归档、测试场部署的全流程命令，方便日常查阅与快速执行。

---

## 一、 环境依赖安装与初始化 (一次性配置)

本项目采用 `mise` 管理统一开发工具链版本：

```powershell
# 1. 安装 Node.js 与 npm (若未安装)
mise use -g node@22
mise use -g npm@latest

# 2. 安装免 MSVC 的 GNU Rust 工具链
mise use -g rust@stable-x86_64-pc-windows-gnu

# 3. 添加 WebAssembly 交叉编译目标架构
rustup target add wasm32-unknown-unknown

# 4. 验证工具链环境
node -v
rustc --version
cargo --version
```

### 推荐的 IDE 预览增强插件 (可选)
如果使用 VS Code 开发，建议安装以下官方扩展提升文档与架构图的查阅体验：
- **`Markdown Preview Mermaid Support`**（扩展 ID: `bierner.markdown-mermaid`）：让 VS Code 原生 Markdown 预览窗口支持交互式 Mermaid 图表渲染。
```powershell
# 可通过命令行一键安装
code --install-extension bierner.markdown-mermaid
```

---

## 二、 Rust 生产线 (`rs-wasm`) 常用命令

工作目录：`C:\Users\FX\Projects\wasm\rs-wasm`

```powershell
# 进入目录
cd C:\Users\FX\Projects\wasm\rs-wasm

# 1. 编写代码后，下载与检查依赖
cargo check

# 2. 运行原生单元测试 (验证数值与内部逻辑)
cargo test

# 3. 编译为纯单一 WASM 二进制文件 (Release 最高性能优化)
cargo build --target wasm32-unknown-unknown --release
# 产物生成于: target\wasm32-unknown-unknown\release\rs_wasm.wasm

# 4. 手动拷贝并重命名至 hono-htmx 的单一资产库
Copy-Item target\wasm32-unknown-unknown\release\rs_wasm.wasm ..\hono-htmx\public\wasm\rs.wasm

# 💡【日常开发最推荐】一键构建并自动拷贝:
npm run deploy
```

---

## 三、 AssemblyScript 生产线 (`ts-wasm`) 常用命令

工作目录：`C:\Users\FX\Projects\wasm\ts-wasm`

```powershell
# 进入目录
cd C:\Users\FX\Projects\wasm\ts-wasm

# 1. 编写代码后，安装/更新依赖
npm install

# 2. 运行自动化测试
npm test

# 3. 编译为纯单一 WASM 二进制文件 (开启 -O3，并剥离任何 JS 胶水)
npx asc assembly/index.ts --outFile build/ts.wasm -O3 --bindings none
# 产物生成于: build\ts.wasm

# 4. 手动拷贝并重命名至 hono-htmx 的单一资产库
Copy-Item build\ts.wasm ..\hono-htmx\public\wasm\ts.wasm

# 💡【日常开发最推荐】一键构建并自动拷贝:
npm run deploy
```

---

## 四、 消费端与综合测试场 (`hono-htmx`) 常用命令

工作目录：`C:\Users\FX\Projects\wasm\hono-htmx`

```powershell
# 进入目录
cd C:\Users\FX\Projects\wasm\hono-htmx

# 1. 安装 Hono 及 Node 服务端适配器依赖 (首次运行时)
npm install

# 2. 启动服务 (基础设施自动从 public/wasm/ 加载 rs.wasm 和 ts.wasm)
npm start

# 3. 开发模式启动 (监听服务端代码热重载)
npm run dev
```

### 访问与交互体验：
- 打开浏览器访问：**`http://localhost:3000`**
- **后端场景**：左侧修改表单，HTMX 发起异步 HTTP 请求，Hono 宿主调用对应 WASM 执行并返回带耗时徽章的局部 HTML 片段；
- **前端场景**：右侧修改输入，当前浏览器标签页原生实例化 WASM 直接计算；
- **四象限基准**：点击底部绿色按钮，同时并行向四个象限触发计算，全方位对账逻辑一致性。

---

## 五、 工厂扩容指南：如何添加新的业务功能？

当需要为 WASM 工厂增加新的业务逻辑（例如 `sha256(text)`）时，标准工作流如下：

1. **Rust 端实现**：
   - 在 `rs-wasm/src/lib.rs` 中编写 `#[no_mangle] pub extern "C" fn sha256(ptr: *const u8, len: usize) -> u64`；
   - 同样使用 `Box<[u8]>` 返回 `(outPtr << 32) | outLen`；
   - 运行 `npm run deploy` 自动重新生成并覆盖 `rs.wasm`。

2. **AssemblyScript 端实现**：
   - 在 `ts-wasm/assembly/index.ts` 中编写同名同签名的 `export function sha256(ptr: usize, len: usize): u64`；
   - 运行 `npm run deploy` 自动重新生成并覆盖 `ts.wasm`。

3. **基础设施层调用**：
   - 在 `hono-htmx` 的 `WasmEngine` 中增加对应的 `sha256(text)` 方法（内部直接调用已封装好的字符串通用流）；
   - 服务端和浏览器端立即可用！无需变动任何加载器代码。
