# @wasm-forge/roman-numeral-converter

罗马数字与阿拉伯数字相互转换 WebAssembly 模块 (Tool #27)。

## 功能特性
- **双向互转**：阿拉伯数字 (1 ~ 3999) ↔ 罗马数字 (如 `2026` ↔ `MMXXVI`)。
- **严格语法校验**：验证标准加减法规则 (如 `IV`, `IX`, `XL`, `XC`, `CD`, `CM`)，杜绝非法四重重复 (如 `IIII`) 与逆序违例。
- **解析拆解**：输出符号拆解明细与公式。
- **纯单一文件**：零 JS 胶水代码，零运行时 Imports，导出标准 WasmForge C-ABI。
