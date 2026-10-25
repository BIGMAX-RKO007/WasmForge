import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 [Verification] Testing Tool #58: json-diff (Dual Runtime)");

  const wasmPath = path.resolve(__dirname, "../public/wasm/json-diff.wasm");
  assert(fs.existsSync(wasmPath), "json-diff.wasm must exist in public/wasm/");

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

  // Test 1: In-memory JSON diff
  const left = JSON.stringify({ a: 1, b: "hello", list: [10, 20] });
  const right = JSON.stringify({ a: 2, c: true, list: [10, 30, 40] });

  const diffRes = callWasm({
    action: "json/diff",
    requestId: "test-diff",
    params: {
      left,
      right
    }
  });
  assert.strictEqual(diffRes.code, 0);
  assert.strictEqual(diffRes.data.summary.totalChanges, 5); // b removed, c added, a modified, list[1] modified, list[2] added
  assert.strictEqual(diffRes.data.summary.equal, false);
  assert(diffRes.data.patches.length >= 4);
  console.log(`✅ In-memory json/diff passed! (Changes: ${diffRes.data.summary.totalChanges}, ops: ${diffRes.data.patches.length})`);

  // Test 2: In-memory Presets
  const presetsRes = callWasm({
    action: "json/presets",
    requestId: "test-presets",
    params: {}
  });
  assert.strictEqual(presetsRes.code, 0);
  assert.strictEqual(presetsRes.data.length, 2);
  console.log(`✅ In-memory json/presets passed! (${presetsRes.data.length} presets)`);

  // 2. Testing Hono Backend HTTP API
  console.log("🌐 Testing Hono Backend HTTP API...");
  const baseUrl = "http://localhost:3000";

  // HTTP GET presets
  const httpPresets = await (await fetch(`${baseUrl}/api/backend/json/diff/presets`)).json();
  assert.strictEqual(httpPresets.code, 0);
  assert.strictEqual(httpPresets.data.length, 2);
  console.log(`✅ HTTP GET /api/backend/json/diff/presets passed!`);

  // HTTP POST diff (JSON)
  const httpDiff = await (await fetch(`${baseUrl}/api/backend/json/diff`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      left,
      right
    })
  })).json();
  assert.strictEqual(httpDiff.code, 0);
  assert.strictEqual(httpDiff.data.summary.totalChanges, 5);
  console.log(`✅ HTTP POST /api/backend/json/diff (JSON) passed!`);

  // HTTP POST diff (HTMX)
  const htmxRes = await (await fetch(`${baseUrl}/api/backend/json/diff`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "HX-Request": "true"
    },
    body: `left=${encodeURIComponent(left)}&right=${encodeURIComponent(right)}`
  })).text();
  assert(htmxRes.includes("result-box"), "HTMX response must contain result-box");
  assert(htmxRes.includes("JSON 结构比对"), "HTMX response must indicate JSON diff success");
  console.log(`✅ HTTP POST /api/backend/json/diff (HTMX) passed!`);

  // Verify /api/stats
  const stats = await (await fetch(`${baseUrl}/api/stats`)).json();
  assert(stats.jsonDiff, "/api/stats must include jsonDiff");
  console.log(`✅ /api/stats includes jsonDiff (${stats.jsonDiff.sizeFormatted})`);

  console.log("\n🎉 [SUCCESS] Tool #58 json-diff dual runtime verification passed completely!\n");
}

main().catch(err => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
