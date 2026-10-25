# @wasmforge/json-viewer

交互式 JSON 树状层级查看器与节点检索探针（JSON Tree Viewer & Node Inspector）WebAssembly 纯单一文件实现。

## 特性
- **全节点 JSONPath 索引构建**: 快速生成树状节点层次模型（类型、路径、层级深度、子节点统计、值预览）。
- **极速节点全文/路径检索**: 支持在内存树中检索特定路径或关键字节点。
- **纯单一文件**: 零 JS 胶水代码，零外部依赖，0 imports。
- **双运行时支持**: 浏览器客户端与 Node.js / Hono 服务端无缝复用。
