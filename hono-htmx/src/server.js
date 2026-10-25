import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { loadWasmFromDisk } from "./infrastructure/wasm/wasm-loader.node.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = new Hono();

// 后端直接从 public/wasm 磁盘路径加载单一 WASM 模块
const rsWasmPath = path.resolve(__dirname, "../public/wasm/rs.wasm");
const tsWasmPath = path.resolve(__dirname, "../public/wasm/ts.wasm");
const tokenWasmPath = path.resolve(__dirname, "../public/wasm/token-generator.wasm");
const hashWasmPath = path.resolve(__dirname, "../public/wasm/hash-text.wasm");
const bcryptWasmPath = path.resolve(__dirname, "../public/wasm/bcrypt.wasm");
const uuidWasmPath = path.resolve(__dirname, "../public/wasm/uuid-generator.wasm");
const ulidWasmPath = path.resolve(__dirname, "../public/wasm/ulid-generator.wasm");
const encryptionWasmPath = path.resolve(__dirname, "../public/wasm/encryption.wasm");
const bip39WasmPath = path.resolve(__dirname, "../public/wasm/bip39-generator.wasm");
const hmacWasmPath = path.resolve(__dirname, "../public/wasm/hmac-generator.wasm");
const rsaWasmPath = path.resolve(__dirname, "../public/wasm/rsa-key-pair.wasm");
const passwordStrengthWasmPath = path.resolve(__dirname, "../public/wasm/password-strength.wasm");
const pdfSignatureWasmPath = path.resolve(__dirname, "../public/wasm/pdf-signature.wasm");
const yamlToJsonWasmPath = path.resolve(__dirname, "../public/wasm/yaml-to-json.wasm");
const yamlToTomlWasmPath = path.resolve(__dirname, "../public/wasm/yaml-to-toml.wasm");
const jsonToYamlWasmPath = path.resolve(__dirname, "../public/wasm/json-to-yaml.wasm");
const jsonToTomlWasmPath = path.resolve(__dirname, "../public/wasm/json-to-toml.wasm");
const tomlToJsonWasmPath = path.resolve(__dirname, "../public/wasm/toml-to-json.wasm");
const tomlToYamlWasmPath = path.resolve(__dirname, "../public/wasm/toml-to-yaml.wasm");
const xmlToJsonWasmPath = path.resolve(__dirname, "../public/wasm/xml-to-json.wasm");
const jsonToXmlWasmPath = path.resolve(__dirname, "../public/wasm/json-to-xml.wasm");
const jsonToCsvWasmPath = path.resolve(__dirname, "../public/wasm/json-to-csv.wasm");
const base64StringWasmPath = path.resolve(__dirname, "../public/wasm/base64-string.wasm");
const base64FileWasmPath = path.resolve(__dirname, "../public/wasm/base64-file.wasm");
const colorConverterWasmPath = path.resolve(__dirname, "../public/wasm/color-converter.wasm");

let rsEngine = null;
let tsEngine = null;
let tokenEngine = null;
let hashEngine = null;
let bcryptEngine = null;
let uuidEngine = null;
let ulidEngine = null;
let encryptionEngine = null;
let bip39Engine = null;
let hmacEngine = null;
let rsaEngine = null;
let passwordStrengthEngine = null;
let pdfSignatureEngine = null;
let yamlToJsonEngine = null;
let yamlToTomlEngine = null;
let jsonToYamlEngine = null;
let jsonToTomlEngine = null;
let tomlToJsonEngine = null;
let tomlToYamlEngine = null;
let xmlToJsonEngine = null;
let jsonToXmlEngine = null;
let jsonToCsvEngine = null;
let base64StringEngine = null;
let base64FileEngine = null;
let colorConverterEngine = null;

