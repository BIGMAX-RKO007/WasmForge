extern crate alloc;

use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec;
use alloc::vec::Vec;
use core::slice;
use serde::{Deserialize, Serialize};

const LATIN_WORDS: &[&str] = &[
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do",
    "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua", "enim",
    "ad", "minim", "veniam", "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "aliquip",
    "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
    "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint", "occaecat", "cupidatat",
    "non", "proident", "sunt", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id",
    "est", "laborum", "at", "vero", "eos", "accusamus", "iusto", "odio", "dignissimos", "ducimus",
    "blanditiis", "praesentium", "voluptatum", "deleniti", "atque", "corrupti", "quos", "dolores", "quas",
    "molestias", "excepturi", "obcaecati", "cupiditate", "provident", "similique", "sunt", "in", "culpa",
    "qui", "officia", "deserunt", "mollitia", "animi", "id", "est", "laborum", "et", "dolorum",
    "fuga", "harum", "quidem", "rerum", "facilis", "expedita", "distinctio", "nam", "libero", "tempore",
    "cum", "soluta", "nobis", "eligendi", "optio", "cumque", "nihil", "impedit", "quo", "minus",
    "quod", "maxime", "placeat", "facere", "possimus", "omnis", "voluptas", "assumenda", "est", "omnis",
    "dolor", "repellendus", "temporibus", "autem", "quibusdam", "officiis", "debitis", "aut", "rerum",
    "necessitatibus", "saepe", "eveniet", "voluptates", "repudiandae", "sint", "molestiae", "non", "recusandae",
    "itaque", "earum", "rerum", "hic", "tenetur", "a", "sapiente", "delectus", "reiciendis", "voluptatibus",
    "maiores", "alias", "consequatur", "aut", "perferendis", "doloribus", "asperiores", "repellat",
    "aenean", "imperdiet", "phasellus", "viverra", "congue", "pellentesque", "habitant", "morbi", "tristique",
    "senectus", "netus", "fames", "turpis", "egestas", "vestibulum", "tortor", "quam", "feugiat", "vitae",
    "ultricies", "eget", "tempor", "sit", "amet", "ante", "donec", "eu", "libero", "sit",
    "amet", "quam", "egestas", "semper", "aenean", "ultricies", "mi", "vitae", "est", "mauris",
    "placerat", "eleifend", "leo", "quisque", "fermentum", "convallis", "nisl", "curabitur", "laoreet",
];

const STANDARD_LOREM_PREFIX: &str = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

struct XorShiftPrng {
    state: u64,
}

impl XorShiftPrng {
    fn new(seed: u64) -> Self {
        let s = if seed == 0 { 0x853c49e6748fea9b } else { seed };
        Self { state: s }
    }

    fn next_u32(&mut self) -> u32 {
        self.state ^= self.state << 13;
        self.state ^= self.state >> 7;
        self.state ^= self.state << 17;
        (self.state & 0xffffffff) as u32
    }

    fn gen_range(&mut self, min: usize, max: usize) -> usize {
        if min >= max {
            return min;
        }
        let diff = max - min + 1;
        min + (self.next_u32() as usize % diff)
    }

