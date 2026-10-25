use core::slice;
use pulldown_cmark::{html, Event, Options, Parser, Tag};
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
pub struct RenderMarkdownParams {
    pub markdown: String,
    #[serde(default)]
    pub enable_tables: Option<bool>,
    #[serde(default)]
    pub enable_footnotes: Option<bool>,
    #[serde(default)]
    pub enable_strikethrough: Option<bool>,
    #[serde(default)]
    pub enable_tasklists: Option<bool>,
    #[serde(default)]
    pub enable_smart_punctuation: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MarkdownStats {
    pub headings_count: usize,
    pub links_count: usize,
    pub images_count: usize,
    pub code_blocks_count: usize,
    pub input_bytes: usize,
    pub output_bytes: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MarkdownRenderResult {
    pub markdown: String,
    pub html: String,
    pub stats: MarkdownStats,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MarkdownSampleResult {
    pub sample_markdown: String,
    pub converted: MarkdownRenderResult,
}

pub fn render_markdown(
    md: &str,
    enable_tables: bool,
    enable_footnotes: bool,
    enable_strikethrough: bool,
    enable_tasklists: bool,
    enable_smart_punctuation: bool,
) -> MarkdownRenderResult {
    let mut options = Options::empty();
    if enable_tables {
        options.insert(Options::ENABLE_TABLES);
    }
    if enable_footnotes {
        options.insert(Options::ENABLE_FOOTNOTES);
    }
    if enable_strikethrough {
        options.insert(Options::ENABLE_STRIKETHROUGH);
    }
    if enable_tasklists {
        options.insert(Options::ENABLE_TASKLISTS);
    }
    if enable_smart_punctuation {
        options.insert(Options::ENABLE_SMART_PUNCTUATION);
    }

    let parser = Parser::new_ext(md, options);

    let mut headings_count = 0;
    let mut links_count = 0;
    let mut images_count = 0;
    let mut code_blocks_count = 0;

    let events: Vec<Event> = parser
        .map(|event| {
            match &event {
                Event::Start(tag) => match tag {
                    Tag::Heading { .. } => headings_count += 1,
                    Tag::Link { .. } => links_count += 1,
                    Tag::Image { .. } => images_count += 1,
                    Tag::CodeBlock(..) => code_blocks_count += 1,
                    _ => {}
                },
                _ => {}
            }
            event
        })
        .collect();

    let mut html_output = String::new();
    html::push_html(&mut html_output, events.into_iter());

    let stats = MarkdownStats {
        headings_count,
        links_count,
        images_count,
        code_blocks_count,
        input_bytes: md.len(),
        output_bytes: html_output.len(),
    };

    MarkdownRenderResult {
        markdown: md.to_string(),
        html: html_output,
        stats,
    }
}

pub fn get_sample() -> MarkdownSampleResult {
    let sample_markdown = r#"# WasmForge Markdown Engine 🚀

A **pure standalone** WebAssembly Markdown parser built with `pulldown-cmark`.

## Features
- [x] CommonMark standard
- [x] GFM Tables
- [x] Strikethrough ~~deprecated~~
- [ ] Footnotes and more

| Component | Status | Speed |
| :--- | :--- | :--- |
| Core Parser | Active | Sub-millisecond |
| HTML Renderer | Ready | Instant |

Check out [GitHub](https://github.com/BIGMAX-RKO007/WasmForge) for more!
"#
    .to_string();

    let converted = render_markdown(&sample_markdown, true, true, true, true, true);

    MarkdownSampleResult {
        sample_markdown,
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
        "markdown/render" => {
            let params: RenderMarkdownParams = match req.params {
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

            let out = render_markdown(
                &params.markdown,
                params.enable_tables.unwrap_or(true),
                params.enable_footnotes.unwrap_or(true),
                params.enable_strikethrough.unwrap_or(true),
                params.enable_tasklists.unwrap_or(true),
                params.enable_smart_punctuation.unwrap_or(true),
            );

            let res = ResponseEnvelope {
                code: 0,
                msg: "Markdown 渲染成功".to_string(),
                request_id: req_id,
                data: Some(out),
            };
            serde_json::to_vec(&res).unwrap_or_default()
        }
        "markdown/sample" => {
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
    fn test_render_basic_markdown() {
        let md = "# Hello World\n\nThis is **bold** and *italic*.";
        let res = render_markdown(md, true, true, true, true, true);
        assert!(res.html.contains("<h1>Hello World</h1>"));
        assert!(res.html.contains("<strong>bold</strong>"));
        assert!(res.html.contains("<em>italic</em>"));
        assert_eq!(res.stats.headings_count, 1);
    }

    #[test]
    fn test_gfm_tables_and_tasklists() {
        let md = "| A | B |\n|---|---|\n| 1 | 2 |\n\n- [x] Done\n- [ ] Todo";
        let res = render_markdown(md, true, true, true, true, true);
        assert!(res.html.contains("<table>"));
        assert!(res.html.contains("disabled=\"\" type=\"checkbox\""));
    }
}
