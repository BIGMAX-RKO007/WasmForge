use digest::Digest;
use serde::{Deserialize, Serialize};

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
struct CalcParams {
    text: String,
    #[serde(default = "default_algorithm")]
    algorithm: String,
}

fn default_algorithm() -> String {
    "sha256".to_string()
}

#[derive(Serialize)]
struct CalcData {
    hash: String,
    algorithm: String,
    #[serde(rename = "textLength")]
    text_length: usize,
    #[serde(rename = "byteLength")]
    byte_length: usize,
}

#[derive(Deserialize)]
struct AllParams {
    text: String,
}

#[derive(Serialize)]
struct AllData {
    md5: String,
    sha1: String,
    sha256: String,
    sha512: String,
    sha3_256: String,
    ripemd160: String,
    #[serde(rename = "textLength")]
    text_length: usize,
    #[serde(rename = "byteLength")]
    byte_length: usize,
}

// -----------------------------------------------------------------------------
// Core Hash Algorithms
// -----------------------------------------------------------------------------

fn compute_hash(bytes: &[u8], algorithm: &str) -> Result<String, String> {
    let normalized = algorithm.to_ascii_lowercase().replace(['-', '_'], "");
    match normalized.as_str() {
        "md5" => {
            let mut hasher = md5::Md5::new();
            hasher.update(bytes);
            Ok(hex::encode(hasher.finalize()))
        }
        "sha1" => {
            let mut hasher = sha1::Sha1::new();
            hasher.update(bytes);
            Ok(hex::encode(hasher.finalize()))
        }
        "sha224" => {
            let mut hasher = sha2::Sha224::new();
            hasher.update(bytes);
            Ok(hex::encode(hasher.finalize()))
        }
        "sha256" => {
            let mut hasher = sha2::Sha256::new();
            hasher.update(bytes);
            Ok(hex::encode(hasher.finalize()))
        }
        "sha384" => {
            let mut hasher = sha2::Sha384::new();
            hasher.update(bytes);
            Ok(hex::encode(hasher.finalize()))
        }
        "sha512" => {
            let mut hasher = sha2::Sha512::new();
            hasher.update(bytes);
            Ok(hex::encode(hasher.finalize()))
        }
        "sha3224" => {
            let mut hasher = sha3::Sha3_224::new();
            hasher.update(bytes);
            Ok(hex::encode(hasher.finalize()))
        }
        "sha3256" | "sha3" => {
            let mut hasher = sha3::Sha3_256::new();
            hasher.update(bytes);
            Ok(hex::encode(hasher.finalize()))
        }
        "sha3384" => {
            let mut hasher = sha3::Sha3_384::new();
            hasher.update(bytes);
            Ok(hex::encode(hasher.finalize()))
        }
        "sha3512" => {
            let mut hasher = sha3::Sha3_512::new();
            hasher.update(bytes);
            Ok(hex::encode(hasher.finalize()))
        }
        "ripemd160" | "rmd160" => {
            let mut hasher = ripemd::Ripemd160::new();
            hasher.update(bytes);
            Ok(hex::encode(hasher.finalize()))
        }
        _ => Err(format!(
            "Unsupported algorithm '{}'. Supported: md5, sha1, sha224, sha256, sha384, sha512, sha3-256, sha3-512, ripemd160",
            algorithm
        )),
    }
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
            return serde_json::to_string(&resp).unwrap_or_else(|_| "{\"code\":5000,\"msg\":\"Internal error\"}".into());
        }
    };

    match req.action.as_str() {
        "hash/calc" | "calc" => {
            let params: CalcParams = match serde_json::from_value(req.params) {
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

            let bytes = params.text.as_bytes();
            match compute_hash(bytes, &params.algorithm) {
                Ok(hash_str) => {
                    let resp = Response {
                        code: 0,
                        msg: "success".to_string(),
                        request_id: req.request_id,
                        data: Some(CalcData {
                            hash: hash_str,
                            algorithm: params.algorithm,
                            text_length: params.text.chars().count(),
                            byte_length: bytes.len(),
                        }),
                    };
                    serde_json::to_string(&resp).unwrap()
                }
                Err(err_msg) => {
                    let resp: Response<()> = Response {
                        code: 4003,
                        msg: err_msg,
                        request_id: req.request_id,
                        data: None,
                    };
                    serde_json::to_string(&resp).unwrap()
                }
            }
        }
        "hash/all" | "all" => {
            let params: AllParams = match serde_json::from_value(req.params) {
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

            let bytes = params.text.as_bytes();
            let text_length = params.text.chars().count();
            let byte_length = bytes.len();

            let md5_res = compute_hash(bytes, "md5").unwrap_or_default();
            let sha1_res = compute_hash(bytes, "sha1").unwrap_or_default();
            let sha256_res = compute_hash(bytes, "sha256").unwrap_or_default();
            let sha512_res = compute_hash(bytes, "sha512").unwrap_or_default();
            let sha3_res = compute_hash(bytes, "sha3-256").unwrap_or_default();
            let ripemd_res = compute_hash(bytes, "ripemd160").unwrap_or_default();

            let resp = Response {
                code: 0,
                msg: "success".to_string(),
                request_id: req.request_id,
                data: Some(AllData {
                    md5: md5_res,
                    sha1: sha1_res,
                    sha256: sha256_res,
                    sha512: sha512_res,
                    sha3_256: sha3_res,
                    ripemd160: ripemd_res,
                    text_length,
                    byte_length,
                }),
            };
            serde_json::to_string(&resp).unwrap()
        }
        _ => {
            let resp: Response<()> = Response {
                code: 4040,
                msg: format!("Unknown action '{}'. Supported actions: 'hash/calc', 'hash/all'", req.action),
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
    fn test_calc_sha256() {
        let req = r#"{
            "action": "hash/calc",
            "requestId": "test-1",
            "params": {
                "text": "hello",
                "algorithm": "sha256"
            }
        }"#;

        let res_json = handle_dispatch(req.as_bytes());
        // sha256("hello") = 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
        assert!(res_json.contains("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"));
    }

    #[test]
    fn test_calc_md5() {
        let req = r#"{
            "action": "hash/calc",
            "params": {
                "text": "hello",
                "algorithm": "md5"
            }
        }"#;

        let res_json = handle_dispatch(req.as_bytes());
        // md5("hello") = 5d41402abc4b2a76b9719d911017c592
        assert!(res_json.contains("5d41402abc4b2a76b9719d911017c592"));
    }

    #[test]
    fn test_all_hashes() {
        let req = r#"{
            "action": "hash/all",
            "params": {
                "text": "hello"
            }
        }"#;

        let res_json = handle_dispatch(req.as_bytes());
        assert!(res_json.contains("5d41402abc4b2a76b9719d911017c592")); // md5
        assert!(res_json.contains("aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d")); // sha1
        assert!(res_json.contains("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824")); // sha256
    }
}
