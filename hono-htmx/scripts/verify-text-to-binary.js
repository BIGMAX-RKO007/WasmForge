import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyTextToBinary() {
  console.log('🚀 [Verification] Testing Tool #28: text-to-binary (Dual Runtime)');

  // 1. In-memory WASM Verification
  const wasmPath = path.resolve(__dirname, '../public/wasm/text-to-binary.wasm');
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

  // Test 1.1: Text to Binary (Hello)
  const res1 = runWasm({ action: 'binary/convert', params: { input: 'Hello', delimiter: 'space' } });
  console.log('WASM convert Hello result:', res1);
  if (res1.code !== 0 || !res1.data) {
    throw new Error(`In-memory test 1 failed: ${JSON.stringify(res1)}`);
  }
  if (res1.data.binary !== '01001000 01100101 01101100 01101100 01101111' || res1.data.totalBytes !== 5) {
    throw new Error(`Unexpected binary encoding for Hello: ${JSON.stringify(res1.data)}`);
  }
  console.log('✅ In-memory Text to Binary (Hello) passed!');

  // Test 1.2: Binary to Text reverse
  const res2 = runWasm({ action: 'binary/convert', params: { input: res1.data.binary, mode: 'decode' } });
  if (res2.code !== 0 || res2.data.text !== 'Hello') {
    throw new Error(`In-memory Binary to Text test failed: ${JSON.stringify(res2)}`);
  }
  console.log('✅ In-memory Binary to Text reverse passed!');

  // Test 1.3: Delimiters (comma, none, prefix)
  const resComma = runWasm({ action: 'binary/convert', params: { input: 'Hi', delimiter: 'comma' } });
  if (resComma.data.binary !== '01001000,01101001') {
    throw new Error(`Comma delimiter failed: ${resComma.data.binary}`);
  }
  const resPrefix = runWasm({ action: 'binary/convert', params: { input: 'Hi', delimiter: 'prefix' } });
  if (resPrefix.data.binary !== '0b01001000 0b01101001') {
    throw new Error(`Prefix delimiter failed: ${resPrefix.data.binary}`);
  }
  console.log('✅ In-memory delimiters (comma, prefix) passed!');

  // Test 1.4: Invalid binary rejection
  const resInvalid = runWasm({ action: 'binary/convert', params: { input: '010101', mode: 'decode' } });
  if (resInvalid.code === 0) {
    throw new Error('Invalid binary sequence was improperly accepted!');
  }
  console.log(`✅ In-memory invalid binary rejection passed: ${resInvalid.msg}`);

  // 2. HTTP Backend Verification
  const baseUrl = 'http://localhost:3000';

  // Sample API
  const sampleResp = await fetch(`${baseUrl}/api/backend/text-binary/sample`);
  if (!sampleResp.ok) throw new Error(`GET /api/backend/text-binary/sample failed`);
  const sampleData = await sampleResp.json();
  console.log('✅ Sample API Response:', sampleData);

  // Convert API JSON (WasmForge 2026)
  const convertResp = await fetch(`${baseUrl}/api/backend/text-binary/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: 'WasmForge' })
  });
  if (!convertResp.ok) throw new Error(`POST /api/backend/text-binary/convert JSON failed`);
  const convertData = await convertResp.json();
  if (convertData.code !== 0 || !convertData.data.binary.startsWith('01010111')) {
    throw new Error(`Backend convert failed: ${JSON.stringify(convertData)}`);
  }
  console.log('✅ Backend API Convert JSON passed:', convertData.data);

  // Convert API HTMX
  const htmxResp = await fetch(`${baseUrl}/api/backend/text-binary/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'HX-Request': 'true'
    },
    body: new URLSearchParams({ input: 'WasmForge 2026', delimiter: 'space' }).toString()
  });
  if (!htmxResp.ok) throw new Error(`POST /api/backend/text-binary/convert HTMX failed`);
  const htmxHtml = await htmxResp.text();
  if (!htmxHtml.includes('文本与 8位二进制流转换成功') || !htmxHtml.includes('WasmForge 2026')) {
    throw new Error(`HTMX response missing expected fragments: ${htmxHtml.slice(0, 200)}`);
  }
  console.log('✅ Backend API HTMX Form handling passed!');

  // Stats API
  const statsResp = await fetch(`${baseUrl}/api/stats`);
  const stats = await statsResp.json();
  if (!stats.textToBinary || stats.textToBinary.sizeBytes <= 0) {
    throw new Error(`Stats missing textToBinary: ${JSON.stringify(stats)}`);
  }
  console.log(`✅ Stats API includes textToBinary: ${stats.textToBinary.sizeFormatted}`);

  console.log('🎉 [Success] Tool #28 (text-to-binary) dual-runtime verification fully passed!');
}

verifyTextToBinary().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
