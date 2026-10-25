extern crate alloc;

use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec;
use alloc::vec::Vec;
use core::slice;
use serde::{Deserialize, Serialize};

const B64_CHARS: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

fn base64_encode(data: &[u8]) -> String {
    let mut out = String::with_capacity((data.len() + 2) / 3 * 4);
    let mut i = 0;
    while i < data.len() {
        let b0 = data[i] as u32;
        let b1 = if i + 1 < data.len() { data[i + 1] as u32 } else { 0 };
        let b2 = if i + 2 < data.len() { data[i + 2] as u32 } else { 0 };

        let triple = (b0 << 16) | (b1 << 8) | b2;

        out.push(B64_CHARS[((triple >> 18) & 0x3F) as usize] as char);
        out.push(B64_CHARS[((triple >> 12) & 0x3F) as usize] as char);

        if i + 1 < data.len() {
            out.push(B64_CHARS[((triple >> 6) & 0x3F) as usize] as char);
        } else {
            out.push('=');
        }

        if i + 2 < data.len() {
            out.push(B64_CHARS[(triple & 0x3F) as usize] as char);
        } else {
            out.push('=');
        }

        i += 3;
    }
    out
}

fn b64_val(c: u8) -> Option<u8> {
    match c {
        b'A'..=b'Z' => Some(c - b'A'),
        b'a'..=b'z' => Some(c - b'a' + 26),
        b'0'..=b'9' => Some(c - b'0' + 52),
        b'+' => Some(62),
        b'/' => Some(63),
        _ => None,
    }
}

