import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyXmlFormatter() {
  console.log('🚀 [Verification] Testing Tool #34: xml-formatter (Dual Runtime)');

  // 1. In-memory WASM Verification
  const wasmPath = path.resolve(__dirname, '../public/wasm/xml-formatter.wasm');
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

  // Test 1.1: xml/format
  const resFmt = runWasm({
    action: 'xml/format',
    params: {
      xml: '<catalog><book id="bk101"><author>Gambardella, Matthew</author><title>XML Developers Guide</title></book></catalog>',
      indent: 2,
      stripComments: false
    }
  });

  console.log('WASM xml/format result:', resFmt);
  if (resFmt.code !== 0 || !resFmt.data) {
    throw new Error(`In-memory xml/format failed: ${JSON.stringify(resFmt)}`);
  }
  if (!resFmt.data.formatted.includes('  <book id="bk101">') || !resFmt.data.formatted.includes('    <author>')) {
    throw new Error(`Indentation missing in formatted XML: ${resFmt.data.formatted}`);
  }
  if (resFmt.data.stats.elementCount !== 4 || resFmt.data.stats.lineCount < 4) {
    throw new Error(`Unexpected stats: ${JSON.stringify(resFmt.data.stats)}`);
  }
  console.log('✅ In-memory xml/format passed!');

  // Test 1.2: xml/minify
  const resMin = runWasm({
    action: 'xml/minify',
    params: {
      xml: '<note>\n  <!-- to whom -->\n  <to>Tove</to>\n  <!-- from whom -->\n  <from>Jani</from>\n</note>',
      stripComments: true
    }
  });

  console.log('WASM xml/minify result:', resMin);
  if (resMin.code !== 0 || !resMin.data) {
    throw new Error(`In-memory xml/minify failed: ${JSON.stringify(resMin)}`);
  }
  if (resMin.data.minified.includes('<!--') || resMin.data.minified.includes('\n')) {
    throw new Error(`Minified XML contains comments or newlines: ${resMin.data.minified}`);
  }
  if (resMin.data.minified !== '<note><to>Tove</to><from>Jani</from></note>') {
    throw new Error(`Unexpected minified XML: ${resMin.data.minified}`);
  }
  console.log('✅ In-memory xml/minify passed!');

  // Test 1.3: xml/sample
  const resSample = runWasm({
    action: 'xml/sample',
    params: {}
  });
  if (resSample.code !== 0 || !resSample.data?.sampleXml || !resSample.data?.formatted) {
    throw new Error(`In-memory sample failed: ${JSON.stringify(resSample)}`);
  }
  console.log('✅ In-memory xml/sample passed!');

  // 2. HTTP Backend Verification
  const baseUrl = 'http://localhost:3000';

  // Sample API
  const sampleResp = await fetch(`${baseUrl}/api/backend/xml/sample`);
  if (!sampleResp.ok) throw new Error(`GET /api/backend/xml/sample failed: ${sampleResp.status}`);
  const sampleData = await sampleResp.json();
  if (!sampleData.sampleXml) throw new Error('sampleXml missing from API response');
  console.log('✅ Backend Sample API Response received');

  // Convert API JSON Format
  const fmtResp = await fetch(`${baseUrl}/api/backend/xml/format`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: "format",
      xml: "<config><env>production</env></config>",
      indent: 4
    })
  });
  if (!fmtResp.ok) throw new Error(`POST /api/backend/xml/format JSON Format failed`);
  const fmtData = await fmtResp.json();
  if (fmtData.code !== 0 || !fmtData.data.formatted.includes("    <env>production</env>")) {
    throw new Error(`Backend JSON Format failed: ${JSON.stringify(fmtData)}`);
  }
  console.log('✅ Backend API JSON Format passed!');

  // Convert API JSON Minify
  const minResp = await fetch(`${baseUrl}/api/backend/xml/format`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: "minify",
      xml: "<root>\n  <!-- secret -->\n  <value>42</value>\n</root>",
      stripComments: true
    })
  });
  if (!minResp.ok) throw new Error(`POST /api/backend/xml/format JSON Minify failed`);
  const minData = await minResp.json();
  if (minData.code !== 0 || minData.data.minified !== "<root><value>42</value></root>") {
    throw new Error(`Backend JSON Minify failed: ${JSON.stringify(minData)}`);
  }
  console.log('✅ Backend API JSON Minify passed!');

  // Convert API HTMX
  const htmxResp = await fetch(`${baseUrl}/api/backend/xml/format`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'HX-Request': 'true'
    },
    body: new URLSearchParams({
      mode: "format",
      xml: "<app><version>2.0.0</version></app>",
      indent: "2"
    }).toString()
  });

  if (!htmxResp.ok) throw new Error(`POST /api/backend/xml/format HTMX failed`);
  const htmxHtml = await htmxResp.text();
  if (!htmxHtml.includes('XML 树排版缩进成功') || !htmxHtml.includes('app') || !htmxHtml.includes('version')) {
    throw new Error(`Unexpected HTMX HTML output: ${htmxHtml}`);
  }
  console.log('✅ Backend API HTMX POST passed!');

  // 3. Stats Verification
  const statsResp = await fetch(`${baseUrl}/api/stats`);
  const stats = await statsResp.json();
  if (!stats.xmlFormatter || stats.xmlFormatter.sizeBytes <= 0) {
    throw new Error(`Stats missing xmlFormatter info: ${JSON.stringify(stats)}`);
  }
  console.log(`✅ System Stats verified: ${stats.xmlFormatter.file} (${stats.xmlFormatter.sizeFormatted})`);

  console.log('\n🎉 ALL CHECKS PASSED: Tool #34 xml-formatter verified on Dual Runtime!');
}

verifyXmlFormatter().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
