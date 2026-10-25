import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyYamlViewer() {
  console.log('🚀 [Verification] Testing Tool #37: yaml-viewer (Dual Runtime)');

  // 1. In-memory WASM Verification
  const wasmPath = path.resolve(__dirname, '../public/wasm/yaml-viewer.wasm');
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

  const testYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: wasmforge-gateway
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: edge
          image: wasmforge:1.0
---
apiVersion: v1
kind: Service
metadata:
  name: wasmforge-svc
spec:
  type: ClusterIP
`;

  // Test 1.1: yaml/inspect
  const resInspect = runWasm({
    action: 'yaml/inspect',
    params: {
      yaml: testYaml
    }
  });

  console.log('WASM yaml/inspect result stats:', resInspect.data?.stats);
  if (resInspect.code !== 0 || !resInspect.data) {
    throw new Error(`In-memory yaml/inspect failed: ${JSON.stringify(resInspect)}`);
  }
  if (resInspect.data.documentCount !== 2) {
    throw new Error(`Expected 2 documents, got ${resInspect.data.documentCount}`);
  }
  if (resInspect.data.stats.totalNodes < 10) {
    throw new Error(`Unexpected node count: ${resInspect.data.stats.totalNodes}`);
  }
  if (resInspect.data.stats.maxDepth < 3) {
    throw new Error(`Expected max depth >= 3, got ${resInspect.data.stats.maxDepth}`);
  }
  console.log('✅ In-memory yaml/inspect passed!');

  // Test 1.2: yaml/query
  const resQuery = runWasm({
    action: 'yaml/query',
    params: {
      yaml: testYaml,
      query: 'ClusterIP'
    }
  });

  console.log('WASM yaml/query result:', resQuery.data);
  if (resQuery.code !== 0 || !resQuery.data) {
    throw new Error(`In-memory yaml/query failed: ${JSON.stringify(resQuery)}`);
  }
  if (resQuery.data.matchCount === 0 || !resQuery.data.matches.some(m => m.preview.includes('ClusterIP'))) {
    throw new Error(`Query for 'ClusterIP' did not return expected match: ${JSON.stringify(resQuery.data)}`);
  }
  console.log('✅ In-memory yaml/query passed!');

  // Test 1.3: yaml/sample
  const resSample = runWasm({
    action: 'yaml/sample',
    params: {}
  });

  if (resSample.code !== 0 || !resSample.data?.sampleYaml) {
    throw new Error(`In-memory yaml/sample failed: ${JSON.stringify(resSample)}`);
  }
  console.log('✅ In-memory yaml/sample passed!');

  // 2. HTTP Backend Verification
  const baseUrl = 'http://localhost:3000';

  // Test 2.1: GET /api/backend/yaml/viewer-sample
  const sampleRes = await fetch(`${baseUrl}/api/backend/yaml/viewer-sample`);
  if (!sampleRes.ok) {
    throw new Error(`GET /api/backend/yaml/viewer-sample failed: ${sampleRes.status}`);
  }
  const sampleData = await sampleRes.json();
  if (!sampleData.sampleYaml) {
    throw new Error(`Invalid sample response: ${JSON.stringify(sampleData)}`);
  }
  console.log('✅ Backend GET /api/backend/yaml/viewer-sample passed!');

  // Test 2.2: POST /api/backend/yaml/view (JSON payload - inspect mode)
  const apiInspectRes = await fetch(`${baseUrl}/api/backend/yaml/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'inspect',
      yaml: testYaml
    })
  });
  if (!apiInspectRes.ok) {
    throw new Error(`POST /api/backend/yaml/view (JSON) failed: ${apiInspectRes.status}`);
  }
  const apiInspectData = await apiInspectRes.json();
  if (apiInspectData.code !== 0 || !apiInspectData.data?.stats) {
    throw new Error(`Unexpected backend inspect response: ${JSON.stringify(apiInspectData)}`);
  }
  console.log('✅ Backend POST /api/backend/yaml/view (JSON inspect) passed!');

  // Test 2.3: POST /api/backend/yaml/view (JSON payload - query mode)
  const apiQueryRes = await fetch(`${baseUrl}/api/backend/yaml/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'query',
      yaml: testYaml,
      query: 'wasmforge-gateway'
    })
  });
  if (!apiQueryRes.ok) {
    throw new Error(`POST /api/backend/yaml/view (JSON query) failed: ${apiQueryRes.status}`);
  }
  const apiQueryData = await apiQueryRes.json();
  if (apiQueryData.code !== 0 || apiQueryData.data.matchCount === 0) {
    throw new Error(`Backend query returned 0 matches: ${JSON.stringify(apiQueryData)}`);
  }
  console.log('✅ Backend POST /api/backend/yaml/view (JSON query) passed!');

  // Test 2.4: POST /api/backend/yaml/view (HTMX form)
  const formInspectRes = await fetch(`${baseUrl}/api/backend/yaml/view`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'HX-Request': 'true'
    },
    body: new URLSearchParams({
      mode: 'inspect',
      yaml: testYaml
    }).toString()
  });
  if (!formInspectRes.ok) {
    throw new Error(`POST /api/backend/yaml/view (HTMX form) failed: ${formInspectRes.status}`);
  }
  const formHtml = await formInspectRes.text();
  if (!formHtml.includes('Rust WASM: YAML 树状层级探针解析成功') || !formHtml.includes('总节点数:')) {
    throw new Error(`Unexpected HTMX output: ${formHtml}`);
  }
  console.log('✅ Backend POST /api/backend/yaml/view (HTMX inspect) passed!');

  // Test 2.5: GET /api/stats
  const statsRes = await fetch(`${baseUrl}/api/stats`);
  const stats = await statsRes.json();
  if (!stats.yamlViewer || stats.yamlViewer.sizeBytes <= 0) {
    throw new Error(`Invalid stats for yamlViewer: ${JSON.stringify(stats.yamlViewer)}`);
  }
  console.log(`✅ Stats check passed: yamlViewer is ${stats.yamlViewer.sizeFormatted}`);

  console.log('🎉 [Success] All Tool #37: yaml-viewer verification tests passed cleanly!');
}

verifyYamlViewer().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
