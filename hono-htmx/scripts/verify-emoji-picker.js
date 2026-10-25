import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 [Verification] Testing Tool #52: emoji-picker (Dual Runtime)");

  const wasmPath = path.resolve(__dirname, "../public/wasm/emoji-picker.wasm");
  assert(fs.existsSync(wasmPath), "emoji-picker.wasm must exist in public/wasm/");

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

  // Test 1: In-memory Keyword Search (e.g. rust)
  const rustRes = callWasm({
    action: "emoji/search",
    requestId: "test-search-rust",
    params: {
      query: "rust",
      category: null,
      limit: 10
    }
  });
  assert.strictEqual(rustRes.code, 0);
  assert(rustRes.data.total >= 1);
  assert.strictEqual(rustRes.data.emojis[0].emoji, "🦀");
  console.log(`✅ In-memory emoji/search ("rust") passed! (Found ${rustRes.data.emojis[0].emoji} ${rustRes.data.emojis[0].name})`);

  // Test 2: In-memory Category Search (Git & Workflow)
  const gitRes = callWasm({
    action: "emoji/search",
    requestId: "test-search-git",
    params: {
      query: "",
      category: "Git & Workflow",
      limit: 50
    }
  });
  assert.strictEqual(gitRes.code, 0);
  assert.strictEqual(gitRes.data.total, 15);
  console.log(`✅ In-memory emoji/search (category Git & Workflow) passed! (${gitRes.data.total} emojis)`);

  // Test 3: In-memory Categories List
  const catsRes = callWasm({
    action: "emoji/categories",
    requestId: "test-cats",
    params: {}
  });
  assert.strictEqual(catsRes.code, 0);
  assert.strictEqual(catsRes.data.length, 7);
  console.log(`✅ In-memory emoji/categories passed! (7 categories)`);

  // Test 4: In-memory Presets
  const presetsRes = callWasm({
    action: "emoji/presets",
    requestId: "test-presets",
    params: {}
  });
  assert.strictEqual(presetsRes.code, 0);
  assert.strictEqual(presetsRes.data.length, 3);
  console.log(`✅ In-memory emoji/presets passed! (3 presets)`);

  // 2. Testing Hono Backend HTTP API
  console.log("🌐 Testing Hono Backend HTTP API...");
  const baseUrl = "http://localhost:3000";

  // HTTP GET categories
  const httpCats = await (await fetch(`${baseUrl}/api/backend/emoji/categories`)).json();
  assert.strictEqual(httpCats.code, 0);
  assert.strictEqual(httpCats.data.length, 7);
  console.log(`✅ HTTP GET /api/backend/emoji/categories passed!`);

  // HTTP GET presets
  const httpPresets = await (await fetch(`${baseUrl}/api/backend/emoji/presets`)).json();
  assert.strictEqual(httpPresets.code, 0);
  assert.strictEqual(httpPresets.data.length, 3);
  console.log(`✅ HTTP GET /api/backend/emoji/presets passed!`);

  // HTTP POST search (JSON)
  const httpSearch = await (await fetch(`${baseUrl}/api/backend/emoji/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "rocket",
      category: null,
      limit: 5
    })
  })).json();
  assert.strictEqual(httpSearch.code, 0);
  assert(httpSearch.data.total >= 1);
  assert.strictEqual(httpSearch.data.emojis[0].emoji, "🚀");
  console.log(`✅ HTTP POST /api/backend/emoji/search (JSON) passed!`);

  // HTTP POST search (HTMX)
  const htmxRes = await (await fetch(`${baseUrl}/api/backend/emoji/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "HX-Request": "true"
    },
    body: "query=crab&category=all&limit=20"
  })).text();
  assert(htmxRes.includes("result-box"), "HTMX response must contain result-box");
  assert(htmxRes.includes("🦀"), "HTMX response must contain crab emoji");
  console.log(`✅ HTTP POST /api/backend/emoji/search (HTMX) passed!`);

  // Verify /api/stats
  const stats = await (await fetch(`${baseUrl}/api/stats`)).json();
  assert(stats.emojiPicker, "/api/stats must include emojiPicker");
  console.log(`✅ /api/stats includes emojiPicker (${stats.emojiPicker.sizeFormatted})`);

  console.log("\n🎉 [SUCCESS] Tool #52 emoji-picker dual runtime verification passed completely!\n");
}

main().catch(err => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
