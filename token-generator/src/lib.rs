use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicU64, Ordering};

// Request Envelope
#[derive(Deserialize)]
struct Request {
    action: String,
    #[serde(rename = "requestId")]
    request_id: Option<String>,
    #[serde(default)]
    params: serde_json::Value,
}

// Response Envelope
#[derive(Serialize)]
struct Response<T: Serialize> {
    code: i32,
    msg: String,
    #[serde(rename = "requestId", skip_serializing_if = "Option::is_none")]
    request_id: Option<String>,
    data: Option<T>,
}

#[derive(Deserialize, Clone)]
struct GenerateParams {
    #[serde(default = "default_length")]
    length: usize,
    #[serde(default = "default_true", rename = "withUppercase")]
    with_uppercase: bool,
    #[serde(default = "default_true", rename = "withLowercase")]
    with_lowercase: bool,
    #[serde(default = "default_true", rename = "withNumbers")]
    with_numbers: bool,
    #[serde(default = "default_false", rename = "withSymbols")]
    with_symbols: bool,
    #[serde(rename = "customAlphabet")]
    custom_alphabet: Option<String>,
    seed: Option<u64>,
}

#[derive(Deserialize)]
struct BatchParams {
    #[serde(default = "default_batch_count")]
    count: usize,
    #[serde(flatten)]
    generator: GenerateParams,
}

fn default_length() -> usize { 32 }
fn default_true() -> bool { true }
fn default_false() -> bool { false }
fn default_batch_count() -> usize { 10 }

#[derive(Serialize)]
struct TokenData {
    token: String,
    length: usize,
    #[serde(rename = "entropyBits")]
    entropy_bits: f64,
    #[serde(rename = "charsetSize")]
    charset_size: usize,
}

#[derive(Serialize)]
struct BatchData {
    tokens: Vec<TokenData>,
    count: usize,
}

static PRNG_STATE: AtomicU64 = AtomicU64::new(0x853c49e6748fea9b);

fn next_random(state: &mut u64) -> u64 {
    *state = state.wrapping_add(0x9e3779b97f4a7c15);
    let mut z = *state;
    z = (z ^ (z >> 30)).wrapping_mul(0xbf58476d1ce4e5b9);
    z = (z ^ (z >> 27)).wrapping_mul(0x94d049bb133111eb);
    z ^ (z >> 31)
}

fn build_charset(params: &GenerateParams) -> Result<Vec<char>, &'static str> {
    if let Some(ref custom) = params.custom_alphabet {
        if !custom.is_empty() {
            let mut chars: Vec<char> = custom.chars().collect();
            chars.sort_unstable();
            chars.dedup();
            return Ok(chars);
        }
    }

    let mut set = Vec::new();
    if params.with_uppercase {
        set.extend('A'..='Z');
    }
    if params.with_lowercase {
        set.extend('a'..='z');
    }
    if params.with_numbers {
        set.extend('0'..='9');
    }
    if params.with_symbols {
        let symbols = ".,;:!?./-\"'#{([-|\\@)]=}*+";
        set.extend(symbols.chars());
    }

    if set.is_empty() {
        return Err("No characters selected for charset. Enable uppercase, lowercase, numbers, symbols or provide customAlphabet.");
    }

    Ok(set)
}

fn generate_single_token(params: &GenerateParams, state: &mut u64) -> Result<TokenData, &'static str> {
    let charset = build_charset(params)?;
    let charset_size = charset.len();
    let length = params.length.min(65536);

    let mut token_chars = Vec::with_capacity(length);
    for _ in 0..length {
        let r = next_random(state);
        let idx = (r as usize) % charset_size;
        token_chars.push(charset[idx]);
    }

    let token: String = token_chars.into_iter().collect();
    let entropy_bits = if charset_size > 0 {
        (length as f64) * (charset_size as f64).log2()
    } else {
        0.0
    };

    Ok(TokenData {
        token,
        length,
        entropy_bits,
        charset_size,
    })
}

