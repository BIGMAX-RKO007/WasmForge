use core::slice;
use serde::{Deserialize, Serialize};
use sqlformat::{format as sql_format, FormatOptions, Indent, QueryParams};

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
pub struct FormatSqlParams {
    pub sql: String,
    #[serde(default)]
    pub indent: Option<u8>, // number of spaces, default 2
    #[serde(default)]
    pub uppercase: Option<bool>, // uppercase keywords, default true
    #[serde(default)]
    pub lines_between_queries: Option<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MinifySqlParams {
    pub sql: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FormatSqlStats {
    pub original_length: usize,
    pub formatted_length: usize,
    pub line_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FormatSqlResult {
    pub formatted: String,
    pub stats: FormatSqlStats,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MinifySqlStats {
    pub original_length: usize,
    pub minified_length: usize,
    pub compression_ratio_percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MinifySqlResult {
    pub minified: String,
    pub stats: MinifySqlStats,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SqlSampleResult {
    pub sample_sql: String,
    pub formatted: FormatSqlResult,
    pub minified: MinifySqlResult,
}

pub fn format_sql(params: &FormatSqlParams) -> FormatSqlResult {
    let spaces = params.indent.unwrap_or(2);
    let uppercase = params.uppercase.unwrap_or(true);
    let lines_between_queries = params.lines_between_queries.unwrap_or(1);

    let mut options = FormatOptions::default();
    options.indent = Indent::Spaces(spaces);
    options.uppercase = Some(uppercase);
    options.lines_between_queries = lines_between_queries;

    let formatted = sql_format(&params.sql, &QueryParams::None, &options);
    let line_count = formatted.lines().count();

    let stats = FormatSqlStats {
        original_length: params.sql.len(),
        formatted_length: formatted.len(),
        line_count,
    };

    FormatSqlResult { formatted, stats }
}

pub fn minify_sql(sql: &str) -> MinifySqlResult {
    let original_length = sql.len();
    let mut minified = String::with_capacity(original_length);
    let chars: Vec<char> = sql.chars().collect();
    let n = chars.len();
    let mut i = 0;
    let mut in_single_quote = false;
    let mut in_double_quote = false;
    let mut last_was_space = true;

    while i < n {
        let c = chars[i];

        // Quotes handling
        if c == '\'' && !in_double_quote {
            in_single_quote = !in_single_quote;
            minified.push(c);
            last_was_space = false;
            i += 1;
            continue;
        }

        if c == '"' && !in_single_quote {
            in_double_quote = !in_double_quote;
            minified.push(c);
            last_was_space = false;
            i += 1;
            continue;
        }

        // Inside strings, keep everything verbatim
        if in_single_quote || in_double_quote {
            minified.push(c);
            last_was_space = false;
            i += 1;
            continue;
        }

        // Single-line comment: -- ...
        if c == '-' && i + 1 < n && chars[i + 1] == '-' {
            i += 2;
            while i < n && chars[i] != '\n' && chars[i] != '\r' {
                i += 1;
            }
            if !last_was_space {
                minified.push(' ');
                last_was_space = true;
            }
            continue;
        }

        // Multi-line comment: /* ... */
        if c == '/' && i + 1 < n && chars[i + 1] == '*' {
            i += 2;
            while i + 1 < n && !(chars[i] == '*' && chars[i + 1] == '/') {
                i += 1;
            }
            if i + 1 < n {
                i += 2;
            }
            if !last_was_space {
                minified.push(' ');
                last_was_space = true;
            }
            continue;
        }

        // Whitespace collapse
        if c.is_whitespace() {
            if !last_was_space {
                minified.push(' ');
                last_was_space = true;
            }
            i += 1;
            continue;
        }

        // Punctuation whitespace trim (e.g. around ',', '(', ')')
        if c == ',' || c == ';' || c == '(' || c == ')' {
            // If preceded by a space and it's a comma/semicolon/closing paren, strip trailing space
            if last_was_space && (c == ',' || c == ';' || c == ')') && minified.ends_with(' ') {
                minified.pop();
            }
            minified.push(c);
            last_was_space = false;
            i += 1;
            continue;
        }

        minified.push(c);
        last_was_space = false;
        i += 1;
    }

    let minified_str = minified.trim().to_string();
    let minified_length = minified_str.len();

    let compression_ratio_percent = if original_length > 0 {
        ((1.0 - (minified_length as f64 / original_length as f64)) * 100.0).max(0.0)
    } else {
        0.0
    };

    let stats = MinifySqlStats {
        original_length,
        minified_length,
        compression_ratio_percent: (compression_ratio_percent * 100.0).round() / 100.0,
    };

    MinifySqlResult {
        minified: minified_str,
        stats,
    }
}

pub fn get_sample() -> SqlSampleResult {
    let sample_sql = r#"SELECT u.id, u.name, count(o.id) as total_orders, sum(o.amount) as total_spent FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.status = 'active' AND u.created_at >= '2026-01-01' GROUP BY u.id, u.name HAVING count(o.id) > 5 ORDER BY total_spent DESC LIMIT 20;"#.to_string();

    let formatted = format_sql(&FormatSqlParams {
        sql: sample_sql.clone(),
        indent: Some(2),
        uppercase: Some(true),
        lines_between_queries: Some(1),
    });

    let minified = minify_sql(&sample_sql);

    SqlSampleResult {
        sample_sql,
        formatted,
        minified,
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
        "sql/format" => {
            let params: FormatSqlParams = match req.params {
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

            let out = format_sql(&params);
            let res = ResponseEnvelope {
                code: 0,
                msg: "SQL 排版格式化成功".to_string(),
                request_id: req_id,
                data: Some(out),
            };
            serde_json::to_vec(&res).unwrap_or_default()
        }
        "sql/minify" => {
            let params: MinifySqlParams = match req.params {
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

            let out = minify_sql(&params.sql);
            let res = ResponseEnvelope {
                code: 0,
                msg: "SQL 压缩瘦身成功".to_string(),
                request_id: req_id,
                data: Some(out),
            };
            serde_json::to_vec(&res).unwrap_or_default()
        }
        "sql/sample" => {
            let sample = get_sample();
            let res = ResponseEnvelope {
                code: 0,
                msg: "获取 SQL 示例成功".to_string(),
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
    fn test_format_and_minify() {
        let raw = "select id, name from users where status = 'active';";
        let fmt = format_sql(&FormatSqlParams {
            sql: raw.to_string(),
            indent: Some(2),
            uppercase: Some(true),
            lines_between_queries: Some(1),
        });
        assert!(fmt.formatted.contains("SELECT"));
        assert!(fmt.formatted.contains("FROM"));
        assert!(fmt.formatted.contains("WHERE"));
        assert!(fmt.stats.line_count > 1);

        let min = minify_sql("-- comment\nSELECT id, name /* mid comment */ FROM users;");
        assert_eq!(min.minified, "SELECT id, name FROM users;");
    }

    #[test]
    fn test_dispatch() {
        let req = serde_json::json!({
            "action": "sql/format",
            "params": {
                "sql": "select * from my_table"
            }
        });
        let bytes = serde_json::to_vec(&req).unwrap();
        let out = handle_dispatch(&bytes);
        let resp: serde_json::Value = serde_json::from_slice(&out).unwrap();
        assert_eq!(resp["code"], 0);
        assert!(resp["data"]["formatted"].as_str().unwrap().contains("SELECT"));
    }
}
