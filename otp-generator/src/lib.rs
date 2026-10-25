extern crate alloc;

use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec;
use alloc::vec::Vec;
use core::slice;
use serde::{Deserialize, Serialize};

// --- Base32 Decoding (RFC 4648) ---
pub fn base32_decode(input: &str) -> Result<Vec<u8>, String> {
    let mut clean = Vec::new();
    for c in input.chars() {
        if c.is_ascii_whitespace() || c == '-' {
            continue;
        }
        if c == '=' {
            break;
        }
        let upper = c.to_ascii_uppercase();
        let val = match upper {
            'A'..='Z' => (upper as u8) - b'A',
            '2'..='7' => (upper as u8) - b'2' + 26,
            _ => return Err(format!("Invalid base32 character: '{}'", c)),
        };
        clean.push(val);
    }

    let mut out = Vec::new();
    let mut buffer: u32 = 0;
    let mut bits_left = 0;

    for val in clean {
        buffer = (buffer << 5) | (val as u32);
        bits_left += 5;
        if bits_left >= 8 {
            bits_left -= 8;
            out.push(((buffer >> bits_left) & 0xff) as u8);
        }
    }

    Ok(out)
}

// --- SHA-1 Implementation (RFC 3174) ---
struct Sha1 {
    state: [u32; 5],
    count: u64,
    buffer: [u8; 64],
}

impl Sha1 {
    fn new() -> Self {
        Self {
            state: [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0],
            count: 0,
            buffer: [0u8; 64],
        }
    }

    fn update(&mut self, data: &[u8]) {
        for &byte in data {
            let idx = (self.count % 64) as usize;
            self.buffer[idx] = byte;
            self.count += 1;
            if idx == 63 {
                self.process_block();
            }
        }
    }

    fn process_block(&mut self) {
        let mut w = [0u32; 80];
        for i in 0..16 {
            w[i] = ((self.buffer[i * 4] as u32) << 24)
                | ((self.buffer[i * 4 + 1] as u32) << 16)
                | ((self.buffer[i * 4 + 2] as u32) << 8)
                | (self.buffer[i * 4 + 3] as u32);
        }
        for i in 16..80 {
            w[i] = (w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16]).rotate_left(1);
        }

        let mut a = self.state[0];
        let mut b = self.state[1];
        let mut c = self.state[2];
        let mut d = self.state[3];
        let mut e = self.state[4];

        for i in 0..80 {
            let (f, k) = match i {
                0..=19 => ((b & c) | (!b & d), 0x5a827999),
                20..=39 => (b ^ c ^ d, 0x6ed9eba1),
                40..=59 => ((b & c) | (b & d) | (c & d), 0x8f1bbcdc),
                _ => (b ^ c ^ d, 0xca62c1d6),
            };

            let temp = a.rotate_left(5)
                .wrapping_add(f)
                .wrapping_add(e)
                .wrapping_add(k)
                .wrapping_add(w[i]);

            e = d;
            d = c;
            c = b.rotate_left(30);
            b = a;
            a = temp;
        }

        self.state[0] = self.state[0].wrapping_add(a);
        self.state[1] = self.state[1].wrapping_add(b);
        self.state[2] = self.state[2].wrapping_add(c);
        self.state[3] = self.state[3].wrapping_add(d);
        self.state[4] = self.state[4].wrapping_add(e);
    }

    fn finalize(mut self) -> [u8; 20] {
        let bit_count = self.count * 8;
        let pad_idx = (self.count % 64) as usize;
        self.buffer[pad_idx] = 0x80;
        self.count += 1;

        if pad_idx >= 56 {
            for i in (pad_idx + 1)..64 {
                self.buffer[i] = 0;
            }
            self.process_block();
            for i in 0..56 {
                self.buffer[i] = 0;
            }
        } else {
            for i in (pad_idx + 1)..56 {
                self.buffer[i] = 0;
            }
        }

        for i in 0..8 {
            self.buffer[56 + i] = (bit_count >> (56 - i * 8)) as u8;
        }
        self.process_block();

        let mut digest = [0u8; 20];
        for i in 0..5 {
            digest[i * 4] = (self.state[i] >> 24) as u8;
            digest[i * 4 + 1] = (self.state[i] >> 16) as u8;
            digest[i * 4 + 2] = (self.state[i] >> 8) as u8;
            digest[i * 4 + 3] = self.state[i] as u8;
        }
        digest
    }
}

