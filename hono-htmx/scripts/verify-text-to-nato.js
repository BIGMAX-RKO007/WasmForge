import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyTextToNato() {
  console.log('🚀 [Verification] Testing Tool #32: text-to-nato (Dual Runtime)');

  // 1. In-memory WASM Verification
  const wasmPath = path.resolve(__dirname, '../public/wasm/text-to-nato.wasm');
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

  // Test 1.1: nato/encode
  const resEnc = runWasm({
    action: 'nato/encode',
    params: {
      text: "WASM 2026",
      delimiter: " "
    }
  });

  console.log('WASM nato/encode result:', resEnc);
  if (resEnc.code !== 0 || !resEnc.data) {
    throw new Error(`In-memory encode failed: ${JSON.stringify(resEnc)}`);
  }
  if (resEnc.data.encoded !== "Whiskey Alfa Sierra Mike [Space] Two Zero Two Six") {
    throw new Error(`Unexpected encoded NATO text: ${resEnc.data.encoded}`);
  }
  if (resEnc.data.stats.letters !== 4 || resEnc.data.stats.digits !== 4 || resEnc.data.stats.spaces !== 1) {
    throw new Error(`Unexpected encode stats: ${JSON.stringify(resEnc.data.stats)}`);
  }
  console.log('✅ In-memory nato/encode passed!');

  // Test 1.2: nato/decode
  const resDec = runWasm({
    action: 'nato/decode',
    params: {
      text: "Sierra Oscar Sierra [Space] One Zero Zero"
    }
  });

  console.log('WASM nato/decode result:', resDec);
  if (resDec.code !== 0 || !resDec.data) {
    throw new Error(`In-memory decode failed: ${JSON.stringify(resDec)}`);
  }
  if (resDec.data.decoded !== "SOS 100") {
    throw new Error(`Unexpected decoded text: ${resDec.data.decoded}`);
  }
  if (resDec.data.stats.recognized !== 7) {
    throw new Error(`Unexpected decode stats: ${JSON.stringify(resDec.data.stats)}`);
  }
  console.log('✅ In-memory nato/decode passed!');

  // Test 1.3: nato/sample
  const resSample = runWasm({
    action: 'nato/sample',
    params: {}
  });
  if (resSample.code !== 0 || !resSample.data?.sampleText || !resSample.data?.sampleNato) {
    throw new Error(`In-memory sample failed: ${JSON.stringify(resSample)}`);
  }
  console.log('✅ In-memory nato/sample passed!');

  // 2. HTTP Backend Verification
  const baseUrl = 'http://localhost:3000';

  // Sample API
  const sampleResp = await fetch(`${baseUrl}/api/backend/nato/sample`);
  if (!sampleResp.ok) throw new Error(`GET /api/backend/nato/sample failed: ${sampleResp.status}`);
  const sampleData = await sampleResp.json();
  if (!sampleData.sampleText) throw new Error('sampleText missing from API response');
  console.log('✅ Backend Sample API Response received');

  // Convert API JSON Encode
  const encResp = await fetch(`${baseUrl}/api/backend/nato/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: "encode",
      text: "ANTIGRAVITY",
      delimiter: " - "
    })
  });
  if (!encResp.ok) throw new Error(`POST /api/backend/nato/convert JSON Encode failed`);
  const encData = await encResp.json();
  if (encData.code !== 0 || !encData.data.encoded.includes("Alfa - November - Tango")) {
    throw new Error(`Backend JSON Encode failed: ${JSON.stringify(encData)}`);
  }
  console.log('✅ Backend API JSON Encode passed!');

  // Convert API JSON Decode
  const decResp = await fetch(`${baseUrl}/api/backend/nato/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: "decode",
      text: "Alfa Bravo Charlie"
    })
  });
  if (!decResp.ok) throw new Error(`POST /api/backend/nato/convert JSON Decode failed`);
  const decData = await decResp.json();
  if (decData.code !== 0 || decData.data.decoded !== "ABC") {
    throw new Error(`Backend JSON Decode failed: ${JSON.stringify(decData)}`);
  }
  console.log('✅ Backend API JSON Decode passed!');

  // Convert API HTMX
  const htmxResp = await fetch(`${baseUrl}/api/backend/nato/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'HX-Request': 'true'
    },
    body: new URLSearchParams({
      mode: "encode",
      text: "DELTA 9",
      delimiter: " "
    }).toString()
  });

  if (!htmxResp.ok) throw new Error(`POST /api/backend/nato/convert HTMX failed`);
  const htmxHtml = await htmxResp.text();
  if (!htmxHtml.includes('北约字母拼读音标转换成功') || !htmxHtml.includes('Delta') || !htmxHtml.includes('Nine')) {
    throw new Error(`Unexpected HTMX HTML output: ${htmxHtml}`);
  }
  console.log('✅ Backend API HTMX POST passed!');

  // 3. Stats Verification
  const statsResp = await fetch(`${baseUrl}/api/stats`);
  const stats = await statsResp.json();
  if (!stats.textToNato || stats.textToNato.sizeBytes <= 0) {
    throw new Error(`Stats missing textToNato info: ${JSON.stringify(stats)}`);
  }
  console.log(`✅ System Stats verified: ${stats.textToNato.file} (${stats.textToNato.sizeFormatted})`);

  console.log('\n🎉 ALL CHECKS PASSED: Tool #32 text-to-nato verified on Dual Runtime!');
}

verifyTextToNato().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
