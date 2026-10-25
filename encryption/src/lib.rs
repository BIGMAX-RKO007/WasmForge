//! WasmForge Tool #6: AES-GCM Authenticated Symmetric Encryption & Decryption
//! Host-agnostic, pure WebAssembly module without JS glue code.

use aes_gcm::aead::Aead;
use aes_gcm::{Aes128Gcm, Aes256Gcm, KeyInit, Nonce};
use base64::engine::general_purpose::STANDARD as BASE64_STANDARD;
use base64::Engine;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

// Simple internal PRNG for generating 12-byte nonces
pub struct Prng {
    state: u64,
}

impl Prng {
    pub fn new(seed: u64) -> Self {
        Self { state: if seed == 0 { 0xa5a5a5a512345678 } else { seed } }
    }

    pub fn next_u64(&mut self) -> u64 {
        self.state = self.state.wrapping_add(0x9e3779b97f4a7c15);
        let mut z = self.state;
        z = (z ^ (z >> 30)).wrapping_mul(0xbf58476d1ce4e5b9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94d049bb133111eb);
        z ^ (z >> 31)
    }

    pub fn fill_bytes(&mut self, buf: &mut [u8]) {
        let mut i = 0;
        while i < buf.len() {
            let val = self.next_u64().to_le_bytes();
            let take = (buf.len() - i).min(8);
            buf[i..i + take].copy_from_slice(&val[..take]);
            i += take;
        }
    }
}

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
pub struct EncryptParams {
    pub text: String,
    #[serde(rename = "secretKey")]
    pub secret_key: String,
    #[serde(rename = "keyBits", default = "default_key_bits")]
    pub key_bits: u32,
    #[serde(default = "default_format")]
    pub format: String,
    pub nonce: Option<String>,
    pub seed: Option<u64>,
}

fn default_key_bits() -> u32 { 256 }
fn default_format() -> String { "base64".to_string() }

#[derive(Serialize)]
pub struct EncryptData {
    pub ciphertext: String,
    pub nonce: String,
    pub algorithm: String,
    pub format: String,
    #[serde(rename = "originalBytes")]
    pub original_bytes: usize,
}

#[derive(Deserialize)]
pub struct DecryptParams {
    pub ciphertext: String,
    #[serde(rename = "secretKey")]
    pub secret_key: String,
    pub nonce: String,
    #[serde(rename = "keyBits", default = "default_key_bits")]
    pub key_bits: u32,
    #[serde(default = "default_format")]
    pub format: String,
}

#[derive(Serialize)]
pub struct DecryptData {
    pub plaintext: String,
    pub verified: bool,
    pub algorithm: String,
}

// ==================== Core Encryption / Decryption Logic ====================

fn derive_key(secret: &str) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(secret.as_bytes());
    let result = hasher.finalize();
    let mut key = [0u8; 32];
    key.copy_from_slice(&result);
    key
}

pub fn encrypt_aes(params: EncryptParams) -> Result<EncryptData, String> {
    if params.secret_key.is_empty() {
        return Err("Secret key cannot be empty".to_string());
    }

    let key_32 = derive_key(&params.secret_key);
    let mut nonce_bytes = [0u8; 12];

    if let Some(ref n_str) = params.nonce {
        let n_decoded = if params.format == "hex" {
            hex::decode(n_str).map_err(|e| format!("Invalid hex nonce: {}", e))?
        } else {
            BASE64_STANDARD.decode(n_str).map_err(|e| format!("Invalid base64 nonce: {}", e))?
        };
        if n_decoded.len() != 12 {
            return Err("Nonce must be exactly 12 bytes (96 bits)".to_string());
        }
        nonce_bytes.copy_from_slice(&n_decoded);
    } else {
        let mut prng = Prng::new(params.seed.unwrap_or(0xdeadbeef));
        prng.fill_bytes(&mut nonce_bytes);
    }

    let nonce = Nonce::from_slice(&nonce_bytes);
    let algo_name: &str;
    let encrypted_bytes = if params.key_bits == 128 {
        algo_name = "AES-128-GCM";
        let cipher = Aes128Gcm::new_from_slice(&key_32[..16])
            .map_err(|e| format!("Failed to initialize AES-128-GCM: {}", e))?;
        cipher.encrypt(nonce, params.text.as_bytes())
            .map_err(|e| format!("AES-128 encryption error: {}", e))?
    } else {
        algo_name = "AES-256-GCM";
        let cipher = Aes256Gcm::new_from_slice(&key_32)
            .map_err(|e| format!("Failed to initialize AES-256-GCM: {}", e))?;
        cipher.encrypt(nonce, params.text.as_bytes())
            .map_err(|e| format!("AES-256 encryption error: {}", e))?
    };

    let (cipher_str, nonce_str) = if params.format.to_lowercase() == "hex" {
        (hex::encode(&encrypted_bytes), hex::encode(nonce_bytes))
    } else {
        (BASE64_STANDARD.encode(&encrypted_bytes), BASE64_STANDARD.encode(nonce_bytes))
    };

    Ok(EncryptData {
        ciphertext: cipher_str,
        nonce: nonce_str,
        algorithm: algo_name.to_string(),
        format: params.format.to_lowercase(),
        original_bytes: params.text.len(),
    })
}

