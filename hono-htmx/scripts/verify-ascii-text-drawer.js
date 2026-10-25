import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 [Verification] Testing Tool #50: ascii-text-drawer (Dual Runtime)");

  const wasmPath = path.resolve(__dirname, "../public/wasm/ascii-text-drawer.wasm");
  assert(fs.existsSync(wasmPath), "ascii-text-drawer.wasm must exist in public/wasm/");

  const wasmBuffer = fs.readFileSync(wasmPath);
  console.log(`📦 WASM Binary size: ${(wasmBuffer.length / 1024).toFixed(2)} KB`);

  // 1. Direct WebAssembly instantiation (Browser-equivalent in-memory test)
  const wasmModule = await WebAssembly.compile(wasmBuffer);
  const imports = WebAssembly.Module.imports(wasmModule);
  console.log(`🔍 WASM Imports count: ${imports.length}`);
  assert.strictEqual(imports.length, 0, "Pure WASM module must have 0 imports");

  const instance = await WebAssembly.instantiate(wasmModule, {});
  const { alloc, dealloc, dispatch, memory } = instance.exports;

  assert(typeof alloc === "function", "Must export alloc");
  assert(typeof dealloc === "function", "Must export dealloc");
  assert(typeof dispatch === "function", "Must export dispatch");

  function callWasm(reqObj) {
    const jsonStr = JSON.stringify(reqObj);
    const encoder = new TextEncoder();
    const bytes = encoder.encode(jsonStr);

    const inPtr = alloc(bytes.length);
    const memView = new Uint8Array(memory.buffer);
    memView.set(bytes, inPtr);

    const packed = dispatch(inPtr, bytes.length);
    dealloc(inPtr, bytes.length);

    const outPtr = Number(BigInt(packed) >> 32n);
    const outLen = Number(BigInt(packed) & 0xffffffffn);

    const outBuf = new Uint8Array(memory.buffer, outPtr, outLen);
    const decoder = new TextDecoder();
    const resultStr = decoder.decode(outBuf);
    dealloc(outPtr, outLen);

    return JSON.parse(resultStr);
  }

  // Test 1: In-memory Standard Font Render
  const stdRes = callWasm({
    action: "ascii/render",
    requestId: "test-render-std",
    params: {
      text: "WASM",
      font: "standard",
      letterSpacing: 1
    }
  });
  assert.strictEqual(stdRes.code, 0);
  assert.strictEqual(stdRes.data.height, 5);
  assert(stdRes.data.width > 20);
  console.log(`✅ In-memory ascii/render (Standard) passed! (Width: ${stdRes.data.width}, Height: ${stdRes.data.height})`);

  // Test 2: In-memory Block Font Render
  const blockRes = callWasm({
    action: "ascii/render",
    requestId: "test-render-block",
    params: {
      text: "RUST",
      font: "block",
      letterSpacing: 1
    }
  });
  assert.strictEqual(blockRes.code, 0);
  assert.strictEqual(blockRes.data.height, 5);
  assert(blockRes.data.renderedText.includes("█"));
  console.log(`✅ In-memory ascii/render (Block) passed!`);

  // Test 3: In-memory Presets
  const presetsRes = callWasm({
    action: "ascii/presets",
    requestId: "test-presets",
    params: {}
  });
  assert.strictEqual(presetsRes.code, 0);
  assert(Array.isArray(presetsRes.data) && presetsRes.data.length >= 3);
  console.log(`✅ In-memory ascii/presets passed! (${presetsRes.data.length} presets)`);

  // 2. Testing Hono Backend HTTP API
  console.log("🌐 Testing Hono Backend HTTP API...");
  const baseUrl = "http://localhost:3000";

  // HTTP GET presets
  const httpPresets = await (await fetch(`${baseUrl}/api/backend/ascii/presets`)).json();
  assert.strictEqual(httpPresets.code, 0);
  assert(httpPresets.data.length >= 3);
  console.log(`✅ HTTP GET /api/backend/ascii/presets passed!`);

  // HTTP POST render (JSON)
  const httpRender = await (await fetch(`${baseUrl}/api/backend/ascii/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "CYBER",
      font: "small",
      letterSpacing: 1
    })
  })).json();
  assert.strictEqual(httpRender.code, 0);
  assert.strictEqual(httpRender.data.height, 3);
  assert.strictEqual(httpRender.data.charCount, 5);
  console.log(`✅ HTTP POST /api/backend/ascii/render (JSON Small) passed!`);

  // HTTP POST render (HTMX)
  const htmxRes = await (await fetch(`${baseUrl}/api/backend/ascii/render`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "HX-Request": "true"
    },
    body: "text=WASM%20FORGE&font=standard&letterSpacing=1"
  })).text();
  assert(htmxRes.includes("result-box"), "HTMX response must contain result-box");
  assert(htmxRes.includes("ASCII 横幅渲染完成"), "HTMX response must indicate render success");
  console.log(`✅ HTTP POST /api/backend/ascii/render (HTMX) passed!`);

  // Verify /api/stats
  const stats = await (await fetch(`${baseUrl}/api/stats`)).json();
  assert(stats.asciiTextDrawer, "/api/stats must include asciiTextDrawer");
  console.log(`✅ /api/stats includes asciiTextDrawer (${stats.asciiTextDrawer.sizeFormatted})`);

  console.log("\n🎉 [SUCCESS] Tool #50 ascii-text-drawer dual runtime verification passed completely!\n");
}

main().catch(err => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
