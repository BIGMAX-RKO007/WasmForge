import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { add, greet } = require("../pkg-node/rs_wasm.js");

describe("rs-wasm tests", () => {
  it("add(1, 2) should return 3", () => {
    assert.equal(add(1, 2), 3);
  });

  it("add(-5, 15) should return 10", () => {
    assert.equal(add(-5, 15), 10);
  });

  it("greet('Rust') should return formatted greeting string", () => {
    assert.equal(
      greet("Rust"),
      "Hello, Rust! This is WebAssembly powered by Rust 🦀"
    );
  });
});
