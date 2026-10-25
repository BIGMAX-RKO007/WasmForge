//! WasmForge Tool #7: BIP-39 Blockchain Mnemonic Generator & Validator
//! Pure WebAssembly module without JS glue code.

use bip39::{Language, Mnemonic};
use serde::{Deserialize, Serialize};

// Simple SplitMix64 PRNG to generate entropy bytes (16 to 32 bytes)
pub struct Prng {
    state: u64,
}

impl Prng {
    pub fn new(seed: u64) -> Self {
        Self { state: if seed == 0 { 0xb1b39202deadbeef } else { seed } }
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
pub struct GenerateParams {
    #[serde(rename = "wordCount", default = "default_word_count")]
    pub word_count: usize,
    pub passphrase: Option<String>,
    pub seed: Option<u64>,
}

fn default_word_count() -> usize { 12 }

#[derive(Serialize)]
pub struct GenerateData {
    pub mnemonic: String,
    pub words: Vec<String>,
    #[serde(rename = "wordCount")]
    pub word_count: usize,
    #[serde(rename = "entropyHex")]
    pub entropy_hex: String,
    #[serde(rename = "seedHex")]
    pub seed_hex: String,
}

#[derive(Deserialize)]
pub struct ValidateParams {
    pub mnemonic: String,
    pub passphrase: Option<String>,
}

#[derive(Serialize)]
pub struct ValidateData {
    pub mnemonic: String,
    #[serde(rename = "isValid")]
    pub is_valid: bool,
    #[serde(rename = "wordCount")]
    pub word_count: usize,
    #[serde(rename = "seedHex")]
    pub seed_hex: Option<String>,
}

// ==================== Core BIP-39 Operations ====================

pub fn generate_mnemonic(params: GenerateParams) -> Result<GenerateData, String> {
    let entropy_bytes_len = match params.word_count {
        12 => 16,
        15 => 20,
        18 => 24,
        21 => 28,
        24 => 32,
        _ => return Err("Invalid BIP-39 word count (must be 12, 15, 18, 21, or 24 words)".to_string()),
    };

    let mut entropy = vec![0u8; entropy_bytes_len];
    let mut prng = Prng::new(params.seed.unwrap_or(0xca11b1b39));
    prng.fill_bytes(&mut entropy);

    let mnemonic = Mnemonic::from_entropy(&entropy)
        .map_err(|e| format!("Failed to create mnemonic from entropy: {}", e))?;

    let passphrase = params.passphrase.unwrap_or_default();
    let seed_512 = mnemonic.to_seed(passphrase);

    let words: Vec<String> = mnemonic.words().map(|w| w.to_string()).collect();
    let phrase_str = words.join(" ");

    Ok(GenerateData {
        mnemonic: phrase_str,
        words,
        word_count: params.word_count,
        entropy_hex: hex::encode(&entropy),
        seed_hex: hex::encode(seed_512),
    })
}

pub fn validate_mnemonic(params: ValidateParams) -> ValidateData {
    let cleaned = params.mnemonic.trim();
    let words_vec: Vec<&str> = cleaned.split_whitespace().collect();
    let count = words_vec.len();

    match Mnemonic::parse_in_normalized(Language::English, cleaned) {
        Ok(mnemonic) => {
            let passphrase = params.passphrase.unwrap_or_default();
            let seed_512 = mnemonic.to_seed(passphrase);
            ValidateData {
                mnemonic: cleaned.to_string(),
                is_valid: true,
                word_count: count,
                seed_hex: Some(hex::encode(seed_512)),
            }
        }
        Err(_) => ValidateData {
            mnemonic: cleaned.to_string(),
            is_valid: false,
            word_count: count,
            seed_hex: None,
        },
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
                "bip39/generate" => {
                    let params: GenerateParams = serde_json::from_value(req.params)
                        .unwrap_or(GenerateParams { word_count: 12, passphrase: None, seed: None });

                    match generate_mnemonic(params) {
                        Ok(data) => {
                            let resp = EnvelopeResponse {
                                code: 0,
                                msg: "Success".to_string(),
                                request_id: req_id,
                                data: Some(data),
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
                "bip39/validate" => {
                    let params_res: Result<ValidateParams, _> = serde_json::from_value(req.params);
                    match params_res {
                        Ok(p) => {
                            let data = validate_mnemonic(p);
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
                                code: 400,
                                msg: format!("Invalid validation parameters: {}", e),
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
                        msg: format!("Action '{}' not supported in bip39-generator", unknown),
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
    fn test_bip39_generation_and_validation() {
        let gen = generate_mnemonic(GenerateParams {
            word_count: 12,
            passphrase: Some("crypto2026".to_string()),
            seed: Some(999),
        }).expect("Mnemonic generation failed");

        assert_eq!(gen.words.len(), 12);
        assert_eq!(gen.entropy_hex.len(), 32); // 16 bytes = 32 hex chars
        assert_eq!(gen.seed_hex.len(), 128); // 64 bytes = 128 hex chars

        let val = validate_mnemonic(ValidateParams {
            mnemonic: gen.mnemonic.clone(),
            passphrase: Some("crypto2026".to_string()),
        });

        assert!(val.is_valid, "Generated mnemonic must be valid");
        assert_eq!(val.seed_hex, Some(gen.seed_hex));
    }

    #[test]
    fn test_invalid_mnemonic() {
        let val = validate_mnemonic(ValidateParams {
            mnemonic: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon".to_string(), // bad checksum
            passphrase: None,
        });
        assert!(!val.is_valid, "Mnemonic with invalid checksum must fail");
    }
}
