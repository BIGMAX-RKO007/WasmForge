extern crate alloc;

use alloc::collections::BTreeMap;
use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec;
use alloc::vec::Vec;
use core::slice;
use serde::{Deserialize, Serialize};

fn hex_val(b: u8) -> Option<u8> {
    match b {
        b'0'..=b'9' => Some(b - b'0'),
        b'a'..=b'f' => Some(b - b'a' + 10),
        b'A'..=b'F' => Some(b - b'A' + 10),
        _ => None,
    }
}

pub fn url_decode(text: &str) -> String {
    let bytes = text.as_bytes();
    let mut out_bytes = Vec::with_capacity(bytes.len());
    let mut i = 0;

    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let (Some(h1), Some(h2)) = (hex_val(bytes[i + 1]), hex_val(bytes[i + 2])) {
                let decoded_byte = (h1 << 4) | h2;
                out_bytes.push(decoded_byte);
                i += 3;
                continue;
            }
        }

        if bytes[i] == b'+' {
            out_bytes.push(b' ');
        } else {
            out_bytes.push(bytes[i]);
        }
        i += 1;
    }

    String::from_utf8(out_bytes).unwrap_or_else(|_| text.to_string())
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct QueryParam {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ParsedUrl {
    pub href: String,
    pub origin: String,
    pub protocol: String,
    pub username: Option<String>,
    pub password: Option<String>,
    pub host: String,
    pub hostname: String,
    pub port: Option<u16>,
    pub pathname: String,
    pub segments: Vec<String>,
    pub search: String,
    pub params: Vec<QueryParam>,
    #[serde(rename = "paramsMap")]
    pub params_map: BTreeMap<String, Vec<String>>,
    pub hash: String,
}

pub fn parse_url(input: &str) -> Result<ParsedUrl, String> {
    let raw = input.trim();
    if raw.is_empty() {
        return Err("URL 不能为空".to_string());
    }

    let (before_hash, hash) = if let Some(pos) = raw.find('#') {
        (&raw[..pos], raw[pos + 1..].to_string())
    } else {
        (raw, String::new())
    };

    let (before_query, search, query_str) = if let Some(pos) = before_hash.find('?') {
        (&before_hash[..pos], before_hash[pos..].to_string(), &before_hash[pos + 1..])
    } else {
        (before_hash, String::new(), "")
    };

    let (protocol, after_scheme) = if let Some(pos) = before_query.find("://") {
        (before_query[..pos].to_ascii_lowercase(), &before_query[pos + 3..])
    } else if let Some(pos) = before_query.find(':') {
        if !before_query[..pos].contains('/') {
            (before_query[..pos].to_ascii_lowercase(), &before_query[pos + 1..])
        } else {
            ("https".to_string(), before_query)
        }
    } else {
        ("https".to_string(), before_query)
    };

    let (authority, pathname) = if let Some(slash_pos) = after_scheme.find('/') {
        (&after_scheme[..slash_pos], after_scheme[slash_pos..].to_string())
    } else {
        (after_scheme, "/".to_string())
    };

    let (userinfo, host_port) = if let Some(at_pos) = authority.rfind('@') {
        (Some(&authority[..at_pos]), &authority[at_pos + 1..])
    } else {
        (None, authority)
    };

    let (username, password) = if let Some(u) = userinfo {
        if let Some(col_pos) = u.find(':') {
            (Some(url_decode(&u[..col_pos])), Some(url_decode(&u[col_pos + 1..])))
        } else {
            (Some(url_decode(u)), None)
        }
    } else {
        (None, None)
    };

    let (hostname, port) = if host_port.starts_with('[') {
        if let Some(close_bracket) = host_port.find(']') {
            let host_part = &host_port[..=close_bracket];
            let rest = &host_port[close_bracket + 1..];
            if let Some(p_str) = rest.strip_prefix(':') {
                (host_part.to_string(), p_str.parse::<u16>().ok())
            } else {
                (host_part.to_string(), None)
            }
        } else {
            (host_port.to_string(), None)
        }
    } else if let Some(col_pos) = host_port.rfind(':') {
        let h = &host_port[..col_pos];
        let p = host_port[col_pos + 1..].parse::<u16>().ok();
        (h.to_ascii_lowercase(), p)
    } else {
        (host_port.to_ascii_lowercase(), None)
    };

    let host = if let Some(p) = port {
        format!("{}:{}", hostname, p)
    } else {
        hostname.clone()
    };

    let origin = if !protocol.is_empty() && !host.is_empty() {
        format!("{}://{}", protocol, host)
    } else {
        "".to_string()
    };

    let segments = pathname
        .split('/')
        .filter(|s| !s.is_empty())
        .map(url_decode)
        .collect::<Vec<_>>();

    let mut params = Vec::new();
    let mut params_map: BTreeMap<String, Vec<String>> = BTreeMap::new();

    if !query_str.is_empty() {
        for pair in query_str.split('&') {
            if pair.is_empty() {
                continue;
            }
            let (k, v) = if let Some(eq_pos) = pair.find('=') {
                (&pair[..eq_pos], &pair[eq_pos + 1..])
            } else {
                (pair, "")
            };

            let dec_k = url_decode(k);
            let dec_v = url_decode(v);

            params.push(QueryParam {
                key: dec_k.clone(),
                value: dec_v.clone(),
            });

            params_map.entry(dec_k).or_default().push(dec_v);
        }
    }

    Ok(ParsedUrl {
        href: raw.to_string(),
        origin,
        protocol: format!("{}:", protocol),
        username,
        password,
        host,
        hostname,
        port,
        pathname,
        segments,
        search,
        params,
        params_map,
        hash: if hash.is_empty() { "".to_string() } else { format!("#{}", hash) },
    })
}

#[derive(Debug, Deserialize)]
pub struct ParseParams {
    pub url: String,
}

#[derive(Debug, Serialize)]
pub struct UrlPreset {
    pub id: &'static str,
    pub name: &'static str,
    pub url: &'static str,
    pub description: &'static str,
}

pub fn get_presets() -> Vec<UrlPreset> {
    vec![
        UrlPreset {
            id: "complex-api",
            name: "GitHub API 复杂端点",
            url: "https://user:secret123@api.github.com:8443/repos/rust-lang/rust/pulls?state=open&sort=created&direction=desc#issuecomment-999",
            description: "包含身份凭证、非标端口、多查询参数与锚点",
        },
        UrlPreset {
            id: "ecommerce-search",
            name: "电商检索与数组过滤",
            url: "https://www.example.com/shop/electronics/laptops?brand=apple&brand=dell&price_min=1000&sort=popular#reviews",
            description: "多值重复键、分类多级路径与锚点",
        },
        UrlPreset {
            id: "cloud-deep-link",
            name: "云控制台深度链接",
            url: "https://console.aws.amazon.com/ec2/home?region=us-east-1#Instances:instanceState=running;v=3",
            description: "区域查询参数与复合控制台状态哈希",
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
        "url/parse" | "url/inspect" => {
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

            match parse_url(&params.url) {
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
        "url/presets" | "url/samples" => {
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
    fn test_parse_complex_url() {
        let u = "https://user:pass@api.example.com:8080/v1/users/profile?id=123&tags=rust&tags=wasm#section";
        let parsed = parse_url(u).unwrap();
        assert_eq!(parsed.protocol, "https:");
        assert_eq!(parsed.username, Some("user".to_string()));
        assert_eq!(parsed.password, Some("pass".to_string()));
        assert_eq!(parsed.hostname, "api.example.com");
        assert_eq!(parsed.port, Some(8080));
        assert_eq!(parsed.pathname, "/v1/users/profile");
        assert_eq!(parsed.segments, vec!["v1", "users", "profile"]);
        assert_eq!(parsed.params.len(), 3);
        assert_eq!(parsed.params_map.get("tags").unwrap().len(), 2);
        assert_eq!(parsed.hash, "#section");
    }
}
