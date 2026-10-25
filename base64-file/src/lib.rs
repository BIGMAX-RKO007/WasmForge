use base64::{engine::general_purpose, Engine as _};
use core::slice;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct RequestEnvelope {
    action: String,
    #[serde(rename = "requestId")]
    request_id: Option<String>,
    params: Option<serde_json::Value>,
}

#[derive(Serialize)]
struct ResponseEnvelope<T: Serialize> {
    code: i32,
    msg: String,
    #[serde(rename = "requestId")]
    request_id: Option<String>,
    data: Option<T>,
}

#[derive(Deserialize)]
struct ToDataUrlParams {
    base64: String,
    #[serde(rename = "fileName")]
    file_name: Option<String>,
    #[serde(rename = "mimeType")]
    mime_type: Option<String>,
}

#[derive(Serialize)]
pub struct ToDataUrlResult {
    #[serde(rename = "dataUrl")]
    pub data_url: String,
    #[serde(rename = "fileName")]
    pub file_name: String,
    #[serde(rename = "mimeType")]
    pub mime_type: String,
    #[serde(rename = "fileSizeBytes")]
    pub file_size_bytes: usize,
    #[serde(rename = "base64SizeBytes")]
    pub base64_size_bytes: usize,
}

#[derive(Deserialize)]
struct FromDataUrlParams {
    #[serde(rename = "dataUrl")]
    data_url: String,
}

#[derive(Serialize)]
pub struct FromDataUrlResult {
    #[serde(rename = "mimeType")]
    pub mime_type: String,
    pub base64: String,
    #[serde(rename = "fileSizeBytes")]
    pub file_size_bytes: usize,
    #[serde(rename = "isValid")]
    pub is_valid: bool,
}

#[derive(Serialize)]
pub struct SampleResult {
    #[serde(rename = "svgDataUrl")]
    pub svg_data_url: String,
    #[serde(rename = "svgBase64")]
    pub svg_base64: String,
    #[serde(rename = "mimeType")]
    pub mime_type: String,
    #[serde(rename = "fileName")]
    pub file_name: String,
    #[serde(rename = "fileSizeBytes")]
    pub file_size_bytes: usize,
}

fn guess_mime(file_name: &str) -> &'static str {
    let lower = file_name.to_ascii_lowercase();
    if lower.ends_with(".png") {
        "image/png"
    } else if lower.ends_with(".jpg") || lower.ends_with(".jpeg") {
        "image/jpeg"
    } else if lower.ends_with(".svg") {
        "image/svg+xml"
    } else if lower.ends_with(".gif") {
        "image/gif"
    } else if lower.ends_with(".webp") {
        "image/webp"
    } else if lower.ends_with(".pdf") {
        "application/pdf"
    } else if lower.ends_with(".json") {
        "application/json"
    } else if lower.ends_with(".txt") {
        "text/plain"
    } else if lower.ends_with(".html") || lower.ends_with(".htm") {
        "text/html"
    } else if lower.ends_with(".csv") {
        "text/csv"
    } else if lower.ends_with(".xml") {
        "application/xml"
    } else if lower.ends_with(".wasm") {
        "application/wasm"
    } else if lower.ends_with(".mp3") {
        "audio/mpeg"
    } else if lower.ends_with(".mp4") {
        "video/mp4"
    } else {
        "application/octet-stream"
    }
}

pub fn convert_to_data_url(
    raw_b64: &str,
    file_name: Option<String>,
    mime_type: Option<String>,
) -> Result<ToDataUrlResult, String> {
    let clean_b64: String = raw_b64
        .chars()
        .filter(|c| !c.is_ascii_whitespace())
        .collect();

    if clean_b64.is_empty() {
        return Err("Base64 内容不能为空".to_string());
    }

    let decoded = general_purpose::STANDARD
        .decode(clean_b64.as_bytes())
        .map_err(|e| format!("Base64 解码失败: {}", e))?;

    let fn_str = file_name.unwrap_or_else(|| "file.bin".to_string());
    let mime = mime_type
        .filter(|m| !m.trim().is_empty())
        .unwrap_or_else(|| guess_mime(&fn_str).to_string());

    let data_url = format!("data:{};base64,{}", mime, clean_b64);
    let base64_size_bytes = clean_b64.len();
    let file_size_bytes = decoded.len();

    Ok(ToDataUrlResult {
        data_url,
        file_name: fn_str,
        mime_type: mime,
        file_size_bytes,
        base64_size_bytes,
    })
}

