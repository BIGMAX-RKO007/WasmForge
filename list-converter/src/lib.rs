use core::slice;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RequestEnvelope {
    pub action: String,
    #[serde(default)]
    pub request_id: Option<String>,
    #[serde(default)]
    pub params: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResponseEnvelope<T> {
    pub code: i32,
    pub msg: String,
    #[serde(default)]
    pub request_id: Option<String>,
    #[serde(default)]
    pub data: Option<T>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConvertListParams {
    pub input: String,
    #[serde(default)]
    pub sort: Option<String>, // "none" | "asc" | "desc" | "reverse"
    #[serde(default)]
    pub deduplicate: Option<bool>,
    #[serde(default)]
    pub trim: Option<bool>,
    #[serde(default)]
    pub remove_empty: Option<bool>,
    #[serde(default)]
    pub prefix: Option<String>,
    #[serde(default)]
    pub suffix: Option<String>,
    #[serde(default)]
    pub line_numbers: Option<bool>,
    #[serde(default)]
    pub join_delimiter: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListStats {
    pub initial_lines: usize,
    pub final_lines: usize,
    pub empty_removed: usize,
    pub duplicates_removed: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListConvertResult {
    pub output: String,
    pub lines: Vec<String>,
    pub stats: ListStats,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListSampleResult {
    pub sample_input: String,
    pub converted: ListConvertResult,
}

pub fn convert_list(params: &ConvertListParams) -> ListConvertResult {
    let raw = &params.input;
    let raw_lines: Vec<&str> = raw.split('\n').map(|l| l.strip_suffix('\r').unwrap_or(l)).collect();
    let initial_lines = raw_lines.len();

    let trim_enabled = params.trim.unwrap_or(true);
    let remove_empty_enabled = params.remove_empty.unwrap_or(true);
    let dedup_enabled = params.deduplicate.unwrap_or(false);

    let mut empty_removed = 0;
    let mut working_lines: Vec<String> = Vec::new();

    for l in raw_lines {
        let line = if trim_enabled { l.trim() } else { l };
        if remove_empty_enabled && line.is_empty() {
            empty_removed += 1;
            continue;
        }
        working_lines.push(line.to_string());
    }

    let mut duplicates_removed = 0;
    if dedup_enabled {
        let mut unique: Vec<String> = Vec::new();
        for item in working_lines {
            if !unique.contains(&item) {
                unique.push(item);
            } else {
                duplicates_removed += 1;
            }
        }
        working_lines = unique;
    }

    let sort_mode = params.sort.as_deref().unwrap_or("none");
    match sort_mode {
        "asc" => working_lines.sort(),
        "desc" => {
            working_lines.sort();
            working_lines.reverse();
        }
        "reverse" => working_lines.reverse(),
        _ => {}
    }

    let prefix_str = params.prefix.as_deref().unwrap_or("");
    let suffix_str = params.suffix.as_deref().unwrap_or("");
    let line_numbers = params.line_numbers.unwrap_or(false);

    let mut final_lines: Vec<String> = Vec::new();
    for (idx, line) in working_lines.into_iter().enumerate() {
        let num_prefix = if line_numbers {
            format!("{}. ", idx + 1)
        } else {
            String::new()
        };
        final_lines.push(format!("{}{}{}{}", num_prefix, prefix_str, line, suffix_str));
    }

    let join_delim = params.join_delimiter.as_deref().unwrap_or("\n");
    let output = final_lines.join(join_delim);

    let stats = ListStats {
        initial_lines,
        final_lines: final_lines.len(),
        empty_removed,
        duplicates_removed,
    };

    ListConvertResult {
        output,
        lines: final_lines,
        stats,
    }
}

pub fn get_sample() -> ListSampleResult {
    let sample_input = r#"Banana
Apple
Orange
Apple

Grape
Banana"#
        .to_string();

    let params = ConvertListParams {
        input: sample_input.clone(),
        sort: Some("asc".to_string()),
        deduplicate: Some(true),
        trim: Some(true),
        remove_empty: Some(true),
        prefix: Some("- ".to_string()),
        suffix: None,
        line_numbers: None,
        join_delimiter: Some("\n".to_string()),
    };

    let converted = convert_list(&params);

    ListSampleResult {
        sample_input,
        converted,
    }
}

pub fn handle_dispatch(in_bytes: &[u8]) -> Vec<u8> {
    let req: RequestEnvelope = match serde_json::from_slice(in_bytes) {
        Ok(v) => v,
        Err(e) => {
            let res = ResponseEnvelope::<()> {
                code: 400,
                msg: format!("请求信封反序列化失败: {}", e),
                request_id: None,
                data: None,
            };
            return serde_json::to_vec(&res).unwrap_or_default();
        }
    };

    let req_id = req.request_id.clone();

    match req.action.as_str() {
        "list/convert" => {
            let params: ConvertListParams = match req.params {
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

            let out = convert_list(&params);
            let res = ResponseEnvelope {
                code: 0,
                msg: "列表规整转换成功".to_string(),
                request_id: req_id,
                data: Some(out),
            };
            serde_json::to_vec(&res).unwrap_or_default()
        }
        "list/sample" => {
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
    fn test_list_sort_and_dedup() {
        let input = "banana\napple\nbanana\n\norange";
        let params = ConvertListParams {
            input: input.to_string(),
            sort: Some("asc".to_string()),
            deduplicate: Some(true),
            trim: Some(true),
            remove_empty: Some(true),
            prefix: Some("* ".to_string()),
            suffix: None,
            line_numbers: None,
            join_delimiter: Some("\n".to_string()),
        };
        let res = convert_list(&params);
        assert_eq!(res.lines, vec!["* apple", "* banana", "* orange"]);
        assert_eq!(res.stats.duplicates_removed, 1);
        assert_eq!(res.stats.empty_removed, 1);
    }

    #[test]
    fn test_line_numbers_and_comma_join() {
        let input = "one\ntwo\nthree";
        let params = ConvertListParams {
            input: input.to_string(),
            sort: None,
            deduplicate: None,
            trim: None,
            remove_empty: None,
            prefix: None,
            suffix: None,
            line_numbers: Some(true),
            join_delimiter: Some(", ".to_string()),
        };
        let res = convert_list(&params);
        assert_eq!(res.output, "1. one, 2. two, 3. three");
    }
}
