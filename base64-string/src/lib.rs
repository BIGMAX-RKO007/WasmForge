use base64::engine::general_purpose::{
    STANDARD, STANDARD_NO_PAD, URL_SAFE, URL_SAFE_NO_PAD,
};
use base64::Engine;
use serde::{Deserialize, Serialize};
use serde_json::Value;

pub fn encode_text_to_base64(text: &str, url_safe: bool, padding: bool) -> String {
    let bytes = text.as_bytes();
    match (url_safe, padding) {
        (false, true) => STANDARD.encode(bytes),
        (false, false) => STANDARD_NO_PAD.encode(bytes),
        (true, true) => URL_SAFE.encode(bytes),
        (true, false) => URL_SAFE_NO_PAD.encode(bytes),
    }
}

pub fn decode_base64_to_text(b64_str: &str, url_safe: bool) -> Result<String, String> {
    // Strip whitespace / newlines
    let clean: String = b64_str.chars().filter(|c| !c.is_whitespace()).collect();
    
    // Attempt primary engine first, then fallback to alternate engine
    let decoded_bytes = if url_safe {
        URL_SAFE.decode(&clean)
            .or_else(|_| URL_SAFE_NO_PAD.decode(&clean))
            .or_else(|_| STANDARD.decode(&clean))
    } else {
        STANDARD.decode(&clean)
            .or_else(|_| STANDARD_NO_PAD.decode(&clean))
            .or_else(|_| URL_SAFE.decode(&clean))
    }.map_err(|e| format!("Base64 解码错误: {}", e))?;

    String::from_utf8(decoded_bytes).map_err(|e| format!("UTF-8 解码失败 (非纯文本二进制数据): {}", e))
}

pub fn get_sample_text() -> &'static str {
    "Hello WasmForge! 🚀 WebAssembly runs at near-native speed across Node.js & modern browsers with zero external dependencies."
}

// ================= C-ABI Universal Envelope Protocol =================

#[derive(Deserialize)]
struct RequestEnvelope {
    action: String,
    #[serde(rename = "requestId")]
    request_id: Option<String>,
    #[serde(default)]
    params: Value,
}

#[derive(Serialize)]
struct ResponseEnvelope<T> {
    code: i32,
    msg: String,
    #[serde(rename = "requestId")]
    request_id: String,
    data: Option<T>,
}

#[derive(Serialize)]
struct EncodeResult {
    base64: String,
    #[serde(rename = "urlSafe")]
    url_safe: bool,
    padding: bool,
    #[serde(rename = "sourceSizeBytes")]
    source_size_bytes: usize,
    #[serde(rename = "targetSizeBytes")]
    target_size_bytes: usize,
}

#[derive(Serialize)]
struct DecodeResult {
    text: String,
    #[serde(rename = "sourceSizeBytes")]
    source_size_bytes: usize,
    #[serde(rename = "targetSizeBytes")]
    target_size_bytes: usize,
}

#[derive(Serialize)]
struct SampleResult {
    text: String,
    base64: String,
}

#[no_mangle]
pub extern "C" fn alloc(size: usize) -> *mut u8 {
    let mut buf = Vec::with_capacity(size);
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr
}

#[no_mangle]
pub extern "C" fn dealloc(ptr: *mut u8, size: usize) {
    if !ptr.is_null() && size > 0 {
        unsafe {
            let _ = Vec::from_raw_parts(ptr, 0, size);
        }
    }
}

