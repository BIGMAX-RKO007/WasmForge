import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyMarkdownToHtml() {
  console.log('🚀 [Verification] Testing Tool #30: markdown-to-html (Dual Runtime)');

  // 1. In-memory WASM Verification
  const wasmPath = path.resolve(__dirname, '../public/wasm/markdown-to-html.wasm');
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

  // Test 1.1: CommonMark Basic & Formatting
  const res1 = runWasm({
    action: 'markdown/render',
    params: { markdown: '# Title\n\nThis is **bold** text and [WasmForge](https://github.com).' }
  });
  console.log('WASM render basic result:', res1);
  if (res1.code !== 0 || !res1.data) {
    throw new Error(`In-memory test 1 failed: ${JSON.stringify(res1)}`);
  }
  if (!res1.data.html.includes('<h1>Title</h1>') || !res1.data.html.includes('<strong>bold</strong>') || !res1.data.html.includes('href="https://github.com"')) {
    throw new Error(`Unexpected HTML output: ${res1.data.html}`);
  }
  if (res1.data.stats.headingsCount !== 1 || res1.data.stats.linksCount !== 1) {
    throw new Error(`Unexpected stats: ${JSON.stringify(res1.data.stats)}`);
  }
  console.log('✅ In-memory CommonMark basic rendering & stats passed!');

  // Test 1.2: GFM Tables and Tasklists
  const res2 = runWasm({
    action: 'markdown/render',
    params: {
      markdown: '| Item | Quantity |\n| :--- | :--- |\n| WASM | 100 |\n\n- [x] Task Done\n- [ ] Task Pending',
      enableTables: true,
      enableTasklists: true
    }
  });
  if (!res2.data.html.includes('<table>') || !res2.data.html.includes('disabled="" type="checkbox"')) {
    throw new Error(`In-memory GFM Table/Tasklist failed: ${res2.data.html}`);
  }
  console.log('✅ In-memory GFM Tables & Tasklists passed!');

  // 2. HTTP Backend Verification
  const baseUrl = 'http://localhost:3000';

  // Sample API
  const sampleResp = await fetch(`${baseUrl}/api/backend/markdown/sample`);
  if (!sampleResp.ok) throw new Error(`GET /api/backend/markdown/sample failed`);
  const sampleData = await sampleResp.json();
  console.log('✅ Sample API Response received');

  // Render API JSON
  const renderResp = await fetch(`${baseUrl}/api/backend/markdown/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ markdown: '## Subheading\n\n`code block`' })
  });
  if (!renderResp.ok) throw new Error(`POST /api/backend/markdown/render JSON failed`);
  const renderData = await renderResp.json();
  if (renderData.code !== 0 || !renderData.data.html.includes('<h2>Subheading</h2>')) {
    throw new Error(`Backend render failed: ${JSON.stringify(renderData)}`);
  }
  console.log('✅ Backend API Render JSON passed!');

  // Render API HTMX
  const htmxResp = await fetch(`${baseUrl}/api/backend/markdown/render`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'HX-Request': 'true'
    },
    body: new URLSearchParams({ markdown: '# Hono HTMX Live Markdown\n\nTested successfully.' }).toString()
  });
  if (!htmxResp.ok) throw new Error(`POST /api/backend/markdown/render HTMX failed`);
  const htmxHtml = await htmxResp.text();
  if (!htmxHtml.includes('pulldown-cmark 极速渲染成功') || !htmxHtml.includes('Hono HTMX Live Markdown')) {
    throw new Error(`HTMX response missing expected fragments: ${htmxHtml.slice(0, 200)}`);
  }
  console.log('✅ Backend API HTMX Form handling passed!');

  // Stats API
  const statsResp = await fetch(`${baseUrl}/api/stats`);
  const stats = await statsResp.json();
  if (!stats.markdownToHtml || stats.markdownToHtml.sizeBytes <= 0) {
    throw new Error(`Stats missing markdownToHtml: ${JSON.stringify(stats)}`);
  }
  console.log(`✅ Stats API includes markdownToHtml: ${stats.markdownToHtml.sizeFormatted}`);

  console.log('🎉 [Success] Tool #30 (markdown-to-html) dual-runtime verification fully passed!');
}

verifyMarkdownToHtml().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
