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

let rsEngine = null;
let tsEngine = null;
let tokenEngine = null;
let hashEngine = null;
let bcryptEngine = null;
let uuidEngine = null;
let ulidEngine = null;
let encryptionEngine = null;
let bip39Engine = null;

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
  });
});

const port = 3000;
console.log(`🚀 Hono 服务已启动: http://localhost:${port}`);
serve({
  fetch: app.fetch,
  port
});
