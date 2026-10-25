use core::slice;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct RequestEnvelope {
    action: String,
    #[serde(rename = "requestId")]
    request_id: Option<String>,
    params: Option<serde_json::Value>,
}

#[derive(Serialize)]
struct ResponseEnvelope<T: Serialize> {
    code: i32,
    msg: String,
    #[serde(rename = "requestId")]
    request_id: Option<String>,
    data: Option<T>,
}

#[derive(Deserialize)]
struct ConvertCaseParams {
    input: String,
}

#[derive(Serialize, Clone, Debug)]
pub struct CaseResult {
    pub original: String,
    pub words: Vec<String>,
    #[serde(rename = "camelCase")]
    pub camel_case: String,
    #[serde(rename = "pascalCase")]
    pub pascal_case: String,
    #[serde(rename = "snakeCase")]
    pub snake_case: String,
    #[serde(rename = "screamingSnakeCase")]
    pub screaming_snake_case: String,
    #[serde(rename = "kebabCase")]
    pub kebab_case: String,
    #[serde(rename = "screamingKebabCase")]
    pub screaming_kebab_case: String,
    #[serde(rename = "titleCase")]
    pub title_case: String,
    #[serde(rename = "sentenceCase")]
    pub sentence_case: String,
    #[serde(rename = "lowerCase")]
    pub lower_case: String,
    #[serde(rename = "upperCase")]
    pub upper_case: String,
    #[serde(rename = "dotCase")]
    pub dot_case: String,
    #[serde(rename = "pathCase")]
    pub path_case: String,
}

#[derive(Serialize)]
pub struct SampleResult {
    pub sample: String,
    pub converted: CaseResult,
}

// ---------------- Tokenization & Casing Algorithms ----------------

pub fn tokenize(input: &str) -> Vec<String> {
    let mut words = Vec::new();
    let mut current = String::new();
    let chars: Vec<char> = input.chars().collect();
    let len = chars.len();

    let mut i = 0;
    while i < len {
        let c = chars[i];

        if !c.is_alphanumeric() {
            if !current.is_empty() {
                words.push(core::mem::take(&mut current));
            }
            i += 1;
            continue;
        }

        // Check for uppercase transitions
        if c.is_uppercase() {
            // Case 1: lowercase followed by uppercase (e.g., 'aB' in 'fooBar')
            if !current.is_empty() && chars[i - 1].is_lowercase() {
                words.push(core::mem::take(&mut current));
            }
            // Case 2: consecutive uppercase followed by lowercase (e.g., 'LP' in 'HTMLParser' -> split before 'P')
            else if !current.is_empty()
                && chars[i - 1].is_uppercase()
                && i + 1 < len
                && chars[i + 1].is_lowercase()
            {
                words.push(core::mem::take(&mut current));
            }
        }

        current.push(c);
        i += 1;
    }

    if !current.is_empty() {
        words.push(current);
    }

    words
}

fn capitalize(s: &str) -> String {
    let mut chars = s.chars();
    match chars.next() {
        None => String::new(),
        Some(first) => first.to_uppercase().collect::<String>() + &chars.as_str().to_lowercase(),
    }
}

pub fn convert_cases(input: &str) -> CaseResult {
    let raw_words = tokenize(input);
    let lower_words: Vec<String> = raw_words.iter().map(|w| w.to_lowercase()).collect();

    if lower_words.is_empty() {
        return CaseResult {
            original: input.to_string(),
            words: Vec::new(),
            camel_case: String::new(),
            pascal_case: String::new(),
            snake_case: String::new(),
            screaming_snake_case: String::new(),
            kebab_case: String::new(),
            screaming_kebab_case: String::new(),
            title_case: String::new(),
            sentence_case: String::new(),
            lower_case: String::new(),
            upper_case: String::new(),
            dot_case: String::new(),
            path_case: String::new(),
        };
    }

    // 1. camelCase: word0 lowercase, word1.. capitalized
    let mut camel = lower_words[0].clone();
    for w in &lower_words[1..] {
        camel.push_str(&capitalize(w));
    }

    // 2. PascalCase: all capitalized
    let pascal = lower_words.iter().map(|w| capitalize(w)).collect::<Vec<_>>().join("");

    // 3. snake_case
    let snake = lower_words.join("_");

    // 4. SCREAMING_SNAKE_CASE
    let screaming_snake = lower_words.iter().map(|w| w.to_uppercase()).collect::<Vec<_>>().join("_");

    // 5. kebab-case
    let kebab = lower_words.join("-");

    // 6. SCREAMING-KEBAB-CASE
    let screaming_kebab = lower_words.iter().map(|w| w.to_uppercase()).collect::<Vec<_>>().join("-");

    // 7. Title Case
    let title = lower_words.iter().map(|w| capitalize(w)).collect::<Vec<_>>().join(" ");

    // 8. Sentence case: word0 capitalized, remaining lowercase
    let mut sentence = capitalize(&lower_words[0]);
    if lower_words.len() > 1 {
        sentence.push(' ');
        sentence.push_str(&lower_words[1..].join(" "));
    }

    // 9. lower case
    let lower = lower_words.join(" ");

    // 10. UPPER CASE
    let upper = lower_words.iter().map(|w| w.to_uppercase()).collect::<Vec<_>>().join(" ");

    // 11. dot.case
    let dot = lower_words.join(".");

    // 12. path/case
    let path = lower_words.join("/");

    CaseResult {
        original: input.to_string(),
        words: lower_words,
        camel_case: camel,
        pascal_case: pascal,
        snake_case: snake,
        screaming_snake_case: screaming_snake,
        kebab_case: kebab,
        screaming_kebab_case: screaming_kebab,
        title_case: title,
        sentence_case: sentence,
        lower_case: lower,
        upper_case: upper,
        dot_case: dot,
        path_case: path,
    }
}

