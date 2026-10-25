import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 [Verification] Testing Tool #54: otp-generator (Dual Runtime)");

  const wasmPath = path.resolve(__dirname, "../public/wasm/otp-generator.wasm");
  assert(fs.existsSync(wasmPath), "otp-generator.wasm must exist in public/wasm/");

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

  // Test 1: In-memory TOTP generation
  const totpRes = callWasm({
    action: "otp/totp",
    requestId: "test-totp",
    params: {
      secret: "JBSWY3DPEHPK3PXP",
      digits: 6,
      period: 30,
      currentTime: 1700000000
    }
  });
  assert.strictEqual(totpRes.code, 0);
  assert.strictEqual(totpRes.data.digits, 6);
  assert.strictEqual(totpRes.data.code.length, 6);
  assert.strictEqual(typeof totpRes.data.remainingSeconds, "number");
  console.log(`✅ In-memory otp/totp passed! (Code: ${totpRes.data.code}, remaining: ${totpRes.data.remainingSeconds}s)`);

  // Test 2: In-memory TOTP verification
  const verifyRes = callWasm({
    action: "otp/verify",
    requestId: "test-verify",
    params: {
      secret: "JBSWY3DPEHPK3PXP",
      code: totpRes.data.code,
      digits: 6,
      period: 30,
      window: 1,
      currentTime: 1700000000
    }
  });
  assert.strictEqual(verifyRes.code, 0);
  assert.strictEqual(verifyRes.data.valid, true);
  console.log(`✅ In-memory otp/verify passed! (Valid: ${verifyRes.data.valid})`);

  // Test 3: In-memory HOTP RFC 4226 test vector
  // Secret "12345678901234567890" -> Base32 "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"
  const hotpRes = callWasm({
    action: "otp/hotp",
    requestId: "test-hotp",
    params: {
      secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
      counter: 0,
      digits: 6
    }
  });
  assert.strictEqual(hotpRes.code, 0);
  assert.strictEqual(hotpRes.data.code, "755224");
  console.log(`✅ In-memory RFC 4226 HOTP vector 0 verified! (Code: 755224)`);

  // Test 4: In-memory URI generation
  const uriRes = callWasm({
    action: "otp/uri",
    requestId: "test-uri",
    params: {
      secret: "JBSWY3DPEHPK3PXP",
      account: "alice@wasmforge.dev",
      issuer: "WasmForge",
      digits: 6,
      period: 30
    }
  });
  assert.strictEqual(uriRes.code, 0);
  assert(uriRes.data.uri.startsWith("otpauth://totp/WasmForge:alice@wasmforge.dev?secret=JBSWY3DPEHPK3PXP"));
  console.log(`✅ In-memory otp/uri passed!`);

  // 2. Testing Hono Backend HTTP API
  console.log("🌐 Testing Hono Backend HTTP API...");
  const baseUrl = "http://localhost:3000";

  // HTTP GET presets
  const httpPresets = await (await fetch(`${baseUrl}/api/backend/otp/presets`)).json();
  assert.strictEqual(httpPresets.code, 0);
  assert.strictEqual(httpPresets.data.length, 3);
  console.log(`✅ HTTP GET /api/backend/otp/presets passed!`);

  // HTTP POST totp (JSON)
  const httpTotp = await (await fetch(`${baseUrl}/api/backend/otp/totp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: "JBSWY3DPEHPK3PXP",
      digits: 6,
      period: 30,
      currentTime: 1700000000
    })
  })).json();
  assert.strictEqual(httpTotp.code, 0);
  assert.strictEqual(httpTotp.data.code, totpRes.data.code);
  console.log(`✅ HTTP POST /api/backend/otp/totp (JSON) passed!`);

  // HTTP POST verify
  const httpVerify = await (await fetch(`${baseUrl}/api/backend/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: "JBSWY3DPEHPK3PXP",
      code: totpRes.data.code,
      digits: 6,
      period: 30,
      currentTime: 1700000000
    })
  })).json();
  assert.strictEqual(httpVerify.code, 0);
  assert.strictEqual(httpVerify.data.valid, true);
  console.log(`✅ HTTP POST /api/backend/otp/verify passed!`);

  // HTTP POST totp (HTMX)
  const htmxRes = await (await fetch(`${baseUrl}/api/backend/otp/totp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "HX-Request": "true"
    },
    body: `secret=JBSWY3DPEHPK3PXP&digits=6&period=30`
  })).text();
  assert(htmxRes.includes("result-box"), "HTMX response must contain result-box");
  assert(htmxRes.includes("TOTP 生成成功"), "HTMX response must indicate TOTP success");
  console.log(`✅ HTTP POST /api/backend/otp/totp (HTMX) passed!`);

  // Verify /api/stats
  const stats = await (await fetch(`${baseUrl}/api/stats`)).json();
  assert(stats.otpGenerator, "/api/stats must include otpGenerator");
  console.log(`✅ /api/stats includes otpGenerator (${stats.otpGenerator.sizeFormatted})`);

  console.log("\n🎉 [SUCCESS] Tool #54 otp-generator dual runtime verification passed completely!\n");
}

main().catch(err => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
