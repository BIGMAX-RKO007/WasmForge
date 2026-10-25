use core::slice;
use std::io::Cursor;
use quick_xml::events::Event;
use quick_xml::reader::Reader;
use quick_xml::writer::Writer;
use serde::{Deserialize, Serialize};

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
pub struct FormatXmlParams {
    pub xml: String,
    #[serde(default)]
    pub indent: Option<u8>, // default 2
    #[serde(default)]
    pub strip_comments: Option<bool>, // default false
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MinifyXmlParams {
    pub xml: String,
    #[serde(default)]
    pub strip_comments: Option<bool>, // default true
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FormatXmlStats {
    pub original_length: usize,
    pub formatted_length: usize,
    pub line_count: usize,
    pub element_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FormatXmlResult {
    pub formatted: String,
    pub stats: FormatXmlStats,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MinifyXmlStats {
    pub original_length: usize,
    pub minified_length: usize,
    pub compression_ratio_percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MinifyXmlResult {
    pub minified: String,
    pub stats: MinifyXmlStats,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct XmlSampleResult {
    pub sample_xml: String,
    pub formatted: FormatXmlResult,
    pub minified: MinifyXmlResult,
}

pub fn format_xml(params: &FormatXmlParams) -> Result<FormatXmlResult, String> {
    let indent_size = params.indent.unwrap_or(2);
    let strip_comments = params.strip_comments.unwrap_or(false);

    let mut reader = Reader::from_str(&params.xml);
    reader.config_mut().trim_text(true);

    let mut writer = Writer::new_with_indent(Cursor::new(Vec::new()), b' ', indent_size as usize);
    let mut buf = Vec::new();
    let mut element_count = 0;

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Eof) => break,
            Ok(Event::Comment(_)) if strip_comments => {}
            Ok(Event::Start(e)) => {
                element_count += 1;
                writer.write_event(Event::Start(e)).map_err(|err| err.to_string())?;
            }
            Ok(Event::Empty(e)) => {
                element_count += 1;
                writer.write_event(Event::Empty(e)).map_err(|err| err.to_string())?;
            }
            Ok(event) => {
                writer.write_event(event).map_err(|err| err.to_string())?;
            }
            Err(e) => return Err(format!("XML 解析语法错误 (位置 {}): {}", reader.error_position(), e)),
        }
        buf.clear();
    }

    let raw_bytes = writer.into_inner().into_inner();
    let formatted = String::from_utf8(raw_bytes).map_err(|e| format!("UTF-8 编码转换错误: {}", e))?;
    let line_count = formatted.lines().count();

    let stats = FormatXmlStats {
        original_length: params.xml.len(),
        formatted_length: formatted.len(),
        line_count,
        element_count,
    };

    Ok(FormatXmlResult { formatted, stats })
}

pub fn minify_xml(params: &MinifyXmlParams) -> Result<MinifyXmlResult, String> {
    let strip_comments = params.strip_comments.unwrap_or(true);

    let mut reader = Reader::from_str(&params.xml);
    reader.config_mut().trim_text(true);

    let mut writer = Writer::new(Cursor::new(Vec::new()));
    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Eof) => break,
            Ok(Event::Comment(_)) if strip_comments => {}
            Ok(event) => {
                writer.write_event(event).map_err(|err| err.to_string())?;
            }
            Err(e) => return Err(format!("XML 解析语法错误 (位置 {}): {}", reader.error_position(), e)),
        }
        buf.clear();
    }

    let raw_bytes = writer.into_inner().into_inner();
    let minified = String::from_utf8(raw_bytes).map_err(|e| format!("UTF-8 编码转换错误: {}", e))?;

    let original_length = params.xml.len();
    let minified_length = minified.len();
    let compression_ratio_percent = if original_length > 0 {
        ((1.0 - (minified_length as f64 / original_length as f64)) * 100.0).max(0.0)
    } else {
        0.0
    };

    let stats = MinifyXmlStats {
        original_length,
        minified_length,
        compression_ratio_percent: (compression_ratio_percent * 100.0).round() / 100.0,
    };

    Ok(MinifyXmlResult { minified, stats })
}

pub fn get_sample() -> XmlSampleResult {
    let sample_xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<project name="WasmForge" version="1.0.0">
  <!-- Core XML formatting component -->
  <modules>
    <module id="xml-formatter" status="active">
      <description>High performance pure WebAssembly XML Prettifier</description>
      <tags>
        <tag>wasm</tag>
        <tag>formatter</tag>
        <tag>parser</tag>
      </tags>
    </module>
  </modules>
</project>"#
        .to_string();

    let formatted = format_xml(&FormatXmlParams {
        xml: sample_xml.clone(),
        indent: Some(2),
        strip_comments: Some(false),
    })
    .unwrap_or_else(|_| FormatXmlResult {
        formatted: sample_xml.clone(),
        stats: FormatXmlStats {
            original_length: 0,
            formatted_length: 0,
            line_count: 0,
            element_count: 0,
        },
    });

    let minified = minify_xml(&MinifyXmlParams {
        xml: sample_xml.clone(),
        strip_comments: Some(true),
    })
    .unwrap_or_else(|_| MinifyXmlResult {
        minified: sample_xml.clone(),
        stats: MinifyXmlStats {
            original_length: 0,
            minified_length: 0,
            compression_ratio_percent: 0.0,
        },
    });

    XmlSampleResult {
        sample_xml,
        formatted,
        minified,
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
        "xml/format" => {
            let params: FormatXmlParams = match req.params {
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

            match format_xml(&params) {
                Ok(out) => {
                    let res = ResponseEnvelope {
                        code: 0,
                        msg: "XML 格式化排版成功".to_string(),
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
        "xml/minify" => {
            let params: MinifyXmlParams = match req.params {
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

            match minify_xml(&params) {
                Ok(out) => {
                    let res = ResponseEnvelope {
                        code: 0,
                        msg: "XML 压缩瘦身成功".to_string(),
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
        "xml/sample" => {
            let sample = get_sample();
            let res = ResponseEnvelope {
                code: 0,
                msg: "获取 XML 示例成功".to_string(),
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
    fn test_format_and_minify() {
        let xml = "<root><child id=\"1\">Hello</child><!-- comment --></root>";
        let fmt = format_xml(&FormatXmlParams {
            xml: xml.to_string(),
            indent: Some(2),
            strip_comments: Some(false),
        })
        .unwrap();

        assert!(fmt.formatted.contains("  <child id=\"1\">Hello</child>"));
        assert!(fmt.formatted.contains("<!-- comment -->"));
        assert_eq!(fmt.stats.element_count, 2);

        let min = minify_xml(&MinifyXmlParams {
            xml: xml.to_string(),
            strip_comments: Some(true),
        })
        .unwrap();

        assert_eq!(min.minified, "<root><child id=\"1\">Hello</child></root>");
    }

    #[test]
    fn test_dispatch() {
        let req = serde_json::json!({
            "action": "xml/format",
            "params": {
                "xml": "<note><to>Tove</to></note>"
            }
        });
        let bytes = serde_json::to_vec(&req).unwrap();
        let out = handle_dispatch(&bytes);
        let resp: serde_json::Value = serde_json::from_slice(&out).unwrap();
        assert_eq!(resp["code"], 0);
        assert!(resp["data"]["formatted"].as_str().unwrap().contains("<to>Tove</to>"));
    }
}