async function initEngines() {
  try {
    if (fs.existsSync(rsWasmPath)) {
      rsEngine = await loadWasmFromDisk(rsWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 rs.wasm 加载成功");
    } else {
      console.warn("⚠️ rs.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(tsWasmPath)) {
      tsEngine = await loadWasmFromDisk(tsWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 ts.wasm 加载成功");
    } else {
      console.warn("⚠️ ts.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(tokenWasmPath)) {
      tokenEngine = await loadWasmFromDisk(tokenWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 token-generator.wasm 加载成功");
    } else {
      console.warn("⚠️ token-generator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(hashWasmPath)) {
      hashEngine = await loadWasmFromDisk(hashWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 hash-text.wasm 加载成功");
    } else {
      console.warn("⚠️ hash-text.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(bcryptWasmPath)) {
      bcryptEngine = await loadWasmFromDisk(bcryptWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 bcrypt.wasm 加载成功");
    } else {
      console.warn("⚠️ bcrypt.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(uuidWasmPath)) {
      uuidEngine = await loadWasmFromDisk(uuidWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 uuid-generator.wasm 加载成功");
    } else {
      console.warn("⚠️ uuid-generator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(ulidWasmPath)) {
      ulidEngine = await loadWasmFromDisk(ulidWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 ulid-generator.wasm 加载成功");
    } else {
      console.warn("⚠️ ulid-generator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(encryptionWasmPath)) {
      encryptionEngine = await loadWasmFromDisk(encryptionWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 encryption.wasm 加载成功");
    } else {
      console.warn("⚠️ encryption.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(bip39WasmPath)) {
      bip39Engine = await loadWasmFromDisk(bip39WasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 bip39-generator.wasm 加载成功");
    } else {
      console.warn("⚠️ bip39-generator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(hmacWasmPath)) {
      hmacEngine = await loadWasmFromDisk(hmacWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 hmac-generator.wasm 加载成功");
    } else {
      console.warn("⚠️ hmac-generator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(rsaWasmPath)) {
      rsaEngine = await loadWasmFromDisk(rsaWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 rsa-key-pair.wasm 加载成功");
    } else {
      console.warn("⚠️ rsa-key-pair.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(passwordStrengthWasmPath)) {
      passwordStrengthEngine = await loadWasmFromDisk(passwordStrengthWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 password-strength.wasm 加载成功");
    } else {
      console.warn("⚠️ password-strength.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(pdfSignatureWasmPath)) {
      pdfSignatureEngine = await loadWasmFromDisk(pdfSignatureWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 pdf-signature.wasm 加载成功");
    } else {
      console.warn("⚠️ pdf-signature.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(yamlToJsonWasmPath)) {
      yamlToJsonEngine = await loadWasmFromDisk(yamlToJsonWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 yaml-to-json.wasm 加载成功");
    } else {
      console.warn("⚠️ yaml-to-json.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(yamlToTomlWasmPath)) {
      yamlToTomlEngine = await loadWasmFromDisk(yamlToTomlWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 yaml-to-toml.wasm 加载成功");
    } else {
      console.warn("⚠️ yaml-to-toml.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(jsonToYamlWasmPath)) {
      jsonToYamlEngine = await loadWasmFromDisk(jsonToYamlWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 json-to-yaml.wasm 加载成功");
    } else {
      console.warn("⚠️ json-to-yaml.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(jsonToTomlWasmPath)) {
      jsonToTomlEngine = await loadWasmFromDisk(jsonToTomlWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 json-to-toml.wasm 加载成功");
    } else {
      console.warn("⚠️ json-to-toml.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(tomlToJsonWasmPath)) {
      tomlToJsonEngine = await loadWasmFromDisk(tomlToJsonWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 toml-to-json.wasm 加载成功");
    } else {
      console.warn("⚠️ toml-to-json.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(tomlToYamlWasmPath)) {
      tomlToYamlEngine = await loadWasmFromDisk(tomlToYamlWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 toml-to-yaml.wasm 加载成功");
    } else {
      console.warn("⚠️ toml-to-yaml.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(xmlToJsonWasmPath)) {
      xmlToJsonEngine = await loadWasmFromDisk(xmlToJsonWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 xml-to-json.wasm 加载成功");
    } else {
      console.warn("⚠️ xml-to-json.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(jsonToXmlWasmPath)) {
      jsonToXmlEngine = await loadWasmFromDisk(jsonToXmlWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 json-to-xml.wasm 加载成功");
    } else {
      console.warn("⚠️ json-to-xml.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(jsonToCsvWasmPath)) {
      jsonToCsvEngine = await loadWasmFromDisk(jsonToCsvWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 json-to-csv.wasm 加载成功");
    } else {
      console.warn("⚠️ json-to-csv.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(base64StringWasmPath)) {
      base64StringEngine = await loadWasmFromDisk(base64StringWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 base64-string.wasm 加载成功");
    } else {
      console.warn("⚠️ base64-string.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(base64FileWasmPath)) {
      base64FileEngine = await loadWasmFromDisk(base64FileWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 base64-file.wasm 加载成功");
    } else {
      console.warn("⚠️ base64-file.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(colorConverterWasmPath)) {
      colorConverterEngine = await loadWasmFromDisk(colorConverterWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 color-converter.wasm 加载成功");
    } else {
      console.warn("⚠️ color-converter.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }
  } catch (err) {
    console.error("❌ 后端 WASM 基础设施初始化失败:", err);
  }
}

await initEngines();

// 静态资源托管：提供前端访问 index.html, wasm/rs.wasm, wasm/ts.wasm 等
app.use("/*", serveStatic({
  root: "./public",
  onFound: (path, c) => {
    if (path.endsWith(".wasm")) {
      c.header("Content-Type", "application/wasm");
    }
  }
}));

// API: 后端执行加法 (由 HTMX 调用)
app.post("/api/backend/calc", async (c) => {
  try {
    const body = await c.req.parseBody();
    const engineType = (body.engine || "rust").toString();
    const a = parseInt(body.a || "0", 10);
    const b = parseInt(body.b || "0", 10);

    const engine = engineType === "rust" ? rsEngine : tsEngine;
    if (!engine) {
      throw new Error(`引擎 ${engineType} 尚未初始化，请确保 public/wasm/${engineType === "rust" ? "rs" : "ts"}.wasm 存在`);
    }

    const t0 = performance.now();
    const result = engine.add(a, b);
    const duration = (performance.now() - t0).toFixed(4);

    const engineName = engineType === "rust" ? "🦀 Rust WASM" : "🚀 AssemblyScript WASM";
    const tagClass = engineType === "rust" ? "tag-rust" : "tag-ts";

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag ${tagClass}">${engineName}</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生 WASM 计算)</span>
        </div>
        <div class="result-value">${a} + ${b} = <strong>${result}</strong></div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>执行失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端执行问候 (由 HTMX 调用)
app.post("/api/backend/greet", async (c) => {
  try {
    const body = await c.req.parseBody();
    const engineType = (body.engine || "rust").toString();
    const name = (body.name || "World").toString().trim();

    const engine = engineType === "rust" ? rsEngine : tsEngine;
    if (!engine) {
      throw new Error(`引擎 ${engineType} 尚未初始化，请确保 public/wasm/${engineType === "rust" ? "rs" : "ts"}.wasm 存在`);
    }

    const t0 = performance.now();
    const result = engine.greet(name);
    const duration = (performance.now() - t0).toFixed(4);

    const engineName = engineType === "rust" ? "🦀 Rust WASM" : "🚀 AssemblyScript WASM";
    const tagClass = engineType === "rust" ? "tag-rust" : "tag-ts";

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag ${tagClass}">${engineName}</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生 WASM 内存解算)</span>
        </div>
        <div class="result-value">${result}</div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>执行失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端执行 Token 生成 (支持 HTMX Form 表单与 JSON 调用)
app.post("/api/backend/token/generate", async (c) => {
  try {
    if (!tokenEngine) {
      throw new Error("token-generator.wasm 模块尚未就绪，请先完成编译");
    }

    const contentType = c.req.header("content-type") || "";
    let params = {};

    if (contentType.includes("application/json")) {
      const json = await c.req.json();
      params = json.params || json;
    } else {
      const body = await c.req.parseBody();
      params = {
        length: parseInt(body.length || "32", 10),
        withUppercase: body.withUppercase === "on" || body.withUppercase === "true" || body.withUppercase === true,
        withLowercase: body.withLowercase === "on" || body.withLowercase === "true" || body.withLowercase === true,
        withNumbers: body.withNumbers === "on" || body.withNumbers === "true" || body.withNumbers === true,
        withSymbols: body.withSymbols === "on" || body.withSymbols === "true" || body.withSymbols === true,
        customAlphabet: body.customAlphabet ? body.customAlphabet.toString().trim() : undefined,
        seed: body.seed ? parseInt(body.seed, 10) : undefined,
      };
    }

    const t0 = performance.now();
    const response = tokenEngine.dispatch({
      action: "token/generate",
      requestId: `req-${Date.now()}`,
      params,
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg || "Token 生成失败");
    }

    const { token, length, entropyBits, charsetSize } = response.data;

    if (c.req.header("accept")?.includes("application/json") && !c.req.header("hx-request")) {
      return c.json({ ...response, serverDurationMs: duration });
    }

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: token-generator</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生 WASM 计算)</span>
        </div>
        <div class="token-display-wrap" style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:10px 14px; border-radius:8px; margin:8px 0;">
          <div class="result-value" id="server-token-text" style="font-size:15px; color:#38bdf8; word-break:break-all; flex:1;">${token}</div>
          <button type="button" class="btn-copy" style="margin-left:12px; padding:6px 12px; border-radius:6px; background:#1e293b; color:#fff; border:1px solid #38bdf8; cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('server-token-text').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
        </div>
        <div class="token-meta" style="display:flex; gap:16px; font-size:12px; color:var(--text-muted); margin-top:6px;">
          <span>📏 长度: <strong style="color:#fff;">${length}</strong></span>
          <span>🔤 字符集大小: <strong style="color:#fff;">${charsetSize}</strong></span>
          <span>🔐 密码熵: <strong style="color:#34d399;">${entropyBits.toFixed(1)} bits</strong></span>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>生成失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端执行哈希计算 (hash/all: 一键返回 6 种主流哈希)
app.post("/api/backend/hash/all", async (c) => {
  try {
    if (!hashEngine) {
      throw new Error("hash-text.wasm 模块尚未就绪，请先完成编译");
    }

    const contentType = c.req.header("content-type") || "";
    let text = "";

    if (contentType.includes("application/json")) {
      const json = await c.req.json();
      text = json.text || (json.params && json.params.text) || "";
    } else {
      const body = await c.req.parseBody();
      text = (body.text || "").toString();
    }

    const t0 = performance.now();
    const response = hashEngine.dispatch({
      action: "hash/all",
      requestId: `req-${Date.now()}`,
      params: { text },
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg || "哈希计算失败");
    }

    const d = response.data;

    if (c.req.header("accept")?.includes("application/json") && !c.req.header("hx-request")) {
      return c.json({ ...response, serverDurationMs: duration });
    }

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: hash-text</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端微秒级 6 哈希全量运算)</span>
        </div>
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:10px;">
          字符数: <strong style="color:#fff;">${d.textLength}</strong> | 字节数 (UTF-8): <strong style="color:#fff;">${d.byteLength}</strong>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <div class="hash-row" style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:6px; font-size:13px; font-family:var(--font-mono);">
            <span style="color:#f97316; font-weight:bold; width:80px;">MD5</span>
            <span id="srv-hash-md5" style="color:#f1f5f9; word-break:break-all; flex:1;">${d.md5}</span>
            <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.2); cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-hash-md5').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
          <div class="hash-row" style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:6px; font-size:13px; font-family:var(--font-mono);">
            <span style="color:#38bdf8; font-weight:bold; width:80px;">SHA-1</span>
            <span id="srv-hash-sha1" style="color:#f1f5f9; word-break:break-all; flex:1;">${d.sha1}</span>
            <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.2); cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-hash-sha1').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
          <div class="hash-row" style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:6px; font-size:13px; font-family:var(--font-mono);">
            <span style="color:#34d399; font-weight:bold; width:80px;">SHA-256</span>
            <span id="srv-hash-sha256" style="color:#34d399; word-break:break-all; flex:1; font-weight:bold;">${d.sha256}</span>
            <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid #34d399; cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-hash-sha256').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
          <div class="hash-row" style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:6px; font-size:13px; font-family:var(--font-mono);">
            <span style="color:#eab308; font-weight:bold; width:80px;">SHA-512</span>
            <span id="srv-hash-sha512" style="color:#f1f5f9; word-break:break-all; flex:1; font-size:11px;">${d.sha512}</span>
            <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.2); cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-hash-sha512').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
          <div class="hash-row" style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:6px; font-size:13px; font-family:var(--font-mono);">
            <span style="color:#a855f7; font-weight:bold; width:80px;">SHA3-256</span>
            <span id="srv-hash-sha3" style="color:#f1f5f9; word-break:break-all; flex:1;">${d.sha3_256}</span>
            <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.2); cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-hash-sha3').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
          <div class="hash-row" style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:6px; font-size:13px; font-family:var(--font-mono);">
            <span style="color:#ec4899; font-weight:bold; width:80px;">RIPEMD160</span>
            <span id="srv-hash-ripemd" style="color:#f1f5f9; word-break:break-all; flex:1;">${d.ripemd160}</span>
            <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.2); cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-hash-ripemd').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>计算失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端执行 Bcrypt 计算
app.post("/api/backend/bcrypt/hash", async (c) => {
  try {
    if (!bcryptEngine) {
      throw new Error("bcrypt.wasm 模块尚未就绪，请先完成编译");
    }

    const body = await c.req.parseBody();
    const password = (body.password || "").toString();
    const cost = parseInt(body.cost || "10", 10);

    const t0 = performance.now();
    const response = bcryptEngine.dispatch({
      action: "bcrypt/hash",
      requestId: `req-${Date.now()}`,
      params: { password, cost },
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg || "Bcrypt 哈希计算失败");
    }

    const { hash } = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: bcrypt</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端高抗碰撞哈希计算)</span>
        </div>
        <div class="token-display-wrap" style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:10px 14px; border-radius:8px; margin:8px 0;">
          <div class="result-value" id="server-bcrypt-hash" style="font-size:14px; color:#38bdf8; word-break:break-all; flex:1;">${hash}</div>
          <button type="button" class="btn-copy" style="margin-left:12px; padding:6px 12px; border-radius:6px; background:#1e293b; color:#fff; border:1px solid #38bdf8; cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('server-bcrypt-hash').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
        </div>
        <div class="token-meta" style="display:flex; gap:16px; font-size:12px; color:var(--text-muted); margin-top:6px;">
          <span>🎯 运算轮次 (Cost): <strong style="color:#fff;">${cost}</strong></span>
          <span>🔒 密码学算法: <strong style="color:#34d399;">Blowfish-based Bcrypt</strong></span>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>生成失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

app.post("/api/backend/bcrypt/verify", async (c) => {
  try {
    if (!bcryptEngine) {
      throw new Error("bcrypt.wasm 模块尚未就绪，请先完成编译");
    }

    const body = await c.req.parseBody();
    const password = (body.password || "").toString();
    const hash = (body.hash || "").toString().trim();

    const t0 = performance.now();
    const response = bcryptEngine.dispatch({
      action: "bcrypt/verify",
      requestId: `req-${Date.now()}`,
      params: { password, hash },
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg || "比对失败");
    }

    const { valid } = response.data;
    const badgeColor = valid ? "#34d399" : "#ef4444";
    const statusText = valid ? "✅ 验证通过：密码与哈希完全匹配" : "❌ 验证失败：密码错误或哈希不匹配";

    return c.html(`
      <div class="result-box" style="border-color:${badgeColor};">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: bcrypt 恒定时间校验</span>
          <span class="badge-time">⚡ ${duration} ms</span>
        </div>
        <div style="font-size:15px; font-weight:bold; color:${badgeColor}; margin-top:4px;">
          ${statusText}
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>比对异常:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端生成 UUID (支持 v4 与 v7)
app.post("/api/backend/uuid/generate", async (c) => {
  try {
    if (!uuidEngine) {
      throw new Error("uuid-generator.wasm 模块尚未就绪，请先完成编译");
    }

    const body = await c.req.parseBody();
    const version = (body.version || "v4").toString();
    const count = parseInt(body.count || "1", 10);
    const uppercase = body.uppercase === "on" || body.uppercase === "true" || body.uppercase === true;
    const hyphens = body.hyphens !== "off" && body.hyphens !== "false" && body.hyphens !== false;

    const t0 = performance.now();
    const response = uuidEngine.dispatch({
      action: version === "v7" ? "uuid/v7" : "uuid/v4",
      requestId: `req-${Date.now()}`,
      params: {
        count,
        uppercase,
        hyphens,
        timestampMs: Date.now(),
      },
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg || "UUID 生成失败");
    }

    const { uuids } = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: uuid-${version} (${count} 个)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生极速生成)</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px; margin:8px 0;">
          ${uuids.map((id, idx) => `
            <div class="token-display-wrap" style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:6px;">
              <div class="result-value" id="srv-uuid-${idx}" style="font-size:14px; color:#38bdf8; word-break:break-all; flex:1;">${id}</div>
              <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid #38bdf8; cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-uuid-${idx}').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
            </div>
          `).join("")}
        </div>
        <div class="token-meta" style="display:flex; gap:16px; font-size:12px; color:var(--text-muted);">
          <span>规格: <strong style="color:#fff;">${version.toUpperCase()} (RFC ${version === "v7" ? "9562 时间单调" : "4122 强随机"})</strong></span>
          <span>连字符: <strong style="color:#34d399;">${hyphens ? "是" : "否"}</strong></span>
          <span>大写字母: <strong style="color:#34d399;">${uppercase ? "是" : "否"}</strong></span>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>生成失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端 ULID 生成 (由 HTMX 调用)
app.post("/api/backend/ulid/generate", async (c) => {
  try {
    if (!ulidEngine) {
      throw new Error("ulid-generator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    const body = await c.req.parseBody();
    const count = parseInt(body.count || "3", 10);
    const customTs = body.timestampMs ? parseInt(body.timestampMs, 10) : Date.now();

    const t0 = performance.now();
    const response = ulidEngine.dispatch({
      action: "ulid/generate",
      requestId: `srv-${Date.now()}`,
      params: {
        count,
        timestampMs: customTs,
        seed: Math.floor(Math.random() * 0xFFFFFFFF)
      }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg);
    }

    const { ulids, timestampMs, datetimeIso } = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: ulid-generator (${count} 个)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生毫秒级生成)</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px; margin:8px 0;">
          ${ulids.map((id, idx) => `
            <div class="token-display-wrap" style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:6px;">
              <div class="result-value" id="srv-ulid-${idx}" style="font-size:14px; color:#a855f7; word-break:break-all; flex:1;">${id}</div>
              <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid #a855f7; cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-ulid-${idx}').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
            </div>
          `).join("")}
        </div>
        <div class="token-meta" style="display:flex; gap:16px; font-size:12px; color:var(--text-muted);">
          <span>编码规范: <strong style="color:#fff;">Crockford's Base32 (26 字符)</strong></span>
          <span>时间戳: <strong style="color:#34d399;">${timestampMs}</strong> (${datetimeIso})</span>
          <span>字典排序: <strong style="color:#38bdf8;">单调递增</strong></span>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>生成失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端 ULID 解析 (由 HTMX 调用)
app.post("/api/backend/ulid/parse", async (c) => {
  try {
    if (!ulidEngine) {
      throw new Error("ulid-generator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    const body = await c.req.parseBody();
    const ulid = (body.ulid || "").toString().trim();

    const t0 = performance.now();
    const response = ulidEngine.dispatch({
      action: "ulid/parse",
      requestId: `srv-${Date.now()}`,
      params: { ulid }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg);
    }

    const { timestampMs, datetimeIso, isValid } = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: ULID 结构逆向解析</span>
          <span class="badge-time">⚡ ${duration} ms</span>
        </div>
        <div style="font-size:13px; font-family:var(--font-mono); margin:8px 0; color:#fff;">
          <div>目标 ULID: <strong style="color:#a855f7;">${ulid}</strong></div>
          <div style="margin-top:6px; color:#34d399;">⏱️ 提取时间戳: <strong>${timestampMs} ms</strong></div>
          <div style="margin-top:4px; color:#38bdf8;">📅 ISO 8601 UTC: <strong>${datetimeIso}</strong></div>
          <div style="margin-top:4px; color:#e2e8f0;">48-bit 毫秒前缀: <strong>${ulid.slice(0, 10)}</strong> | 80-bit 随机后缀: <strong>${ulid.slice(10)}</strong></div>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>解析失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端 AES 加密 (由 HTMX 调用)
app.post("/api/backend/aes/encrypt", async (c) => {
  try {
    if (!encryptionEngine) {
      throw new Error("encryption.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    const body = await c.req.parseBody();
    const text = (body.text || "").toString();
    const secretKey = (body.secretKey || "").toString();
    const keyBits = parseInt(body.keyBits || "256", 10);
    const format = (body.format || "base64").toString();

    const t0 = performance.now();
    const response = encryptionEngine.dispatch({
      action: "aes/encrypt",
      requestId: `srv-${Date.now()}`,
      params: {
        text,
        secretKey,
        keyBits,
        format,
        seed: Math.floor(Math.random() * 0xFFFFFFFF)
      }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg);
    }

    const { ciphertext, nonce, algorithm } = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: ${algorithm}</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生极速加密)</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px; margin:8px 0;">
          <div>
            <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">密文 (Ciphertext + 128-bit Auth Tag):</div>
            <div class="token-display-wrap" style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:6px;">
              <div class="result-value" id="srv-aes-cipher" style="font-size:13px; color:#10b981; word-break:break-all; flex:1;">${ciphertext}</div>
              <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid #10b981; cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-aes-cipher').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
            </div>
          </div>
          <div>
            <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">随机 Nonce / IV (96-bit 认证初始向量):</div>
            <div class="token-display-wrap" style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:6px;">
              <div class="result-value" id="srv-aes-nonce" style="font-size:13px; color:#38bdf8; word-break:break-all; flex:1;">${nonce}</div>
              <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid #38bdf8; cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-aes-nonce').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
            </div>
          </div>
        </div>
        <div class="token-meta" style="display:flex; gap:16px; font-size:12px; color:var(--text-muted);">
          <span>模式: <strong style="color:#fff;">Galois/Counter Mode (AEAD)</strong></span>
          <span>密钥长度: <strong style="color:#34d399;">${keyBits} bits</strong></span>
          <span>编码: <strong style="color:#38bdf8;">${format.toUpperCase()}</strong></span>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>加密失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端 AES 解密 (由 HTMX 调用)
app.post("/api/backend/aes/decrypt", async (c) => {
  try {
    if (!encryptionEngine) {
      throw new Error("encryption.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    const body = await c.req.parseBody();
    const ciphertext = (body.ciphertext || "").toString().trim();
    const secretKey = (body.secretKey || "").toString();
    const nonce = (body.nonce || "").toString().trim();
    const keyBits = parseInt(body.keyBits || "256", 10);
    const format = (body.format || "base64").toString();

    const t0 = performance.now();
    const response = encryptionEngine.dispatch({
      action: "aes/decrypt",
      requestId: `srv-${Date.now()}`,
      params: {
        ciphertext,
        secretKey,
        nonce,
        keyBits,
        format
      }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg);
    }

    const { plaintext, verified, algorithm } = response.data;

    return c.html(`
      <div class="result-box" style="border-color:#10b981;">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: ${algorithm} 解密校验通过</span>
          <span class="badge-time">⚡ ${duration} ms (恒定时间认证)</span>
        </div>
        <div style="margin:8px 0;">
          <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">解密明文 (Plaintext Payload):</div>
          <div class="token-display-wrap" style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:6px;">
            <div class="result-value" id="srv-aes-plain" style="font-size:14px; color:#34d399; font-weight:bold; word-break:break-all; flex:1;">${plaintext}</div>
            <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid #34d399; cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-aes-plain').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
        </div>
        <div class="token-meta" style="display:flex; gap:16px; font-size:12px; color:var(--text-muted);">
          <span>🔒 认证标签验证: <strong style="color:#34d399;">✅ 完整且未被篡改</strong></span>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>解密失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端 BIP-39 助记词生成 (由 HTMX 调用)
app.post("/api/backend/bip39/generate", async (c) => {
  try {
    if (!bip39Engine) {
      throw new Error("bip39-generator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    const body = await c.req.parseBody();
    const wordCount = parseInt(body.wordCount || "12", 10);
    const passphrase = (body.passphrase || "").toString();

    const t0 = performance.now();
    const response = bip39Engine.dispatch({
      action: "bip39/generate",
      requestId: `srv-${Date.now()}`,
      params: {
        wordCount,
        passphrase,
        seed: Math.floor(Math.random() * 0xFFFFFFFF)
      }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg);
    }

    const { mnemonic, words, entropyHex, seedHex } = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: BIP-39 (${wordCount} 单词)</span>
          <span class="badge-time">⚡ ${duration} ms (PBKDF2 2048轮原生秒出)</span>
        </div>
        <div style="margin:8px 0;">
          <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">英文标准助记词 (Mnemonic Phrase):</div>
          <div style="display:flex; flex-wrap:wrap; gap:6px; background:rgba(0,0,0,0.3); padding:10px 14px; border-radius:8px;">
            ${words.map((w, idx) => `
              <span style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); padding:4px 8px; border-radius:4px; font-family:var(--font-mono); font-size:13px; color:#38bdf8;">
                <span style="color:var(--text-muted); font-size:10px; margin-right:4px;">${idx + 1}</span>${w}
              </span>
            `).join("")}
          </div>
          <div style="display:flex; justify-content:flex-end; margin-top:6px;">
            <button type="button" class="btn-copy" style="padding:4px 10px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid #38bdf8; cursor:pointer; font-size:12px;" onclick="navigator.clipboard.writeText('${mnemonic}'); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制完整助记词', 1500)">复制完整助记词</button>
          </div>
        </div>
        <div style="margin-top:8px;">
          <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">512-bit 主种子 (Seed Hex):</div>
          <div class="result-value" style="font-size:11px; color:#34d399; background:rgba(0,0,0,0.2); padding:6px 10px; border-radius:4px; word-break:break-all;">${seedHex}</div>
        </div>
        <div class="token-meta" style="display:flex; gap:16px; font-size:12px; color:var(--text-muted); margin-top:8px;">
          <span>熵值: <strong style="color:#fff;">${entropyHex.length * 4} bits</strong></span>
          <span>字典: <strong style="color:#34d399;">English (2048 words)</strong></span>
          <span>盐口令: <strong style="color:#38bdf8;">${passphrase ? '已启用' : '无'}</strong></span>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>生成失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端 BIP-39 助记词校验 (由 HTMX 调用)
app.post("/api/backend/bip39/validate", async (c) => {
  try {
    if (!bip39Engine) {
      throw new Error("bip39-generator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    const body = await c.req.parseBody();
    const mnemonic = (body.mnemonic || "").toString().trim();
    const passphrase = (body.passphrase || "").toString();

    const t0 = performance.now();
    const response = bip39Engine.dispatch({
      action: "bip39/validate",
      requestId: `srv-${Date.now()}`,
      params: { mnemonic, passphrase }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg);
    }

    const { isValid, wordCount, seedHex } = response.data;
    const badgeColor = isValid ? "#34d399" : "#ef4444";
    const statusText = isValid ? `✅ 助记词格式与 SHA-256 校验和完全合法 (${wordCount} 词)` : `❌ 校验失败：单词非法或校验和不匹配 (${wordCount} 词)`;

    return c.html(`
      <div class="result-box" style="border-color:${badgeColor};">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: BIP-39 校验核验</span>
          <span class="badge-time">⚡ ${duration} ms</span>
        </div>
        <div style="font-size:14px; font-weight:bold; color:${badgeColor}; margin:6px 0;">
          ${statusText}
        </div>
        ${isValid && seedHex ? `
          <div style="font-size:12px; color:var(--text-muted); margin-top:6px;">派生种子 (512-bit Seed):</div>
          <div class="result-value" style="font-size:11px; color:#38bdf8; word-break:break-all;">${seedHex}</div>
        ` : ''}
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>校验失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端 HMAC 全量生成 (由 HTMX 调用)
app.post("/api/backend/hmac/all", async (c) => {
  try {
    if (!hmacEngine) {
      throw new Error("hmac-generator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    const body = await c.req.parseBody();
    const text = (body.text || "").toString();
    const secretKey = (body.secretKey || "").toString();
    const format = (body.format || "hex").toString();

    const t0 = performance.now();
    const response = hmacEngine.dispatch({
      action: "hmac/all",
      requestId: `srv-${Date.now()}`,
      params: { text, secretKey, format }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg);
    }

    const d = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: HMAC 5 大算法矩阵</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生极速运算)</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px; margin:8px 0;">
          <div class="hash-row" style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:6px; font-size:13px; font-family:var(--font-mono);">
            <span style="color:#f97316; font-weight:bold; width:110px;">HMAC-MD5</span>
            <span id="srv-hmac-md5" style="color:#f1f5f9; word-break:break-all; flex:1;">${d.md5}</span>
            <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.2); cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-hmac-md5').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
          <div class="hash-row" style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:6px; font-size:13px; font-family:var(--font-mono);">
            <span style="color:#38bdf8; font-weight:bold; width:110px;">HMAC-SHA1</span>
            <span id="srv-hmac-sha1" style="color:#f1f5f9; word-break:break-all; flex:1;">${d.sha1}</span>
            <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.2); cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-hmac-sha1').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
          <div class="hash-row" style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:6px; font-size:13px; font-family:var(--font-mono);">
            <span style="color:#34d399; font-weight:bold; width:110px;">HMAC-SHA256</span>
            <span id="srv-hmac-sha256" style="color:#34d399; word-break:break-all; flex:1; font-weight:bold;">${d.sha256}</span>
            <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid #34d399; cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-hmac-sha256').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
          <div class="hash-row" style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:6px; font-size:13px; font-family:var(--font-mono);">
            <span style="color:#eab308; font-weight:bold; width:110px;">HMAC-SHA512</span>
            <span id="srv-hmac-sha512" style="color:#f1f5f9; word-break:break-all; flex:1; font-size:11px;">${d.sha512}</span>
            <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.2); cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-hmac-sha512').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
          <div class="hash-row" style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:6px; font-size:13px; font-family:var(--font-mono);">
            <span style="color:#a855f7; font-weight:bold; width:110px;">HMAC-SHA3-256</span>
            <span id="srv-hmac-sha3" style="color:#f1f5f9; word-break:break-all; flex:1;">${d.sha3_256}</span>
            <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.2); cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-hmac-sha3').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
        </div>
        <div class="token-meta" style="display:flex; gap:16px; font-size:12px; color:var(--text-muted);">
          <span>编码: <strong style="color:#fff;">${d.format.toUpperCase()}</strong></span>
          <span>密钥长度: <strong style="color:#38bdf8;">${secretKey.length} 字符</strong></span>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>计算失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端 HMAC 恒定时间校验 (由 HTMX 调用)
app.post("/api/backend/hmac/verify", async (c) => {
  try {
    if (!hmacEngine) {
      throw new Error("hmac-generator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    const body = await c.req.parseBody();
    const text = (body.text || "").toString();
    const secretKey = (body.secretKey || "").toString();
    const hmac = (body.hmac || "").toString().trim();
    const algorithm = (body.algorithm || "sha256").toString();
    const format = (body.format || "hex").toString();

    const t0 = performance.now();
    const response = hmacEngine.dispatch({
      action: "hmac/verify",
      requestId: `srv-${Date.now()}`,
      params: { text, secretKey, hmac, algorithm, format }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg);
    }

    const { valid } = response.data;
    const badgeColor = valid ? "#34d399" : "#ef4444";
    const statusText = valid ? `✅ HMAC 恒定时间比对通过：消息认证完全有效 (${algorithm.toUpperCase()})` : `❌ HMAC 比对失败：消息被篡改或密钥错误 (${algorithm.toUpperCase()})`;

    return c.html(`
      <div class="result-box" style="border-color:${badgeColor};">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: 恒定时间校验</span>
          <span class="badge-time">⚡ ${duration} ms (防时序侧信道)</span>
        </div>
        <div style="font-size:14px; font-weight:bold; color:${badgeColor}; margin:4px 0;">
          ${statusText}
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>校验失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端 RSA 密钥对生成 (由 HTMX 调用)
app.post("/api/backend/rsa/generate", async (c) => {
  try {
    if (!rsaEngine) {
      throw new Error("rsa-key-pair.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    const body = await c.req.parseBody();
    const bits = parseInt(body.bits) || 2048;
    const format = (body.format || "pkcs8").toString();

    const t0 = performance.now();
    const response = rsaEngine.dispatch({
      action: "rsa/generate",
      requestId: `srv-${Date.now()}`,
      params: {
        bits,
        seed: Math.floor(Math.random() * 0xFFFFFFFF)
      }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg);
    }

    const d = response.data;
    const pubPem = format === "pkcs1" ? d.publicKeyPkcs1Pem : d.publicKeyPkcs8Pem;
    const privPem = format === "pkcs1" ? d.privateKeyPkcs1Pem : d.privateKeyPkcs8Pem;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: RSA-${d.bits} (${format.toUpperCase()})</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 原生极速生成)</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:12px; margin:10px 0;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <span style="font-size:12px; color:var(--text-muted);">公钥 (${format.toUpperCase()} Public Key):</span>
              <button type="button" class="btn-copy" style="padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid #34d399; cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-rsa-pub').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制公钥', 1500)">复制公钥</button>
            </div>
            <pre id="srv-rsa-pub" style="background:rgba(0,0,0,0.4); padding:10px; border-radius:6px; font-family:var(--font-mono); font-size:11px; color:#34d399; overflow-x:auto; margin:0; max-height:140px;">${pubPem}</pre>
          </div>
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <span style="font-size:12px; color:var(--text-muted);">私钥 (${format.toUpperCase()} Private Key):</span>
              <button type="button" class="btn-copy" style="padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid #f97316; cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-rsa-priv').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制私钥', 1500)">复制私钥</button>
            </div>
            <pre id="srv-rsa-priv" style="background:rgba(0,0,0,0.4); padding:10px; border-radius:6px; font-family:var(--font-mono); font-size:11px; color:#f97316; overflow-x:auto; margin:0; max-height:140px;">${privPem}</pre>
          </div>
        </div>
        <div class="token-meta" style="display:flex; gap:16px; font-size:12px; color:var(--text-muted);">
          <span>模长: <strong style="color:#fff;">${d.bits} bits</strong></span>
          <span>标准: <strong style="color:#38bdf8;">${format.toUpperCase()} PEM</strong></span>
          <span>算法: <strong style="color:#34d399;">RSA (PKCS#1 / PKCS#8)</strong></span>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>RSA 生成失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端密码强度评估 (由 HTMX 调用)
app.post("/api/backend/password/analyze", async (c) => {
  try {
    if (!passwordStrengthEngine) {
      throw new Error("password-strength.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    const body = await c.req.parseBody();
    const password = (body.password || "").toString();

    const t0 = performance.now();
    const response = passwordStrengthEngine.dispatch({
      action: "password/analyze",
      requestId: `srv-${Date.now()}`,
      params: { password }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg);
    }

    const d = response.data;
    const scoreColors = ["#ef4444", "#f97316", "#eab308", "#38bdf8", "#34d399"];
    const scorePercent = [15, 35, 60, 85, 100][d.score];
    const color = scoreColors[d.score];

    return c.html(`
      <div class="result-box" style="border-color:${color};">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: ${d.scoreText} (${d.score} / 4)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 原生极速分析)</span>
        </div>
        
        <!-- 强度进度条 -->
        <div style="background:rgba(255,255,255,0.1); height:8px; border-radius:4px; overflow:hidden; margin:10px 0;">
          <div style="background:${color}; width:${scorePercent}%; height:100%; transition:width 0.3s ease;"></div>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:10px; margin:10px 0; font-size:12px;">
          <div style="background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:6px;">
            <span style="color:var(--text-muted);">香农密码熵:</span> <strong style="color:${color};">${d.entropyBits.toFixed(1)} bits</strong>
          </div>
          <div style="background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:6px;">
            <span style="color:var(--text-muted);">在线暴力破解 (100次/秒):</span> <strong style="color:#fff;">${d.crackTimes.online100PerSec}</strong>
          </div>
          <div style="background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:6px;">
            <span style="color:var(--text-muted);">离线慢速哈希 (1万次/秒):</span> <strong style="color:#fff;">${d.crackTimes.offlineSlowHash10kPerSec}</strong>
          </div>
          <div style="background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:6px;">
            <span style="color:var(--text-muted);">离线 GPU 集群 (百亿次/秒):</span> <strong style="color:#fff;">${d.crackTimes.offlineFastHash10GPerSec}</strong>
          </div>
        </div>

        ${d.warning ? `
          <div style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); padding:8px 12px; border-radius:6px; font-size:12px; color:#fca5a5; margin-top:8px;">
            ⚠️ <strong>风险预警:</strong> ${d.warning}
          </div>
        ` : ''}

        <div style="margin-top:8px; font-size:12px; color:var(--text-muted);">
          💡 <strong>改进建议:</strong> ${d.suggestions.join(" | ")}
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>评估失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 PDF 内置签名示例 Base64
app.get("/api/backend/pdf/sample", async (c) => {
  try {
    if (!pdfSignatureEngine) {
      throw new Error("pdf-signature.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    const response = pdfSignatureEngine.dispatch({
      action: "pdf/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });

    if (response.code !== 0) {
      throw new Error(response.msg);
    }

    return c.json(response.data);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// API: 后端 PDF 签名检测与完整性解析 (由 HTMX 调用)
app.post("/api/backend/pdf/inspect", async (c) => {
  try {
    if (!pdfSignatureEngine) {
      throw new Error("pdf-signature.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    const body = await c.req.parseBody();
    let pdfBase64 = (body.pdfBase64 || "").toString().trim();

    // 如果上传了文件
    if (body.pdfFile && typeof body.pdfFile === "object" && body.pdfFile.arrayBuffer) {
      const buffer = await body.pdfFile.arrayBuffer();
      pdfBase64 = Buffer.from(buffer).toString("base64");
    }

    if (!pdfBase64) {
      throw new Error("请提供有效的 PDF 文件或 Base64 数据编码");
    }
    pdfBase64 = pdfBase64.replace(/ /g, "+");

    const t0 = performance.now();
    const response = pdfSignatureEngine.dispatch({
      action: "pdf/inspect",
      requestId: `srv-${Date.now()}`,
      params: { pdfBase64 }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg);
    }

    const d = response.data;
    const badgeColor = d.hasSignatures ? "#34d399" : "#f97316";

    return c.html(`
      <div class="result-box" style="border-color:${badgeColor};">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: PDF ${d.pdfVersion} (${d.fileSizeBytes} 字节)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 原生结构化解析)</span>
        </div>

        <div style="font-size:14px; font-weight:bold; color:${badgeColor}; margin:8px 0;">
          ${d.hasSignatures ? `✅ 成功检测到 ${d.signatureCount} 个数字签名 (/Type /Sig)` : `⚠️ 未在文档中发现任何数字签名 (/Type /Sig)`}
        </div>

        ${d.signatures.map((sig) => `
          <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.08); padding:12px; border-radius:8px; margin-top:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-weight:600; color:#38bdf8;">🔏 签名者: ${sig.signerName}</span>
              <span style="font-size:11px; padding:2px 8px; border-radius:4px; background:${sig.byteRangeValid ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)'}; color:${sig.byteRangeValid ? '#34d399' : '#f87171'};">
                ${sig.byteRangeValid ? '✅ ByteRange 完整性闭合' : '❌ ByteRange 校验越界'}
              </span>
            </div>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:6px; font-size:12px; color:var(--text-muted);">
              <div>签名标准 (SubFilter): <strong style="color:#fff;">${sig.subFilter}</strong></div>
              <div>加密引擎 (Filter): <strong style="color:#fff;">${sig.filter}</strong></div>
              <div>签名时间戳: <strong style="color:#fff;">${sig.signDate}</strong></div>
              <div>签名签署原因: <strong style="color:#fff;">${sig.reason}</strong></div>
              <div>签署物理位置: <strong style="color:#fff;">${sig.location}</strong></div>
              <div>签名数据长度: <strong style="color:#fff;">${sig.signatureLengthBytes} 字节 (PKCS#7)</strong></div>
            </div>
            <div style="margin-top:8px; font-size:11px; color:#94a3b8; font-family:var(--font-mono); background:rgba(0,0,0,0.2); padding:4px 8px; border-radius:4px;">
              ByteRange 校验细节: ${sig.byteRangeDetails}
            </div>
          </div>
        `).join("")}
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>PDF 签名检测失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: YAML 转 JSON (由 HTMX 调用)
app.post("/api/backend/yaml/to-json", async (c) => {
  const start = performance.now();
  try {
    const body = await c.req.parseBody();
    const yaml = (body.yaml || "").toString();
    const indent = parseInt(body.indent || "2", 10);

    if (!yamlToJsonEngine) {
      throw new Error("yaml-to-json WASM 引擎未就绪");
    }

    const response = yamlToJsonEngine.dispatch({
      action: "yaml/to-json",
      requestId: `srv-${Date.now()}`,
      params: {
        yaml,
        indent: isNaN(indent) ? 2 : indent
      }
    });

    const duration = (performance.now() - start).toFixed(2);

    if (response.code !== 0) {
      throw new Error(response.msg || "转换 YAML 失败");
    }

    const d = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: YAML ➜ JSON (缩进: ${d.indent} 空格)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>输入 YAML 大小: <strong>${d.sourceSizeBytes} 字节</strong></span>
          <span>转换 JSON 大小: <strong>${d.targetSizeBytes} 字节</strong></span>
        </div>
        <pre class="code-preview" style="max-height:280px; overflow-y:auto; background:rgba(0,0,0,0.4); padding:10px; border-radius:6px; font-size:12px; font-family:var(--font-mono); color:#38bdf8;"><code>${d.json.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>YAML 转 JSON 失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 YAML 示例模版
app.get("/api/backend/yaml/sample", async (c) => {
  try {
    if (!yamlToJsonEngine) {
      throw new Error("yaml-to-json WASM 引擎未就绪");
    }
    const response = yamlToJsonEngine.dispatch({
      action: "yaml/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.text(response.data.yaml);
  } catch (err) {
    return c.text("# 获取示例失败: " + err.message, 500);
  }
});

// API: YAML 转 TOML (由 HTMX 调用)
app.post("/api/backend/yaml/to-toml", async (c) => {
  const start = performance.now();
  try {
    const body = await c.req.parseBody();
    const yaml = (body.yaml || "").toString();
    const pretty = body.pretty !== "false";

    if (!yamlToTomlEngine) {
      throw new Error("yaml-to-toml WASM 引擎未就绪");
    }

    const response = yamlToTomlEngine.dispatch({
      action: "yaml/to-toml",
      requestId: `srv-${Date.now()}`,
      params: { yaml, pretty }
    });

    const duration = (performance.now() - start).toFixed(2);

    if (response.code !== 0) {
      throw new Error(response.msg || "转换 YAML 失败");
    }

    const d = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: YAML ➜ TOML (${d.lineCount} 行)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>输入 YAML 大小: <strong>${d.sourceSizeBytes} 字节</strong></span>
          <span>转换 TOML 大小: <strong>${d.targetSizeBytes} 字节</strong></span>
        </div>
        <pre class="code-preview" style="max-height:280px; overflow-y:auto; background:rgba(0,0,0,0.4); padding:10px; border-radius:6px; font-size:12px; font-family:var(--font-mono); color:#a7f3d0;"><code>${d.toml.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>YAML 转 TOML 失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 YAML 示例模版 (TOML)
app.get("/api/backend/yaml-to-toml/sample", async (c) => {
  try {
    if (!yamlToTomlEngine) {
      throw new Error("yaml-to-toml WASM 引擎未就绪");
    }
    const response = yamlToTomlEngine.dispatch({
      action: "yaml/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.text(response.data.yaml);
  } catch (err) {
    return c.text("# 获取示例失败: " + err.message, 500);
  }
});

// API: JSON 转 YAML (由 HTMX 调用)
app.post("/api/backend/json/to-yaml", async (c) => {
  const start = performance.now();
  try {
    const body = await c.req.parseBody();
    const json = (body.json || "").toString();

    if (!jsonToYamlEngine) {
      throw new Error("json-to-yaml WASM 引擎未就绪");
    }

    const response = jsonToYamlEngine.dispatch({
      action: "json/to-yaml",
      requestId: `srv-${Date.now()}`,
      params: { json }
    });

    const duration = (performance.now() - start).toFixed(2);

    if (response.code !== 0) {
      throw new Error(response.msg || "转换 JSON 失败");
    }

    const d = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: JSON ➜ YAML (${d.lineCount} 行)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>输入 JSON 大小: <strong>${d.sourceSizeBytes} 字节</strong></span>
          <span>转换 YAML 大小: <strong>${d.targetSizeBytes} 字节</strong></span>
        </div>
        <pre class="code-preview" style="max-height:280px; overflow-y:auto; background:rgba(0,0,0,0.4); padding:10px; border-radius:6px; font-size:12px; font-family:var(--font-mono); color:#fbbf24;"><code>${d.yaml.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>JSON 转 YAML 失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 JSON 示例模版
app.get("/api/backend/json-to-yaml/sample", async (c) => {
  try {
    if (!jsonToYamlEngine) {
      throw new Error("json-to-yaml WASM 引擎未就绪");
    }
    const response = jsonToYamlEngine.dispatch({
      action: "json/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.text(response.data.json);
  } catch (err) {
    return c.text("# 获取示例失败: " + err.message, 500);
  }
});

// API: JSON 转 TOML (由 HTMX 调用)
app.post("/api/backend/json/to-toml", async (c) => {
  const start = performance.now();
  try {
    const body = await c.req.parseBody();
    const json = (body.json || "").toString();
    const pretty = body.pretty !== "false";

    if (!jsonToTomlEngine) {
      throw new Error("json-to-toml WASM 引擎未就绪");
    }

    const response = jsonToTomlEngine.dispatch({
      action: "json/to-toml",
      requestId: `srv-${Date.now()}`,
      params: { json, pretty }
    });

    const duration = (performance.now() - start).toFixed(2);

    if (response.code !== 0) {
      throw new Error(response.msg || "转换 JSON 失败");
    }

    const d = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: JSON ➜ TOML (${d.lineCount} 行)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>输入 JSON 大小: <strong>${d.sourceSizeBytes} 字节</strong></span>
          <span>转换 TOML 大小: <strong>${d.targetSizeBytes} 字节</strong></span>
        </div>
        <pre class="code-preview" style="max-height:280px; overflow-y:auto; background:rgba(0,0,0,0.4); padding:10px; border-radius:6px; font-size:12px; font-family:var(--font-mono); color:#f472b6;"><code>${d.toml.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>JSON 转 TOML 失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 JSON 示例模版 (TOML)
app.get("/api/backend/json-to-toml/sample", async (c) => {
  try {
    if (!jsonToTomlEngine) {
      throw new Error("json-to-toml WASM 引擎未就绪");
    }
    const response = jsonToTomlEngine.dispatch({
      action: "json/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.text(response.data.json);
  } catch (err) {
    return c.text("# 获取示例失败: " + err.message, 500);
  }
});

// API: TOML 转 JSON (由 HTMX 调用)
app.post("/api/backend/toml/to-json", async (c) => {
  const start = performance.now();
  try {
    const body = await c.req.parseBody();
    const toml = (body.toml || "").toString();
    const indent = parseInt(body.indent || "2", 10);

    if (!tomlToJsonEngine) {
      throw new Error("toml-to-json WASM 引擎未就绪");
    }

    const response = tomlToJsonEngine.dispatch({
      action: "toml/to-json",
      requestId: `srv-${Date.now()}`,
      params: {
        toml,
        indent: isNaN(indent) ? 2 : indent
      }
    });

    const duration = (performance.now() - start).toFixed(2);

    if (response.code !== 0) {
      throw new Error(response.msg || "转换 TOML 失败");
    }

    const d = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: TOML ➜ JSON (缩进: ${d.indent} 空格)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>输入 TOML 大小: <strong>${d.sourceSizeBytes} 字节</strong></span>
          <span>转换 JSON 大小: <strong>${d.targetSizeBytes} 字节</strong></span>
        </div>
        <pre class="code-preview" style="max-height:280px; overflow-y:auto; background:rgba(0,0,0,0.4); padding:10px; border-radius:6px; font-size:12px; font-family:var(--font-mono); color:#38bdf8;"><code>${d.json.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>TOML 转 JSON 失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 TOML 示例模版
app.get("/api/backend/toml/sample", async (c) => {
  try {
    if (!tomlToJsonEngine) {
      throw new Error("toml-to-json WASM 引擎未就绪");
    }
    const response = tomlToJsonEngine.dispatch({
      action: "toml/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.text(response.data.toml);
  } catch (err) {
    return c.text("# 获取示例失败: " + err.message, 500);
  }
});

// API: TOML 转 YAML (由 HTMX 调用)
app.post("/api/backend/toml/to-yaml", async (c) => {
  const start = performance.now();
  try {
    const body = await c.req.parseBody();
    const toml = (body.toml || "").toString();

    if (!tomlToYamlEngine) {
      throw new Error("toml-to-yaml WASM 引擎未就绪");
    }

    const response = tomlToYamlEngine.dispatch({
      action: "toml/to-yaml",
      requestId: `srv-${Date.now()}`,
      params: { toml }
    });

    const duration = (performance.now() - start).toFixed(2);

    if (response.code !== 0) {
      throw new Error(response.msg || "转换 TOML 失败");
    }

    const d = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: TOML ➜ YAML (${d.lineCount} 行)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>输入 TOML 大小: <strong>${d.sourceSizeBytes} 字节</strong></span>
          <span>转换 YAML 大小: <strong>${d.targetSizeBytes} 字节</strong></span>
        </div>
        <pre class="code-preview" style="max-height:280px; overflow-y:auto; background:rgba(0,0,0,0.4); padding:10px; border-radius:6px; font-size:12px; font-family:var(--font-mono); color:#f59e0b;"><code>${d.yaml.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>TOML 转 YAML 失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 TOML 示例模版 (YAML)
app.get("/api/backend/toml-to-yaml/sample", async (c) => {
  try {
    if (!tomlToYamlEngine) {
      throw new Error("toml-to-yaml WASM 引擎未就绪");
    }
    const response = tomlToYamlEngine.dispatch({
      action: "toml/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.text(response.data.toml);
  } catch (err) {
    return c.text("# 获取示例失败: " + err.message, 500);
  }
});

// API: HTMX 提交 XML 转 JSON
app.post("/api/backend/xml/to-json", async (c) => {
  try {
    const body = await c.req.parseBody();
    const xml = (body.xml || "").toString();
    const indent = parseInt(body.indent || "2", 10);

    if (!xml.trim()) {
      return c.html(`
        <div class="result-box error">
          <strong>转换失败:</strong> 输入的 XML 内容不能为空
        </div>
      `, 400);
    }

    if (!xmlToJsonEngine) {
      throw new Error("xml-to-json WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = xmlToJsonEngine.dispatch({
      action: "xml/to-json",
      requestId: `srv-${Date.now()}`,
      params: { xml, indent }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>XML 解析转换失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: XML ➜ JSON (缩进: ${d.indent} 空格)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>输入 XML 大小: <strong>${d.sourceSizeBytes} 字节</strong></span>
          <span>转换 JSON 大小: <strong>${d.targetSizeBytes} 字节</strong></span>
        </div>
        <pre class="code-preview" style="max-height:280px; overflow-y:auto; background:rgba(0,0,0,0.4); padding:10px; border-radius:6px; font-size:12px; font-family:var(--font-mono); color:#38bdf8;"><code>${d.json.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>XML 转 JSON 失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 XML 示例模版
app.get("/api/backend/xml-to-json/sample", async (c) => {
  try {
    if (!xmlToJsonEngine) {
      throw new Error("xml-to-json WASM 引擎未就绪");
    }
    const response = xmlToJsonEngine.dispatch({
      action: "xml/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.text(response.data.xml);
  } catch (err) {
    return c.text("<!-- 获取示例失败: " + err.message + " -->", 500);
  }
});

// API: HTMX 提交 JSON 转 XML
app.post("/api/backend/json/to-xml", async (c) => {
  try {
    const body = await c.req.parseBody();
    const json = (body.json || "").toString();
    const rootName = (body.rootName || "").toString().trim() || null;
    const indent = parseInt(body.indent || "2", 10);

    if (!json.trim()) {
      return c.html(`
        <div class="result-box error">
          <strong>转换失败:</strong> 输入的 JSON 内容不能为空
        </div>
      `, 400);
    }

    if (!jsonToXmlEngine) {
      throw new Error("json-to-xml WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = jsonToXmlEngine.dispatch({
      action: "json/to-xml",
      requestId: `srv-${Date.now()}`,
      params: { json, rootName, indent }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>JSON 转换 XML 失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: JSON ➜ XML (缩进: ${d.indent} 空格)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>输入 JSON 大小: <strong>${d.sourceSizeBytes} 字节</strong></span>
          <span>转换 XML 大小: <strong>${d.targetSizeBytes} 字节</strong></span>
        </div>
        <pre class="code-preview" style="max-height:280px; overflow-y:auto; background:rgba(0,0,0,0.4); padding:10px; border-radius:6px; font-size:12px; font-family:var(--font-mono); color:#f59e0b;"><code>${d.xml.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>JSON 转 XML 失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 JSON 示例模版 (XML)
app.get("/api/backend/json-to-xml/sample", async (c) => {
  try {
    if (!jsonToXmlEngine) {
      throw new Error("json-to-xml WASM 引擎未就绪");
    }
    const response = jsonToXmlEngine.dispatch({
      action: "json/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.text(response.data.json);
  } catch (err) {
    return c.text("{}", 500);
  }
});

// API: HTMX 提交 JSON 转 CSV
app.post("/api/backend/json/to-csv", async (c) => {
  try {
    const body = await c.req.parseBody();
    const json = (body.json || "").toString();
    const delimiter = (body.delimiter || ",").toString();
    const includeHeaders = body.includeHeaders !== "false";
    const flatten = body.flatten !== "false";

    if (!json.trim()) {
      return c.html(`
        <div class="result-box error">
          <strong>转换失败:</strong> 输入的 JSON 内容不能为空
        </div>
      `, 400);
    }

    if (!jsonToCsvEngine) {
      throw new Error("json-to-csv WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = jsonToCsvEngine.dispatch({
      action: "json/to-csv",
      requestId: `srv-${Date.now()}`,
      params: { json, delimiter, includeHeaders, flatten }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>JSON 转换 CSV 失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: JSON ➜ CSV (${d.rowCount} 行, 分隔符: '${d.delimiter}')</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>输入 JSON 大小: <strong>${d.sourceSizeBytes} 字节</strong></span>
          <span>转换 CSV 大小: <strong>${d.targetSizeBytes} 字节</strong></span>
        </div>
        <pre class="code-preview" style="max-height:280px; overflow-y:auto; background:rgba(0,0,0,0.4); padding:10px; border-radius:6px; font-size:12px; font-family:var(--font-mono); color:#38bdf8;"><code>${d.csv.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>JSON 转 CSV 失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 JSON 示例模版 (CSV)
app.get("/api/backend/json-to-csv/sample", async (c) => {
  try {
    if (!jsonToCsvEngine) {
      throw new Error("json-to-csv WASM 引擎未就绪");
    }
    const response = jsonToCsvEngine.dispatch({
      action: "json/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.text(response.data.json);
  } catch (err) {
    return c.text("[]", 500);
  }
});

// API: HTMX 提交 Base64 编码
app.post("/api/backend/base64/encode", async (c) => {
  try {
    const body = await c.req.parseBody();
    const text = (body.text || "").toString();
    const urlSafe = body.urlSafe === "true";
    const padding = body.padding !== "false";

    if (!text) {
      return c.html(`
        <div class="result-box error">
          <strong>编码失败:</strong> 输入的待编码文本不能为空
        </div>
      `, 400);
    }

    if (!base64StringEngine) {
      throw new Error("base64-string WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = base64StringEngine.dispatch({
      action: "base64/encode",
      requestId: `srv-${Date.now()}`,
      params: { text, urlSafe, padding }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>Base64 编码失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: Base64 编码 (${d.urlSafe ? "URL-Safe" : "Standard"})</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>输入文本大小: <strong>${d.sourceSizeBytes} 字节</strong></span>
          <span>Base64 字符串长度: <strong>${d.targetSizeBytes} 字符</strong></span>
        </div>
        <textarea readonly style="width:100%; padding:10px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:6px; font-family:var(--font-mono); font-size:12px; color:#38bdf8; box-sizing:border-box; resize:vertical;" rows="4">${d.base64}</textarea>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>Base64 编码失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: HTMX 提交 Base64 解码
app.post("/api/backend/base64/decode", async (c) => {
  try {
    const body = await c.req.parseBody();
    const base64 = (body.base64 || "").toString();
    const urlSafe = body.urlSafe === "true";

    if (!base64.trim()) {
      return c.html(`
        <div class="result-box error">
          <strong>解码失败:</strong> 输入的 Base64 内容不能为空
        </div>
      `, 400);
    }

    if (!base64StringEngine) {
      throw new Error("base64-string WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = base64StringEngine.dispatch({
      action: "base64/decode",
      requestId: `srv-${Date.now()}`,
      params: { base64, urlSafe }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>Base64 解码失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: Base64 解码成功</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>输入 Base64 长度: <strong>${d.sourceSizeBytes} 字符</strong></span>
          <span>解码文本大小: <strong>${d.targetSizeBytes} 字节</strong></span>
        </div>
        <textarea readonly style="width:100%; padding:10px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:6px; font-family:var(--font-mono); font-size:12px; color:#34d399; box-sizing:border-box; resize:vertical;" rows="4">${d.text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</textarea>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>Base64 解码失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 Base64 示例
app.get("/api/backend/base64/sample", async (c) => {
  try {
    if (!base64StringEngine) {
      throw new Error("base64-string WASM 引擎未就绪");
    }
    const response = base64StringEngine.dispatch({
      action: "base64/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.json(response.data);
  } catch (err) {
    return c.json({ text: "Hello WasmForge!", base64: "SGVsbG8gV2FzbUZvcmdlIQ==" }, 500);
  }
});

// API: HTMX 提交 Base64 转 Data URL
app.post("/api/backend/base64-file/to-data-url", async (c) => {
  try {
    const body = await c.req.parseBody();
    const base64 = (body.base64 || "").toString();
    const fileName = (body.fileName || "").toString();
    const mimeType = (body.mimeType || "").toString();

    if (!base64.trim()) {
      return c.html(`
        <div class="result-box error">
          <strong>转换失败:</strong> 输入的 Base64 文件内容不能为空
        </div>
      `, 400);
    }

    if (!base64FileEngine) {
      throw new Error("base64-file WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = base64FileEngine.dispatch({
      action: "file/to-data-url",
      requestId: `srv-${Date.now()}`,
      params: { base64, fileName: fileName || undefined, mimeType: mimeType || undefined }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>Data URL 转换失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    const isImage = d.mimeType.startsWith("image/");
    const previewHtml = isImage
      ? `<div style="margin-top:10px; display:flex; align-items:center; gap:12px;">
           <span style="font-size:12px; color:var(--text-muted);">图像预览:</span>
           <img src="${d.dataUrl}" style="max-height:80px; max-width:120px; object-fit:contain; border-radius:6px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); padding:4px;" alt="preview" />
         </div>`
      : "";

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: Data URL 封装成功</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>文件名: <strong style="color:var(--text-primary);">${d.fileName}</strong></span>
          <span>MIME 类型: <strong style="color:#38bdf8;">${d.mimeType}</strong></span>
          <span>解码文件大小: <strong>${d.fileSizeBytes} 字节</strong></span>
          <span>Base64 字符数: <strong>${d.base64SizeBytes}</strong></span>
        </div>
        <textarea readonly style="width:100%; padding:10px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:6px; font-family:var(--font-mono); font-size:12px; color:#38bdf8; box-sizing:border-box; resize:vertical;" rows="4">${d.dataUrl}</textarea>
        ${previewHtml}
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>Data URL 转换失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: HTMX 提交 Data URL 解析
app.post("/api/backend/base64-file/from-data-url", async (c) => {
  try {
    const body = await c.req.parseBody();
    const dataUrl = (body.dataUrl || "").toString();

    if (!dataUrl.trim()) {
      return c.html(`
        <div class="result-box error">
          <strong>解析失败:</strong> 输入的 Data URL 不能为空
        </div>
      `, 400);
    }

    if (!base64FileEngine) {
      throw new Error("base64-file WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = base64FileEngine.dispatch({
      action: "file/from-data-url",
      requestId: `srv-${Date.now()}`,
      params: { dataUrl }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>Data URL 解析失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    const isImage = d.mimeType.startsWith("image/");
    const previewHtml = isImage
      ? `<div style="margin-top:10px; display:flex; align-items:center; gap:12px;">
           <span style="font-size:12px; color:var(--text-muted);">图像预览:</span>
           <img src="${dataUrl}" style="max-height:80px; max-width:120px; object-fit:contain; border-radius:6px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); padding:4px;" alt="preview" />
         </div>`
      : "";

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: Data URL 解析成功</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>提取 MIME 类型: <strong style="color:#38bdf8;">${d.mimeType}</strong></span>
          <span>二进制实体大小: <strong>${d.fileSizeBytes} 字节</strong></span>
          <span>Base64 纯数据长度: <strong>${d.base64.length} 字符</strong></span>
        </div>
        <textarea readonly style="width:100%; padding:10px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:6px; font-family:var(--font-mono); font-size:12px; color:#34d399; box-sizing:border-box; resize:vertical;" rows="4">${d.base64}</textarea>
        ${previewHtml}
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>Data URL 解析失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 Base64 File 示例
app.get("/api/backend/base64-file/sample", async (c) => {
  try {
    if (!base64FileEngine) {
      throw new Error("base64-file WASM 引擎未就绪");
    }
    const response = base64FileEngine.dispatch({
      action: "file/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.json(response.data);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// API: HTMX 提交颜色转换
app.post("/api/backend/color/convert", async (c) => {
  try {
    const body = await c.req.parseBody();
    const input = (body.color || body.input || "").toString().trim();

    if (!input) {
      return c.html(`
        <div class="result-box error">
          <strong>转换失败:</strong> 输入的颜色值不能为空
        </div>
      `, 400);
    }

    if (!colorConverterEngine) {
      throw new Error("color-converter WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = colorConverterEngine.dispatch({
      action: "color/convert",
      requestId: `srv-${Date.now()}`,
      params: { input }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>颜色转换失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    const textColor = d.is_light ? "#0f172a" : "#ffffff";
    const aaWhite = d.contrast_white >= 4.5 ? "✅ AA" : "❌";
    const aaBlack = d.contrast_black >= 4.5 ? "✅ AA" : "❌";

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: 全色彩空间转换与可访问性分析</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>

        <!-- 视觉展示色块 -->
        <div style="display:flex; gap:16px; align-items:center; margin-bottom:12px; background:rgba(0,0,0,0.3); padding:12px; border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
          <div style="width:72px; height:72px; border-radius:8px; background-color:${d.hex}; box-shadow:0 4px 12px rgba(0,0,0,0.4); border:2px solid rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; color:${textColor}; font-weight:bold; font-size:12px;">
            ${d.hex}
          </div>
          <div style="flex:1; font-size:12px; color:var(--text-muted); display:flex; flex-direction:column; gap:4px;">
            <div><strong>相对亮度 (Luminance):</strong> <span style="color:#38bdf8;">${d.luminance}</span> (${d.is_light ? "亮色基底" : "暗色基底"})</div>
            <div><strong>对白色对比度:</strong> <strong>${d.contrast_white}:1</strong> (${aaWhite})</div>
            <div><strong>对黑色对比度:</strong> <strong>${d.contrast_black}:1</strong> (${aaBlack})</div>
          </div>
        </div>

        <!-- 各格式芯片网格 -->
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:10px; font-family:var(--font-mono); font-size:12px;">
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">HEX</div>
            <strong style="color:#38bdf8;">${d.hex}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">HEX8 (含 Alpha)</div>
            <strong style="color:#38bdf8;">${d.hex8}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">RGB</div>
            <strong style="color:#34d399;">${d.rgb}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">HSL</div>
            <strong style="color:#a78bfa;">${d.hsl}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">HSV</div>
            <strong style="color:#fbbf24;">${d.hsv}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">CMYK</div>
            <strong style="color:#f43f5e;">${d.cmyk}</strong>
          </div>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>颜色转换失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 Color 示例调色板
app.get("/api/backend/color/sample", async (c) => {
  try {
    if (!colorConverterEngine) {
      throw new Error("color-converter WASM 引擎未就绪");
    }
    const response = colorConverterEngine.dispatch({
      action: "color/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.json(response.data);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// API: 模块统计信息
app.get("/api/stats", (c) => {
  const rsSize = fs.existsSync(rsWasmPath) ? fs.statSync(rsWasmPath).size : 0;
  const tsSize = fs.existsSync(tsWasmPath) ? fs.statSync(tsWasmPath).size : 0;
  const tokenSize = fs.existsSync(tokenWasmPath) ? fs.statSync(tokenWasmPath).size : 0;
  const hashSize = fs.existsSync(hashWasmPath) ? fs.statSync(hashWasmPath).size : 0;
  const bcryptSize = fs.existsSync(bcryptWasmPath) ? fs.statSync(bcryptWasmPath).size : 0;
  const uuidSize = fs.existsSync(uuidWasmPath) ? fs.statSync(uuidWasmPath).size : 0;
  const ulidSize = fs.existsSync(ulidWasmPath) ? fs.statSync(ulidWasmPath).size : 0;
  const encryptionSize = fs.existsSync(encryptionWasmPath) ? fs.statSync(encryptionWasmPath).size : 0;
  const bip39Size = fs.existsSync(bip39WasmPath) ? fs.statSync(bip39WasmPath).size : 0;
  const hmacSize = fs.existsSync(hmacWasmPath) ? fs.statSync(hmacWasmPath).size : 0;
  const rsaSize = fs.existsSync(rsaWasmPath) ? fs.statSync(rsaWasmPath).size : 0;
  const passwordStrengthSize = fs.existsSync(passwordStrengthWasmPath) ? fs.statSync(passwordStrengthWasmPath).size : 0;
  const pdfSignatureSize = fs.existsSync(pdfSignatureWasmPath) ? fs.statSync(pdfSignatureWasmPath).size : 0;
  const yamlToJsonSize = fs.existsSync(yamlToJsonWasmPath) ? fs.statSync(yamlToJsonWasmPath).size : 0;
  const yamlToTomlSize = fs.existsSync(yamlToTomlWasmPath) ? fs.statSync(yamlToTomlWasmPath).size : 0;
  const jsonToYamlSize = fs.existsSync(jsonToYamlWasmPath) ? fs.statSync(jsonToYamlWasmPath).size : 0;
  const jsonToTomlSize = fs.existsSync(jsonToTomlWasmPath) ? fs.statSync(jsonToTomlWasmPath).size : 0;
  const tomlToJsonSize = fs.existsSync(tomlToJsonWasmPath) ? fs.statSync(tomlToJsonWasmPath).size : 0;
  const tomlToYamlSize = fs.existsSync(tomlToYamlWasmPath) ? fs.statSync(tomlToYamlWasmPath).size : 0;
  const xmlToJsonSize = fs.existsSync(xmlToJsonWasmPath) ? fs.statSync(xmlToJsonWasmPath).size : 0;
  const jsonToXmlSize = fs.existsSync(jsonToXmlWasmPath) ? fs.statSync(jsonToXmlWasmPath).size : 0;
  const jsonToCsvSize = fs.existsSync(jsonToCsvWasmPath) ? fs.statSync(jsonToCsvWasmPath).size : 0;
  const base64StringSize = fs.existsSync(base64StringWasmPath) ? fs.statSync(base64StringWasmPath).size : 0;
  const base64FileSize = fs.existsSync(base64FileWasmPath) ? fs.statSync(base64FileWasmPath).size : 0;
  const colorConverterSize = fs.existsSync(colorConverterWasmPath) ? fs.statSync(colorConverterWasmPath).size : 0;
  return c.json({
    rust: {
      file: "rs.wasm",
      sizeBytes: rsSize,
      sizeFormatted: `${(rsSize / 1024).toFixed(2)} KB`,
    },
    ts: {
      file: "ts.wasm",
      sizeBytes: tsSize,
      sizeFormatted: `${(tsSize / 1024).toFixed(2)} KB`,
    },
    tokenGenerator: {
      file: "token-generator.wasm",
      sizeBytes: tokenSize,
      sizeFormatted: `${(tokenSize / 1024).toFixed(2)} KB`,
    },
    hashText: {
      file: "hash-text.wasm",
      sizeBytes: hashSize,
      sizeFormatted: `${(hashSize / 1024).toFixed(2)} KB`,
    },
    bcrypt: {
      file: "bcrypt.wasm",
      sizeBytes: bcryptSize,
      sizeFormatted: `${(bcryptSize / 1024).toFixed(2)} KB`,
    },
    uuidGenerator: {
      file: "uuid-generator.wasm",
      sizeBytes: uuidSize,
      sizeFormatted: `${(uuidSize / 1024).toFixed(2)} KB`,
    },
    ulidGenerator: {
      file: "ulid-generator.wasm",
      sizeBytes: ulidSize,
      sizeFormatted: `${(ulidSize / 1024).toFixed(2)} KB`,
    },
    encryption: {
      file: "encryption.wasm",
      sizeBytes: encryptionSize,
      sizeFormatted: `${(encryptionSize / 1024).toFixed(2)} KB`,
    },
    bip39: {
      file: "bip39-generator.wasm",
      sizeBytes: bip39Size,
      sizeFormatted: `${(bip39Size / 1024).toFixed(2)} KB`,
    },
    hmac: {
      file: "hmac-generator.wasm",
      sizeBytes: hmacSize,
      sizeFormatted: `${(hmacSize / 1024).toFixed(2)} KB`,
    },
    rsa: {
      file: "rsa-key-pair.wasm",
      sizeBytes: rsaSize,
      sizeFormatted: `${(rsaSize / 1024).toFixed(2)} KB`,
    },
    passwordStrength: {
      file: "password-strength.wasm",
      sizeBytes: passwordStrengthSize,
      sizeFormatted: `${(passwordStrengthSize / 1024).toFixed(2)} KB`,
    },
    pdfSignature: {
      file: "pdf-signature.wasm",
      sizeBytes: pdfSignatureSize,
      sizeFormatted: `${(pdfSignatureSize / 1024).toFixed(2)} KB`,
    },
    yamlToJson: {
      file: "yaml-to-json.wasm",
      sizeBytes: yamlToJsonSize,
      sizeFormatted: `${(yamlToJsonSize / 1024).toFixed(2)} KB`,
    },
    yamlToToml: {
      file: "yaml-to-toml.wasm",
      sizeBytes: yamlToTomlSize,
      sizeFormatted: `${(yamlToTomlSize / 1024).toFixed(2)} KB`,
    },
    jsonToYaml: {
      file: "json-to-yaml.wasm",
      sizeBytes: jsonToYamlSize,
      sizeFormatted: `${(jsonToYamlSize / 1024).toFixed(2)} KB`,
    },
    jsonToToml: {
      file: "json-to-toml.wasm",
      sizeBytes: jsonToTomlSize,
      sizeFormatted: `${(jsonToTomlSize / 1024).toFixed(2)} KB`,
    },
    tomlToJson: {
      file: "toml-to-json.wasm",
      sizeBytes: tomlToJsonSize,
      sizeFormatted: `${(tomlToJsonSize / 1024).toFixed(2)} KB`,
    },
    tomlToYaml: {
      file: "toml-to-yaml.wasm",
      sizeBytes: tomlToYamlSize,
      sizeFormatted: `${(tomlToYamlSize / 1024).toFixed(2)} KB`,
    },
    xmlToJson: {
      file: "xml-to-json.wasm",
      sizeBytes: xmlToJsonSize,
      sizeFormatted: `${(xmlToJsonSize / 1024).toFixed(2)} KB`,
    },
    jsonToXml: {
      file: "json-to-xml.wasm",
      sizeBytes: jsonToXmlSize,
      sizeFormatted: `${(jsonToXmlSize / 1024).toFixed(2)} KB`,
    },
    jsonToCsv: {
      file: "json-to-csv.wasm",
      sizeBytes: jsonToCsvSize,
      sizeFormatted: `${(jsonToCsvSize / 1024).toFixed(2)} KB`,
    },
    base64String: {
      file: "base64-string.wasm",
      sizeBytes: base64StringSize,
      sizeFormatted: `${(base64StringSize / 1024).toFixed(2)} KB`,
    },
    base64File: {
      file: "base64-file.wasm",
      sizeBytes: base64FileSize,
      sizeFormatted: `${(base64FileSize / 1024).toFixed(2)} KB`,
    },
    colorConverter: {
      file: "color-converter.wasm",
      sizeBytes: colorConverterSize,
      sizeFormatted: `${(colorConverterSize / 1024).toFixed(2)} KB`,
    },
  });
});

const port = 3000;
console.log(`🚀 Hono 服务已启动: http://localhost:${port}`);
serve({
  fetch: app.fetch,
  port
});
