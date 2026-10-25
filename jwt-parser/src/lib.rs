extern crate alloc;

use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec;
use alloc::vec::Vec;
use core::slice;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct ParseParams {
    pub token: String,
    #[serde(rename = "currentTime")]
    pub current_time: Option<u64>,
}

#[derive(Debug, Serialize)]
pub struct ClaimAudit {
    pub name: String,
    pub value: serde_json::Value,
    pub description: String,
    pub status: String, // "valid" | "expired" | "not_yet_valid" | "info"
}

#[derive(Debug, Serialize)]
pub struct JwtAnalysis {
    pub header: serde_json::Value,
    pub payload: serde_json::Value,
    pub signature: String,
    pub algorithm: String,
    #[serde(rename = "tokenType")]
    pub token_type: String,
    #[serde(rename = "isExpired")]
    pub is_expired: Option<bool>,
    #[serde(rename = "isValidTime")]
    pub is_valid_time: Option<bool>,
    pub claims: Vec<ClaimAudit>,
    #[serde(rename = "formattedHeader")]
    pub formatted_header: String,
    #[serde(rename = "formattedPayload")]
    pub formatted_payload: String,
}

fn decode_base64_char(c: u8) -> Option<u8> {
    match c {
        b'A'..=b'Z' => Some(c - b'A'),
        b'a'..=b'z' => Some(c - b'a' + 26),
        b'0'..=b'9' => Some(c - b'0' + 52),
        b'+' => Some(62),
        b'/' => Some(63),
        _ => None,
    }
}

pub fn base64url_decode(input: &str) -> Result<Vec<u8>, String> {
    let mut normalized = input.trim().replace('-', "+").replace('_', "/");
    while normalized.len() % 4 != 0 {
        normalized.push('=');
    }

    let bytes = normalized.as_bytes();
    let mut out = Vec::with_capacity(bytes.len() * 3 / 4);

    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'=' {
            break;
        }

        let b0 = decode_base64_char(bytes[i]).ok_or_else(|| format!("Invalid char at {}", i))?;
        let b1 = decode_base64_char(bytes[i + 1]).ok_or_else(|| format!("Invalid char at {}", i + 1))?;
        out.push((b0 << 2) | (b1 >> 4));

        if bytes[i + 2] != b'=' {
            let b2 = decode_base64_char(bytes[i + 2]).ok_or_else(|| format!("Invalid char at {}", i + 2))?;
            out.push(((b1 & 0x0f) << 4) | (b2 >> 2));

            if bytes[i + 3] != b'=' {
                let b3 = decode_base64_char(bytes[i + 3]).ok_or_else(|| format!("Invalid char at {}", i + 3))?;
                out.push(((b2 & 0x03) << 6) | b3);
            }
        }
        i += 4;
    }

    Ok(out)
}

fn format_unix_timestamp(ts: u64) -> String {
    // Basic human-readable timestamp converter (UTC approximate or seconds representation)
    format!("{} (Unix 秒级时间戳)", ts)
}

