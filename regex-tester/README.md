# @wasmforge/regex-tester

WasmForge Tool #38: 纯 WebAssembly 正则表达式测试、捕获组提取与安全替换引擎。

## 特性
- **严格防御 ReDoS**: 基于 Rust `regex` 确定性有限状态机 (DFA/NFA) 实现，保证线性时间复杂度 $O(mn)$，绝对防御灾难性回溯死循环。
- **纯单一文件 (Zero JS Glue)**: 导出 `alloc`, `dealloc`, `dispatch` 3 个纯 C-ABI 函数。
- **捕获组深度提取 (`regex/test`)**: 提取命名捕获组与位置下标切片。
- **动态替换与正则清洗 (`regex/replace`)**: 支持单次替换与全局匹配替换。
