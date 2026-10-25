extern crate alloc;

use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec;
use alloc::vec::Vec;
use core::slice;
use serde::{Deserialize, Serialize};
use similar::{Algorithm, ChangeTag, TextDiff};

#[derive(Debug, Serialize, Deserialize)]
pub struct DiffChange {
    pub tag: String, // "equal", "insert", "delete"
    #[serde(rename = "oldLine")]
    pub old_line: Option<usize>,
    #[serde(rename = "newLine")]
    pub new_line: Option<usize>,
    pub value: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiffResult {
    pub mode: String,
    pub additions: usize,
    pub deletions: usize,
    pub unchanged: usize,
    pub similarity: f32,
    pub changes: Vec<DiffChange>,
    #[serde(rename = "unifiedPatch")]
    pub unified_patch: String,
}

pub fn compute_diff(old_text: &str, new_text: &str, mode: &str) -> DiffResult {
    let text_diff = match mode {
        "words" => TextDiff::configure().algorithm(Algorithm::Myers).diff_words(old_text, new_text),
        "chars" => TextDiff::configure().algorithm(Algorithm::Myers).diff_chars(old_text, new_text),
        _ => TextDiff::configure().algorithm(Algorithm::Myers).diff_lines(old_text, new_text),
    };

    let similarity = text_diff.ratio();
    let unified_patch = text_diff
        .unified_diff()
        .header("a/original.txt", "b/modified.txt")
        .to_string();

    let mut changes = Vec::new();
    let mut additions = 0;
    let mut deletions = 0;
    let mut unchanged = 0;

    let mut cur_old_line = 1;
    let mut cur_new_line = 1;

    for change in text_diff.iter_all_changes() {
        let tag_str = match change.tag() {
            ChangeTag::Equal => {
                unchanged += 1;
                "equal"
            }
            ChangeTag::Insert => {
                additions += 1;
                "insert"
            }
            ChangeTag::Delete => {
                deletions += 1;
                "delete"
            }
        };

        let (old_num, new_num) = match change.tag() {
            ChangeTag::Equal => {
                let o = Some(cur_old_line);
                let n = Some(cur_new_line);
                cur_old_line += 1;
                cur_new_line += 1;
                (o, n)
            }
            ChangeTag::Delete => {
                let o = Some(cur_old_line);
                cur_old_line += 1;
                (o, None)
            }
            ChangeTag::Insert => {
                let n = Some(cur_new_line);
                cur_new_line += 1;
                (None, n)
            }
        };

        changes.push(DiffChange {
            tag: tag_str.to_string(),
            old_line: old_num,
            new_line: new_num,
            value: change.value().to_string(),
        });
    }

    DiffResult {
        mode: mode.to_string(),
        additions,
        deletions,
        unchanged,
        similarity,
        changes,
        unified_patch,
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SamplePair {
    pub id: String,
    pub title: String,
    #[serde(rename = "oldText")]
    pub old_text: String,
    #[serde(rename = "newText")]
    pub new_text: String,
}

pub fn get_sample_pairs() -> Vec<SamplePair> {
    vec![
        SamplePair {
            id: "code-refactor".to_string(),
            title: "Rust 代码重构示例 (Function Refactor)".to_string(),
            old_text: "fn calculate(a: i32, b: i32) -> i32 {\n    let result = a + b;\n    println!(\"Result: {}\", result);\n    return result;\n}\n".to_string(),
            new_text: "fn calculate(a: i32, b: i32) -> i32 {\n    // Log computation in debug mode\n    #[cfg(debug_assertions)]\n    log::debug!(\"Computing: {} + {}\", a, b);\n    a + b\n}\n".to_string(),
        },
        SamplePair {
            id: "json-config".to_string(),
            title: "配置文件差异对比 (Config Update)".to_string(),
            old_text: "{\n  \"env\": \"staging\",\n  \"port\": 8080,\n  \"debug\": true,\n  \"workers\": 2\n}\n".to_string(),
            new_text: "{\n  \"env\": \"production\",\n  \"port\": 443,\n  \"debug\": false,\n  \"workers\": 8,\n  \"tls\": true\n}\n".to_string(),
        },
        SamplePair {
            id: "prose-doc".to_string(),
            title: "文章段落文案修订 (Prose Editing)".to_string(),
            old_text: "WebAssembly is very fast and works in the browser.\nIt is supported by major engines.\n".to_string(),
            new_text: "WebAssembly is extraordinarily fast, secure, and works seamlessly across browser and cloud runtimes.\nIt is natively supported by all major modern engines.\n".to_string(),
        },
    ]
}

#[derive(Debug, Deserialize)]
struct RequestEnvelope {
    action: String,
    #[serde(rename = "requestId")]
    request_id: Option<String>,
    #[serde(default)]
    params: serde_json::Value,
}

#[derive(Debug, Serialize)]
struct ResponseEnvelope<T> {
    code: i32,
    msg: String,
    #[serde(rename = "requestId")]
    request_id: String,
    data: Option<T>,
}

// Universal C-ABI
#[no_mangle]
pub extern "C" fn alloc(size: usize) -> *mut u8 {
    let mut buf = Vec::with_capacity(size);
    let ptr = buf.as_mut_ptr();
    core::mem::forget(buf);
    ptr
}

#[no_mangle]
pub unsafe extern "C" fn dealloc(ptr: *mut u8, size: usize) {
    if !ptr.is_null() && size > 0 {
        let _ = Vec::from_raw_parts(ptr, 0, size);
    }
}

#[no_mangle]
pub unsafe extern "C" fn dispatch(ptr: *const u8, len: usize) -> u64 {
    let slice = slice::from_raw_parts(ptr, len);

    let req: RequestEnvelope = match serde_json::from_slice(slice) {
        Ok(v) => v,
        Err(e) => {
            let err_res = ResponseEnvelope::<()> {
                code: 400,
                msg: format!("Invalid JSON request: {}", e),
                request_id: "".to_string(),
                data: None,
            };
            let json = serde_json::to_string(&err_res).unwrap_or_else(|_| "{}".to_string());
            return return_str(&json);
        }
    };

    let req_id = req.request_id.unwrap_or_default();

    let json_resp = match req.action.as_str() {
        "diff/lines" | "diff/compare" => {
            let old_text = req.params.get("oldText").and_then(|v| v.as_str()).unwrap_or("");
            let new_text = req.params.get("newText").and_then(|v| v.as_str()).unwrap_or("");
            let mode = req.params.get("mode").and_then(|v| v.as_str()).unwrap_or("lines");

            let res = compute_diff(old_text, new_text, mode);
            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(res),
            })
        }
        "diff/words" => {
            let old_text = req.params.get("oldText").and_then(|v| v.as_str()).unwrap_or("");
            let new_text = req.params.get("newText").and_then(|v| v.as_str()).unwrap_or("");

            let res = compute_diff(old_text, new_text, "words");
            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(res),
            })
        }
        "diff/chars" => {
            let old_text = req.params.get("oldText").and_then(|v| v.as_str()).unwrap_or("");
            let new_text = req.params.get("newText").and_then(|v| v.as_str()).unwrap_or("");

            let res = compute_diff(old_text, new_text, "chars");
            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(res),
            })
        }
        "diff/samples" => {
            let samples = get_sample_pairs();
            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(samples),
            })
        }
        other => serde_json::to_string(&ResponseEnvelope::<()> {
            code: 404,
            msg: format!("Unsupported action: {}", other),
            request_id: req_id,
            data: None,
        }),
    }
    .unwrap_or_else(|e| format!("{{\"code\":500,\"msg\":\"{}\",\"request_id\":\"{}\"}}", e, ""));

    return_str(&json_resp)
}

unsafe fn return_str(s: &str) -> u64 {
    let bytes = s.as_bytes();
    let out_len = bytes.len();
    let out_ptr = alloc(out_len);
    core::ptr::copy_nonoverlapping(bytes.as_ptr(), out_ptr, out_len);
    ((out_ptr as u64) << 32) | (out_len as u64 & 0xffffffff)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_line_diff() {
        let old = "hello\nworld\n";
        let new = "hello\nbrave\nworld\n";
        let res = compute_diff(old, new, "lines");
        assert_eq!(res.additions, 1);
        assert_eq!(res.unchanged, 2);
        assert!(res.similarity > 0.7);
        assert!(res.unified_patch.contains("+brave"));
    }

    #[test]
    fn test_word_diff() {
        let old = "The quick brown fox";
        let new = "The fast brown fox";
        let res = compute_diff(old, new, "words");
        assert!(res.additions >= 1);
        assert!(res.deletions >= 1);
    }

    #[test]
    fn test_samples() {
        let samples = get_sample_pairs();
        assert_eq!(samples.len(), 3);
    }
}
