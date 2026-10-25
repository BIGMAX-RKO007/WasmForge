/**
 * Universal WASM Engine - 跨端通用的 WebAssembly 交互引擎
 * 负责通过标准 C-ABI 与纯 WASM 模块进行数值运算与基于线性内存的字符串传递。
 */
export class WasmEngine {
  constructor(instance) {
    this.instance = instance;
    this.exports = instance.exports;
  }

  /**
   * 执行基础数值加法
   */
  add(a, b) {
    if (typeof this.exports.add !== "function") {
      throw new Error("WASM 模块未导出 add 函数");
    }
    return this.exports.add(a, b);
  }

  /**
   * 执行跨边界字符串问候函数
   * @param {string} name 输入字符串
   * @returns {string} 输出字符串
   */
  greet(name) {
    if (typeof this.exports.greet !== "function") {
      throw new Error("WASM 模块未导出 greet 函数");
    }

    // 1. 将输入字符串编码为 UTF-8 字节
    const encoder = new TextEncoder();
    const encoded = encoder.encode(name);
    const inLen = encoded.length;

    // 2. 在 WASM 线性内存中申请空间
    const inPtr = this.exports.alloc(inLen);

    // 3. 将字节写入 WASM 线性内存
    const memory = this.exports.memory;
    new Uint8Array(memory.buffer, inPtr, inLen).set(encoded);

    // 4. 调用 WASM 函数，返回值打包为 64 位整数: (ptr << 32) | len
    const packed = BigInt(this.exports.greet(inPtr, inLen));
    const outPtr = Number(packed >> 32n);
    const outLen = Number(packed & 0xFFFFFFFFn);

    // 5. 从 WASM 线性内存读取并解码返回的 UTF-8 字符串
    const outBytes = new Uint8Array(memory.buffer, outPtr, outLen);
    const result = new TextDecoder().decode(outBytes);

    // 6. 内存回收释放
    if (typeof this.exports.dealloc === "function") {
      this.exports.dealloc(inPtr, inLen);
      this.exports.dealloc(outPtr, outLen);
    }

    return result;
  }

  /**
   * 通用信封协议调度 (Envelope Protocol)
   * @param {Object} envelope { action, requestId, params }
   * @returns {Object} response { code, msg, requestId, data }
   */
  dispatch(envelope) {
    if (typeof this.exports.dispatch !== "function") {
      throw new Error("WASM 模块未导出 dispatch 函数");
    }

    const jsonStr = typeof envelope === "string" ? envelope : JSON.stringify(envelope);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(jsonStr);
    const inLen = encoded.length;

    // 1. 在 WASM 线性内存中申请输入缓冲区
    const inPtr = this.exports.alloc(inLen);

    // 2. 将 JSON 字节拷贝至 WASM 线性内存
    const memory = this.exports.memory;
    new Uint8Array(memory.buffer, inPtr, inLen).set(encoded);

    // 3. 执行 dispatch 路由分发
    const packed = BigInt(this.exports.dispatch(inPtr, inLen));
    const outPtr = Number(packed >> 32n);
    const outLen = Number(packed & 0xFFFFFFFFn);

    // 4. 读取输出 JSON 结果
    const outBytes = new Uint8Array(memory.buffer, outPtr, outLen);
    const responseJson = new TextDecoder().decode(outBytes);

    // 5. 内存释放
    if (typeof this.exports.dealloc === "function") {
      this.exports.dealloc(inPtr, inLen);
      this.exports.dealloc(outPtr, outLen);
    }

    // 6. 反序列化响应信封
    return JSON.parse(responseJson);
  }
}
