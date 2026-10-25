import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyRomanNumeralConverter() {
  console.log('🚀 [Verification] Testing Tool #27: roman-numeral-converter (Dual Runtime)');

  // 1. In-memory WASM Verification
  const wasmPath = path.resolve(__dirname, '../public/wasm/roman-numeral-converter.wasm');
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

  // Test 1.1: Arabic to Roman (2026 -> MMXXVI)
  const res1 = runWasm({ action: 'roman/convert', params: { input: '2026' } });
  console.log('WASM convert 2026 result:', res1);
  if (res1.code !== 0 || !res1.data) {
    throw new Error(`In-memory test 1 failed: ${JSON.stringify(res1)}`);
  }
  if (res1.data.roman !== 'MMXXVI' || res1.data.arabic !== 2026 || res1.data.mode !== 'toRoman') {
    throw new Error(`Unexpected conversion for 2026: ${JSON.stringify(res1.data)}`);
  }
  console.log('✅ In-memory Arabic to Roman (2026 -> MMXXVI) passed!');

  // Test 1.2: Roman to Arabic (MCMXCIV -> 1994)
  const res2 = runWasm({ action: 'roman/convert', params: { input: 'MCMXCIV' } });
  if (res2.code !== 0 || res2.data.arabic !== 1994 || res2.data.mode !== 'toArabic') {
    throw new Error(`In-memory Roman to Arabic test failed: ${JSON.stringify(res2)}`);
  }
  console.log('✅ In-memory Roman to Arabic (MCMXCIV -> 1994) passed!');

  // Test 1.3: Invalid Roman repetition (IIII should be rejected)
  const res3 = runWasm({ action: 'roman/convert', params: { input: 'IIII' } });
  if (res3.code === 0) {
    throw new Error(`Invalid Roman numeral IIII was improperly accepted!`);
  }
  console.log(`✅ In-memory invalid Roman syntax rejection passed (${res3.msg})`);

  // 2. HTTP Backend Verification
  const baseUrl = 'http://localhost:3000';

  // Sample API
  const sampleResp = await fetch(`${baseUrl}/api/backend/roman/sample`);
  if (!sampleResp.ok) throw new Error(`GET /api/backend/roman/sample failed`);
  const sampleData = await sampleResp.json();
  console.log('✅ Sample API Response:', sampleData);

  // Convert API JSON (3999 -> MMMCMXCIX)
  const convertResp = await fetch(`${baseUrl}/api/backend/roman/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: '3999' })
  });
  if (!convertResp.ok) throw new Error(`POST /api/backend/roman/convert JSON failed`);
  const convertData = await convertResp.json();
  if (convertData.code !== 0 || convertData.data.roman !== 'MMMCMXCIX') {
    throw new Error(`Backend convert failed: ${JSON.stringify(convertData)}`);
  }
  console.log('✅ Backend API Convert JSON passed:', convertData.data);

  // Convert API HTMX (MMXXVI -> 2026)
  const htmxResp = await fetch(`${baseUrl}/api/backend/roman/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'HX-Request': 'true'
    },
    body: new URLSearchParams({ input: 'MMXXVI' }).toString()
  });
  if (!htmxResp.ok) throw new Error(`POST /api/backend/roman/convert HTMX failed`);
  const htmxHtml = await htmxResp.text();
  if (!htmxHtml.includes('罗马数字与阿拉伯数字双向互转成功') || !htmxHtml.includes('2026')) {
    throw new Error(`HTMX response missing expected fragments: ${htmxHtml.slice(0, 200)}`);
  }
  console.log('✅ Backend API HTMX Form handling passed!');

  // Stats API
  const statsResp = await fetch(`${baseUrl}/api/stats`);
  const stats = await statsResp.json();
  if (!stats.romanNumeralConverter || stats.romanNumeralConverter.sizeBytes <= 0) {
    throw new Error(`Stats missing romanNumeralConverter: ${JSON.stringify(stats)}`);
  }
  console.log(`✅ Stats API includes romanNumeralConverter: ${stats.romanNumeralConverter.sizeFormatted}`);

  console.log('🎉 [Success] Tool #27 (roman-numeral-converter) dual-runtime verification fully passed!');
}

verifyRomanNumeralConverter().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
