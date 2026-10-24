import { WasmEngine } from "./wasm-engine.js";

/**
 * 浏览器端 WASM 加载器
 * 通过 fetch/instantiateStreaming 加载纯 .wasm 文件
 */
export async function loadWasmFromUrl(url) {
  const importObject = {
    env: {
      abort: (msg, file, line, col) => {
        console.error(`WASM 异常终止: ${msg} at ${file}:${line}:${col}`);
      }
    }
  };

  let result;
  if (typeof WebAssembly.instantiateStreaming === "function") {
    try {
      result = await WebAssembly.instantiateStreaming(fetch(url), importObject);
    } catch {
      // 某些开发环境 MIME 未就绪时的降级
      const response = await fetch(url);
      const bytes = await response.arrayBuffer();
      result = await WebAssembly.instantiate(bytes, importObject);
    }
  } else {
    const response = await fetch(url);
    const bytes = await response.arrayBuffer();
    result = await WebAssembly.instantiate(bytes, importObject);
  }

  return new WasmEngine(result.instance);
}
