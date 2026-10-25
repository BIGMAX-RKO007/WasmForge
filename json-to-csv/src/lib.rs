use csv::WriterBuilder;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::BTreeMap;

fn flatten_value(prefix: &str, val: &Value, map: &mut BTreeMap<String, String>) {
    match val {
        Value::Object(obj) => {
            for (k, v) in obj {
                let new_key = if prefix.is_empty() {
                    k.clone()
                } else {
                    format!("{}.{}", prefix, k)
                };
                flatten_value(&new_key, v, map);
            }
        }
        Value::Array(arr) => {
            let is_all_primitive = arr.iter().all(|item| !item.is_object() && !item.is_array());
            if is_all_primitive {
                let joined = arr
                    .iter()
                    .map(|item| match item {
                        Value::String(s) => s.clone(),
                        Value::Number(n) => n.to_string(),
                        Value::Bool(b) => b.to_string(),
                        Value::Null => "".to_string(),
                        _ => item.to_string(),
                    })
                    .collect::<Vec<_>>()
                    .join(", ");
                map.insert(prefix.to_string(), joined);
            } else {
                for (idx, item) in arr.iter().enumerate() {
                    let new_key = if prefix.is_empty() {
                        format!("[{}]", idx)
                    } else {
                        format!("{}[{}]", prefix, idx)
                    };
                    flatten_value(&new_key, item, map);
                }
            }
        }
        Value::String(s) => {
            map.insert(prefix.to_string(), s.clone());
        }
        Value::Number(n) => {
            map.insert(prefix.to_string(), n.to_string());
        }
        Value::Bool(b) => {
            map.insert(prefix.to_string(), b.to_string());
        }
        Value::Null => {
            map.insert(prefix.to_string(), "".to_string());
        }
    }
}

pub fn convert_json_to_csv(
    json_str: &str,
    delimiter: Option<&str>,
    include_headers: bool,
    flatten: bool,
) -> Result<String, String> {
    let parsed: Value = serde_json::from_str(json_str)
        .map_err(|e| format!("JSON 解析错误: {}", e))?;

    // Determine records
    let records: Vec<&Value> = match &parsed {
        Value::Array(arr) => arr.iter().collect(),
        Value::Object(map) => {
            // Check if there is an array property inside (e.g., {"users": [...]})
            let array_val = map.values().find(|v| v.is_array());
            if let Some(Value::Array(arr)) = array_val {
                arr.iter().collect()
            } else {
                vec![&parsed]
            }
        }
        _ => return Err("输入 JSON 必须为对象数组或包含数组的对象".to_string()),
    };

    if records.is_empty() {
        return Ok("".to_string());
    }

    // Process rows into key-value maps
    let mut rows_data: Vec<Vec<(String, String)>> = Vec::with_capacity(records.len());
    let mut all_headers: Vec<String> = Vec::new();

    for record in &records {
        let mut row_map = BTreeMap::new();
        if flatten {
            flatten_value("", record, &mut row_map);
        } else if let Value::Object(obj) = record {
            for (k, v) in obj {
                let val_str = match v {
                    Value::String(s) => s.clone(),
                    Value::Number(n) => n.to_string(),
                    Value::Bool(b) => b.to_string(),
                    Value::Null => "".to_string(),
                    _ => v.to_string(),
                };
                row_map.insert(k.clone(), val_str);
            }
        } else {
            row_map.insert("value".to_string(), record.to_string());
        }

        for k in row_map.keys() {
            if !all_headers.contains(k) {
                all_headers.push(k.clone());
            }
        }

        rows_data.push(row_map.into_iter().collect());
    }

    // Delimiter setup
    let delim_byte = match delimiter.unwrap_or(",") {
        ";" => b';',
        "\t" | "tab" => b'\t',
        "|" => b'|',
        _ => b',',
    };

    let mut wtr = WriterBuilder::new()
        .delimiter(delim_byte)
        .from_writer(vec![]);

    // 1. Headers
    if include_headers {
        wtr.write_record(&all_headers)
            .map_err(|e| format!("写入 CSV 表头错误: {}", e))?;
    }

    // 2. Rows
    for row in rows_data {
        let mut record_row: Vec<String> = Vec::with_capacity(all_headers.len());
        for h in &all_headers {
            let val = row
                .iter()
                .find(|(k, _)| k == h)
                .map(|(_, v)| v.as_str())
                .unwrap_or("");
            record_row.push(val.to_string());
        }
        wtr.write_record(&record_row)
            .map_err(|e| format!("写入 CSV 数据行错误: {}", e))?;
    }

    let csv_bytes = wtr.into_inner().map_err(|e| format!("生成 CSV 结果失败: {}", e))?;
    String::from_utf8(csv_bytes).map_err(|e| format!("CSV 字符编码错误: {}", e))
}

