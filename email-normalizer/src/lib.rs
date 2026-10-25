extern crate alloc;

use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec::Vec;
use serde::{Deserialize, Serialize};

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

#[derive(Debug, Serialize, Clone)]
struct EmailNormalizedItem {
    original: String,
    normalized: String,
    username: String,
    domain: String,
    tag: Option<String>,
    provider: String,
    is_valid: bool,
    has_alias: bool,
    stripped_dots: bool,
    domain_aliased: bool,
}

#[derive(Debug, Serialize)]
struct BatchNormalizeResult {
    total: usize,
    unique: usize,
    duplicates_removed: usize,
    items: Vec<EmailNormalizedItem>,
}

#[derive(Debug, Serialize)]
struct SampleEmailItem {
    label: String,
    email: String,
    description: String,
}

#[derive(Debug, Serialize)]
struct SampleEmailsResult {
    samples: Vec<SampleEmailItem>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum ProviderType {
    Gmail,
    Outlook,
    Yahoo,
    ICloud,
    Proton,
    Fastmail,
    Generic,
}

impl ProviderType {
    fn from_domain(domain: &str) -> Self {
        match domain {
            "gmail.com" | "googlemail.com" => ProviderType::Gmail,
            "outlook.com" | "hotmail.com" | "live.com" | "msn.com" => ProviderType::Outlook,
            "yahoo.com" | "ymail.com" | "rocketmail.com" => ProviderType::Yahoo,
            "icloud.com" | "me.com" | "mac.com" => ProviderType::ICloud,
            "proton.me" | "protonmail.com" | "pm.me" => ProviderType::Proton,
            "fastmail.com" | "fastmail.fm" => ProviderType::Fastmail,
            _ => ProviderType::Generic,
        }
    }

    fn name(&self) -> &'static str {
        match self {
            ProviderType::Gmail => "Google Gmail",
            ProviderType::Outlook => "Microsoft Outlook / Hotmail",
            ProviderType::Yahoo => "Yahoo Mail",
            ProviderType::ICloud => "Apple iCloud",
            ProviderType::Proton => "Proton Mail",
            ProviderType::Fastmail => "Fastmail",
            ProviderType::Generic => "标准通用邮件托管 (Generic)",
        }
    }
}

fn normalize_single_email(
    raw_email: &str,
    strip_tags: bool,
    strip_dots: bool,
) -> Result<EmailNormalizedItem, String> {
    let trimmed = raw_email.trim();
    if trimmed.is_empty() {
        return Err("邮箱地址不能为空".into());
    }

    // 基本拆分 local 和 domain
    let parts: Vec<&str> = trimmed.split('@').collect();
    if parts.len() != 2 {
        return Ok(EmailNormalizedItem {
            original: trimmed.to_string(),
            normalized: trimmed.to_string(),
            username: "".into(),
            domain: "".into(),
            tag: None,
            provider: "未知 (Invalid)".into(),
            is_valid: false,
            has_alias: false,
            stripped_dots: false,
            domain_aliased: false,
        });
    }

    let local = parts[0].trim();
    let mut domain = parts[1].trim().to_ascii_lowercase();

    if local.is_empty() || domain.is_empty() || !domain.contains('.') {
        return Ok(EmailNormalizedItem {
            original: trimmed.to_string(),
            normalized: trimmed.to_string(),
            username: local.to_string(),
            domain: domain.clone(),
            tag: None,
            provider: "格式不合规 (Invalid)".into(),
            is_valid: false,
            has_alias: false,
            stripped_dots: false,
            domain_aliased: false,
        });
    }

    let mut domain_aliased = false;
    if domain == "googlemail.com" {
        domain = "gmail.com".to_string();
        domain_aliased = true;
    }

    let provider = ProviderType::from_domain(&domain);
    let mut tag: Option<String> = None;
    let mut clean_local = local.to_string();

    // 1. 别名标签剥离 (Tag / Alias Stripping)
    if strip_tags {
        if provider == ProviderType::Yahoo {
            // Yahoo 采用短横线别名: user-tag@yahoo.com
            if let Some(dash_idx) = clean_local.find('-') {
                tag = Some(clean_local[dash_idx + 1..].to_string());
                clean_local = clean_local[..dash_idx].to_string();
            }
        } else {
            // Gmail, Outlook, iCloud, Proton, Fastmail 以及通用规则均支持 + 别名
            if let Some(plus_idx) = clean_local.find('+') {
                tag = Some(clean_local[plus_idx + 1..].to_string());
                clean_local = clean_local[..plus_idx].to_string();
            }
        }
    }

    // 2. 点号剥离 (Dot Stripping，仅针对 Gmail / Google Workspace)
    let mut stripped_dots = false;
    if strip_dots && provider == ProviderType::Gmail {
        if clean_local.contains('.') {
            clean_local = clean_local.replace('.', "");
            stripped_dots = true;
        }
    }

    // 3. 用户名小写化（主流提供商均不区分大小写）
    clean_local = clean_local.to_ascii_lowercase();

    let has_alias = tag.is_some();
    let normalized = format!("{}@{}", clean_local, domain);

    Ok(EmailNormalizedItem {
        original: trimmed.to_string(),
        normalized,
        username: clean_local,
        domain,
        tag,
        provider: provider.name().to_string(),
        is_valid: true,
        has_alias,
        stripped_dots,
        domain_aliased,
    })
}

