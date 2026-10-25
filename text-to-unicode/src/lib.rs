use core::slice;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RequestEnvelope {
    pub action: String,
    #[serde(default)]
    pub request_id: Option<String>,
    #[serde(default)]
    pub params: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResponseEnvelope<T> {
    pub code: i32,
    pub msg: String,
    #[serde(default)]
    pub request_id: Option<String>,
    #[serde(default)]
    pub data: Option<T>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConvertUnicodeParams {
    pub input: String,
    #[serde(default)]
    pub mode: Option<String>, // "auto" | "encode" | "decode"
    #[serde(default)]
    pub escape_all: Option<bool>, // false = 仅非ASCII; true = 全部字符
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UnicodeConvertResult {
    pub input: String,
    pub mode: String,
    pub text: String,
    pub standard_escape: String,
    pub es6_escape: String,
    pub html_hex_entity: String,
    pub html_dec_entity: String,
    pub total_chars: usize,
    pub escaped_chars: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UnicodeSampleResult {
    pub sample_text: String,
    pub sample_escape: String,
    pub converted: UnicodeConvertResult,
}

pub fn encode_to_unicode(text: &str, escape_all: bool) -> UnicodeConvertResult {
    let mut standard_escape = String::new();
    let mut es6_escape = String::new();
    let mut html_hex_entity = String::new();
    let mut html_dec_entity = String::new();

    let mut total_chars = 0;
    let mut escaped_chars = 0;

    for c in text.chars() {
        total_chars += 1;
        let cp = c as u32;
        let should_escape = escape_all || !c.is_ascii();

        if should_escape {
            escaped_chars += 1;
            // 1. Standard \uXXXX (含代理对)
            if cp <= 0xFFFF {
                standard_escape.push_str(&format!("\\u{:04x}", cp));
            } else {
                let high = 0xD800 + ((cp - 0x10000) >> 10);
                let low = 0xDC00 + ((cp - 0x10000) & 0x3FF);
                standard_escape.push_str(&format!("\\u{:04x}\\u{:04x}", high, low));
            }

            // 2. ES6 \u{XXXX}
            es6_escape.push_str(&format!("\\u{{{:x}}}", cp));

            // 3. HTML entities
            html_hex_entity.push_str(&format!("&#x{:X};", cp));
            html_dec_entity.push_str(&format!("&#{};", cp));
        } else {
            standard_escape.push(c);
            es6_escape.push(c);
            html_hex_entity.push(c);
            html_dec_entity.push(c);
        }
    }

    UnicodeConvertResult {
        input: text.to_string(),
        mode: "encode".to_string(),
        text: text.to_string(),
        standard_escape,
        es6_escape,
        html_hex_entity,
        html_dec_entity,
        total_chars,
        escaped_chars,
    }
}

pub fn decode_unicode_escapes(input: &str) -> Result<UnicodeConvertResult, String> {
    let mut decoded = String::new();
    let chars: Vec<char> = input.chars().collect();
    let len = chars.len();
    let mut i = 0;

    while i < len {
        if chars[i] == '\\' && i + 1 < len {
            if chars[i + 1] == 'u' || chars[i + 1] == 'U' {
                // Case 1: \u{XXXX} (ES6)
                if i + 2 < len && chars[i + 2] == '{' {
                    let mut j = i + 3;
                    while j < len && chars[j] != '}' {
                        j += 1;
                    }
                    if j < len && chars[j] == '}' {
                        let hex_str: String = chars[i + 3..j].iter().collect();
                        if let Ok(cp) = u32::from_str_radix(&hex_str, 16) {
                            if let Some(c) = char::from_u32(cp) {
                                decoded.push(c);
                                i = j + 1;
                                continue;
                            }
                        }
                    }
                }

                // Case 2: \uXXXX (Standard 4 hex digits)
                if i + 5 < len {
                    let hex_str: String = chars[i + 2..i + 6].iter().collect();
                    if let Ok(cp) = u16::from_str_radix(&hex_str, 16) {
                        // Check if it's a high surrogate
                        if (0xD800..=0xDBFF).contains(&cp) && i + 11 < len && chars[i + 6] == '\\' && (chars[i + 7] == 'u' || chars[i + 7] == 'U') {
                            let low_hex: String = chars[i + 8..i + 12].iter().collect();
                            if let Ok(low_cp) = u16::from_str_radix(&low_hex, 16) {
                                if (0xDC00..=0xDFFF).contains(&low_cp) {
                                    let full_cp = 0x10000 + (((cp as u32 - 0xD800) << 10) | (low_cp as u32 - 0xDC00));
                                    if let Some(c) = char::from_u32(full_cp) {
                                        decoded.push(c);
                                        i += 12;
                                        continue;
                                    }
                                }
                            }
                        }

                        if let Some(c) = char::from_u32(cp as u32) {
                            decoded.push(c);
                            i += 6;
                            continue;
                        }
                    }
                }
            }
        } else if chars[i] == '&' && i + 1 < len && chars[i + 1] == '#' {
            // Case 3: &#xXXXX; or &#DDDD;
            let mut j = i + 2;
            let is_hex = if j < len && (chars[j] == 'x' || chars[j] == 'X') {
                j += 1;
                true
            } else {
                false
            };
            let start = j;
            while j < len && chars[j] != ';' && j - start < 10 {
                j += 1;
            }
            if j < len && chars[j] == ';' {
                let num_str: String = chars[start..j].iter().collect();
                let radix = if is_hex { 16 } else { 10 };
                if let Ok(cp) = u32::from_str_radix(&num_str, radix) {
                    if let Some(c) = char::from_u32(cp) {
                        decoded.push(c);
                        i = j + 1;
                        continue;
                    }
                }
            }
        }

        decoded.push(chars[i]);
        i += 1;
    }

    let mut res = encode_to_unicode(&decoded, false);
    res.input = input.to_string();
    res.mode = "decode".to_string();
    Ok(res)
}

pub fn convert_unicode(input: &str, mode_opt: Option<&str>, escape_all_opt: Option<bool>) -> Result<UnicodeConvertResult, String> {
    let mode = mode_opt.unwrap_or("auto");
    let escape_all = escape_all_opt.unwrap_or(false);

    match mode {
        "encode" => Ok(encode_to_unicode(input, escape_all)),
        "decode" => decode_unicode_escapes(input),
        _ => {
            // "auto"
            if input.contains("\\u") || input.contains("\\U") || input.contains("&#") {
                decode_unicode_escapes(input)
            } else {
                Ok(encode_to_unicode(input, escape_all))
            }
        }
    }
}

pub fn get_sample() -> UnicodeSampleResult {
    let sample_text = "你好，WasmForge! 🚀".to_string();
    let converted = encode_to_unicode(&sample_text, false);
    UnicodeSampleResult {
        sample_text,
        sample_escape: converted.standard_escape.clone(),
        converted,
    }
}

pub fn handle_dispatch(in_bytes: &[u8]) -> Vec<u8> {
    let req: RequestEnvelope = match serde_json::from_slice(in_bytes) {
        Ok(v) => v,
        Err(e) => {
            let res = ResponseEnvelope::<()> {
                code: 400,
                msg: format!("请求信封反序列化失败: {}", e),
                request_id: None,
                data: None,
            };
            return serde_json::to_vec(&res).unwrap_or_default();
        }
    };

    let req_id = req.request_id.clone();

    match req.action.as_str() {
        "unicode/convert" | "unicode/auto" => {
            let params: ConvertUnicodeParams = match req.params {
                Some(p) => match serde_json::from_value(p) {
                    Ok(val) => val,
                    Err(e) => {
                        let res = ResponseEnvelope::<()> {
                            code: 400,
                            msg: format!("参数解析失败: {}", e),
                            request_id: req_id,
                            data: None,
                        };
                        return serde_json::to_vec(&res).unwrap_or_default();
                    }
                },
                None => {
                    let res = ResponseEnvelope::<()> {
                        code: 400,
                        msg: "缺少 params 参数".to_string(),
                        request_id: req_id,
                        data: None,
                    };
                    return serde_json::to_vec(&res).unwrap_or_default();
                }
            };

            match convert_unicode(&params.input, params.mode.as_deref(), params.escape_all) {
                Ok(out) => {
                    let res = ResponseEnvelope {
                        code: 0,
                        msg: "Unicode 转换成功".to_string(),
                        request_id: req_id,
                        data: Some(out),
                    };
                    serde_json::to_vec(&res).unwrap_or_default()
                }
                Err(err) => {
                    let res = ResponseEnvelope::<()> {
                        code: 400,
                        msg: err,
                        request_id: req_id,
                        data: None,
                    };
                    serde_json::to_vec(&res).unwrap_or_default()
                }
            }
        }
        "unicode/sample" => {
            let sample = get_sample();
            let res = ResponseEnvelope {
                code: 0,
                msg: "获取示例成功".to_string(),
                request_id: req_id,
                data: Some(sample),
            };
            serde_json::to_vec(&res).unwrap_or_default()
        }
        other => {
            let res = ResponseEnvelope::<()> {
                code: 404,
                msg: format!("未知 Action: {}", other),
                request_id: req_id,
                data: None,
            };
            serde_json::to_vec(&res).unwrap_or_default()
        }
    }
}

// ================= Standard WasmForge C-ABI Exports =================

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
    let in_bytes = slice::from_raw_parts(ptr, len);
    let out_bytes = handle_dispatch(in_bytes);
    let out_len = out_bytes.len();
    let out_ptr = alloc(out_len);
    core::ptr::copy_nonoverlapping(out_bytes.as_ptr(), out_ptr, out_len);
    ((out_ptr as u64) << 32) | (out_len as u64 & 0xffffffff)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encode_unicode() {
        let res = encode_to_unicode("你好", false);
        assert_eq!(res.standard_escape, "\\u4f60\\u597d");
        assert_eq!(res.es6_escape, "\\u{4f60}\\u{597d}");
        assert_eq!(res.html_hex_entity, "&#x4F60;&#x597D;");
        assert_eq!(res.html_dec_entity, "&#20320;&#22909;");
    }

    #[test]
    fn test_decode_unicode() {
        let res = decode_unicode_escapes("\\u4f60\\u597d").unwrap();
        assert_eq!(res.text, "你好");

        let res2 = decode_unicode_escapes("&#x4F60;&#x597D;").unwrap();
        assert_eq!(res2.text, "你好");

        let res3 = decode_unicode_escapes("\\u{1f600}").unwrap();
        assert_eq!(res3.text, "😀");
    }

    #[test]
    fn test_auto_detection() {
        let res = convert_unicode("Hello 世界", None, None).unwrap();
        assert_eq!(res.mode, "encode");
        assert_eq!(res.standard_escape, "Hello \\u4e16\\u754c");

        let res2 = convert_unicode("Hello \\u4e16\\u754c", None, None).unwrap();
        assert_eq!(res2.mode, "decode");
        assert_eq!(res2.text, "Hello 世界");
    }
}
