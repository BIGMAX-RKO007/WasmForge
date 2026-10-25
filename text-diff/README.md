# @wasmforge/text-diff

Pure standalone WebAssembly module for high-performance text diffing, line-by-line comparison, character/word level inline diffs, and unified patch generation based on Myers algorithm.

## Features
- **Diff Modes**:
  - `lines`: Line-by-line diffing with insertions, deletions, unchanged lines, and line number mapping.
  - `words`: Word-level differences for prose and natural text.
  - `chars`: Character-level fine-grained diffing for strings/hashes.
- **Unified Diff Formatter**: Generates standard unified diff patches (`--- a/old.txt`, `+++ b/new.txt`, `@@ -1,3 +1,4 @@`).
- **Diff Statistics**: Calculates additions, deletions, modifications, similarity ratio (0.0 to 1.0).
- **Universal C-ABI**: Zero JS glue, standard `alloc`, `dealloc`, `dispatch`.
