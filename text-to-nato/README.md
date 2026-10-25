# @wasmforge/text-to-nato

北约音标拼读字母表转换器（NATO Phonetic Alphabet Converter）WebAssembly 纯单一文件实现。

## 特性
- **标准化 26 字母与数字**: 严格遵循 ICAO/NATO 军用与民航无线电通话规范（Alfa, Bravo, Charlie... Zero..Nine）。
- **双向无损转换**: 支持正向文本转拼读、逆向北约词还原为文本。
- **纯单一文件**: 零 JS 胶水代码，零外部依赖，0 imports。
- **双运行时支持**: 浏览器客户端与 Node.js / Hono 服务端无缝复用。
