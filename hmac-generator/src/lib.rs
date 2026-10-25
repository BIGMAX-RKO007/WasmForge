//! WasmForge Tool #8: HMAC (Hash-based Message Authentication Code) Generator & Verifier
//! Host-agnostic, pure WebAssembly module without JS glue code.

use base64::engine::general_purpose::STANDARD as BASE64_STANDARD;
use base64::Engine;
use hmac::{Hmac, Mac};
use md5::Md5;
use serde::{Deserialize, Serialize};
use sha1::Sha1;
use sha2::{Sha256, Sha512};
use sha3::Sha3_256;

type HmacMd5 = Hmac<Md5>;
type HmacSha1 = Hmac<Sha1>;
type HmacSha256 = Hmac<Sha256>;
type HmacSha512 = Hmac<Sha512>;
type HmacSha3 = Hmac<Sha3_256>;

// ==================== Envelope Protocol Data Structures ====================

#[derive(Deserialize)]
struct EnvelopeRequest {
    action: String,
    #[serde(rename = "requestId")]
    request_id: Option<String>,
    #[serde(default)]
    params: serde_json::Value,
}

#[derive(Serialize)]
struct EnvelopeResponse<T: Serialize> {
    code: i32,
    msg: String,
    #[serde(rename = "requestId", skip_serializing_if = "Option::is_none")]
    request_id: Option<String>,
    data: Option<T>,
}

#[derive(Deserialize)]
pub struct HmacAllParams {
    pub text: String,
    #[serde(rename = "secretKey")]
    pub secret_key: String,
    #[serde(default = "default_format")]
    pub format: String,
}

fn default_format() -> String { "hex".to_string() }

#[derive(Serialize)]
pub struct HmacAllData {
    pub md5: String,
    pub sha1: String,
    pub sha256: String,
    pub sha512: String,
    pub sha3_256: String,
    pub format: String,
}

#[derive(Deserialize)]
pub struct HmacComputeParams {
    pub text: String,
    #[serde(rename = "secretKey")]
    pub secret_key: String,
    pub algorithm: String,
    #[serde(default = "default_format")]
    pub format: String,
}

#[derive(Serialize)]
pub struct HmacComputeData {
    pub hmac: String,
    pub algorithm: String,
    pub format: String,
}

#[derive(Deserialize)]
pub struct HmacVerifyParams {
    pub text: String,
    #[serde(rename = "secretKey")]
    pub secret_key: String,
    pub hmac: String,
    pub algorithm: String,
    #[serde(default = "default_format")]
    pub format: String,
}

#[derive(Serialize)]
pub struct HmacVerifyData {
    pub valid: bool,
    pub algorithm: String,
}

// ==================== Core HMAC Logic ====================

fn format_bytes(bytes: &[u8], format: &str) -> String {
    if format.to_lowercase() == "base64" {
        BASE64_STANDARD.encode(bytes)
    } else {
        hex::encode(bytes)
    }
}

pub fn compute_hmac_bytes(algo: &str, key: &[u8], text: &[u8]) -> Result<Vec<u8>, String> {
    match algo.to_lowercase().as_str() {
        "md5" => {
            let mut mac = HmacMd5::new_from_slice(key).map_err(|e| format!("{}", e))?;
            mac.update(text);
            Ok(mac.finalize().into_bytes().to_vec())
        }
        "sha1" => {
            let mut mac = HmacSha1::new_from_slice(key).map_err(|e| format!("{}", e))?;
            mac.update(text);
            Ok(mac.finalize().into_bytes().to_vec())
        }
        "sha256" => {
            let mut mac = HmacSha256::new_from_slice(key).map_err(|e| format!("{}", e))?;
            mac.update(text);
            Ok(mac.finalize().into_bytes().to_vec())
        }
        "sha512" => {
            let mut mac = HmacSha512::new_from_slice(key).map_err(|e| format!("{}", e))?;
            mac.update(text);
            Ok(mac.finalize().into_bytes().to_vec())
        }
        "sha3" | "sha3-256" | "sha3_256" => {
            let mut mac = HmacSha3::new_from_slice(key).map_err(|e| format!("{}", e))?;
            mac.update(text);
            Ok(mac.finalize().into_bytes().to_vec())
        }
        unknown => Err(format!("Unsupported HMAC algorithm: {}", unknown)),
    }
}

