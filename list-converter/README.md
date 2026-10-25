# @wasm-forge/list-converter

多行文本与列表规整转换 WebAssembly 模块 (Tool #31)。

## 功能特性
- **行级变换**：自然字母/数字排序 (A-Z, Z-A)、反转、去重 (Deduplicate)、首尾空白修剪 (Trim)。
- **过滤与补全**：移除空行、添加自定义前缀/后缀、自动添加行号序号。
- **灵活连接器**：换行符规整连接、逗号/分号连接 (Join Delimiter)。
- **指标统计**：原行数、转换后行数、去重过滤行数、空行过滤数。
- **纯单一文件**：零 JS 胶水代码，零运行时 Imports，导出标准 WasmForge C-ABI。
