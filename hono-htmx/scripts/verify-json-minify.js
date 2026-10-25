import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyJsonMinify() {
  console.log('🚀 [Verification] Testing Tool #35: json-minify (Dual Runtime)');

  // 1. In-memory WASM Verification
  const wasmPath = path.resolve(__dirname, '../public/wasm/json-minify.wasm');
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

  // Test 1.1: json/minify with JSONC comments
  const resMin = runWasm({
    action: 'json/minify',
    params: {
      json: `{\n  // configuration\n  "app": "WasmForge",\n  /* author */\n  "version": 1\n}`
    }
  });

  console.log('WASM json/minify result:', resMin);
  if (resMin.code !== 0 || !resMin.data) {
    throw new Error(`In-memory json/minify failed: ${JSON.stringify(resMin)}`);
  }
  if (resMin.data.minified !== '{"app":"WasmForge","version":1}') {
    throw new Error(`Unexpected minified result: ${resMin.data.minified}`);
  }
  if (resMin.data.stats.lineCount !== 1) {
    throw new Error(`Expected 1 line for minified JSON`);
  }
  console.log('✅ In-memory json/minify passed!');

  // Test 1.2: json/prettify with 4 spaces
  const resPret = runWasm({
    action: 'json/prettify',
    params: {
      json: '{"title":"Hello","tags":["wasm","fast"]}',
      indent: 4
    }
  });

  console.log('WASM json/prettify result:', resPret);
  if (resPret.code !== 0 || !resPret.data) {
    throw new Error(`In-memory json/prettify failed: ${JSON.stringify(resPret)}`);
  }
  if (!resPret.data.prettified.includes('    "title": "Hello"') || resPret.data.stats.lineCount <= 1) {
    throw new Error(`4-space indentation missing: ${resPret.data.prettified}`);
  }
  console.log('✅ In-memory json/prettify passed!');

  // Test 1.3: json/validate
  const resVal = runWasm({
    action: 'json/validate',
    params: {
      json: '{"items": [1, 2, 3], "enabled": true, "extra": null}'
    }
  });

  console.log('WASM json/validate result:', resVal);
  if (resVal.code !== 0 || !resVal.data?.isValid) {
    throw new Error(`In-memory json/validate failed: ${JSON.stringify(resVal)}`);
  }
  const b = resVal.data.typeBreakdown;
  if (b.arrays !== 1 || b.numbers !== 3 || b.booleans !== 1 || b.nulls !== 1) {
    throw new Error(`Unexpected breakdown: ${JSON.stringify(b)}`);
  }
  console.log('✅ In-memory json/validate passed!');

  // Test 1.4: json/sample
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

  // Sample API
  const sampleResp = await fetch(`${baseUrl}/api/backend/json/sample`);
  if (!sampleResp.ok) throw new Error(`GET /api/backend/json/sample failed`);
  const sampleData = await sampleResp.json();
  if (!sampleData.sampleJson) throw new Error('sampleJson missing from API response');
  console.log('✅ Backend Sample API Response received');

  // Convert API JSON Minify
  const minResp = await fetch(`${baseUrl}/api/backend/json/minify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: "minify",
      json: "{\n  \"status\": 200,\n  \"message\": \"OK\"\n}"
    })
  });
  if (!minResp.ok) throw new Error(`POST /api/backend/json/minify failed`);
  const minData = await minResp.json();
  if (minData.code !== 0 || minData.data.minified !== '{"message":"OK","status":200}') {
    throw new Error(`Backend JSON Minify failed: ${JSON.stringify(minData)}`);
  }
  console.log('✅ Backend API JSON Minify passed!');

  // Convert API JSON Prettify
  const pretResp = await fetch(`${baseUrl}/api/backend/json/minify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: "prettify",
      json: '{"id":100}',
      indent: 2
    })
  });
  if (!pretResp.ok) throw new Error(`POST /api/backend/json/minify Prettify failed`);
  const pretData = await pretResp.json();
  if (pretData.code !== 0 || !pretData.data.prettified.includes('  "id": 100')) {
    throw new Error(`Backend JSON Prettify failed: ${JSON.stringify(pretData)}`);
  }
  console.log('✅ Backend API JSON Prettify passed!');

  // Convert API HTMX
  const htmxResp = await fetch(`${baseUrl}/api/backend/json/minify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'HX-Request': 'true'
    },
    body: new URLSearchParams({
      mode: "minify",
      json: '{\n  "service": "auth"\n}'
    }).toString()
  });

  if (!htmxResp.ok) throw new Error(`POST /api/backend/json/minify HTMX failed`);
  const htmxHtml = await htmxResp.text();
  if (!htmxHtml.includes('JSON 极速压缩瘦身成功') || !htmxHtml.includes('service')) {
    throw new Error(`Unexpected HTMX HTML output: ${htmxHtml}`);
  }
  console.log('✅ Backend API HTMX POST passed!');

  // 3. Stats Verification
  const statsResp = await fetch(`${baseUrl}/api/stats`);
  const stats = await statsResp.json();
  if (!stats.jsonMinify || stats.jsonMinify.sizeBytes <= 0) {
    throw new Error(`Stats missing jsonMinify info: ${JSON.stringify(stats)}`);
  }
  console.log(`✅ System Stats verified: ${stats.jsonMinify.file} (${stats.jsonMinify.sizeFormatted})`);

  console.log('\n🎉 ALL CHECKS PASSED: Tool #35 json-minify verified on Dual Runtime!');
}

verifyJsonMinify().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
