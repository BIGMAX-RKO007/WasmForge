//! # RSA Key Pair Generator & Formatter WASM Module
//!
//! Standard C-ABI Envelope Protocol module for generating RSA key pairs
//! and exporting them in PKCS#1 and PKCS#8 PEM formats.

use std::slice;
use rsa::{RsaPrivateKey, RsaPublicKey};
use rsa::pkcs8::{EncodePrivateKey, EncodePublicKey, LineEnding};
use rsa::pkcs1::{EncodeRsaPrivateKey, EncodeRsaPublicKey};
use rand_core::{CryptoRng, RngCore};
use serde::{Deserialize, Serialize};

// ============================================================================
// PRNG Implementation (Zero External OS Dependencies)
// ============================================================================

pub struct CustomPrng {
    state: u64,
}

impl CustomPrng {
    pub fn new(seed: u64) -> Self {
        Self {
            state: if seed == 0 { 0x853c49e6748fea9b } else { seed },
        }
    }
}

impl RngCore for CustomPrng {
    fn next_u32(&mut self) -> u32 {
        self.next_u64() as u32
    }

    fn next_u64(&mut self) -> u64 {
        self.state = self.state.wrapping_add(0x9e3779b97f4a7c15);
        let mut z = self.state;
        z = (z ^ (z >> 30)).wrapping_mul(0xbf58476d1ce4e5b9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94d049bb133111eb);
        z ^ (z >> 31)
    }

    fn fill_bytes(&mut self, dest: &mut [u8]) {
        let mut chunks = dest.chunks_exact_mut(8);
        for chunk in chunks.by_ref() {
            let val = self.next_u64();
            chunk.copy_from_slice(&val.to_le_bytes());
        }
        let rem = chunks.into_remainder();
        if !rem.is_empty() {
            let val = self.next_u64();
            let bytes = val.to_le_bytes();
            rem.copy_from_slice(&bytes[..rem.len()]);
        }
    }

    fn try_fill_bytes(&mut self, dest: &mut [u8]) -> Result<(), rand_core::Error> {
        self.fill_bytes(dest);
        Ok(())
    }
}

impl CryptoRng for CustomPrng {}

