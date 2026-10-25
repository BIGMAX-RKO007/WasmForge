import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyCrontabGenerator() {
  console.log('🚀 [Verification] Testing Tool #40: crontab-generator (Dual Runtime)');

  // 1. In-memory WASM Verification
  const wasmPath = path.resolve(__dirname, '../public/wasm/crontab-generator.wasm');
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

  // Test 1.1: cron/presets
  const resPresets = runWasm({
    action: 'cron/presets',
    params: {}
  });

  console.log('WASM cron/presets count:', resPresets.data?.presets?.length);
  if (resPresets.code !== 0 || !resPresets.data?.presets || resPresets.data.presets.length < 6) {
    throw new Error(`In-memory cron/presets failed: ${JSON.stringify(resPresets)}`);
  }
  console.log('✅ In-memory cron/presets passed!');

  // Test 1.2: cron/evaluate
  const refTs = 1761379200; // 2025-10-25 08:00:00 UTC
  const resEval = runWasm({
    action: 'cron/evaluate',
    params: {
      expression: '*/15 9-18 * * 1-5',
      referenceTime: refTs,
      count: 5
    }
  });

  if (resEval.code !== 0 || !resEval.data) {
    throw new Error(`In-memory cron/evaluate failed: ${JSON.stringify(resEval)}`);
  }
  const d = resEval.data;
  if (d.breakdown.minute !== '*/15' || d.breakdown.hour !== '9-18' || d.nextRuns.length !== 5) {
    throw new Error(`Unexpected breakdown or nextRuns count: ${JSON.stringify(d)}`);
  }
  console.log(`✅ In-memory cron/evaluate passed! Translated: "${d.humanZh}" (${d.humanEn})`);
  console.log(`   Next run: ${d.nextRuns[0].utcTime}`);

  // 2. Backend HTTP Verification
  console.log('🌐 Testing Hono Backend HTTP API...');
  const baseUrl = 'http://localhost:3000';

  // Test 2.1: GET /api/backend/cron/presets
  const httpPresets = await fetch(`${baseUrl}/api/backend/cron/presets`);
  if (!httpPresets.ok) {
    throw new Error(`HTTP GET /api/backend/cron/presets failed: ${httpPresets.status}`);
  }
  const presetsJson = await httpPresets.json();
  if (!presetsJson.presets || presetsJson.presets.length < 6) {
    throw new Error(`Backend presets response invalid: ${JSON.stringify(presetsJson)}`);
  }
  console.log(`✅ HTTP GET /api/backend/cron/presets passed! (${presetsJson.presets.length} presets)`);

  // Test 2.2: POST /api/backend/cron/evaluate (JSON)
  const httpEval = await fetch(`${baseUrl}/api/backend/cron/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      expression: '0 0 * * *',
      referenceTime: refTs,
      count: 3
    })
  });
  if (!httpEval.ok) {
    throw new Error(`HTTP POST /api/backend/cron/evaluate failed: ${httpEval.status}`);
  }
  const evalJson = await httpEval.json();
  if (evalJson.code !== 0 || evalJson.data.nextRuns.length !== 3) {
    throw new Error(`Backend evaluate response invalid: ${JSON.stringify(evalJson)}`);
  }
  console.log(`✅ HTTP POST /api/backend/cron/evaluate (JSON) passed! Next runs: ${evalJson.data.nextRuns.length}`);

  // Test 2.3: POST /api/backend/cron/evaluate (HTMX HTML)
  const httpHtmx = await fetch(`${baseUrl}/api/backend/cron/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'HX-Request': 'true'
    },
    body: 'expression=0+9+*+*+1-5&count=4'
  });
  if (!httpHtmx.ok) {
    throw new Error(`HTMX POST /api/backend/cron/evaluate failed: ${httpHtmx.status}`);
  }
  const htmxHtml = await httpHtmx.text();
  if (!htmxHtml.includes('Cron 表达式解析成功') || !htmxHtml.includes('未来 4 次调度触发时序')) {
    throw new Error(`Unexpected HTMX output: ${htmxHtml}`);
  }
  console.log('✅ HTTP POST /api/backend/cron/evaluate (HTMX) passed!');

  // Test 2.4: Check /api/stats
  const httpStats = await fetch(`${baseUrl}/api/stats`);
  const statsJson = await httpStats.json();
  if (!statsJson.crontabGenerator || statsJson.crontabGenerator.sizeBytes <= 0) {
    throw new Error(`/api/stats missing crontabGenerator: ${JSON.stringify(statsJson)}`);
  }
  console.log(`✅ /api/stats includes crontabGenerator (${statsJson.crontabGenerator.sizeFormatted})`);

  console.log('\n🎉 [SUCCESS] Tool #40 crontab-generator dual runtime verification passed completely!');
}

verifyCrontabGenerator().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
