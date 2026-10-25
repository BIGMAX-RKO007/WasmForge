//! # JSON to TOML Converter WASM Module
//!
//! Standard C-ABI Envelope Protocol module for parsing JSON documents
//! and converting them into formatted TOML configurations.

use std::slice;
use serde::{Deserialize, Serialize};

// ============================================================================
// Envelope Protocol Types
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct WasmRequest {
    pub action: String,
    #[serde(rename = "requestId", default)]
    pub request_id: String,
    #[serde(default)]
    pub params: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct WasmResponse<T: Serialize> {
    pub code: i32,
    pub msg: String,
    #[serde(rename = "requestId", skip_serializing_if = "Option::is_none")]
    pub request_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
}

#[derive(Debug, Deserialize)]
pub struct ConvertParams {
    pub json: Option<String>,
    #[serde(default)]
    pub pretty: Option<bool>,
}

#[derive(Debug, Serialize)]
pub struct ConvertData {
    pub toml: String,
    #[serde(rename = "lineCount")]
    pub line_count: usize,
    #[serde(rename = "byteLength")]
    pub byte_length: usize,
    #[serde(rename = "sourceSizeBytes")]
    pub source_size_bytes: usize,
    #[serde(rename = "targetSizeBytes")]
    pub target_size_bytes: usize,
}

// ============================================================================
// Core Logic
// ============================================================================

pub fn convert_json_to_toml(json_str: &str, pretty: bool) -> Result<ConvertData, String> {
    let src_bytes = json_str.len();

    if json_str.trim().is_empty() {
        return Ok(ConvertData {
            toml: "".to_string(),
            line_count: 0,
            byte_length: 0,
            source_size_bytes: src_bytes,
            target_size_bytes: 0,
        });
    }

    // 解析 JSON 为 toml::Value，并确保根节点为 Table
    let toml_val: toml::Value = match serde_json::from_str::<toml::Value>(json_str) {
        Ok(toml::Value::Table(table)) => toml::Value::Table(table),
        Ok(other) => {
            let mut table = toml::map::Map::new();
            table.insert("items".to_string(), other);
            toml::Value::Table(table)
        }
        Err(e) => return Err(format!("JSON parsing error: {}", e)),
    };

    let toml_str = if pretty {
        toml::to_string_pretty(&toml_val).unwrap_or_else(|_| {
            toml::to_string(&toml_val).unwrap_or_default()
        })
    } else {
        toml::to_string(&toml_val).map_err(|e| format!("TOML serialization error: {}", e))?
    };

    let line_count = toml_str.lines().count();
    let target_size = toml_str.len();

    Ok(ConvertData {
        toml: toml_str,
        line_count,
        byte_length: target_size,
        source_size_bytes: src_bytes,
        target_size_bytes: target_size,
    })
}

pub fn get_sample_json() -> &'static str {
    r#"{
  "title": "WasmForge Project",
  "owner": {
    "name": "Antigravity Team",
    "email": "dev@wasmforge.org",
    "active": true
  },
  "database": {
    "enabled": true,
    "ports": [8000, 8001, 8002],
    "connection_max": 5000
  },
  "servers": [
    {
      "name": "alpha",
      "ip": "10.0.0.1",
      "role": "primary"
    },
    {
      "name": "beta",
      "ip": "10.0.0.2",
      "role": "standby"
    }
  ]
}"#
}

// ============================================================================
// Standard C-ABI Envelope Exports
// ============================================================================

#[no_mangle]
pub extern "C" fn alloc(size: usize) -> *mut u8 {
    let mut buf = Vec::with_capacity(size);
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr
}

#[no_mangle]
pub unsafe extern "C" fn dealloc(ptr: *mut u8, size: usize) {
    if !ptr.is_null() {
        let _ = Vec::from_raw_parts(ptr, 0, size);
    }
}

#[no_mangle]
pub unsafe extern "C" fn dispatch(ptr: *const u8, len: usize) -> u64 {
    if ptr.is_null() || len == 0 {
        return pack_error(400, "Null or empty input payload", None);
    }

    let in_bytes = slice::from_raw_parts(ptr, len);
    let req: WasmRequest = match serde_json::from_slice(in_bytes) {
        Ok(r) => r,
        Err(e) => return pack_error(400, &format!("Invalid JSON envelope: {}", e), None),
    };

    let req_id = if req.request_id.is_empty() {
        None
    } else {
        Some(req.request_id)
    };

    match req.action.as_str() {
        "json/to-toml" => {
            let params: ConvertParams = match serde_json::from_value(req.params) {
                Ok(p) => p,
                Err(e) => return pack_error(400, &format!("Invalid parameters: {}", e), req_id),
            };

            let json_str = params.json.unwrap_or_default();
            let pretty = params.pretty.unwrap_or(true);

            match convert_json_to_toml(&json_str, pretty) {
                Ok(data) => pack_success(data, req_id),
                Err(err) => pack_error(422, &err, req_id),
            }
        }
        "json/sample" => {
            #[derive(Serialize)]
            struct SampleData {
                json: &'static str,
            }

            pack_success(SampleData { json: get_sample_json() }, req_id)
        }
        _ => pack_error(404, &format!("Unknown action: {}", req.action), req_id),
    }
}

fn pack_success<T: Serialize>(data: T, request_id: Option<String>) -> u64 {
    let resp = WasmResponse {
        code: 0,
        msg: "ok".to_string(),
        request_id,
        data: Some(data),
    };
    pack_json_response(&resp)
}

fn pack_error(code: i32, msg: &str, request_id: Option<String>) -> u64 {
    let resp: WasmResponse<()> = WasmResponse {
        code,
        msg: msg.to_string(),
        request_id,
        data: None,
    };
    pack_json_response(&resp)
}

fn pack_json_response<T: Serialize>(resp: &WasmResponse<T>) -> u64 {
    let out_bytes = match serde_json::to_vec(resp) {
        Ok(b) => b,
        Err(_) => b"{\"code\":500,\"msg\":\"JSON serialization failed\"}".to_vec(),
    };

    let out_len = out_bytes.len();
    let boxed_slice = out_bytes.into_boxed_slice();
    let out_ptr = Box::into_raw(boxed_slice) as *mut u8 as usize;

    ((out_ptr as u64) << 32) | ((out_len as u64) & 0xFFFFFFFF)
}

// ============================================================================
// Unit Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_json_to_toml_conversion() {
        let json = r#"{"name":"WasmForge","version":1.0,"database":{"port":5432}}"#;
        let res = convert_json_to_toml(json, true).expect("convert failed");
        assert!(res.toml.contains("name = \"WasmForge\""));
        assert!(res.toml.contains("[database]"));
        assert!(res.toml.contains("port = 5432"));
        assert_eq!(res.source_size_bytes, json.len());
        assert!(res.target_size_bytes > 0);
    }

    #[test]
    fn test_empty_json() {
        let res = convert_json_to_toml("", true).expect("empty json should succeed");
        assert_eq!(res.toml, "");
    }

    #[test]
    fn test_json_array_wrapping() {
        let json = r#"[1, 2, 3]"#;
        let res = convert_json_to_toml(json, true).expect("array wrapping should succeed");
        assert!(res.toml.contains("items = ["));
    }
}
