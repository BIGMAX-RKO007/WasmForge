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
pub struct InspectJsonParams {
    pub json: String,
    #[serde(default)]
    pub max_depth: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryJsonParams {
    pub json: String,
    pub query: String, // search keyword or path segment
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TreeNode {
    pub path: String,
    pub key: String,
    pub node_type: String, // "object", "array", "string", "number", "boolean", "null"
    pub preview: String,
    pub depth: usize,
    pub has_children: bool,
    pub child_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TreeStats {
    pub total_nodes: usize,
    pub leaf_nodes: usize,
    pub max_depth: usize,
    pub key_count: usize,
    pub byte_size: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InspectJsonResult {
    pub root_type: String,
    pub nodes: Vec<TreeNode>,
    pub stats: TreeStats,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryJsonResult {
    pub query: String,
    pub match_count: usize,
    pub matches: Vec<TreeNode>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JsonViewerSampleResult {
    pub sample_json: String,
    pub inspection: InspectJsonResult,
    pub sample_query: QueryJsonResult,
}

fn build_tree_nodes(
    val: &Value,
    key: &str,
    path: &str,
    depth: usize,
    limit_depth: usize,
    nodes: &mut Vec<TreeNode>,
    stats: &mut TreeStats,
) {
    stats.total_nodes += 1;
    if depth > stats.max_depth {
        stats.max_depth = depth;
    }

    match val {
        Value::Object(map) => {
            let child_count = map.len();
            stats.key_count += child_count;
            let preview = format!("{{{}}}", child_count);

            nodes.push(TreeNode {
                path: path.to_string(),
                key: key.to_string(),
                node_type: "object".to_string(),
                preview,
                depth,
                has_children: child_count > 0,
                child_count,
            });

            if depth < limit_depth {
                for (k, v) in map {
                    let sub_path = if path == "$" {
                        format!("$.{}", k)
                    } else {
                        format!("{}.{}", path, k)
                    };
                    build_tree_nodes(v, k, &sub_path, depth + 1, limit_depth, nodes, stats);
                }
            }
        }
        Value::Array(arr) => {
            let child_count = arr.len();
            let preview = format!("[{}]", child_count);

            nodes.push(TreeNode {
                path: path.to_string(),
                key: key.to_string(),
                node_type: "array".to_string(),
                preview,
                depth,
                has_children: child_count > 0,
                child_count,
            });

            if depth < limit_depth {
                for (idx, item) in arr.iter().enumerate() {
                    let sub_path = format!("{}[{}]", path, idx);
                    let idx_str = format!("[{}]", idx);
                    build_tree_nodes(item, &idx_str, &sub_path, depth + 1, limit_depth, nodes, stats);
                }
            }
        }
        Value::String(s) => {
            stats.leaf_nodes += 1;
            nodes.push(TreeNode {
                path: path.to_string(),
                key: key.to_string(),
                node_type: "string".to_string(),
                preview: format!("\"{}\"", s),
                depth,
                has_children: false,
                child_count: 0,
            });
        }
        Value::Number(n) => {
            stats.leaf_nodes += 1;
            nodes.push(TreeNode {
                path: path.to_string(),
                key: key.to_string(),
                node_type: "number".to_string(),
                preview: n.to_string(),
                depth,
                has_children: false,
                child_count: 0,
            });
        }
        Value::Bool(b) => {
            stats.leaf_nodes += 1;
            nodes.push(TreeNode {
                path: path.to_string(),
                key: key.to_string(),
                node_type: "boolean".to_string(),
                preview: b.to_string(),
                depth,
                has_children: false,
                child_count: 0,
            });
        }
        Value::Null => {
            stats.leaf_nodes += 1;
            nodes.push(TreeNode {
                path: path.to_string(),
                key: key.to_string(),
                node_type: "null".to_string(),
                preview: "null".to_string(),
                depth,
                has_children: false,
                child_count: 0,
            });
        }
    }
}

pub fn inspect_json(params: &InspectJsonParams) -> Result<InspectJsonResult, String> {
    let val: Value = serde_json::from_str(&params.json)
        .map_err(|e| format!("JSON 语法错误 (行 {}, 列 {}): {}", e.line(), e.column(), e))?;

    let root_type = match &val {
        Value::Object(_) => "object",
        Value::Array(_) => "array",
        Value::String(_) => "string",
        Value::Number(_) => "number",
        Value::Bool(_) => "boolean",
        Value::Null => "null",
    }
    .to_string();

    let mut nodes = Vec::new();
    let mut stats = TreeStats {
        total_nodes: 0,
        leaf_nodes: 0,
        max_depth: 0,
        key_count: 0,
        byte_size: params.json.len(),
    };

    let limit_depth = params.max_depth.unwrap_or(100);
    build_tree_nodes(&val, "$", "$", 0, limit_depth, &mut nodes, &mut stats);

    Ok(InspectJsonResult {
        root_type,
        nodes,
        stats,
    })
}

pub fn query_json(params: &QueryJsonParams) -> Result<QueryJsonResult, String> {
    let inspection = inspect_json(&InspectJsonParams {
        json: params.json.clone(),
        max_depth: Some(100),
    })?;

    let q_lower = params.query.trim().to_lowercase();
    let mut matches = Vec::new();

    for node in inspection.nodes {
        if node.path.to_lowercase().contains(&q_lower)
            || node.key.to_lowercase().contains(&q_lower)
            || node.preview.to_lowercase().contains(&q_lower)
        {
            matches.push(node);
        }
    }

    Ok(QueryJsonResult {
        query: params.query.clone(),
        match_count: matches.len(),
        matches,
    })
}

pub fn get_sample() -> JsonViewerSampleResult {
    let sample_json = r#"{
  "project": "WasmForge",
  "version": "1.0.0",
  "meta": {
    "author": "Antigravity",
    "license": "MIT",
    "stars": 1280
  },
  "capabilities": [
    {
      "domain": 1,
      "name": "Crypto & Security",
      "toolsCount": 11,
      "active": true
    },
    {
      "domain": 2,
      "name": "Converters",
      "toolsCount": 21,
      "active": true
    },
    {
      "domain": 3,
      "name": "Development Tools",
      "toolsCount": 13,
      "active": true
    }
  ]
}"#
    .to_string();

    let inspection = inspect_json(&InspectJsonParams {
        json: sample_json.clone(),
        max_depth: Some(10),
    })
    .unwrap();

    let sample_query = query_json(&QueryJsonParams {
        json: sample_json.clone(),
        query: "toolsCount".to_string(),
    })
    .unwrap();

    JsonViewerSampleResult {
        sample_json,
        inspection,
        sample_query,
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
        "json/inspect" => {
            let params: InspectJsonParams = match req.params {
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

            match inspect_json(&params) {
                Ok(out) => {
                    let res = ResponseEnvelope {
                        code: 0,
                        msg: "JSON 树状节点解析成功".to_string(),
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
        "json/query" => {
            let params: QueryJsonParams = match req.params {
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

            match query_json(&params) {
                Ok(out) => {
                    let res = ResponseEnvelope {
                        code: 0,
                        msg: "JSON 节点检索成功".to_string(),
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
    fn test_inspect_and_query() {
        let json = r#"{"name": "WASM", "active": true, "list": [1, 2]}"#;
        let res = inspect_json(&InspectJsonParams {
            json: json.to_string(),
            max_depth: None,
        })
        .unwrap();

        assert_eq!(res.root_type, "object");
        assert_eq!(res.stats.total_nodes, 6); // $, $.name, $.active, $.list, $.list[0], $.list[1]
        assert_eq!(res.stats.leaf_nodes, 4);

        let q_res = query_json(&QueryJsonParams {
            json: json.to_string(),
            query: "list".to_string(),
        })
        .unwrap();
        assert!(q_res.match_count >= 1);
    }

    #[test]
    fn test_dispatch() {
        let req = serde_json::json!({
            "action": "json/inspect",
            "params": {
                "json": "{\"test\": 123}"
            }
        });
        let bytes = serde_json::to_vec(&req).unwrap();
        let out = handle_dispatch(&bytes);
        let resp: serde_json::Value = serde_json::from_slice(&out).unwrap();
        assert_eq!(resp["code"], 0);
        assert_eq!(resp["data"]["stats"]["totalNodes"], 2);
    }
}
