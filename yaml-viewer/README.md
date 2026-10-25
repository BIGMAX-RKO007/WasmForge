# @wasmforge/yaml-viewer

WasmForge Tool #37: 纯 WebAssembly 交互式 YAML 树状结构探针与层级检索引擎。

## 功能特性
- **纯单一文件 (Zero JS Glue)**: 导出 `alloc`, `dealloc`, `dispatch` 3 个纯 C-ABI 函数。
- **YAML 树状遍历与层级探针 (`yaml/inspect`)**: 自动解析单文档及多文档 YAML，提取树状深度结构、节点类型与叶子统计。
- **全局路径与键值检索 (`yaml/query`)**: 高性能不区分大小写的路径与键值模式检索。
- **内置云原生配置模板 (`yaml/sample`)**: Kubernetes 与 Docker-Compose 典型多层级配置样例。
