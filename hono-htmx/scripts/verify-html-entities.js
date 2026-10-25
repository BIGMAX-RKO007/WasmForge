import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 [Verification] Testing Tool #59: html-entities (Dual Runtime)");

  const wasmPath = path.resolve(__dirname, "../public/wasm/html-entities.wasm");
  assert(fs.existsSync(wasmPath), "html-entities.wasm must exist in public/wasm/");

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

  // Test 1: In-memory HTML entity basic encode
  const rawXss = "<script>alert('XSS & 1 > 0');</script>";
  const encodeRes = callWasm({
    action: "html/entities",
    requestId: "test-encode",
    params: {
      text: rawXss,
      mode: "encode",
      format: "basic"
    }
  });
  assert.strictEqual(encodeRes.code, 0);
  assert.strictEqual(encodeRes.data.result, "&lt;script&gt;alert(&apos;XSS &amp; 1 &gt; 0&apos;);&lt;/script&gt;");
  assert.strictEqual(encodeRes.data.entitiesProcessed, 8);
  console.log(`✅ In-memory html/entities encode (basic) passed!`);

  // Test 2: In-memory HTML entity named decode
  const encodedText = "&lt;h1&gt;WasmForge &copy; 2026 &amp; &euro;49.99&lt;/h1&gt;";
  const decodeRes = callWasm({
    action: "html/entities",
    requestId: "test-decode",
    params: {
      text: encodedText,
      mode: "decode"
    }
  });
  assert.strictEqual(decodeRes.code, 0);
  assert.strictEqual(decodeRes.data.result, "<h1>WasmForge © 2026 & €49.99</h1>");
  assert.strictEqual(decodeRes.data.entitiesProcessed, 7);
  console.log(`✅ In-memory html/entities decode passed!`);

  // Test 3: In-memory Presets
  const presetsRes = callWasm({
    action: "html/presets",
    requestId: "test-presets",
    params: {}
  });
  assert.strictEqual(presetsRes.code, 0);
  assert.strictEqual(presetsRes.data.length, 3);
  console.log(`✅ In-memory html/presets passed! (${presetsRes.data.length} presets)`);

  // 2. Testing Hono Backend HTTP API
  console.log("🌐 Testing Hono Backend HTTP API...");
  const baseUrl = "http://localhost:3000";

  // HTTP GET presets
  const httpPresets = await (await fetch(`${baseUrl}/api/backend/html/entities/presets`)).json();
  assert.strictEqual(httpPresets.code, 0);
  assert.strictEqual(httpPresets.data.length, 3);
  console.log(`✅ HTTP GET /api/backend/html/entities/presets passed!`);

  // HTTP POST entities (JSON)
  const httpEncode = await (await fetch(`${baseUrl}/api/backend/html/entities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: rawXss,
      mode: "encode",
      format: "basic"
    })
  })).json();
  assert.strictEqual(httpEncode.code, 0);
  assert.strictEqual(httpEncode.data.result, "&lt;script&gt;alert(&apos;XSS &amp; 1 &gt; 0&apos;);&lt;/script&gt;");
  console.log(`✅ HTTP POST /api/backend/html/entities (JSON) passed!`);

  // HTTP POST entities (HTMX)
  const htmxRes = await (await fetch(`${baseUrl}/api/backend/html/entities`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "HX-Request": "true"
    },
    body: `text=${encodeURIComponent(encodedText)}&mode=decode`
  })).text();
  assert(htmxRes.includes("result-box"), "HTMX response must contain result-box");
  assert(htmxRes.includes("HTML 实体 解码"), "HTMX response must indicate HTML entity decode success");
  console.log(`✅ HTTP POST /api/backend/html/entities (HTMX) passed!`);

  // Verify /api/stats
  const stats = await (await fetch(`${baseUrl}/api/stats`)).json();
  assert(stats.htmlEntities, "/api/stats must include htmlEntities");
  console.log(`✅ /api/stats includes htmlEntities (${stats.htmlEntities.sizeFormatted})`);

  console.log("\n🎉 [SUCCESS] Tool #59 html-entities dual runtime verification passed completely!\n");
}

main().catch(err => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
