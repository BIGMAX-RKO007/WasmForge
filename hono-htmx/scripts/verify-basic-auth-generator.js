import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 [Verification] Testing Tool #60: basic-auth-generator (Dual Runtime)");

  const wasmPath = path.resolve(__dirname, "../public/wasm/basic-auth-generator.wasm");
  assert(fs.existsSync(wasmPath), "basic-auth-generator.wasm must exist in public/wasm/");

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

  // Test 1: In-memory basic-auth generate
  const user = "aladdin";
  const pass = "open sesame";
  const genRes = callWasm({
    action: "basic-auth/generate",
    requestId: "test-gen",
    params: {
      username: user,
      password: pass
    }
  });
  assert.strictEqual(genRes.code, 0);
  assert.strictEqual(genRes.data.base64, "YWxhZGRpbjpvcGVuIHNlc2FtZQ==");
  assert.strictEqual(genRes.data.authHeader, "Authorization: Basic YWxhZGRpbjpvcGVuIHNlc2FtZQ==");
  assert(genRes.data.curlSnippet.includes("Authorization: Basic"));
  console.log(`✅ In-memory basic-auth/generate passed!`);

  // Test 2: In-memory basic-auth parse
  const parseRes = callWasm({
    action: "basic-auth/parse",
    requestId: "test-parse",
    params: {
      header: "Authorization: Basic YWxhZGRpbjpvcGVuIHNlc2FtZQ=="
    }
  });
  assert.strictEqual(parseRes.code, 0);
  assert.strictEqual(parseRes.data.valid, true);
  assert.strictEqual(parseRes.data.username, "aladdin");
  assert.strictEqual(parseRes.data.password, "open sesame");
  console.log(`✅ In-memory basic-auth/parse passed!`);

  // Test 3: In-memory Presets
  const presetsRes = callWasm({
    action: "basic-auth/presets",
    requestId: "test-presets",
    params: {}
  });
  assert.strictEqual(presetsRes.code, 0);
  assert.strictEqual(presetsRes.data.length, 2);
  console.log(`✅ In-memory basic-auth/presets passed! (${presetsRes.data.length} presets)`);

  // 2. Testing Hono Backend HTTP API
  console.log("🌐 Testing Hono Backend HTTP API...");
  const baseUrl = "http://localhost:3000";

  // HTTP GET presets
  const httpPresets = await (await fetch(`${baseUrl}/api/backend/basic-auth/presets`)).json();
  assert.strictEqual(httpPresets.code, 0);
  assert.strictEqual(httpPresets.data.length, 2);
  console.log(`✅ HTTP GET /api/backend/basic-auth/presets passed!`);

  // HTTP POST generate (JSON)
  const httpGen = await (await fetch(`${baseUrl}/api/backend/basic-auth/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: user,
      password: pass
    })
  })).json();
  assert.strictEqual(httpGen.code, 0);
  assert.strictEqual(httpGen.data.base64, "YWxhZGRpbjpvcGVuIHNlc2FtZQ==");
  console.log(`✅ HTTP POST /api/backend/basic-auth/generate (JSON) passed!`);

  // HTTP POST generate (HTMX)
  const htmxRes = await (await fetch(`${baseUrl}/api/backend/basic-auth/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "HX-Request": "true"
    },
    body: `username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`
  })).text();
  assert(htmxRes.includes("result-box"), "HTMX response must contain result-box");
  assert(htmxRes.includes("Authorization: Basic"), "HTMX response must contain Basic auth header");
  console.log(`✅ HTTP POST /api/backend/basic-auth/generate (HTMX) passed!`);

  // Verify /api/stats
  const stats = await (await fetch(`${baseUrl}/api/stats`)).json();
  assert(stats.basicAuthGenerator, "/api/stats must include basicAuthGenerator");
  console.log(`✅ /api/stats includes basicAuthGenerator (${stats.basicAuthGenerator.sizeFormatted})`);

  console.log("\n🎉 [SUCCESS] Tool #60 basic-auth-generator dual runtime verification passed completely!\n");
}

main().catch(err => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