fn get_sample_emails() -> Vec<SampleEmailItem> {
    alloc::vec![
        SampleEmailItem {
            label: "Gmail 点号与别名混合".into(),
            email: "J.o.h.n.D.o.e+newsletter@GoogleMail.com".into(),
            description: "去除点号、去除 +tag 别名、映射 googlemail.com 为 gmail.com".into(),
        },
        SampleEmailItem {
            label: "Outlook 加号别名".into(),
            email: "alice.smith+shopping@outlook.com".into(),
            description: "保留用户名中的点号，去除加号 +tag 别名".into(),
        },
        SampleEmailItem {
            label: "Yahoo 连字符别名".into(),
            email: "alexander-bills@yahoo.com".into(),
            description: "检测并剥离 Yahoo 专用的 -tag 连字符别名".into(),
        },
        SampleEmailItem {
            label: "Proton 隐私别名".into(),
            email: "secuser+vault@proton.me".into(),
            description: "识别 Proton Mail 域名并清洗别名标签".into(),
        },
        SampleEmailItem {
            label: "多空格与大小写混乱".into(),
            email: "   Developer.Tool+TEST@GMAIL.COM   ".into(),
            description: "清洗首尾空白、全小写归一化、点号与标签彻底重组".into(),
        },
    ]
}

