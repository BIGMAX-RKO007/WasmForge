use quick_xml::events::Event;
use quick_xml::reader::Reader;
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

#[derive(Debug, Clone)]
struct XmlNode {
    tag: String,
    attributes: Vec<(String, String)>,
    text: String,
    children: Vec<XmlNode>,
}

impl XmlNode {
    fn new(tag: String) -> Self {
        Self {
            tag,
            attributes: Vec::new(),
            text: String::new(),
            children: Vec::new(),
        }
    }

    fn to_json_value(&self) -> Value {
        // If leaf node with no attributes and no children
        if self.attributes.is_empty() && self.children.is_empty() {
            let trimmed = self.text.trim();
            if trimmed.is_empty() {
                return Value::Null;
            }
            if trimmed == "true" {
                return Value::Bool(true);
            }
            if trimmed == "false" {
                return Value::Bool(false);
            }
            if let Ok(i) = trimmed.parse::<i64>() {
                return Value::Number(i.into());
            }
            if let Ok(f) = trimmed.parse::<f64>() {
                if let Some(num) = serde_json::Number::from_f64(f) {
                    return Value::Number(num);
                }
            }
            return Value::String(trimmed.to_string());
        }

        let mut map = Map::new();

        // 1. Attributes with @ prefix
        for (k, v) in &self.attributes {
            map.insert(format!("@{}", k), Value::String(v.clone()));
        }

        // 2. Text content if mixed with attributes or children
        let trimmed_text = self.text.trim();
        if !trimmed_text.is_empty() {
            map.insert("$text".to_string(), Value::String(trimmed_text.to_string()));
        }

        // 3. Children grouped by tag name
        let mut grouped: group_map::GroupMap = Default::default();
        for child in &self.children {
            grouped.add(&child.tag, child.to_json_value());
        }

        for (child_tag, values) in grouped.into_iter() {
            if values.len() == 1 {
                map.insert(child_tag, values.into_iter().next().unwrap());
            } else {
                map.insert(child_tag, Value::Array(values));
            }
        }

        Value::Object(map)
    }
}

mod group_map {
    use serde_json::Value;

    #[derive(Default)]
    pub struct GroupMap {
        keys: Vec<String>,
        entries: Vec<Vec<Value>>,
    }

    impl GroupMap {
        pub fn add(&mut self, key: &str, val: Value) {
            if let Some(idx) = self.keys.iter().position(|k| k == key) {
                self.entries[idx].push(val);
            } else {
                self.keys.push(key.to_string());
                self.entries.push(vec![val]);
            }
        }

        pub fn into_iter(self) -> impl Iterator<Item = (String, Vec<Value>)> {
            self.keys.into_iter().zip(self.entries.into_iter())
        }
    }
}

pub fn parse_xml_to_json_value(xml_str: &str) -> Result<Value, String> {
    let mut reader = Reader::from_str(xml_str);
    reader.config_mut().trim_text(true);

    let mut buf = Vec::new();
    let mut stack: Vec<XmlNode> = Vec::new();
    let mut roots: Vec<XmlNode> = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(ref e)) => {
                let tag = String::from_utf8_lossy(e.name().as_ref()).to_string();
                let mut node = XmlNode::new(tag);
                for attr in e.attributes().flatten() {
                    let key = String::from_utf8_lossy(attr.key.as_ref()).to_string();
                    let val = String::from_utf8_lossy(&attr.value).to_string();
                    node.attributes.push((key, val));
                }
                stack.push(node);
            }
            Ok(Event::Empty(ref e)) => {
                let tag = String::from_utf8_lossy(e.name().as_ref()).to_string();
                let mut node = XmlNode::new(tag);
                for attr in e.attributes().flatten() {
                    let key = String::from_utf8_lossy(attr.key.as_ref()).to_string();
                    let val = String::from_utf8_lossy(&attr.value).to_string();
                    node.attributes.push((key, val));
                }
                if let Some(parent) = stack.last_mut() {
                    parent.children.push(node);
                } else {
                    roots.push(node);
                }
            }
            Ok(Event::Text(ref e)) => {
                let text = match e.unescape() {
                    Ok(t) => t.to_string(),
                    Err(_) => String::from_utf8_lossy(e.as_ref()).to_string(),
                };
                if let Some(current) = stack.last_mut() {
                    current.text.push_str(&text);
                }
            }
            Ok(Event::CData(ref e)) => {
                let text = String::from_utf8_lossy(e.as_ref()).to_string();
                if let Some(current) = stack.last_mut() {
                    current.text.push_str(&text);
                }
            }
            Ok(Event::End(_)) => {
                if let Some(finished_node) = stack.pop() {
                    if let Some(parent) = stack.last_mut() {
                        parent.children.push(finished_node);
                    } else {
                        roots.push(finished_node);
                    }
                }
            }
            Ok(Event::Eof) => break,
            Err(e) => return Err(format!("XML 解析错误 (位点: {}): {:?}", reader.error_position(), e)),
            _ => {}
        }
        buf.clear();
    }

    if roots.is_empty() {
        return Err("未在输入中检测到合法的 XML 根节点".to_string());
    }

    if roots.len() == 1 {
        let root = roots.into_iter().next().unwrap();
        let mut map = Map::new();
        map.insert(root.tag.clone(), root.to_json_value());
        Ok(Value::Object(map))
    } else {
        let mut list = Vec::new();
        for r in roots {
            let mut map = Map::new();
            map.insert(r.tag.clone(), r.to_json_value());
            list.push(Value::Object(map));
        }
        Ok(Value::Array(list))
    }
}

