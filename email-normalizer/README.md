# @wasmforge/email-normalizer

电子邮件地址规范化与反别名清洗器（纯 Rust WebAssembly 实现）。

## 机能规范
- **主流厂商规范化规则**:
  - **Gmail / Google Workspace**: 自动去除用户名内点号 `.` (`j.o.h.n@gmail.com` -> `john@gmail.com`)，剥离 `+tag` 别名 (`user+news@gmail.com` -> `user@gmail.com`)，规范 `googlemail.com` 为 `gmail.com`。
  - **Outlook / Hotmail / Live**: 保留点号，去除 `+tag` 别名。
  - **Yahoo / Ymail**: 去除 `-tag` 连字符别名。
  - **iCloud / Proton / Fastmail**: 去除 `+tag` 别名。
- **批量去重与清洗**: 支持多行邮箱批量归一化及唯一性排重。
- **元数据深度拆解**: 提取标准用户名、域名、别名标签、识别主流邮件托管服务商。
- **零胶水纯 C-ABI 导出**: 严格遵循 WasmForge Universal Envelope Protocol，导出 `alloc`、`dealloc`、`dispatch`，无宿主导入环境 (`Imports: []`)。
