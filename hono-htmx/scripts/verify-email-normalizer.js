import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyEmailNormalizer() {
  console.log('🚀 [Verification] Testing Tool #43: email-normalizer (Dual Runtime)');

  // 1. In-memory WASM Verification
  const wasmPath = path.resolve(__dirname, '../public/wasm/email-normalizer.wasm');
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

  // Test 1.1: email/samples
  const resSamples = runWasm({
    action: 'email/samples',
    params: {}
  });
  console.log('WASM email/samples count:', resSamples.data?.samples?.length);
  if (resSamples.code !== 0 || !resSamples.data?.samples || resSamples.data.samples.length < 5) {
    throw new Error(`In-memory email/samples failed: ${JSON.stringify(resSamples)}`);
  }
  console.log('✅ In-memory email/samples passed!');

  // Test 1.2: email/normalize with Gmail
  const resGmail = runWasm({
    action: 'email/normalize',
    params: {
      email: 'J.o.h.n.D.o.e+newsletter@GoogleMail.com',
      stripTags: true,
      stripDots: true
    }
  });

  if (resGmail.code !== 0 || !resGmail.data) {
    throw new Error(`In-memory email/normalize failed: ${JSON.stringify(resGmail)}`);
  }
  const dGmail = resGmail.data;
  if (dGmail.normalized !== 'johndoe@gmail.com' || dGmail.tag !== 'newsletter' || !dGmail.stripped_dots || !dGmail.domain_aliased) {
    throw new Error(`Unexpected Gmail normalization: ${JSON.stringify(dGmail)}`);
  }
  console.log(`✅ In-memory email/normalize (Gmail) passed! ${dGmail.original} -> ${dGmail.normalized}`);

  // Test 1.3: email/batch with duplicates
  const batchEmails = [
    'user.test+1@gmail.com',
    'u.s.e.r.test+promo@googlemail.com',
    'usertest@gmail.com',
    'bob+dev@outlook.com'
  ];

  const resBatch = runWasm({
    action: 'email/batch',
    params: {
      emails: batchEmails,
      stripTags: true,
      stripDots: true,
      deduplicate: true
    }
  });

  if (resBatch.code !== 0 || !resBatch.data) {
    throw new Error(`In-memory email/batch failed: ${JSON.stringify(resBatch)}`);
  }
  const b = resBatch.data;
  if (b.total !== 4 || b.unique !== 2 || b.duplicates_removed !== 2) {
    throw new Error(`Unexpected batch counts: total=${b.total}, unique=${b.unique}, dups=${b.duplicates_removed}`);
  }
  console.log(`✅ In-memory email/batch passed! (Total: ${b.total}, Unique: ${b.unique}, Duplicates Removed: ${b.duplicates_removed})`);

  // 2. Backend HTTP Verification
  console.log('🌐 Testing Hono Backend HTTP API...');
  const baseUrl = 'http://localhost:3000';

  // Test 2.1: GET /api/backend/email/samples
  const httpSamples = await fetch(`${baseUrl}/api/backend/email/samples`);
  if (!httpSamples.ok) {
    throw new Error(`HTTP GET /api/backend/email/samples failed: ${httpSamples.status}`);
  }
  const samplesJson = await httpSamples.json();
  if (!samplesJson.samples || samplesJson.samples.length < 5) {
    throw new Error(`Backend samples response invalid: ${JSON.stringify(samplesJson)}`);
  }
  console.log(`✅ HTTP GET /api/backend/email/samples passed! (${samplesJson.samples.length} samples)`);

  // Test 2.2: POST /api/backend/email/normalize (JSON)
  const httpNorm = await fetch(`${baseUrl}/api/backend/email/normalize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'alex-bills@yahoo.com'
    })
  });
  if (!httpNorm.ok) {
    throw new Error(`HTTP POST /api/backend/email/normalize failed: ${httpNorm.status}`);
  }
  const normJson = await httpNorm.json();
  if (normJson.code !== 0 || normJson.data.normalized !== 'alex@yahoo.com' || normJson.data.tag !== 'bills') {
    throw new Error(`Backend normalize response invalid: ${JSON.stringify(normJson)}`);
  }
  console.log('✅ HTTP POST /api/backend/email/normalize (JSON) passed! alex-bills@yahoo.com -> alex@yahoo.com');

  // Test 2.3: POST /api/backend/email/normalize (HTMX HTML)
  const httpHtmx = await fetch(`${baseUrl}/api/backend/email/normalize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'HX-Request': 'true'
    },
    body: 'email=J.o.h.n%2Bnews%40gmail.com&stripTags=on&stripDots=on'
  });
  if (!httpHtmx.ok) {
    throw new Error(`HTMX POST /api/backend/email/normalize failed: ${httpHtmx.status}`);
  }
  const htmxHtml = await httpHtmx.text();
  if (!htmxHtml.includes('邮箱标准化完成') || !htmxHtml.includes('john@gmail.com')) {
    throw new Error(`Unexpected HTMX output: ${htmxHtml}`);
  }
  console.log('✅ HTTP POST /api/backend/email/normalize (HTMX) passed!');

  // Test 2.4: Check /api/stats
  const httpStats = await fetch(`${baseUrl}/api/stats`);
  const statsJson = await httpStats.json();
  if (!statsJson.emailNormalizer || statsJson.emailNormalizer.sizeBytes <= 0) {
    throw new Error(`/api/stats missing emailNormalizer: ${JSON.stringify(statsJson)}`);
  }
  console.log(`✅ /api/stats includes emailNormalizer (${statsJson.emailNormalizer.sizeFormatted})`);

  console.log('\n🎉 [SUCCESS] Tool #43 email-normalizer dual runtime verification passed completely!');
}

verifyEmailNormalizer().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
