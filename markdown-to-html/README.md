# @wasm-forge/markdown-to-html

基于 `pulldown-cmark` 的高性能 Markdown 转 HTML 渲染 WebAssembly 模块 (Tool #30)。

## 功能特性
- **CommonMark 标准兼容**：毫秒级将 Markdown 语法渲染为标准语义化 HTML。
- **GFM 扩展语法支持**：
  - 数据表格 (Tables)
  - 任务清单 (Task Lists: `- [x]`)
  - 删除线 (Strikethrough: `~~text~~`)
  - 脚注引用 (Footnotes: `[^1]`)
  - 智能标点 (Smart Punctuation)
- **文档统计指标**：标题计数、超链接计数、图片计数、代码块计数与文档字节分析。
- **纯单一文件**：零 JS 胶水代码，零运行时 Imports，导出标准 WasmForge C-ABI。
