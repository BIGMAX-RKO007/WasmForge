import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log("=== 正在验证 Tool #19 json-to-xml ===");

  // 1. 获取 Backend 样例
  const sampleRes = await fetch("http://localhost:3000/api/backend/json-to-xml/sample");
  if (!sampleRes.ok) throw new Error("获取 sample 失败: " + sampleRes.status);
  const sampleJson = await sampleRes.text();
  console.log("1. 获取后端 JSON 样例成功:", sampleJson.length, "bytes");

  // 2. 后端转换测试
  const params = new URLSearchParams();
  params.append("json", sampleJson);
  params.append("indent", "2");
  const convertRes = await fetch("http://localhost:3000/api/backend/json/to-xml", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });
  const html = await convertRes.text();
  if (!html.includes("Rust WASM: JSON ➜ XML")) {
    throw new Error("后端转换返回结果不符合预期:\n" + html);
  }
  console.log("2. 后端 HTMX 接口测试通过!");

  // 3. 前端 in-memory WASM 模块验证
  const wasmPath = path.resolve(__dirname, "../public/wasm/json-to-xml.wasm");
  const wasmBuffer = fs.readFileSync(wasmPath);
  const wasmModule = await WebAssembly.compile(wasmBuffer);
  const imports = WebAssembly.Module.imports(wasmModule);
  if (imports.length !== 0) {
    throw new Error("WASM 模块包含非纯环境 imports: " + JSON.stringify(imports));
  }
  console.log("3. WASM 模块纯静态校验通过: Imports = 0");

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

  const frontResp = runDispatch({
    action: "json/to-xml",
    requestId: "test-req",
    params: { json: sampleJson, indent: 2 }
  });

  if (frontResp.code !== 0 || !frontResp.data?.xml) {
    throw new Error("前端 WASM 转换失败: " + JSON.stringify(frontResp));
  }
  console.log("4. 纯内存浏览器模式 WASM 转换成功! 产生的 XML 长度:", frontResp.data.xml.length);
  console.log("🎉 Tool #19 json-to-xml 双运行时验证完全通过!");
}

run().catch(err => {
  console.error("❌ 验证出错:", err);
  process.exit(1);
});
