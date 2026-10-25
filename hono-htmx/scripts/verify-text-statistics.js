import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 [Verification] Testing Tool #47: text-statistics (Dual Runtime)");

  const wasmPath = path.resolve(__dirname, "../public/wasm/text-statistics.wasm");
  assert(fs.existsSync(wasmPath), "text-statistics.wasm must exist in public/wasm/");

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

  // Test 1: In-memory multilingual text statistics
  const testInput = "Hello WebAssembly! 这是一个高性能的WASM测试用例文本。\n\nWebAssembly is blazing fast and standalone.";
  const statsRes = callWasm({
    action: "text/stats",
    requestId: "test-stats-1",
    params: {
      text: testInput
    }
  });
  assert.strictEqual(statsRes.code, 0);
  assert(statsRes.data.totalCharacters > 50);
  assert.strictEqual(statsRes.data.cjkCharacters, 14);
  assert(statsRes.data.paragraphsCount === 2);
  assert(statsRes.data.totalLines === 3);
  assert(statsRes.data.topWords.length > 0);
  console.log(`✅ In-memory text/stats passed! (Chars: ${statsRes.data.totalCharacters}, Words: ${statsRes.data.totalWords}, CJK: ${statsRes.data.cjkCharacters}, Top words: ${statsRes.data.topWords.map(w => `${w.word}(${w.count})`).join(', ')})`);

  // Test 2: In-memory Samples
  const samplesRes = callWasm({
    action: "text/samples",
    requestId: "test-samples-1",
    params: {}
  });
  assert.strictEqual(samplesRes.code, 0);
  assert(Array.isArray(samplesRes.data) && samplesRes.data.length >= 2);
  console.log(`✅ In-memory text/samples passed! (${samplesRes.data.length} presets)`);

  // 2. Testing Hono Backend HTTP API
  console.log("🌐 Testing Hono Backend HTTP API...");
  const baseUrl = "http://localhost:3000";

  // HTTP GET samples
  const httpSamples = await (await fetch(`${baseUrl}/api/backend/text/samples`)).json();
  assert.strictEqual(httpSamples.code, 0);
  assert(httpSamples.data.length >= 2);
  console.log(`✅ HTTP GET /api/backend/text/samples passed!`);

  // HTTP POST stats (JSON)
  const httpStats = await (await fetch(`${baseUrl}/api/backend/text/stats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "The quick brown fox jumps over the lazy dog. Fox was quick!"
    })
  })).json();
  assert.strictEqual(httpStats.code, 0);
  assert.strictEqual(httpStats.data.totalWords, 12);
  console.log(`✅ HTTP POST /api/backend/text/stats (JSON) passed!`);

  // HTTP POST stats (HTMX)
  const htmxStats = await (await fetch(`${baseUrl}/api/backend/text/stats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "HX-Request": "true"
    },
    body: "text=Hello%20world%20WASM"
  })).text();
  assert(htmxStats.includes("result-box"), "HTMX response must contain result-box");
  assert(htmxStats.includes("总字符数"), "HTMX response must contain 总字符数");
  console.log(`✅ HTTP POST /api/backend/text/stats (HTMX) passed!`);

  // Verify /api/stats
  const stats = await (await fetch(`${baseUrl}/api/stats`)).json();
  assert(stats.textStatistics, "/api/stats must include textStatistics");
  console.log(`✅ /api/stats includes textStatistics (${stats.textStatistics.sizeFormatted})`);

  console.log("\n🎉 [SUCCESS] Tool #47 text-statistics dual runtime verification passed completely!\n");
}

main().catch(err => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
