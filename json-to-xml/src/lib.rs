use serde::{Deserialize, Serialize};
use serde_json::Value;

fn escape_xml(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&apos;"),
            other => out.push(other),
        }
    }
    out
}

fn sanitize_tag_name(s: &str) -> String {
    let clean: String = s
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '_' || *c == '-' || *c == '.')
        .collect();
    if clean.is_empty() || clean.chars().next().unwrap().is_ascii_digit() {
        format!("elem_{}", clean)
    } else {
        clean
    }
}

pub fn convert_json_to_xml(json_str: &str, root_override: Option<&str>, indent: usize) -> Result<String, String> {
    let root_val: Value = serde_json::from_str(json_str)
        .map_err(|e| format!("JSON 解析错误: {}", e))?;

    let mut out = String::new();
    out.push_str("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
    if indent > 0 {
        out.push('\n');
    }

    match root_val {
        Value::Object(ref map) => {
            // Count non-attribute keys
            let non_attr_keys: Vec<&String> = map.keys().filter(|k| !k.starts_with('@')).collect();

            if non_attr_keys.len() == 1 && root_override.is_none() {
                // Single top-level key behaves as root tag
                let root_key = non_attr_keys[0];
                let root_tag = sanitize_tag_name(root_key);
                let inner_val = &map[root_key];
                write_element(&mut out, &root_tag, inner_val, 0, indent)?;
            } else {
                let root_tag = sanitize_tag_name(root_override.unwrap_or("root"));
                write_element(&mut out, &root_tag, &root_val, 0, indent)?;
            }
        }
        Value::Array(_) | Value::String(_) | Value::Number(_) | Value::Bool(_) | Value::Null => {
            let root_tag = sanitize_tag_name(root_override.unwrap_or("root"));
            write_element(&mut out, &root_tag, &root_val, 0, indent)?;
        }
    }

    if indent > 0 && !out.ends_with('\n') {
        out.push('\n');
    }

    Ok(out)
}

fn write_indent(out: &mut String, level: usize, indent: usize) {
    if indent > 0 {
        for _ in 0..(level * indent) {
            out.push(' ');
        }
    }
}

fn write_element(
    out: &mut String,
    tag: &str,
    val: &Value,
    level: usize,
    indent: usize,
) -> Result<(), String> {
    write_indent(out, level, indent);

    match val {
        Value::Object(map) => {
            // Extract attributes and children
            let mut attrs = Vec::new();
            let mut text_content = None;
            let mut children = Vec::new();

            for (k, v) in map {
                if let Some(attr_name) = k.strip_prefix('@') {
                    let attr_val = match v {
                        Value::String(s) => s.clone(),
                        Value::Number(n) => n.to_string(),
                        Value::Bool(b) => b.to_string(),
                        Value::Null => "".to_string(),
                        _ => v.to_string(),
                    };
                    attrs.push((sanitize_tag_name(attr_name), escape_xml(&attr_val)));
                } else if k == "$text" {
                    text_content = Some(v);
                } else {
                    children.push((k, v));
                }
            }

            // Open tag
            out.push('<');
            out.push_str(tag);
            for (attr_k, attr_v) in attrs {
                out.push(' ');
                out.push_str(&attr_k);
                out.push_str("=\"");
                out.push_str(&attr_v);
                out.push('"');
            }

            if children.is_empty() && text_content.is_none() {
                out.push_str(" />");
                if indent > 0 {
                    out.push('\n');
                }
                return Ok(());
            }

            out.push('>');

            if children.is_empty() {
                // Only text
                if let Some(txt) = text_content {
                    let s = match txt {
                        Value::String(s) => escape_xml(s),
                        Value::Number(n) => n.to_string(),
                        Value::Bool(b) => b.to_string(),
                        _ => escape_xml(&txt.to_string()),
                    };
                    out.push_str(&s);
                }
                out.push_str("</");
                out.push_str(tag);
                out.push('>');
                if indent > 0 {
                    out.push('\n');
                }
            } else {
                if indent > 0 {
                    out.push('\n');
                }

                // If mixed with text
                if let Some(txt) = text_content {
                    write_indent(out, level + 1, indent);
                    let s = match txt {
                        Value::String(s) => escape_xml(s),
                        Value::Number(n) => n.to_string(),
                        Value::Bool(b) => b.to_string(),
                        _ => escape_xml(&txt.to_string()),
                    };
                    out.push_str(&s);
                    if indent > 0 {
                        out.push('\n');
                    }
                }

                for (child_k, child_v) in children {
                    let child_tag = sanitize_tag_name(child_k);
                    match child_v {
                        Value::Array(items) => {
                            for item in items {
                                write_element(out, &child_tag, item, level + 1, indent)?;
                            }
                        }
                        _ => {
                            write_element(out, &child_tag, child_v, level + 1, indent)?;
                        }
                    }
                }

                write_indent(out, level, indent);
                out.push_str("</");
                out.push_str(tag);
                out.push('>');
                if indent > 0 {
                    out.push('\n');
                }
            }
        }
        Value::Array(items) => {
            out.push('<');
            out.push_str(tag);
            out.push('>');
            if indent > 0 {
                out.push('\n');
            }
            for item in items {
                write_element(out, "item", item, level + 1, indent)?;
            }
            write_indent(out, level, indent);
            out.push_str("</");
            out.push_str(tag);
            out.push('>');
            if indent > 0 {
                out.push('\n');
            }
        }
        Value::String(s) => {
            out.push('<');
            out.push_str(tag);
            out.push('>');
            out.push_str(&escape_xml(s));
            out.push_str("</");
            out.push_str(tag);
            out.push('>');
            if indent > 0 {
                out.push('\n');
            }
        }
        Value::Number(n) => {
            out.push('<');
            out.push_str(tag);
            out.push('>');
            out.push_str(&n.to_string());
            out.push_str("</");
            out.push_str(tag);
            out.push('>');
            if indent > 0 {
                out.push('\n');
            }
        }
        Value::Bool(b) => {
            out.push('<');
            out.push_str(tag);
            out.push('>');
            out.push_str(if *b { "true" } else { "false" });
            out.push_str("</");
            out.push_str(tag);
            out.push('>');
            if indent > 0 {
                out.push('\n');
            }
        }
        Value::Null => {
            out.push('<');
            out.push_str(tag);
            out.push_str(" />");
            if indent > 0 {
                out.push('\n');
            }
        }
    }

    Ok(())
}

pub fn get_sample_json() -> &'static str {
    r#"{
  "bookstore": {
    "@store": "Main Street",
    "@established": "2026",
    "book": [
      {
        "@category": "computing",
        "@in_stock": "true",
        "title": "Rust & WebAssembly Industrial Guide",
        "author": "Antigravity Team",
        "year": 2026,
        "price": 49.99,
        "tags": {
          "tag": ["Rust", "Wasm", "Hono"]
        }
      },
      {
        "@category": "distributed",
        "@in_stock": "false",
        "title": "云原生微服务设计实战",
        "author": "WasmForge Contributor",
        "year": 2025,
        "price": 35.5
      }
    ]
  }
}"#
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
struct ConvertResult {
    xml: String,
    indent: usize,
    #[serde(rename = "sourceSizeBytes")]
    source_size_bytes: usize,
    #[serde(rename = "targetSizeBytes")]
    target_size_bytes: usize,
}

