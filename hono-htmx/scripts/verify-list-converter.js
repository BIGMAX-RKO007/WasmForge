import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyListConverter() {
  console.log('🚀 [Verification] Testing Tool #31: list-converter (Dual Runtime)');

  // 1. In-memory WASM Verification
  const wasmPath = path.resolve(__dirname, '../public/wasm/list-converter.wasm');
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

  // Test 1.1: In-memory sorting, dedup, trim, numbering
  const res1 = runWasm({
    action: 'list/convert',
    params: {
      input: "  orange  \napple\n\nbanana\napple\n",
      sort: "asc",
      deduplicate: true,
      trim: true,
      removeEmpty: true,
      lineNumbers: true,
      prefix: "* "
    }
  });

  console.log('WASM list/convert result:', res1);
  if (res1.code !== 0 || !res1.data) {
    throw new Error(`In-memory test 1 failed: ${JSON.stringify(res1)}`);
  }
  if (res1.data.lines.length !== 3) {
    throw new Error(`Expected 3 lines, got ${res1.data.lines.length}`);
  }
  if (res1.data.lines[0] !== "1. * apple" || res1.data.lines[1] !== "2. * banana" || res1.data.lines[2] !== "3. * orange") {
    throw new Error(`Unexpected sorted/formatted lines: ${JSON.stringify(res1.data.lines)}`);
  }
  if (res1.data.stats.emptyRemoved < 1 || res1.data.stats.duplicatesRemoved !== 1) {
    throw new Error(`Unexpected stats: ${JSON.stringify(res1.data.stats)}`);
  }
  console.log('✅ In-memory list sorting, dedup, prefix and numbering passed!');

  // Test 1.2: Sample Action
  const resSample = runWasm({
    action: 'list/sample',
    params: {}
  });
  if (resSample.code !== 0 || !resSample.data?.sampleInput) {
    throw new Error(`In-memory list/sample failed: ${JSON.stringify(resSample)}`);
  }
  console.log('✅ In-memory list/sample passed!');

  // 2. HTTP Backend Verification
  const baseUrl = 'http://localhost:3000';

  // Sample API
  const sampleResp = await fetch(`${baseUrl}/api/backend/list/sample`);
  if (!sampleResp.ok) throw new Error(`GET /api/backend/list/sample failed: ${sampleResp.status}`);
  const sampleData = await sampleResp.json();
  if (!sampleData.sampleInput) throw new Error('Sample input missing from API response');
  console.log('✅ Sample API Response received');

  // Convert API JSON
  const convertResp = await fetch(`${baseUrl}/api/backend/list/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: "zebra\nkangaroo\nmonkey",
      sort: "desc",
      joinDelimiter: " | "
    })
  });
  if (!convertResp.ok) throw new Error(`POST /api/backend/list/convert JSON failed`);
  const convertData = await convertResp.json();
  if (convertData.code !== 0 || convertData.data.output !== "zebra | monkey | kangaroo") {
    throw new Error(`Backend convert failed: ${JSON.stringify(convertData)}`);
  }
  console.log('✅ Backend API Convert JSON passed!');

  // Convert API HTMX
  const htmxResp = await fetch(`${baseUrl}/api/backend/list/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'HX-Request': 'true'
    },
    body: new URLSearchParams({
      input: "cat\ndog\nbird\ncat",
      sort: "asc",
      deduplicate: "true",
      trim: "true",
      remove_empty: "true"
    }).toString()
  });

  if (!htmxResp.ok) throw new Error(`POST /api/backend/list/convert HTMX failed`);
  const htmxHtml = await htmxResp.text();
  if (!htmxHtml.includes('多行列表规整与排序去重成功') || !htmxHtml.includes('bird\ncat\ndog')) {
    throw new Error(`Unexpected HTMX HTML output: ${htmxHtml}`);
  }
  console.log('✅ Backend API HTMX POST passed!');

  // 3. Stats Verification
  const statsResp = await fetch(`${baseUrl}/api/stats`);
  const stats = await statsResp.json();
  if (!stats.listConverter || stats.listConverter.sizeBytes <= 0) {
    throw new Error(`Stats missing listConverter info: ${JSON.stringify(stats)}`);
  }
  console.log(`✅ System Stats verified: ${stats.listConverter.file} (${stats.listConverter.sizeFormatted})`);

  console.log('\n🎉 ALL CHECKS PASSED: Tool #31 list-converter verified on Dual Runtime!');
}

verifyListConverter().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
