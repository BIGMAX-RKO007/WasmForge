import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyIntegerBaseConverter() {
  console.log('🚀 [Verification] Testing Tool #26: integer-base-converter (Dual Runtime)');

  // 1. In-memory WASM Verification
  const wasmPath = path.resolve(__dirname, '../public/wasm/integer-base-converter.wasm');
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

  // Test 1.1: Hexadecimal 0x7FFF
  const res1 = runWasm({ action: 'base/convert', params: { input: '0x7FFF' } });
  console.log('WASM convert 0x7FFF result:', res1);
  if (res1.code !== 0 || !res1.data) {
    throw new Error(`In-memory test 1 failed: ${JSON.stringify(res1)}`);
  }
  if (res1.data.decimal !== '32767' || res1.data.detectedBase !== 16 || res1.data.hexUpper !== '7FFF') {
    throw new Error(`Unexpected conversion for 0x7FFF: ${JSON.stringify(res1.data)}`);
  }
  if (res1.data.bitLength !== 15 || res1.data.byteLength !== 2) {
    throw new Error(`Unexpected bit length or byte length: ${JSON.stringify(res1.data)}`);
  }
  console.log('✅ In-memory Hexadecimal conversion passed!');

  // Test 1.2: Binary 0b1010
  const res2 = runWasm({ action: 'base/convert', params: { input: '0b1010' } });
  if (res2.code !== 0 || res2.data.decimal !== '10' || res2.data.detectedBase !== 2) {
    throw new Error(`In-memory binary test failed: ${JSON.stringify(res2)}`);
  }
  console.log('✅ In-memory Binary conversion passed!');

  // Test 1.3: Negative integer -128 & two's complement
  const res3 = runWasm({ action: 'base/convert', params: { input: '-128' } });
  if (res3.code !== 0 || !res3.data.isNegative || !res3.data.twocompl8bit.includes('0x80')) {
    throw new Error(`In-memory negative integer test failed: ${JSON.stringify(res3)}`);
  }
  console.log('✅ In-memory Negative integer two\'s complement passed!');

  // Test 1.4: Base 36 custom base
  const res4 = runWasm({ action: 'base/convert', params: { input: '100', fromBase: 36 } });
  if (res4.code !== 0 || res4.data.decimal !== '1296' || res4.data.detectedBase !== 36) {
    throw new Error(`In-memory Base36 test failed: ${JSON.stringify(res4)}`);
  }
  console.log('✅ In-memory custom Base 36 conversion passed!');

  // 2. HTTP Backend Verification
  const baseUrl = 'http://localhost:3000';

  // Sample API
  const sampleResp = await fetch(`${baseUrl}/api/backend/base/sample`);
  if (!sampleResp.ok) throw new Error(`GET /api/backend/base/sample failed`);
  const sampleData = await sampleResp.json();
  console.log('✅ Sample API Response:', sampleData);

  // Convert API JSON
  const convertResp = await fetch(`${baseUrl}/api/backend/base/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: '0xFF' })
  });
  if (!convertResp.ok) throw new Error(`POST /api/backend/base/convert JSON failed`);
  const convertData = await convertResp.json();
  if (convertData.code !== 0 || convertData.data.decimal !== '255') {
    throw new Error(`Backend convert failed: ${JSON.stringify(convertData)}`);
  }
  console.log('✅ Backend API Convert JSON passed:', convertData.data);

  // Convert API HTMX
  const htmxResp = await fetch(`${baseUrl}/api/backend/base/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'HX-Request': 'true'
    },
    body: new URLSearchParams({ input: '0x7F_FF' }).toString()
  });
  if (!htmxResp.ok) throw new Error(`POST /api/backend/base/convert HTMX failed`);
  const htmxHtml = await htmxResp.text();
  if (!htmxHtml.includes('任意进制转换与位分析成功') || !htmxHtml.includes('32767')) {
    throw new Error(`HTMX response missing expected fragments: ${htmxHtml.slice(0, 200)}`);
  }
  console.log('✅ Backend API HTMX Form handling passed!');

  // Stats API
  const statsResp = await fetch(`${baseUrl}/api/stats`);
  const stats = await statsResp.json();
  if (!stats.integerBaseConverter || stats.integerBaseConverter.sizeBytes <= 0) {
    throw new Error(`Stats missing integerBaseConverter: ${JSON.stringify(stats)}`);
  }
  console.log(`✅ Stats API includes integerBaseConverter: ${stats.integerBaseConverter.sizeFormatted}`);

  console.log('🎉 [Success] Tool #26 (integer-base-converter) dual-runtime verification fully passed!');
}

verifyIntegerBaseConverter().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
