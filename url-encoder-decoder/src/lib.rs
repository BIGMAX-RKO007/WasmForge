extern crate alloc;

use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec;
use alloc::vec::Vec;
use core::slice;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct ProcessParams {
    pub text: String,
    #[serde(default = "default_mode")]
    pub mode: String, // "encode" | "decode"
    #[serde(default = "default_standard")]
    pub standard: String, // "rfc3986" | "component" | "uri" | "form"
    #[serde(rename = "plusAsSpace", default = "default_true")]
    pub plus_as_space: bool,
}

fn default_mode() -> String { "encode".to_string() }
fn default_standard() -> String { "rfc3986".to_string() }
fn default_true() -> bool { true }

#[derive(Debug, Serialize)]
pub struct ProcessResult {
    pub result: String,
    pub mode: String,
    pub standard: String,
    #[serde(rename = "inputBytes")]
    pub input_bytes: usize,
    #[serde(rename = "outputBytes")]
    pub output_bytes: usize,
    #[serde(rename = "changedCount")]
    pub changed_count: usize,
    #[serde(rename = "ratio")]
    pub ratio: f64,
}

fn is_unreserved(b: u8) -> bool {
    matches!(b, b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'.' | b'_' | b'~')
}

fn is_component_unreserved(b: u8) -> bool {
    is_unreserved(b) || matches!(b, b'!' | b'\'' | b'(' | b')' | b'*')
}

fn is_uri_reserved(b: u8) -> bool {
    is_component_unreserved(b) || matches!(b, b';' | b',' | b'/' | b'?' | b':' | b'@' | b'&' | b'=' | b'+' | b'$' | b'#' | b'[' | b']')
}

fn hex_val(b: u8) -> Option<u8> {
    match b {
        b'0'..=b'9' => Some(b - b'0'),
        b'a'..=b'f' => Some(b - b'a' + 10),
        b'A'..=b'F' => Some(b - b'A' + 10),
        _ => None,
    }
}

pub fn url_encode(text: &str, standard: &str) -> (String, usize) {
    let bytes = text.as_bytes();
    let mut out = String::with_capacity(bytes.len() * 3);
    let mut changed = 0;

    for &b in bytes {
        let should_keep = match standard {
            "uri" => is_uri_reserved(b),
            "component" => is_component_unreserved(b),
            "form" => is_unreserved(b) || b == b' ',
            _ => is_unreserved(b), // rfc3986 default
        };

        if standard == "form" && b == b' ' {
            out.push('+');
            changed += 1;
        } else if should_keep {
            out.push(b as char);
        } else {
            out.push_str(&format!("%{:02X}", b));
            changed += 1;
        }
    }

    (out, changed)
}

pub fn url_decode(text: &str, plus_as_space: bool) -> Result<(String, usize), String> {
    let bytes = text.as_bytes();
    let mut out_bytes = Vec::with_capacity(bytes.len());
    let mut changed = 0;
    let mut i = 0;

    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let (Some(h1), Some(h2)) = (hex_val(bytes[i + 1]), hex_val(bytes[i + 2])) {
                let decoded_byte = (h1 << 4) | h2;
                out_bytes.push(decoded_byte);
                changed += 1;
                i += 3;
                continue;
            }
        }

        if bytes[i] == b'+' && plus_as_space {
            out_bytes.push(b' ');
            changed += 1;
        } else {
            out_bytes.push(bytes[i]);
        }
        i += 1;
    }

    let decoded_str = String::from_utf8(out_bytes)
        .map_err(|e| format!("URL 解码后非合法 UTF-8 编码: {}", e))?;

    Ok((decoded_str, changed))
}

pub fn process_url(params: &ProcessParams) -> Result<ProcessResult, String> {
    let input_bytes = params.text.as_bytes().len();

    let (result, changed_count) = if params.mode == "decode" {
        url_decode(&params.text, params.plus_as_space)?
    } else {
        url_encode(&params.text, &params.standard)
    };

    let output_bytes = result.as_bytes().len();
    let ratio = if input_bytes == 0 {
        1.0
    } else {
        (output_bytes as f64) / (input_bytes as f64)
    };

    Ok(ProcessResult {
        result,
        mode: params.mode.clone(),
        standard: params.standard.clone(),
        input_bytes,
        output_bytes,
        changed_count,
        ratio: (ratio * 100.0).round() / 100.0,
    })
}

#[derive(Debug, Serialize)]
pub struct UrlPreset {
    pub id: &'static str,
    pub name: &'static str,
    pub text: &'static str,
    pub mode: &'static str,
    pub standard: &'static str,
}

pub fn get_presets() -> Vec<UrlPreset> {
    vec![
        UrlPreset {
            id: "search-query",
            name: "中英文搜索查询 (RFC 3986)",
            text: "Rust WebAssembly 极致性能 & 2026 最新教程",
            mode: "encode",
            standard: "rfc3986",
        },
        UrlPreset {
            id: "oauth-callback",
            name: "OAuth 授权回调 URI",
            text: "https://auth.example.com/oauth/authorize?client_id=wasm_app&redirect_uri=https://app.dev/callback?tab=auth&user=admin",
            mode: "encode",
            standard: "component",
        },
        UrlPreset {
            id: "encoded-sample",
            name: "已编码 URL 还原解码",
            text: "https%3A%2F%2Fexample.com%2Fsearch%3Fq%3DWebAssembly%2B%E4%BD%A0%E5%A5%BD%26filter%3Dactive",
            mode: "decode",
            standard: "rfc3986",
        },
    ]
}

// Universal Request/Response Envelope
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
        "url/process" | "url/convert" => {
            let params: ProcessParams = match serde_json::from_value(req.params) {
                Ok(p) => p,
                Err(e) => {
                    let err_res = ResponseEnvelope::<()> {
                        code: 400,
                        msg: format!("参数解析失败: {}", e),
                        request_id: req_id,
                        data: None,
                    };
                    return return_str(&serde_json::to_string(&err_res).unwrap());
                }
            };

            match process_url(&params) {
                Ok(res) => serde_json::to_string(&ResponseEnvelope {
                    code: 0,
                    msg: "ok".to_string(),
                    request_id: req_id,
                    data: Some(res),
                }),
                Err(err) => serde_json::to_string(&ResponseEnvelope::<()> {
                    code: 400,
                    msg: err,
                    request_id: req_id,
                    data: None,
                }),
            }
        }
        "url/presets" | "url/samples" => {
            let presets = get_presets();
            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(presets),
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
    fn test_url_encode_decode() {
        let original = "Hello World! 你好";
        let (encoded, _) = url_encode(original, "rfc3986");
        assert!(encoded.contains("%20"));
        assert!(encoded.contains("%E4%BD%A0"));

        let (decoded, _) = url_decode(&encoded, true).unwrap();
        assert_eq!(decoded, original);
    }

    #[test]
    fn test_process_url() {
        let p = ProcessParams {
            text: "foo bar".to_string(),
            mode: "encode".to_string(),
            standard: "rfc3986".to_string(),
            plus_as_space: true,
        };
        let res = process_url(&p).unwrap();
        assert_eq!(res.result, "foo%20bar");
    }
}