pub fn verify_hmac(params: HmacVerifyParams) -> Result<bool, String> {
    let key = params.secret_key.as_bytes();
    let text = params.text.as_bytes();
    let expected_bytes = if params.format.to_lowercase() == "base64" {
        BASE64_STANDARD.decode(params.hmac.trim()).map_err(|e| format!("Invalid base64: {}", e))?
    } else {
        hex::decode(params.hmac.trim()).map_err(|e| format!("Invalid hex: {}", e))?
    };

    match params.algorithm.to_lowercase().as_str() {
        "md5" => {
            let mut mac = HmacMd5::new_from_slice(key).map_err(|e| format!("{}", e))?;
            mac.update(text);
            Ok(mac.verify_slice(&expected_bytes).is_ok())
        }
        "sha1" => {
            let mut mac = HmacSha1::new_from_slice(key).map_err(|e| format!("{}", e))?;
            mac.update(text);
            Ok(mac.verify_slice(&expected_bytes).is_ok())
        }
        "sha256" => {
            let mut mac = HmacSha256::new_from_slice(key).map_err(|e| format!("{}", e))?;
            mac.update(text);
            Ok(mac.verify_slice(&expected_bytes).is_ok())
        }
        "sha512" => {
            let mut mac = HmacSha512::new_from_slice(key).map_err(|e| format!("{}", e))?;
            mac.update(text);
            Ok(mac.verify_slice(&expected_bytes).is_ok())
        }
        "sha3" | "sha3-256" | "sha3_256" => {
            let mut mac = HmacSha3::new_from_slice(key).map_err(|e| format!("{}", e))?;
            mac.update(text);
            Ok(mac.verify_slice(&expected_bytes).is_ok())
        }
        unknown => Err(format!("Unsupported HMAC algorithm: {}", unknown)),
    }
}

// ==================== Standard C-ABI Exports ====================

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
        let _ = Vec::from_raw_parts(ptr, size, size);
    }
}