// ==============================================================================
// 内存管理与纯 C-ABI 导出
// ==============================================================================

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
    let slice = core::slice::from_raw_parts(ptr, len);
    let req: RequestEnvelope = match serde_json::from_slice(slice) {
        Ok(r) => r,
        Err(e) => {
            return pack_response(&ResponseEnvelope::<()> {
                code: 400,
                msg: format!("请求 JSON 反序列化失败: {}", e),
                request_id: "".into(),
                data: None,
            });
        }
    };

    let req_id = req.request_id.unwrap_or_else(|| "default".into());

    match req.action.as_str() {
        "email/normalize" => {
            let email = match req.params.get("email").and_then(|v| v.as_str()) {
                Some(e) if !e.trim().is_empty() => e,
                _ => {
                    return pack_response(&ResponseEnvelope::<()> {
                        code: 400,
                        msg: "email 参数不能为空".into(),
                        request_id: req_id,
                        data: None,
                    });
                }
            };

            let strip_tags = req.params.get("stripTags").and_then(|v| v.as_bool()).unwrap_or(true);
            let strip_dots = req.params.get("stripDots").and_then(|v| v.as_bool()).unwrap_or(true);

            match normalize_single_email(email, strip_tags, strip_dots) {
                Ok(item) => pack_response(&ResponseEnvelope {
                    code: 0,
                    msg: "success".into(),
                    request_id: req_id,
                    data: Some(item),
                }),
                Err(e) => pack_response(&ResponseEnvelope::<()> {
                    code: 400,
                    msg: e,
                    request_id: req_id,
                    data: None,
                }),
            }
        }
        "email/batch" => {
            let raw_list = req.params.get("emails");
            let emails: Vec<String> = if let Some(arr) = raw_list.and_then(|v| v.as_array()) {
                arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect()
            } else if let Some(s) = raw_list.and_then(|v| v.as_str()) {
                s.lines().map(|l| l.trim().to_string()).filter(|l| !l.is_empty()).collect()
            } else {
                Vec::new()
            };

            if emails.is_empty() {
                return pack_response(&ResponseEnvelope::<()> {
                    code: 400,
                    msg: "emails 列表不能为空".into(),
                    request_id: req_id,
                    data: None,
                });
            }

            let strip_tags = req.params.get("stripTags").and_then(|v| v.as_bool()).unwrap_or(true);
            let strip_dots = req.params.get("stripDots").and_then(|v| v.as_bool()).unwrap_or(true);
            let deduplicate = req.params.get("deduplicate").and_then(|v| v.as_bool()).unwrap_or(true);

            let mut results = Vec::new();
            let mut seen_normalized = Vec::new();
            let total = emails.len();

            for e in &emails {
                if let Ok(item) = normalize_single_email(e, strip_tags, strip_dots) {
                    if deduplicate {
                        if !seen_normalized.contains(&item.normalized) {
                            seen_normalized.push(item.normalized.clone());
                            results.push(item);
                        }
                    } else {
                        results.push(item);
                    }
                }
            }

            let unique = results.len();
            let duplicates_removed = if total >= unique { total - unique } else { 0 };

            pack_response(&ResponseEnvelope {
                code: 0,
                msg: "success".into(),
                request_id: req_id,
                data: Some(BatchNormalizeResult {
                    total,
                    unique,
                    duplicates_removed,
                    items: results,
                }),
            })
        }
        "email/samples" => {
            pack_response(&ResponseEnvelope {
                code: 0,
                msg: "success".into(),
                request_id: req_id,
                data: Some(SampleEmailsResult {
                    samples: get_sample_emails(),
                }),
            })
        }
        _ => pack_response(&ResponseEnvelope::<()> {
            code: 404,
            msg: format!("未知的 action: {}", req.action),
            request_id: req_id,
            data: None,
        }),
    }
}

unsafe fn pack_response<T: Serialize>(res: &ResponseEnvelope<T>) -> u64 {
    let bytes = serde_json::to_vec(res).unwrap_or_else(|_| {
        b"{\"code\":500,\"msg\":\"JSON serialization failed\",\"request_id\":\"\",\"data\":null}".to_vec()
    });
    let out_len = bytes.len();
    let out_ptr = alloc(out_len);
    core::ptr::copy_nonoverlapping(bytes.as_ptr(), out_ptr, out_len);
    ((out_ptr as u64) << 32) | (out_len as u64 & 0xffffffff)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_gmail_normalization() {
        let res = normalize_single_email("j.o.h.n.doe+news@googlemail.com", true, true).unwrap();
        assert_eq!(res.normalized, "johndoe@gmail.com");
        assert_eq!(res.username, "johndoe");
        assert_eq!(res.domain, "gmail.com");
        assert_eq!(res.tag.as_deref(), Some("news"));
        assert!(res.stripped_dots);
        assert!(res.domain_aliased);
    }

    #[test]
    fn test_outlook_normalization() {
        let res = normalize_single_email("john.doe+work@outlook.com", true, true).unwrap();
        assert_eq!(res.normalized, "john.doe@outlook.com");
        assert_eq!(res.username, "john.doe");
        assert_eq!(res.tag.as_deref(), Some("work"));
        assert!(!res.stripped_dots); // Outlook does not strip dots
    }

    #[test]
    fn test_yahoo_normalization() {
        let res = normalize_single_email("alex-bills@yahoo.com", true, true).unwrap();
        assert_eq!(res.normalized, "alex@yahoo.com");
        assert_eq!(res.username, "alex");
        assert_eq!(res.tag.as_deref(), Some("bills"));
    }
}