pub fn convert_xml_to_json(xml_str: &str, indent: usize) -> Result<String, String> {
    let json_val = parse_xml_to_json_value(xml_str)?;
    let output = match indent {
        0 => serde_json::to_string(&json_val).map_err(|e| e.to_string())?,
        2 => serde_json::to_string_pretty(&json_val).map_err(|e| e.to_string())?,
        4 => {
            let mut buf = Vec::new();
            let formatter = serde_json::ser::PrettyFormatter::with_indent(b"    ");
            let mut ser = serde_json::Serializer::with_formatter(&mut buf, formatter);
            json_val.serialize(&mut ser).map_err(|e| e.to_string())?;
            String::from_utf8(buf).map_err(|e| e.to_string())?
        }
        _ => serde_json::to_string_pretty(&json_val).map_err(|e| e.to_string())?,
    };
    Ok(output)
}

pub fn get_sample_xml() -> &'static str {
    r#"<?xml version="1.0" encoding="UTF-8"?>
<bookstore store="Main Street" established="2026">
  <book category="computing" in_stock="true">
    <title lang="en"><![CDATA[Rust & WebAssembly Industrial Guide]]></title>
    <author>Antigravity Team</author>
    <year>2026</year>
    <price>49.99</price>
    <tags>
      <tag>Rust</tag>
      <tag>Wasm</tag>
      <tag>Hono</tag>
    </tags>
  </book>
  <book category="distributed" in_stock="false">
    <title lang="zh">云原生微服务设计实战</title>
    <author>WasmForge Contributor</author>
    <year>2025</year>
    <price>35.50</price>
  </book>
</bookstore>"#
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
    json: String,
    indent: usize,
    #[serde(rename = "sourceSizeBytes")]
    source_size_bytes: usize,
    #[serde(rename = "targetSizeBytes")]
    target_size_bytes: usize,
}

#[derive(Serialize)]
struct SampleResult {
    xml: String,
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
        "xml/to-json" => {
            let xml_input = match req.params.get("xml").and_then(|v| v.as_str()) {
                Some(s) => s,
                None => {
                    return pack_response(ResponseEnvelope::<()> {
                        code: 400,
                        msg: "Missing 'xml' string in params".to_string(),
                        request_id: req_id,
                        data: None,
                    });
                }
            };

            let indent = req
                .params
                .get("indent")
                .and_then(|v| v.as_u64())
                .unwrap_or(2) as usize;

            match convert_xml_to_json(xml_input, indent) {
                Ok(json_res) => {
                    let source_len = xml_input.len();
                    let target_len = json_res.len();
                    pack_response(ResponseEnvelope {
                        code: 0,
                        msg: "OK".to_string(),
                        request_id: req_id,
                        data: Some(ConvertResult {
                            json: json_res,
                            indent,
                            source_size_bytes: source_len,
                            target_size_bytes: target_len,
                        }),
                    })
                }
                Err(err_msg) => pack_response(ResponseEnvelope::<()> {
                    code: 500,
                    msg: format!("XML 转换失败: {}", err_msg),
                    request_id: req_id,
                    data: None,
                }),
            }
        }
        "xml/sample" => pack_response(ResponseEnvelope {
            code: 0,
            msg: "OK".to_string(),
            request_id: req_id,
            data: Some(SampleResult {
                xml: get_sample_xml().to_string(),
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
    fn test_convert_xml_to_json_success() {
        let sample = get_sample_xml();
        let res = convert_xml_to_json(sample, 2).unwrap();
        assert!(res.contains(r#""@store": "Main Street""#));
        assert!(res.contains(r#"Rust & WebAssembly Industrial Guide"#));
        assert!(res.contains(r#""bookstore""#));
    }

    #[test]
    fn test_empty_xml_fails() {
        let res = convert_xml_to_json("", 2);
        assert!(res.is_err());
    }

    #[test]
    fn test_compact_indent() {
        let xml = "<root><item>Hello</item></root>";
        let res = convert_xml_to_json(xml, 0).unwrap();
        assert_eq!(res, r#"{"root":{"item":"Hello"}}"#);
    }
}
