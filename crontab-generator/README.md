# @wasmforge/crontab-generator

WasmForge Tool #40: 纯 WebAssembly Crontab 定时表达式解析、自然语言翻译与未来调度推算引擎。

## 特性
- **纯单一文件 (Zero JS Glue)**: 导出 `alloc`, `dealloc`, `dispatch` 3 个纯 C-ABI 函数。
- **5 段标准 Cron 语法解析 (`cron/evaluate`)**: 全面支持 `*`, `,`, `-`, `/` 等模式。
- **中英双语可读性翻译**: 智能提炼为通俗自然语言描述（如 "每隔 15 分钟"、"每周日凌晨 03:00"）。
- **高精度调度推算**: 基于 `chrono` 算法精准计算未来指定次数 (例如 5~10 次) 的 UTC/本地调度时间序列。
- **经典预设库 (`cron/presets`)**: 内置系统维护、数据库备份、日志轮转等高频表达式。