pub fn convert_from_data_url(data_url: &str) -> Result<FromDataUrlResult, String> {
    let trimmed = data_url.trim();
    if !trimmed.starts_with("data:") {
        return Err("输入不是有效的 Data URL (必须以 'data:' 开头)".to_string());
    }

    let after_prefix = &trimmed[5..];
    let marker = ";base64,";
    let pos = after_prefix
        .find(marker)
        .ok_or_else(|| "Data URL 缺少 ';base64,' 标记".to_string())?;

    let mime_part = &after_prefix[..pos];
    let b64_part = &after_prefix[pos + marker.len()..];

    let clean_b64: String = b64_part
        .chars()
        .filter(|c| !c.is_ascii_whitespace())
        .collect();

    let decoded = general_purpose::STANDARD
        .decode(clean_b64.as_bytes())
        .map_err(|e| format!("Data URL Base64 数据损坏: {}", e))?;

    let mime = if mime_part.trim().is_empty() {
        "text/plain"
    } else {
        mime_part.trim()
    };

    Ok(FromDataUrlResult {
        mime_type: mime.to_string(),
        base64: clean_b64,
        file_size_bytes: decoded.len(),
        is_valid: true,
    })
}

pub fn get_sample() -> SampleResult {
    let svg = r##"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="45" fill="#38bdf8"/><polygon points="35,25 75,50 35,75" fill="#ffffff"/></svg>"##;
    let b64 = general_purpose::STANDARD.encode(svg.as_bytes());
    let data_url = format!("data:image/svg+xml;base64,{}", b64);
    SampleResult {
        svg_data_url: data_url,
        svg_base64: b64,
        mime_type: "image/svg+xml".to_string(),
        file_name: "play_icon.svg".to_string(),
        file_size_bytes: svg.len(),
    }
}

fn handle_dispatch(payload: &[u8]) -> Vec<u8> {
    let req: RequestEnvelope = match serde_json::from_slice(payload) {
        Ok(r) => r,
        Err(e) => {
            let res = ResponseEnvelope::<()> {
                code: 400,
                msg: format!("请求 JSON 解析失败: {}", e),
                request_id: None,
                data: None,
            };
            return serde_json::to_vec(&res).unwrap_or_default();
        }
    };

    let req_id = req.request_id.clone();

    match req.action.as_str() {
        "file/to-data-url" => {
            let params: ToDataUrlParams = match req.params {
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

            match convert_to_data_url(&params.base64, params.file_name, params.mime_type) {
                Ok(out) => {
                    let res = ResponseEnvelope {
                        code: 0,
                        msg: "转换 Data URL 成功".to_string(),
                        request_id: req_id,
                        data: Some(out),
                    };
                    serde_json::to_vec(&res).unwrap_or_default()
                }
                Err(err) => {
                    let res = ResponseEnvelope::<()> {
                        code: 500,
                        msg: err,
                        request_id: req_id,
                        data: None,
                    };
                    serde_json::to_vec(&res).unwrap_or_default()
                }
            }
        }
        "file/from-data-url" => {
            let params: FromDataUrlParams = match req.params {
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

            match convert_from_data_url(&params.data_url) {
                Ok(out) => {
                    let res = ResponseEnvelope {
                        code: 0,
                        msg: "解析 Data URL 成功".to_string(),
                        request_id: req_id,
                        data: Some(out),
                    };
                    serde_json::to_vec(&res).unwrap_or_default()
                }
                Err(err) => {
                    let res = ResponseEnvelope::<()> {
                        code: 500,
                        msg: err,
                        request_id: req_id,
                        data: None,
                    };
                    serde_json::to_vec(&res).unwrap_or_default()
                }
            }
        }
        "file/sample" => {
            let sample = get_sample();
            let res = ResponseEnvelope {
                code: 0,
                msg: "获取示例成功".to_string(),
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
    fn test_to_data_url() {
        let b64 = "SGVsbG8gV29ybGQ=";
        let res = convert_to_data_url(b64, Some("test.txt".to_string()), None).unwrap();
        assert_eq!(res.data_url, "data:text/plain;base64,SGVsbG8gV29ybGQ=");
        assert_eq!(res.file_size_bytes, 11);
    }

    #[test]
    fn test_from_data_url() {
        let url = "data:image/png;base64,iVBORw0KGgo=";
        let res = convert_from_data_url(url).unwrap();
        assert_eq!(res.mime_type, "image/png");
        assert_eq!(res.base64, "iVBORw0KGgo=");
    }

    #[test]
    fn test_sample() {
        let sample = get_sample();
        assert!(sample.svg_data_url.starts_with("data:image/svg+xml;base64,"));
        assert_eq!(sample.file_name, "play_icon.svg");
    }
}
