//! # Password Strength Evaluator & Entropy Analyzer WASM Module
//!
//! Standard C-ABI Envelope Protocol module for evaluating password entropy,
//! estimating crack times against brute-force & GPU dictionary attacks,
//! and calculating security scores (0 to 4).

use std::slice;
use serde::{Deserialize, Serialize};

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
pub struct PasswordAnalyzeParams {
    pub password: Option<String>,
    #[serde(rename = "userInputs", default)]
    pub user_inputs: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct CharsetInfo {
    #[serde(rename = "hasLower")]
    pub has_lower: bool,
    #[serde(rename = "hasUpper")]
    pub has_upper: bool,
    #[serde(rename = "hasDigits")]
    pub has_digits: bool,
    #[serde(rename = "hasSymbols")]
    pub has_symbols: bool,
    #[serde(rename = "poolSize")]
    pub pool_size: usize,
}

#[derive(Debug, Serialize)]
pub struct CrackTimes {
    #[serde(rename = "online100PerSec")]
    pub online_100_per_sec: String,
    #[serde(rename = "offlineSlowHash10kPerSec")]
    pub offline_slow_hash_10k_per_sec: String,
    #[serde(rename = "offlineFastHash10GPerSec")]
    pub offline_fast_hash_10g_per_sec: String,
}

#[derive(Debug, Serialize)]
pub struct PasswordAnalyzeData {
    pub password: String,
    #[serde(rename = "passwordLength")]
    pub password_length: usize,
    pub score: u8,
    #[serde(rename = "scoreText")]
    pub score_text: String,
    #[serde(rename = "entropyBits")]
    pub entropy_bits: f64,
    pub charsets: CharsetInfo,
    #[serde(rename = "crackTimes")]
    pub crack_times: CrackTimes,
    #[serde(rename = "warning", skip_serializing_if = "Option::is_none")]
    pub warning: Option<String>,
    pub suggestions: Vec<String>,
}

// ============================================================================
// Core Analysis Logic
// ============================================================================

const COMMON_WEAK_PASSWORDS: &[&str] = &[
    "password", "123456", "12345678", "123456789", "12345", "1234", "111111",
    "qwerty", "admin", "welcome", "login", "root", "toor", "pass", "abc123",
    "monkey", "dragon", "master", "sunshine", "princess", "football", "shadow",
    "superman", "batman", "letmein", "default", "changeme", "iloveyou", "trustno1"
];

fn normalize_leet(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        let n = match c {
            '@' | '4' => 'a',
            '8' => 'b',
            '3' => 'e',
            '1' | '!' | '|' => 'i',
            '0' => 'o',
            '5' | '$' => 's',
            '7' | '+' => 't',
            other => other.to_ascii_lowercase(),
        };
        out.push(n);
    }
    out
}

fn format_duration(seconds: f64) -> String {
    if seconds < 0.001 {
        return "< 1 millisecond".to_string();
    } else if seconds < 1.0 {
        return format!("{:.0} ms", seconds * 1000.0);
    } else if seconds < 60.0 {
        return format!("{:.1} seconds", seconds);
    } else if seconds < 3600.0 {
        return format!("{:.1} minutes", seconds / 60.0);
    } else if seconds < 86400.0 {
        return format!("{:.1} hours", seconds / 3600.0);
    } else if seconds < 86400.0 * 30.0 {
        return format!("{:.1} days", seconds / 86400.0);
    } else if seconds < 86400.0 * 365.25 {
        return format!("{:.1} months", seconds / (86400.0 * 30.44));
    } else if seconds < 86400.0 * 365.25 * 100.0 {
        return format!("{:.1} years", seconds / (86400.0 * 365.25));
    } else if seconds < 86400.0 * 365.25 * 10000.0 {
        return format!("{:.1} centuries", seconds / (86400.0 * 365.25 * 100.0));
    } else if seconds < 86400.0 * 365.25 * 1_000_000.0 {
        return format!("{:.1} millennia", seconds / (86400.0 * 365.25 * 1000.0));
    } else {
        return "centuries of centuries".to_string();
    }
}