#[no_mangle]
pub unsafe extern "C" fn dispatch(ptr: *const u8, len: usize) -> u64 {
    let in_bytes = core::slice::from_raw_parts(ptr, len);
    let req: Result<EnvelopeRequest, _> = serde_json::from_slice(in_bytes);

    let resp_bytes = match req {
        Ok(req) => {
            let req_id = req.request_id;
            match req.action.as_str() {
                "hmac/all" => {
                    let parse_res: Result<HmacAllParams, _> = serde_json::from_value(req.params);
                    match parse_res {
                        Ok(p) => {
                            let key = p.secret_key.as_bytes();
                            let text = p.text.as_bytes();
                            let fmt = p.format.to_lowercase();

                            let md5_bytes = compute_hmac_bytes("md5", key, text).unwrap_or_default();
                            let sha1_bytes = compute_hmac_bytes("sha1", key, text).unwrap_or_default();
                            let sha256_bytes = compute_hmac_bytes("sha256", key, text).unwrap_or_default();
                            let sha512_bytes = compute_hmac_bytes("sha512", key, text).unwrap_or_default();
                            let sha3_bytes = compute_hmac_bytes("sha3_256", key, text).unwrap_or_default();

                            let resp = EnvelopeResponse {
                                code: 0,
                                msg: "Success".to_string(),
                                request_id: req_id,
                                data: Some(HmacAllData {
                                    md5: format_bytes(&md5_bytes, &fmt),
                                    sha1: format_bytes(&sha1_bytes, &fmt),
                                    sha256: format_bytes(&sha256_bytes, &fmt),
                                    sha512: format_bytes(&sha512_bytes, &fmt),
                                    sha3_256: format_bytes(&sha3_bytes, &fmt),
                                    format: fmt,
                                }),
                            };
                            serde_json::to_vec(&resp).unwrap_or_default()
                        }
                        Err(e) => {
                            let err: EnvelopeResponse<()> = EnvelopeResponse {
                                code: 400,
                                msg: format!("Invalid parameters: {}", e),
                                request_id: req_id,
                                data: None,
                            };
                            serde_json::to_vec(&err).unwrap_or_default()
                        }
                    }
                }
                "hmac/compute" => {
                    let parse_res: Result<HmacComputeParams, _> = serde_json::from_value(req.params);
                    match parse_res {
                        Ok(p) => {
                            let key = p.secret_key.as_bytes();
                            let text = p.text.as_bytes();
                            match compute_hmac_bytes(&p.algorithm, key, text) {
                                Ok(bytes) => {
                                    let formatted = format_bytes(&bytes, &p.format);
                                    let resp = EnvelopeResponse {
                                        code: 0,
                                        msg: "Success".to_string(),
                                        request_id: req_id,
                                        data: Some(HmacComputeData {
                                            hmac: formatted,
                                            algorithm: p.algorithm,
                                            format: p.format.to_lowercase(),
                                        }),
                                    };
                                    serde_json::to_vec(&resp).unwrap_or_default()
                                }
                                Err(err_msg) => {
                                    let err: EnvelopeResponse<()> = EnvelopeResponse {
                                        code: 422,
                                        msg: err_msg,
                                        request_id: req_id,
                                        data: None,
                                    };
                                    serde_json::to_vec(&err).unwrap_or_default()
                                }
                            }
                        }
                        Err(e) => {
                            let err: EnvelopeResponse<()> = EnvelopeResponse {
                                code: 400,
                                msg: format!("Invalid parameters: {}", e),
                                request_id: req_id,
                                data: None,
                            };
                            serde_json::to_vec(&err).unwrap_or_default()
                        }
                    }
                }
                "hmac/verify" => {
                    let parse_res: Result<HmacVerifyParams, _> = serde_json::from_value(req.params);
                    match parse_res {
                        Ok(p) => {
                            let algo = p.algorithm.clone();
                            match verify_hmac(p) {
                                Ok(valid) => {
                                    let resp = EnvelopeResponse {
                                        code: 0,
                                        msg: "Success".to_string(),
                                        request_id: req_id,
                                        data: Some(HmacVerifyData {
                                            valid,
                                            algorithm: algo,
                                        }),
                                    };
                                    serde_json::to_vec(&resp).unwrap_or_default()
                                }
                                Err(err_msg) => {
                                    let err: EnvelopeResponse<()> = EnvelopeResponse {
                                        code: 422,
                                        msg: err_msg,
                                        request_id: req_id,
                                        data: None,
                                    };
                                    serde_json::to_vec(&err).unwrap_or_default()
                                }
                            }
                        }
                        Err(e) => {
                            let err: EnvelopeResponse<()> = EnvelopeResponse {
                                code: 400,
                                msg: format!("Invalid parameters: {}", e),
                                request_id: req_id,
                                data: None,
                            };
                            serde_json::to_vec(&err).unwrap_or_default()
                        }
                    }
                }
                unknown => {
                    let err: EnvelopeResponse<()> = EnvelopeResponse {
                        code: 404,
                        msg: format!("Action '{}' not supported in hmac-generator", unknown),
                        request_id: req_id,
                        data: None,
                    };
                    serde_json::to_vec(&err).unwrap_or_default()
                }
            }
        }
        Err(e) => {
            let err: EnvelopeResponse<()> = EnvelopeResponse {
                code: 400,
                msg: format!("Invalid JSON request envelope: {}", e),
                request_id: None,
                data: None,
            };
            serde_json::to_vec(&err).unwrap_or_default()
        }
    };

    let boxed_slice = resp_bytes.into_boxed_slice();
    let out_len = boxed_slice.len();
    let out_ptr = Box::into_raw(boxed_slice) as *mut u8;

    ((out_ptr as u64) << 32) | (out_len as u64)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hmac_sha256() {
        let key = b"key";
        let text = b"The quick brown fox jumps over the lazy dog";
        let res = compute_hmac_bytes("sha256", key, text).expect("HMAC failed");
        let hex_res = hex::encode(res);
        assert_eq!(
            hex_res,
            "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8"
        );
    }

    #[test]
    fn test_hmac_verify() {
        let params = HmacVerifyParams {
            text: "The quick brown fox jumps over the lazy dog".to_string(),
            secret_key: "key".to_string(),
            hmac: "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8".to_string(),
            algorithm: "sha256".to_string(),
            format: "hex".to_string(),
        };
        assert!(verify_hmac(params).expect("Verification failed"));
    }
}
