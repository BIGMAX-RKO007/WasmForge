extern crate alloc;

use alloc::string::{String, ToString};
use alloc::vec;
use alloc::vec::Vec;
use core::slice;
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

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RegexMemoItem {
    pub id: String,
    pub category: String,
    pub category_name: String,
    pub token: String,
    pub name: String,
    pub description: String,
    pub example: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoListResult {
    pub total: usize,
    pub categories: Vec<String>,
    pub items: Vec<RegexMemoItem>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoSearchResult {
    pub query: String,
    pub category: Option<String>,
    pub match_count: usize,
    pub matches: Vec<RegexMemoItem>,
}

fn get_memo_database() -> Vec<RegexMemoItem> {
    vec![
        // 1. 字符类 (Character Classes)
        RegexMemoItem {
            id: "char-dot".to_string(),
            category: "characters".to_string(),
            category_name: "字符集 (Character Classes)".to_string(),
            token: ".".to_string(),
            name: "任意单个字符".to_string(),
            description: "匹配除换行符(\\n, \\r)之外的任意单个字符。在单行模式(s)下亦可匹配换行符。".to_string(),
            example: "a.c 匹配 'abc', 'a-c', 'a9c'".to_string(),
        },
        RegexMemoItem {
            id: "char-digit".to_string(),
            category: "characters".to_string(),
            category_name: "字符集 (Character Classes)".to_string(),
            token: r"\d".to_string(),
            name: "数字字符".to_string(),
            description: "等价于 [0-9]，匹配任意十进制数字。".to_string(),
            example: r"\d{3} 匹配 '123', '987'".to_string(),
        },
        RegexMemoItem {
            id: "char-non-digit".to_string(),
            category: "characters".to_string(),
            category_name: "字符集 (Character Classes)".to_string(),
            token: r"\D".to_string(),
            name: "非数字字符".to_string(),
            description: "等价于 [^0-9]，匹配任意非数字字符。".to_string(),
            example: r"\D+ 匹配 'hello', 'Rust'".to_string(),
        },
        RegexMemoItem {
            id: "char-word".to_string(),
            category: "characters".to_string(),
            category_name: "字符集 (Character Classes)".to_string(),
            token: r"\w".to_string(),
            name: "单字字符 (单词字符)".to_string(),
            description: "等价于 [a-zA-Z0-9_]，包含字母、数字及下划线。".to_string(),
            example: r"\w+ 匹配 'user_name_123'".to_string(),
        },
        RegexMemoItem {
            id: "char-non-word".to_string(),
            category: "characters".to_string(),
            category_name: "字符集 (Character Classes)".to_string(),
            token: r"\W".to_string(),
            name: "非单字字符".to_string(),
            description: "等价于 [^a-zA-Z0-9_]，匹配标点符号、空格与特殊符号。".to_string(),
            example: r"\W 匹配 '@', '#', '!'".to_string(),
        },
        RegexMemoItem {
            id: "char-space".to_string(),
            category: "characters".to_string(),
            category_name: "字符集 (Character Classes)".to_string(),
            token: r"\s".to_string(),
            name: "空白字符".to_string(),
            description: "匹配空格、制表符(\\t)、换页符(\\f)及换行符(\\n)。".to_string(),
            example: r"hello\sworld 匹配 'hello world'".to_string(),
        },
        RegexMemoItem {
            id: "char-non-space".to_string(),
            category: "characters".to_string(),
            category_name: "字符集 (Character Classes)".to_string(),
            token: r"\S".to_string(),
            name: "非空白字符".to_string(),
            description: "等价于 [^\\s]，匹配除所有空白字符之外的任意可见字符。".to_string(),
            example: r"\S+ 匹配 'WasmForge'".to_string(),
        },
        RegexMemoItem {
            id: "char-set".to_string(),
            category: "characters".to_string(),
            category_name: "字符集 (Character Classes)".to_string(),
            token: "[abc]".to_string(),
            name: "自定义字符枚举集".to_string(),
            description: "匹配方括号内的任意单个指定字符。".to_string(),
            example: "[aeiou] 匹配任意单个小写元音字母".to_string(),
        },
        RegexMemoItem {
            id: "char-neg-set".to_string(),
            category: "characters".to_string(),
            category_name: "字符集 (Character Classes)".to_string(),
            token: "[^abc]".to_string(),
            name: "否定排除字符集".to_string(),
            description: "匹配除方括号内字符之外的任意字符。".to_string(),
            example: "[^0-9] 匹配任意非数字字符".to_string(),
        },
        RegexMemoItem {
            id: "char-range".to_string(),
            category: "characters".to_string(),
            category_name: "字符集 (Character Classes)".to_string(),
            token: "[a-z]".to_string(),
            name: "字符区间".to_string(),
            description: "使用连字符(-)指定 ASCII 或 Unicode 码位闭区间。".to_string(),
            example: "[0-9a-fA-F] 匹配十六进制字符".to_string(),
        },

        // 2. 量词 (Quantifiers)
        RegexMemoItem {
            id: "quant-zero-more".to_string(),
            category: "quantifiers".to_string(),
            category_name: "量词匹配 (Quantifiers)".to_string(),
            token: "*".to_string(),
            name: "贪婪匹配 0 次或多次".to_string(),
            description: "尽可能多地匹配前置子表达式，直到无法匹配为止。".to_string(),
            example: "go*d 匹配 'gd', 'god', 'good'".to_string(),
        },
        RegexMemoItem {
            id: "quant-one-more".to_string(),
            category: "quantifiers".to_string(),
            category_name: "量词匹配 (Quantifiers)".to_string(),
            token: "+".to_string(),
            name: "贪婪匹配 1 次或多次".to_string(),
            description: "至少出现 1 次，尽可能多地匹配。".to_string(),
            example: "go+d 匹配 'god', 'good'，但不匹配 'gd'".to_string(),
        },
        RegexMemoItem {
            id: "quant-zero-one".to_string(),
            category: "quantifiers".to_string(),
            category_name: "量词匹配 (Quantifiers)".to_string(),
            token: "?".to_string(),
            name: "可选匹配 0 次或 1 次".to_string(),
            description: "前置子表达式为可选项目。".to_string(),
            example: "colou?r 匹配 'color' 与 'colour'".to_string(),
        },
        RegexMemoItem {
            id: "quant-exact".to_string(),
            category: "quantifiers".to_string(),
            category_name: "量词匹配 (Quantifiers)".to_string(),
            token: "{n}".to_string(),
            name: "精确匹配 n 次".to_string(),
            description: "前置子表达式必须严格连续出现 n 次。".to_string(),
            example: r"\d{4} 匹配四位年份 '2026'".to_string(),
        },
        RegexMemoItem {
            id: "quant-range".to_string(),
            category: "quantifiers".to_string(),
            category_name: "量词匹配 (Quantifiers)".to_string(),
            token: "{n,m}".to_string(),
            name: "区间匹配 n 到 m 次".to_string(),
            description: "最少连续出现 n 次，最多连续出现 m 次。".to_string(),
            example: r"[a-zA-Z]{3,8} 匹配 3 到 8 位英文字母".to_string(),
        },
        RegexMemoItem {
            id: "quant-lazy".to_string(),
            category: "quantifiers".to_string(),
            category_name: "量词匹配 (Quantifiers)".to_string(),
            token: "*? / +? / ??".to_string(),
            name: "非贪婪/懒惰量词 (Lazy / Reluctant)".to_string(),
            description: "在贪婪量词后添加 '?'，尽可能少地消耗字符以完成匹配。".to_string(),
            example: "<.*?> 针对 '<div><span>' 仅匹配 '<div>'".to_string(),
        },

        // 3. 边界与锚点 (Anchors & Boundaries)
        RegexMemoItem {
            id: "anchor-start".to_string(),
            category: "anchors".to_string(),
            category_name: "边界与锚点 (Anchors & Boundaries)".to_string(),
            token: "^".to_string(),
            name: "匹配字符串开头 (或行首)".to_string(),
            description: "断言当前位置位于文本开头；在多行模式(m)下断言每一行的起始位置。".to_string(),
            example: "^https: 断言文本以 'https:' 开始".to_string(),
        },
        RegexMemoItem {
            id: "anchor-end".to_string(),
            category: "anchors".to_string(),
            category_name: "边界与锚点 (Anchors & Boundaries)".to_string(),
            token: "$".to_string(),
            name: "匹配字符串结尾 (或行尾)".to_string(),
            description: "断言当前位置位于文本末尾；在多行模式(m)下断言每一行的换行前位置。".to_string(),
            example: r"\.wasm$ 断言文件以 '.wasm' 结尾".to_string(),
        },
        RegexMemoItem {
            id: "anchor-word-boundary".to_string(),
            category: "anchors".to_string(),
            category_name: "边界与锚点 (Anchors & Boundaries)".to_string(),
            token: r"\b".to_string(),
            name: "单词边界 (Word Boundary)".to_string(),
            description: "断言单词字符(\\w)与非单词字符(\\W)或字符串边界之间的过渡零宽位置。".to_string(),
            example: r"\bcat\b 匹配独立的 'cat'，不匹配 'catch' 或 'scat'".to_string(),
        },
        RegexMemoItem {
            id: "anchor-non-word-boundary".to_string(),
            category: "anchors".to_string(),
            category_name: "边界与锚点 (Anchors & Boundaries)".to_string(),
            token: r"\B".to_string(),
            name: "非单词边界".to_string(),
            description: "断言当前字符位置不在单词边界上。".to_string(),
            example: r"\Bcat\B 匹配 'scatter' 中的 'cat'".to_string(),
        },

        // 4. 分组与断言 (Groups & Assertions)
        RegexMemoItem {
            id: "group-capture".to_string(),
            category: "groups".to_string(),
            category_name: "分组与断言 (Groups & Assertions)".to_string(),
            token: "(abc)".to_string(),
            name: "捕获型分组 (Capturing Group)".to_string(),
            description: "将子模式括起作为一个单元，匹配的内容会被记录在按序编号的捕获组内。".to_string(),
            example: r"(\d{4})-(\d{2}) 捕获年份为组1，月份为组2".to_string(),
        },
        RegexMemoItem {
            id: "group-non-capture".to_string(),
            category: "groups".to_string(),
            category_name: "分组与断言 (Groups & Assertions)".to_string(),
            token: "(?:abc)".to_string(),
            name: "非捕获型分组 (Non-Capturing Group)".to_string(),
            description: "仅做逻辑分组，不额外消耗内存记录捕获内容，性能更高。".to_string(),
            example: "(?:https|http):// 组合协议头但避免产生捕获组".to_string(),
        },
        RegexMemoItem {
            id: "group-named".to_string(),
            category: "groups".to_string(),
            category_name: "分组与断言 (Groups & Assertions)".to_string(),
            token: "(?P<name>abc)".to_string(),
            name: "命名捕获组 (Named Capture Group)".to_string(),
            description: "为捕获组指定有意义的名字，便于后续代码中通过键名直接提取。".to_string(),
            example: "(?P<year>\\d{4}) 捕获并命名为 'year'".to_string(),
        },
        RegexMemoItem {
            id: "group-lookahead-pos".to_string(),
            category: "groups".to_string(),
            category_name: "分组与断言 (Groups & Assertions)".to_string(),
            token: "(?=abc)".to_string(),
            name: "正向肯定先行断言 (Positive Lookahead)".to_string(),
            description: "零宽断言：向右看，紧随其后的内容必须匹配 'abc'，但 'abc' 本身不包含在匹配结果中。".to_string(),
            example: r"\d+(?=px) 匹配 '100px' 中的 '100'".to_string(),
        },
        RegexMemoItem {
            id: "group-lookahead-neg".to_string(),
            category: "groups".to_string(),
            category_name: "分组与断言 (Groups & Assertions)".to_string(),
            token: "(?!abc)".to_string(),
            name: "正向否定先行断言 (Negative Lookahead)".to_string(),
            description: "零宽断言：向右看，紧随其后的内容必须不能是 'abc'。".to_string(),
            example: r"\d+(?!px) 匹配未以 'px' 结尾的数值".to_string(),
        },
        RegexMemoItem {
            id: "group-branch".to_string(),
            category: "groups".to_string(),
            category_name: "分组与断言 (Groups & Assertions)".to_string(),
            token: "a|b".to_string(),
            name: "或条件逻辑分支 (Alternation)".to_string(),
            description: "匹配左侧表达式或右侧表达式。".to_string(),
            example: "apple|banana 匹配 'apple' 或 'banana'".to_string(),
        },

        // 5. 常用高频业务正则 (Common Production Patterns)
        RegexMemoItem {
            id: "pattern-phone-cn".to_string(),
            category: "common".to_string(),
            category_name: "高频实战模式 (Common Patterns)".to_string(),
            token: r"^1[3-9]\d{9}$".to_string(),
            name: "中国大陆手机号码 (11位)".to_string(),
            description: "精准验证 1 开头、第二位为 3-9 的中国大陆 11 位数字手机号码。".to_string(),
            example: "13800138000, 18912345678".to_string(),
        },
        RegexMemoItem {
            id: "pattern-email".to_string(),
            category: "common".to_string(),
            category_name: "高频实战模式 (Common Patterns)".to_string(),
            token: r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$".to_string(),
            name: "电子邮箱地址 (Email)".to_string(),
            description: "标准工业级通用电子邮件格式校验。".to_string(),
            example: "developer@wasmforge.dev, support@google.com".to_string(),
        },
        RegexMemoItem {
            id: "pattern-ipv4".to_string(),
            category: "common".to_string(),
            category_name: "高频实战模式 (Common Patterns)".to_string(),
            token: r"^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$".to_string(),
            name: "IPv4 地址 (严格 0-255)".to_string(),
            description: "严格限定每段数值均在 0 至 255 之间的合法 IPv4 点分十进制格式。".to_string(),
            example: "192.168.1.1, 10.0.0.1, 255.255.255.0".to_string(),
        },
        RegexMemoItem {
            id: "pattern-url".to_string(),
            category: "common".to_string(),
            category_name: "高频实战模式 (Common Patterns)".to_string(),
            token: r"^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)$".to_string(),
            name: "Web 网址 URL (HTTP / HTTPS)".to_string(),
            description: "匹配带协议头的完整互联网网址，支持端口号与路径查询参数。".to_string(),
            example: "https://wasmforge.dev/tools?tab=wasm".to_string(),
        },
        RegexMemoItem {
            id: "pattern-hex-color".to_string(),
            category: "common".to_string(),
            category_name: "高频实战模式 (Common Patterns)".to_string(),
            token: r"^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$".to_string(),
            name: "十六进制颜色码 (Hex Color)".to_string(),
            description: "匹配 3 位简写或 6 位完整的 CSS 16 进制颜色编码。".to_string(),
            example: "#ffffff, #38bdf8, #000".to_string(),
        },
        RegexMemoItem {
            id: "pattern-chinese".to_string(),
            category: "common".to_string(),
            category_name: "高频实战模式 (Common Patterns)".to_string(),
            token: r"^[\u4e00-\u9fa5]+$".to_string(),
            name: "纯汉字中文字符".to_string(),
            description: "匹配 Unicode 基本汉字区块 (\\u4e00 - \\u9fa5)。".to_string(),
            example: "汉字字符串, 网页应用".to_string(),
        },
        RegexMemoItem {
            id: "pattern-date-iso".to_string(),
            category: "common".to_string(),
            category_name: "高频实战模式 (Common Patterns)".to_string(),
            token: r"^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$".to_string(),
            name: "标准日期格式 (YYYY-MM-DD)".to_string(),
            description: "严格符合 ISO-8601 标准的四位年份、两位月份与两位日期的横线格式。".to_string(),
            example: "2026-10-25, 2030-12-31".to_string(),
        },
        RegexMemoItem {
            id: "pattern-strong-pwd".to_string(),
            category: "common".to_string(),
            category_name: "高频实战模式 (Common Patterns)".to_string(),
            token: r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$".to_string(),
            name: "高强度密码规则".to_string(),
            description: "至少 8 位字符，且必须同时包含至少 1 个大写字母、1 个小写字母、1 个数字与 1 个特殊符号。".to_string(),
            example: "WasmForge@2026, SecurePass!9".to_string(),
        },
        RegexMemoItem {
            id: "pattern-id-card-cn".to_string(),
            category: "common".to_string(),
            category_name: "高频实战模式 (Common Patterns)".to_string(),
            token: r"^[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]$".to_string(),
            name: "中国大陆 18 位身份证号码".to_string(),
            description: "包含 6 位行政区划码、8 位出生年月日、3 位顺序码及校验位(包含 X/x)。".to_string(),
            example: "11010119900307239X".to_string(),
        },
    ]
}

fn search_memo(query: &str, category: Option<&str>) -> Vec<RegexMemoItem> {
    let db = get_memo_database();
    let q = query.trim().to_lowercase();
    let cat_filter = category.map(|c| c.trim().to_lowercase());

    db.into_iter()
        .filter(|item| {
            if let Some(ref cat) = cat_filter {
                if !cat.is_empty() && &item.category.to_lowercase() != cat {
                    return false;
                }
            }
            if q.is_empty() {
                return true;
            }
            item.token.to_lowercase().contains(&q)
                || item.name.to_lowercase().contains(&q)
                || item.description.to_lowercase().contains(&q)
                || item.example.to_lowercase().contains(&q)
                || item.category_name.to_lowercase().contains(&q)
        })
        .collect()
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
        "memo/list" => {
            let items = get_memo_database();
            let total = items.len();
            let mut categories = Vec::new();
            for it in &items {
                if !categories.contains(&it.category) {
                    categories.push(it.category.clone());
                }
            }
            let res = ResponseEnvelope {
                code: 0,
                msg: "success".to_string(),
                data: Some(MemoListResult {
                    total,
                    categories,
                    items,
                }),
            };
            serde_json::to_vec(&res).unwrap_or_default()
        }
        "memo/search" => {
            let query = req.params.get("query").and_then(|v| v.as_str()).unwrap_or("");
            let category = req.params.get("category").and_then(|v| v.as_str());

            let matches = search_memo(query, category);
            let match_count = matches.len();

            let res = ResponseEnvelope {
                code: 0,
                msg: "success".to_string(),
                data: Some(MemoSearchResult {
                    query: query.to_string(),
                    category: category.map(|s| s.to_string()),
                    match_count,
                    matches,
                }),
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
    fn test_memo_list() {
        let items = get_memo_database();
        assert!(items.len() >= 25);
    }

    #[test]
    fn test_memo_search() {
        let matches = search_memo("手机", None);
        assert!(!matches.is_empty());
        assert_eq!(matches[0].id, "pattern-phone-cn");
    }

    #[test]
    fn test_memo_category_filter() {
        let matches = search_memo("", Some("quantifiers"));
        assert!(matches.iter().all(|m| m.category == "quantifiers"));
    }
}
