import fs from "node:fs/promises";
import path from "node:path";
import { WasmEngine } from "./wasm-engine.js";

/**
 * Node.js 服务端 WASM 加载器
 * 负责从磁盘读取纯 .wasm 二进制文件并实例化为 WasmEngine
 */
export async function loadWasmFromDisk(filePath) {
  const absolutePath = path.resolve(filePath);
  const buffer = await fs.readFile(absolutePath);

  // 标准 WebAssembly 导入对象（支持 AssemblyScript 的 abort 钩子）
  const importObject = {
    env: {
      abort: (msg, file, line, col) => {
        console.error(`WASM 异常终止: ${msg} at ${file}:${line}:${col}`);
      }
    }
  };

  const { instance } = await WebAssembly.instantiate(buffer, importObject);
  return new WasmEngine(instance);
}
