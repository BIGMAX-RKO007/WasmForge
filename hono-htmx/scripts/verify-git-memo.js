import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 [Verification] Testing Tool #44: git-memo (Dual Runtime)");

  const wasmPath = path.resolve(__dirname, "../public/wasm/git-memo.wasm");
  assert(fs.existsSync(wasmPath), "git-memo.wasm must exist in public/wasm/");

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

  // Test 1: Categories
  const catRes = callWasm({
    action: "git/categories",
    requestId: "test-1",
    params: {}
  });
  assert.strictEqual(catRes.code, 0);
  assert(Array.isArray(catRes.data) && catRes.data.length >= 8);
  console.log(`✅ In-memory git/categories passed! (Found ${catRes.data.length} categories)`);

  // Test 2: List filtered by category
  const listRes = callWasm({
    action: "git/list",
    requestId: "test-2",
    params: { category: "undo", keyword: "" }
  });
  assert.strictEqual(listRes.code, 0);
  assert(listRes.data.total >= 4);
  assert(listRes.data.commands.some(c => c.id === "reset-soft"));
  console.log(`✅ In-memory git/list (undo category) passed! (${listRes.data.total} commands)`);

  // Test 3: Scenarios
  const scenRes = callWasm({
    action: "git/scenarios",
    requestId: "test-3",
    params: { keyword: "reflog" }
  });
  assert.strictEqual(scenRes.code, 0);
  assert(scenRes.data.scenarios.some(s => s.id === "recover-deleted-commit"));
  console.log(`✅ In-memory git/scenarios passed! (${scenRes.data.total} matches for 'reflog')`);

  // Test 4: Search
  const searchRes = callWasm({
    action: "git/search",
    requestId: "test-4",
    params: { keyword: "amend" }
  });
  assert.strictEqual(searchRes.code, 0);
  assert(searchRes.data.matchedCommands.some(c => c.id === "commit-amend"));
  assert(searchRes.data.matchedScenarios.some(s => s.id === "fix-commit-message"));
  console.log(`✅ In-memory git/search passed!`);

  // 2. Testing Hono Backend HTTP API
  console.log("🌐 Testing Hono Backend HTTP API...");
  const baseUrl = "http://localhost:3000";

  // HTTP Categories
  const httpCat = await (await fetch(`${baseUrl}/api/backend/git/categories`)).json();
  assert.strictEqual(httpCat.code, 0);
  assert(httpCat.data.length >= 8);
  console.log(`✅ HTTP GET /api/backend/git/categories passed!`);

  // HTTP List
  const httpList = await (await fetch(`${baseUrl}/api/backend/git/list?category=branch`)).json();
  assert.strictEqual(httpList.code, 0);
  assert(httpList.data.commands.length >= 4);
  console.log(`✅ HTTP GET /api/backend/git/list passed!`);

  // HTTP Scenarios
  const httpScen = await (await fetch(`${baseUrl}/api/backend/git/scenarios`)).json();
  assert.strictEqual(httpScen.code, 0);
  assert(httpScen.data.total >= 5);
  console.log(`✅ HTTP GET /api/backend/git/scenarios passed!`);

  // HTTP POST Search (JSON)
  const httpSearch = await (await fetch(`${baseUrl}/api/backend/git/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword: "stash" })
  })).json();
  assert.strictEqual(httpSearch.code, 0);
  assert(httpSearch.data.matchedCommands.length >= 2);
  console.log(`✅ HTTP POST /api/backend/git/search (JSON) passed!`);

  // HTTP POST Search (HTMX)
  const htmxSearch = await (await fetch(`${baseUrl}/api/backend/git/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "HX-Request": "true"
    },
    body: "category=all&keyword=rebase"
  })).text();
  assert(htmxSearch.includes("result-box"), "HTMX response must contain result-box");
  assert(htmxSearch.includes("rebase"), "HTMX response must contain rebase command");
  console.log(`✅ HTTP POST /api/backend/git/search (HTMX) passed!`);

  // Verify /api/stats
  const stats = await (await fetch(`${baseUrl}/api/stats`)).json();
  assert(stats.gitMemo, "/api/stats must include gitMemo");
  console.log(`✅ /api/stats includes gitMemo (${stats.gitMemo.sizeFormatted})`);

  console.log("\n🎉 [SUCCESS] Tool #44 git-memo dual runtime verification passed completely!\n");
}

main().catch(err => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
