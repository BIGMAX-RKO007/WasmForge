# @wasmforge/xml-formatter

XML 树缩进排版美化与压缩瘦身工具（XML Formatter & Minifier）WebAssembly 纯单一文件实现。

## 特性
- **严格与极速 XML 语法校验与排版**: 基于高性能 `quick-xml` 流式事件驱动引擎，支持任意空格缩进与语法定位。
- **注释保留与剥离**: 支持保留或过滤 `<!-- -->` 注释块。
- **纯单一文件**: 零 JS 胶水代码，零外部依赖，0 imports。
- **双运行时支持**: 浏览器客户端与 Node.js / Hono 服务端无缝复用。
