extern crate alloc;

use alloc::string::{String, ToString};
use alloc::vec::Vec;
use core::slice;
use serde::{Deserialize, Serialize};
use serde_yaml::Value;

#[derive(Deserialize)]
struct RequestEnvelope {
    action: String,
    #[serde(default)]
    #[allow(dead_code)]
    request_id: Option<String>,
    #[serde(default)]
    params: serde_json::Value,
}

#[derive(Serialize)]
struct ResponseEnvelope<T> {
    code: i32,
    msg: String,
    data: Option<T>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct YamlNode {
    pub path: String,
    pub key: String,
    pub node_type: String,
    pub preview: String,
    pub depth: usize,
    pub has_children: bool,
    pub child_count: usize,
    pub doc_index: usize,
}

#[derive(Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct YamlTreeStats {
    pub total_nodes: usize,
    pub leaf_nodes: usize,
    pub max_depth: usize,
    pub mapping_count: usize,
    pub sequence_count: usize,
    pub scalar_count: usize,
    pub document_count: usize,
    pub byte_size: usize,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct YamlInspectResult {
    pub stats: YamlTreeStats,
    pub nodes: Vec<YamlNode>,
    pub document_count: usize,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct YamlQueryResult {
    pub query: String,
    pub match_count: usize,
    pub matches: Vec<YamlNode>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct YamlSampleResult {
    pub sample_yaml: String,
}

fn format_yaml_scalar(val: &Value) -> (String, String) {
    match val {
        Value::Null => ("null".to_string(), "null".to_string()),
        Value::Bool(b) => ("boolean".to_string(), b.to_string()),
        Value::Number(n) => ("number".to_string(), n.to_string()),
        Value::String(s) => {
            let escaped = if s.len() > 60 {
                format!("\"{}...\"", &s[..60])
            } else {
                format!("\"{}\"", s)
            };
            ("string".to_string(), escaped)
        }
        Value::Sequence(seq) => ("sequence".to_string(), format!("[{} items]", seq.len())),
        Value::Mapping(map) => ("mapping".to_string(), format!("{{{} keys}}", map.len())),
        Value::Tagged(tagged) => ("tagged".to_string(), format!("!{} {:?}", tagged.tag, tagged.value)),
    }
}

fn traverse_yaml(
    val: &Value,
    key_name: &str,
    curr_path: &str,
    depth: usize,
    doc_index: usize,
    nodes: &mut Vec<YamlNode>,
    stats: &mut YamlTreeStats,
) {
    stats.total_nodes += 1;
    if depth > stats.max_depth {
        stats.max_depth = depth;
    }

    match val {
        Value::Mapping(map) => {
            stats.mapping_count += 1;
            let node = YamlNode {
                path: curr_path.to_string(),
                key: key_name.to_string(),
                node_type: "mapping".to_string(),
                preview: format!("{{{} keys}}", map.len()),
                depth,
                has_children: !map.is_empty(),
                child_count: map.len(),
                doc_index,
            };
            nodes.push(node);

            for (k, v) in map {
                let k_str = match k {
                    Value::String(s) => s.clone(),
                    Value::Number(n) => n.to_string(),
                    Value::Bool(b) => b.to_string(),
                    _ => format!("{:?}", k),
                };
                let child_path = if curr_path == "$" || curr_path.ends_with("---") {
                    format!("{}.{}", curr_path, k_str)
                } else {
                    format!("{}.{}", curr_path, k_str)
                };
                traverse_yaml(v, &k_str, &child_path, depth + 1, doc_index, nodes, stats);
            }
        }
        Value::Sequence(seq) => {
            stats.sequence_count += 1;
            let node = YamlNode {
                path: curr_path.to_string(),
                key: key_name.to_string(),
                node_type: "sequence".to_string(),
                preview: format!("[{} items]", seq.len()),
                depth,
                has_children: !seq.is_empty(),
                child_count: seq.len(),
                doc_index,
            };
            nodes.push(node);

            for (idx, item) in seq.iter().enumerate() {
                let child_key = format!("[{}]", idx);
                let child_path = format!("{}{}", curr_path, child_key);
                traverse_yaml(item, &child_key, &child_path, depth + 1, doc_index, nodes, stats);
            }
        }
        Value::Tagged(tagged) => {
            traverse_yaml(&tagged.value, key_name, curr_path, depth, doc_index, nodes, stats);
        }
        scalar => {
            stats.leaf_nodes += 1;
            stats.scalar_count += 1;
            let (n_type, preview) = format_yaml_scalar(scalar);
            let node = YamlNode {
                path: curr_path.to_string(),
                key: key_name.to_string(),
                node_type: n_type,
                preview,
                depth,
                has_children: false,
                child_count: 0,
                doc_index,
            };
            nodes.push(node);
        }
    }
}

fn parse_all_yaml_docs(yaml_str: &str) -> Result<Vec<Value>, String> {
    let mut docs = Vec::new();
    for document in serde_yaml::Deserializer::from_str(yaml_str) {
        let val = Value::deserialize(document).map_err(|e| format!("YAML 解析语法错误: {}", e))?;
        docs.push(val);
    }
    if docs.is_empty() {
        return Err("YAML 内容为空或未包含有效结构".to_string());
    }
    Ok(docs)
}

fn inspect_yaml(yaml_str: &str) -> Result<YamlInspectResult, String> {
    let docs = parse_all_yaml_docs(yaml_str)?;
    let mut stats = YamlTreeStats {
        byte_size: yaml_str.len(),
        document_count: docs.len(),
        ..Default::default()
    };
    let mut nodes = Vec::new();

    for (idx, doc) in docs.iter().enumerate() {
        let root_key = if docs.len() > 1 {
            format!("Doc #{}", idx + 1)
        } else {
            "root".to_string()
        };
        let root_path = if docs.len() > 1 {
            format!("$doc[{}]", idx)
        } else {
            "$".to_string()
        };
        traverse_yaml(doc, &root_key, &root_path, 0, idx, &mut nodes, &mut stats);
    }

    Ok(YamlInspectResult {
        stats,
        nodes,
        document_count: docs.len(),
    })
}

fn query_yaml(yaml_str: &str, query: &str) -> Result<YamlQueryResult, String> {
    let inspected = inspect_yaml(yaml_str)?;
    let q = query.trim().to_lowercase();
    let matches: Vec<YamlNode> = inspected
        .nodes
        .into_iter()
        .filter(|n| {
            if q.is_empty() {
                true
            } else {
                n.path.to_lowercase().contains(&q)
                    || n.key.to_lowercase().contains(&q)
                    || n.preview.to_lowercase().contains(&q)
                    || n.node_type.to_lowercase().contains(&q)
            }
        })
        .collect();

    Ok(YamlQueryResult {
        query: query.to_string(),
        match_count: matches.len(),
        matches,
    })
}

const SAMPLE_YAML: &str = r#"# WasmForge Kubernetes Production Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wasmforge-gateway
  namespace: production
  labels:
    app.kubernetes.io/name: wasmforge
    app.kubernetes.io/part-of: toolchain
spec:
  replicas: 3
  selector:
    matchLabels:
      app: wasmforge-gateway
  template:
    metadata:
      labels:
        app: wasmforge-gateway
    spec:
      containers:
        - name: gateway
          image: wasmforge/edge-runtime:1.0.0
          ports:
            - containerPort: 3000
              name: http
          env:
            - name: NODE_ENV
              value: "production"
            - name: WASM_ENGINE
              value: "dual-hono-htmx"
          resources:
            limits:
              cpu: "1000m"
              memory: "512Mi"
            requests:
              cpu: "100m"
              memory: "128Mi"
---
# Gateway Service
apiVersion: v1
kind: Service
metadata:
  name: wasmforge-service
  namespace: production
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 3000
  selector:
    app: wasmforge-gateway
"#;

fn handle_dispatch(in_bytes: &[u8]) -> Vec<u8> {
    let req: RequestEnvelope = match serde_json::from_slice(in_bytes) {
        Ok(r) => r,
        Err(e) => {
            let res = ResponseEnvelope::<()> {
                code: 400,
                msg: format!("请求 JSON 格式反序列化失败: {}", e),
                data: None,
            };
            return serde_json::to_vec(&res).unwrap_or_default();
        }
    };

    match req.action.as_str() {
        "yaml/inspect" => {
            let yaml_str = match req.params.get("yaml").and_then(|v| v.as_str()) {
                Some(s) if !s.trim().is_empty() => s,
                _ => {
                    let res = ResponseEnvelope::<()> {
                        code: 400,
                        msg: "缺失必要的参数 'yaml'".to_string(),
                        data: None,
                    };
                    return serde_json::to_vec(&res).unwrap_or_default();
                }
            };

            match inspect_yaml(yaml_str) {
                Ok(data) => {
                    let res = ResponseEnvelope {
                        code: 0,
                        msg: "success".to_string(),
                        data: Some(data),
                    };
                    serde_json::to_vec(&res).unwrap_or_default()
                }
                Err(e) => {
                    let res = ResponseEnvelope::<()> {
                        code: 422,
                        msg: e,
                        data: None,
                    };
                    serde_json::to_vec(&res).unwrap_or_default()
                }
            }
        }
        "yaml/query" => {
            let yaml_str = match req.params.get("yaml").and_then(|v| v.as_str()) {
                Some(s) if !s.trim().is_empty() => s,
                _ => {
                    let res = ResponseEnvelope::<()> {
                        code: 400,
                        msg: "缺失必要的参数 'yaml'".to_string(),
                        data: None,
                    };
                    return serde_json::to_vec(&res).unwrap_or_default();
                }
            };

            let query = req.params.get("query").and_then(|v| v.as_str()).unwrap_or("");

            match query_yaml(yaml_str, query) {
                Ok(data) => {
                    let res = ResponseEnvelope {
                        code: 0,
                        msg: "success".to_string(),
                        data: Some(data),
                    };
                    serde_json::to_vec(&res).unwrap_or_default()
                }
                Err(e) => {
                    let res = ResponseEnvelope::<()> {
                        code: 422,
                        msg: e,
                        data: None,
                    };
                    serde_json::to_vec(&res).unwrap_or_default()
                }
            }
        }
        "yaml/sample" => {
            let res = ResponseEnvelope {
                code: 0,
                msg: "success".to_string(),
                data: Some(YamlSampleResult {
                    sample_yaml: SAMPLE_YAML.to_string(),
                }),
            };
            serde_json::to_vec(&res).unwrap_or_default()
        }
        _ => {
            let res = ResponseEnvelope::<()> {
                code: 404,
                msg: format!("未知的 action 操作: {}", req.action),
                data: None,
            };
            serde_json::to_vec(&res).unwrap_or_default()
        }
    }
}

// 纯 C-ABI 内存交互函数导出
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
    fn test_yaml_inspect() {
        let yaml = "name: WasmForge\nversion: 1.0\ntags:\n  - rust\n  - wasm";
        let res = inspect_yaml(yaml).expect("inspect failed");
        assert_eq!(res.document_count, 1);
        assert!(res.stats.total_nodes >= 5);
        assert_eq!(res.stats.sequence_count, 1);
        assert_eq!(res.stats.mapping_count, 1);
    }

    #[test]
    fn test_yaml_multi_doc_query() {
        let yaml = "doc: one\n---\ndoc: two\nactive: true";
        let res = query_yaml(yaml, "active").expect("query failed");
        assert_eq!(res.match_count, 1);
        assert!(res.matches[0].path.contains("active"));
    }
}
