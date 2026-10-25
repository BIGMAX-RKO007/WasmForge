extern crate alloc;

use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec;
use alloc::vec::Vec;
use core::slice;
use serde::{Deserialize, Serialize};

static NAMED_ENTITIES: &[(&str, char)] = &[
    ("quot", '"'),
    ("amp", '&'),
    ("apos", '\''),
    ("lt", '<'),
    ("gt", '>'),
    ("nbsp", '\u{00A0}'),
    ("copy", '©'),
    ("reg", '®'),
    ("trade", '™'),
    ("euro", '€'),
    ("pound", '£'),
    ("yen", '¥'),
    ("cent", '¢'),
    ("plusmn", '±'),
    ("times", '×'),
    ("divide", '÷'),
    ("hearts", '♥'),
    ("diams", '♦'),
    ("clubs", '♣'),
    ("spades", '♠'),
    ("check", '✓'),
    ("cross", '✗'),
    ("deg", '°'),
    ("micro", 'µ'),
    ("para", '¶'),
    ("sect", '§'),
    ("bull", '•'),
    ("hellip", '…'),
    ("ndash", '–'),
    ("mdash", '—'),
    ("lsquo", '‘'),
    ("rsquo", '’'),
    ("ldquo", '“'),
    ("rdquo", '”'),
    ("laquo", '«'),
    ("raquo", '»'),
    ("infin", '∞'),
    ("ne", '≠'),
    ("le", '≤'),
    ("ge", '≥'),
    ("asymp", '≈'),
    ("larr", '←'),
    ("uarr", '↑'),
    ("rarr", '→'),
    ("darr", '↓'),
];

fn lookup_named_char(name: &str) -> Option<char> {
    for (k, v) in NAMED_ENTITIES {
        if *k == name {
            return Some(*v);
        }
    }
    None
}

fn lookup_char_name(ch: char) -> Option<&'static str> {
    for (k, v) in NAMED_ENTITIES {
        if *v == ch {
            return Some(*k);
        }
    }
    None
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EntityResult {
    pub result: String,
    pub mode: String,
    pub standard: String,
    #[serde(rename = "inputBytes")]
    pub input_bytes: usize,
    #[serde(rename = "outputBytes")]
    pub output_bytes: usize,
    #[serde(rename = "entitiesProcessed")]
    pub entities_processed: usize,
    pub ratio: f64,
}

pub fn encode_entities(text: &str, format: &str) -> EntityResult {
    let mut out = String::with_capacity(text.len() * 2);
    let mut processed = 0;

    for ch in text.chars() {
        match format {
            "basic" => match ch {
                '&' => { out.push_str("&amp;"); processed += 1; }
                '<' => { out.push_str("&lt;"); processed += 1; }
                '>' => { out.push_str("&gt;"); processed += 1; }
                '"' => { out.push_str("&quot;"); processed += 1; }
                '\'' => { out.push_str("&apos;"); processed += 1; }
                other => out.push(other),
            },
            "named" => {
                if let Some(named) = lookup_char_name(ch) {
                    out.push('&');
                    out.push_str(named);
                    out.push(';');
                    processed += 1;
                } else {
                    out.push(ch);
                }
            }
            "decimal" => {
                let cp = ch as u32;
                if ch == '&' || ch == '<' || ch == '>' || ch == '"' || ch == '\'' || cp > 127 {
                    out.push_str(&format!("&#{};", cp));
                    processed += 1;
                } else {
                    out.push(ch);
                }
            }
            "hex" => {
                let cp = ch as u32;
                if ch == '&' || ch == '<' || ch == '>' || ch == '"' || ch == '\'' || cp > 127 {
                    out.push_str(&format!("&#x{:X};", cp));
                    processed += 1;
                } else {
                    out.push(ch);
                }
            }
            _ => { // default named
                if let Some(named) = lookup_char_name(ch) {
                    out.push('&');
                    out.push_str(named);
                    out.push(';');
                    processed += 1;
                } else {
                    out.push(ch);
                }
            }
        }
    }

    let input_bytes = text.len();
    let output_bytes = out.len();
    let ratio = if input_bytes > 0 {
        ((output_bytes as f64 / input_bytes as f64) * 100.0).round() / 100.0
    } else {
        1.0
    };

    EntityResult {
        result: out,
        mode: "encode".to_string(),
        standard: format.to_string(),
        input_bytes,
        output_bytes,
        entities_processed: processed,
        ratio,
    }
}

