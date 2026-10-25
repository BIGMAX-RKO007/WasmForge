# @wasmforge/regex-memo

WasmForge Tool #39: 纯 WebAssembly 正则表达式全能速查备忘录与离线检索字典。

## 特性
- **纯单一文件 (Zero JS Glue)**: 导出 `alloc`, `dealloc`, `dispatch` 3 个纯 C-ABI 函数。
- **结构化全景字典 (`memo/list`)**: 包含字符类、量词、边界、分组捕获、修饰符与高频生产业务正则（手机号、邮箱、IP、URL、中文等）。
- **即时模糊检索引擎 (`memo/search`)**: 按分类、标识符、功能描述与代码示例高速检索。
