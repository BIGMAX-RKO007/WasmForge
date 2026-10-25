import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyTextToUnicode() {
  console.log('🚀 [Verification] Testing Tool #29: text-to-unicode (Dual Runtime)');

  // 1. In-memory WASM Verification
  const wasmPath = path.resolve(__dirname, '../public/wasm/text-to-unicode.wasm');
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

  // Test 1.1: Text to Unicode (你好)
  const res1 = runWasm({ action: 'unicode/convert', params: { input: '你好', escapeAll: false } });
  console.log('WASM convert 你好 result:', res1);
  if (res1.code !== 0 || !res1.data) {
    throw new Error(`In-memory test 1 failed: ${JSON.stringify(res1)}`);
  }
  if (res1.data.standardEscape !== '\\u4f60\\u597d' || res1.data.htmlHexEntity !== '&#x4F60;&#x597D;') {
    throw new Error(`Unexpected escape for 你好: ${JSON.stringify(res1.data)}`);
  }
  console.log('✅ In-memory Text to Unicode (你好) passed!');

  // Test 1.2: Unicode escape to Text reverse
  const res2 = runWasm({ action: 'unicode/convert', params: { input: '\\u4f60\\u597d' } });
  if (res2.code !== 0 || res2.data.text !== '你好' || res2.data.mode !== 'decode') {
    throw new Error(`In-memory reverse decode failed: ${JSON.stringify(res2)}`);
  }
  console.log('✅ In-memory Unicode escape to Text reverse passed!');

  // Test 1.3: Emoji / Astral Plane Surrogate Pair & ES6 (\u{1f680})
  const res3 = runWasm({ action: 'unicode/convert', params: { input: '🚀', escapeAll: false } });
  if (!res3.data.es6Escape.includes('\\u{1f680}')) {
    throw new Error(`ES6 Emoji escape failed: ${res3.data.es6Escape}`);
  }
  const res3Decode = runWasm({ action: 'unicode/convert', params: { input: '\\u{1f680}' } });
  if (res3Decode.data.text !== '🚀') {
    throw new Error(`ES6 Emoji decode failed: ${res3Decode.data.text}`);
  }
  console.log('✅ In-memory Emoji & ES6 variable-width decode passed!');

  // 2. HTTP Backend Verification
  const baseUrl = 'http://localhost:3000';

  // Sample API
  const sampleResp = await fetch(`${baseUrl}/api/backend/unicode/sample`);
  if (!sampleResp.ok) throw new Error(`GET /api/backend/unicode/sample failed`);
  const sampleData = await sampleResp.json();
  console.log('✅ Sample API Response:', sampleData);

  // Convert API JSON
  const convertResp = await fetch(`${baseUrl}/api/backend/unicode/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: '世界' })
  });
  if (!convertResp.ok) throw new Error(`POST /api/backend/unicode/convert JSON failed`);
  const convertData = await convertResp.json();
  if (convertData.code !== 0 || convertData.data.standardEscape !== '\\u4e16\\u754c') {
    throw new Error(`Backend convert failed: ${JSON.stringify(convertData)}`);
  }
  console.log('✅ Backend API Convert JSON passed:', convertData.data);

  // Convert API HTMX
  const htmxResp = await fetch(`${baseUrl}/api/backend/unicode/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'HX-Request': 'true'
    },
    body: new URLSearchParams({ input: '你好，WasmForge!' }).toString()
  });
  if (!htmxResp.ok) throw new Error(`POST /api/backend/unicode/convert HTMX failed`);
  const htmxHtml = await htmxResp.text();
  if (!htmxHtml.includes('Unicode 转义与逆转处理成功') || !htmxHtml.includes('\\u4f60\\u597d')) {
    throw new Error(`HTMX response missing expected fragments: ${htmxHtml.slice(0, 200)}`);
  }
  console.log('✅ Backend API HTMX Form handling passed!');

  // Stats API
  const statsResp = await fetch(`${baseUrl}/api/stats`);
  const stats = await statsResp.json();
  if (!stats.textToUnicode || stats.textToUnicode.sizeBytes <= 0) {
    throw new Error(`Stats missing textToUnicode: ${JSON.stringify(stats)}`);
  }
  console.log(`✅ Stats API includes textToUnicode: ${stats.textToUnicode.sizeFormatted}`);

  console.log('🎉 [Success] Tool #29 (text-to-unicode) dual-runtime verification fully passed!');
}

verifyTextToUnicode().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
