import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 [Verification] Testing Tool #53: jwt-parser (Dual Runtime)");

  const wasmPath = path.resolve(__dirname, "../public/wasm/jwt-parser.wasm");
  assert(fs.existsSync(wasmPath), "jwt-parser.wasm must exist in public/wasm/");

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

  // Test 1: In-memory Standard JWT parsing
  const sampleJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjIwMDAwMDAwMDB9.signature";
  const parseRes = callWasm({
    action: "jwt/parse",
    requestId: "test-parse-jwt",
    params: {
      token: sampleJwt,
      currentTime: 1700000000
    }
  });
  assert.strictEqual(parseRes.code, 0);
  assert.strictEqual(parseRes.data.algorithm, "HS256");
  assert.strictEqual(parseRes.data.tokenType, "JWT");
  assert.strictEqual(parseRes.data.isExpired, false);
  assert.strictEqual(parseRes.data.payload.sub, "1234567890");
  assert.strictEqual(parseRes.data.payload.name, "John Doe");
  console.log(`✅ In-memory jwt/parse passed! (Alg: ${parseRes.data.algorithm}, Sub: ${parseRes.data.payload.sub})`);

  // Test 2: In-memory Expired JWT
  const expiredJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzk5OTk5OSIsImV4cCI6MTYwMDAwMzYwMH0.signature";
  const expRes = callWasm({
    action: "jwt/parse",
    requestId: "test-expired-jwt",
    params: {
      token: expiredJwt,
      currentTime: 1700000000
    }
  });
  assert.strictEqual(expRes.code, 0);
  assert.strictEqual(expRes.data.isExpired, true);
  console.log(`✅ In-memory jwt/parse (expired token check) passed!`);

  // Test 3: In-memory Presets
  const presetsRes = callWasm({
    action: "jwt/presets",
    requestId: "test-presets",
    params: {}
  });
  assert.strictEqual(presetsRes.code, 0);
  assert.strictEqual(presetsRes.data.length, 3);
  console.log(`✅ In-memory jwt/presets passed! (${presetsRes.data.length} presets)`);

  // 2. Testing Hono Backend HTTP API
  console.log("🌐 Testing Hono Backend HTTP API...");
  const baseUrl = "http://localhost:3000";

  // HTTP GET presets
  const httpPresets = await (await fetch(`${baseUrl}/api/backend/jwt/presets`)).json();
  assert.strictEqual(httpPresets.code, 0);
  assert.strictEqual(httpPresets.data.length, 3);
  console.log(`✅ HTTP GET /api/backend/jwt/presets passed!`);

  // HTTP POST parse (JSON)
  const httpParse = await (await fetch(`${baseUrl}/api/backend/jwt/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: sampleJwt,
      currentTime: 1700000000
    })
  })).json();
  assert.strictEqual(httpParse.code, 0);
  assert.strictEqual(httpParse.data.algorithm, "HS256");
  assert.strictEqual(httpParse.data.payload.name, "John Doe");
  console.log(`✅ HTTP POST /api/backend/jwt/parse (JSON) passed!`);

  // HTTP POST parse (HTMX)
  const htmxRes = await (await fetch(`${baseUrl}/api/backend/jwt/parse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "HX-Request": "true"
    },
    body: `token=${encodeURIComponent(sampleJwt)}`
  })).text();
  assert(htmxRes.includes("result-box"), "HTMX response must contain result-box");
  assert(htmxRes.includes("JWT 解析成功"), "HTMX response must indicate JWT parse success");
  console.log(`✅ HTTP POST /api/backend/jwt/parse (HTMX) passed!`);

  // Verify /api/stats
  const stats = await (await fetch(`${baseUrl}/api/stats`)).json();
  assert(stats.jwtParser, "/api/stats must include jwtParser");
  console.log(`✅ /api/stats includes jwtParser (${stats.jwtParser.sizeFormatted})`);

  console.log("\n🎉 [SUCCESS] Tool #53 jwt-parser dual runtime verification passed completely!\n");
}

main().catch(err => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
