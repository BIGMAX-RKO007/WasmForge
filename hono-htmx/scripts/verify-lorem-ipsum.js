import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 [Verification] Testing Tool #49: lorem-ipsum (Dual Runtime)");

  const wasmPath = path.resolve(__dirname, "../public/wasm/lorem-ipsum.wasm");
  assert(fs.existsSync(wasmPath), "lorem-ipsum.wasm must exist in public/wasm/");

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

  // Test 1: In-memory Paragraphs generation
  const pRes = callWasm({
    action: "lorem/generate",
    requestId: "test-lorem-p",
    params: {
      unit: "paragraphs",
      count: 3,
      startWithLorem: true,
      format: "plain",
      seed: 12345
    }
  });
  assert.strictEqual(pRes.code, 0);
  assert.strictEqual(pRes.data.paragraphsCount, 3);
  assert(pRes.data.text.startsWith("Lorem ipsum dolor sit amet"));
  assert(pRes.data.wordsCount > 50);
  console.log(`✅ In-memory lorem/generate (paragraphs) passed! (${pRes.data.paragraphsCount} paragraphs, ${pRes.data.wordsCount} words)`);

  // Test 2: In-memory HTML formatted generation
  const htmlRes = callWasm({
    action: "lorem/generate",
    requestId: "test-lorem-html",
    params: {
      unit: "paragraphs",
      count: 2,
      startWithLorem: false,
      format: "html"
    }
  });
  assert.strictEqual(htmlRes.code, 0);
  assert(htmlRes.data.text.startsWith("<p>"));
  assert(htmlRes.data.text.endsWith("</p>"));
  console.log(`✅ In-memory lorem/generate (html format) passed!`);

  // Test 3: In-memory Presets
  const presetsRes = callWasm({
    action: "lorem/presets",
    requestId: "test-presets",
    params: {}
  });
  assert.strictEqual(presetsRes.code, 0);
  assert(Array.isArray(presetsRes.data) && presetsRes.data.length >= 3);
  console.log(`✅ In-memory lorem/presets passed! (${presetsRes.data.length} presets)`);

  // 2. Testing Hono Backend HTTP API
  console.log("🌐 Testing Hono Backend HTTP API...");
  const baseUrl = "http://localhost:3000";

  // HTTP GET presets
  const httpPresets = await (await fetch(`${baseUrl}/api/backend/lorem/presets`)).json();
  assert.strictEqual(httpPresets.code, 0);
  assert(httpPresets.data.length >= 3);
  console.log(`✅ HTTP GET /api/backend/lorem/presets passed!`);

  // HTTP POST generate (JSON)
  const httpGen = await (await fetch(`${baseUrl}/api/backend/lorem/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      unit: "words",
      count: 30,
      startWithLorem: true,
      format: "plain"
    })
  })).json();
  assert.strictEqual(httpGen.code, 0);
  assert.strictEqual(httpGen.data.wordsCount, 30);
  assert(httpGen.data.text.startsWith("Lorem ipsum"));
  console.log(`✅ HTTP POST /api/backend/lorem/generate (JSON 30 words) passed!`);

  // HTTP POST generate (HTMX)
  const htmxRes = await (await fetch(`${baseUrl}/api/backend/lorem/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "HX-Request": "true"
    },
    body: "unit=paragraphs&count=2&format=plain&startWithLorem=true"
  })).text();
  assert(htmxRes.includes("result-box"), "HTMX response must contain result-box");
  assert(htmxRes.includes("假文排版生成成功"), "HTMX response must indicate generation success");
  console.log(`✅ HTTP POST /api/backend/lorem/generate (HTMX) passed!`);

  // Verify /api/stats
  const stats = await (await fetch(`${baseUrl}/api/stats`)).json();
  assert(stats.loremIpsum, "/api/stats must include loremIpsum");
  console.log(`✅ /api/stats includes loremIpsum (${stats.loremIpsum.sizeFormatted})`);

  console.log("\n🎉 [SUCCESS] Tool #49 lorem-ipsum dual runtime verification passed completely!\n");
}

main().catch(err => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
