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
pub struct ConvertBaseParams {
    pub input: String,
    #[serde(default)]
    pub from_base: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BaseConvertResult {
    pub input: String,
    pub detected_base: u32,
    pub is_negative: bool,
    pub decimal: String,
    pub binary: String,
    pub octal: String,
    pub hex_lower: String,
    pub hex_upper: String,
    pub base36: String,
    pub bit_length: u32,
    pub byte_length: u32,
    pub be_bytes_hex: String,
    pub le_bytes_hex: String,
    pub twocompl_8bit: Option<String>,
    pub twocompl_16bit: Option<String>,
    pub twocompl_32bit: Option<String>,
    pub twocompl_64bit: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BaseSampleResult {
    pub sample: String,
    pub detected_base: u32,
    pub converted: BaseConvertResult,
}

const CHAR_SET: &[u8; 36] = b"0123456789abcdefghijklmnopqrstuvwxyz";

fn char_to_digit(c: char, radix: u32) -> Result<u32, String> {
    let digit = match c {
        '0'..='9' => (c as u32) - ('0' as u32),
        'a'..='z' => (c as u32) - ('a' as u32) + 10,
        'A'..='Z' => (c as u32) - ('A' as u32) + 10,
        _ => return Err(format!("包含非法字符: '{}'", c)),
    };
    if digit < radix {
        Ok(digit)
    } else {
        Err(format!("字符 '{}' 超出 {} 进制有效范围", c, radix))
    }
}

fn format_radix_u128(mut val: u128, radix: u32) -> String {
    if val == 0 {
        return "0".to_string();
    }
    let mut buf = Vec::new();
    let r = radix as u128;
    while val > 0 {
        let rem = (val % r) as usize;
        buf.push(CHAR_SET[rem]);
        val /= r;
    }
    buf.reverse();
    String::from_utf8(buf).unwrap_or_else(|_| "0".to_string())
}

pub fn convert_integer_base(input_raw: &str, explicit_base: Option<u32>) -> Result<BaseConvertResult, String> {
    let clean = input_raw.trim().replace('_', "").replace(' ', "");
    if clean.is_empty() {
        return Err("输入整数不能为空".to_string());
    }

    let (is_negative, rest) = if clean.starts_with('-') {
        (true, &clean[1..])
    } else if clean.starts_with('+') {
        (false, &clean[1..])
    } else {
        (false, clean.as_str())
    };

    if rest.is_empty() {
        return Err("缺少有效数值部分".to_string());
    }

    // 检测进制与前缀
    let (detected_base, num_str) = if let Some(base) = explicit_base {
        if !(2..=36).contains(&base) {
            return Err(format!("指定进制 {} 超出支持范围 (2..=36)", base));
        }
        // 若带前缀则剥除
        let stripped = if base == 16 && (rest.starts_with("0x") || rest.starts_with("0X")) {
            &rest[2..]
        } else if base == 2 && (rest.starts_with("0b") || rest.starts_with("0B")) {
            &rest[2..]
        } else if base == 8 && (rest.starts_with("0o") || rest.starts_with("0O")) {
            &rest[2..]
        } else {
            rest
        };
        (base, stripped)
    } else if rest.starts_with("0x") || rest.starts_with("0X") {
        (16, &rest[2..])
    } else if rest.starts_with("0b") || rest.starts_with("0B") {
        (2, &rest[2..])
    } else if rest.starts_with("0o") || rest.starts_with("0O") {
        (8, &rest[2..])
    } else {
        (10, rest)
    };

    if num_str.is_empty() {
        return Err("前缀后无有效数字".to_string());
    }

    // 解析为 u128
    let mut abs_val: u128 = 0;
    let r = detected_base as u128;
    for c in num_str.chars() {
        let digit = char_to_digit(c, detected_base)? as u128;
        abs_val = abs_val
            .checked_mul(r)
            .and_then(|v| v.checked_add(digit))
            .ok_or_else(|| "数值超出 128 位无符号整数上限".to_string())?;
    }

    let prefix = if is_negative && abs_val != 0 { "-" } else { "" };

    let decimal = format!("{}{}", prefix, abs_val);
    let binary = format!("{}{}", prefix, format_radix_u128(abs_val, 2));
    let octal = format!("{}{}", prefix, format_radix_u128(abs_val, 8));
    let hex_lower = format!("{}{}", prefix, format_radix_u128(abs_val, 16));
    let hex_upper = format!("{}{}", prefix, format_radix_u128(abs_val, 16).to_ascii_uppercase());
    let base36 = format!("{}{}", prefix, format_radix_u128(abs_val, 36));

    let bit_length = if abs_val == 0 {
        1
    } else {
        128 - abs_val.leading_zeros()
    };
    let byte_length = (bit_length + 7) / 8;

    // 提取有效字节序列 (大端序与小端序)
    let be_all = abs_val.to_be_bytes();
    let start_idx = 16 - (byte_length as usize);
    let effective_be = &be_all[start_idx..];
    let be_bytes_hex = effective_be
        .iter()
        .map(|b| format!("{:02X}", b))
        .collect::<Vec<_>>()
        .join(" ");

    let le_bytes_hex = effective_be
        .iter()
        .rev()
        .map(|b| format!("{:02X}", b))
        .collect::<Vec<_>>()
        .join(" ");

    // 补码计算 (若为正数或负数在各整型范围内)
    let (twocompl_8bit, twocompl_16bit, twocompl_32bit, twocompl_64bit) = if is_negative {
        let val_i128 = -(abs_val as i128);
        let c8 = if (-128..=127).contains(&val_i128) {
            Some(format!("0x{:02X} ({:08b})", (val_i128 as i8) as u8, (val_i128 as i8) as u8))
        } else {
            None
        };
        let c16 = if (-32768..=32767).contains(&val_i128) {
            Some(format!("0x{:04X} ({:016b})", (val_i128 as i16) as u16, (val_i128 as i16) as u16))
        } else {
            None
        };
        let c32 = if (i32::MIN as i128..=i32::MAX as i128).contains(&val_i128) {
            Some(format!("0x{:08X}", (val_i128 as i32) as u32))
        } else {
            None
        };
        let c64 = if (i64::MIN as i128..=i64::MAX as i128).contains(&val_i128) {
            Some(format!("0x{:016X}", (val_i128 as i64) as u64))
        } else {
            None
        };
        (c8, c16, c32, c64)
    } else {
        let c8 = if abs_val <= u8::MAX as u128 {
            Some(format!("0x{:02X} ({:08b})", abs_val as u8, abs_val as u8))
        } else {
            None
        };
        let c16 = if abs_val <= u16::MAX as u128 {
            Some(format!("0x{:04X} ({:016b})", abs_val as u16, abs_val as u16))
        } else {
            None
        };
        let c32 = if abs_val <= u32::MAX as u128 {
            Some(format!("0x{:08X}", abs_val as u32))
        } else {
            None
        };
        let c64 = if abs_val <= u64::MAX as u128 {
            Some(format!("0x{:016X}", abs_val as u64))
        } else {
            None
        };
        (c8, c16, c32, c64)
    };

    Ok(BaseConvertResult {
        input: input_raw.to_string(),
        detected_base,
        is_negative,
        decimal,
        binary,
        octal,
        hex_lower,
        hex_upper,
        base36,
        bit_length,
        byte_length,
        be_bytes_hex,
        le_bytes_hex,
        twocompl_8bit,
        twocompl_16bit,
        twocompl_32bit,
        twocompl_64bit,
    })
}

pub fn get_sample() -> BaseSampleResult {
    let sample = "0x7F_FF".to_string();
    let converted = convert_integer_base(&sample, None).expect("默认示例解析失败");
    BaseSampleResult {
        sample,
        detected_base: 16,
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
        "base/convert" => {
            let params: ConvertBaseParams = match req.params {
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

            match convert_integer_base(&params.input, params.from_base) {
                Ok(out) => {
                    let res = ResponseEnvelope {
                        code: 0,
                        msg: "进制转换成功".to_string(),
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
        "base/sample" => {
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
    fn test_hex_detection() {
        let res = convert_integer_base("0xFF", None).unwrap();
        assert_eq!(res.detected_base, 16);
        assert_eq!(res.decimal, "255");
        assert_eq!(res.binary, "11111111");
        assert_eq!(res.octal, "377");
        assert_eq!(res.hex_upper, "FF");
        assert_eq!(res.bit_length, 8);
        assert_eq!(res.byte_length, 1);
        assert_eq!(res.be_bytes_hex, "FF");
    }

    #[test]
    fn test_binary_detection() {
        let res = convert_integer_base("0b1010", None).unwrap();
        assert_eq!(res.detected_base, 2);
        assert_eq!(res.decimal, "10");
        assert_eq!(res.hex_upper, "A");
    }

    #[test]
    fn test_negative_two_complement() {
        let res = convert_integer_base("-1", None).unwrap();
        assert!(res.is_negative);
        assert_eq!(res.decimal, "-1");
        assert_eq!(res.twocompl_8bit.unwrap(), "0xFF (11111111)");
    }

    #[test]
    fn test_arbitrary_base36() {
        let res = convert_integer_base("100", Some(36)).unwrap();
        assert_eq!(res.detected_base, 36);
        assert_eq!(res.decimal, "1296");
    }
}
