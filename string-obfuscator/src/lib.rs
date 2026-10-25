extern crate alloc;

use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec;
use alloc::vec::Vec;
use core::slice;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct DetectionItem {
    pub kind: String,
    pub original: String,
    pub masked: String,
    pub line: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SanitizeResult {
    #[serde(rename = "sanitizedText")]
    pub sanitized_text: String,
    #[serde(rename = "redactionsCount")]
    pub redactions_count: usize,
    pub detections: Vec<DetectionItem>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MaskResult {
    #[serde(rename = "maskedText")]
    pub masked_text: String,
    #[serde(rename = "originalLength")]
    pub original_length: usize,
    pub strategy: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TransformResult {
    pub result: String,
    pub mode: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PresetSample {
    pub id: String,
    pub name: String,
    pub text: String,
}

pub fn mask_email(email: &str, mask_char: char) -> String {
    let email = email.trim();
    if let Some(at_idx) = email.find('@') {
        let (local, domain) = email.split_at(at_idx);
        let domain = &domain[1..]; // skip '@'
        let masked_local = if local.len() <= 2 {
            format!("{}{}", local.chars().next().unwrap_or(mask_char), mask_char)
        } else {
            let first = local.chars().next().unwrap();
            let last = local.chars().last().unwrap();
            let stars: String = (0..(local.len() - 2).max(3)).map(|_| mask_char).collect();
            format!("{}{}{}", first, stars, last)
        };
        format!("{}@{}", masked_local, domain)
    } else {
        mask_custom(email, 1, 1, mask_char)
    }
}

pub fn mask_phone(phone: &str, mask_char: char) -> String {
    let digits: Vec<(usize, char)> = phone
        .char_indices()
        .filter(|(_, c)| c.is_ascii_digit())
        .collect();
    if digits.len() < 7 {
        return mask_custom(phone, 2, 2, mask_char);
    }

    let mask_start = if phone.trim().starts_with('+') && digits.len() >= 11 {
        4
    } else if digits.len() >= 11 {
        3
    } else {
        2
    };
    let mask_end = digits.len().saturating_sub(4);

    let mut result = String::with_capacity(phone.len());
    let mut digit_idx = 0;
    for c in phone.chars() {
        if c.is_ascii_digit() {
            if digit_idx >= mask_start && digit_idx < mask_end {
                result.push(mask_char);
            } else {
                result.push(c);
            }
            digit_idx += 1;
        } else {
            result.push(c);
        }
    }
    result
}

pub fn mask_credit_card(card: &str, mask_char: char) -> String {
    let digits: Vec<(usize, char)> = card
        .char_indices()
        .filter(|(_, c)| c.is_ascii_digit())
        .collect();
    if digits.len() < 12 {
        return mask_custom(card, 4, 4, mask_char);
    }

    let mask_start = 4;
    let mask_end = digits.len().saturating_sub(4);

    let mut result = String::with_capacity(card.len());
    let mut digit_idx = 0;
    for c in card.chars() {
        if c.is_ascii_digit() {
            if digit_idx >= mask_start && digit_idx < mask_end {
                result.push(mask_char);
            } else {
                result.push(c);
            }
            digit_idx += 1;
        } else {
            result.push(c);
        }
    }
    result
}

pub fn mask_api_key(key: &str, mask_char: char) -> String {
    let key = key.trim();
    if key.len() <= 8 {
        return (0..key.len()).map(|_| mask_char).collect();
    }
    let prefix_len = if key.contains('_') {
        key.find('_').unwrap() + 3
    } else {
        4
    }
    .min(key.len().saturating_sub(4));

    let suffix_len = 4;
    let prefix: String = key.chars().take(prefix_len).collect();
    let suffix: String = key.chars().skip(key.len() - suffix_len).collect();
    format!("{}{}...{}", prefix, (0..4).map(|_| mask_char).collect::<String>(), suffix)
}

pub fn mask_ssn(ssn: &str, mask_char: char) -> String {
    let digits: Vec<char> = ssn.chars().filter(|c| c.is_ascii_digit()).collect();
    if digits.len() == 9 {
        format!("{}{}{}-{}{}-{}", mask_char, mask_char, mask_char, mask_char, mask_char, &ssn[ssn.len() - 4..])
    } else {
        mask_custom(ssn, 0, 4, mask_char)
    }
}

pub fn mask_custom(text: &str, keep_prefix: usize, keep_suffix: usize, mask_char: char) -> String {
    let chars: Vec<char> = text.chars().collect();
    let len = chars.len();
    if len <= keep_prefix + keep_suffix {
        return (0..len).map(|_| mask_char).collect();
    }

    let mut res = String::with_capacity(len);
    for (i, &c) in chars.iter().enumerate() {
        if i < keep_prefix || i >= len - keep_suffix {
            res.push(c);
        } else {
            res.push(mask_char);
        }
    }
    res
}

pub fn to_leet_speak(text: &str) -> String {
    text.chars()
        .map(|c| match c {
            'a' | 'A' => '4',
            'b' | 'B' => '8',
            'e' | 'E' => '3',
            'g' | 'G' => '6',
            'i' | 'I' => '1',
            'o' | 'O' => '0',
            's' | 'S' => '5',
            't' | 'T' => '7',
            'z' | 'Z' => '2',
            other => other,
        })
        .collect()
}

pub fn to_rot13(text: &str) -> String {
    text.chars()
        .map(|c| match c {
            'a'..='m' | 'A'..='M' => ((c as u8) + 13) as char,
            'n'..='z' | 'N'..='Z' => ((c as u8) - 13) as char,
            other => other,
        })
        .collect()
}

pub fn to_hex(text: &str) -> String {
    let mut s = String::with_capacity(text.len() * 3);
    for b in text.as_bytes() {
        s.push_str(&format!("\\x{:02x}", b));
    }
    s
}

pub fn to_unicode_escape(text: &str) -> String {
    let mut s = String::with_capacity(text.len() * 6);
    for c in text.chars() {
        if c.is_ascii_alphanumeric() {
            s.push(c);
        } else {
            s.push_str(&format!("\\u{{{:x}}}", c as u32));
        }
    }
    s
}

pub fn to_zero_width_injected(text: &str) -> String {
    // Inject zero-width spaces (U+200B) between characters to break scrapers
    let mut s = String::with_capacity(text.len() * 4);
    for (i, c) in text.chars().enumerate() {
        s.push(c);
        if i + 1 < text.len() {
            s.push('\u{200B}');
        }
    }
    s
}

pub fn sanitize_log(log_text: &str, mask_char: char) -> SanitizeResult {
    let mut detections = Vec::new();
    let mut sanitized_lines = Vec::new();

    for (line_idx, line) in log_text.lines().enumerate() {
        let line_num = line_idx + 1;
        let mut cur_line = line.to_string();

        // 1. Detect and mask emails
        let email_candidates: Vec<String> = cur_line.split_whitespace().map(|s| s.to_string()).collect();
        for w in email_candidates {
            let clean_w = w.trim_matches(|c: char| !c.is_alphanumeric() && c != '@' && c != '.' && c != '-' && c != '_');
            if clean_w.contains('@') && clean_w.contains('.') && clean_w.len() >= 6 {
                let parts: Vec<&str> = clean_w.split('@').collect();
                if parts.len() == 2 && !parts[0].is_empty() && parts[1].contains('.') {
                    let masked = mask_email(clean_w, mask_char);
                    if masked != clean_w {
                        detections.push(DetectionItem {
                            kind: "email".to_string(),
                            original: clean_w.to_string(),
                            masked: masked.clone(),
                            line: line_num,
                        });
                        cur_line = cur_line.replace(clean_w, &masked);
                    }
                }
            }
        }

        // 2. Detect API tokens (Bearer <token>, sk_live_..., key=...)
        if let Some(bearer_pos) = cur_line.to_lowercase().find("bearer ") {
            let token_sub = cur_line[bearer_pos + 7..].to_string();
            let token_end = token_sub.find(|c: char| c.is_whitespace() || c == '"' || c == '\'').unwrap_or(token_sub.len());
            let token = token_sub[..token_end].to_string();
            if token.len() >= 10 {
                let masked = mask_api_key(&token, mask_char);
                detections.push(DetectionItem {
                    kind: "api-key (Bearer)".to_string(),
                    original: token.clone(),
                    masked: masked.clone(),
                    line: line_num,
                });
                cur_line = cur_line.replace(&token, &masked);
            }
        }

        // sk_live or sk_test tokens
        for prefix in ["sk_live_", "sk_test_", "ghp_", "xoxb-"] {
            if let Some(pos) = cur_line.find(prefix) {
                let sub = cur_line[pos..].to_string();
                let end = sub.find(|c: char| c.is_whitespace() || c == '"' || c == '\'' || c == ',').unwrap_or(sub.len());
                let token = sub[..end].to_string();
                if token.len() >= 12 {
                    let masked = mask_api_key(&token, mask_char);
                    detections.push(DetectionItem {
                        kind: format!("secret-token ({})", prefix),
                        original: token.clone(),
                        masked: masked.clone(),
                        line: line_num,
                    });
                    cur_line = cur_line.replace(&token, &masked);
                }
            }
        }

        // 3. Detect 16-digit credit cards (with optional spaces or dashes)
        let card_candidates: Vec<String> = cur_line.split(|c: char| c == ',' || c == '"' || c == '\'' || c == ':').map(|s| s.to_string()).collect();
        for w in card_candidates {
            let trimmed = w.trim();
            let digits_only: String = trimmed.chars().filter(|c| c.is_ascii_digit()).collect();
            if digits_only.len() == 16 && (digits_only.starts_with('4') || digits_only.starts_with('5') || digits_only.starts_with('3')) {
                let masked = mask_credit_card(trimmed, mask_char);
                detections.push(DetectionItem {
                    kind: "credit-card".to_string(),
                    original: trimmed.to_string(),
                    masked: masked.clone(),
                    line: line_num,
                });
                cur_line = cur_line.replace(trimmed, &masked);
            }
        }

        sanitized_lines.push(cur_line);
    }

    SanitizeResult {
        sanitized_text: sanitized_lines.join("\n"),
        redactions_count: detections.len(),
        detections,
    }
}

pub fn get_samples() -> Vec<PresetSample> {
    vec![
        PresetSample {
            id: "api-access-log".to_string(),
            name: "生产环境 API 访问日志 (Server Access Log)".to_string(),
            text: "2026-10-25T14:20:11Z [INFO] Auth request from user alice.wonderland@techcorp.io with token Bearer sk_live_89437298417298374921\n2026-10-25T14:20:12Z [INFO] Payment checkout initiated: card 4532 9821 3456 9012, phone +86 13800138000\n2026-10-25T14:20:13Z [DEBUG] Webhook triggered with secret ghp_912384918237498237491823749218".to_string(),
        },
        PresetSample {
            id: "customer-pii".to_string(),
            name: "客户工单 PII 敏感信息 (Customer PII Record)".to_string(),
            text: "Customer: Robert Davis\nEmail: robert.davis@securemail.com\nMobile: 13912345678\nBilling Card: 5412751234567890\nSSN: 123-45-6789".to_string(),
        },
        PresetSample {
            id: "social-leet".to_string(),
            name: "黑客文化与混淆文本 (Leet & Obfuscation)".to_string(),
            text: "WebAssembly is blazing fast and standalone without javascript glue!".to_string(),
        },
    ]
}

// Universal Envelope
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
        "obfuscate/mask" => {
            let text = req.params.get("text").and_then(|v| v.as_str()).unwrap_or("");
            let strategy = req.params.get("strategy").and_then(|v| v.as_str()).unwrap_or("email");
            let mask_char = req.params.get("maskChar").and_then(|v| v.as_str()).and_then(|s| s.chars().next()).unwrap_or('*');
            let prefix = req.params.get("unmaskedPrefix").and_then(|v| v.as_u64()).unwrap_or(2) as usize;
            let suffix = req.params.get("unmaskedSuffix").and_then(|v| v.as_u64()).unwrap_or(2) as usize;

            let masked = match strategy {
                "email" => mask_email(text, mask_char),
                "phone" => mask_phone(text, mask_char),
                "credit-card" | "card" => mask_credit_card(text, mask_char),
                "api-key" | "token" => mask_api_key(text, mask_char),
                "ssn" => mask_ssn(text, mask_char),
                _ => mask_custom(text, prefix, suffix, mask_char),
            };

            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(MaskResult {
                    masked_text: masked,
                    original_length: text.len(),
                    strategy: strategy.to_string(),
                }),
            })
        }
        "obfuscate/transform" => {
            let text = req.params.get("text").and_then(|v| v.as_str()).unwrap_or("");
            let mode = req.params.get("mode").and_then(|v| v.as_str()).unwrap_or("leet");

            let result = match mode {
                "leet" => to_leet_speak(text),
                "rot13" => to_rot13(text),
                "reverse" => text.chars().rev().collect(),
                "hex" => to_hex(text),
                "unicode-escape" => to_unicode_escape(text),
                "zero-width" => to_zero_width_injected(text),
                _ => text.to_string(),
            };

            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(TransformResult {
                    result,
                    mode: mode.to_string(),
                }),
            })
        }
        "obfuscate/sanitize-log" | "obfuscate/sanitize" => {
            let text = req.params.get("text").and_then(|v| v.as_str()).unwrap_or("");
            let mask_char = req.params.get("maskChar").and_then(|v| v.as_str()).and_then(|s| s.chars().next()).unwrap_or('*');
            let res = sanitize_log(text, mask_char);

            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(res),
            })
        }
        "obfuscate/samples" => {
            let samples = get_samples();
            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(samples),
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
    fn test_mask_email() {
        assert_eq!(mask_email("john.doe@example.com", '*'), "j******e@example.com");
        assert_eq!(mask_email("a@b.com", '*'), "a*@b.com");
    }

    #[test]
    fn test_mask_phone() {
        assert_eq!(mask_phone("13812345678", '*'), "138****5678");
        assert_eq!(mask_phone("+1 555-123-4567", '*'), "+1 555-***-4567");
    }

    #[test]
    fn test_mask_card() {
        assert_eq!(mask_credit_card("4532 1234 5678 9012", '*'), "4532 **** **** 9012");
    }

    #[test]
    fn test_transforms() {
        assert_eq!(to_leet_speak("elite"), "3l173");
        assert_eq!(to_rot13("hello"), "uryyb");
        assert_eq!(to_rot13("uryyb"), "hello");
    }

    #[test]
    fn test_sanitize_log() {
        let log = "User alex@company.com logged in with token Bearer sk_live_secret1234567890\nCard 4532 1111 2222 3333 used.";
        let res = sanitize_log(log, '*');
        assert!(res.redactions_count >= 2);
        assert!(!res.sanitized_text.contains("alex@company.com"));
        assert!(!res.sanitized_text.contains("sk_live_secret1234567890"));
    }
}
