// Pure C-ABI WebAssembly Exports (No JS glue required)

export function add(a: i32, b: i32): i32 {
  return a + b;
}

// 供宿主分配 WASM 线性内存
export function alloc(size: usize): usize {
  return heap.alloc(size);
}

// 供宿主释放 WASM 线性内存
export function dealloc(ptr: usize): void {
  heap.free(ptr);
}

// 统一标准：传入 UTF-8 字符串指针与长度，返回打包的 (ptr << 32) | len
export function greet(ptr: usize, len: usize): u64 {
  const name = String.UTF8.decodeUnsafe(ptr, len);
  const msg = "Hello, " + name + "! This is WebAssembly powered by AssemblyScript 🚀";
  const encoded = String.UTF8.encode(msg);
  const byteLen = encoded.byteLength;
  const outPtr = heap.alloc(byteLen);
  memory.copy(outPtr, changetype<usize>(encoded), byteLen);
  return (u64(outPtr) << 32) | u64(byteLen);
}
