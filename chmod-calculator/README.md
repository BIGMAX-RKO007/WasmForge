# @wasmforge/chmod-calculator

Linux Chmod 权限模式双向计算与语义生成器（纯 Rust WebAssembly 实现）。

## 机能规范
- **八进制 / 符号表示法双向转换**: 支持 3 位或 4 位八进制（如 `755`, `0644`, `4755`）与符号位串（如 `rwxr-xr-x`, `rwsr-xr-x`）即时解析与校验。
- **三元组与特殊标志位**:
  - Owner (User) / Group / Others 的 Read (4), Write (2), Execute (1)。
  - SUID (4000), SGID (2000), Sticky Bit (1000) 特殊位支持。
- **Umask 演算**: 给定 umask（如 `022` 或 `027`）即时推导默认文件模式（666 - umask）与目录模式（777 - umask）。
- **Shell 指令与安全审计提示**: 自动生成数字与符号 `chmod` 命令，对 `777`、`SUID` 等高危权限提供安全警告。
- **零胶水纯 C-ABI 导出**: 严格遵循 WasmForge 标准 Envelope 协议，导出 `alloc`、`dealloc`、`dispatch`，无任何外部导入 (`Imports: []`)。
