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
pub struct EncodeParams {
    pub text: String,
    #[serde(default)]
    pub delimiter: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DecodeParams {
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NatoToken {
    pub char: String,
    pub nato: String,
    pub token_type: String, // "letter", "digit", "space", "punctuation", "other"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NatoEncodeStats {
    pub total_chars: usize,
    pub letters: usize,
    pub digits: usize,
    pub spaces: usize,
    pub others: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NatoEncodeResult {
    pub encoded: String,
    pub tokens: Vec<NatoToken>,
    pub stats: NatoEncodeStats,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NatoDecodeStats {
    pub total_tokens: usize,
    pub recognized: usize,
    pub unrecognized: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NatoDecodeResult {
    pub decoded: String,
    pub stats: NatoDecodeStats,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NatoSampleResult {
    pub sample_text: String,
    pub encoded: NatoEncodeResult,
    pub sample_nato: String,
    pub decoded: NatoDecodeResult,
}

pub fn char_to_nato(c: char) -> Option<(&'static str, &'static str)> {
    match c.to_ascii_uppercase() {
        'A' => Some(("Alfa", "letter")),
        'B' => Some(("Bravo", "letter")),
        'C' => Some(("Charlie", "letter")),
        'D' => Some(("Delta", "letter")),
        'E' => Some(("Echo", "letter")),
        'F' => Some(("Foxtrot", "letter")),
        'G' => Some(("Golf", "letter")),
        'H' => Some(("Hotel", "letter")),
        'I' => Some(("India", "letter")),
        'J' => Some(("Juliett", "letter")),
        'K' => Some(("Kilo", "letter")),
        'L' => Some(("Lima", "letter")),
        'M' => Some(("Mike", "letter")),
        'N' => Some(("November", "letter")),
        'O' => Some(("Oscar", "letter")),
        'P' => Some(("Papa", "letter")),
        'Q' => Some(("Quebec", "letter")),
        'R' => Some(("Romeo", "letter")),
        'S' => Some(("Sierra", "letter")),
        'T' => Some(("Tango", "letter")),
        'U' => Some(("Uniform", "letter")),
        'V' => Some(("Victor", "letter")),
        'W' => Some(("Whiskey", "letter")),
        'X' => Some(("X-ray", "letter")),
        'Y' => Some(("Yankee", "letter")),
        'Z' => Some(("Zulu", "letter")),
        '0' => Some(("Zero", "digit")),
        '1' => Some(("One", "digit")),
        '2' => Some(("Two", "digit")),
        '3' => Some(("Three", "digit")),
        '4' => Some(("Four", "digit")),
        '5' => Some(("Five", "digit")),
        '6' => Some(("Six", "digit")),
        '7' => Some(("Seven", "digit")),
        '8' => Some(("Eight", "digit")),
        '9' => Some(("Nine", "digit")),
        '.' => Some(("Decimal", "punctuation")),
        '-' => Some(("Dash", "punctuation")),
        ' ' => Some(("[Space]", "space")),
        _ => None,
    }
}

pub fn nato_to_char(word: &str) -> Option<char> {
    let clean = word.trim().to_ascii_uppercase();
    match clean.as_str() {
        "ALFA" | "ALPHA" => Some('A'),
        "BRAVO" => Some('B'),
        "CHARLIE" => Some('C'),
        "DELTA" => Some('D'),
        "ECHO" => Some('E'),
        "FOXTROT" => Some('F'),
        "GOLF" => Some('G'),
        "HOTEL" => Some('H'),
        "INDIA" => Some('I'),
        "JULIETT" | "JULIET" => Some('J'),
        "KILO" => Some('K'),
        "LIMA" => Some('L'),
        "MIKE" => Some('M'),
        "NOVEMBER" => Some('N'),
        "OSCAR" => Some('O'),
        "PAPA" => Some('P'),
        "QUEBEC" => Some('Q'),
        "ROMEO" => Some('R'),
        "SIERRA" => Some('S'),
        "TANGO" => Some('T'),
        "UNIFORM" => Some('U'),
        "VICTOR" => Some('V'),
        "WHISKEY" | "WHISKY" => Some('W'),
        "X-RAY" | "XRAY" => Some('X'),
        "YANKEE" => Some('Y'),
        "ZULU" => Some('Z'),
        "ZERO" | "NADAZERO" => Some('0'),
        "ONE" | "UNAONE" => Some('1'),
        "TWO" | "BISSOTWO" => Some('2'),
        "THREE" | "TERRATHREE" => Some('3'),
        "FOUR" | "KARTEFOUR" => Some('4'),
        "FIVE" | "PANTAFIVE" => Some('5'),
        "SIX" | "SOXISIX" => Some('6'),
        "SEVEN" | "SETTESEVEN" => Some('7'),
        "EIGHT" | "OKTOEIGHT" => Some('8'),
        "NINE" | "NOVANINA" => Some('9'),
        "DECIMAL" | "STOP" | "POINT" | "DOT" => Some('.'),
        "DASH" | "HYPHEN" => Some('-'),
        "[SPACE]" | "SPACE" => Some(' '),
        _ => None,
    }
}

pub fn encode_to_nato(text: &str, delimiter: Option<&str>) -> NatoEncodeResult {
    let delim = delimiter.unwrap_or(" ");
    let mut tokens = Vec::new();
    let mut words = Vec::new();

    let mut letters = 0;
    let mut digits = 0;
    let mut spaces = 0;
    let mut others = 0;

    for c in text.chars() {
        if let Some((nato_word, token_type)) = char_to_nato(c) {
            match token_type {
                "letter" => letters += 1,
                "digit" => digits += 1,
                "space" => spaces += 1,
                _ => others += 1,
            }
            tokens.push(NatoToken {
                char: c.to_string(),
                nato: nato_word.to_string(),
                token_type: token_type.to_string(),
            });
            words.push(nato_word.to_string());
        } else {
            others += 1;
            let s = c.to_string();
            tokens.push(NatoToken {
                char: s.clone(),
                nato: s.clone(),
                token_type: "other".to_string(),
            });
            words.push(s);
        }
    }

    let encoded = words.join(delim);
    let stats = NatoEncodeStats {
        total_chars: text.chars().count(),
        letters,
        digits,
        spaces,
        others,
    };

    NatoEncodeResult {
        encoded,
        tokens,
        stats,
    }
}

pub fn decode_from_nato(text: &str) -> NatoDecodeResult {
    let raw_tokens: Vec<&str> = text
        .split(|c: char| c.is_whitespace() || c == '/' || c == '|' || c == ',')
        .filter(|t| !t.trim().is_empty())
        .collect();

    let total_tokens = raw_tokens.len();
    let mut recognized = 0;
    let mut unrecognized = 0;
    let mut decoded = String::new();

    for token in raw_tokens {
        if let Some(c) = nato_to_char(token) {
            recognized += 1;
            decoded.push(c);
        } else {
            unrecognized += 1;
            decoded.push_str(token);
        }
    }

    let stats = NatoDecodeStats {
        total_tokens,
        recognized,
        unrecognized,
    };

    NatoDecodeResult { decoded, stats }
}

pub fn get_sample() -> NatoSampleResult {
    let sample_text = "SOS 2026".to_string();
    let encoded = encode_to_nato(&sample_text, Some(" "));
    let sample_nato = "Sierra Oscar Sierra [Space] Two Zero Two Six".to_string();
    let decoded = decode_from_nato(&sample_nato);

    NatoSampleResult {
        sample_text,
        encoded,
        sample_nato,
        decoded,
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
        "nato/encode" => {
            let params: EncodeParams = match req.params {
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

            let out = encode_to_nato(&params.text, params.delimiter.as_deref());
            let res = ResponseEnvelope {
                code: 0,
                msg: "北约字母拼读编码成功".to_string(),
                request_id: req_id,
                data: Some(out),
            };
            serde_json::to_vec(&res).unwrap_or_default()
        }
        "nato/decode" => {
            let params: DecodeParams = match req.params {
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

            let out = decode_from_nato(&params.text);
            let res = ResponseEnvelope {
                code: 0,
                msg: "北约字母拼读解码成功".to_string(),
                request_id: req_id,
                data: Some(out),
            };
            serde_json::to_vec(&res).unwrap_or_default()
        }
        "nato/sample" => {
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
    fn test_encode_decode() {
        let text = "WASM 100";
        let res = encode_to_nato(text, Some(" "));
        assert_eq!(res.encoded, "Whiskey Alfa Sierra Mike [Space] One Zero Zero");
        assert_eq!(res.stats.letters, 4);
        assert_eq!(res.stats.digits, 3);
        assert_eq!(res.stats.spaces, 1);

        let dec = decode_from_nato(&res.encoded);
        assert_eq!(dec.decoded, "WASM 100");
        assert_eq!(dec.stats.recognized, 8);
        assert_eq!(dec.stats.unrecognized, 0);
    }

    #[test]
    fn test_dispatch() {
        let req = serde_json::json!({
            "action": "nato/encode",
            "params": {
                "text": "WASM 2026",
                "delimiter": " "
            }
        });
        let bytes = serde_json::to_vec(&req).unwrap();
        let out = handle_dispatch(&bytes);
        let resp: serde_json::Value = serde_json::from_slice(&out).unwrap();
        println!("Response: {:?}", resp);
        assert_eq!(resp["code"], 0);
    }
}
