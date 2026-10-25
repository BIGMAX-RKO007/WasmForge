extern crate alloc;

use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec::Vec;
use core::slice;
use regex::RegexBuilder;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct RequestEnvelope {
    action: String,
    #[serde(default)]
    #[allow(dead_code)]
    request_id: Option<String>,
    #[serde(default)]
    params: serde_json::Value,
}

#[derive(Serialize)]
struct ResponseEnvelope<T> {
    code: i32,
    msg: String,
    data: Option<T>,
}

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct RegexFlags {
    #[serde(default)]
    case_insensitive: bool,
    #[serde(default)]
    multi_line: bool,
    #[serde(default)]
    dot_matches_new_line: bool,
    #[serde(default = "default_true")]
    unicode: bool,
}

fn default_true() -> bool {
    true
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RegexCaptureGroup {
    pub name: Option<String>,
    pub index: usize,
    pub text: String,
    pub start: usize,
    pub end: usize,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RegexMatch {
    pub index: usize,
    pub text: String,
    pub start: usize,
    pub end: usize,
    pub captures: Vec<RegexCaptureGroup>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegexTestResult {
    pub is_match: bool,
    pub match_count: usize,
    pub matches: Vec<RegexMatch>,
    pub execution_info: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegexReplaceResult {
    pub original: String,
    pub result: String,
    pub replacements_made: usize,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegexSampleItem {
    pub name: String,
    pub pattern: String,
    pub sample_text: String,
    pub description: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegexSampleResult {
    pub samples: Vec<RegexSampleItem>,
}

fn build_regex(pattern: &str, flags: &RegexFlags) -> Result<regex::Regex, String> {
    RegexBuilder::new(pattern)
        .case_insensitive(flags.case_insensitive)
        .multi_line(flags.multi_line)
        .dot_matches_new_line(flags.dot_matches_new_line)
        .unicode(flags.unicode)
        .size_limit(10 * 1024 * 1024)
        .build()
        .map_err(|e| format!("正则表达式语法错误: {}", e))
}

fn test_regex(pattern: &str, text: &str, flags: &RegexFlags) -> Result<RegexTestResult, String> {
    let re = build_regex(pattern, flags)?;
    let mut matches = Vec::new();
    let capture_names: Vec<Option<String>> = re.capture_names().map(|n| n.map(|s| s.to_string())).collect();

    for (m_idx, caps) in re.captures_iter(text).enumerate() {
        let entire_match = caps.get(0).ok_or_else(|| "无法获取主匹配项".to_string())?;
        let mut group_list = Vec::new();

        for (g_idx, name_opt) in capture_names.iter().enumerate() {
            if let Some(sub) = caps.get(g_idx) {
                group_list.push(RegexCaptureGroup {
                    name: name_opt.clone(),
                    index: g_idx,
                    text: sub.as_str().to_string(),
                    start: sub.start(),
                    end: sub.end(),
                });
            }
        }

        matches.push(RegexMatch {
            index: m_idx,
            text: entire_match.as_str().to_string(),
            start: entire_match.start(),
            end: entire_match.end(),
            captures: group_list,
        });

        // 预防极端匹配过多导致内存暴涨，单次最多提取 1000 个匹配项
        if matches.len() >= 1000 {
            break;
        }
    }

    let is_match = !matches.is_empty();
    let count = matches.len();

    Ok(RegexTestResult {
        is_match,
        match_count: count,
        matches,
        execution_info: "Rust DFA/NFA 线性保证，ReDoS-Safe".to_string(),
    })
}

fn replace_regex(
    pattern: &str,
    text: &str,
    replacement: &str,
    replace_all: bool,
    flags: &RegexFlags,
) -> Result<RegexReplaceResult, String> {
    let re = build_regex(pattern, flags)?;
    let match_count = re.find_iter(text).count();

    let result = if replace_all {
        re.replace_all(text, replacement).to_string()
    } else {
        re.replace(text, replacement).to_string()
    };

    let replacements_made = if replace_all {
        match_count
    } else if match_count > 0 {
        1
    } else {
        0
    };

    Ok(RegexReplaceResult {
        original: text.to_string(),
        result,
        replacements_made,
    })
}

fn get_samples() -> RegexSampleResult {
    RegexSampleResult {
        samples: alloc::vec![
            RegexSampleItem {
                name: "Email 电子邮箱".to_string(),
                pattern: r"(?P<user>[a-zA-Z0-9_.+-]+)@(?P<domain>[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)".to_string(),
                sample_text: "请联系 support@wasmforge.dev 或者开发者 admin@example.org 获取帮助。".to_string(),
                description: "带命名捕获组的 Email 提取".to_string(),
            },
            RegexSampleItem {
                name: "IPv4 地址".to_string(),
                pattern: r"\b(?P<ip>(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b".to_string(),
                sample_text: "网关地址: 192.168.1.1, 广播: 255.255.255.0, 外网: 8.8.8.8".to_string(),
                description: "精确过滤 0-255 合法 IPv4 字符串".to_string(),
            },
            RegexSampleItem {
                name: "语义化版本号 (SemVer)".to_string(),
                pattern: r"^v?(?P<major>0|[1-9]\d*)\.(?P<minor>0|[1-9]\d*)\.(?P<patch>0|[1-9]\d*)(?:-(?P<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?$".to_string(),
                sample_text: "v1.2.3-alpha.1".to_string(),
                description: "Semver 规范多段捕获".to_string(),
            },
            RegexSampleItem {
                name: "Markdown 超链接".to_string(),
                pattern: r"\[(?P<label>[^\]]+)\]\((?P<url>https?://[^\s)]+)\)".to_string(),
                sample_text: "欢迎访问 [WasmForge官网](https://wasmforge.dev) 与 [GitHub开源库](https://github.com/WasmForge)。".to_string(),
                description: "捕获 Markdown 锚文本与目标 URL".to_string(),
            }
        ],
    }
}

fn handle_dispatch(in_bytes: &[u8]) -> Vec<u8> {
    let req: RequestEnvelope = match serde_json::from_slice(in_bytes) {
        Ok(r) => r,
        Err(e) => {
            let res = ResponseEnvelope::<()> {
                code: 400,
                msg: format!("请求 JSON 格式反序列化失败: {}", e),
                data: None,
            };
            return serde_json::to_vec(&res).unwrap_or_default();
        }
    };

    match req.action.as_str() {
        "regex/test" => {
            let pattern = match req.params.get("pattern").and_then(|v| v.as_str()) {
                Some(p) => p,
                None => {
                    let res = ResponseEnvelope::<()> {
                        code: 400,
                        msg: "缺失必要的参数 'pattern'".to_string(),
                        data: None,
                    };
                    return serde_json::to_vec(&res).unwrap_or_default();
                }
            };

            let text = req.params.get("text").and_then(|v| v.as_str()).unwrap_or("");
            let flags: RegexFlags = req
                .params
                .get("flags")
                .and_then(|v| serde_json::from_value(v.clone()).ok())
                .unwrap_or_default();

            match test_regex(pattern, text, &flags) {
                Ok(data) => {
                    let res = ResponseEnvelope {
                        code: 0,
                        msg: "success".to_string(),
                        data: Some(data),
                    };
                    serde_json::to_vec(&res).unwrap_or_default()
                }
                Err(e) => {
                    let res = ResponseEnvelope::<()> {
                        code: 422,
                        msg: e,
                        data: None,
                    };
                    serde_json::to_vec(&res).unwrap_or_default()
                }
            }
        }
        "regex/replace" => {
            let pattern = match req.params.get("pattern").and_then(|v| v.as_str()) {
                Some(p) => p,
                None => {
                    let res = ResponseEnvelope::<()> {
                        code: 400,
                        msg: "缺失必要的参数 'pattern'".to_string(),
                        data: None,
                    };
                    return serde_json::to_vec(&res).unwrap_or_default();
                }
            };

            let text = req.params.get("text").and_then(|v| v.as_str()).unwrap_or("");
            let replacement = req.params.get("replacement").and_then(|v| v.as_str()).unwrap_or("");
            let replace_all = req.params.get("replaceAll").and_then(|v| v.as_bool()).unwrap_or(true);
            let flags: RegexFlags = req
                .params
                .get("flags")
                .and_then(|v| serde_json::from_value(v.clone()).ok())
                .unwrap_or_default();

            match replace_regex(pattern, text, replacement, replace_all, &flags) {
                Ok(data) => {
                    let res = ResponseEnvelope {
                        code: 0,
                        msg: "success".to_string(),
                        data: Some(data),
                    };
                    serde_json::to_vec(&res).unwrap_or_default()
                }
                Err(e) => {
                    let res = ResponseEnvelope::<()> {
                        code: 422,
                        msg: e,
                        data: None,
                    };
                    serde_json::to_vec(&res).unwrap_or_default()
                }
            }
        }
        "regex/sample" => {
            let res = ResponseEnvelope {
                code: 0,
                msg: "success".to_string(),
                data: Some(get_samples()),
            };
            serde_json::to_vec(&res).unwrap_or_default()
        }
        _ => {
            let res = ResponseEnvelope::<()> {
                code: 404,
                msg: format!("未知的 action 操作: {}", req.action),
                data: None,
            };
            serde_json::to_vec(&res).unwrap_or_default()
        }
    }
}

// 纯 C-ABI 内存交互函数导出
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
    if ptr.is_null() || len == 0 {
        return 0;
    }
    let in_bytes = slice::from_raw_parts(ptr, len);
    let out_bytes = handle_dispatch(in_bytes);
    let out_len = out_bytes.len();
    let out_ptr = alloc(out_len);
    core::ptr::copy_nonoverlapping(out_bytes.as_ptr(), out_ptr, out_len);
    ((out_ptr as u64) << 32) | (out_len as u64 & 0xffffffff)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_regex_match_named_groups() {
        let pattern = r"(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})";
        let text = "Release dates: 2026-10-25 and 2026-12-31.";
        let flags = RegexFlags::default();
        let res = test_regex(pattern, text, &flags).expect("test_regex failed");

        assert!(res.is_match);
        assert_eq!(res.match_count, 2);
        assert_eq!(res.matches[0].text, "2026-10-25");
        assert_eq!(res.matches[0].captures.len(), 4);
        assert_eq!(res.matches[0].captures[1].name.as_deref(), Some("year"));
        assert_eq!(res.matches[0].captures[1].text, "2026");
    }

    #[test]
    fn test_regex_replace() {
        let pattern = r"\bapple\b";
        let text = "one apple, two apples, big apple";
        let flags = RegexFlags::default();
        let res = replace_regex(pattern, text, "orange", true, &flags).expect("replace failed");

        assert_eq!(res.replacements_made, 2);
        assert_eq!(res.result, "one orange, two apples, big orange");
    }
}
