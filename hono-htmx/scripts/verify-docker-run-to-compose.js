import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyDockerRunToCompose() {
  console.log('🚀 [Verification] Testing Tool #42: docker-run-to-compose (Dual Runtime)');

  // 1. In-memory WASM Verification
  const wasmPath = path.resolve(__dirname, '../public/wasm/docker-run-to-compose.wasm');
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

  // Test 1.1: docker/samples
  const resSamples = runWasm({
    action: 'docker/samples',
    params: {}
  });
  console.log('WASM docker/samples count:', resSamples.data?.samples?.length);
  if (resSamples.code !== 0 || !resSamples.data?.samples || resSamples.data.samples.length < 5) {
    throw new Error(`In-memory docker/samples failed: ${JSON.stringify(resSamples)}`);
  }
  console.log('✅ In-memory docker/samples passed!');

  // Test 1.2: docker/to-compose with complex Redis command
  const redisCmd = `docker run -d --name redis-server \\
  -p 6379:6379 \\
  -v /data/redis:/data \\
  -e REDIS_PASSWORD=secret \\
  --restart always \\
  redis:7-alpine redis-server --appendonly yes`;

  const resRedis = runWasm({
    action: 'docker/to-compose',
    params: {
      command: redisCmd,
      composeVersion: '3.8'
    }
  });

  if (resRedis.code !== 0 || !resRedis.data) {
    throw new Error(`In-memory docker/to-compose failed: ${JSON.stringify(resRedis)}`);
  }
  const d = resRedis.data;
  if (d.details.service_name !== 'redis-server' || d.details.image !== 'redis:7-alpine') {
    throw new Error(`Unexpected details: ${JSON.stringify(d.details)}`);
  }
  if (!d.compose_yaml.includes("version: '3.8'") || !d.compose_yaml.includes("image: redis:7-alpine")) {
    throw new Error(`YAML missing expected tokens: ${d.compose_yaml}`);
  }
  console.log('✅ In-memory docker/to-compose passed! Generated YAML:\n' + d.compose_yaml.trim());

  // 2. Backend HTTP Verification
  console.log('🌐 Testing Hono Backend HTTP API...');
  const baseUrl = 'http://localhost:3000';

  // Test 2.1: GET /api/backend/docker/samples
  const httpSamples = await fetch(`${baseUrl}/api/backend/docker/samples`);
  if (!httpSamples.ok) {
    throw new Error(`HTTP GET /api/backend/docker/samples failed: ${httpSamples.status}`);
  }
  const samplesJson = await httpSamples.json();
  if (!samplesJson.samples || samplesJson.samples.length < 5) {
    throw new Error(`Backend samples response invalid: ${JSON.stringify(samplesJson)}`);
  }
  console.log(`✅ HTTP GET /api/backend/docker/samples passed! (${samplesJson.samples.length} samples)`);

  // Test 2.2: POST /api/backend/docker/to-compose (JSON)
  const httpConvert = await fetch(`${baseUrl}/api/backend/docker/to-compose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      command: 'docker run -d --name my-nginx -p 8080:80 nginx:alpine',
      composeVersion: '3.8'
    })
  });
  if (!httpConvert.ok) {
    throw new Error(`HTTP POST /api/backend/docker/to-compose failed: ${httpConvert.status}`);
  }
  const convertJson = await httpConvert.json();
  if (convertJson.code !== 0 || !convertJson.data.compose_yaml.includes('nginx:alpine')) {
    throw new Error(`Backend convert response invalid: ${JSON.stringify(convertJson)}`);
  }
  console.log('✅ HTTP POST /api/backend/docker/to-compose (JSON) passed!');

  // Test 2.3: POST /api/backend/docker/to-compose (HTMX HTML)
  const httpHtmx = await fetch(`${baseUrl}/api/backend/docker/to-compose`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'HX-Request': 'true'
    },
    body: 'command=docker+run+-d+-p+5432%3A5432+postgres%3A16'
  });
  if (!httpHtmx.ok) {
    throw new Error(`HTMX POST /api/backend/docker/to-compose failed: ${httpHtmx.status}`);
  }
  const htmxHtml = await httpHtmx.text();
  if (!htmxHtml.includes('Docker Compose YAML 生成完成') || !htmxHtml.includes('postgres:16')) {
    throw new Error(`Unexpected HTMX output: ${htmxHtml}`);
  }
  console.log('✅ HTTP POST /api/backend/docker/to-compose (HTMX) passed!');

  // Test 2.4: Check /api/stats
  const httpStats = await fetch(`${baseUrl}/api/stats`);
  const statsJson = await httpStats.json();
  if (!statsJson.dockerRunToCompose || statsJson.dockerRunToCompose.sizeBytes <= 0) {
    throw new Error(`/api/stats missing dockerRunToCompose: ${JSON.stringify(statsJson)}`);
  }
  console.log(`✅ /api/stats includes dockerRunToCompose (${statsJson.dockerRunToCompose.sizeFormatted})`);

  console.log('\n🎉 [SUCCESS] Tool #42 docker-run-to-compose dual runtime verification passed completely!');
}

verifyDockerRunToCompose().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
