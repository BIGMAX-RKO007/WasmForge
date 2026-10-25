# @wasmforge/json-minify

JSON 快速压缩瘦身、格式化美化与深层语法结构解析器（JSON Minifier & Syntax Analyzer）WebAssembly 纯单一文件实现。

## 特性
- **兼容 JSONC 注释**: 自动安全剥离 `//` 单行与 `/* */` 多行块级注释，保留字符串字面量内容。
- **双向排版转换**: 单行极限压缩与 2/4 空格优雅美化排版。
- **深层数据类型树分析**: 精准统计 Object/Array/String/Number/Boolean/Null 数量与最大嵌套深度。
- **纯单一文件**: 零 JS 胶水代码，零外部依赖，0 imports。
- **双运行时支持**: 浏览器客户端与 Node.js / Hono 服务端无缝复用。
