import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 [Verification] Testing Tool #51: numeronym-generator (Dual Runtime)");

  const wasmPath = path.resolve(__dirname, "../public/wasm/numeronym-generator.wasm");
  assert(fs.existsSync(wasmPath), "numeronym-generator.wasm must exist in public/wasm/");

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

  // Test 1: In-memory Single Word / Sentence numeronym
  const wordRes = callWasm({
    action: "numeronym/generate",
    requestId: "test-single-word",
    params: {
      text: "internationalization and kubernetes",
      minLen: 4,
      mode: "text"
    }
  });
  assert.strictEqual(wordRes.code, 0);
  assert.strictEqual(wordRes.data.transformedText, "i18n and k8s");
  assert.strictEqual(wordRes.data.abbreviatedWords, 2);
  console.log(`✅ In-memory numeronym/generate (text) passed! (${wordRes.data.transformedText})`);

  // Test 2: In-memory Dictionary Lookup
  const dictRes = callWasm({
    action: "numeronym/lookup",
    requestId: "test-dict-lookup",
    params: {
      query: "k8s"
    }
  });
  assert.strictEqual(dictRes.code, 0);
  assert(dictRes.data.length >= 1);
  assert.strictEqual(dictRes.data[0].expansion, "kubernetes");
  console.log(`✅ In-memory numeronym/lookup passed! (${dictRes.data[0].numeronym} -> ${dictRes.data[0].expansion})`);

  // Test 3: In-memory Presets
  const presetsRes = callWasm({
    action: "numeronym/presets",
    requestId: "test-presets",
    params: {}
  });
  assert.strictEqual(presetsRes.code, 0);
  assert(Array.isArray(presetsRes.data) && presetsRes.data.length >= 2);
  console.log(`✅ In-memory numeronym/presets passed! (${presetsRes.data.length} presets)`);

  // 2. Testing Hono Backend HTTP API
  console.log("🌐 Testing Hono Backend HTTP API...");
  const baseUrl = "http://localhost:3000";

  // HTTP GET presets
  const httpPresets = await (await fetch(`${baseUrl}/api/backend/numeronym/presets`)).json();
  assert.strictEqual(httpPresets.code, 0);
  assert(httpPresets.data.length >= 2);
  console.log(`✅ HTTP GET /api/backend/numeronym/presets passed!`);

  // HTTP GET lookup
  const httpLookup = await (await fetch(`${baseUrl}/api/backend/numeronym/lookup?query=a11y`)).json();
  assert.strictEqual(httpLookup.code, 0);
  assert.strictEqual(httpLookup.data[0].expansion, "accessibility");
  console.log(`✅ HTTP GET /api/backend/numeronym/lookup passed!`);

  // HTTP POST generate (JSON)
  const httpGen = await (await fetch(`${baseUrl}/api/backend/numeronym/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "observability and accessibility",
      minLen: 4,
      mode: "text"
    })
  })).json();
  assert.strictEqual(httpGen.code, 0);
  assert.strictEqual(httpGen.data.transformedText, "o11y and a11y");
  console.log(`✅ HTTP POST /api/backend/numeronym/generate (JSON) passed!`);

  // HTTP POST generate (HTMX)
  const htmxRes = await (await fetch(`${baseUrl}/api/backend/numeronym/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "HX-Request": "true"
    },
    body: "text=internationalization&minLen=4&mode=text"
  })).text();
  assert(htmxRes.includes("result-box"), "HTMX response must contain result-box");
  assert(htmxRes.includes("数字缩写生成完成"), "HTMX response must indicate generation success");
  console.log(`✅ HTTP POST /api/backend/numeronym/generate (HTMX) passed!`);

  // Verify /api/stats
  const stats = await (await fetch(`${baseUrl}/api/stats`)).json();
  assert(stats.numeronymGenerator, "/api/stats must include numeronymGenerator");
  console.log(`✅ /api/stats includes numeronymGenerator (${stats.numeronymGenerator.sizeFormatted})`);

  console.log("\n🎉 [SUCCESS] Tool #51 numeronym-generator dual runtime verification passed completely!\n");
}

main().catch(err => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
