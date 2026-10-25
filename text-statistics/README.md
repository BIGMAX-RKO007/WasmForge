# @wasmforge/text-statistics

Pure standalone WebAssembly module for multilingual text analysis, CJK character segmenting, word count, line statistics, frequency distribution, and reading/speaking duration estimation.

## Features
- **Accurate Metric Calculations**:
  - Characters (total, without spaces, non-ASCII count, whitespace count)
  - Words (combining whitespace-delimited Latin tokens and CJK ideographs)
  - Lines (total, non-empty, empty)
  - Paragraphs & Sentences
- **Duration Model**:
  - Reading time (average silent reader ~225 wpm)
  - Speaking time (average audio speech ~140 wpm)
- **Top Word Frequency**:
  - Ranked histogram of most recurring words, ignoring punctuation and normalized to lowercase.
- **Universal C-ABI**: Zero JS glue, standard `alloc`, `dealloc`, `dispatch`.
