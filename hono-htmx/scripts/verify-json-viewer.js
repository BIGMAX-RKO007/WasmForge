import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyJsonViewer() {
  console.log('🚀 [Verification] Testing Tool #36: json-viewer (Dual Runtime)');

  // 1. In-memory WASM Verification
  const wasmPath = path.resolve(__dirname, '../public/wasm/json-viewer.wasm');
  const wasmBytes = fs.readFileSync(wasmPath);
  const wasmModule = await WebAssembly.compile(wasmBytes);
  const imports = WebAssembly.Module.imports(wasmModule);

  console.log(`📦 WASM Binary size: ${(wasmBytes.length / 1024).toFixed(2)} KB`);
  console.log(`🔍 WASM Imports count: ${imports.length}`);
  if (imports.length > 0) {
    throw new Error(`Pure C-ABI violation: expected 0 imports, got ${JSON.stringify(imports)}`);
  }

  const instance = await WebAssembly.instantiate(wasmModule, {});
  const { alloc, dealloc, dispatch, memory } = instance.exports;

  function runWasm(payload) {
    const inputBytes = new TextEncoder().encode(JSON.stringify(payload));
    const ptr = alloc(inputBytes.length);
    new Uint8Array(memory.buffer).set(inputBytes, ptr);
    const packed = dispatch(ptr, inputBytes.length);
    dealloc(ptr, inputBytes.length);

    const outPtr = Number(packed >> 32n);
    const outLen = Number(packed & 0xffffffffn);
    const outBytes = new Uint8Array(memory.buffer, outPtr, outLen);
    const result = JSON.parse(new TextDecoder().decode(outBytes));
    dealloc(outPtr, outLen);
    return result;
  }

  const testJson = JSON.stringify({
    name: "WasmForge",
    active: true,
    count: 36,
    sub: {
      nested: "value",
      tags: ["rust", "wasm"]
    }
  });

  // Test 1.1: json/inspect
  const resInspect = runWasm({
    action: 'json/inspect',
    params: {
      json: testJson,
      maxDepth: 50
    }
  });

  console.log('WASM json/inspect result stats:', resInspect.data?.stats);
  if (resInspect.code !== 0 || !resInspect.data) {
    throw new Error(`In-memory json/inspect failed: ${JSON.stringify(resInspect)}`);
  }
  if (resInspect.data.stats.totalNodes < 6) {
    throw new Error(`Unexpected node count: ${resInspect.data.stats.totalNodes}`);
  }
  if (resInspect.data.stats.maxDepth < 2) {
    throw new Error(`Expected max depth >= 2, got ${resInspect.data.stats.maxDepth}`);
  }
  console.log('✅ In-memory json/inspect passed!');

  // Test 1.2: json/query
  const resQuery = runWasm({
    action: 'json/query',
    params: {
      json: testJson,
      query: 'nested'
    }
  });

  console.log('WASM json/query result:', resQuery.data);
  if (resQuery.code !== 0 || !resQuery.data) {
    throw new Error(`In-memory json/query failed: ${JSON.stringify(resQuery)}`);
  }
  if (resQuery.data.matchCount === 0 || !resQuery.data.matches.some(m => m.path.includes('nested'))) {
    throw new Error(`Query for 'nested' did not return expected match: ${JSON.stringify(resQuery.data)}`);
  }
  console.log('✅ In-memory json/query passed!');

  // Test 1.3: json/sample
  const resSample = runWasm({
    action: 'json/sample',
    params: {}
  });

  if (resSample.code !== 0 || !resSample.data?.sampleJson) {
    throw new Error(`In-memory json/sample failed: ${JSON.stringify(resSample)}`);
  }
  console.log('✅ In-memory json/sample passed!');

  // 2. HTTP Backend Verification
  const baseUrl = 'http://localhost:3000';

  // Test 2.1: GET /api/backend/json/viewer-sample
  const sampleRes = await fetch(`${baseUrl}/api/backend/json/viewer-sample`);
  if (!sampleRes.ok) {
    throw new Error(`GET /api/backend/json/viewer-sample failed: ${sampleRes.status}`);
  }
  const sampleData = await sampleRes.json();
  if (!sampleData.sampleJson) {
    throw new Error(`Invalid sample response: ${JSON.stringify(sampleData)}`);
  }
  console.log('✅ Backend GET /api/backend/json/viewer-sample passed!');

  // Test 2.2: POST /api/backend/json/view (JSON payload - inspect mode)
  const apiInspectRes = await fetch(`${baseUrl}/api/backend/json/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'inspect',
      json: testJson
    })
  });
  if (!apiInspectRes.ok) {
    throw new Error(`POST /api/backend/json/view (JSON) failed: ${apiInspectRes.status}`);
  }
  const apiInspectData = await apiInspectRes.json();
  if (apiInspectData.code !== 0 || !apiInspectData.data?.stats) {
    throw new Error(`Unexpected backend inspect response: ${JSON.stringify(apiInspectData)}`);
  }
  console.log('✅ Backend POST /api/backend/json/view (JSON inspect) passed!');

  // Test 2.3: POST /api/backend/json/view (JSON payload - query mode)
  const apiQueryRes = await fetch(`${baseUrl}/api/backend/json/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'query',
      json: testJson,
      query: 'WasmForge'
    })
  });
  if (!apiQueryRes.ok) {
    throw new Error(`POST /api/backend/json/view (JSON query) failed: ${apiQueryRes.status}`);
  }
  const apiQueryData = await apiQueryRes.json();
  if (apiQueryData.code !== 0 || apiQueryData.data.matchCount === 0) {
    throw new Error(`Backend query returned 0 matches: ${JSON.stringify(apiQueryData)}`);
  }
  console.log('✅ Backend POST /api/backend/json/view (JSON query) passed!');

  // Test 2.4: POST /api/backend/json/view (HTMX form)
  const formInspectRes = await fetch(`${baseUrl}/api/backend/json/view`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'HX-Request': 'true'
    },
    body: new URLSearchParams({
      mode: 'inspect',
      json: testJson
    }).toString()
  });
  if (!formInspectRes.ok) {
    throw new Error(`POST /api/backend/json/view (HTMX form) failed: ${formInspectRes.status}`);
  }
  const formHtml = await formInspectRes.text();
  if (!formHtml.includes('Rust WASM: JSON 树状层级探针解析成功') || !formHtml.includes('总节点数:')) {
    throw new Error(`Unexpected HTMX output: ${formHtml}`);
  }
  console.log('✅ Backend POST /api/backend/json/view (HTMX inspect) passed!');

  // Test 2.5: GET /api/stats
  const statsRes = await fetch(`${baseUrl}/api/stats`);
  const stats = await statsRes.json();
  if (!stats.jsonViewer || stats.jsonViewer.sizeBytes <= 0) {
    throw new Error(`Invalid stats for jsonViewer: ${JSON.stringify(stats.jsonViewer)}`);
  }
  console.log(`✅ Stats check passed: jsonViewer is ${stats.jsonViewer.sizeFormatted}`);

  console.log('🎉 [Success] All Tool #36: json-viewer verification tests passed cleanly!');
}

verifyJsonViewer().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