#[no_mangle]
pub extern "C" fn dispatch(ptr: *const u8, len: usize) -> u64 {
    if ptr.is_null() || len == 0 {
        return pack_response(ResponseEnvelope::<()> {
            code: 400,
            msg: "Null or empty request buffer".to_string(),
            request_id: "".to_string(),
            data: None,
        });
    }

    let input_bytes = unsafe { std::slice::from_raw_parts(ptr, len) };
    let req: RequestEnvelope = match serde_json::from_slice(input_bytes) {
        Ok(r) => r,
        Err(e) => {
            return pack_response(ResponseEnvelope::<()> {
                code: 400,
                msg: format!("Invalid JSON request envelope: {}", e),
                request_id: "".to_string(),
                data: None,
            });
        }
    };

    let req_id = req.request_id.unwrap_or_default();

    match req.action.as_str() {
        "base64/encode" => {
            let text = match req.params.get("text").and_then(|v| v.as_str()) {
                Some(s) => s,
                None => {
                    return pack_response(ResponseEnvelope::<()> {
                        code: 400,
                        msg: "Missing 'text' string in params".to_string(),
                        request_id: req_id,
                        data: None,
                    });
                }
            };

            let url_safe = req
                .params
                .get("urlSafe")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);

            let padding = req
                .params
                .get("padding")
                .and_then(|v| v.as_bool())
                .unwrap_or(true);

            let b64 = encode_text_to_base64(text, url_safe, padding);
            pack_response(ResponseEnvelope {
                code: 0,
                msg: "OK".to_string(),
                request_id: req_id,
                data: Some(EncodeResult {
                    source_size_bytes: text.len(),
                    target_size_bytes: b64.len(),
                    base64: b64,
                    url_safe,
                    padding,
                }),
            })
        }
        "base64/decode" => {
            let b64 = match req.params.get("base64").and_then(|v| v.as_str()) {
                Some(s) => s,
                None => {
                    return pack_response(ResponseEnvelope::<()> {
                        code: 400,
                        msg: "Missing 'base64' string in params".to_string(),
                        request_id: req_id,
                        data: None,
                    });
                }
            };

            let url_safe = req
                .params
                .get("urlSafe")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);

            match decode_base64_to_text(b64, url_safe) {
                Ok(text_res) => pack_response(ResponseEnvelope {
                    code: 0,
                    msg: "OK".to_string(),
                    request_id: req_id,
                    data: Some(DecodeResult {
                        source_size_bytes: b64.len(),
                        target_size_bytes: text_res.len(),
                        text: text_res,
                    }),
                }),
                Err(err_msg) => pack_response(ResponseEnvelope::<()> {
                    code: 500,
                    msg: format!("Base64 解码失败: {}", err_msg),
                    request_id: req_id,
                    data: None,
                }),
            }
        }
        "base64/sample" => {
            let sample_str = get_sample_text();
            let b64 = encode_text_to_base64(sample_str, false, true);
            pack_response(ResponseEnvelope {
                code: 0,
                msg: "OK".to_string(),
                request_id: req_id,
                data: Some(SampleResult {
                    text: sample_str.to_string(),
                    base64: b64,
                }),
            })
        }
        unknown => pack_response(ResponseEnvelope::<()> {
            code: 404,
            msg: format!("Action '{}' not supported", unknown),
            request_id: req_id,
            data: None,
        }),
    }
}

fn pack_response<T: Serialize>(resp: ResponseEnvelope<T>) -> u64 {
    let out_bytes = serde_json::to_vec(&resp).unwrap_or_else(|_| {
        b"{\"code\":500,\"msg\":\"Serialization failure\",\"requestId\":\"\",\"data\":null}".to_vec()
    });
    let out_len = out_bytes.len();
    let boxed_slice = out_bytes.into_boxed_slice();
    let out_ptr = Box::into_raw(boxed_slice) as *mut u8 as usize;
    ((out_ptr as u64) << 32) | ((out_len as u64) & 0xFFFFFFFF)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encode_decode_standard() {
        let text = "Antigravity WasmForge 2026! 🦀";
        let encoded = encode_text_to_base64(text, false, true);
        let decoded = decode_base64_to_text(&encoded, false).unwrap();
        assert_eq!(text, decoded);
    }

    #[test]
    fn test_encode_decode_url_safe_no_pad() {
        let text = "https://wasmforge.org/api?key=value&test=123";
        let encoded = encode_text_to_base64(text, true, false);
        assert!(!encoded.contains('+'));
        assert!(!encoded.contains('/'));
        assert!(!encoded.contains('='));
        let decoded = decode_base64_to_text(&encoded, true).unwrap();
        assert_eq!(text, decoded);
    }

    #[test]
    fn test_decode_invalid() {
        let invalid = "???NotBase64!!!";
        let res = decode_base64_to_text(invalid, false);
        assert!(res.is_err());
    }
}
