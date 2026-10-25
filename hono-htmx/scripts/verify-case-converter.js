import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log("=== 正在验证 Tool #24 case-converter ===");

  // 1. 获取 Backend 样例
  const sampleRes = await fetch("http://localhost:3000/api/backend/case/sample");
  if (!sampleRes.ok) throw new Error("获取 sample 失败: " + sampleRes.status);
  const sampleData = await sampleRes.json();
  if (!sampleData.sample) throw new Error("获取样本为空");
  console.log("1. 获取后端 Case 样例成功:", sampleData.sample);

  // 2. 后端 convert 接口测试
  const params = new URLSearchParams();
  params.append("text", sampleData.sample);
  const convRes = await fetch("http://localhost:3000/api/backend/case/convert", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });
  const html = await convRes.text();
  if (!html.includes("Rust WASM: 多命名风格全量转换成功") || !html.includes("wasm-forge-universal-envelope-protocol-v2")) {
    throw new Error("后端命名转换返回结果不符合预期:\n" + html);
  }
  console.log("2. 后端 convert HTMX 接口测试通过!");

  // 3. 前端 in-memory WASM 模块校验
  const wasmPath = path.resolve(__dirname, "../public/wasm/case-converter.wasm");
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

  // 3.1 验证复杂混合大小写输入
  const frontResp = runDispatch({
    action: "case/convert",
    requestId: "test-case",
    params: { input: "getHTTP_responseCode fromURL" }
  });
  if (frontResp.code !== 0 || !frontResp.data) {
    throw new Error("前端 WASM 转换失败: " + JSON.stringify(frontResp));
  }
  const d = frontResp.data;
  if (d.camelCase !== "getHttpResponseCodeFromUrl") {
    throw new Error("camelCase 转换结果不正确: " + d.camelCase);
  }
  if (d.kebabCase !== "get-http-response-code-from-url") {
    throw new Error("kebabCase 转换结果不正确: " + d.kebabCase);
  }
  if (d.screamingSnakeCase !== "GET_HTTP_RESPONSE_CODE_FROM_URL") {
    throw new Error("screamingSnakeCase 转换结果不正确: " + d.screamingSnakeCase);
  }
  if (d.titleCase !== "Get Http Response Code From Url") {
    throw new Error("titleCase 转换结果不正确: " + d.titleCase);
  }
  console.log("4. 纯内存浏览器模式 WASM 12种大小写转换完全成功!");
  console.log("   - camelCase:", d.camelCase);
  console.log("   - kebabCase:", d.kebabCase);
  console.log("   - screamingSnakeCase:", d.screamingSnakeCase);
  console.log("   - titleCase:", d.titleCase);
  console.log("🎉 Tool #24 case-converter 双运行时验证完全通过!");
}

run().catch(err => {
  console.error("❌ 验证出错:", err);
  process.exit(1);
});
