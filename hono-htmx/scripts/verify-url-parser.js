import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 [Verification] Testing Tool #56: url-parser (Dual Runtime)");

  const wasmPath = path.resolve(__dirname, "../public/wasm/url-parser.wasm");
  assert(fs.existsSync(wasmPath), "url-parser.wasm must exist in public/wasm/");

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

  // Test 1: In-memory URL parsing (complex URL)
  const complexUrl = "https://user:secret123@api.github.com:8443/repos/rust-lang/rust/pulls?state=open&sort=created&direction=desc#issuecomment-999";
  const parseRes = callWasm({
    action: "url/parse",
    requestId: "test-parse",
    params: {
      url: complexUrl
    }
  });
  assert.strictEqual(parseRes.code, 0);
  assert.strictEqual(parseRes.data.protocol, "https:");
  assert.strictEqual(parseRes.data.username, "user");
  assert.strictEqual(parseRes.data.password, "secret123");
  assert.strictEqual(parseRes.data.hostname, "api.github.com");
  assert.strictEqual(parseRes.data.port, 8443);
  assert.strictEqual(parseRes.data.pathname, "/repos/rust-lang/rust/pulls");
  assert.strictEqual(parseRes.data.hash, "#issuecomment-999");
  assert.strictEqual(parseRes.data.params.length, 3);
  assert.strictEqual(parseRes.data.paramsMap["sort"][0], "created");
  console.log(`✅ In-memory url/parse passed! (Host: ${parseRes.data.host}, params: ${parseRes.data.params.length})`);

  // Test 2: In-memory URL presets
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
  const httpPresets = await (await fetch(`${baseUrl}/api/backend/url/parser/presets`)).json();
  assert.strictEqual(httpPresets.code, 0);
  assert.strictEqual(httpPresets.data.length, 3);
  console.log(`✅ HTTP GET /api/backend/url/parser/presets passed!`);

  // HTTP POST parse (JSON)
  const httpParse = await (await fetch(`${baseUrl}/api/backend/url/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: complexUrl
    })
  })).json();
  assert.strictEqual(httpParse.code, 0);
  assert.strictEqual(httpParse.data.hostname, "api.github.com");
  console.log(`✅ HTTP POST /api/backend/url/parse (JSON) passed!`);

  // HTTP POST parse (HTMX)
  const htmxRes = await (await fetch(`${baseUrl}/api/backend/url/parse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "HX-Request": "true"
    },
    body: `url=${encodeURIComponent(complexUrl)}`
  })).text();
  assert(htmxRes.includes("result-box"), "HTMX response must contain result-box");
  assert(htmxRes.includes("URL 解析成功"), "HTMX response must indicate URL parse success");
  console.log(`✅ HTTP POST /api/backend/url/parse (HTMX) passed!`);

  // Verify /api/stats
  const stats = await (await fetch(`${baseUrl}/api/stats`)).json();
  assert(stats.urlParser, "/api/stats must include urlParser");
  console.log(`✅ /api/stats includes urlParser (${stats.urlParser.sizeFormatted})`);

  console.log("\n🎉 [SUCCESS] Tool #56 url-parser dual runtime verification passed completely!\n");
}

main().catch(err => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
