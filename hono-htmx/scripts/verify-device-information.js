import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 [Verification] Testing Tool #57: device-information (Dual Runtime)");

  const wasmPath = path.resolve(__dirname, "../public/wasm/device-information.wasm");
  assert(fs.existsSync(wasmPath), "device-information.wasm must exist in public/wasm/");

  const wasmBuffer = fs.readFileSync(wasmPath);
  console.log(`📦 WASM Binary size: ${(wasmBuffer.length / 1024).toFixed(2)} KB`);

  // 1. Direct WebAssembly instantiation (Browser-equivalent in-memory test)
  const wasmModule = await WebAssembly.compile(wasmBuffer);
  const imports = WebAssembly.Module.imports(wasmModule);
  console.log(`🔍 WASM Imports count: ${imports.length}`);
  assert.strictEqual(imports.length, 0, "Pure WASM module must have 0 imports");

  const instance = await WebAssembly.instantiate(wasmModule, {});
  const { alloc, dealloc, dispatch, memory } = instance.exports;

  assert(typeof alloc === "function", "Must export alloc");
  assert(typeof dealloc === "function", "Must export dealloc");
  assert(typeof dispatch === "function", "Must export dispatch");

  function callWasm(reqObj) {
    const jsonStr = JSON.stringify(reqObj);
    const encoder = new TextEncoder();
    const bytes = encoder.encode(jsonStr);

    const inPtr = alloc(bytes.length);
    const memView = new Uint8Array(memory.buffer);
    memView.set(bytes, inPtr);

    const packed = dispatch(inPtr, bytes.length);
    dealloc(inPtr, bytes.length);

    const outPtr = Number(BigInt(packed) >> 32n);
    const outLen = Number(BigInt(packed) & 0xffffffffn);

    const outBuf = new Uint8Array(memory.buffer, outPtr, outLen);
    const decoder = new TextDecoder();
    const resultStr = decoder.decode(outBuf);
    dealloc(outPtr, outLen);

    return JSON.parse(resultStr);
  }

  // Test 1: In-memory Desktop Chrome UA
  const chromeUa = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
  const chromeRes = callWasm({
    action: "device/parse",
    requestId: "test-chrome",
    params: {
      ua: chromeUa,
      clientDetails: { screenWidth: 1920, screenHeight: 1080 }
    }
  });
  assert.strictEqual(chromeRes.code, 0);
  assert.strictEqual(chromeRes.data.browser.name, "Chrome");
  assert.strictEqual(chromeRes.data.browser.majorVersion, "130");
  assert.strictEqual(chromeRes.data.os.name, "Windows");
  assert.strictEqual(chromeRes.data.device.deviceType, "Desktop");
  assert.strictEqual(chromeRes.data.isBot, false);
  console.log(`✅ In-memory device/parse (Chrome) passed! (Browser: ${chromeRes.data.browser.name} ${chromeRes.data.browser.version})`);

  // Test 2: In-memory Mobile iPhone UA
  const iphoneUa = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";
  const iphoneRes = callWasm({
    action: "device/parse",
    requestId: "test-iphone",
    params: {
      ua: iphoneUa
    }
  });
  assert.strictEqual(iphoneRes.code, 0);
  assert.strictEqual(iphoneRes.data.browser.name, "Safari");
  assert.strictEqual(iphoneRes.data.os.name, "iOS");
  assert.strictEqual(iphoneRes.data.device.deviceType, "Mobile");
  assert.strictEqual(iphoneRes.data.device.vendor, "Apple");
  console.log(`✅ In-memory device/parse (iPhone) passed!`);

  // Test 3: In-memory Googlebot Spider
  const botUa = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
  const botRes = callWasm({
    action: "device/parse",
    requestId: "test-bot",
    params: {
      ua: botUa
    }
  });
  assert.strictEqual(botRes.code, 0);
  assert.strictEqual(botRes.data.isBot, true);
  assert.strictEqual(botRes.data.device.deviceType, "Bot");
  console.log(`✅ In-memory device/parse (Googlebot) passed!`);

  // Test 4: Presets
  const presetsRes = callWasm({
    action: "device/presets",
    requestId: "test-presets",
    params: {}
  });
  assert.strictEqual(presetsRes.code, 0);
  assert.strictEqual(presetsRes.data.length, 5);
  console.log(`✅ In-memory device/presets passed! (${presetsRes.data.length} presets)`);

  // 2. Testing Hono Backend HTTP API
  console.log("🌐 Testing Hono Backend HTTP API...");
  const baseUrl = "http://localhost:3000";

  // HTTP GET presets
  const httpPresets = await (await fetch(`${baseUrl}/api/backend/device/presets`)).json();
  assert.strictEqual(httpPresets.code, 0);
  assert.strictEqual(httpPresets.data.length, 5);
  console.log(`✅ HTTP GET /api/backend/device/presets passed!`);

  // HTTP POST parse (JSON)
  const httpParse = await (await fetch(`${baseUrl}/api/backend/device/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ua: chromeUa
    })
  })).json();
  assert.strictEqual(httpParse.code, 0);
  assert.strictEqual(httpParse.data.browser.name, "Chrome");
  console.log(`✅ HTTP POST /api/backend/device/parse (JSON) passed!`);

  // HTTP POST parse (HTMX)
  const htmxRes = await (await fetch(`${baseUrl}/api/backend/device/parse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "HX-Request": "true"
    },
    body: `ua=${encodeURIComponent(iphoneUa)}`
  })).text();
  assert(htmxRes.includes("result-box"), "HTMX response must contain result-box");
  assert(htmxRes.includes("Mobile 设备识别"), "HTMX response must indicate Mobile detection");
  console.log(`✅ HTTP POST /api/backend/device/parse (HTMX) passed!`);

  // Verify /api/stats
  const stats = await (await fetch(`${baseUrl}/api/stats`)).json();
  assert(stats.deviceInformation, "/api/stats must include deviceInformation");
  console.log(`✅ /api/stats includes deviceInformation (${stats.deviceInformation.sizeFormatted})`);

  console.log("\n🎉 [SUCCESS] Tool #57 device-information dual runtime verification passed completely!\n");
}

main().catch(err => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
