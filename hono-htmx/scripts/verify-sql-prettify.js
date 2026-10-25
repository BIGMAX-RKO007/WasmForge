import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifySqlPrettify() {
  console.log('🚀 [Verification] Testing Tool #33: sql-prettify (Dual Runtime)');

  // 1. In-memory WASM Verification
  const wasmPath = path.resolve(__dirname, '../public/wasm/sql-prettify.wasm');
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

  // Test 1.1: sql/format
  const resFmt = runWasm({
    action: 'sql/format',
    params: {
      sql: "select u.id, u.name, count(o.id) as orders from users u left join orders o on u.id = o.user_id where u.active = 1 group by u.id, u.name order by orders desc;",
      indent: 2,
      uppercase: true
    }
  });

  console.log('WASM sql/format result:', resFmt);
  if (resFmt.code !== 0 || !resFmt.data) {
    throw new Error(`In-memory sql/format failed: ${JSON.stringify(resFmt)}`);
  }
  if (!resFmt.data.formatted.includes("SELECT") || !resFmt.data.formatted.includes("FROM") || !resFmt.data.formatted.includes("WHERE")) {
    throw new Error(`Keywords not uppercased: ${resFmt.data.formatted}`);
  }
  if (resFmt.data.stats.lineCount <= 1) {
    throw new Error(`Expected multiline formatted SQL, got ${resFmt.data.stats.lineCount} lines`);
  }
  console.log('✅ In-memory sql/format passed!');

  // Test 1.2: sql/minify
  const resMin = runWasm({
    action: 'sql/minify',
    params: {
      sql: "-- Fetch all orders\nSELECT u.id, u.name /* user details */\nFROM users u\nWHERE u.active = 1;"
    }
  });

  console.log('WASM sql/minify result:', resMin);
  if (resMin.code !== 0 || !resMin.data) {
    throw new Error(`In-memory sql/minify failed: ${JSON.stringify(resMin)}`);
  }
  if (resMin.data.minified.includes("--") || resMin.data.minified.includes("/*") || resMin.data.minified.includes("\n")) {
    throw new Error(`Minified SQL still contains comments or newlines: ${resMin.data.minified}`);
  }
  if (!resMin.data.minified.includes("SELECT u.id, u.name FROM users u WHERE u.active = 1;")) {
    throw new Error(`Unexpected minified result: ${resMin.data.minified}`);
  }
  console.log('✅ In-memory sql/minify passed!');

  // Test 1.3: sql/sample
  const resSample = runWasm({
    action: 'sql/sample',
    params: {}
  });
  if (resSample.code !== 0 || !resSample.data?.sampleSql || !resSample.data?.formatted) {
    throw new Error(`In-memory sample failed: ${JSON.stringify(resSample)}`);
  }
  console.log('✅ In-memory sql/sample passed!');

  // 2. HTTP Backend Verification
  const baseUrl = 'http://localhost:3000';

  // Sample API
  const sampleResp = await fetch(`${baseUrl}/api/backend/sql/sample`);
  if (!sampleResp.ok) throw new Error(`GET /api/backend/sql/sample failed: ${sampleResp.status}`);
  const sampleData = await sampleResp.json();
  if (!sampleData.sampleSql) throw new Error('sampleSql missing from API response');
  console.log('✅ Backend Sample API Response received');

  // Convert API JSON Format
  const fmtResp = await fetch(`${baseUrl}/api/backend/sql/format`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: "format",
      sql: "select a, b from table_test where a > 10;",
      indent: 4,
      uppercase: true
    })
  });
  if (!fmtResp.ok) throw new Error(`POST /api/backend/sql/format JSON Format failed`);
  const fmtData = await fmtResp.json();
  if (fmtData.code !== 0 || !fmtData.data.formatted.includes("SELECT")) {
    throw new Error(`Backend JSON Format failed: ${JSON.stringify(fmtData)}`);
  }
  console.log('✅ Backend API JSON Format passed!');

  // Convert API JSON Minify
  const minResp = await fetch(`${baseUrl}/api/backend/sql/format`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: "minify",
      sql: "-- leading comment\nSELECT * FROM test_users; /* trailing */"
    })
  });
  if (!minResp.ok) throw new Error(`POST /api/backend/sql/format JSON Minify failed`);
  const minData = await minResp.json();
  if (minData.code !== 0 || minData.data.minified !== "SELECT * FROM test_users;") {
    throw new Error(`Backend JSON Minify failed: ${JSON.stringify(minData)}`);
  }
  console.log('✅ Backend API JSON Minify passed!');

  // Convert API HTMX
  const htmxResp = await fetch(`${baseUrl}/api/backend/sql/format`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'HX-Request': 'true'
    },
    body: new URLSearchParams({
      mode: "format",
      sql: "select name, email from customers where active = true;",
      indent: "2",
      uppercase: "true"
    }).toString()
  });

  if (!htmxResp.ok) throw new Error(`POST /api/backend/sql/format HTMX failed`);
  const htmxHtml = await htmxResp.text();
  if (!htmxHtml.includes('SQL 关键词排版美化成功') || !htmxHtml.includes('SELECT') || !htmxHtml.includes('customers')) {
    throw new Error(`Unexpected HTMX HTML output: ${htmxHtml}`);
  }
  console.log('✅ Backend API HTMX POST passed!');

  // 3. Stats Verification
  const statsResp = await fetch(`${baseUrl}/api/stats`);
  const stats = await statsResp.json();
  if (!stats.sqlPrettify || stats.sqlPrettify.sizeBytes <= 0) {
    throw new Error(`Stats missing sqlPrettify info: ${JSON.stringify(stats)}`);
  }
  console.log(`✅ System Stats verified: ${stats.sqlPrettify.file} (${stats.sqlPrettify.sizeFormatted})`);

  console.log('\n🎉 ALL CHECKS PASSED: Tool #33 sql-prettify verified on Dual Runtime!');
}

verifySqlPrettify().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
