import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 [Verification] Testing Tool #46: text-diff (Dual Runtime)");

  const wasmPath = path.resolve(__dirname, "../public/wasm/text-diff.wasm");
  assert(fs.existsSync(wasmPath), "text-diff.wasm must exist in public/wasm/");

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

  // Test 1: In-memory Line Diff
  const lineRes = callWasm({
    action: "diff/compare",
    requestId: "test-line-1",
    params: {
      oldText: "hello\nworld\nwasm\n",
      newText: "hello\nbrave\nnew\nworld\nwasm\n",
      mode: "lines"
    }
  });
  assert.strictEqual(lineRes.code, 0);
  assert.strictEqual(lineRes.data.additions, 2);
  assert.strictEqual(lineRes.data.unchanged, 3);
  assert(lineRes.data.similarity > 0.6);
  assert(lineRes.data.unifiedPatch.includes("--- a/original.txt"));
  console.log(`✅ In-memory diff/compare (lines) passed! (+${lineRes.data.additions}, -${lineRes.data.deletions}, =${lineRes.data.unchanged})`);

  // Test 2: In-memory Word Diff
  const wordRes = callWasm({
    action: "diff/compare",
    requestId: "test-word-1",
    params: {
      oldText: "The quick brown fox",
      newText: "The fast brown fox",
      mode: "words"
    }
  });
  assert.strictEqual(wordRes.code, 0);
  assert(wordRes.data.additions >= 1);
  assert(wordRes.data.deletions >= 1);
  console.log(`✅ In-memory diff/compare (words) passed!`);

  // Test 3: In-memory Samples
  const samplesRes = callWasm({
    action: "diff/samples",
    requestId: "test-samples-1",
    params: {}
  });
  assert.strictEqual(samplesRes.code, 0);
  assert(Array.isArray(samplesRes.data) && samplesRes.data.length >= 3);
  console.log(`✅ In-memory diff/samples passed! (${samplesRes.data.length} sample pairs)`);

  // 2. Testing Hono Backend HTTP API
  console.log("🌐 Testing Hono Backend HTTP API...");
  const baseUrl = "http://localhost:3000";

  // HTTP GET samples
  const httpSamples = await (await fetch(`${baseUrl}/api/backend/diff/samples`)).json();
  assert.strictEqual(httpSamples.code, 0);
  assert(httpSamples.data.length >= 3);
  console.log(`✅ HTTP GET /api/backend/diff/samples passed!`);

  // HTTP POST compare (JSON)
  const httpCompare = await (await fetch(`${baseUrl}/api/backend/diff/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      oldText: "let a = 1;\nlet b = 2;\n",
      newText: "let a = 1;\nlet b = 99;\nlet c = 100;\n",
      mode: "lines"
    })
  })).json();
  assert.strictEqual(httpCompare.code, 0);
  assert(httpCompare.data.additions >= 2);
  console.log(`✅ HTTP POST /api/backend/diff/compare (JSON) passed!`);

  // HTTP POST compare (HTMX)
  const htmxCompare = await (await fetch(`${baseUrl}/api/backend/diff/compare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "HX-Request": "true"
    },
    body: "mode=lines&oldText=foo%0Abar&newText=foo%0Abaz"
  })).text();
  assert(htmxCompare.includes("result-box"), "HTMX response must contain result-box");
  assert(htmxCompare.includes("Myers"), "HTMX response must contain Myers indicator");
  console.log(`✅ HTTP POST /api/backend/diff/compare (HTMX) passed!`);

  // Verify /api/stats
  const stats = await (await fetch(`${baseUrl}/api/stats`)).json();
  assert(stats.textDiff, "/api/stats must include textDiff");
  console.log(`✅ /api/stats includes textDiff (${stats.textDiff.sizeFormatted})`);

  console.log("\n🎉 [SUCCESS] Tool #46 text-diff dual runtime verification passed completely!\n");
}

main().catch(err => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
