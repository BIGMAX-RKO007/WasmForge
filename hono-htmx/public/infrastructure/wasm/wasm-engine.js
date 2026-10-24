/**
 * Universal WASM Engine - 跨端通用的 WebAssembly 交互引擎 (浏览器版)
 * 负责通过标准 C-ABI 与纯 WASM 模块进行数值运算与基于线性内存的字符串传递。
 */
export class WasmEngine {
  constructor(instance) {
    this.instance = instance;
    this.exports = instance.exports;
  }

  add(a, b) {
    if (typeof this.exports.add !== "function") {
      throw new Error("WASM 模块未导出 add 函数");
    }
    return this.exports.add(a, b);
  }

  greet(name) {
    if (typeof this.exports.greet !== "function") {
      throw new Error("WASM 模块未导出 greet 函数");
    }

    const encoder = new TextEncoder();
    const encoded = encoder.encode(name);
    const inLen = encoded.length;

    const inPtr = this.exports.alloc(inLen);
    const memory = this.exports.memory;
    new Uint8Array(memory.buffer, inPtr, inLen).set(encoded);

    const packed = BigInt(this.exports.greet(inPtr, inLen));
    const outPtr = Number(packed >> 32n);
    const outLen = Number(packed & 0xFFFFFFFFn);

    const outBytes = new Uint8Array(memory.buffer, outPtr, outLen);
    const result = new TextDecoder().decode(outBytes);

    if (typeof this.exports.dealloc === "function") {
      this.exports.dealloc(inPtr, inLen);
      this.exports.dealloc(outPtr, outLen);
    }

    return result;
  }
}