pub fn parse_jwt(token: &str, current_time: Option<u64>) -> Result<JwtAnalysis, String> {
    let parts: Vec<&str> = token.trim().split('.').collect();
    if parts.len() != 3 {
        return Err(format!("JWT 格式错误：期望 3 段（header.payload.signature），实际得到 {} 段", parts.len()));
    }

    let header_bytes = base64url_decode(parts[0]).map_err(|e| format!("Header Base64URL 解码失败: {}", e))?;
    let payload_bytes = base64url_decode(parts[1]).map_err(|e| format!("Payload Base64URL 解码失败: {}", e))?;

    let header: serde_json::Value = serde_json::from_slice(&header_bytes).map_err(|e| format!("Header JSON 解析失败: {}", e))?;
    let payload: serde_json::Value = serde_json::from_slice(&payload_bytes).map_err(|e| format!("Payload JSON 解析失败: {}", e))?;

    let algorithm = header.get("alg").and_then(|v| v.as_str()).unwrap_or("none").to_string();
    let token_type = header.get("typ").and_then(|v| v.as_str()).unwrap_or("JWT").to_string();

    let now = current_time.unwrap_or(1771900000); // default reference timestamp ~2026

    let mut claims = Vec::new();
    let mut is_expired = None;
    let mut is_valid_time = Some(true);

    if let serde_json::Value::Object(ref map) = payload {
        if let Some(exp_val) = map.get("exp").and_then(|v| v.as_u64()) {
            let expired = now > exp_val;
            is_expired = Some(expired);
            if expired {
                is_valid_time = Some(false);
            }
            claims.push(ClaimAudit {
                name: "exp (过期时间)".to_string(),
                value: serde_json::Value::from(exp_val),
                description: format_unix_timestamp(exp_val),
                status: if expired { "expired".to_string() } else { "valid".to_string() },
            });
        }

        if let Some(nbf_val) = map.get("nbf").and_then(|v| v.as_u64()) {
            let not_yet = now < nbf_val;
            if not_yet {
                is_valid_time = Some(false);
            }
            claims.push(ClaimAudit {
                name: "nbf (生效起始时间)".to_string(),
                value: serde_json::Value::from(nbf_val),
                description: format_unix_timestamp(nbf_val),
                status: if not_yet { "not_yet_valid".to_string() } else { "valid".to_string() },
            });
        }

        if let Some(iat_val) = map.get("iat").and_then(|v| v.as_u64()) {
            claims.push(ClaimAudit {
                name: "iat (签发时间)".to_string(),
                value: serde_json::Value::from(iat_val),
                description: format_unix_timestamp(iat_val),
                status: "info".to_string(),
            });
        }

        if let Some(iss_val) = map.get("iss") {
            claims.push(ClaimAudit {
                name: "iss (签发者 Issuer)".to_string(),
                value: iss_val.clone(),
                description: "标识签发该 JWT 的机构或服务地址".to_string(),
                status: "info".to_string(),
            });
        }

        if let Some(sub_val) = map.get("sub") {
            claims.push(ClaimAudit {
                name: "sub (主体 Subject)".to_string(),
                value: sub_val.clone(),
                description: "通常为用户 ID 或主要认证实体".to_string(),
                status: "info".to_string(),
            });
        }

        if let Some(aud_val) = map.get("aud") {
            claims.push(ClaimAudit {
                name: "aud (受众 Audience)".to_string(),
                value: aud_val.clone(),
                description: "预期接收该令牌的服务或客户端群体".to_string(),
                status: "info".to_string(),
            });
        }
    }

    let formatted_header = serde_json::to_string_pretty(&header).unwrap_or_default();
    let formatted_payload = serde_json::to_string_pretty(&payload).unwrap_or_default();

    Ok(JwtAnalysis {
        header,
        payload,
        signature: parts[2].to_string(),
        algorithm,
        token_type,
        is_expired,
        is_valid_time,
        claims,
        formatted_header,
        formatted_payload,
    })
}

#[derive(Debug, Serialize)]
pub struct PresetItem {
    pub id: &'static str,
    pub name: &'static str,
    pub description: &'static str,
    pub token: &'static str,
}

pub fn get_presets() -> Vec<PresetItem> {
    vec![
        PresetItem {
            id: "standard-user",
            name: "标准用户认证令牌 (HS256)",
            description: "包含 sub, name, roles, iat, exp 等核心用户声明",
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMzQ1NiIsIm5hbWUiOiJBbGljZSBXYXNtIiwiZW1haWwiOiJhbGljZUB3YXNtZm9yZ2UuZGV2Iiwicm9sZXMiOlsidXNlciIsImFkbWluIl0sImlhdCI6MTc3MDAwMDAwMCwiZXhwIjoyMDgwMDAwMDAwfQ.cnhk-G5n7183H2L3a5jK7V8B3_N8Q4_92h62xK4P7k8",
        },
        PresetItem {
            id: "expired-token",
            name: "已过期令牌 (Expired JWT)",
            description: "exp 位于过去的过期令牌示例",
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzk5OTk5OSIsIm5hbWUiOiJCb2IgRXhwaXJlZCIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAzNjAwfQ.uC4W0K9K2B1P8N7V6X3H4_L2jK5_89h62xK4P7k8",
        },
        PresetItem {
            id: "rsa-service",
            name: "微服务调用令牌 (RS256)",
            description: "服务间授权通信令牌，带 iss 与 aud",
            token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImFwaS1rZXktMjAyNiJ9.eyJpc3MiOiJhdXRoLndhc21mb3JnZS5pbyIsInN1YiI6InNydi1jYXJnbzAxIiwiYXVkIjoiaHR0cHM6Ly9hcGkud2FzbWZvcmdlLmlvIiwic2NvcGUiOiJyZWFkOndhc20gd3JpdGU6d2FzbSIsImlhdCI6MTc3MDAwMDAwMCwiZXhwIjoyMDgwMDAwMDAwfQ.dGhpcy1pcy1hLXNhbXBsZS1yc2Etc2lnbmF0dXJlLWZvci13YXNtLWZvcmdl",
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
        "jwt/parse" | "jwt/decode" => {
            let params: ParseParams = match serde_json::from_value(req.params) {
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

            match parse_jwt(&params.token, params.current_time) {
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
        "jwt/presets" | "jwt/samples" => {
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
    fn test_base64url_decode() {
        let dec = base64url_decode("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9").unwrap();
        let s = String::from_utf8(dec).unwrap();
        assert!(s.contains("HS256"));
    }

    #[test]
    fn test_parse_jwt() {
        let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjIwMDAwMDAwMDB9.signature";
        let res = parse_jwt(token, Some(1700000000)).unwrap();
        assert_eq!(res.algorithm, "HS256");
        assert_eq!(res.token_type, "JWT");
        assert_eq!(res.is_expired, Some(false));
    }
}