fn base64_decode(s: &str) -> Option<Vec<u8>> {
    let clean: Vec<u8> = s.bytes().filter(|&b| b != b'\r' && b != b'\n' && b != b' ').collect();
    if clean.is_empty() {
        return Some(Vec::new());
    }

    let mut out = Vec::new();
    let mut i = 0;
    while i < clean.len() {
        let c0 = clean[i];
        let c1 = clean.get(i + 1).copied()?;
        let c2 = clean.get(i + 2).copied()?;
        let c3 = clean.get(i + 3).copied()?;

        let v0 = b64_val(c0)?;
        let v1 = b64_val(c1)?;

        let b0 = (v0 << 2) | (v1 >> 4);
        out.push(b0);

        if c2 != b'=' {
            let v2 = b64_val(c2)?;
            let b1 = ((v1 & 0xF) << 4) | (v2 >> 2);
            out.push(b1);

            if c3 != b'=' {
                let v3 = b64_val(c3)?;
                let b2 = ((v2 & 0x3) << 6) | v3;
                out.push(b2);
            }
        }

        i += 4;
    }
    Some(out)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BasicAuthGenerateResult {
    pub username: String,
    pub password: String,
    pub credentials: String,
    pub base64: String,
    #[serde(rename = "authHeader")]
    pub auth_header: String,
    #[serde(rename = "curlSnippet")]
    pub curl_snippet: String,
    #[serde(rename = "fetchSnippet")]
    pub fetch_snippet: String,
    #[serde(rename = "pythonSnippet")]
    pub python_snippet: String,
    #[serde(rename = "nginxSnippet")]
    pub nginx_snippet: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BasicAuthParseResult {
    pub username: String,
    pub password: String,
    pub valid: bool,
    #[serde(rename = "authHeader")]
    pub auth_header: String,
}

pub fn generate_basic_auth(username: &str, password: &str) -> BasicAuthGenerateResult {
    let credentials = format!("{}:{}", username, password);
    let b64 = base64_encode(credentials.as_bytes());
    let auth_header = format!("Authorization: Basic {}", b64);

    let curl_snippet = format!(
        "curl -H \"Authorization: Basic {}\" https://api.example.com/data\n# 或使用简写参数:\ncurl -u \"{}:{}\" https://api.example.com/data",
        b64, username, password
    );

    let fetch_snippet = format!(
        "fetch('https://api.example.com/data', {{\n  method: 'GET',\n  headers: {{\n    'Authorization': 'Basic {}',\n    'Content-Type': 'application/json'\n  }}\n}})",
        b64
    );

    let python_snippet = format!(
        "import requests\n\n# 方式 1: 直接传递 auth 元组\nresponse = requests.get('https://api.example.com/data', auth=('{}', '{}'))\n\n# 方式 2: 传递完整 Header\nheaders = {{'Authorization': 'Basic {}'}}\nresponse = requests.get('https://api.example.com/data', headers=headers)",
        username, password, b64
    );

    let nginx_snippet = format!(
        "# Nginx 反向代理或受保护目录配置\nauth_basic \"Restricted API Access\";\nauth_basic_user_file /etc/nginx/.htpasswd;\n\n# 生成对应 htpasswd 命令 (如使用 htpasswd 工具):\n# htpasswd -nb \"{}\" \"{}\"",
        username, password
    );

    BasicAuthGenerateResult {
        username: username.to_string(),
        password: password.to_string(),
        credentials,
        base64: b64,
        auth_header,
        curl_snippet,
        fetch_snippet,
        python_snippet,
        nginx_snippet,
    }
}

pub fn parse_basic_auth(header_str: &str) -> BasicAuthParseResult {
    let mut trimmed = header_str.trim();
    if let Some(stripped) = trimmed.strip_prefix("Authorization:") {
        trimmed = stripped.trim();
    }
    if let Some(stripped) = trimmed.strip_prefix("Basic") {
        trimmed = stripped.trim();
    }

    if let Some(bytes) = base64_decode(trimmed) {
        if let Ok(utf8_str) = core::str::from_utf8(&bytes) {
            if let Some(colon_pos) = utf8_str.find(':') {
                let u = &utf8_str[..colon_pos];
                let p = &utf8_str[colon_pos + 1..];
                return BasicAuthParseResult {
                    username: u.to_string(),
                    password: p.to_string(),
                    valid: true,
                    auth_header: format!("Authorization: Basic {}", trimmed),
                };
            }
        }
    }

    BasicAuthParseResult {
        username: "".to_string(),
        password: "".to_string(),
        valid: false,
        auth_header: header_str.to_string(),
    }
}

#[derive(Debug, Deserialize)]
pub struct GenerateParams {
    pub username: Option<String>,
    pub password: Option<String>,
    pub header: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AuthPreset {
    pub id: &'static str,
    pub name: &'static str,
    pub username: &'static str,
    pub password: &'static str,
}

pub fn get_presets() -> Vec<AuthPreset> {
    vec![
        AuthPreset {
            id: "admin-dev",
            name: "开发管理员凭证",
            username: "admin",
            password: "super-secret-password-123",
        },
        AuthPreset {
            id: "api-service",
            name: "API 自动化服务令牌",
            username: "svc_worker_node",
            password: "tok_prod_49382109abcf",
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
        "basic-auth/generate" => {
            let params: GenerateParams = match serde_json::from_value(req.params) {
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

            let u = params.username.unwrap_or_default();
            let p = params.password.unwrap_or_default();
            let res = generate_basic_auth(&u, &p);

            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(res),
            })
        }
        "basic-auth/parse" => {
            let params: GenerateParams = match serde_json::from_value(req.params) {
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

            let header = params.header.unwrap_or_default();
            let res = parse_basic_auth(&header);

            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(res),
            })
        }
        "basic-auth/presets" => {
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
    fn test_generate_and_parse() {
        let res = generate_basic_auth("aladdin", "open sesame");
        assert_eq!(res.base64, "YWxhZGRpbjpvcGVuIHNlc2FtZQ==");
        assert_eq!(res.auth_header, "Authorization: Basic YWxhZGRpbjpvcGVuIHNlc2FtZQ==");

        let parsed = parse_basic_auth(&res.auth_header);
        assert!(parsed.valid);
        assert_eq!(parsed.username, "aladdin");
        assert_eq!(parsed.password, "open sesame");
    }
}
