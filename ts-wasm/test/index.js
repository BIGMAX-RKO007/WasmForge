import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { add, greet } from "../build/debug.js";

describe("ts-wasm tests", () => {
  it("add", () => {
    assert.equal(add(1, 2), 3);
  });

  it("greet", () => {
    assert.equal(
      greet("AssemblyScript"),
      "Hello, AssemblyScript! This is WebAssembly powered by AssemblyScript 🚀"
    );
  });
});