// ============================================================================
// Envelope Protocol Types
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct WasmRequest {
    pub action: String,
    #[serde(rename = "requestId", default)]
    pub request_id: String,
    #[serde(default)]
    pub params: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct WasmResponse<T: Serialize> {
    pub code: i32,
    pub msg: String,
    #[serde(rename = "requestId", skip_serializing_if = "Option::is_none")]
    pub request_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
}

#[derive(Debug, Deserialize)]
pub struct RsaGenerateParams {
    pub bits: Option<usize>,
    pub seed: Option<u64>,
}

#[derive(Debug, Serialize)]
pub struct RsaGenerateData {
    pub bits: usize,
    #[serde(rename = "privateKeyPkcs8Pem")]
    pub private_key_pkcs8_pem: String,
    #[serde(rename = "publicKeyPkcs8Pem")]
    pub public_key_pkcs8_pem: String,
    #[serde(rename = "privateKeyPkcs1Pem")]
    pub private_key_pkcs1_pem: String,
    #[serde(rename = "publicKeyPkcs1Pem")]
    pub public_key_pkcs1_pem: String,
}

// ============================================================================
// Core Logic
// ============================================================================

pub fn generate_rsa_key_pair(bits: usize, seed: u64) -> Result<RsaGenerateData, String> {
    // 校验位数: 支持 1024, 2048, 4096 位
    if bits != 1024 && bits != 2048 && bits != 4096 {
        return Err(format!("Unsupported RSA key size: {} bits. Allowed sizes are 1024, 2048, 4096.", bits));
    }

    let mut rng = CustomPrng::new(seed);
    let private_key = RsaPrivateKey::new(&mut rng, bits)
        .map_err(|e| format!("RSA key generation failed: {}", e))?;
    let public_key = RsaPublicKey::from(&private_key);

    // PKCS#8 格式导出
    let private_key_pkcs8_pem = private_key
        .to_pkcs8_pem(LineEnding::LF)
        .map_err(|e| format!("PKCS#8 private key export failed: {}", e))?
        .to_string();

    let public_key_pkcs8_pem = public_key
        .to_public_key_pem(LineEnding::LF)
        .map_err(|e| format!("PKCS#8 public key export failed: {}", e))?;

    // PKCS#1 格式导出
    let private_key_pkcs1_pem = private_key
        .to_pkcs1_pem(LineEnding::LF)
        .map_err(|e| format!("PKCS#1 private key export failed: {}", e))?
        .to_string();

    let public_key_pkcs1_pem = public_key
        .to_pkcs1_pem(LineEnding::LF)
        .map_err(|e| format!("PKCS#1 public key export failed: {}", e))?;

    Ok(RsaGenerateData {
        bits,
        private_key_pkcs8_pem,
        public_key_pkcs8_pem,
        private_key_pkcs1_pem,
        public_key_pkcs1_pem,
    })
}

// ============================================================================
// Standard C-ABI Exports
// ============================================================================

#[no_mangle]
pub extern "C" fn alloc(size: usize) -> *mut u8 {
    let mut buf = Vec::with_capacity(size);
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr
}

#[no_mangle]
pub unsafe extern "C" fn dealloc(ptr: *mut u8, size: usize) {
    if !ptr.is_null() {
        let _ = Vec::from_raw_parts(ptr, 0, size);
    }
}

#[no_mangle]
pub unsafe extern "C" fn dispatch(ptr: *const u8, len: usize) -> u64 {
    if ptr.is_null() || len == 0 {
        return pack_error(400, "Null or empty input payload", None);
    }

    let in_bytes = slice::from_raw_parts(ptr, len);
    let req: WasmRequest = match serde_json::from_slice(in_bytes) {
        Ok(r) => r,
        Err(e) => return pack_error(400, &format!("Invalid JSON envelope: {}", e), None),
    };

    let req_id = if req.request_id.is_empty() {
        None
    } else {
        Some(req.request_id)
    };

    match req.action.as_str() {
        "rsa/generate" => {
            let params: RsaGenerateParams = match serde_json::from_value(req.params) {
                Ok(p) => p,
                Err(e) => return pack_error(400, &format!("Invalid params for rsa/generate: {}", e), req_id),
            };
            let bits = params.bits.unwrap_or(2048);
            let seed = params.seed.unwrap_or(0xdeadbeefcafebabe);
            match generate_rsa_key_pair(bits, seed) {
                Ok(data) => pack_success(data, req_id),
                Err(err) => pack_error(500, &err, req_id),
            }
        }
        unknown => pack_error(404, &format!("Unknown action: {}", unknown), req_id),
    }
}

fn pack_success<T: Serialize>(data: T, request_id: Option<String>) -> u64 {
    let resp = WasmResponse {
        code: 0,
        msg: "ok".to_string(),
        request_id,
        data: Some(data),
    };
    pack_json_response(&resp)
}

fn pack_error(code: i32, msg: &str, request_id: Option<String>) -> u64 {
    let resp: WasmResponse<()> = WasmResponse {
        code,
        msg: msg.to_string(),
        request_id,
        data: None,
    };
    pack_json_response(&resp)
}

fn pack_json_response<T: Serialize>(resp: &WasmResponse<T>) -> u64 {
    let out_bytes = match serde_json::to_vec(resp) {
        Ok(b) => b,
        Err(_) => b"{\"code\":500,\"msg\":\"JSON serialization failed\"}".to_vec(),
    };

    let out_len = out_bytes.len();
    let boxed_slice = out_bytes.into_boxed_slice();
    let out_ptr = Box::into_raw(boxed_slice) as *mut u8 as usize;

    ((out_ptr as u64) << 32) | ((out_len as u64) & 0xFFFFFFFF)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rsa_generate_1024() {
        let res = generate_rsa_key_pair(1024, 123456789).expect("generate 1024-bit RSA key");
        assert_eq!(res.bits, 1024);
        assert!(res.private_key_pkcs8_pem.contains("BEGIN PRIVATE KEY"));
        assert!(res.public_key_pkcs8_pem.contains("BEGIN PUBLIC KEY"));
        assert!(res.private_key_pkcs1_pem.contains("BEGIN RSA PRIVATE KEY"));
        assert!(res.public_key_pkcs1_pem.contains("BEGIN RSA PUBLIC KEY"));
    }
}
