use core::slice;
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
pub struct ConvertBinaryParams {
    pub input: String,
    #[serde(default)]
    pub mode: Option<String>, // "auto" | "encode" | "decode"
    #[serde(default)]
    pub delimiter: Option<String>, // "space" | "none" | "comma" | "prefix"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextBinaryResult {
    pub input: String,
    pub mode: String,
    pub text: String,
    pub binary: String,
    pub delimiter: String,
    pub total_chars: usize,
    pub total_bytes: usize,
    pub total_zeros: usize,
    pub total_ones: usize,
    pub one_density_pct: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BinarySampleResult {
    pub sample_text: String,
    pub sample_binary: String,
    pub converted: TextBinaryResult,
}

pub fn text_to_binary(text: &str, delimiter_opt: Option<&str>) -> TextBinaryResult {
    let delim_mode = delimiter_opt.unwrap_or("space");
    let bytes = text.as_bytes();
    let total_bytes = bytes.len();
    let total_chars = text.chars().count();

    let mut total_ones: usize = 0;
    let mut total_zeros: usize = 0;

    let binary_chunks: Vec<String> = bytes
        .iter()
        .map(|&b| {
            let ones = b.count_ones() as usize;
            total_ones += ones;
            total_zeros += 8 - ones;
            match delim_mode {
                "prefix" => format!("0b{:08b}", b),
                _ => format!("{:08b}", b),
            }
        })
        .collect();

    let binary = match delim_mode {
        "none" => binary_chunks.join(""),
        "comma" => binary_chunks.join(","),
        "prefix" => binary_chunks.join(" "),
        _ => binary_chunks.join(" "), // default "space"
    };

    let total_bits = total_ones + total_zeros;
    let one_density_pct = if total_bits > 0 {
        ((total_ones as f64) / (total_bits as f64) * 10000.0).round() / 100.0
    } else {
        0.0
    };

    TextBinaryResult {
        input: text.to_string(),
        mode: "encode".to_string(),
        text: text.to_string(),
        binary,
        delimiter: delim_mode.to_string(),
        total_chars,
        total_bytes,
        total_zeros,
        total_ones,
        one_density_pct,
    }
}

pub fn binary_to_text(binary_input: &str, delimiter_opt: Option<&str>) -> Result<TextBinaryResult, String> {
    let delim_mode = delimiter_opt.unwrap_or("space");
    let raw = binary_input.trim();
    if raw.is_empty() {
        return Err("输入二进制数据不能为空".to_string());
    }

    // 清洗二进制数据：去除 0b/0B、空格、逗号、换行
    let cleaned = raw
        .replace("0b", "")
        .replace("0B", "")
        .replace(' ', "")
        .replace(',', "")
        .replace('\n', "")
        .replace('\r', "")
        .replace('\t', "");

    if cleaned.is_empty() {
        return Err("缺少有效的二进制 0/1 序列".to_string());
    }

    for (idx, c) in cleaned.chars().enumerate() {
        if c != '0' && c != '1' {
            return Err(format!("第 {} 个字符包含非法二进制符: '{}'", idx + 1, c));
        }
    }

    if cleaned.len() % 8 != 0 {
        return Err(format!(
            "二进制比特长度 ({}) 必须是 8 的整数倍 (缺少 {} 位)",
            cleaned.len(),
            8 - (cleaned.len() % 8)
        ));
    }

    let mut bytes = Vec::new();
    let mut total_ones: usize = 0;
    let mut total_zeros: usize = 0;

    for chunk in cleaned.as_bytes().chunks(8) {
        let chunk_str = core::str::from_utf8(chunk).unwrap();
        let val = u8::from_str_radix(chunk_str, 2)
            .map_err(|e| format!("解析字节块 '{}' 失败: {}", chunk_str, e))?;
        let ones = val.count_ones() as usize;
        total_ones += ones;
        total_zeros += 8 - ones;
        bytes.push(val);
    }

    let text = String::from_utf8(bytes).map_err(|e| format!("二进制解码后的 UTF-8 文本序列非法: {}", e))?;
    let total_bytes = text.len();
    let total_chars = text.chars().count();

    let total_bits = total_ones + total_zeros;
    let one_density_pct = if total_bits > 0 {
        ((total_ones as f64) / (total_bits as f64) * 10000.0).round() / 100.0
    } else {
        0.0
    };

    Ok(TextBinaryResult {
        input: binary_input.to_string(),
        mode: "decode".to_string(),
        text,
        binary: raw.to_string(),
        delimiter: delim_mode.to_string(),
        total_chars,
        total_bytes,
        total_zeros,
        total_ones,
        one_density_pct,
    })
}

fn looks_like_binary(s: &str) -> bool {
    let trimmed = s.trim();
    if trimmed.is_empty() {
        return false;
    }
    // 剔除常用分隔符后检查是否全由 0 和 1 组成
    let cleaned = trimmed
        .replace("0b", "")
        .replace("0B", "")
        .replace(' ', "")
        .replace(',', "")
        .replace('\n', "")
        .replace('\r', "")
        .replace('\t', "");

    !cleaned.is_empty() && cleaned.chars().all(|c| c == '0' || c == '1')
}

pub fn convert_text_binary(input_raw: &str, mode_opt: Option<&str>, delim_opt: Option<&str>) -> Result<TextBinaryResult, String> {
    let mode = mode_opt.unwrap_or("auto");
    match mode {
        "encode" => Ok(text_to_binary(input_raw, delim_opt)),
        "decode" => binary_to_text(input_raw, delim_opt),
        _ => {
            // "auto"
            if looks_like_binary(input_raw) {
                binary_to_text(input_raw, delim_opt)
            } else {
                Ok(text_to_binary(input_raw, delim_opt))
            }
        }
    }
}

pub fn get_sample() -> BinarySampleResult {
    let sample_text = "WasmForge 2026".to_string();
    let converted = text_to_binary(&sample_text, Some("space"));
    BinarySampleResult {
        sample_text,
        sample_binary: converted.binary.clone(),
        converted,
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
        "binary/convert" | "binary/auto" => {
            let params: ConvertBinaryParams = match req.params {
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

            match convert_text_binary(&params.input, params.mode.as_deref(), params.delimiter.as_deref()) {
                Ok(out) => {
                    let res = ResponseEnvelope {
                        code: 0,
                        msg: "文本/二进制转换成功".to_string(),
                        request_id: req_id,
                        data: Some(out),
                    };
                    serde_json::to_vec(&res).unwrap_or_default()
                }
                Err(err) => {
                    let res = ResponseEnvelope::<()> {
                        code: 400,
                        msg: err,
                        request_id: req_id,
                        data: None,
                    };
                    serde_json::to_vec(&res).unwrap_or_default()
                }
            }
        }
        "binary/sample" => {
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
    fn test_text_to_binary_and_back() {
        let text = "Hello";
        let res = text_to_binary(text, Some("space"));
        assert_eq!(res.binary, "01001000 01100101 01101100 01101100 01101111");
        assert_eq!(res.total_bytes, 5);

        let decoded = binary_to_text(&res.binary, None).unwrap();
        assert_eq!(decoded.text, "Hello");
    }

    #[test]
    fn test_delimiters() {
        let text = "Hi";
        let res_none = text_to_binary(text, Some("none"));
        assert_eq!(res_none.binary, "0100100001101001");

        let res_comma = text_to_binary(text, Some("comma"));
        assert_eq!(res_comma.binary, "01001000,01101001");

        let res_prefix = text_to_binary(text, Some("prefix"));
        assert_eq!(res_prefix.binary, "0b01001000 0b01101001");
    }

    #[test]
    fn test_invalid_binary() {
        assert!(binary_to_text("0101", None).is_err()); // not multiple of 8
        assert!(binary_to_text("01010102", None).is_err()); // contains '2'
    }
}
