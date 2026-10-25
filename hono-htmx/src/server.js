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

let rsEngine = null;
let tsEngine = null;
let tokenEngine = null;
let hashEngine = null;
let bcryptEngine = null;
let uuidEngine = null;

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

// API: 模块统计信息
app.get("/api/stats", (c) => {
  const rsSize = fs.existsSync(rsWasmPath) ? fs.statSync(rsWasmPath).size : 0;
  const tsSize = fs.existsSync(tsWasmPath) ? fs.statSync(tsWasmPath).size : 0;
  const tokenSize = fs.existsSync(tokenWasmPath) ? fs.statSync(tokenWasmPath).size : 0;
  const hashSize = fs.existsSync(hashWasmPath) ? fs.statSync(hashWasmPath).size : 0;
  const bcryptSize = fs.existsSync(bcryptWasmPath) ? fs.statSync(bcryptWasmPath).size : 0;
  const uuidSize = fs.existsSync(uuidWasmPath) ? fs.statSync(uuidWasmPath).size : 0;
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
  });
});

const port = 3000;
console.log(`🚀 Hono 服务已启动: http://localhost:${port}`);
serve({
  fetch: app.fetch,
  port
});