// --- HMAC-SHA1 Implementation (RFC 2104) ---
pub fn hmac_sha1(key: &[u8], data: &[u8]) -> [u8; 20] {
    let mut key_block = [0u8; 64];
    if key.len() > 64 {
        let mut hasher = Sha1::new();
        hasher.update(key);
        let key_hash = hasher.finalize();
        key_block[..20].copy_from_slice(&key_hash);
    } else {
        key_block[..key.len()].copy_from_slice(key);
    }

    let mut ipad = [0u8; 64];
    let mut opad = [0u8; 64];
    for i in 0..64 {
        ipad[i] = key_block[i] ^ 0x36;
        opad[i] = key_block[i] ^ 0x5c;
    }

    let mut inner = Sha1::new();
    inner.update(&ipad);
    inner.update(data);
    let inner_hash = inner.finalize();

    let mut outer = Sha1::new();
    outer.update(&opad);
    outer.update(&inner_hash);
    outer.finalize()
}

// --- HOTP (RFC 4226) ---
pub fn generate_hotp(secret_bytes: &[u8], counter: u64, digits: u32) -> String {
    let mut counter_bytes = [0u8; 8];
    for i in 0..8 {
        counter_bytes[i] = (counter >> (56 - i * 8)) as u8;
    }

    let hash = hmac_sha1(secret_bytes, &counter_bytes);
    let offset = (hash[19] & 0x0f) as usize;

    let binary = (((hash[offset] & 0x7f) as u32) << 24)
        | ((hash[offset + 1] as u32) << 16)
        | ((hash[offset + 2] as u32) << 8)
        | (hash[offset + 3] as u32);

    let modulo = match digits {
        8 => 100_000_000,
        7 => 10_000_000,
        _ => 1_000_000, // default 6
    };

    let otp = binary % modulo;
    match digits {
        8 => format!("{:08}", otp),
        7 => format!("{:07}", otp),
        _ => format!("{:06}", otp),
    }
}

// --- TOTP (RFC 6238) ---
#[derive(Debug, Deserialize)]
pub struct TotpParams {
    pub secret: String,
    #[serde(default = "default_digits")]
    pub digits: u32,
    #[serde(default = "default_period")]
    pub period: u64,
    #[serde(rename = "currentTime")]
    pub current_time: Option<u64>,
}

fn default_digits() -> u32 { 6 }
fn default_period() -> u64 { 30 }

#[derive(Debug, Serialize)]
pub struct TotpResult {
    pub code: String,
    pub counter: u64,
    #[serde(rename = "remainingSeconds")]
    pub remaining_seconds: u64,
    #[serde(rename = "periodSeconds")]
    pub period_seconds: u64,
    pub digits: u32,
    pub algorithm: String,
    #[serde(rename = "validUntil")]
    pub valid_until: u64,
}

#[derive(Debug, Deserialize)]
pub struct HotpParams {
    pub secret: String,
    pub counter: u64,
    #[serde(default = "default_digits")]
    pub digits: u32,
}

#[derive(Debug, Serialize)]
pub struct HotpResult {
    pub code: String,
    pub counter: u64,
    pub digits: u32,
    pub algorithm: String,
}

#[derive(Debug, Deserialize)]
pub struct VerifyParams {
    pub secret: String,
    pub code: String,
    #[serde(default = "default_digits")]
    pub digits: u32,
    #[serde(default = "default_period")]
    pub period: u64,
    #[serde(default = "default_window")]
    pub window: i64,
    #[serde(rename = "currentTime")]
    pub current_time: Option<u64>,
}

fn default_window() -> i64 { 1 }

