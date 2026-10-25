import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log("=== 正在验证 Tool #21 base64-string ===");

  // 1. 获取 Backend 样例
  const sampleRes = await fetch("http://localhost:3000/api/backend/base64/sample");
  if (!sampleRes.ok) throw new Error("获取 sample 失败: " + sampleRes.status);
  const sampleData = await sampleRes.json();
  console.log("1. 获取后端 Base64 样例成功:", sampleData.text);

  // 2. 后端 Encode 测试
  const encParams = new URLSearchParams();
  encParams.append("text", sampleData.text);
  encParams.append("urlSafe", "false");
  encParams.append("padding", "true");
  const encRes = await fetch("http://localhost:3000/api/backend/base64/encode", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: encParams.toString()
  });
  const encHtml = await encRes.text();
  if (!encHtml.includes("Rust WASM: Base64 编码")) {
    throw new Error("后端编码返回结果不符合预期:\n" + encHtml);
  }
  console.log("2. 后端 Encode HTMX 接口测试通过!");

  // 3. 后端 Decode 测试
  const textareaMatch = encHtml.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/i);
  const encodedStr = textareaMatch ? textareaMatch[1].trim() : "";
  const decParams = new URLSearchParams();
  decParams.append("base64", encodedStr);
  decParams.append("urlSafe", "false");
  const decRes = await fetch("http://localhost:3000/api/backend/base64/decode", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: decParams.toString()
  });
  const decHtml = await decRes.text();
  if (!decHtml.includes("Rust WASM: Base64 解码成功") || !decHtml.includes("WasmForge")) {
    throw new Error("后端解码返回结果不符合预期:\n" + decHtml);
  }
  console.log("3. 后端 Decode HTMX 接口测试通过!");

  // 4. 前端 in-memory WASM 模块验证
  const wasmPath = path.resolve(__dirname, "../public/wasm/base64-string.wasm");
  const wasmBuffer = fs.readFileSync(wasmPath);
  const wasmModule = await WebAssembly.compile(wasmBuffer);
  const imports = WebAssembly.Module.imports(wasmModule);
  if (imports.length !== 0) {
    throw new Error("WASM 模块包含非纯环境 imports: " + JSON.stringify(imports));
  }
  console.log("4. WASM 模块纯静态校验通过: Imports = 0");

  const instance = await WebAssembly.instantiate(wasmModule, {});
  const { alloc, dealloc, dispatch, memory } = instance.exports;

  function runDispatch(payload) {
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    const ptr = alloc(bytes.length);
    new Uint8Array(memory.buffer, ptr, bytes.length).set(bytes);
    const packed = dispatch(ptr, bytes.length);
    const outPtr = Number(packed >> 32n);
    const outLen = Number(packed & 0xffffffffn);
    const slice = new Uint8Array(memory.buffer, outPtr, outLen);
    const resp = JSON.parse(new TextDecoder().decode(slice));
    dealloc(outPtr, outLen);
    return resp;
  }

  const frontEnc = runDispatch({
    action: "base64/encode",
    requestId: "test-enc",
    params: { text: "Hello, WasmForge!", urlSafe: true, padding: false }
  });
  if (frontEnc.code !== 0 || !frontEnc.data?.base64) {
    throw new Error("前端 WASM 编码失败: " + JSON.stringify(frontEnc));
  }
  console.log("5. 纯内存浏览器模式 WASM 编码成功:", frontEnc.data.base64);

  const frontDec = runDispatch({
    action: "base64/decode",
    requestId: "test-dec",
    params: { base64: frontEnc.data.base64, urlSafe: true }
  });
  if (frontDec.code !== 0 || frontDec.data?.text !== "Hello, WasmForge!") {
    throw new Error("前端 WASM 解码失败: " + JSON.stringify(frontDec));
  }
  console.log("6. 纯内存浏览器模式 WASM 解码还原成功:", frontDec.data.text);
  console.log("🎉 Tool #21 base64-string 双运行时验证完全通过!");
}

run().catch(err => {
  console.error("❌ 验证出错:", err);
  process.exit(1);
});
