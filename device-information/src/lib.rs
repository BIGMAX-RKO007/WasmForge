extern crate alloc;

use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec;
use alloc::vec::Vec;
use core::slice;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BrowserInfo {
    pub name: String,
    pub version: String,
    #[serde(rename = "majorVersion")]
    pub major_version: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OsInfo {
    pub name: String,
    pub version: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DeviceInfo {
    #[serde(rename = "deviceType")]
    pub device_type: String, // "Desktop" | "Mobile" | "Tablet" | "Bot" | "Unknown"
    pub vendor: String,
    pub model: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EngineInfo {
    pub name: String,
    pub version: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DeviceProfile {
    pub ua: String,
    pub browser: BrowserInfo,
    pub os: OsInfo,
    pub device: DeviceInfo,
    pub engine: EngineInfo,
    pub cpu: String,
    #[serde(rename = "isBot")]
    pub is_bot: bool,
    #[serde(rename = "isMobile")]
    pub is_mobile: bool,
    #[serde(rename = "isTablet")]
    pub is_tablet: bool,
    #[serde(rename = "isDesktop")]
    pub is_desktop: bool,
    #[serde(rename = "clientDetails")]
    pub client_details: Option<serde_json::Value>,
}

fn extract_version(ua: &str, token: &str) -> String {
    if let Some(pos) = ua.find(token) {
        let after = &ua[pos + token.len()..];
        let mut ver = String::new();
        for ch in after.chars() {
            if ch.is_ascii_digit() || ch == '.' || ch == '_' {
                ver.push(if ch == '_' { '.' } else { ch });
            } else {
                break;
            }
        }
        if !ver.is_empty() {
            return ver;
        }
    }
    "".to_string()
}

pub fn parse_device(ua: &str, client_details: Option<serde_json::Value>) -> DeviceProfile {
    let mut is_bot = false;
    let mut device_type = "Desktop".to_string();
    let mut vendor = "Generic".to_string();
    let mut model = "PC".to_string();

    // 1. Bot & Crawler Detection
    if ua.contains("Googlebot")
        || ua.contains("bingbot")
        || ua.contains("Baiduspider")
        || ua.contains("YandexBot")
        || ua.contains("DuckDuckBot")
        || ua.contains("curl/")
        || ua.contains("PostmanRuntime/")
        || ua.contains("HeadlessChrome")
        || ua.contains("Puppeteer")
        || ua.contains("Playwright")
    {
        is_bot = true;
        device_type = "Bot".to_string();
        vendor = "Crawler/Spider".to_string();
        model = "Automated Bot".to_string();
    } else if ua.contains("iPad") || (ua.contains("Android") && !ua.contains("Mobile")) || ua.contains("Tablet") {
        device_type = "Tablet".to_string();
        vendor = if ua.contains("iPad") { "Apple".to_string() } else { "Generic".to_string() };
        model = if ua.contains("iPad") { "iPad".to_string() } else { "Tablet Device".to_string() };
    } else if ua.contains("iPhone") || ua.contains("Mobile") || ua.contains("Android") || ua.contains("iPod") {
        device_type = "Mobile".to_string();
        vendor = if ua.contains("iPhone") { "Apple".to_string() } else { "Generic".to_string() };
        model = if ua.contains("iPhone") { "iPhone".to_string() } else { "Smartphone".to_string() };
    }

    // 2. OS Detection
    let mut os_name = "Unknown".to_string();
    let mut os_version = "".to_string();

    if ua.contains("Windows NT 10.0") {
        os_name = "Windows".to_string();
        os_version = "10 / 11".to_string();
    } else if ua.contains("Windows NT 6.3") {
        os_name = "Windows".to_string();
        os_version = "8.1".to_string();
    } else if ua.contains("Windows NT 6.1") {
        os_name = "Windows".to_string();
        os_version = "7".to_string();
    } else if ua.contains("iPhone OS") || ua.contains("CPU iPhone OS") {
        os_name = "iOS".to_string();
        os_version = extract_version(ua, "OS ");
        if os_version.is_empty() {
            os_version = extract_version(ua, "iPhone OS ");
        }
    } else if ua.contains("Mac OS X") {
        os_name = "macOS".to_string();
        os_version = extract_version(ua, "Mac OS X ");
    } else if ua.contains("Android") {
        os_name = "Android".to_string();
        os_version = extract_version(ua, "Android ");
    } else if ua.contains("CrOS") {
        os_name = "Chrome OS".to_string();
        os_version = extract_version(ua, "CrOS ");
    } else if ua.contains("Linux") {
        os_name = "Linux".to_string();
    }

    // 3. Browser Detection
    let mut browser_name = "Unknown".to_string();
    let mut browser_version = "".to_string();

    if ua.contains("Edg/") {
        browser_name = "Microsoft Edge".to_string();
        browser_version = extract_version(ua, "Edg/");
    } else if ua.contains("OPR/") {
        browser_name = "Opera".to_string();
        browser_version = extract_version(ua, "OPR/");
    } else if ua.contains("MicroMessenger/") {
        browser_name = "WeChat (微信内嵌)".to_string();
        browser_version = extract_version(ua, "MicroMessenger/");
    } else if ua.contains("QQBrowser/") {
        browser_name = "QQ Browser".to_string();
        browser_version = extract_version(ua, "QQBrowser/");
    } else if ua.contains("Firefox/") {
        browser_name = "Firefox".to_string();
        browser_version = extract_version(ua, "Firefox/");
    } else if ua.contains("Chrome/") || ua.contains("CriOS/") {
        let v = extract_version(ua, "Chrome/");
        browser_version = if v.is_empty() { extract_version(ua, "CriOS/") } else { v };
        browser_name = "Chrome".to_string();
    } else if ua.contains("Safari/") && ua.contains("Version/") {
        browser_name = "Safari".to_string();
        browser_version = extract_version(ua, "Version/");
    } else if ua.contains("curl/") {
        browser_name = "curl CLI".to_string();
        browser_version = extract_version(ua, "curl/");
    } else if ua.contains("PostmanRuntime/") {
        browser_name = "Postman".to_string();
        browser_version = extract_version(ua, "PostmanRuntime/");
    }

    let major_version = browser_version.split('.').next().unwrap_or("").to_string();

    // 4. Engine Detection
    let mut engine_name = "Unknown".to_string();
    let mut engine_version = "".to_string();

    if ua.contains("AppleWebKit/") {
        engine_name = if browser_name == "Chrome" || browser_name == "Microsoft Edge" || browser_name == "Opera" {
            "Blink".to_string()
        } else {
            "WebKit".to_string()
        };
        engine_version = extract_version(ua, "AppleWebKit/");
    } else if ua.contains("Gecko/") && ua.contains("rv:") {
        engine_name = "Gecko".to_string();
        engine_version = extract_version(ua, "rv:");
    }

    // 5. CPU Detection
    let mut cpu = "unknown".to_string();
    if ua.contains("Win64; x64") || ua.contains("x86_64") || ua.contains("amd64") || ua.contains("WOW64") {
        cpu = "x86_64".to_string();
    } else if ua.contains("arm64") || ua.contains("aarch64") || (os_name == "macOS" && ua.contains("AppleWebKit")) {
        cpu = "arm64".to_string();
    } else if ua.contains("armv7") || ua.contains("arm") {
        cpu = "arm".to_string();
    } else if ua.contains("i686") || ua.contains("i386") || ua.contains("x86") {
        cpu = "x86".to_string();
    }

    let is_mobile = device_type == "Mobile";
    let is_tablet = device_type == "Tablet";
    let is_desktop = device_type == "Desktop";

    DeviceProfile {
        ua: ua.to_string(),
        browser: BrowserInfo {
            name: browser_name,
            version: browser_version,
            major_version,
        },
        os: OsInfo {
            name: os_name,
            version: os_version,
        },
        device: DeviceInfo {
            device_type,
            vendor,
            model,
        },
        engine: EngineInfo {
            name: engine_name,
            version: engine_version,
        },
        cpu,
        is_bot,
        is_mobile,
        is_tablet,
        is_desktop,
        client_details,
    }
}

#[derive(Debug, Deserialize)]
pub struct ParseParams {
    pub ua: String,
    #[serde(rename = "clientDetails")]
    pub client_details: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct DevicePreset {
    pub id: &'static str,
    pub name: &'static str,
    pub ua: &'static str,
    pub category: &'static str,
}

pub fn get_presets() -> Vec<DevicePreset> {
    vec![
        DevicePreset {
            id: "desktop-chrome-win11",
            name: "Windows 11 桌面版 Chrome 130",
            ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            category: "Desktop",
        },
        DevicePreset {
            id: "iphone-safari-ios18",
            name: "iPhone 16 Pro iOS 18 Safari",
            ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
            category: "Mobile",
        },
        DevicePreset {
            id: "android-pixel-chrome",
            name: "Google Pixel 9 Android 15 Chrome",
            ua: "Mozilla/5.0 (Linux; Android 15; Pixel 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.102 Mobile Safari/537.36",
            category: "Mobile",
        },
        DevicePreset {
            id: "macos-m3-safari",
            name: "MacBook Pro M3 macOS Sonoma Safari",
            ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15",
            category: "Desktop",
        },
        DevicePreset {
            id: "googlebot-spider",
            name: "Googlebot 官方搜索引擎蜘蛛",
            ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
            category: "Bot",
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
        "device/parse" | "device/sniff" => {
            let params: ParseParams = match serde_json::from_value(req.params) {
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

            let profile = parse_device(&params.ua, params.client_details);
            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(profile),
            })
        }
        "device/presets" | "device/samples" => {
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
    fn test_parse_desktop_chrome() {
        let ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
        let prof = parse_device(ua, None);
        assert_eq!(prof.browser.name, "Chrome");
        assert_eq!(prof.browser.major_version, "130");
        assert_eq!(prof.os.name, "Windows");
        assert_eq!(prof.device.device_type, "Desktop");
        assert!(!prof.is_bot);
        assert_eq!(prof.cpu, "x86_64");
    }

    #[test]
    fn test_parse_iphone_safari() {
        let ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";
        let prof = parse_device(ua, None);
        assert_eq!(prof.browser.name, "Safari");
        assert_eq!(prof.os.name, "iOS");
        assert_eq!(prof.device.device_type, "Mobile");
        assert_eq!(prof.device.vendor, "Apple");
    }

    #[test]
    fn test_parse_bot() {
        let ua = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
        let prof = parse_device(ua, None);
        assert!(prof.is_bot);
        assert_eq!(prof.device.device_type, "Bot");
    }
}
