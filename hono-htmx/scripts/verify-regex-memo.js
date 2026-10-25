import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyRegexMemo() {
  console.log('🚀 [Verification] Testing Tool #39: regex-memo (Dual Runtime)');

  // 1. In-memory WASM Verification
  const wasmPath = path.resolve(__dirname, '../public/wasm/regex-memo.wasm');
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

  // Test 1.1: memo/list
  const resList = runWasm({
    action: 'memo/list',
    params: {}
  });

  console.log('WASM memo/list total count:', resList.data?.total);
  if (resList.code !== 0 || !resList.data) {
    throw new Error(`In-memory memo/list failed: ${JSON.stringify(resList)}`);
  }
  if (resList.data.total < 25) {
    throw new Error(`Expected at least 25 items, got ${resList.data.total}`);
  }
  console.log('✅ In-memory memo/list passed!');

  // Test 1.2: memo/search with query '手机'
  const resSearch = runWasm({
    action: 'memo/search',
    params: {
      query: '手机'
    }
  });

  console.log('WASM memo/search result count:', resSearch.data?.matchCount);
  if (resSearch.code !== 0 || !resSearch.data) {
    throw new Error(`In-memory memo/search failed: ${JSON.stringify(resSearch)}`);
  }
  if (resSearch.data.matchCount === 0 || !resSearch.data.matches.some(m => m.id === 'pattern-phone-cn')) {
    throw new Error(`Expected phone pattern match, got: ${JSON.stringify(resSearch.data)}`);
  }
  console.log('✅ In-memory memo/search passed!');

  // Test 1.3: memo/search with category 'quantifiers'
  const resCat = runWasm({
    action: 'memo/search',
    params: {
      category: 'quantifiers'
    }
  });

  if (resCat.code !== 0 || !resCat.data || !resCat.data.matches.every(m => m.category === 'quantifiers')) {
    throw new Error(`Category filter failed: ${JSON.stringify(resCat)}`);
  }
  console.log('✅ In-memory memo/search category filter passed!');

  // 2. HTTP Backend Verification
  const baseUrl = 'http://localhost:3000';

  // Test 2.1: GET /api/backend/regex/memo (JSON API - category common)
  const apiCatRes = await fetch(`${baseUrl}/api/backend/regex/memo?category=common`, {
    headers: { 'Content-Type': 'application/json' }
  });
  if (!apiCatRes.ok) {
    throw new Error(`GET /api/backend/regex/memo failed: ${apiCatRes.status}`);
  }
  const apiCatData = await apiCatRes.json();
  if (apiCatData.code !== 0 || apiCatData.data.matchCount < 5) {
    throw new Error(`Invalid category response: ${JSON.stringify(apiCatData)}`);
  }
  console.log('✅ Backend GET /api/backend/regex/memo (JSON common) passed!');

  // Test 2.2: GET /api/backend/regex/memo (JSON API - query ipv4)
  const apiQueryRes = await fetch(`${baseUrl}/api/backend/regex/memo?query=ipv4`, {
    headers: { 'Content-Type': 'application/json' }
  });
  if (!apiQueryRes.ok) {
    throw new Error(`GET /api/backend/regex/memo query failed: ${apiQueryRes.status}`);
  }
  const apiQueryData = await apiQueryRes.json();
  if (apiQueryData.code !== 0 || apiQueryData.data.matchCount === 0) {
    throw new Error(`Query returned 0 matches: ${JSON.stringify(apiQueryData)}`);
  }
  console.log('✅ Backend GET /api/backend/regex/memo (JSON ipv4) passed!');

  // Test 2.3: POST /api/backend/regex/memo (HTMX form)
  const formRes = await fetch(`${baseUrl}/api/backend/regex/memo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'HX-Request': 'true'
    },
    body: new URLSearchParams({
      query: '贪婪',
      category: 'quantifiers'
    }).toString()
  });
  if (!formRes.ok) {
    throw new Error(`POST /api/backend/regex/memo (HTMX form) failed: ${formRes.status}`);
  }
  const formHtml = await formRes.text();
  if (!formHtml.includes('Rust WASM: 正则速查字典检索完成') || !formHtml.includes('匹配语法条目:')) {
    throw new Error(`Unexpected HTMX output: ${formHtml}`);
  }
  console.log('✅ Backend POST /api/backend/regex/memo (HTMX) passed!');

  // Test 2.4: GET /api/stats
  const statsRes = await fetch(`${baseUrl}/api/stats`);
  const stats = await statsRes.json();
  if (!stats.regexMemo || stats.regexMemo.sizeBytes <= 0) {
    throw new Error(`Invalid stats for regexMemo: ${JSON.stringify(stats.regexMemo)}`);
  }
  console.log(`✅ Stats check passed: regexMemo is ${stats.regexMemo.sizeFormatted}`);

  console.log('🎉 [Success] All Tool #39: regex-memo verification tests passed cleanly!');
}

verifyRegexMemo().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
