extern crate alloc;

use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec;
use alloc::vec::Vec;
use core::slice;
use serde::{Deserialize, Serialize};

fn escape_attr(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 10);
    for ch in s.chars() {
        match ch {
            '&' => out.push_str("&amp;"),
            '"' => out.push_str("&quot;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            other => out.push(other),
        }
    }
    out
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct OpenGraphParams {
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub url: String,
    #[serde(default)]
    pub image: String,
    #[serde(default, rename = "imageAlt")]
    pub image_alt: String,
    #[serde(default, rename = "siteName")]
    pub site_name: String,
    #[serde(default = "default_og_type", rename = "ogType")]
    pub og_type: String, // "website" | "article" | "profile"
    #[serde(default = "default_twitter_card", rename = "twitterCard")]
    pub twitter_card: String, // "summary_large_image" | "summary"
    #[serde(default, rename = "twitterSite")]
    pub twitter_site: String,
    #[serde(default, rename = "twitterCreator")]
    pub twitter_creator: String,
    #[serde(default = "default_locale")]
    pub locale: String,
}

fn default_og_type() -> String {
    "website".to_string()
}

fn default_twitter_card() -> String {
    "summary_large_image".to_string()
}

fn default_locale() -> String {
    "zh_CN".to_string()
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MetaTagEntry {
    #[serde(rename = "keyType")]
    pub key_type: String, // "property" | "name"
    pub key: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SocialPreview {
    pub title: String,
    pub description: String,
    pub domain: String,
    pub url: String,
    pub image: String,
    #[serde(rename = "imageAlt")]
    pub image_alt: String,
    #[serde(rename = "siteName")]
    pub site_name: String,
    #[serde(rename = "cardType")]
    pub card_type: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OpenGraphResult {
    #[serde(rename = "metaTagsHtml")]
    pub meta_tags_html: String,
    #[serde(rename = "metaTagsArray")]
    pub meta_tags_array: Vec<MetaTagEntry>,
    #[serde(rename = "jsonLdHtml")]
    pub json_ld_html: String,
    pub preview: SocialPreview,
    #[serde(rename = "tagsCount")]
    pub tags_count: usize,
}

fn extract_domain(url: &str) -> String {
    if let Some(pos) = url.find("://") {
        let after_scheme = &url[pos + 3..];
        let host = after_scheme.split('/').next().unwrap_or(after_scheme);
        return host.split(':').next().unwrap_or(host).to_string();
    }
    url.split('/').next().unwrap_or(url).to_string()
}

pub fn generate_open_graph(p: &OpenGraphParams) -> OpenGraphResult {
    let mut tags = Vec::new();

    // Standard HTML
    if !p.title.is_empty() {
        tags.push(MetaTagEntry {
            key_type: "name".to_string(),
            key: "title".to_string(),
            content: p.title.clone(),
        });
    }
    if !p.description.is_empty() {
        tags.push(MetaTagEntry {
            key_type: "name".to_string(),
            key: "description".to_string(),
            content: p.description.clone(),
        });
    }

    // Open Graph
    tags.push(MetaTagEntry {
        key_type: "property".to_string(),
        key: "og:type".to_string(),
        content: if p.og_type.is_empty() { "website".to_string() } else { p.og_type.clone() },
    });
    if !p.url.is_empty() {
        tags.push(MetaTagEntry {
            key_type: "property".to_string(),
            key: "og:url".to_string(),
            content: p.url.clone(),
        });
    }
    if !p.title.is_empty() {
        tags.push(MetaTagEntry {
            key_type: "property".to_string(),
            key: "og:title".to_string(),
            content: p.title.clone(),
        });
    }
    if !p.description.is_empty() {
        tags.push(MetaTagEntry {
            key_type: "property".to_string(),
            key: "og:description".to_string(),
            content: p.description.clone(),
        });
    }
    if !p.image.is_empty() {
        tags.push(MetaTagEntry {
            key_type: "property".to_string(),
            key: "og:image".to_string(),
            content: p.image.clone(),
        });
    }
    if !p.image_alt.is_empty() {
        tags.push(MetaTagEntry {
            key_type: "property".to_string(),
            key: "og:image:alt".to_string(),
            content: p.image_alt.clone(),
        });
    }
    if !p.site_name.is_empty() {
        tags.push(MetaTagEntry {
            key_type: "property".to_string(),
            key: "og:site_name".to_string(),
            content: p.site_name.clone(),
        });
    }
    if !p.locale.is_empty() {
        tags.push(MetaTagEntry {
            key_type: "property".to_string(),
            key: "og:locale".to_string(),
            content: p.locale.clone(),
        });
    }

    // Twitter Card
    tags.push(MetaTagEntry {
        key_type: "name".to_string(),
        key: "twitter:card".to_string(),
        content: if p.twitter_card.is_empty() { "summary_large_image".to_string() } else { p.twitter_card.clone() },
    });
    if !p.url.is_empty() {
        tags.push(MetaTagEntry {
            key_type: "property".to_string(),
            key: "twitter:url".to_string(),
            content: p.url.clone(),
        });
    }
    if !p.title.is_empty() {
        tags.push(MetaTagEntry {
            key_type: "name".to_string(),
            key: "twitter:title".to_string(),
            content: p.title.clone(),
        });
    }
    if !p.description.is_empty() {
        tags.push(MetaTagEntry {
            key_type: "name".to_string(),
            key: "twitter:description".to_string(),
            content: p.description.clone(),
        });
    }
    if !p.image.is_empty() {
        tags.push(MetaTagEntry {
            key_type: "name".to_string(),
            key: "twitter:image".to_string(),
            content: p.image.clone(),
        });
    }
    if !p.image_alt.is_empty() {
        tags.push(MetaTagEntry {
            key_type: "name".to_string(),
            key: "twitter:image:alt".to_string(),
            content: p.image_alt.clone(),
        });
    }
    if !p.twitter_site.is_empty() {
        tags.push(MetaTagEntry {
            key_type: "name".to_string(),
            key: "twitter:site".to_string(),
            content: p.twitter_site.clone(),
        });
    }
    if !p.twitter_creator.is_empty() {
        tags.push(MetaTagEntry {
            key_type: "name".to_string(),
            key: "twitter:creator".to_string(),
            content: p.twitter_creator.clone(),
        });
    }

    // Assemble HTML
    let mut html_lines = Vec::new();
    html_lines.push("<!-- Primary Meta Tags -->".to_string());
    if !p.title.is_empty() {
        html_lines.push(format!("<title>{}</title>", escape_attr(&p.title)));
    }
    html_lines.push(format!("<meta name=\"title\" content=\"{}\">", escape_attr(&p.title)));
    html_lines.push(format!("<meta name=\"description\" content=\"{}\">", escape_attr(&p.description)));

    html_lines.push("\n<!-- Open Graph / Facebook -->".to_string());
    for t in &tags {
        if t.key.starts_with("og:") {
            html_lines.push(format!("<meta property=\"{}\" content=\"{}\">", t.key, escape_attr(&t.content)));
        }
    }

    html_lines.push("\n<!-- Twitter -->".to_string());
    for t in &tags {
        if t.key.starts_with("twitter:") {
            html_lines.push(format!("<meta name=\"{}\" content=\"{}\">", t.key, escape_attr(&t.content)));
        }
    }

    let meta_tags_html = html_lines.join("\n");
    let tags_count = tags.len();

    // JSON-LD Structured Data
    let schema_type = if p.og_type == "article" { "Article" } else { "WebSite" };
    let json_ld_obj = serde_json::json!({
        "@context": "https://schema.org",
        "@type": schema_type,
        "name": p.title,
        "headline": p.title,
        "description": p.description,
        "url": p.url,
        "image": p.image,
    });
    let json_ld_str = serde_json::to_string_pretty(&json_ld_obj).unwrap_or_default();
    let json_ld_html = format!("<script type=\"application/ld+json\">\n{}\n</script>", json_ld_str);

    let domain = extract_domain(&p.url);

    let preview = SocialPreview {
        title: p.title.clone(),
        description: p.description.clone(),
        domain,
        url: p.url.clone(),
        image: p.image.clone(),
        image_alt: p.image_alt.clone(),
        site_name: p.site_name.clone(),
        card_type: p.twitter_card.clone(),
    };

    OpenGraphResult {
        meta_tags_html,
        meta_tags_array: tags,
        json_ld_html,
        preview,
        tags_count,
    }
}

#[derive(Debug, Serialize)]
pub struct OgPreset {
    pub id: &'static str,
    pub name: &'static str,
    pub params: OpenGraphParams,
}

pub fn get_presets() -> Vec<OgPreset> {
    vec![
        OgPreset {
            id: "article-post",
            name: "技术深度长文",
            params: OpenGraphParams {
                title: "构建工业级纯单一文件 WebAssembly 架构实践".to_string(),
                description: "深入解析 WasmForge 的通用封装协议、无 glue 纯单一文件 C-ABI 导出与双运行时落地方案。".to_string(),
                url: "https://wasmforge.dev/blog/industrial-wasm-architecture".to_string(),
                image: "https://wasmforge.dev/images/covers/wasm-guide.png".to_string(),
                image_alt: "WasmForge 架构技术示意图".to_string(),
                site_name: "WasmForge 开发者专栏".to_string(),
                og_type: "article".to_string(),
                twitter_card: "summary_large_image".to_string(),
                twitter_site: "@wasmforge".to_string(),
                twitter_creator: "@chief_architect".to_string(),
                locale: "zh_CN".to_string(),
            },
        },
        OgPreset {
            id: "product-landing",
            name: "产品落地页 (SaaS Landing Page)",
            params: OpenGraphParams {
                title: "WasmForge — 85 大工业级全栈开发者工具箱".to_string(),
                description: "涵盖加密安全、编码转换、网络诊断与代码工程的纯 WebAssembly 极速工具套件。".to_string(),
                url: "https://wasmforge.dev".to_string(),
                image: "https://wasmforge.dev/images/og-main.png".to_string(),
                image_alt: "WasmForge 85 Tools Banner".to_string(),
                site_name: "WasmForge".to_string(),
                og_type: "website".to_string(),
                twitter_card: "summary_large_image".to_string(),
                twitter_site: "@wasmforge".to_string(),
                twitter_creator: "@wasmforge".to_string(),
                locale: "zh_CN".to_string(),
            },
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
        "open-graph/generate" => {
            let params: OpenGraphParams = match serde_json::from_value(req.params) {
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

            let res = generate_open_graph(&params);

            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(res),
            })
        }
        "open-graph/presets" => {
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
    fn test_generate_open_graph() {
        let params = OpenGraphParams {
            title: "Test Article".to_string(),
            description: "A great piece of content".to_string(),
            url: "https://example.com/test".to_string(),
            image: "https://example.com/og.jpg".to_string(),
            image_alt: "Test Image".to_string(),
            site_name: "Example Site".to_string(),
            og_type: "article".to_string(),
            twitter_card: "summary_large_image".to_string(),
            twitter_site: "@example".to_string(),
            twitter_creator: "@author".to_string(),
            locale: "en_US".to_string(),
        };

        let res = generate_open_graph(&params);
        assert!(res.meta_tags_html.contains("<meta property=\"og:title\" content=\"Test Article\">"));
        assert!(res.meta_tags_html.contains("<meta name=\"twitter:card\" content=\"summary_large_image\">"));
        assert_eq!(res.preview.domain, "example.com");
        assert!(res.json_ld_html.contains("\"@type\": \"Article\""));
        assert!(res.tags_count >= 14);
    }
}
