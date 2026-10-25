import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 [Verification] Testing Tool #55: url-encoder-decoder (Dual Runtime)");

  const wasmPath = path.resolve(__dirname, "../public/wasm/url-encoder-decoder.wasm");
  assert(fs.existsSync(wasmPath), "url-encoder-decoder.wasm must exist in public/wasm/");

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

  // Test 1: In-memory URL encoding (RFC 3986)
  const encodeRes = callWasm({
    action: "url/process",
    requestId: "test-encode",
    params: {
      text: "Hello World! 你好",
      mode: "encode",
      standard: "rfc3986",
      plusAsSpace: true
    }
  });
  assert.strictEqual(encodeRes.code, 0);
  assert(encodeRes.data.result.includes("%20"));
  assert(encodeRes.data.result.includes("%E4%BD%A0%E5%A5%BD"));
  assert.strictEqual(encodeRes.data.mode, "encode");
  console.log(`✅ In-memory url/process (encode) passed! (Result: ${encodeRes.data.result})`);

  // Test 2: In-memory URL decoding
  const decodeRes = callWasm({
    action: "url/process",
    requestId: "test-decode",
    params: {
      text: encodeRes.data.result,
      mode: "decode",
      standard: "rfc3986",
      plusAsSpace: true
    }
  });
  assert.strictEqual(decodeRes.code, 0);
  assert.strictEqual(decodeRes.data.result, "Hello World! 你好");
  console.log(`✅ In-memory url/process (decode roundtrip) passed!`);

  // Test 3: Form URL-encoded mode (+ for spaces)
  const formRes = callWasm({
    action: "url/process",
    requestId: "test-form",
    params: {
      text: "hello world rust wasm",
      mode: "encode",
      standard: "form",
      plusAsSpace: true
    }
  });
  assert.strictEqual(formRes.code, 0);
  assert.strictEqual(formRes.data.result, "hello+world+rust+wasm");
  console.log(`✅ In-memory url/process (form standard) passed!`);

  // Test 4: Presets
  const presetsRes = callWasm({
    action: "url/presets",
    requestId: "test-presets",
    params: {}
  });
  assert.strictEqual(presetsRes.code, 0);
  assert.strictEqual(presetsRes.data.length, 3);
  console.log(`✅ In-memory url/presets passed! (${presetsRes.data.length} presets)`);

  // 2. Testing Hono Backend HTTP API
  console.log("🌐 Testing Hono Backend HTTP API...");
  const baseUrl = "http://localhost:3000";

  // HTTP GET presets
  const httpPresets = await (await fetch(`${baseUrl}/api/backend/url/presets`)).json();
  assert.strictEqual(httpPresets.code, 0);
  assert.strictEqual(httpPresets.data.length, 3);
  console.log(`✅ HTTP GET /api/backend/url/presets passed!`);

  // HTTP POST process (JSON)
  const httpProcess = await (await fetch(`${baseUrl}/api/backend/url/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "WasmForge 2026",
      mode: "encode",
      standard: "rfc3986"
    })
  })).json();
  assert.strictEqual(httpProcess.code, 0);
  assert.strictEqual(httpProcess.data.result, "WasmForge%202026");
  console.log(`✅ HTTP POST /api/backend/url/process (JSON) passed!`);

  // HTTP POST process (HTMX)
  const htmxRes = await (await fetch(`${baseUrl}/api/backend/url/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "HX-Request": "true"
    },
    body: `text=${encodeURIComponent("https://wasmforge.dev/test?id=123")}&mode=encode&standard=component`
  })).text();
  assert(htmxRes.includes("result-box"), "HTMX response must contain result-box");
  assert(htmxRes.includes("URL 编码 (Encode) 成功"), "HTMX response must indicate URL encode success");
  console.log(`✅ HTTP POST /api/backend/url/process (HTMX) passed!`);

  // Verify /api/stats
  const stats = await (await fetch(`${baseUrl}/api/stats`)).json();
  assert(stats.urlEncoderDecoder, "/api/stats must include urlEncoderDecoder");
  console.log(`✅ /api/stats includes urlEncoderDecoder (${stats.urlEncoderDecoder.sizeFormatted})`);

  console.log("\n🎉 [SUCCESS] Tool #55 url-encoder-decoder dual runtime verification passed completely!\n");
}

main().catch(err => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
