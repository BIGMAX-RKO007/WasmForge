use chrono::{DateTime, Datelike, FixedOffset, NaiveDate, NaiveDateTime, Utc};
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
struct ConvertDateTimeParams {
    input: String,
}

#[derive(Serialize, Clone, Debug)]
pub struct DateTimeResult {
    pub input: String,
    #[serde(rename = "unixSeconds")]
    pub unix_seconds: i64,
    #[serde(rename = "unixMilliseconds")]
    pub unix_milliseconds: i64,
    pub iso8601: String,
    pub rfc2822: String,
    pub utc: String,
    pub cst: String,
    pub jst: String,
    pub est: String,
    #[serde(rename = "dayOfWeek")]
    pub day_of_week: String,
    #[serde(rename = "dayOfYear")]
    pub day_of_year: u32,
    #[serde(rename = "weekNumber")]
    pub week_number: u32,
    #[serde(rename = "isLeapYear")]
    pub is_leap_year: bool,
}

#[derive(Serialize)]
pub struct SampleResult {
    pub sample: String,
    pub converted: DateTimeResult,
}

pub fn parse_datetime_flexible(input_str: &str) -> Result<DateTime<Utc>, String> {
    let trimmed = input_str.trim();
    if trimmed.is_empty() {
        return Err("输入日期时间不能为空".to_string());
    }

    // 1. 纯数字时间戳 (秒 或 毫秒)
    if let Ok(ts) = trimmed.parse::<i64>() {
        // 如果数字位数 <= 10，当作秒；否则当作毫秒
        if trimmed.len() <= 10 {
            return DateTime::from_timestamp(ts, 0)
                .ok_or_else(|| format!("无效的 Unix 秒级时间戳: {}", ts));
        } else {
            return DateTime::from_timestamp_millis(ts)
                .ok_or_else(|| format!("无效的 Unix 毫秒级时间戳: {}", ts));
        }
    }

    // 2. RFC 3339 / ISO 8601 (带时区偏移或 Z)
    if let Ok(dt) = DateTime::parse_from_rfc3339(trimmed) {
        return Ok(dt.with_timezone(&Utc));
    }

    // 3. RFC 2822
    if let Ok(dt) = DateTime::parse_from_rfc2822(trimmed) {
        return Ok(dt.with_timezone(&Utc));
    }

    // 4. 标准日期时间格式
    let patterns = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%Y/%m/%d %H:%M:%S",
        "%Y-%m-%d",
        "%Y/%m/%d",
    ];

    for pat in &patterns {
        if let Ok(ndt) = NaiveDateTime::parse_from_str(trimmed, pat) {
            return Ok(DateTime::<Utc>::from_naive_utc_and_offset(ndt, Utc));
        }
    }

    // 5. 纯日期补零
    if let Ok(nd) = NaiveDate::parse_from_str(trimmed, "%Y-%m-%d") {
        if let Some(ndt) = nd.and_hms_opt(0, 0, 0) {
            return Ok(DateTime::<Utc>::from_naive_utc_and_offset(ndt, Utc));
        }
    }

    Err(format!(
        "无法解析的日期时间格式: '{}'. 支持 Unix时间戳, ISO 8601, 'YYYY-MM-DD HH:MM:SS'",
        input_str
    ))
}

pub fn convert_datetime(input_str: &str) -> Result<DateTimeResult, String> {
    let dt = parse_datetime_flexible(input_str)?;

    let unix_seconds = dt.timestamp();
    let unix_milliseconds = dt.timestamp_millis();
    let iso8601 = dt.to_rfc3339();
    let rfc2822 = dt.to_rfc2822();
    let utc = dt.format("%Y-%m-%d %H:%M:%S UTC").to_string();

    let cst_offset = FixedOffset::east_opt(8 * 3600).unwrap();
    let jst_offset = FixedOffset::east_opt(9 * 3600).unwrap();
    let est_offset = FixedOffset::west_opt(5 * 3600).unwrap();

    let cst = dt.with_timezone(&cst_offset).format("%Y-%m-%d %H:%M:%S UTC+8").to_string();
    let jst = dt.with_timezone(&jst_offset).format("%Y-%m-%d %H:%M:%S UTC+9").to_string();
    let est = dt.with_timezone(&est_offset).format("%Y-%m-%d %H:%M:%S UTC-5").to_string();

    let day_of_week = dt.format("%A").to_string();
    let day_of_year = dt.ordinal();
    let week_number = dt.iso_week().week();

    let year = dt.year();
    let is_leap_year = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);

    Ok(DateTimeResult {
        input: input_str.to_string(),
        unix_seconds,
        unix_milliseconds,
        iso8601,
        rfc2822,
        utc,
        cst,
        jst,
        est,
        day_of_week,
        day_of_year,
        week_number,
        is_leap_year,
    })
}

pub fn get_sample() -> SampleResult {
    let sample = "2026-10-25 14:30:00".to_string();
    let converted = convert_datetime(&sample).unwrap();
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
        "datetime/convert" => {
            let params: ConvertDateTimeParams = match req.params {
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

            match convert_datetime(&params.input) {
                Ok(out) => {
                    let res = ResponseEnvelope {
                        code: 0,
                        msg: "日期时间转换成功".to_string(),
                        request_id: req_id,
                        data: Some(out),
                    };
                    serde_json::to_vec(&res).unwrap_or_default()
                }
                Err(err) => {
                    let res = ResponseEnvelope::<()> {
                        code: 500,
                        msg: err,
                        request_id: req_id,
                        data: None,
                    };
                    serde_json::to_vec(&res).unwrap_or_default()
                }
            }
        }
        "datetime/sample" => {
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
    fn test_timestamp_seconds() {
        let res = convert_datetime("1700000000").unwrap();
        assert_eq!(res.unix_seconds, 1700000000);
        assert_eq!(res.unix_milliseconds, 1700000000000);
        assert_eq!(res.day_of_week, "Tuesday");
    }

    #[test]
    fn test_timestamp_millis() {
        let res = convert_datetime("1700000000123").unwrap();
        assert_eq!(res.unix_seconds, 1700000000);
        assert_eq!(res.unix_milliseconds, 1700000000123);
    }

    #[test]
    fn test_iso8601() {
        let res = convert_datetime("2026-10-25T14:30:00Z").unwrap();
        assert_eq!(res.day_of_week, "Sunday");
        assert!(res.cst.contains("22:30:00"));
        assert!(res.jst.contains("23:30:00"));
    }

    #[test]
    fn test_sample() {
        let sample = get_sample();
        assert_eq!(sample.converted.day_of_week, "Sunday");
    }
}
