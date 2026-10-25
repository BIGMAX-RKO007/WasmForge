use core::slice;
use serde::{Deserialize, Serialize};
use serde_json::Value;

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
pub struct MinifyJsonParams {
    pub json: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrettifyJsonParams {
    pub json: String,
    #[serde(default)]
    pub indent: Option<u8>, // 2 or 4, default 2
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidateJsonParams {
    pub json: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JsonStats {
    pub original_length: usize,
    pub processed_length: usize,
    pub compression_ratio_percent: f64,
    pub line_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MinifyJsonResult {
    pub minified: String,
    pub stats: JsonStats,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrettifyJsonResult {
    pub prettified: String,
    pub stats: JsonStats,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TypeBreakdown {
    pub objects: usize,
    pub arrays: usize,
    pub strings: usize,
    pub numbers: usize,
    pub booleans: usize,
    pub nulls: usize,
    pub max_depth: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidateJsonResult {
    pub is_valid: bool,
    pub message: String,
    pub type_breakdown: TypeBreakdown,
    pub root_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JsonSampleResult {
    pub sample_json: String,
    pub minified: MinifyJsonResult,
    pub prettified: PrettifyJsonResult,
    pub analysis: ValidateJsonResult,
}

/// Strips single-line (// ...) and multi-line (/* ... */) comments while preserving strings
pub fn strip_json_comments(input: &str) -> String {
    let chars: Vec<char> = input.chars().collect();
    let n = chars.len();
    let mut out = String::with_capacity(n);
    let mut i = 0;
    let mut in_quote = false;

    while i < n {
        let c = chars[i];

        if c == '"' {
            // Count preceding escape backslashes
            let mut backslashes = 0;
            let mut k = i;
            while k > 0 && chars[k - 1] == '\\' {
                backslashes += 1;
                k -= 1;
            }
            if backslashes % 2 == 0 {
                in_quote = !in_quote;
            }
            out.push(c);
            i += 1;
            continue;
        }

        if in_quote {
            out.push(c);
            i += 1;
            continue;
        }

        // Check single-line comment: // ...
        if c == '/' && i + 1 < n && chars[i + 1] == '/' {
            i += 2;
            while i < n && chars[i] != '\n' && chars[i] != '\r' {
                i += 1;
            }
            continue;
        }

        // Check multi-line comment: /* ... */
        if c == '/' && i + 1 < n && chars[i + 1] == '*' {
            i += 2;
            while i + 1 < n && !(chars[i] == '*' && chars[i + 1] == '/') {
                i += 1;
            }
            if i + 1 < n {
                i += 2;
            }
            continue;
        }

        out.push(c);
        i += 1;
    }

    out
}

pub fn analyze_value(val: &Value, current_depth: usize, breakdown: &mut TypeBreakdown) {
    if current_depth > breakdown.max_depth {
        breakdown.max_depth = current_depth;
    }

    match val {
        Value::Null => breakdown.nulls += 1,
        Value::Bool(_) => breakdown.booleans += 1,
        Value::Number(_) => breakdown.numbers += 1,
        Value::String(_) => breakdown.strings += 1,
        Value::Array(arr) => {
            breakdown.arrays += 1;
            for item in arr {
                analyze_value(item, current_depth + 1, breakdown);
            }
        }
        Value::Object(map) => {
            breakdown.objects += 1;
            for (_k, v) in map {
                analyze_value(v, current_depth + 1, breakdown);
            }
        }
    }
}

pub fn minify_json(raw: &str) -> Result<MinifyJsonResult, String> {
    let clean = strip_json_comments(raw);
    let val: Value = serde_json::from_str(&clean)
        .map_err(|e| format!("JSON 语法解析失败 (行 {}, 列 {}): {}", e.line(), e.column(), e))?;

    let minified = serde_json::to_string(&val).map_err(|e| e.to_string())?;

    let original_length = raw.len();
    let minified_length = minified.len();
    let compression_ratio_percent = if original_length > 0 {
        ((1.0 - (minified_length as f64 / original_length as f64)) * 100.0).max(0.0)
    } else {
        0.0
    };

    let stats = JsonStats {
        original_length,
        processed_length: minified_length,
        compression_ratio_percent: (compression_ratio_percent * 100.0).round() / 100.0,
        line_count: 1,
    };

    Ok(MinifyJsonResult { minified, stats })
}

pub fn prettify_json(raw: &str, indent: u8) -> Result<PrettifyJsonResult, String> {
    let clean = strip_json_comments(raw);
    let val: Value = serde_json::from_str(&clean)
        .map_err(|e| format!("JSON 语法解析失败 (行 {}, 列 {}): {}", e.line(), e.column(), e))?;

    let pretty_2 = serde_json::to_string_pretty(&val).map_err(|e| e.to_string())?;
    let prettified = if indent == 4 {
        pretty_2
            .lines()
            .map(|line| {
                let leading_spaces = line.chars().take_while(|c| *c == ' ').count();
                let indent_level = leading_spaces / 2;
                let rest = &line[leading_spaces..];
                format!("{}{}", "    ".repeat(indent_level), rest)
            })
            .collect::<Vec<_>>()
            .join("\n")
    } else {
        pretty_2
    };

    let original_length = raw.len();
    let processed_length = prettified.len();
    let line_count = prettified.lines().count();

    let stats = JsonStats {
        original_length,
        processed_length,
        compression_ratio_percent: 0.0,
        line_count,
    };

    Ok(PrettifyJsonResult { prettified, stats })
}

pub fn validate_json(raw: &str) -> ValidateJsonResult {
    let clean = strip_json_comments(raw);
    match serde_json::from_str::<Value>(&clean) {
        Ok(val) => {
            let root_type = match &val {
                Value::Object(_) => "Object",
                Value::Array(_) => "Array",
                Value::String(_) => "String",
                Value::Number(_) => "Number",
                Value::Bool(_) => "Boolean",
                Value::Null => "Null",
            }
            .to_string();

            let mut breakdown = TypeBreakdown {
                objects: 0,
                arrays: 0,
                strings: 0,
                numbers: 0,
                booleans: 0,
                nulls: 0,
                max_depth: 0,
            };

            analyze_value(&val, 1, &mut breakdown);

            ValidateJsonResult {
                is_valid: true,
                message: "JSON 格式校验完全合法".to_string(),
                type_breakdown: breakdown,
                root_type,
            }
        }
        Err(e) => ValidateJsonResult {
            is_valid: false,
            message: format!("语法错误 (第 {} 行, 第 {} 列): {}", e.line(), e.column(), e),
            type_breakdown: TypeBreakdown {
                objects: 0,
                arrays: 0,
                strings: 0,
                numbers: 0,
                booleans: 0,
                nulls: 0,
                max_depth: 0,
            },
            root_type: "Unknown".to_string(),
        },
    }
}

pub fn get_sample() -> JsonSampleResult {
    let sample_json = r#"{
  // WasmForge platform configuration
  "platform": "WasmForge",
  "version": 1.0,
  "active": true,
  /* List of core architectural capabilities */
  "tools": [
    {
      "id": "json-minify",
      "category": "development",
      "speedMs": 0.05
    },
    {
      "id": "xml-formatter",
      "category": "development",
      "speedMs": 0.12
    }
  ],
  "meta": null
}"#
    .to_string();

    let minified = minify_json(&sample_json).unwrap_or_else(|_| MinifyJsonResult {
        minified: "{}".to_string(),
        stats: JsonStats {
            original_length: 0,
            processed_length: 0,
            compression_ratio_percent: 0.0,
            line_count: 1,
        },
    });

    let prettified = prettify_json(&sample_json, 2).unwrap_or_else(|_| PrettifyJsonResult {
        prettified: "{}".to_string(),
        stats: JsonStats {
            original_length: 0,
            processed_length: 0,
            compression_ratio_percent: 0.0,
            line_count: 1,
        },
    });

    let analysis = validate_json(&sample_json);

    JsonSampleResult {
        sample_json,
        minified,
        prettified,
        analysis,
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
        "json/minify" => {
            let params: MinifyJsonParams = match req.params {
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

            match minify_json(&params.json) {
                Ok(out) => {
                    let res = ResponseEnvelope {
                        code: 0,
                        msg: "JSON 压缩瘦身成功".to_string(),
                        request_id: req_id,
                        data: Some(out),
                    };
                    serde_json::to_vec(&res).unwrap_or_default()
                }
                Err(err_msg) => {
                    let res = ResponseEnvelope::<()> {
                        code: 422,
                        msg: err_msg,
                        request_id: req_id,
                        data: None,
                    };
                    serde_json::to_vec(&res).unwrap_or_default()
                }
            }
        }
        "json/prettify" => {
            let params: PrettifyJsonParams = match req.params {
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

            let indent = params.indent.unwrap_or(2);
            match prettify_json(&params.json, indent) {
                Ok(out) => {
                    let res = ResponseEnvelope {
                        code: 0,
                        msg: "JSON 格式化美化成功".to_string(),
                        request_id: req_id,
                        data: Some(out),
                    };
                    serde_json::to_vec(&res).unwrap_or_default()
                }
                Err(err_msg) => {
                    let res = ResponseEnvelope::<()> {
                        code: 422,
                        msg: err_msg,
                        request_id: req_id,
                        data: None,
                    };
                    serde_json::to_vec(&res).unwrap_or_default()
                }
            }
        }
        "json/validate" => {
            let params: ValidateJsonParams = match req.params {
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

            let out = validate_json(&params.json);
            let res = ResponseEnvelope {
                code: 0,
                msg: "JSON 语法深度解析完成".to_string(),
                request_id: req_id,
                data: Some(out),
            };
            serde_json::to_vec(&res).unwrap_or_default()
        }
        "json/sample" => {
            let sample = get_sample();
            let res = ResponseEnvelope {
                code: 0,
                msg: "获取 JSON 示例成功".to_string(),
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
    if ptr.is_null() || len == 0 {
        return 0;
    }
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
    fn test_minify_and_prettify() {
        let raw = r#"{
            // comment here
            "name": "WASM",
            /* multi line
               comment */
            "count": 42
        }"#;

        let min = minify_json(raw).unwrap();
        assert_eq!(min.minified, r#"{"count":42,"name":"WASM"}"#);
        assert_eq!(min.stats.line_count, 1);

        let pret = prettify_json(raw, 2).unwrap();
        assert!(pret.prettified.contains("  \"name\": \"WASM\""));
        assert!(pret.stats.line_count > 3);

        let val = validate_json(raw);
        assert!(val.is_valid);
        assert_eq!(val.root_type, "Object");
        assert_eq!(val.type_breakdown.strings, 1);
        assert_eq!(val.type_breakdown.numbers, 1);
    }

    #[test]
    fn test_dispatch() {
        let req = serde_json::json!({
            "action": "json/minify",
            "params": {
                "json": "{\"test\": [1, 2, 3]}"
            }
        });
        let bytes = serde_json::to_vec(&req).unwrap();
        let out = handle_dispatch(&bytes);
        let resp: serde_json::Value = serde_json::from_slice(&out).unwrap();
        assert_eq!(resp["code"], 0);
        assert_eq!(resp["data"]["minified"], "{\"test\":[1,2,3]}");
    }
}
