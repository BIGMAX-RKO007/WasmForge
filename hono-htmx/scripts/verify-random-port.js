import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 [Verification] Testing Tool #45: random-port (Dual Runtime)");

  const wasmPath = path.resolve(__dirname, "../public/wasm/random-port.wasm");
  assert(fs.existsSync(wasmPath), "random-port.wasm must exist in public/wasm/");

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

  // Test 1: In-memory port generate
  const genRes = callWasm({
    action: "port/generate",
    requestId: "test-gen-1",
    params: {
      count: 4,
      range: "ephemeral",
      excludeWellKnown: true,
      seed: 987654321
    }
  });
  assert.strictEqual(genRes.code, 0);
  assert.strictEqual(genRes.data.ports.length, 4);
  for (const p of genRes.data.ports) {
    assert(p.port >= 49152 && p.port <= 65535, "Port must be in ephemeral range");
  }
  console.log(`✅ In-memory port/generate passed! Generated: ${genRes.data.ports.map(p => p.port).join(", ")}`);

  // Test 2: In-memory port lookup
  const look80 = callWasm({
    action: "port/lookup",
    requestId: "test-lookup-80",
    params: { port: 80 }
  });
  assert.strictEqual(look80.code, 0);
  assert.strictEqual(look80.data.is_privileged, true);
  assert.strictEqual(look80.data.service, "HTTP");

  const look3306 = callWasm({
    action: "port/lookup",
    requestId: "test-lookup-3306",
    params: { port: 3306 }
  });
  assert.strictEqual(look3306.code, 0);
  assert.strictEqual(look3306.data.is_privileged, false);
  assert(look3306.data.service.includes("MySQL"));
  console.log(`✅ In-memory port/lookup passed! (:80 -> HTTP, :3306 -> MySQL)`);

  // Test 3: In-memory port audit
  const auditRes = callWasm({
    action: "port/audit",
    requestId: "test-audit-1",
    params: { ports: [22, 443, 6379, 53210] }
  });
  assert.strictEqual(auditRes.code, 0);
  assert.strictEqual(auditRes.data.audited_count, 4);
  assert.strictEqual(auditRes.data.collision_count, 3);
  assert.strictEqual(auditRes.data.safe_count, 1);
  console.log(`✅ In-memory port/audit passed!`);

  // 2. Testing Hono Backend HTTP API
  console.log("🌐 Testing Hono Backend HTTP API...");
  const baseUrl = "http://localhost:3000";

  // HTTP POST generate (JSON)
  const httpGen = await (await fetch(`${baseUrl}/api/backend/port/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count: 3, range: "user", excludeWellKnown: true })
  })).json();
  assert.strictEqual(httpGen.code, 0);
  assert.strictEqual(httpGen.data.ports.length, 3);
  console.log(`✅ HTTP POST /api/backend/port/generate (JSON) passed!`);

  // HTTP POST generate (HTMX)
  const htmxGen = await (await fetch(`${baseUrl}/api/backend/port/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "HX-Request": "true"
    },
    body: "count=2&range=ephemeral&excludeWellKnown=on"
  })).text();
  assert(htmxGen.includes("result-box"), "HTMX response must contain result-box");
  assert(htmxGen.includes("复制端口"), "HTMX response must contain copy button");
  console.log(`✅ HTTP POST /api/backend/port/generate (HTMX) passed!`);

  // HTTP GET lookup
  const httpLook = await (await fetch(`${baseUrl}/api/backend/port/lookup?port=5432`)).json();
  assert.strictEqual(httpLook.code, 0);
  assert(httpLook.data.service.includes("PostgreSQL"));
  console.log(`✅ HTTP GET /api/backend/port/lookup passed!`);

  // HTTP GET samples
  const httpSamples = await (await fetch(`${baseUrl}/api/backend/port/samples`)).json();
  assert.strictEqual(httpSamples.code, 0);
  assert(httpSamples.data.audited_count >= 5);
  console.log(`✅ HTTP GET /api/backend/port/samples passed!`);

  // Verify /api/stats
  const stats = await (await fetch(`${baseUrl}/api/stats`)).json();
  assert(stats.randomPort, "/api/stats must include randomPort");
  console.log(`✅ /api/stats includes randomPort (${stats.randomPort.sizeFormatted})`);

  console.log("\n🎉 [SUCCESS] Tool #45 random-port dual runtime verification passed completely!\n");
  console.log("🏆 [MILESTONE REACHED] Domain 3: 开发与代码工程 (Development) 100% COMPLETED (13/13 Tools)!\n");
}

main().catch(err => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
