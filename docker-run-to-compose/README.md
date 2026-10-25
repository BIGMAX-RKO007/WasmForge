# @wasmforge/docker-run-to-compose

`docker run` 命令转 `docker-compose.yml` 纯 Rust WebAssembly 转换引擎。

## 机能规范
- **全方位参数解析**:
  - 容器标识: `--name`, 镜像名 (包含标签与摘要)
  - 端口映射: `-p`, `--publish`, `-P`, `--publish-all`
  - 环境变量: `-e`, `--env`, `--env-file`
  - 数据卷挂载: `-v`, `--volume`, `--mount`
  - 网络与主机名: `--net`, `--network`, `-h`, `--hostname`, `--add-host`
  - 运行配置: `-d`, `--restart`, `--entrypoint`, `-w`, `--workdir`, `-u`, `--user`, `--privileged`
  - 资源限制: `--cpus`, `-m`, `--memory`
  - 结尾命令与参数 (CMD) 捕获
- **结构化 YAML 渲染**: 严格对齐 Docker Compose Specification v3/v3.8 规范，按标准缩进层次组织 service。
- **纯单一 WASM 交付**: 零 JS 胶水，无 `wasm-bindgen` 运行时依赖，严格符合 WasmForge Universal Envelope Protocol 标准。