pub fn analyze_password(password: &str, user_inputs: &[String]) -> PasswordAnalyzeData {
    let password_length = password.chars().count();
    let lower_pwd = password.to_ascii_lowercase();
    let leet_pwd = normalize_leet(password);

    let mut has_lower = false;
    let mut has_upper = false;
    let mut has_digits = false;
    let mut has_symbols = false;

    for c in password.chars() {
        if c.is_ascii_lowercase() {
            has_lower = true;
        } else if c.is_ascii_uppercase() {
            has_upper = true;
        } else if c.is_ascii_digit() {
            has_digits = true;
        } else {
            has_symbols = true;
        }
    }

    let mut pool_size = 0usize;
    if has_lower { pool_size += 26; }
    if has_upper { pool_size += 26; }
    if has_digits { pool_size += 10; }
    if has_symbols { pool_size += 33; }

    let mut warnings = Vec::new();
    let mut suggestions = Vec::new();

    // 1. 弱口令直接匹配
    let mut is_common = false;
    for &common in COMMON_WEAK_PASSWORDS {
        if lower_pwd == common || leet_pwd == common {
            is_common = true;
            warnings.push(format!("This password matches a known frequently breached password ('{}')", common));
            break;
        }
        if lower_pwd.contains(common) && common.len() >= 4 {
            warnings.push(format!("Contains common dictionary word '{}'", common));
        }
    }

    // 2. 自定义用户信息匹配（如用户名、域名、邮箱前缀）
    for input in user_inputs {
        let clean = input.trim().to_ascii_lowercase();
        if clean.len() >= 3 && lower_pwd.contains(&clean) {
            warnings.push(format!("Contains personal information ('{}')", clean));
        }
    }

    // 3. 重复字符与序列检测
    let chars: Vec<char> = password.chars().collect();
    let mut all_same = true;
    for i in 1..chars.len() {
        if chars[i] != chars[0] {
            all_same = false;
            break;
        }
    }
    if chars.len() > 2 && all_same {
        warnings.push("Repeats the same character repeatedly".to_string());
    }

    // 4. 连续数字序列 (e.g. 12345, 98765)
    if lower_pwd.contains("1234") || lower_pwd.contains("abcd") || lower_pwd.contains("qwerty") {
        warnings.push("Contains common keyboard or alphanumeric sequence".to_string());
    }

    // 5. 理论香农密码熵计算 (Bits)
    let raw_entropy = if pool_size > 0 && password_length > 0 {
        (password_length as f64) * (pool_size as f64).log2()
    } else {
        0.0
    };

    // 扣除惩罚熵 (Penalties)
    let mut penalty = 0.0;
    if is_common {
        penalty += 40.0;
    }
    if all_same {
        penalty += raw_entropy * 0.7;
    }
    if !has_lower && !has_upper {
        penalty += 5.0;
    }
    if !has_digits {
        suggestions.push("Add digits (0-9) to increase complexity".to_string());
    }
    if !has_symbols {
        suggestions.push("Add special symbols (!@#$%^&*) to significantly expand entropy".to_string());
    }
    if !has_upper {
        suggestions.push("Mix in uppercase letters for case diversity".to_string());
    }
    if password_length < 8 {
        suggestions.push("Increase password length to at least 12-16 characters".to_string());
    }

    let entropy_bits = (raw_entropy - penalty).max(0.0);

    // 6. 分级评分 (0..4)
    let (score, score_text) = if password_length == 0 || is_common || entropy_bits < 28.0 {
        (0, "Very Weak")
    } else if entropy_bits < 36.0 {
        (1, "Weak")
    } else if entropy_bits < 60.0 {
        (2, "Medium")
    } else if entropy_bits < 80.0 {
        (3, "Strong")
    } else {
        (4, "Very Strong")
    };

    if score >= 3 && suggestions.is_empty() {
        suggestions.push("Strong password! Your credentials are resilient against brute-force attacks.".to_string());
    }

    // 7. 暴力破解时间推算
    // 假设攻击者测试候选空间: 2^entropy_bits
    let guesses = 2.0_f64.powf(entropy_bits.min(128.0));
    let t_online = guesses / 100.0; // 100 req/sec (在线暴力限制)
    let t_slow = guesses / 10_000.0; // 10,000 hashes/sec (Bcrypt / Argon2)
    let t_fast = guesses / 10_000_000_000.0; // 10 Giga-hashes/sec (离线 MD5/SHA256 GPU集群)

    let crack_times = CrackTimes {
        online_100_per_sec: format_duration(t_online),
        offline_slow_hash_10k_per_sec: format_duration(t_slow),
        offline_fast_hash_10g_per_sec: format_duration(t_fast),
    };

    let warning = if warnings.is_empty() {
        None
    } else {
        Some(warnings.join("; "))
    };

    PasswordAnalyzeData {
        password: password.to_string(),
        password_length,
        score,
        score_text: score_text.to_string(),
        entropy_bits,
        charsets: CharsetInfo {
            has_lower,
            has_upper,
            has_digits,
            has_symbols,
            pool_size,
        },
        crack_times,
        warning,
        suggestions,
    }
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
        "password/analyze" => {
            let params: PasswordAnalyzeParams = match serde_json::from_value(req.params) {
                Ok(p) => p,
                Err(e) => return pack_error(400, &format!("Invalid params for password/analyze: {}", e), req_id),
            };
            let password = params.password.unwrap_or_default();
            let data = analyze_password(&password, &params.user_inputs);
            pack_success(data, req_id)
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
    fn test_weak_password() {
        let res = analyze_password("123456", &[]);
        assert_eq!(res.score, 0);
        assert!(res.warning.is_some());
    }

    #[test]
    fn test_strong_password() {
        let res = analyze_password("X8#mK9$qL2!vP5*y", &[]);
        assert_eq!(res.score, 4);
        assert_eq!(res.score_text, "Very Strong");
        assert!(res.entropy_bits > 80.0);
    }
}
