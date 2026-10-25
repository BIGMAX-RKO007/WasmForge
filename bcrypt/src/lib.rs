use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicU64, Ordering};

// -----------------------------------------------------------------------------
// Envelope Protocol Definitions
// -----------------------------------------------------------------------------

#[derive(Deserialize)]
struct Request {
    action: String,
    #[serde(rename = "requestId")]
    request_id: Option<String>,
    #[serde(default)]
    params: serde_json::Value,
}

#[derive(Serialize)]
struct Response<T: Serialize> {
    code: i32,
    msg: String,
    #[serde(rename = "requestId", skip_serializing_if = "Option::is_none")]
    request_id: Option<String>,
    data: Option<T>,
}

#[derive(Deserialize)]
struct HashParams {
    password: String,
    #[serde(default = "default_cost")]
    cost: u32,
    seed: Option<u64>,
}

fn default_cost() -> u32 {
    10
}

#[derive(Serialize)]
struct HashData {
    hash: String,
    cost: u32,
}

#[derive(Deserialize)]
struct VerifyParams {
    password: String,
    hash: String,
}

#[derive(Serialize)]
struct VerifyData {
    valid: bool,
}

// -----------------------------------------------------------------------------
// Deterministic / High-entropy Salt Generation (Host-Agnostic, 0 OS Dependencies)
// -----------------------------------------------------------------------------

static PRNG_STATE: AtomicU64 = AtomicU64::new(0x4d5a900003000000);

fn next_random(state: &mut u64) -> u64 {
    *state = state.wrapping_add(0x9e3779b97f4a7c15);
    let mut z = *state;
    z = (z ^ (z >> 30)).wrapping_mul(0xbf58476d1ce4e5b9);
    z = (z ^ (z >> 27)).wrapping_mul(0x94d049bb133111eb);
    z ^ (z >> 31)
}

fn custom_entropy(dest: &mut [u8]) -> Result<(), getrandom::Error> {
    let mut state = PRNG_STATE.fetch_add(0x9e3779b97f4a7c15, Ordering::Relaxed);
    for chunk in dest.chunks_mut(8) {
        let r = next_random(&mut state);
        let bytes = r.to_le_bytes();
        let len = chunk.len().min(8);
        chunk.copy_from_slice(&bytes[..len]);
    }
    Ok(())
}

getrandom::register_custom_getrandom!(custom_entropy);

fn generate_salt(seed: Option<u64>) -> [u8; 16] {
    let mut state = seed.unwrap_or_else(|| {
        PRNG_STATE.fetch_add(0x9e3779b97f4a7c15, Ordering::Relaxed)
    });

    let r1 = next_random(&mut state);
    let r2 = next_random(&mut state);

    let mut salt = [0u8; 16];
    salt[0..8].copy_from_slice(&r1.to_le_bytes());
    salt[8..16].copy_from_slice(&r2.to_le_bytes());
    salt
}

// -----------------------------------------------------------------------------
// Dispatch Handler
// -----------------------------------------------------------------------------

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
            return serde_json::to_string(&resp).unwrap_or_else(|_| "{\"code\":5000,\"msg\":\"Internal error\"}".into());
        }
    };

    match req.action.as_str() {
        "bcrypt/hash" | "hash" => {
            let params: HashParams = match serde_json::from_value(req.params) {
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

            let cost = params.cost.clamp(4, 16);
            let salt = generate_salt(params.seed);

            match bcrypt::hash_with_salt(&params.password, cost, salt) {
                Ok(result) => {
                    let resp = Response {
                        code: 0,
                        msg: "success".to_string(),
                        request_id: req.request_id,
                        data: Some(HashData {
                            hash: result.to_string(),
                            cost,
                        }),
                    };
                    serde_json::to_string(&resp).unwrap()
                }
                Err(err) => {
                    let resp: Response<()> = Response {
                        code: 5001,
                        msg: format!("Bcrypt hash computation failed: {}", err),
                        request_id: req.request_id,
                        data: None,
                    };
                    serde_json::to_string(&resp).unwrap()
                }
            }
        }
        "bcrypt/verify" | "verify" => {
            let params: VerifyParams = match serde_json::from_value(req.params) {
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

            match bcrypt::verify(&params.password, &params.hash) {
                Ok(is_valid) => {
                    let resp = Response {
                        code: 0,
                        msg: "success".to_string(),
                        request_id: req.request_id,
                        data: Some(VerifyData {
                            valid: is_valid,
                        }),
                    };
                    serde_json::to_string(&resp).unwrap()
                }
                Err(err) => {
                    let resp: Response<()> = Response {
                        code: 4003,
                        msg: format!("Invalid bcrypt hash string format: {}", err),
                        request_id: req.request_id,
                        data: None,
                    };
                    serde_json::to_string(&resp).unwrap()
                }
            }
        }
        _ => {
            let resp: Response<()> = Response {
                code: 4040,
                msg: format!("Unknown action '{}'. Supported actions: 'bcrypt/hash', 'bcrypt/verify'", req.action),
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
    fn test_bcrypt_hash_and_verify() {
        // 1. Hash with cost 4 for fast test
        let hash_req = r#"{
            "action": "bcrypt/hash",
            "params": {
                "password": "SuperSecretPassword123!",
                "cost": 4
            }
        }"#;

        let hash_res_json = handle_dispatch(hash_req.as_bytes());
        assert!(hash_res_json.contains(r#""code":0"#));

        let hash_resp: serde_json::Value = serde_json::from_str(&hash_res_json).unwrap();
        let hash_str = hash_resp["data"]["hash"].as_str().unwrap();
        assert!(hash_str.starts_with("$2"), "Actual hash was: {}", hash_str);

        // 2. Verify with correct password
        let verify_req = format!(
            r#"{{
                "action": "bcrypt/verify",
                "params": {{
                    "password": "SuperSecretPassword123!",
                    "hash": "{}"
                }}
            }}"#,
            hash_str
        );
        let verify_res_json = handle_dispatch(verify_req.as_bytes());
        assert!(verify_res_json.contains(r#""valid":true"#));

        // 3. Verify with wrong password
        let wrong_req = format!(
            r#"{{
                "action": "bcrypt/verify",
                "params": {{
                    "password": "WrongPassword!",
                    "hash": "{}"
                }}
            }}"#,
            hash_str
        );
        let wrong_res_json = handle_dispatch(wrong_req.as_bytes());
        assert!(wrong_res_json.contains(r#""valid":false"#));
    }
}