pub fn decode_entities(text: &str) -> EntityResult {
    let mut out = String::with_capacity(text.len());
    let mut processed = 0;
    let chars: Vec<char> = text.chars().collect();
    let len = chars.len();
    let mut i = 0;

    while i < len {
        if chars[i] == '&' {
            if let Some(semi_pos) = chars[i..].iter().position(|&c| c == ';') {
                if semi_pos <= 10 {
                    let end = i + semi_pos;
                    let entity_slice: String = chars[i + 1..end].iter().collect();

                    let mut decoded_char: Option<char> = None;

                    if entity_slice.starts_with("#x") || entity_slice.starts_with("#X") {
                        if let Ok(cp) = u32::from_str_radix(&entity_slice[2..], 16) {
                            decoded_char = char::from_u32(cp);
                        }
                    } else if entity_slice.starts_with('#') {
                        if let Ok(cp) = entity_slice[1..].parse::<u32>() {
                            decoded_char = char::from_u32(cp);
                        }
                    } else {
                        decoded_char = lookup_named_char(&entity_slice);
                    }

                    if let Some(c) = decoded_char {
                        out.push(c);
                        processed += 1;
                        i = end + 1;
                        continue;
                    }
                }
            }
        }
        out.push(chars[i]);
        i += 1;
    }

    let input_bytes = text.len();
    let output_bytes = out.len();
    let ratio = if input_bytes > 0 {
        ((output_bytes as f64 / input_bytes as f64) * 100.0).round() / 100.0
    } else {
        1.0
    };

    EntityResult {
        result: out,
        mode: "decode".to_string(),
        standard: "auto".to_string(),
        input_bytes,
        output_bytes,
        entities_processed: processed,
        ratio,
    }
}

#[derive(Debug, Deserialize)]
pub struct ProcessParams {
    pub text: String,
    #[serde(default = "default_mode")]
    pub mode: String, // "encode" | "decode"
    #[serde(default = "default_format")]
    pub format: String, // "basic" | "named" | "decimal" | "hex"
}

fn default_mode() -> String {
    "encode".to_string()
}

fn default_format() -> String {
    "named".to_string()
}

#[derive(Debug, Serialize)]
pub struct HtmlPreset {
    pub id: &'static str,
    pub name: &'static str,
    pub text: &'static str,
    pub mode: &'static str,
    pub format: &'static str,
}

pub fn get_presets() -> Vec<HtmlPreset> {
    vec![
        HtmlPreset {
            id: "xss-payload",
            name: "XSS 防护脚本转义",
            text: "<script>alert('XSS & Injections \"1\" > 0');</script>",
            mode: "encode",
            format: "basic",
        },
        HtmlPreset {
            id: "symbols-typography",
            name: "版权符号与排版特殊符",
            text: "© 2026 WasmForge™ — Fast & Secure • €100 ± 5% • ♥ Rust",
            mode: "encode",
            format: "named",
        },
        HtmlPreset {
            id: "encoded-article",
            name: "HTML 实体解码反转义",
            text: "&lt;h1&gt;WasmForge &amp; HTML5 &copy; 2026&lt;/h1&gt;&lt;p&gt;Price: &euro;49.99 &plusmn; 2&percnt; &#x2665;&lt;/p&gt;",
            mode: "decode",
            format: "named",
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
        "html/entities" | "html/process" => {
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

            let result = if params.mode == "decode" {
                decode_entities(&params.text)
            } else {
                encode_entities(&params.text, &params.format)
            };

            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(result),
            })
        }
        "html/presets" | "html/samples" => {
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
    fn test_encode_basic() {
        let text = "<script>alert('hello & \"world\"');</script>";
        let res = encode_entities(text, "basic");
        assert_eq!(res.result, "&lt;script&gt;alert(&apos;hello &amp; &quot;world&quot;&apos;);&lt;/script&gt;");
        assert_eq!(res.entities_processed, 9);
    }

    #[test]
    fn test_decode_named_and_numeric() {
        let text = "&lt;h1&gt;Hello &copy; &#38; &#x20AC;&lt;/h1&gt;";
        let res = decode_entities(text);
        assert_eq!(res.result, "<h1>Hello © & €</h1>");
        assert_eq!(res.entities_processed, 7);
    }
}
