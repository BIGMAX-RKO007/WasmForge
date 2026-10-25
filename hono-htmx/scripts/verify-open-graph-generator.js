import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function callWasm(instance, reqObj) {
  const { alloc, dealloc, dispatch, memory } = instance.exports;
  const jsonStr = JSON.stringify(reqObj);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(jsonStr);
  const inPtr = alloc(bytes.length);
  new Uint8Array(memory.buffer).set(bytes, inPtr);
  const packed = dispatch(inPtr, bytes.length);
  dealloc(inPtr, bytes.length);
  const outPtr = Number(BigInt(packed) >> 32n);
  const outLen = Number(BigInt(packed) & 0xffffffffn);
  const result = new TextDecoder().decode(new Uint8Array(memory.buffer, outPtr, outLen));
  dealloc(outPtr, outLen);
  return JSON.parse(result);
}

async function main() {
  console.log("🚀 [Verification] Testing Tool #61: open-graph-generator (Dual Runtime)");

  const wasmPath = path.resolve(__dirname, "../public/wasm/open-graph-generator.wasm");
  assert(fs.existsSync(wasmPath), "open-graph-generator.wasm must exist");

  const wasmBuffer = fs.readFileSync(wasmPath);
  console.log(`📦 WASM size: ${(wasmBuffer.length / 1024).toFixed(2)} KB`);

  const wasmModule = await WebAssembly.compile(wasmBuffer);
  const imports = WebAssembly.Module.imports(wasmModule);
  assert.strictEqual(imports.length, 0, "Must have 0 imports");

  const instance = await WebAssembly.instantiate(wasmModule, {});

  // Test 1: generate basic OGP
  const genRes = await callWasm(instance, {
    action: "open-graph/generate",
    requestId: "test-gen",
    params: {
      title: "Test Article",
      description: "A great piece of content",
      url: "https://example.com/test",
      image: "https://example.com/og.jpg",
      imageAlt: "Test Image",
      siteName: "Example Site",
      ogType: "article",
      twitterCard: "summary_large_image",
      twitterSite: "@example",
      twitterCreator: "@author",
      locale: "en_US"
    }
  });
  assert.strictEqual(genRes.code, 0, `Generate failed: ${genRes.msg}`);
  assert(genRes.data.metaTagsHtml.includes('og:title'), "Should contain og:title");
  assert(genRes.data.metaTagsHtml.includes('twitter:card'), "Should contain twitter:card");
  assert.strictEqual(genRes.data.preview.domain, "example.com");
  assert(genRes.data.jsonLdHtml.includes('"@type": "Article"'), "JSON-LD should be Article type");
  assert(genRes.data.tagsCount >= 14, `Expected >= 14 tags, got ${genRes.data.tagsCount}`);
  console.log(`✅ In-memory open-graph/generate passed! (${genRes.data.tagsCount} tags)`);

  // Test 2: presets
  const presetsRes = await callWasm(instance, {
    action: "open-graph/presets",
    requestId: "test-presets",
    params: {}
  });
  assert.strictEqual(presetsRes.code, 0);
  assert.strictEqual(presetsRes.data.length, 2);
  console.log(`✅ In-memory open-graph/presets passed! (${presetsRes.data.length} presets)`);

  // Test HTTP routes
  console.log("🌐 Testing Hono HTTP API...");
  const base = "http://localhost:3000";

  const httpPresets = await (await fetch(`${base}/api/backend/open-graph/presets`)).json();
  assert.strictEqual(httpPresets.code, 0);
  assert.strictEqual(httpPresets.data.length, 2);
  console.log("✅ GET /api/backend/open-graph/presets passed!");

  const httpGen = await (await fetch(`${base}/api/backend/open-graph/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Test",
      description: "Test description",
      url: "https://example.com",
      ogType: "website",
      twitterCard: "summary_large_image"
    })
  })).json();
  assert.strictEqual(httpGen.code, 0);
  assert(httpGen.data.tagsCount > 0);
  console.log("✅ POST /api/backend/open-graph/generate (JSON) passed!");

  const htmxRes = await (await fetch(`${base}/api/backend/open-graph/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "HX-Request": "true" },
    body: `title=Test&description=Desc&url=https%3A%2F%2Fexample.com&ogType=website&twitterCard=summary_large_image`
  })).text();
  assert(htmxRes.includes("result-box"), "HTMX response must contain result-box");
  console.log("✅ POST /api/backend/open-graph/generate (HTMX) passed!");

  const stats = await (await fetch(`${base}/api/stats`)).json();
  assert(stats.openGraphGenerator, "/api/stats must include openGraphGenerator");
  console.log(`✅ /api/stats includes openGraphGenerator (${stats.openGraphGenerator.sizeFormatted})`);

  console.log("\n🎉 [SUCCESS] Tool #61 open-graph-generator dual runtime verification passed!\n");
}

main().catch(err => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
