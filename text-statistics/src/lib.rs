extern crate alloc;

use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec;
use alloc::vec::Vec;
use core::slice;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct WordFrequency {
    pub word: String,
    pub count: usize,
    pub percentage: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TextStats {
    #[serde(rename = "totalCharacters")]
    pub total_characters: usize,
    #[serde(rename = "charactersNoSpaces")]
    pub characters_no_spaces: usize,
    #[serde(rename = "whitespaceCount")]
    pub whitespace_count: usize,
    #[serde(rename = "nonAsciiCount")]
    pub non_ascii_count: usize,
    #[serde(rename = "digitCount")]
    pub digit_count: usize,
    #[serde(rename = "totalWords")]
    pub total_words: usize,
    #[serde(rename = "cjkCharacters")]
    pub cjk_characters: usize,
    #[serde(rename = "totalLines")]
    pub total_lines: usize,
    #[serde(rename = "nonEmptyLines")]
    pub non_empty_lines: usize,
    #[serde(rename = "emptyLines")]
    pub empty_lines: usize,
    #[serde(rename = "sentencesCount")]
    pub sentences_count: usize,
    #[serde(rename = "paragraphsCount")]
    pub paragraphs_count: usize,
    #[serde(rename = "readingTimeSeconds")]
    pub reading_time_seconds: usize,
    #[serde(rename = "readingTimeFormatted")]
    pub reading_time_formatted: String,
    #[serde(rename = "speakingTimeSeconds")]
    pub speaking_time_seconds: usize,
    #[serde(rename = "speakingTimeFormatted")]
    pub speaking_time_formatted: String,
    #[serde(rename = "topWords")]
    pub top_words: Vec<WordFrequency>,
}

fn is_cjk(c: char) -> bool {
    let u = c as u32;
    (0x4E00..=0x9FFF).contains(&u)
        || (0x3400..=0x4DBF).contains(&u)
        || (0x20000..=0x2A6DF).contains(&u)
        || (0xF900..=0xFAFF).contains(&u)
}

fn format_duration(seconds: usize) -> String {
    if seconds < 60 {
        format!("{} 秒", seconds.max(1))
    } else {
        let mins = seconds / 60;
        let secs = seconds % 60;
        if secs == 0 {
            format!("{} 分钟", mins)
        } else {
            format!("{} 分 {} 秒", mins, secs)
        }
    }
}

pub fn analyze_text(text: &str) -> TextStats {
    if text.is_empty() {
        return TextStats {
            total_characters: 0,
            characters_no_spaces: 0,
            whitespace_count: 0,
            non_ascii_count: 0,
            digit_count: 0,
            total_words: 0,
            cjk_characters: 0,
            total_lines: 0,
            non_empty_lines: 0,
            empty_lines: 0,
            sentences_count: 0,
            paragraphs_count: 0,
            reading_time_seconds: 0,
            reading_time_formatted: "0 秒".to_string(),
            speaking_time_seconds: 0,
            speaking_time_formatted: "0 秒".to_string(),
            top_words: Vec::new(),
        };
    }

    let mut total_characters = 0;
    let mut characters_no_spaces = 0;
    let mut whitespace_count = 0;
    let mut non_ascii_count = 0;
    let mut digit_count = 0;
    let mut cjk_characters = 0;

    for c in text.chars() {
        total_characters += 1;
        if c.is_whitespace() {
            whitespace_count += 1;
        } else {
            characters_no_spaces += 1;
        }
        if !c.is_ascii() {
            non_ascii_count += 1;
        }
        if c.is_ascii_digit() {
            digit_count += 1;
        }
        if is_cjk(c) {
            cjk_characters += 1;
        }
    }

    // Lines
    let lines: Vec<&str> = text.lines().collect();
    let total_lines = if text.ends_with('\n') { lines.len() } else { lines.len().max(1) };
    let mut non_empty_lines = 0;
    let mut empty_lines = 0;
    for l in &lines {
        if l.trim().is_empty() {
            empty_lines += 1;
        } else {
            non_empty_lines += 1;
        }
    }

    // Paragraphs
    let paragraphs: Vec<&str> = text
        .split("\n\n")
        .map(|p| p.trim())
        .filter(|p| !p.is_empty())
        .collect();
    let paragraphs_count = paragraphs.len().max(if !text.trim().is_empty() { 1 } else { 0 });

    // Sentences
    let mut sentences_count = 0;
    let sentence_delims = ['.', '?', '!', '。', '！', '？', '；', ';'];
    for c in text.chars() {
        if sentence_delims.contains(&c) {
            sentences_count += 1;
        }
    }
    if sentences_count == 0 && !text.trim().is_empty() {
        sentences_count = 1;
    }

    // Latin words & Word frequency
    let mut latin_words_count = 0;
    let mut word_counts: Vec<(String, usize)> = Vec::new();

    for token in text.split_whitespace() {
        let cleaned: String = token
            .chars()
            .filter(|c| c.is_alphanumeric() && !is_cjk(*c))
            .collect::<String>()
            .to_lowercase();

        if !cleaned.is_empty() {
            latin_words_count += 1;
            if let Some(entry) = word_counts.iter_mut().find(|(w, _)| *w == cleaned) {
                entry.1 += 1;
            } else {
                word_counts.push((cleaned, 1));
            }
        }
    }

    let total_words = latin_words_count + cjk_characters;

    // Sort word frequencies descending
    word_counts.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
    let top_words: Vec<WordFrequency> = word_counts
        .into_iter()
        .take(8)
        .map(|(w, count)| {
            let percentage = if total_words > 0 {
                (count as f32 / total_words as f32) * 100.0
            } else {
                0.0
            };
            WordFrequency {
                word: w,
                count,
                percentage,
            }
        })
        .collect();

    // Reading & Speaking times
    // Silent reading ~225 wpm -> seconds = words * 60 / 225
    let reading_time_seconds = if total_words > 0 {
        ((total_words as f64 * 60.0) / 225.0).ceil() as usize
    } else {
        0
    };

    // Speaking ~140 wpm -> seconds = words * 60 / 140
    let speaking_time_seconds = if total_words > 0 {
        ((total_words as f64 * 60.0) / 140.0).ceil() as usize
    } else {
        0
    };

    TextStats {
        total_characters,
        characters_no_spaces,
        whitespace_count,
        non_ascii_count,
        digit_count,
        total_words,
        cjk_characters,
        total_lines,
        non_empty_lines,
        empty_lines,
        sentences_count,
        paragraphs_count,
        reading_time_seconds,
        reading_time_formatted: format_duration(reading_time_seconds),
        speaking_time_seconds,
        speaking_time_formatted: format_duration(speaking_time_seconds),
        top_words,
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TextSample {
    pub id: String,
    pub title: String,
    pub content: String,
}

pub fn get_text_samples() -> Vec<TextSample> {
    vec![
        TextSample {
            id: "bilingual-tech".to_string(),
            title: "中英双语技术文案 (Bilingual Architecture)".to_string(),
            content: "WebAssembly (WASM) 是一种基于栈式虚拟机的二进制指令格式。它被设计为高级编程语言（如 C, C++, Rust）的可移植编译目标，能够在网络中以近乎原生的速度在客户端和服务器环境中高效执行！\n\nWasmForge 实现了纯单一 WebAssembly 模块交付规范，无需任何胶水代码与外部导入。这使得 Rust 与 AssemblyScript 模块可以在 Node.js 和浏览器中无缝跨端运行。".to_string(),
        },
        TextSample {
            id: "english-article".to_string(),
            title: "英文技术简报 (English Tech Brief)".to_string(),
            content: "Modern software engineering emphasizes high reliability, zero-latency feedback loops, and robust sandboxing.\nBy adopting WebAssembly modules compiled directly from Rust, applications achieve predictable memory isolation and cross-platform determinism without relying on heavy container virtualizations.\nAre you ready for the next decade of cloud edge computing?".to_string(),
        },
    ]
}

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
        "text/stats" | "text/analyze" => {
            let text = req.params.get("text").and_then(|v| v.as_str()).unwrap_or("");
            let res = analyze_text(text);
            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(res),
            })
        }
        "text/samples" => {
            let samples = get_text_samples();
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
    fn test_text_stats_english() {
        let text = "Hello world! This is a test.";
        let stats = analyze_text(text);
        assert_eq!(stats.total_words, 6);
        assert_eq!(stats.sentences_count, 2);
        assert_eq!(stats.cjk_characters, 0);
    }

    #[test]
    fn test_text_stats_cjk() {
        let text = "你好，WebAssembly世界！";
        let stats = analyze_text(text);
        assert_eq!(stats.cjk_characters, 4); // 你 好 世 界
        assert_eq!(stats.total_words, 5); // 4 CJK + 1 Latin "WebAssembly"
    }

    #[test]
    fn test_empty_text() {
        let stats = analyze_text("");
        assert_eq!(stats.total_characters, 0);
        assert_eq!(stats.total_words, 0);
    }
}