#[derive(Debug, Serialize)]
pub struct VerifyResult {
    pub valid: bool,
    #[serde(rename = "matchedStep")]
    pub matched_step: Option<i64>,
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct UriParams {
    pub secret: String,
    pub account: String,
    pub issuer: String,
    #[serde(default = "default_digits")]
    pub digits: u32,
    #[serde(default = "default_period")]
    pub period: u64,
}

#[derive(Debug, Serialize)]
pub struct UriResult {
    pub uri: String,
    pub secret: String,
    pub account: String,
    pub issuer: String,
}

pub fn generate_totp(params: &TotpParams) -> Result<TotpResult, String> {
    let secret_bytes = base32_decode(&params.secret)?;
    if secret_bytes.is_empty() {
        return Err("Secret 密钥解码后为空".to_string());
    }

    let now = params.current_time.unwrap_or(1771900000);
    let period = if params.period == 0 { 30 } else { params.period };
    let counter = now / period;
    let remaining = period - (now % period);
    let valid_until = now + remaining;

    let code = generate_hotp(&secret_bytes, counter, params.digits);

    Ok(TotpResult {
        code,
        counter,
        remaining_seconds: remaining,
        period_seconds: period,
        digits: params.digits,
        algorithm: "SHA1".to_string(),
        valid_until,
    })
}

pub fn verify_totp(params: &VerifyParams) -> Result<VerifyResult, String> {
    let secret_bytes = base32_decode(&params.secret)?;
    if secret_bytes.is_empty() {
        return Err("Secret 密钥解码后为空".to_string());
    }

    let now = params.current_time.unwrap_or(1771900000);
    let period = if params.period == 0 { 30 } else { params.period };
    let current_counter = (now / period) as i64;
    let expected_code = params.code.trim();

    for offset in -params.window..=params.window {
        let test_counter = current_counter + offset;
        if test_counter >= 0 {
            let gen = generate_hotp(&secret_bytes, test_counter as u64, params.digits);
            if gen == expected_code {
                return Ok(VerifyResult {
                    valid: true,
                    matched_step: Some(offset),
                    message: format!("验证通过（时间步偏移: {}）", offset),
                });
            }
        }
    }

    Ok(VerifyResult {
        valid: false,
        matched_step: None,
        message: "验证码不匹配或已过期".to_string(),
    })
}

#[derive(Debug, Serialize)]
pub struct OtpPreset {
    pub id: &'static str,
    pub name: &'static str,
    pub description: &'static str,
    pub secret: &'static str,
    pub digits: u32,
    pub period: u64,
}

pub fn get_presets() -> Vec<OtpPreset> {
    vec![
        OtpPreset {
            id: "standard-google",
            name: "Google Authenticator 标准",
            description: "经典 6 位 30 秒步长 TOTP",
            secret: "JBSWY3DPEHPK3PXP",
            digits: 6,
            period: 30,
        },
        OtpPreset {
            id: "rfc6238-vector",
            name: "RFC 6238 标准测试向量",
            description: "8 位 30 秒官方参考令牌",
            secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
            digits: 8,
            period: 30,
        },
        OtpPreset {
            id: "devops-admin",
            name: "运维高安全口令 (60s)",
            description: "6 位 60 秒长周期双因子口令",
            secret: "MZXW633PN5XW6MZX",
            digits: 6,
            period: 60,
        },
    ]
}

// Universal Request/Response Envelope
#[derive(Debug, Deserialize)]
struct RequestEnvelope {
    action: String,
    #[serde(rename = "requestId")]
    request_id: Option<String>,
    #[serde(default)]
    params: serde_json::Value,
}

#[derive(Debug, Serialize)]
struct ResponseEnvelope<T> {
    code: i32,
    msg: String,
    #[serde(rename = "requestId")]
    request_id: String,
    data: Option<T>,
}

// Universal C-ABI
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
    let slice = slice::from_raw_parts(ptr, len);

    let req: RequestEnvelope = match serde_json::from_slice(slice) {
        Ok(v) => v,
        Err(e) => {
            let err_res = ResponseEnvelope::<()> {
                code: 400,
                msg: format!("Invalid JSON request: {}", e),
                request_id: "".to_string(),
                data: None,
            };
            let json = serde_json::to_string(&err_res).unwrap_or_else(|_| "{}".to_string());
            return return_str(&json);
        }
    };

    let req_id = req.request_id.unwrap_or_default();

