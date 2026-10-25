import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 [Verification] Testing Tool #48: string-obfuscator (Dual Runtime)");

  const wasmPath = path.resolve(__dirname, "../public/wasm/string-obfuscator.wasm");
  assert(fs.existsSync(wasmPath), "string-obfuscator.wasm must exist in public/wasm/");

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

  // Test 1: In-memory Email Masking
  const emailRes = callWasm({
    action: "obfuscate/mask",
    requestId: "test-mask-email",
    params: {
      text: "admin.super@company.org",
      strategy: "email",
      maskChar: "*"
    }
  });
  assert.strictEqual(emailRes.code, 0);
  assert(emailRes.data.maskedText.includes("@company.org"));
  assert(emailRes.data.maskedText.startsWith("a*"));
  console.log(`✅ In-memory mask (email) passed: ${emailRes.data.maskedText}`);

  // Test 2: In-memory Leet & ROT13 Transform
  const leetRes = callWasm({
    action: "obfuscate/transform",
    requestId: "test-transform-leet",
    params: {
      text: "elite hacker",
      mode: "leet"
    }
  });
  assert.strictEqual(leetRes.code, 0);
  assert.strictEqual(leetRes.data.result, "3l173 h4ck3r");
  console.log(`✅ In-memory transform (leet) passed: ${leetRes.data.result}`);

  // Test 3: In-memory Log Sanitizer
  const logRes = callWasm({
    action: "obfuscate/sanitize-log",
    requestId: "test-sanitize-log",
    params: {
      text: "API request by user john.doe@example.com with Bearer sk_live_98412984124 and card 4532 8912 3456 9012"
    }
  });
  assert.strictEqual(logRes.code, 0);
  assert(logRes.data.redactionsCount >= 2);
  assert(!logRes.data.sanitizedText.includes("john.doe@example.com"));
  assert(!logRes.data.sanitizedText.includes("sk_live_98412984124"));
  console.log(`✅ In-memory sanitize-log passed! (${logRes.data.redactionsCount} entities redacted)`);

  // Test 4: In-memory Samples
  const samplesRes = callWasm({
    action: "obfuscate/samples",
    requestId: "test-samples-1",
    params: {}
  });
  assert.strictEqual(samplesRes.code, 0);
  assert(Array.isArray(samplesRes.data) && samplesRes.data.length >= 2);
  console.log(`✅ In-memory obfuscate/samples passed! (${samplesRes.data.length} presets)`);

  // 2. Testing Hono Backend HTTP API
  console.log("🌐 Testing Hono Backend HTTP API...");
  const baseUrl = "http://localhost:3000";

  // HTTP GET samples
  const httpSamples = await (await fetch(`${baseUrl}/api/backend/obfuscate/samples`)).json();
  assert.strictEqual(httpSamples.code, 0);
  assert(httpSamples.data.length >= 2);
  console.log(`✅ HTTP GET /api/backend/obfuscate/samples passed!`);

  // HTTP POST process (JSON - Mask)
  const httpMask = await (await fetch(`${baseUrl}/api/backend/obfuscate/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "obfuscate/mask",
      text: "+1 555-123-4567",
      strategy: "phone"
    })
  })).json();
  assert.strictEqual(httpMask.code, 0);
  assert(httpMask.data.maskedText.includes("***"));
  console.log(`✅ HTTP POST /api/backend/obfuscate/process (JSON Mask) passed: ${httpMask.data.maskedText}`);

  // HTTP POST process (HTMX - Sanitize)
  const htmxRes = await (await fetch(`${baseUrl}/api/backend/obfuscate/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "HX-Request": "true"
    },
    body: "opType=sanitize&text=Error%20contacting%20support%40domain.com%20card%204532%201111%202222%203333"
  })).text();
  assert(htmxRes.includes("result-box"), "HTMX response must contain result-box");
  assert(htmxRes.includes("全局日志敏感词脱敏完成"), "HTMX response must indicate log sanitization complete");
  console.log(`✅ HTTP POST /api/backend/obfuscate/process (HTMX) passed!`);

  // Verify /api/stats
  const stats = await (await fetch(`${baseUrl}/api/stats`)).json();
  assert(stats.stringObfuscator, "/api/stats must include stringObfuscator");
  console.log(`✅ /api/stats includes stringObfuscator (${stats.stringObfuscator.sizeFormatted})`);

  console.log("\n🎉 [SUCCESS] Tool #48 string-obfuscator dual runtime verification passed completely!\n");
}

main().catch(err => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
