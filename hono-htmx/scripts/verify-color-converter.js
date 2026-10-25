import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log("=== 正在验证 Tool #23 color-converter ===");

  // 1. 获取 Backend 样例调色板
  const sampleRes = await fetch("http://localhost:3000/api/backend/color/sample");
  if (!sampleRes.ok) throw new Error("获取 sample 失败: " + sampleRes.status);
  const sampleData = await sampleRes.json();
  if (!sampleData.palette || sampleData.palette.length === 0) {
    throw new Error("样本调色板为空");
  }
  console.log("1. 获取后端颜色样本成功, 样本总数:", sampleData.palette.length, "首个颜色:", sampleData.palette[0].hex);

  // 2. 后端 convert 接口测试
  const params = new URLSearchParams();
  params.append("color", "#38bdf8");
  const convRes = await fetch("http://localhost:3000/api/backend/color/convert", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });
  const html = await convRes.text();
  if (!html.includes("Rust WASM: 全色彩空间转换与可访问性分析") || !html.includes("rgb(56, 189, 248)")) {
    throw new Error("后端颜色转换返回结果不符合预期:\n" + html);
  }
  console.log("2. 后端 convert HTMX 接口测试通过!");

  // 3. 前端 in-memory WASM 模块校验
  const wasmPath = path.resolve(__dirname, "../public/wasm/color-converter.wasm");
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

  // 3.1 验证 RGB 输入
  const frontRgb = runDispatch({
    action: "color/convert",
    requestId: "test-rgb",
    params: { input: "rgb(255, 0, 128)" }
  });
  if (frontRgb.code !== 0 || frontRgb.data?.hex !== "#ff0080") {
    throw new Error("前端 WASM RGB 转换失败: " + JSON.stringify(frontRgb));
  }
  console.log("4. 纯内存浏览器模式 WASM RGB -> HEX 成功:", frontRgb.data.hex, "HSL:", frontRgb.data.hsl);

  // 3.2 验证 HSL 输入
  const frontHsl = runDispatch({
    action: "color/convert",
    requestId: "test-hsl",
    params: { input: "hsl(120, 100%, 50%)" }
  });
  if (frontHsl.code !== 0 || frontHsl.data?.hex !== "#00ff00") {
    throw new Error("前端 WASM HSL 转换失败: " + JSON.stringify(frontHsl));
  }
  console.log("5. 纯内存浏览器模式 WASM HSL -> HEX 成功:", frontHsl.data.hex, "CMYK:", frontHsl.data.cmyk);

  // 3.3 验证可访问性对比度指标
  if (typeof frontHsl.data.contrastWhite !== "number" || typeof frontHsl.data.contrastBlack !== "number") {
    throw new Error("缺少 WCAG 对比度计算");
  }
  console.log("6. WCAG 2.1 对比度分析校验通过: 对白", frontHsl.data.contrastWhite, "对黑", frontHsl.data.contrastBlack);
  console.log("🎉 Tool #23 color-converter 双运行时验证完全通过!");
}

run().catch(err => {
  console.error("❌ 验证出错:", err);
  process.exit(1);
});
