import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log("=== 正在验证 Tool #22 base64-file ===");

  // 1. 获取 Backend 样例
  const sampleRes = await fetch("http://localhost:3000/api/backend/base64-file/sample");
  if (!sampleRes.ok) throw new Error("获取 sample 失败: " + sampleRes.status);
  const sampleData = await sampleRes.json();
  console.log("1. 获取后端 Base64 File 样例成功:", sampleData.fileName, sampleData.mimeType, sampleData.fileSizeBytes, "bytes");

  // 2. 后端 to-data-url 测试
  const toParams = new URLSearchParams();
  toParams.append("base64", sampleData.svgBase64);
  toParams.append("fileName", sampleData.fileName);
  toParams.append("mimeType", sampleData.mimeType);
  const toRes = await fetch("http://localhost:3000/api/backend/base64-file/to-data-url", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: toParams.toString()
  });
  const toHtml = await toRes.text();
  if (!toHtml.includes("Rust WASM: Data URL 封装成功")) {
    throw new Error("后端封装 Data URL 返回结果不符合预期:\n" + toHtml);
  }
  console.log("2. 后端 to-data-url HTMX 接口测试通过!");

  // 3. 后端 from-data-url 测试
  const textareaMatch = toHtml.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/i);
  const generatedDataUrl = textareaMatch ? textareaMatch[1].trim() : "";
  const fromParams = new URLSearchParams();
  fromParams.append("dataUrl", generatedDataUrl);
  const fromRes = await fetch("http://localhost:3000/api/backend/base64-file/from-data-url", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: fromParams.toString()
  });
  const fromHtml = await fromRes.text();
  if (!fromHtml.includes("Rust WASM: Data URL 解析成功") || !fromHtml.includes("image/svg+xml")) {
    throw new Error("后端解析 Data URL 返回结果不符合预期:\n" + fromHtml);
  }
  console.log("3. 后端 from-data-url HTMX 接口测试通过!");

  // 4. 前端 in-memory WASM 模块验证
  const wasmPath = path.resolve(__dirname, "../public/wasm/base64-file.wasm");
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

  const frontTo = runDispatch({
    action: "file/to-data-url",
    requestId: "test-to-url",
    params: {
      base64: "AQIDBAU=",
      fileName: "test.bin",
      mimeType: "application/octet-stream"
    }
  });
  if (frontTo.code !== 0 || frontTo.data?.dataUrl !== "data:application/octet-stream;base64,AQIDBAU=") {
    throw new Error("前端 WASM 封装 Data URL 失败: " + JSON.stringify(frontTo));
  }
  console.log("5. 纯内存浏览器模式 WASM 封装 Data URL 成功:", frontTo.data.dataUrl);

  const frontFrom = runDispatch({
    action: "file/from-data-url",
    requestId: "test-from-url",
    params: { dataUrl: frontTo.data.dataUrl }
  });
  if (frontFrom.code !== 0 || frontFrom.data?.base64 !== "AQIDBAU=" || frontFrom.data?.fileSizeBytes !== 5) {
    throw new Error("前端 WASM 解析 Data URL 失败: " + JSON.stringify(frontFrom));
  }
  console.log("6. 纯内存浏览器模式 WASM 解析还原成功! 原始大小:", frontFrom.data.fileSizeBytes, "字节");
  console.log("🎉 Tool #22 base64-file 双运行时验证完全通过!");
}

run().catch(err => {
  console.error("❌ 验证出错:", err);
  process.exit(1);
});