pub fn get_sample() -> SampleResult {
    let sample = "wasmForge_universalEnvelope-protocol v2".to_string();
    let converted = convert_cases(&sample);
    SampleResult { sample, converted }
}

fn handle_dispatch(payload: &[u8]) -> Vec<u8> {
    let req: RequestEnvelope = match serde_json::from_slice(payload) {
        Ok(r) => r,
        Err(e) => {
            let res = ResponseEnvelope::<()> {
                code: 400,
                msg: format!("请求 JSON 解析失败: {}", e),
                request_id: None,
                data: None,
            };
            return serde_json::to_vec(&res).unwrap_or_default();
        }
    };

    let req_id = req.request_id.clone();

    match req.action.as_str() {
        "case/convert" => {
            let params: ConvertCaseParams = match req.params {
                Some(p) => match serde_json::from_value(p) {
                    Ok(val) => val,
                    Err(e) => {
                        let res = ResponseEnvelope::<()> {
                            code: 400,
                            msg: format!("参数解析失败: {}", e),
                            request_id: req_id,
                            data: None,
                        };
                        return serde_json::to_vec(&res).unwrap_or_default();
                    }
                },
                None => {
                    let res = ResponseEnvelope::<()> {
                        code: 400,
                        msg: "缺少 params 参数".to_string(),
                        request_id: req_id,
                        data: None,
                    };
                    return serde_json::to_vec(&res).unwrap_or_default();
                }
            };

            let out = convert_cases(&params.input);
            let res = ResponseEnvelope {
                code: 0,
                msg: "命名转换成功".to_string(),
                request_id: req_id,
                data: Some(out),
            };
            serde_json::to_vec(&res).unwrap_or_default()
        }
        "case/sample" => {
            let sample = get_sample();
            let res = ResponseEnvelope {
                code: 0,
                msg: "获取示例成功".to_string(),
                request_id: req_id,
                data: Some(sample),
            };
            serde_json::to_vec(&res).unwrap_or_default()
        }
        other => {
            let res = ResponseEnvelope::<()> {
                code: 404,
                msg: format!("未知 Action: {}", other),
                request_id: req_id,
                data: None,
            };
            serde_json::to_vec(&res).unwrap_or_default()
        }
    }
}

// ================= Standard WasmForge C-ABI Exports =================

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
    fn test_tokenization() {
        let words = tokenize("helloWorld_foo-bar HTMLParser 123");
        assert_eq!(words, vec!["hello", "World", "foo", "bar", "HTML", "Parser", "123"]);
    }

    #[test]
    fn test_case_conversion() {
        let res = convert_cases("hello_world_fooBar");
        assert_eq!(res.camel_case, "helloWorldFooBar");
        assert_eq!(res.pascal_case, "HelloWorldFooBar");
        assert_eq!(res.snake_case, "hello_world_foo_bar");
        assert_eq!(res.screaming_snake_case, "HELLO_WORLD_FOO_BAR");
        assert_eq!(res.kebab_case, "hello-world-foo-bar");
        assert_eq!(res.title_case, "Hello World Foo Bar");
        assert_eq!(res.dot_case, "hello.world.foo.bar");
    }

    #[test]
    fn test_sample() {
        let sample = get_sample();
        assert_eq!(sample.converted.kebab_case, "wasm-forge-universal-envelope-protocol-v2");
    }
}
