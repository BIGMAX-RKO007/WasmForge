import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyChmodCalculator() {
  console.log('🚀 [Verification] Testing Tool #41: chmod-calculator (Dual Runtime)');

  // 1. In-memory WASM Verification
  const wasmPath = path.resolve(__dirname, '../public/wasm/chmod-calculator.wasm');
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

  // Test 1.1: chmod/presets
  const resPresets = runWasm({
    action: 'chmod/presets',
    params: {}
  });
  console.log('WASM chmod/presets count:', resPresets.data?.presets?.length);
  if (resPresets.code !== 0 || !resPresets.data?.presets || resPresets.data.presets.length < 8) {
    throw new Error(`In-memory chmod/presets failed: ${JSON.stringify(resPresets)}`);
  }
  console.log('✅ In-memory chmod/presets passed!');

  // Test 1.2: chmod/calculate with octal 755
  const res755 = runWasm({
    action: 'chmod/calculate',
    params: {
      octal: '755',
      umask: '022'
    }
  });
  if (res755.code !== 0 || !res755.data) {
    throw new Error(`In-memory chmod/calculate 755 failed: ${JSON.stringify(res755)}`);
  }
  const d755 = res755.data;
  if (d755.octal3 !== '755' || d755.symbolic9 !== 'rwxr-xr-x' || !d755.bits.user.read || !d755.bits.user.execute) {
    throw new Error(`Unexpected 755 breakdown: ${JSON.stringify(d755)}`);
  }
  if (!d755.umask_effect || d755.umask_effect.file_mode_octal !== '644') {
    throw new Error(`Unexpected umask calculation: ${JSON.stringify(d755.umask_effect)}`);
  }
  console.log(`✅ In-memory chmod/calculate 755 passed! (${d755.symbolic10})`);

  // Test 1.3: chmod/calculate with SUID + bits
  const resSuid = runWasm({
    action: 'chmod/calculate',
    params: {
      octal: '4755'
    }
  });
  if (resSuid.code !== 0 || resSuid.data.symbolic9 !== 'rwsr-xr-x' || !resSuid.data.bits.special.suid) {
    throw new Error(`SUID calculation failed: ${JSON.stringify(resSuid)}`);
  }
  console.log(`✅ In-memory chmod/calculate SUID 4755 passed! (${resSuid.data.symbolic9})`);

  // Test 1.4: chmod/calculate with high-risk 777
  const res777 = runWasm({
    action: 'chmod/calculate',
    params: {
      symbolic: 'rwxrwxrwx'
    }
  });
  if (res777.code !== 0 || res777.data.octal3 !== '777' || res777.data.security_notes.length === 0) {
    throw new Error(`777 security warnings missing: ${JSON.stringify(res777)}`);
  }
  console.log(`✅ In-memory chmod/calculate 777 security audit passed! Warnings: ${res777.data.security_notes.length}`);

  // 2. Backend HTTP Verification
  console.log('🌐 Testing Hono Backend HTTP API...');
  const baseUrl = 'http://localhost:3000';

  // Test 2.1: GET /api/backend/chmod/presets
  const httpPresets = await fetch(`${baseUrl}/api/backend/chmod/presets`);
  if (!httpPresets.ok) {
    throw new Error(`HTTP GET /api/backend/chmod/presets failed: ${httpPresets.status}`);
  }
  const presetsJson = await httpPresets.json();
  if (!presetsJson.presets || presetsJson.presets.length < 8) {
    throw new Error(`Backend presets response invalid: ${JSON.stringify(presetsJson)}`);
  }
  console.log(`✅ HTTP GET /api/backend/chmod/presets passed! (${presetsJson.presets.length} presets)`);

  // Test 2.2: POST /api/backend/chmod/calculate (JSON)
  const httpCalc = await fetch(`${baseUrl}/api/backend/chmod/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      octal: '600'
    })
  });
  if (!httpCalc.ok) {
    throw new Error(`HTTP POST /api/backend/chmod/calculate failed: ${httpCalc.status}`);
  }
  const calcJson = await httpCalc.json();
  if (calcJson.code !== 0 || calcJson.data.symbolic9 !== 'rw-------') {
    throw new Error(`Backend calculate response invalid: ${JSON.stringify(calcJson)}`);
  }
  console.log(`✅ HTTP POST /api/backend/chmod/calculate (JSON) passed! 600 -> ${calcJson.data.symbolic9}`);

  // Test 2.3: POST /api/backend/chmod/calculate (HTMX HTML)
  const httpHtmx = await fetch(`${baseUrl}/api/backend/chmod/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'HX-Request': 'true'
    },
    body: 'octal=755&u_r=on&u_w=on&u_x=on&g_r=on&g_x=on&o_r=on&o_x=on'
  });
  if (!httpHtmx.ok) {
    throw new Error(`HTMX POST /api/backend/chmod/calculate failed: ${httpHtmx.status}`);
  }
  const htmxHtml = await httpHtmx.text();
  if (!htmxHtml.includes('Linux Chmod 权限计算成功') || !htmxHtml.includes('rwxr-xr-x')) {
    throw new Error(`Unexpected HTMX output: ${htmxHtml}`);
  }
  console.log('✅ HTTP POST /api/backend/chmod/calculate (HTMX) passed!');

  // Test 2.4: Check /api/stats
  const httpStats = await fetch(`${baseUrl}/api/stats`);
  const statsJson = await httpStats.json();
  if (!statsJson.chmodCalculator || statsJson.chmodCalculator.sizeBytes <= 0) {
    throw new Error(`/api/stats missing chmodCalculator: ${JSON.stringify(statsJson)}`);
  }
  console.log(`✅ /api/stats includes chmodCalculator (${statsJson.chmodCalculator.sizeFormatted})`);

  console.log('\n🎉 [SUCCESS] Tool #41 chmod-calculator dual runtime verification passed completely!');
}

verifyChmodCalculator().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