    fn pick_word(&mut self) -> &'static str {
        let idx = (self.next_u32() as usize) % LATIN_WORDS.len();
        LATIN_WORDS[idx]
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoremOptions {
    #[serde(default = "default_unit")]
    pub unit: String,
    #[serde(default = "default_count")]
    pub count: usize,
    #[serde(rename = "startWithLorem", default = "default_true")]
    pub start_with_lorem: bool,
    #[serde(default = "default_format")]
    pub format: String,
    pub seed: Option<u64>,
}

fn default_unit() -> String {
    "paragraphs".to_string()
}
fn default_count() -> usize {
    3
}
fn default_true() -> bool {
    true
}
fn default_format() -> String {
    "plain".to_string()
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoremResult {
    pub text: String,
    #[serde(rename = "paragraphsCount")]
    pub paragraphs_count: usize,
    #[serde(rename = "sentencesCount")]
    pub sentences_count: usize,
    #[serde(rename = "wordsCount")]
    pub words_count: usize,
    #[serde(rename = "bytesCount")]
    pub bytes_count: usize,
    pub format: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PresetOption {
    pub id: String,
    pub name: String,
    pub unit: String,
    pub count: usize,
    pub format: String,
}

fn generate_sentence(prng: &mut XorShiftPrng) -> String {
    let word_count = prng.gen_range(6, 14);
    let mut words = Vec::with_capacity(word_count);

    for i in 0..word_count {
        let w = prng.pick_word();
        if i == 0 {
            // Capitalize first letter
            let mut c = w.chars();
            match c.next() {
                None => words.push(String::new()),
                Some(f) => words.push(f.to_uppercase().collect::<String>() + c.as_str()),
            }
        } else {
            words.push(w.to_string());
        }
    }

    // Occasionally insert a comma if sentence is long enough
    if word_count > 7 && prng.gen_range(0, 100) < 40 {
        let comma_pos = prng.gen_range(2, word_count - 3);
        words[comma_pos].push(',');
    }

    format!("{}.", words.join(" "))
}

fn generate_paragraph(prng: &mut XorShiftPrng, sentence_count: usize) -> String {
    let mut sentences = Vec::with_capacity(sentence_count);
    for _ in 0..sentence_count {
        sentences.push(generate_sentence(prng));
    }
    sentences.join(" ")
}

pub fn generate_lorem(opts: &LoremOptions) -> LoremResult {
    let seed = opts.seed.unwrap_or(424242);
    let mut prng = XorShiftPrng::new(seed);

    let count = opts.count.max(1);
    let unit = opts.unit.to_lowercase();
    let format = opts.format.to_lowercase();

    let mut paragraphs = Vec::new();

    match unit.as_str() {
        "words" => {
            let mut words = Vec::with_capacity(count);
            if opts.start_with_lorem {
                let init = ["Lorem", "ipsum", "dolor", "sit", "amet,", "consectetur", "adipiscing", "elit"];
                for &w in init.iter().take(count) {
                    words.push(w.to_string());
                }
            }
            while words.len() < count {
                let w = prng.pick_word();
                if words.is_empty() {
                    let mut c = w.chars();
                    let cap = match c.next() {
                        None => String::new(),
                        Some(f) => f.to_uppercase().collect::<String>() + c.as_str(),
                    };
                    words.push(cap);
                } else {
                    words.push(w.to_string());
                }
            }
            paragraphs.push(words.join(" "));
        }
        "sentences" => {
            let mut sentences = Vec::with_capacity(count);
            if opts.start_with_lorem {
                sentences.push("Lorem ipsum dolor sit amet, consectetur adipiscing elit.".to_string());
            }
            while sentences.len() < count {
                sentences.push(generate_sentence(&mut prng));
            }
            paragraphs.push(sentences.join(" "));
        }
        "bytes" => {
            // Generate until target byte size
            let mut acc = String::new();
            if opts.start_with_lorem {
                acc.push_str(STANDARD_LOREM_PREFIX);
            }
            while acc.len() < count {
                acc.push_str("\n\n");
                let s_count = prng.gen_range(3, 6);
                acc.push_str(&generate_paragraph(&mut prng, s_count));
            }
            acc.truncate(count);
            // Ensure no split multi-byte UTF-8
            while !acc.is_char_boundary(acc.len()) {
                acc.pop();
            }
            return LoremResult {
                bytes_count: acc.len(),
                words_count: acc.split_whitespace().count(),
                sentences_count: acc.matches('.').count(),
                paragraphs_count: acc.split("\n\n").count(),
                format: "plain".to_string(),
                text: acc,
            };
        }
        _ => {
            // Paragraphs (default)
            let p_count = count.min(50);
            for i in 0..p_count {
                if i == 0 && opts.start_with_lorem {
                    let extra = generate_paragraph(&mut prng, 3);
                    paragraphs.push(format!("{} {}", STANDARD_LOREM_PREFIX, extra));
                } else {
                    let s_count = prng.gen_range(4, 7);
                    paragraphs.push(generate_paragraph(&mut prng, s_count));
                }
            }
        }
    }

    let final_text = match format.as_str() {
        "html" => {
            if unit == "words" {
                format!("<p>{}</p>", paragraphs.join(" "))
            } else {
                paragraphs.iter().map(|p| format!("<p>{}</p>", p)).collect::<Vec<_>>().join("\n")
            }
        }
        "markdown" => paragraphs.join("\n\n"),
        "json" => serde_json::to_string_pretty(&paragraphs).unwrap_or_else(|_| "[]".to_string()),
        _ => paragraphs.join("\n\n"),
    };

    let words_count = final_text.split_whitespace().count();
    let sentences_count = final_text.matches('.').count();
    let paragraphs_count = paragraphs.len();
    let bytes_count = final_text.len();

    LoremResult {
        text: final_text,
        paragraphs_count,
        sentences_count,
        words_count,
        bytes_count,
        format,
    }
}

pub fn get_presets() -> Vec<PresetOption> {
    vec![
        PresetOption {
            id: "standard-3p".to_string(),
            name: "标准经典 3 段落 (3 Paragraphs)".to_string(),
            unit: "paragraphs".to_string(),
            count: 3,
            format: "plain".to_string(),
        },
        PresetOption {
            id: "html-lead".to_string(),
            name: "HTML 带标记段落 (HTML Tags)".to_string(),
            unit: "paragraphs".to_string(),
            count: 2,
            format: "html".to_string(),
        },
        PresetOption {
            id: "short-50w".to_string(),
            name: "简短 50 词 (50 Words)".to_string(),
            unit: "words".to_string(),
            count: 50,
            format: "plain".to_string(),
        },
        PresetOption {
            id: "json-array".to_string(),
            name: "JSON 格式字符串数组 (JSON Array)".to_string(),
            unit: "paragraphs".to_string(),
            count: 4,
            format: "json".to_string(),
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
        "lorem/generate" => {
            let opts: LoremOptions = serde_json::from_value(req.params).unwrap_or(LoremOptions {
                unit: default_unit(),
                count: default_count(),
                start_with_lorem: true,
                format: default_format(),
                seed: None,
            });

            let res = generate_lorem(&opts);

            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(res),
            })
        }
        "lorem/presets" | "lorem/samples" => {
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
    fn test_generate_paragraphs() {
        let opts = LoremOptions {
            unit: "paragraphs".to_string(),
            count: 3,
            start_with_lorem: true,
            format: "plain".to_string(),
            seed: Some(12345),
        };
        let res = generate_lorem(&opts);
        assert_eq!(res.paragraphs_count, 3);
        assert!(res.text.starts_with("Lorem ipsum dolor sit amet"));
        assert!(res.words_count > 50);
    }

    #[test]
    fn test_generate_words() {
        let opts = LoremOptions {
            unit: "words".to_string(),
            count: 25,
            start_with_lorem: true,
            format: "plain".to_string(),
            seed: Some(12345),
        };
        let res = generate_lorem(&opts);
        assert_eq!(res.words_count, 25);
        assert!(res.text.starts_with("Lorem ipsum"));
    }

    #[test]
    fn test_html_format() {
        let opts = LoremOptions {
            unit: "paragraphs".to_string(),
            count: 2,
            start_with_lorem: false,
            format: "html".to_string(),
            seed: Some(999),
        };
        let res = generate_lorem(&opts);
        assert!(res.text.starts_with("<p>"));
        assert!(res.text.ends_with("</p>"));
    }
}
