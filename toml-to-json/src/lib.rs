//! # TOML to JSON Converter WASM Module
//!
//! Standard C-ABI Envelope Protocol module for parsing TOML documents
//! and converting them into formatted or minified JSON with preserved key ordering.

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
    pub toml: Option<String>,
    pub indent: Option<usize>,
}

#[derive(Debug, Serialize)]
pub struct ConvertData {
    pub json: String,
    #[serde(rename = "lineCount")]
    pub line_count: usize,
    #[serde(rename = "byteLength")]
    pub byte_length: usize,
    pub indent: usize,
    #[serde(rename = "sourceSizeBytes")]
    pub source_size_bytes: usize,
    #[serde(rename = "targetSizeBytes")]
    pub target_size_bytes: usize,
    pub indented: bool,
}

// ============================================================================
// Core Logic
// ============================================================================

pub fn convert_toml_to_json(toml_str: &str, indent: Option<usize>) -> Result<ConvertData, String> {
    let indent_spaces = indent.unwrap_or(2);
    let src_bytes = toml_str.len();

    if toml_str.trim().is_empty() {
        return Ok(ConvertData {
            json: "{}".to_string(),
            line_count: 1,
            byte_length: 2,
            indent: indent_spaces,
            source_size_bytes: src_bytes,
            target_size_bytes: 2,
            indented: false,
        });
    }

    // 解析 TOML 为泛型 serde_json::Value
    let val: serde_json::Value = toml::from_str(toml_str)
        .map_err(|e| format!("TOML parsing error: {}", e))?;

    let json = if indent_spaces == 0 {
        serde_json::to_string(&val)
            .map_err(|e| format!("JSON serialization error: {}", e))?
    } else {
        serde_json::to_string_pretty(&val)
            .map_err(|e| format!("JSON pretty serialization error: {}", e))?
    };

    let line_count = json.lines().count();
    let target_size = json.len();

    Ok(ConvertData {
        json,
        line_count,
        byte_length: target_size,
        indent: indent_spaces,
        source_size_bytes: src_bytes,
        target_size_bytes: target_size,
        indented: indent_spaces > 0,
    })
}

pub fn get_sample_toml() -> &'static str {
    r#"# WasmForge Sample Configuration
title = "WasmForge Project"
version = "1.0.0"

[owner]
name = "Antigravity Team"
email = "dev@wasmforge.org"
active = true

[database]
enabled = true
ports = [8000, 8001, 8002]
connection_max = 5000

[[servers]]
name = "alpha"
ip = "10.0.0.1"
role = "primary"

[[servers]]
name = "beta"
ip = "10.0.0.2"
role = "standby"
"#
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
        "toml/to-json" => {
            let params: ConvertParams = match serde_json::from_value(req.params) {
                Ok(p) => p,
                Err(e) => return pack_error(400, &format!("Invalid parameters: {}", e), req_id),
            };

            let toml_str = params.toml.unwrap_or_default();
            let indent = params.indent;

            match convert_toml_to_json(&toml_str, indent) {
                Ok(data) => pack_success(data, req_id),
                Err(err) => pack_error(422, &err, req_id),
            }
        }
        "toml/sample" => {
            #[derive(Serialize)]
            struct SampleData {
                toml: &'static str,
            }

            pack_success(SampleData { toml: get_sample_toml() }, req_id)
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
    fn test_toml_to_json_conversion() {
        let toml = "name = \"WasmForge\"\nversion = 1.0\nenabled = true\nports = [80, 443]";
        let res = convert_toml_to_json(toml, Some(2)).expect("convert failed");
        assert!(res.json.contains("\"name\": \"WasmForge\""));
        assert!(res.json.contains("\"version\": 1.0"));
        assert!(res.json.contains("80"));
        assert_eq!(res.source_size_bytes, toml.len());
        assert!(res.target_size_bytes > 0);
    }

    #[test]
    fn test_empty_toml() {
        let res = convert_toml_to_json("", Some(2)).expect("empty toml should succeed");
        assert_eq!(res.json, "{}");
    }

    #[test]
    fn test_compact_json() {
        let toml = "a = 1\nb = 2";
        let res = convert_toml_to_json(toml, Some(0)).expect("compact should succeed");
        assert_eq!(res.json, "{\"a\":1,\"b\":2}");
        assert_eq!(res.line_count, 1);
    }
}