pub fn decrypt_aes(params: DecryptParams) -> Result<DecryptData, String> {
    if params.secret_key.is_empty() {
        return Err("Secret key cannot be empty".to_string());
    }

    let key_32 = derive_key(&params.secret_key);

    let nonce_bytes = if params.format.to_lowercase() == "hex" {
        hex::decode(params.nonce.trim()).map_err(|e| format!("Invalid hex nonce: {}", e))?
    } else {
        BASE64_STANDARD.decode(params.nonce.trim()).map_err(|e| format!("Invalid base64 nonce: {}", e))?
    };

    if nonce_bytes.len() != 12 {
        return Err("Nonce must be exactly 12 bytes (96 bits)".to_string());
    }
    let nonce = Nonce::from_slice(&nonce_bytes);

    let cipher_bytes = if params.format.to_lowercase() == "hex" {
        hex::decode(params.ciphertext.trim()).map_err(|e| format!("Invalid hex ciphertext: {}", e))?
    } else {
        BASE64_STANDARD.decode(params.ciphertext.trim()).map_err(|e| format!("Invalid base64 ciphertext: {}", e))?
    };

    let algo_name: &str;
    let decrypted_bytes = if params.key_bits == 128 {
        algo_name = "AES-128-GCM";
        let cipher = Aes128Gcm::new_from_slice(&key_32[..16])
            .map_err(|e| format!("Failed to initialize AES-128-GCM: {}", e))?;
        cipher.decrypt(nonce, cipher_bytes.as_ref())
            .map_err(|_| "Decryption or Authentication Tag verification failed! (Incorrect password or tampered ciphertext)".to_string())?
    } else {
        algo_name = "AES-256-GCM";
        let cipher = Aes256Gcm::new_from_slice(&key_32)
            .map_err(|e| format!("Failed to initialize AES-256-GCM: {}", e))?;
        cipher.decrypt(nonce, cipher_bytes.as_ref())
            .map_err(|_| "Decryption or Authentication Tag verification failed! (Incorrect password or tampered ciphertext)".to_string())?
    };

    let plaintext = String::from_utf8(decrypted_bytes)
        .map_err(|e| format!("Decrypted payload is not valid UTF-8 string: {}", e))?;

    Ok(DecryptData {
        plaintext,
        verified: true,
        algorithm: algo_name.to_string(),
    })
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
                "aes/encrypt" => {
                    let parse_res: Result<EncryptParams, _> = serde_json::from_value(req.params);
                    match parse_res {
                        Ok(p) => match encrypt_aes(p) {
                            Ok(data) => {
                                let resp = EnvelopeResponse {
                                    code: 0,
                                    msg: "Success".to_string(),
                                    request_id: req_id,
                                    data: Some(data),
                                };
                                serde_json::to_vec(&resp).unwrap_or_default()
                            }
                            Err(e) => {
                                let err: EnvelopeResponse<()> = EnvelopeResponse {
                                    code: 422,
                                    msg: e,
                                    request_id: req_id,
                                    data: None,
                                };
                                serde_json::to_vec(&err).unwrap_or_default()
                            }
                        },
                        Err(e) => {
                            let err: EnvelopeResponse<()> = EnvelopeResponse {
                                code: 400,
                                msg: format!("Invalid encryption parameters: {}", e),
                                request_id: req_id,
                                data: None,
                            };
                            serde_json::to_vec(&err).unwrap_or_default()
                        }
                    }
                }
                "aes/decrypt" => {
                    let parse_res: Result<DecryptParams, _> = serde_json::from_value(req.params);
                    match parse_res {
                        Ok(p) => match decrypt_aes(p) {
                            Ok(data) => {
                                let resp = EnvelopeResponse {
                                    code: 0,
                                    msg: "Success".to_string(),
                                    request_id: req_id,
                                    data: Some(data),
                                };
                                serde_json::to_vec(&resp).unwrap_or_default()
                            }
                            Err(e) => {
                                let err: EnvelopeResponse<()> = EnvelopeResponse {
                                    code: 422,
                                    msg: e,
                                    request_id: req_id,
                                    data: None,
                                };
                                serde_json::to_vec(&err).unwrap_or_default()
                            }
                        },
                        Err(e) => {
                            let err: EnvelopeResponse<()> = EnvelopeResponse {
                                code: 400,
                                msg: format!("Invalid decryption parameters: {}", e),
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
                        msg: format!("Action '{}' not supported in encryption module", unknown),
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
    fn test_aes_256_gcm_roundtrip() {
        let enc_params = EncryptParams {
            text: "Hello WebAssembly AES-GCM!".to_string(),
            secret_key: "my-secure-password-2026".to_string(),
            key_bits: 256,
            format: "base64".to_string(),
            nonce: None,
            seed: Some(12345),
        };

        let enc_res = encrypt_aes(enc_params).expect("Encryption failed");
        assert!(!enc_res.ciphertext.is_empty());
        assert!(!enc_res.nonce.is_empty());

        let dec_params = DecryptParams {
            ciphertext: enc_res.ciphertext,
            secret_key: "my-secure-password-2026".to_string(),
            nonce: enc_res.nonce,
            key_bits: 256,
            format: "base64".to_string(),
        };

        let dec_res = decrypt_aes(dec_params).expect("Decryption failed");
        assert_eq!(dec_res.plaintext, "Hello WebAssembly AES-GCM!");
        assert!(dec_res.verified);
    }

    #[test]
    fn test_tamper_detection() {
        let enc_params = EncryptParams {
            text: "Top Secret Payload".to_string(),
            secret_key: "correct-password".to_string(),
            key_bits: 256,
            format: "hex".to_string(),
            nonce: None,
            seed: Some(54321),
        };

        let enc_res = encrypt_aes(enc_params).expect("Encryption failed");

        // Try decrypting with wrong password
        let dec_params_wrong = DecryptParams {
            ciphertext: enc_res.ciphertext,
            secret_key: "wrong-password".to_string(),
            nonce: enc_res.nonce,
            key_bits: 256,
            format: "hex".to_string(),
        };

        let err = decrypt_aes(dec_params_wrong);
        assert!(err.is_err(), "Decryption must fail when password is wrong");
    }
}
