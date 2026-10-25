extern crate alloc;

use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec;
use alloc::vec::Vec;
use core::slice;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct NumeronymItem {
    pub original: String,
    pub numeronym: String,
    #[serde(rename = "omittedCount")]
    pub omitted_count: usize,
    #[serde(rename = "originalLen")]
    pub original_len: usize,
    #[serde(rename = "savingsPercent")]
    pub savings_percent: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateParams {
    pub text: String,
    #[serde(rename = "minLen", default = "default_min_len")]
    pub min_len: usize,
    #[serde(default = "default_mode")]
    pub mode: String, // "text" | "batch" | "lookup"
}

fn default_min_len() -> usize {
    4
}

fn default_mode() -> String {
    "text".to_string()
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateResult {
    #[serde(rename = "transformedText")]
    pub transformed_text: String,
    pub items: Vec<NumeronymItem>,
    #[serde(rename = "totalWords")]
    pub total_words: usize,
    #[serde(rename = "abbreviatedWords")]
    pub abbreviated_words: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KnownTerm {
    pub numeronym: String,
    pub expansion: String,
    pub description: String,
}

const KNOWN_NUMERONYMS: &[(&str, &str, &str)] = &[
    ("i18n", "internationalization", "国际化：使软件支持多语言多地区，省去 18 个字母"),
    ("l10n", "localization", "本地化：适配特定地域文化、货币与日期习惯，省去 10 个字母"),
    ("a11y", "accessibility", "无障碍访问：为残障人群提供辅助交互支持，省去 11 个字母"),
    ("k8s", "kubernetes", "谷歌开源容器编排调度引擎，省去 8 个字母"),
    ("o11y", "observability", "可观测性：Metrics、Tracing、Logs 现代链路监控，省去 11 个字母"),
    ("g11n", "globalization", "全球化：涵盖国际化与本地化的宏观工程，省去 11 个字母"),
    ("p13n", "personalization", "个性化推荐与用户画像定制，省去 13 个字母"),
    ("v12n", "virtualization", "虚拟化技术（如 KVM、Hypervisor），省去 12 个字母"),
    ("m12n", "modularization", "模块化架构拆分设计，省去 12 个字母"),
    ("m17n", "multilingualization", "多语言化处理，省去 17 个字母"),
    ("c11y", "configurability", "可配置性架构设计，省去 11 个字母"),
    ("s11r", "serializer", "序列化器，省去 11 个字母"),
    ("d11r", "deserializer", "反序列化器，省去 11 个字母"),
    ("c10n", "coordination", "分布式协同协调，省去 10 个字母"),
    ("d11n", "documentation", "工程文档编制，省去 11 个字母"),
];

pub fn word_to_numeronym(word: &str, min_len: usize) -> (String, usize) {
    let chars: Vec<char> = word.chars().collect();
    if chars.len() < min_len || chars.len() <= 2 {
        return (word.to_string(), 0);
    }

    let first = chars[0];
    let last = chars[chars.len() - 1];
    let omitted = chars.len() - 2;

    (format!("{}{}{}", first, omitted, last), omitted)
}

pub fn transform_text(text: &str, min_len: usize) -> GenerateResult {
    let mut result_text = String::with_capacity(text.len());
    let mut items = Vec::new();
    let mut total_words = 0;
    let mut abbreviated_words = 0;

    let mut current_word = String::new();

    for ch in text.chars() {
        if ch.is_alphabetic() {
            current_word.push(ch);
        } else {
            if !current_word.is_empty() {
                total_words += 1;
                let orig_len = current_word.chars().count();
                let (abbr, omitted) = word_to_numeronym(&current_word, min_len);
                if omitted > 0 {
                    abbreviated_words += 1;
                    let savings = ((orig_len as f64 - abbr.len() as f64) / orig_len as f64) * 100.0;
                    items.push(NumeronymItem {
                        original: current_word.clone(),
                        numeronym: abbr.clone(),
                        omitted_count: omitted,
                        original_len: orig_len,
                        savings_percent: (savings * 10.0).round() / 10.0,
                    });
                    result_text.push_str(&abbr);
                } else {
                    result_text.push_str(&current_word);
                }
                current_word.clear();
            }
            result_text.push(ch);
        }
    }

    if !current_word.is_empty() {
        total_words += 1;
        let orig_len = current_word.chars().count();
        let (abbr, omitted) = word_to_numeronym(&current_word, min_len);
        if omitted > 0 {
            abbreviated_words += 1;
            let savings = ((orig_len as f64 - abbr.len() as f64) / orig_len as f64) * 100.0;
            items.push(NumeronymItem {
                original: current_word.clone(),
                numeronym: abbr.clone(),
                omitted_count: omitted,
                original_len: orig_len,
                savings_percent: (savings * 10.0).round() / 10.0,
            });
            result_text.push_str(&abbr);
        } else {
            result_text.push_str(&current_word);
        }
    }

    GenerateResult {
        transformed_text: result_text,
        items,
        total_words,
        abbreviated_words,
    }
}

pub fn transform_batch(text: &str, min_len: usize) -> GenerateResult {
    let mut items = Vec::new();
    let mut transformed_lines = Vec::new();
    let mut total_words = 0;
    let mut abbreviated_words = 0;

    for line in text.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        total_words += 1;
        let orig_len = trimmed.chars().count();
        let (abbr, omitted) = word_to_numeronym(trimmed, min_len);
        if omitted > 0 {
            abbreviated_words += 1;
            let savings = ((orig_len as f64 - abbr.len() as f64) / orig_len as f64) * 100.0;
            items.push(NumeronymItem {
                original: trimmed.to_string(),
                numeronym: abbr.clone(),
                omitted_count: omitted,
                original_len: orig_len,
                savings_percent: (savings * 10.0).round() / 10.0,
            });
            transformed_lines.push(abbr);
        } else {
            transformed_lines.push(trimmed.to_string());
        }
    }

    GenerateResult {
        transformed_text: transformed_lines.join("\n"),
        items,
        total_words,
        abbreviated_words,
    }
}

pub fn lookup_dictionary(query: &str) -> Vec<KnownTerm> {
    let q = query.trim().to_lowercase();
    let mut results = Vec::new();

    for &(num, exp, desc) in KNOWN_NUMERONYMS {
        if q.is_empty() || num.contains(&q) || exp.contains(&q) || desc.contains(&q) {
            results.push(KnownTerm {
                numeronym: num.to_string(),
                expansion: exp.to_string(),
                description: desc.to_string(),
            });
        }
    }
    results
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PresetExample {
    pub id: String,
    pub name: String,
    pub text: String,
    pub mode: String,
}

pub fn get_presets() -> Vec<PresetExample> {
    vec![
        PresetExample {
            id: "tech-terms".to_string(),
            name: "经典技术术语清单 (Tech Terms)".to_string(),
            text: "internationalization\nkubernetes\naccessibility\nobservability\nlocalization\nvirtualization".to_string(),
            mode: "batch".to_string(),
        },
        PresetExample {
            id: "devops-sentence".to_string(),
            name: "开发运维场景整段 (DevOps Sentence)".to_string(),
            text: "Kubernetes provides declarative configuration and automation for containerized applications.".to_string(),
            mode: "text".to_string(),
        },
        PresetExample {
            id: "dictionary-lookup".to_string(),
            name: "常用词典逆向速查 (Known Tech Dict)".to_string(),
            text: "".to_string(),
            mode: "lookup".to_string(),
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
        "numeronym/generate" | "numeronym/transform" => {
            let params: GenerateParams = serde_json::from_value(req.params).unwrap_or(GenerateParams {
                text: "internationalization".to_string(),
                min_len: default_min_len(),
                mode: default_mode(),
            });

            let res = if params.mode == "batch" {
                transform_batch(&params.text, params.min_len)
            } else {
                transform_text(&params.text, params.min_len)
            };

            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(res),
            })
        }
        "numeronym/lookup" | "numeronym/dict" => {
            let query = req.params.get("query").and_then(|v| v.as_str()).unwrap_or("");
            let res = lookup_dictionary(query);

            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(res),
            })
        }
        "numeronym/presets" | "numeronym/samples" => {
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
    fn test_word_to_numeronym() {
        assert_eq!(word_to_numeronym("internationalization", 4), ("i18n".to_string(), 18));
        assert_eq!(word_to_numeronym("kubernetes", 4), ("k8s".to_string(), 8));
        assert_eq!(word_to_numeronym("accessibility", 4), ("a11y".to_string(), 11));
        assert_eq!(word_to_numeronym("cat", 4), ("cat".to_string(), 0));
    }

    #[test]
    fn test_transform_text() {
        let res = transform_text("Hello, internationalization world!", 6);
        assert_eq!(res.transformed_text, "Hello, i18n world!");
        assert_eq!(res.abbreviated_words, 1);
        assert_eq!(res.items[0].numeronym, "i18n");
    }

    #[test]
    fn test_lookup_dictionary() {
        let res = lookup_dictionary("k8s");
        assert_eq!(res.len(), 1);
        assert_eq!(res[0].expansion, "kubernetes");
    }
}
