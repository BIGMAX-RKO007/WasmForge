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
pub struct ConvertRomanParams {
    pub input: String,
    #[serde(default)]
    pub mode: Option<String>, // "auto" | "toRoman" | "toArabic"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BreakdownItem {
    pub symbol: String,
    pub value: u32,
    pub desc: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RomanConvertResult {
    pub input: String,
    pub mode: String,
    pub arabic: u32,
    pub roman: String,
    pub breakdown: Vec<BreakdownItem>,
    pub formula: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RomanSampleResult {
    pub sample_arabic: u32,
    pub sample_roman: String,
    pub converted: RomanConvertResult,
}

const ROMAN_MAP: &[(u32, &str)] = &[
    (1000, "M"),
    (900, "CM"),
    (500, "D"),
    (400, "CD"),
    (100, "C"),
    (90, "XC"),
    (50, "L"),
    (40, "XL"),
    (10, "X"),
    (9, "IX"),
    (5, "V"),
    (4, "IV"),
    (1, "I"),
];

pub fn arabic_to_roman(mut num: u32) -> Result<(String, Vec<BreakdownItem>, String), String> {
    if num == 0 || num > 3999 {
        return Err("标准罗马数字范围为 1 ~ 3999".to_string());
    }

    let mut result = String::new();
    let mut breakdown = Vec::new();
    let mut formula_parts = Vec::new();

    for &(val, sym) in ROMAN_MAP {
        while num >= val {
            result.push_str(sym);
            breakdown.push(BreakdownItem {
                symbol: sym.to_string(),
                value: val,
                desc: match sym {
                    "M" => "1000",
                    "CM" => "900 (1000 - 100)",
                    "D" => "500",
                    "CD" => "400 (500 - 100)",
                    "C" => "100",
                    "XC" => "90 (100 - 10)",
                    "L" => "50",
                    "XL" => "40 (50 - 10)",
                    "X" => "10",
                    "IX" => "9 (10 - 1)",
                    "V" => "5",
                    "IV" => "4 (5 - 1)",
                    "I" => "1",
                    _ => "",
                }
                .to_string(),
            });
            formula_parts.push(format!("{}({})", sym, val));
            num -= val;
        }
    }

    let formula = formula_parts.join(" + ");
    Ok((result, breakdown, formula))
}

fn single_char_value(c: char) -> Result<u32, String> {
    match c {
        'I' => Ok(1),
        'V' => Ok(5),
        'X' => Ok(10),
        'L' => Ok(50),
        'C' => Ok(100),
        'D' => Ok(500),
        'M' => Ok(1000),
        _ => Err(format!("包含非罗马数字字符: '{}'", c)),
    }
}

pub fn roman_to_arabic(input: &str) -> Result<(u32, Vec<BreakdownItem>, String), String> {
    let clean = input.trim().to_ascii_uppercase();
    if clean.is_empty() {
        return Err("输入罗马数字不能为空".to_string());
    }

    let chars: Vec<char> = clean.chars().collect();
    let mut total: u32 = 0;
    let mut i = 0;

    while i < chars.len() {
        let current_val = single_char_value(chars[i])?;
        let next_val = if i + 1 < chars.len() {
            Some(single_char_value(chars[i + 1])?)
        } else {
            None
        };

        if let Some(next) = next_val {
            if next > current_val {
                total += next - current_val;
                i += 2;
                continue;
            }
        }

        total += current_val;
        i += 1;
    }

    // 严谨校验：将计算出的阿拉伯数字按规范重新生成罗马数字，若不完全相等则说明原输入不符合语法规则
    let (canonical_roman, breakdown, formula) = arabic_to_roman(total)?;
    if canonical_roman != clean {
        return Err(format!(
            "罗马数字语法非法: '{}' 不是标准表示法 (推荐标准写法为: '{}')",
            clean, canonical_roman
        ));
    }

    Ok((total, breakdown, formula))
}

pub fn convert_roman(input_raw: &str, mode_opt: Option<&str>) -> Result<RomanConvertResult, String> {
    let trimmed = input_raw.trim();
    if trimmed.is_empty() {
        return Err("输入不能为空".to_string());
    }

    let mode = mode_opt.unwrap_or("auto");
    let is_numeric = trimmed.chars().all(|c| c.is_ascii_digit());

    if mode == "toRoman" || (mode == "auto" && is_numeric) {
        let arabic = trimmed
            .parse::<u32>()
            .map_err(|_| "请输入 1 ~ 3999 之间的有效非负整数".to_string())?;
        let (roman, breakdown, formula) = arabic_to_roman(arabic)?;
        Ok(RomanConvertResult {
            input: trimmed.to_string(),
            mode: "toRoman".to_string(),
            arabic,
            roman,
            breakdown,
            formula,
        })
    } else {
        let (arabic, breakdown, formula) = roman_to_arabic(trimmed)?;
        Ok(RomanConvertResult {
            input: trimmed.to_string(),
            mode: "toArabic".to_string(),
            arabic,
            roman: trimmed.to_ascii_uppercase(),
            breakdown,
            formula,
        })
    }
}

pub fn get_sample() -> RomanSampleResult {
    let sample_arabic = 2026;
    let sample_roman = "MMXXVI".to_string();
    let converted = convert_roman("MMXXVI", Some("toArabic")).expect("默认样例计算失败");
    RomanSampleResult {
        sample_arabic,
        sample_roman,
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
        "roman/convert" | "roman/auto" => {
            let params: ConvertRomanParams = match req.params {
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

            match convert_roman(&params.input, params.mode.as_deref()) {
                Ok(out) => {
                    let res = ResponseEnvelope {
                        code: 0,
                        msg: "罗马数字转换成功".to_string(),
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
        "roman/sample" => {
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
    fn test_arabic_to_roman() {
        let (res, _, _) = arabic_to_roman(2026).unwrap();
        assert_eq!(res, "MMXXVI");

        let (res2, _, _) = arabic_to_roman(1994).unwrap();
        assert_eq!(res2, "MCMXCIV");

        let (res3, _, _) = arabic_to_roman(4).unwrap();
        assert_eq!(res3, "IV");
    }

    #[test]
    fn test_roman_to_arabic() {
        let (res, _, _) = roman_to_arabic("MMXXVI").unwrap();
        assert_eq!(res, 2026);

        let (res2, _, _) = roman_to_arabic("mcmxciv").unwrap();
        assert_eq!(res2, 1994);
    }

    #[test]
    fn test_invalid_syntax_rejected() {
        // IIII is invalid in standard Roman, should be IV
        let err = roman_to_arabic("IIII");
        assert!(err.is_err());
    }

    #[test]
    fn test_range_limit() {
        assert!(arabic_to_roman(0).is_err());
        assert!(arabic_to_roman(4000).is_err());
    }
}