    let json_resp = match req.action.as_str() {
        "otp/totp" | "otp/generate" => {
            let params: TotpParams = match serde_json::from_value(req.params) {
                Ok(p) => p,
                Err(e) => {
                    let err_res = ResponseEnvelope::<()> {
                        code: 400,
                        msg: format!("参数解析失败: {}", e),
                        request_id: req_id,
                        data: None,
                    };
                    return return_str(&serde_json::to_string(&err_res).unwrap());
                }
            };

            match generate_totp(&params) {
                Ok(res) => serde_json::to_string(&ResponseEnvelope {
                    code: 0,
                    msg: "ok".to_string(),
                    request_id: req_id,
                    data: Some(res),
                }),
                Err(err) => serde_json::to_string(&ResponseEnvelope::<()> {
                    code: 400,
                    msg: err,
                    request_id: req_id,
                    data: None,
                }),
            }
        }
        "otp/hotp" => {
            let params: HotpParams = match serde_json::from_value(req.params) {
                Ok(p) => p,
                Err(e) => {
                    let err_res = ResponseEnvelope::<()> {
                        code: 400,
                        msg: format!("参数解析失败: {}", e),
                        request_id: req_id,
                        data: None,
                    };
                    return return_str(&serde_json::to_string(&err_res).unwrap());
                }
            };

            match base32_decode(&params.secret) {
                Ok(secret_bytes) => {
                    let code = generate_hotp(&secret_bytes, params.counter, params.digits);
                    serde_json::to_string(&ResponseEnvelope {
                        code: 0,
                        msg: "ok".to_string(),
                        request_id: req_id,
                        data: Some(HotpResult {
                            code,
                            counter: params.counter,
                            digits: params.digits,
                            algorithm: "SHA1".to_string(),
                        }),
                    })
                }
                Err(e) => serde_json::to_string(&ResponseEnvelope::<()> {
                    code: 400,
                    msg: e,
                    request_id: req_id,
                    data: None,
                }),
            }
        }
        "otp/verify" => {
            let params: VerifyParams = match serde_json::from_value(req.params) {
                Ok(p) => p,
                Err(e) => {
                    let err_res = ResponseEnvelope::<()> {
                        code: 400,
                        msg: format!("参数解析失败: {}", e),
                        request_id: req_id,
                        data: None,
                    };
                    return return_str(&serde_json::to_string(&err_res).unwrap());
                }
            };

            match verify_totp(&params) {
                Ok(res) => serde_json::to_string(&ResponseEnvelope {
                    code: 0,
                    msg: "ok".to_string(),
                    request_id: req_id,
                    data: Some(res),
                }),
                Err(err) => serde_json::to_string(&ResponseEnvelope::<()> {
                    code: 400,
                    msg: err,
                    request_id: req_id,
                    data: None,
                }),
            }
        }
        "otp/uri" => {
            let params: UriParams = match serde_json::from_value(req.params) {
                Ok(p) => p,
                Err(e) => {
                    let err_res = ResponseEnvelope::<()> {
                        code: 400,
                        msg: format!("参数解析失败: {}", e),
                        request_id: req_id,
                        data: None,
                    };
                    return return_str(&serde_json::to_string(&err_res).unwrap());
                }
            };

            let clean_secret = params.secret.replace(' ', "").to_ascii_uppercase();
            let uri = format!(
                "otpauth://totp/{}:{}?secret={}&issuer={}&algorithm=SHA1&digits={}&period={}",
                params.issuer, params.account, clean_secret, params.issuer, params.digits, params.period
            );

            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(UriResult {
                    uri,
                    secret: clean_secret,
                    account: params.account,
                    issuer: params.issuer,
                }),
            })
        }
        "otp/presets" => {
            let presets = get_presets();
            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(presets),
            })
        }
        other => serde_json::to_string(&ResponseEnvelope::<()> {
            code: 404,
            msg: format!("Unsupported action: {}", other),
            request_id: req_id,
            data: None,
        }),
    }
    .unwrap_or_else(|e| format!("{{\"code\":500,\"msg\":\"{}\",\"request_id\":\"{}\"}}", e, ""));

    return_str(&json_resp)
}

unsafe fn return_str(s: &str) -> u64 {
    let bytes = s.as_bytes();
    let out_len = bytes.len();
    let out_ptr = alloc(out_len);
    core::ptr::copy_nonoverlapping(bytes.as_ptr(), out_ptr, out_len);
    ((out_ptr as u64) << 32) | (out_len as u64 & 0xffffffff)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rfc4226_test_vectors() {
        // RFC 4226 Appendix D test vectors
        // Secret: "12345678901234567890" ASCII
        let secret = b"12345678901234567890";
        let expected = [
            "755224", "287082", "359152", "969429", "338314",
            "254676", "287922", "162583", "399871", "520489",
        ];

        for (i, &exp) in expected.iter().enumerate() {
            let code = generate_hotp(secret, i as u64, 6);
            assert_eq!(code, exp, "HOTP vector mismatch at counter {}", i);
        }
    }

    #[test]
    fn test_base32_and_totp() {
        let params = TotpParams {
            secret: "JBSWY3DPEHPK3PXP".to_string(),
            digits: 6,
            period: 30,
            current_time: Some(1700000000),
        };
        let res = generate_totp(&params).unwrap();
        assert_eq!(res.digits, 6);
        assert_eq!(res.code.len(), 6);
    }
}
