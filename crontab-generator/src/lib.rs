extern crate alloc;

use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec;
use alloc::vec::Vec;
use chrono::{Datelike, Duration, TimeZone, Timelike, Utc};
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
pub struct CronScheduleRun {
    pub index: usize,
    pub timestamp: i64,
    pub utc_time: String,
    pub readable: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CronFieldBreakdown {
    pub minute: String,
    pub hour: String,
    pub day_of_month: String,
    pub month: String,
    pub day_of_week: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CronEvaluationResult {
    pub expression: String,
    pub is_valid: bool,
    pub human_zh: String,
    pub human_en: String,
    pub breakdown: CronFieldBreakdown,
    pub next_runs: Vec<CronScheduleRun>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CronPresetItem {
    pub name: String,
    pub expression: String,
    pub description: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CronPresetsResult {
    pub presets: Vec<CronPresetItem>,
}

#[derive(Clone, Debug)]
struct ParsedCron {
    minutes: Vec<u32>,
    hours: Vec<u32>,
    days_of_month: Vec<u32>,
    months: Vec<u32>,
    days_of_week: Vec<u32>,
}

fn parse_cron_number(s: &str, min: u32, max: u32) -> Result<u32, String> {
    let s_upper = s.to_ascii_uppercase();
    // 兼容月份名称
    let num_str = match s_upper.as_str() {
        "JAN" => 1,
        "FEB" => 2,
        "MAR" => 3,
        "APR" => 4,
        "MAY" => 5,
        "JUN" => 6,
        "JUL" => 7,
        "AUG" => 8,
        "SEP" => 9,
        "OCT" => 10,
        "NOV" => 11,
        "DEC" => 12,
        // 兼容星期名称
        "SUN" => 0,
        "MON" => 1,
        "TUE" => 2,
        "WED" => 3,
        "THU" => 4,
        "FRI" => 5,
        "SAT" => 6,
        _ => s.parse::<u32>().map_err(|_| format!("非法数字或标识: '{}'", s))?,
    };

    if num_str < min || num_str > max {
        return Err(format!("数值 {} 超出范围 [{}..{}]", num_str, min, max));
    }
    Ok(num_str)
}

fn parse_cron_field(field_str: &str, min: u32, max: u32) -> Result<Vec<u32>, String> {
    let mut values = Vec::new();
    let parts: Vec<&str> = field_str.split(',').collect();

    for part in parts {
        let trimmed = part.trim();
        if trimmed.is_empty() {
            continue;
        }

        if trimmed == "*" {
            for v in min..=max {
                values.push(v);
            }
        } else if trimmed.starts_with("*/") {
            let step_str = &trimmed[2..];
            let step: u32 = step_str.parse().map_err(|_| format!("步长非法: '{}'", step_str))?;
            if step == 0 {
                return Err("步长不能为 0".to_string());
            }
            let mut curr = min;
            while curr <= max {
                values.push(curr);
                curr += step;
            }
        } else if trimmed.contains('/') {
            let sub_parts: Vec<&str> = trimmed.split('/').collect();
            if sub_parts.len() != 2 {
                return Err(format!("步长表达式格式错误: '{}'", trimmed));
            }
            let step: u32 = sub_parts[1].parse().map_err(|_| format!("步长非法: '{}'", sub_parts[1]))?;
            if step == 0 {
                return Err("步长不能为 0".to_string());
            }

            let range_parts: Vec<&str> = sub_parts[0].split('-').collect();
            let (start, end) = if range_parts.len() == 2 {
                let s = parse_cron_number(range_parts[0], min, max)?;
                let e = parse_cron_number(range_parts[1], min, max)?;
                if s > e {
                    return Err(format!("区间起点不能大于终点: '{}-{}'", s, e));
                }
                (s, e)
            } else if sub_parts[0] == "*" {
                (min, max)
            } else {
                let s = parse_cron_number(sub_parts[0], min, max)?;
                (s, max)
            };

            let mut curr = start;
            while curr <= end {
                values.push(curr);
                curr += step;
            }
        } else if trimmed.contains('-') {
            let range_parts: Vec<&str> = trimmed.split('-').collect();
            if range_parts.len() != 2 {
                return Err(format!("区间格式错误: '{}'", trimmed));
            }
            let start = parse_cron_number(range_parts[0], min, max)?;
            let end = parse_cron_number(range_parts[1], min, max)?;
            if start > end {
                return Err(format!("区间起点不能大于终点: '{}-{}'", start, end));
            }
            for v in start..=end {
                values.push(v);
            }
        } else {
            let val = parse_cron_number(trimmed, min, max)?;
            values.push(val);
        }
    }

    values.sort_unstable();
    values.dedup();
    if values.is_empty() {
        return Err(format!("字段未匹配到任何有效数值: '{}'", field_str));
    }
    Ok(values)
}

fn parse_cron(expression: &str) -> Result<ParsedCron, String> {
    let fields: Vec<&str> = expression.split_whitespace().collect();
    if fields.len() != 5 {
        return Err(format!(
            "标准 Cron 表达式须包含 5 个空格隔开的字段 (分 时 日 月 周)，当前解析到 {} 个",
            fields.len()
        ));
    }

    let minutes = parse_cron_field(fields[0], 0, 59)?;
    let hours = parse_cron_field(fields[1], 0, 23)?;
    let days_of_month = parse_cron_field(fields[2], 1, 31)?;
    let months = parse_cron_field(fields[3], 1, 12)?;
    let mut days_of_week = parse_cron_field(fields[4], 0, 7)?;

    // 0 和 7 均为周日，归一化为 0
    if days_of_week.contains(&7) {
        if !days_of_week.contains(&0) {
            days_of_week.push(0);
        }
        days_of_week.retain(|&x| x != 7);
        days_of_week.sort_unstable();
    }

    Ok(ParsedCron {
        minutes,
        hours,
        days_of_month,
        months,
        days_of_week,
    })
}

fn translate_human_zh(expression: &str, fields: &[&str]) -> String {
    let m = fields[0];
    let h = fields[1];
    let dom = fields[2];
    let mon = fields[3];
    let dow = fields[4];

    if expression == "* * * * *" {
        return "每分钟执行一次".to_string();
    }
    if m.starts_with("*/") && h == "*" && dom == "*" && mon == "*" && dow == "*" {
        return format!("每隔 {} 分钟执行一次", &m[2..]);
    }
    if m == "0" && h == "*" && dom == "*" && mon == "*" && dow == "*" {
        return "每小时整点执行一次".to_string();
    }
    if m == "0" && h.starts_with("*/") && dom == "*" && mon == "*" && dow == "*" {
        return format!("每隔 {} 小时整点执行一次", &h[2..]);
    }
    if m == "0" && h == "0" && dom == "*" && mon == "*" && dow == "*" {
        return "每天午夜 00:00 执行一次".to_string();
    }
    if dom == "*" && mon == "*" && dow == "1-5" {
        return format!("工作日(周一至周五) 在 {}:{:02} 执行", h, m.parse::<u32>().unwrap_or(0));
    }
    if dom == "*" && mon == "*" && (dow == "0" || dow == "7") {
        return format!("每周日 在 {}:{:02} 执行", h, m.parse::<u32>().unwrap_or(0));
    }
    if dom == "1" && mon == "*" && dow == "*" {
        return format!("每月 1 日 在 {}:{:02} 执行", h, m.parse::<u32>().unwrap_or(0));
    }

    format!(
        "分: {}, 时: {}, 日: {}, 月: {}, 星期: {}",
        m, h, dom, mon, dow
    )
}

fn translate_human_en(expression: &str, fields: &[&str]) -> String {
    let m = fields[0];
    let h = fields[1];
    let dom = fields[2];
    let mon = fields[3];
    let dow = fields[4];

    if expression == "* * * * *" {
        return "Every minute".to_string();
    }
    if m.starts_with("*/") && h == "*" && dom == "*" && mon == "*" && dow == "*" {
        return format!("Every {} minutes", &m[2..]);
    }
    if m == "0" && h == "*" && dom == "*" && mon == "*" && dow == "*" {
        return "Every hour on the hour".to_string();
    }
    if m == "0" && h.starts_with("*/") && dom == "*" && mon == "*" && dow == "*" {
        return format!("Every {} hours", &h[2..]);
    }
    if m == "0" && h == "0" && dom == "*" && mon == "*" && dow == "*" {
        return "Every day at midnight".to_string();
    }
    if dom == "*" && mon == "*" && dow == "1-5" {
        return format!("Weekdays (Mon-Fri) at {}:{:02}", h, m.parse::<u32>().unwrap_or(0));
    }
    if dom == "*" && mon == "*" && (dow == "0" || dow == "7") {
        return format!("Every Sunday at {}:{:02}", h, m.parse::<u32>().unwrap_or(0));
    }
    if dom == "1" && mon == "*" && dow == "*" {
        return format!("On the 1st of every month at {}:{:02}", h, m.parse::<u32>().unwrap_or(0));
    }

    format!(
        "At minute {}, hour {}, day {}, month {}, weekday {}",
        m, h, dom, mon, dow
    )
}

fn calculate_next_runs(
    parsed: &ParsedCron,
    start_ts: i64,
    count: usize,
) -> Vec<CronScheduleRun> {
    let mut runs = Vec::new();
    let initial_dt = match Utc.timestamp_opt(start_ts, 0) {
        chrono::LocalResult::Single(dt) => dt,
        _ => return runs,
    };

    // 去掉秒数，从下一分钟开始步进
    let mut curr_dt = initial_dt
        .with_second(0)
        .unwrap_or(initial_dt)
        .checked_add_signed(Duration::minutes(1))
        .unwrap_or(initial_dt);

    // 最大步进 100,000 分钟 (~70 天)，防止死循环
    let max_steps = 100_000;
    let mut step = 0;

    while runs.len() < count && step < max_steps {
        step += 1;
        let month = curr_dt.month();
        let day = curr_dt.day();
        let hour = curr_dt.hour();
        let min = curr_dt.minute();
        // chrono weekday: 0 = Mon .. 6 = Sun
        // cron weekday: 0 = Sun, 1 = Mon .. 6 = Sat
        let dow_cron = match curr_dt.weekday() {
            chrono::Weekday::Sun => 0,
            chrono::Weekday::Mon => 1,
            chrono::Weekday::Tue => 2,
            chrono::Weekday::Wed => 3,
            chrono::Weekday::Thu => 4,
            chrono::Weekday::Fri => 5,
            chrono::Weekday::Sat => 6,
        };

        let month_match = parsed.months.contains(&month);
        let dom_match = parsed.days_of_month.contains(&day);
        let dow_match = parsed.days_of_week.contains(&dow_cron);
        let hour_match = parsed.hours.contains(&hour);
        let min_match = parsed.minutes.contains(&min);

        if month_match && dom_match && dow_match && hour_match && min_match {
            let ts = curr_dt.timestamp();
            let utc_time = curr_dt.format("%Y-%m-%d %H:%M:%SZ").to_string();
            let readable = curr_dt.format("%Y年%m月%d日 %H:%M (UTC)").to_string();
            runs.push(CronScheduleRun {
                index: runs.len() + 1,
                timestamp: ts,
                utc_time,
                readable,
            });
        }

        curr_dt = match curr_dt.checked_add_signed(Duration::minutes(1)) {
            Some(dt) => dt,
            None => break,
        };
    }

    runs
}

fn evaluate_cron(expression: &str, ref_ts: Option<i64>, count: Option<usize>) -> Result<CronEvaluationResult, String> {
    let expr = expression.trim();
    let fields: Vec<&str> = expr.split_whitespace().collect();
    let parsed = parse_cron(expr)?;

    let human_zh = translate_human_zh(expr, &fields);
    let human_en = translate_human_en(expr, &fields);

    let start_ts = ref_ts.unwrap_or(1761379200); // Baseline epoch if not specified
    let next_runs = calculate_next_runs(&parsed, start_ts, count.unwrap_or(5).min(20));

    Ok(CronEvaluationResult {
        expression: expr.to_string(),
        is_valid: true,
        human_zh,
        human_en,
        breakdown: CronFieldBreakdown {
            minute: fields[0].to_string(),
            hour: fields[1].to_string(),
            day_of_month: fields[2].to_string(),
            month: fields[3].to_string(),
            day_of_week: fields[4].to_string(),
        },
        next_runs,
    })
}

fn get_presets() -> CronPresetsResult {
    CronPresetsResult {
        presets: vec![
            CronPresetItem {
                name: "每分钟执行 (Every minute)".to_string(),
                expression: "* * * * *".to_string(),
                description: "持续轮询或高频心跳健康检查".to_string(),
            },
            CronPresetItem {
                name: "每 5 分钟执行 (Every 5 minutes)".to_string(),
                expression: "*/5 * * * *".to_string(),
                description: "常用于指标采集、消息队列监控与缓存预热".to_string(),
            },
            CronPresetItem {
                name: "每 15 分钟执行 (Every 15 minutes)".to_string(),
                expression: "*/15 * * * *".to_string(),
                description: "适度频次的外部 API 数据同步与对账".to_string(),
            },
            CronPresetItem {
                name: "每小时整点执行 (Every hour)".to_string(),
                expression: "0 * * * *".to_string(),
                description: "日志滚动规整与小时级别汇总报表生成".to_string(),
            },
            CronPresetItem {
                name: "每天午夜执行 (Daily midnight)".to_string(),
                expression: "0 0 * * *".to_string(),
                description: "每日数据库全量冷备份、历史脏数据清理".to_string(),
            },
            CronPresetItem {
                name: "工作日早 9 点执行 (Weekdays 9 AM)".to_string(),
                expression: "0 9 * * 1-5".to_string(),
                description: "工作日晨报推送、企业微信/钉钉提醒机器人".to_string(),
            },
            CronPresetItem {
                name: "每周日凌晨 3 点执行 (Weekly Sunday 3 AM)".to_string(),
                expression: "0 3 * * 0".to_string(),
                description: "周级大盘归档维护与服务器安全审计".to_string(),
            },
            CronPresetItem {
                name: "每月 1 日午夜执行 (Monthly 1st)".to_string(),
                expression: "0 0 1 * *".to_string(),
                description: "月度财务账单对账与会员权益定期重置".to_string(),
            },
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
        "cron/evaluate" => {
            let expr = match req.params.get("expression").and_then(|v| v.as_str()) {
                Some(s) if !s.trim().is_empty() => s,
                _ => {
                    let res = ResponseEnvelope::<()> {
                        code: 400,
                        msg: "缺失必要的参数 'expression'".to_string(),
                        data: None,
                    };
                    return serde_json::to_vec(&res).unwrap_or_default();
                }
            };

            let ref_ts = req.params.get("referenceTime").and_then(|v| v.as_i64());
            let count = req.params.get("count").and_then(|v| v.as_u64()).map(|v| v as usize);

            match evaluate_cron(expr, ref_ts, count) {
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
        "cron/generate" => {
            let min = req.params.get("minute").and_then(|v| v.as_str()).unwrap_or("*");
            let hour = req.params.get("hour").and_then(|v| v.as_str()).unwrap_or("*");
            let dom = req.params.get("dayOfMonth").and_then(|v| v.as_str()).unwrap_or("*");
            let mon = req.params.get("month").and_then(|v| v.as_str()).unwrap_or("*");
            let dow = req.params.get("dayOfWeek").and_then(|v| v.as_str()).unwrap_or("*");

            let expr = format!("{} {} {} {} {}", min, hour, dom, mon, dow);
            let ref_ts = req.params.get("referenceTime").and_then(|v| v.as_i64());
            let count = req.params.get("count").and_then(|v| v.as_u64()).map(|v| v as usize);

            match evaluate_cron(&expr, ref_ts, count) {
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
        "cron/presets" => {
            let res = ResponseEnvelope {
                code: 0,
                msg: "success".to_string(),
                data: Some(get_presets()),
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
    fn test_cron_evaluate_valid() {
        let res = evaluate_cron("*/15 0-4 * * *", Some(1761379200), Some(5)).expect("evaluate failed");
        assert!(res.is_valid);
        assert_eq!(res.next_runs.len(), 5);
        assert!(res.human_zh.contains("分"));
    }

    #[test]
    fn test_cron_evaluate_invalid() {
        let res = evaluate_cron("99 * * * *", None, None);
        assert!(res.is_err());
    }
}