#[derive(Serialize)]
struct SampleResult {
    json: String,
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
        "json/to-xml" => {
            let json_input = match req.params.get("json").and_then(|v| v.as_str()) {
                Some(s) => s,
                None => {
                    return pack_response(ResponseEnvelope::<()> {
                        code: 400,
                        msg: "Missing 'json' string in params".to_string(),
                        request_id: req_id,
                        data: None,
                    });
                }
            };

            let root_name = req
                .params
                .get("rootName")
                .and_then(|v| v.as_str())
                .filter(|s| !s.trim().is_empty());

            let indent = req
                .params
                .get("indent")
                .and_then(|v| v.as_u64())
                .unwrap_or(2) as usize;

            match convert_json_to_xml(json_input, root_name, indent) {
                Ok(xml_res) => {
                    let source_len = json_input.len();
                    let target_len = xml_res.len();
                    pack_response(ResponseEnvelope {
                        code: 0,
                        msg: "OK".to_string(),
                        request_id: req_id,
                        data: Some(ConvertResult {
                            xml: xml_res,
                            indent,
                            source_size_bytes: source_len,
                            target_size_bytes: target_len,
                        }),
                    })
                }
                Err(err_msg) => pack_response(ResponseEnvelope::<()> {
                    code: 500,
                    msg: format!("JSON 转换 XML 失败: {}", err_msg),
                    request_id: req_id,
                    data: None,
                }),
            }
        }
        "json/sample" => pack_response(ResponseEnvelope {
            code: 0,
            msg: "OK".to_string(),
            request_id: req_id,
            data: Some(SampleResult {
                json: get_sample_json().to_string(),
            }),
        }),
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
    fn test_convert_json_to_xml_success() {
        let sample = get_sample_json();
        let res = convert_json_to_xml(sample, None, 2).unwrap();
        println!("Generated XML:\n{}", res);
        assert!(res.contains(r#"store="Main Street""#));
        assert!(res.contains(r#"<title>Rust &amp; WebAssembly Industrial Guide</title>"#));
        assert!(res.contains(r#"<author>Antigravity Team</author>"#));
        assert!(res.contains(r#"<price>49.99</price>"#));
        assert!(res.contains(r#"<tag>Rust</tag>"#));
    }

    #[test]
    fn test_convert_compact_and_empty() {
        let json = r#"{"user":{"@id":"42","name":"Alice"}}"#;
        let res = convert_json_to_xml(json, None, 0).unwrap();
        assert_eq!(res, r#"<?xml version="1.0" encoding="UTF-8"?><user id="42"><name>Alice</name></user>"#);
    }

    #[test]
    fn test_array_root() {
        let json = r#"[1, 2, 3]"#;
        let res = convert_json_to_xml(json, Some("numbers"), 0).unwrap();
        assert_eq!(res, r#"<?xml version="1.0" encoding="UTF-8"?><numbers><item>1</item><item>2</item><item>3</item></numbers>"#);
    }
}
