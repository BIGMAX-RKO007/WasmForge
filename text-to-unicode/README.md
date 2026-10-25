# @wasm-forge/text-to-unicode

文本与 Unicode 转义序列互转 WebAssembly 模块 (Tool #29)。

## 功能特性
- **双向无损转换**：普通文本 ↔ Unicode 转义序列 (如 `你好世界` ↔ `\u4f60\u597d\u4e16\u754c`)。
- **多格式转义支持**：
  - 标准 16 位转义 `\uXXXX` (含代理对支持)
  - ES6 可变宽大括号转义 `\u{XXXX}`
  - HTML 十六进制实体 `&#xXXXX;`
  - HTML 十进制实体 `&#DDDD;`
  - CSS 转义 `\XXXX `
- **选择性转义**：支持仅转义非 ASCII 字符 (保留英文字符与标点) 或全量字符转义。
- **纯单一文件**：零 JS 胶水代码，零运行时 Imports，导出标准 WasmForge C-ABI。