fn handle_dispatch(input: &[u8]) -> String {
    let req: Request = match serde_json::from_slice(input) {
        Ok(r) => r,
        Err(err) => {
            let resp: Response<()> = Response {
                code: 4001,
                msg: format!("Invalid JSON request: {}", err),
                request_id: None,
                data: None,
            };
            return serde_json::to_string(&resp).unwrap_or_else(|_| "{\"code\":5000,\"msg\":\"Internal JSON error\"}".into());
        }
    };

    match req.action.as_str() {
        "token/generate" | "generate" => {
            let params: GenerateParams = match serde_json::from_value(req.params) {
                Ok(p) => p,
                Err(err) => {
                    let resp: Response<()> = Response {
                        code: 4002,
                        msg: format!("Invalid parameters: {}", err),
                        request_id: req.request_id,
                        data: None,
                    };
                    return serde_json::to_string(&resp).unwrap();
                }
            };

            let mut state = params.seed.unwrap_or_else(|| {
                PRNG_STATE.fetch_add(0x9e3779b97f4a7c15, Ordering::Relaxed)
            });

            match generate_single_token(&params, &mut state) {
                Ok(data) => {
                    let resp = Response {
                        code: 0,
                        msg: "success".to_string(),
                        request_id: req.request_id,
                        data: Some(data),
                    };
                    serde_json::to_string(&resp).unwrap()
                }
                Err(err_msg) => {
                    let resp: Response<()> = Response {
                        code: 4003,
                        msg: err_msg.to_string(),
                        request_id: req.request_id,
                        data: None,
                    };
                    serde_json::to_string(&resp).unwrap()
                }
            }
        }
        "token/batch" | "batch" => {
            let params: BatchParams = match serde_json::from_value(req.params) {
                Ok(p) => p,
                Err(err) => {
                    let resp: Response<()> = Response {
                        code: 4002,
                        msg: format!("Invalid parameters: {}", err),
                        request_id: req.request_id,
                        data: None,
                    };
                    return serde_json::to_string(&resp).unwrap();
                }
            };

            let mut state = params.generator.seed.unwrap_or_else(|| {
                PRNG_STATE.fetch_add(0x9e3779b97f4a7c15, Ordering::Relaxed)
            });

            let count = params.count.min(1000);
            let mut tokens = Vec::with_capacity(count);

            for _ in 0..count {
                match generate_single_token(&params.generator, &mut state) {
                    Ok(tok) => tokens.push(tok),
                    Err(err_msg) => {
                        let resp: Response<()> = Response {
                            code: 4003,
                            msg: err_msg.to_string(),
                            request_id: req.request_id,
                            data: None,
                        };
                        return serde_json::to_string(&resp).unwrap();
                    }
                }
            }

            let resp = Response {
                code: 0,
                msg: "success".to_string(),
                request_id: req.request_id,
                data: Some(BatchData {
                    tokens,
                    count,
                }),
            };
            serde_json::to_string(&resp).unwrap()
        }
        _ => {
            let resp: Response<()> = Response {
                code: 4040,
                msg: format!("Unknown action: '{}'. Supported actions: 'token/generate', 'token/batch'", req.action),
                request_id: req.request_id,
                data: None,
            };
            serde_json::to_string(&resp).unwrap()
        }
    }
}

// -----------------------------------------------------------------------------
// Universal C-ABI Exports (alloc, dealloc, dispatch)
// -----------------------------------------------------------------------------

#[no_mangle]
pub extern "C" fn alloc(size: usize) -> *mut u8 {
    let buf = vec![0u8; size].into_boxed_slice();
    Box::into_raw(buf) as *mut u8
}

#[no_mangle]
pub extern "C" fn dealloc(ptr: *mut u8, size: usize) {
    if !ptr.is_null() && size > 0 {
        unsafe {
            let slice = std::slice::from_raw_parts_mut(ptr, size);
            drop(Box::from_raw(slice));
        }
    }
}

#[no_mangle]
pub extern "C" fn dispatch(ptr: *const u8, len: usize) -> u64 {
    let input_slice = unsafe { std::slice::from_raw_parts(ptr, len) };
    let response_json = handle_dispatch(input_slice);

    let boxed = response_json.into_bytes().into_boxed_slice();
    let out_len = boxed.len() as u64;
    let out_ptr = Box::into_raw(boxed) as *mut u8 as u64;
    (out_ptr << 32) | (out_len & 0xFFFFFFFF)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_token() {
        let req = r#"{
            "action": "token/generate",
            "requestId": "test-1",
            "params": {
                "length": 16,
                "withUppercase": true,
                "withLowercase": true,
                "withNumbers": true,
                "withSymbols": false
            }
        }"#;

        let res_json = handle_dispatch(req.as_bytes());
        assert!(res_json.contains(r#""code":0"#));
        assert!(res_json.contains(r#""length":16"#));
    }

    #[test]
    fn test_batch_token() {
        let req = r#"{
            "action": "token/batch",
            "requestId": "test-batch",
            "params": {
                "count": 5,
                "length": 8
            }
        }"#;

        let res_json = handle_dispatch(req.as_bytes());
        assert!(res_json.contains(r#""code":0"#));
        assert!(res_json.contains(r#""count":5"#));
    }
}
