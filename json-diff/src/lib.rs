extern crate alloc;

use alloc::collections::BTreeSet;
use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec;
use alloc::vec::Vec;
use core::slice;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiffEntry {
    pub path: String,
    pub kind: String, // "added" | "removed" | "modified" | "type_changed"
    pub message: String,
    #[serde(rename = "oldValue")]
    pub old_value: Option<Value>,
    #[serde(rename = "newValue")]
    pub new_value: Option<Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JsonPatchOp {
    pub op: String, // "add" | "remove" | "replace"
    pub path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiffSummary {
    #[serde(rename = "totalChanges")]
    pub total_changes: usize,
    pub additions: usize,
    pub removals: usize,
    pub modifications: usize,
    pub equal: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiffResult {
    pub entries: Vec<DiffEntry>,
    pub patches: Vec<JsonPatchOp>,
    pub summary: DiffSummary,
}

fn escape_pointer(key: &str) -> String {
    key.replace('~', "~0").replace('/', "~1")
}

fn type_name(v: &Value) -> &'static str {
    match v {
        Value::Null => "null",
        Value::Bool(_) => "boolean",
        Value::Number(_) => "number",
        Value::String(_) => "string",
        Value::Array(_) => "array",
        Value::Object(_) => "object",
    }
}

pub fn deep_diff(
    path: &str,
    left: &Value,
    right: &Value,
    entries: &mut Vec<DiffEntry>,
    patches: &mut Vec<JsonPatchOp>,
) {
    if left == right {
        return;
    }

    match (left, right) {
        (Value::Object(map_l), Value::Object(map_r)) => {
            let mut all_keys = BTreeSet::new();
            for k in map_l.keys() {
                all_keys.insert(k.clone());
            }
            for k in map_r.keys() {
                all_keys.insert(k.clone());
            }

            for key in all_keys {
                let sub_path = if path.is_empty() {
                    format!("/{}", escape_pointer(&key))
                } else {
                    format!("{}/{}", path, escape_pointer(&key))
                };

                match (map_l.get(&key), map_r.get(&key)) {
                    (Some(v_l), Some(v_r)) => {
                        deep_diff(&sub_path, v_l, v_r, entries, patches);
                    }
                    (Some(v_l), None) => {
                        entries.push(DiffEntry {
                            path: sub_path.clone(),
                            kind: "removed".to_string(),
                            message: format!("节点 '{}' 已被移除", key),
                            old_value: Some(v_l.clone()),
                            new_value: None,
                        });
                        patches.push(JsonPatchOp {
                            op: "remove".to_string(),
                            path: sub_path,
                            value: None,
                        });
                    }
                    (None, Some(v_r)) => {
                        entries.push(DiffEntry {
                            path: sub_path.clone(),
                            kind: "added".to_string(),
                            message: format!("新增节点 '{}'", key),
                            old_value: None,
                            new_value: Some(v_r.clone()),
                        });
                        patches.push(JsonPatchOp {
                            op: "add".to_string(),
                            path: sub_path,
                            value: Some(v_r.clone()),
                        });
                    }
                    (None, None) => {}
                }
            }
        }
        (Value::Array(arr_l), Value::Array(arr_r)) => {
            let max_len = arr_l.len().max(arr_r.len());
            for i in 0..max_len {
                let sub_path = format!("{}/{}", path, i);
                if i < arr_l.len() && i < arr_r.len() {
                    deep_diff(&sub_path, &arr_l[i], &arr_r[i], entries, patches);
                } else if i < arr_l.len() {
                    entries.push(DiffEntry {
                        path: sub_path.clone(),
                        kind: "removed".to_string(),
                        message: format!("数组下标 [{}] 元素已被移除", i),
                        old_value: Some(arr_l[i].clone()),
                        new_value: None,
                    });
                    patches.push(JsonPatchOp {
                        op: "remove".to_string(),
                        path: sub_path,
                        value: None,
                    });
                } else {
                    entries.push(DiffEntry {
                        path: sub_path.clone(),
                        kind: "added".to_string(),
                        message: format!("数组下标 [{}] 新增元素", i),
                        old_value: None,
                        new_value: Some(arr_r[i].clone()),
                    });
                    patches.push(JsonPatchOp {
                        op: "add".to_string(),
                        path: sub_path,
                        value: Some(arr_r[i].clone()),
                    });
                }
            }
        }
        _ => {
            let curr_path = if path.is_empty() { "/".to_string() } else { path.to_string() };
            let t_l = type_name(left);
            let t_r = type_name(right);

            if t_l != t_r {
                entries.push(DiffEntry {
                    path: curr_path.clone(),
                    kind: "type_changed".to_string(),
                    message: format!("类型变更: {} -> {}", t_l, t_r),
                    old_value: Some(left.clone()),
                    new_value: Some(right.clone()),
                });
            } else {
                entries.push(DiffEntry {
                    path: curr_path.clone(),
                    kind: "modified".to_string(),
                    message: "值已被修改".to_string(),
                    old_value: Some(left.clone()),
                    new_value: Some(right.clone()),
                });
            }

            patches.push(JsonPatchOp {
                op: "replace".to_string(),
                path: curr_path,
                value: Some(right.clone()),
            });
        }
    }
}

pub fn compare_json(left_str: &str, right_str: &str) -> Result<DiffResult, String> {
    let left_val: Value = serde_json::from_str(left_str)
        .map_err(|e| format!("左侧 (基准) JSON 解析失败: {}", e))?;
    let right_val: Value = serde_json::from_str(right_str)
        .map_err(|e| format!("右侧 (最新) JSON 解析失败: {}", e))?;

    let mut entries = Vec::new();
    let mut patches = Vec::new();

    deep_diff("", &left_val, &right_val, &mut entries, &mut patches);

    let mut additions = 0;
    let mut removals = 0;
    let mut modifications = 0;

    for e in &entries {
        match e.kind.as_str() {
            "added" => additions += 1,
            "removed" => removals += 1,
            _ => modifications += 1,
        }
    }

    let total = entries.len();
    let summary = DiffSummary {
        total_changes: total,
        additions,
        removals,
        modifications,
        equal: total == 0,
    };

    Ok(DiffResult {
        entries,
        patches,
        summary,
    })
}

#[derive(Debug, Deserialize)]
pub struct DiffParams {
    pub left: String,
    pub right: String,
}

#[derive(Debug, Serialize)]
pub struct DiffPreset {
    pub id: &'static str,
    pub name: &'static str,
    pub description: &'static str,
    pub left: &'static str,
    pub right: &'static str,
}

pub fn get_presets() -> Vec<DiffPreset> {
    vec![
        DiffPreset {
            id: "config-drift",
            name: "微服务配置漂移 (Config Drift)",
            description: "检测数据库连接池、端口变更、新增降级开关与已废弃密钥",
            left: r#"{
  "service": "order-api",
  "version": "1.2.0",
  "database": {
    "host": "db.prod.internal",
    "port": 5432,
    "poolSize": 20
  },
  "features": {
    "betaPricing": true,
    "legacyAuth": true
  },
  "endpoints": ["/api/v1/orders", "/api/v1/checkout"]
}"#,
            right: r#"{
  "service": "order-api",
  "version": "1.3.0",
  "database": {
    "host": "db-cluster.prod.internal",
    "port": 5432,
    "poolSize": 50,
    "ssl": true
  },
  "features": {
    "betaPricing": false,
    "fastCheckout": true
  },
  "endpoints": ["/api/v1/orders", "/api/v1/checkout", "/api/v2/orders"]
}"#,
        },
        DiffPreset {
            id: "user-profile",
            name: "用户画像变更 (User Profile)",
            description: "检测邮箱脱敏、角色提升与新增多因素鉴权状态",
            left: r#"{
  "uid": 10042,
  "name": "Alice Developer",
  "role": "editor",
  "mfaEnabled": false,
  "tags": ["frontend", "react"]
}"#,
            right: r#"{
  "uid": 10042,
  "name": "Alice Developer",
  "role": "admin",
  "mfaEnabled": true,
  "tags": ["frontend", "react", "rust", "wasm"]
}"#,
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
        "json/diff" | "json/compare" => {
            let params: DiffParams = match serde_json::from_value(req.params) {
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

            match compare_json(&params.left, &params.right) {
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
        "json/presets" | "json/samples" => {
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
    fn test_deep_diff_simple() {
        let l = r#"{"a": 1, "b": "hello"}"#;
        let r = r#"{"a": 2, "c": true}"#;
        let diff = compare_json(l, r).unwrap();

        assert_eq!(diff.summary.total_changes, 3);
        assert_eq!(diff.summary.additions, 1);
        assert_eq!(diff.summary.removals, 1);
        assert_eq!(diff.summary.modifications, 1);
        assert_eq!(diff.patches.len(), 3);
    }
}
