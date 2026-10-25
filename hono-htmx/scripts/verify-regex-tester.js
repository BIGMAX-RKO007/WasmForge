import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyRegexTester() {
  console.log('🚀 [Verification] Testing Tool #38: regex-tester (Dual Runtime)');

  // 1. In-memory WASM Verification
  const wasmPath = path.resolve(__dirname, '../public/wasm/regex-tester.wasm');
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

  const testPattern = "(?P<user>[a-zA-Z0-9_.+-]+)@(?P<domain>[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+)";
  const testText = "Email us at support@wasmforge.dev or admin@corp.net for details.";

  // Test 1.1: regex/test
  const resTest = runWasm({
    action: 'regex/test',
    params: {
      pattern: testPattern,
      text: testText,
      flags: { caseInsensitive: true }
    }
  });

  console.log('WASM regex/test result matchCount:', resTest.data?.matchCount);
  if (resTest.code !== 0 || !resTest.data) {
    throw new Error(`In-memory regex/test failed: ${JSON.stringify(resTest)}`);
  }
  if (!resTest.data.isMatch || resTest.data.matchCount !== 2) {
    throw new Error(`Expected 2 matches, got ${resTest.data.matchCount}`);
  }
  const firstMatch = resTest.data.matches[0];
  if (!firstMatch.captures.some(c => c.name === 'user' && c.text === 'support')) {
    throw new Error(`Expected capture group user='support', got: ${JSON.stringify(firstMatch.captures)}`);
  }
  console.log('✅ In-memory regex/test passed!');

  // Test 1.2: regex/replace
  const resReplace = runWasm({
    action: 'regex/replace',
    params: {
      pattern: testPattern,
      text: testText,
      replacement: "[PROTECTED]",
      replaceAll: true
    }
  });

  console.log('WASM regex/replace result:', resReplace.data);
  if (resReplace.code !== 0 || !resReplace.data) {
    throw new Error(`In-memory regex/replace failed: ${JSON.stringify(resReplace)}`);
  }
  if (resReplace.data.replacementsMade !== 2) {
    throw new Error(`Expected 2 replacements, got ${resReplace.data.replacementsMade}`);
  }
  if (!resReplace.data.result.includes("[PROTECTED]")) {
    throw new Error(`Replacement text missing in result: ${resReplace.data.result}`);
  }
  console.log('✅ In-memory regex/replace passed!');

  // Test 1.3: regex/sample
  const resSample = runWasm({
    action: 'regex/sample',
    params: {}
  });

  if (resSample.code !== 0 || !resSample.data?.samples || resSample.data.samples.length < 3) {
    throw new Error(`In-memory regex/sample failed: ${JSON.stringify(resSample)}`);
  }
  console.log('✅ In-memory regex/sample passed!');

  // 2. HTTP Backend Verification
  const baseUrl = 'http://localhost:3000';

  // Test 2.1: GET /api/backend/regex/samples
  const sampleRes = await fetch(`${baseUrl}/api/backend/regex/samples`);
  if (!sampleRes.ok) {
    throw new Error(`GET /api/backend/regex/samples failed: ${sampleRes.status}`);
  }
  const sampleData = await sampleRes.json();
  if (!sampleData.samples || sampleData.samples.length === 0) {
    throw new Error(`Invalid sample response: ${JSON.stringify(sampleData)}`);
  }
  console.log('✅ Backend GET /api/backend/regex/samples passed!');

  // Test 2.2: POST /api/backend/regex/test (JSON payload - test mode)
  const apiTestRes = await fetch(`${baseUrl}/api/backend/regex/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'test',
      pattern: testPattern,
      text: testText
    })
  });
  if (!apiTestRes.ok) {
    throw new Error(`POST /api/backend/regex/test (JSON test) failed: ${apiTestRes.status}`);
  }
  const apiTestData = await apiTestRes.json();
  if (apiTestData.code !== 0 || !apiTestData.data?.isMatch) {
    throw new Error(`Unexpected backend test response: ${JSON.stringify(apiTestData)}`);
  }
  console.log('✅ Backend POST /api/backend/regex/test (JSON test) passed!');

  // Test 2.3: POST /api/backend/regex/test (JSON payload - replace mode)
  const apiReplaceRes = await fetch(`${baseUrl}/api/backend/regex/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'replace',
      pattern: testPattern,
      text: testText,
      replacement: "contact@hidden",
      replaceAll: true
    })
  });
  if (!apiReplaceRes.ok) {
    throw new Error(`POST /api/backend/regex/test (JSON replace) failed: ${apiReplaceRes.status}`);
  }
  const apiReplaceData = await apiReplaceRes.json();
  if (apiReplaceData.code !== 0 || apiReplaceData.data.replacementsMade !== 2) {
    throw new Error(`Backend replace failed: ${JSON.stringify(apiReplaceData)}`);
  }
  console.log('✅ Backend POST /api/backend/regex/test (JSON replace) passed!');

  // Test 2.4: POST /api/backend/regex/test (HTMX form)
  const formTestRes = await fetch(`${baseUrl}/api/backend/regex/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'HX-Request': 'true'
    },
    body: new URLSearchParams({
      mode: 'test',
      pattern: testPattern,
      text: testText
    }).toString()
  });
  if (!formTestRes.ok) {
    throw new Error(`POST /api/backend/regex/test (HTMX form) failed: ${formTestRes.status}`);
  }
  const formHtml = await formTestRes.text();
  if (!formHtml.includes('Rust WASM: 正则匹配成功') || !formHtml.includes('MATCHED')) {
    throw new Error(`Unexpected HTMX output: ${formHtml}`);
  }
  console.log('✅ Backend POST /api/backend/regex/test (HTMX test) passed!');

  // Test 2.5: GET /api/stats
  const statsRes = await fetch(`${baseUrl}/api/stats`);
  const stats = await statsRes.json();
  if (!stats.regexTester || stats.regexTester.sizeBytes <= 0) {
    throw new Error(`Invalid stats for regexTester: ${JSON.stringify(stats.regexTester)}`);
  }
  console.log(`✅ Stats check passed: regexTester is ${stats.regexTester.sizeFormatted}`);

  console.log('🎉 [Success] All Tool #38: regex-tester verification tests passed cleanly!');
}

verifyRegexTester().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