pub fn get_sample_json() -> &'static str {
    r#"[
  {
    "id": 1001,
    "name": "Alice Johnson",
    "role": "Lead Architect",
    "contact": {
      "email": "alice@wasmforge.org",
      "phone": "+1-555-0199"
    },
    "skills": ["Rust", "Wasm", "Distributed Systems"],
    "active": true
  },
  {
    "id": 1002,
    "name": "Bob Smith",
    "role": "Frontend Engineer",
    "contact": {
      "email": "bob@wasmforge.org",
      "phone": "+1-555-0142"
    },
    "skills": ["TypeScript", "HTMX", "CSS"],
    "active": true
  },
  {
    "id": 1003,
    "name": "Carol Williams",
    "role": "Security Researcher",
    "contact": {
      "email": "carol@wasmforge.org"
    },
    "skills": ["Cryptography", "Audit", "Zero-Knowledge"],
    "active": false
  }
]"#
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
    csv: String,
    delimiter: String,
    #[serde(rename = "sourceSizeBytes")]
    source_size_bytes: usize,
    #[serde(rename = "targetSizeBytes")]
    target_size_bytes: usize,
    #[serde(rename = "rowCount")]
    row_count: usize,
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
        "json/to-csv" => {
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

            let delimiter = req.params.get("delimiter").and_then(|v| v.as_str());
            let include_headers = req
                .params
                .get("includeHeaders")
                .and_then(|v| v.as_bool())
                .unwrap_or(true);
            let flatten = req
                .params
                .get("flatten")
                .and_then(|v| v.as_bool())
                .unwrap_or(true);

            match convert_json_to_csv(json_input, delimiter, include_headers, flatten) {
                Ok(csv_res) => {
                    let source_len = json_input.len();
                    let target_len = csv_res.len();
                    let rows = csv_res.lines().count();
                    pack_response(ResponseEnvelope {
                        code: 0,
                        msg: "OK".to_string(),
                        request_id: req_id,
                        data: Some(ConvertResult {
                            csv: csv_res,
                            delimiter: delimiter.unwrap_or(",").to_string(),
                            source_size_bytes: source_len,
                            target_size_bytes: target_len,
                            row_count: rows,
                        }),
                    })
                }
                Err(err_msg) => pack_response(ResponseEnvelope::<()> {
                    code: 500,
                    msg: format!("JSON 转换 CSV 失败: {}", err_msg),
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
    fn test_convert_json_to_csv_success() {
        let sample = get_sample_json();
        let csv = convert_json_to_csv(sample, Some(","), true, true).unwrap();
        println!("Generated CSV:\n{}", csv);
        assert!(csv.contains("contact.email"));
        assert!(csv.contains("alice@wasmforge.org"));
        assert!(csv.contains("Alice Johnson"));
        assert!(csv.contains("Lead Architect"));
        assert!(csv.contains("Rust, Wasm, Distributed Systems"));
    }

    #[test]
    fn test_semicolon_delimiter() {
        let json = r#"[{"a": 1, "b": "hello;world"}]"#;
        let csv = convert_json_to_csv(json, Some(";"), true, false).unwrap();
        assert!(csv.contains(";"));
        assert!(csv.contains("\"hello;world\""));
    }

    #[test]
    fn test_single_object() {
        let json = r#"{"name": "Server", "status": "running"}"#;
        let csv = convert_json_to_csv(json, None, true, false).unwrap();
        assert!(csv.contains("name,status"));
        assert!(csv.contains("Server,running"));
    }
}
