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

let rsEngine = null;
let tsEngine = null;

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

// API: 模块统计信息
app.get("/api/stats", (c) => {
  const rsSize = fs.existsSync(rsWasmPath) ? fs.statSync(rsWasmPath).size : 0;
  const tsSize = fs.existsSync(tsWasmPath) ? fs.statSync(tsWasmPath).size : 0;
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
  });
});

const port = 3000;
console.log(`🚀 Hono 服务已启动: http://localhost:${port}`);
serve({
  fetch: app.fetch,
  port
});
