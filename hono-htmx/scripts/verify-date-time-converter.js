import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyDateTimeConverter() {
  console.log('🚀 [Verification] Testing Tool #25: date-time-converter (Dual Runtime)');

  // 1. In-memory WASM Verification
  const wasmPath = path.resolve(__dirname, '../public/wasm/date-time-converter.wasm');
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

  // Test 1.1: ISO-8601 string
  const res1 = runWasm({ action: 'datetime/convert', params: { input: '2026-10-25T14:30:00Z' } });
  console.log('WASM convert ISO string result:', res1);
  if (res1.code !== 0 || !res1.data) {
    throw new Error(`In-memory test 1 failed: ${JSON.stringify(res1)}`);
  }
  if (res1.data.unixSeconds !== 1792938600) {
    throw new Error(`Unexpected timestamp: ${res1.data.unixSeconds}`);
  }
  if (!res1.data.cst.includes('22:30:00') || !res1.data.jst.includes('23:30:00')) {
    throw new Error(`Timezone offset calculation error: cst=${res1.data.cst}, jst=${res1.data.jst}`);
  }
  if (res1.data.dayOfWeek !== 'Sunday') {
    throw new Error(`Unexpected day of week: ${res1.data.dayOfWeek}`);
  }
  console.log('✅ In-memory ISO-8601 parsing & timezone conversion passed!');

  // Test 1.2: Unix timestamp string
  const res2 = runWasm({ action: 'datetime/convert', params: { input: '1792938600' } });
  if (res2.code !== 0 || !res2.data.iso8601.startsWith('2026-10-25T14:30:00')) {
    throw new Error(`In-memory timestamp parsing failed: ${JSON.stringify(res2)}`);
  }
  console.log('✅ In-memory Unix timestamp parsing passed!');

  // 2. HTTP Backend Verification
  const baseUrl = 'http://localhost:3000';

  // Sample API
  const sampleResp = await fetch(`${baseUrl}/api/backend/datetime/sample`);
  if (!sampleResp.ok) throw new Error(`GET /api/backend/datetime/sample failed`);
  const sampleData = await sampleResp.json();
  console.log('✅ Sample API Response:', sampleData);

  // Convert API JSON
  const convertResp = await fetch(`${baseUrl}/api/backend/datetime/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: '2026-10-25 14:30:00' })
  });
  if (!convertResp.ok) throw new Error(`POST /api/backend/datetime/convert failed`);
  const convertData = await convertResp.json();
  if (convertData.code !== 0 || !convertData.data) {
    throw new Error(`Backend convert failed: ${JSON.stringify(convertData)}`);
  }
  console.log('✅ Backend API Convert JSON passed:', convertData.data);

  // Convert API HTMX
  const htmxResp = await fetch(`${baseUrl}/api/backend/datetime/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'HX-Request': 'true'
    },
    body: new URLSearchParams({ datetime_input: '2026-10-25T14:30:00Z' }).toString()
  });
  if (!htmxResp.ok) throw new Error(`POST /api/backend/datetime/convert HTMX failed`);
  const htmxHtml = await htmxResp.text();
  if (!htmxHtml.includes('时间戳与跨时区投影分析') || !htmxHtml.includes('1792938600')) {
    throw new Error(`HTMX response missing expected fragments: ${htmxHtml.slice(0, 200)}`);
  }
  console.log('✅ Backend API HTMX Form handling passed!');

  console.log('🎉 [Success] Tool #25 (date-time-converter) dual-runtime verification fully passed!');
}

verifyDateTimeConverter().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
