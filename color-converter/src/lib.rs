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
struct ConvertColorParams {
    input: String,
}

#[derive(Serialize, Clone, Debug)]
pub struct RgbValues {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub a: f64,
}

#[derive(Serialize, Clone, Debug)]
pub struct HslValues {
    pub h: f64,
    pub s: f64,
    pub l: f64,
}

#[derive(Serialize, Clone, Debug)]
pub struct HsvValues {
    pub h: f64,
    pub s: f64,
    pub v: f64,
}

#[derive(Serialize, Clone, Debug)]
pub struct CmykValues {
    pub c: f64,
    pub m: f64,
    pub y: f64,
    pub k: f64,
}

#[derive(Serialize, Clone, Debug)]
pub struct ColorProfile {
    pub hex: String,
    pub hex8: String,
    pub rgb: String,
    pub rgba: String,
    #[serde(rename = "rgbValues")]
    pub rgb_values: RgbValues,
    pub hsl: String,
    #[serde(rename = "hslValues")]
    pub hsl_values: HslValues,
    pub hsv: String,
    #[serde(rename = "hsvValues")]
    pub hsv_values: HsvValues,
    pub cmyk: String,
    #[serde(rename = "cmykValues")]
    pub cmyk_values: CmykValues,
    pub luminance: f64,
    #[serde(rename = "contrastWhite")]
    pub contrast_white: f64,
    #[serde(rename = "contrastBlack")]
    pub contrast_black: f64,
    #[serde(rename = "isLight")]
    pub is_light: bool,
}

#[derive(Serialize)]
pub struct SampleResult {
    pub palette: Vec<ColorProfile>,
}

// ---------------- Color Conversion Algorithms ----------------

fn round_2(v: f64) -> f64 {
    (v * 100.0).round() / 100.0
}

fn round_1(v: f64) -> f64 {
    (v * 10.0).round() / 10.0
}

fn parse_hex_component(s: &str) -> Result<u8, String> {
    u8::from_str_radix(s, 16).map_err(|e| format!("无效十六进制字符: {}", e))
}

fn parse_color(input_str: &str) -> Result<(u8, u8, u8, f64), String> {
    let clean = input_str.trim().to_ascii_lowercase();

    // 1. HEX 格式
    if clean.starts_with('#') || (clean.len() >= 3 && clean.chars().all(|c| c.is_ascii_hexdigit())) {
        let hex_body = clean.trim_start_matches('#');
        match hex_body.len() {
            3 => {
                let r = parse_hex_component(&hex_body[0..1].repeat(2))?;
                let g = parse_hex_component(&hex_body[1..2].repeat(2))?;
                let b = parse_hex_component(&hex_body[2..3].repeat(2))?;
                return Ok((r, g, b, 1.0));
            }
            4 => {
                let r = parse_hex_component(&hex_body[0..1].repeat(2))?;
                let g = parse_hex_component(&hex_body[1..2].repeat(2))?;
                let b = parse_hex_component(&hex_body[2..3].repeat(2))?;
                let a = parse_hex_component(&hex_body[3..4].repeat(2))? as f64 / 255.0;
                return Ok((r, g, b, round_2(a)));
            }
            6 => {
                let r = parse_hex_component(&hex_body[0..2])?;
                let g = parse_hex_component(&hex_body[2..4])?;
                let b = parse_hex_component(&hex_body[4..6])?;
                return Ok((r, g, b, 1.0));
            }
            8 => {
                let r = parse_hex_component(&hex_body[0..2])?;
                let g = parse_hex_component(&hex_body[2..4])?;
                let b = parse_hex_component(&hex_body[4..6])?;
                let a = parse_hex_component(&hex_body[6..8])? as f64 / 255.0;
                return Ok((r, g, b, round_2(a)));
            }
            _ => return Err("无效的 HEX 格式长度 (支持 #RGB, #RGBA, #RRGGBB, #RRGGBBAA)".to_string()),
        }
    }

    // 2. Functional: rgb(r, g, b) 或 rgba(r, g, b, a)
    if clean.starts_with("rgb") {
        let start = clean.find('(').ok_or("缺少 '('")?;
        let end = clean.rfind(')').ok_or("缺少 ')'")?;
        let inner = &clean[start + 1..end];
        let parts: Vec<&str> = inner.split(|c| c == ',' || c == '/' || c == ' ').filter(|s| !s.is_empty()).collect();
        if parts.len() >= 3 {
            let r: u8 = parts[0].trim().parse().map_err(|_| "RGB R 分量无效")?;
            let g: u8 = parts[1].trim().parse().map_err(|_| "RGB G 分量无效")?;
            let b: u8 = parts[2].trim().parse().map_err(|_| "RGB B 分量无效")?;
            let a: f64 = if parts.len() >= 4 {
                let a_str = parts[3].trim().trim_end_matches('%');
                if parts[3].ends_with('%') {
                    a_str.parse::<f64>().map_err(|_| "RGBA Alpha 百分比无效")? / 100.0
                } else {
                    a_str.parse::<f64>().map_err(|_| "RGBA Alpha 分量无效")?
                }
            } else {
                1.0
            };
            return Ok((r, g, b, round_2(a.clamp(0.0, 1.0))));
        }
    }

    // 3. Functional: hsl(h, s%, l%) 或 hsla(...)
    if clean.starts_with("hsl") {
        let start = clean.find('(').ok_or("缺少 '('")?;
        let end = clean.rfind(')').ok_or("缺少 ')'")?;
        let inner = &clean[start + 1..end];
        let parts: Vec<&str> = inner.split(|c| c == ',' || c == '/' || c == ' ').filter(|s| !s.is_empty()).collect();
        if parts.len() >= 3 {
            let h: f64 = parts[0].trim().trim_end_matches("deg").parse().map_err(|_| "HSL Hue 无效")?;
            let s: f64 = parts[1].trim().trim_end_matches('%').parse().map_err(|_| "HSL Saturation 无效")?;
            let l: f64 = parts[2].trim().trim_end_matches('%').parse().map_err(|_| "HSL Lightness 无效")?;
            let a: f64 = if parts.len() >= 4 {
                let a_str = parts[3].trim().trim_end_matches('%');
                if parts[3].ends_with('%') {
                    a_str.parse::<f64>().map_err(|_| "HSLA Alpha 百分比无效")? / 100.0
                } else {
                    a_str.parse::<f64>().map_err(|_| "HSLA Alpha 分量无效")?
                }
            } else {
                1.0
            };
            let (r, g, b) = hsl_to_rgb(h, s, l);
            return Ok((r, g, b, round_2(a.clamp(0.0, 1.0))));
        }
    }

    // 4. Functional: cmyk(c%, m%, y%, k%)
    if clean.starts_with("cmyk") {
        let start = clean.find('(').ok_or("缺少 '('")?;
        let end = clean.rfind(')').ok_or("缺少 ')'")?;
        let inner = &clean[start + 1..end];
        let parts: Vec<&str> = inner.split(|c| c == ',' || c == ' ').filter(|s| !s.is_empty()).collect();
        if parts.len() >= 4 {
            let c: f64 = parts[0].trim().trim_end_matches('%').parse().map_err(|_| "CMYK C 分量无效")?;
            let m: f64 = parts[1].trim().trim_end_matches('%').parse().map_err(|_| "CMYK M 分量无效")?;
            let y: f64 = parts[2].trim().trim_end_matches('%').parse().map_err(|_| "CMYK Y 分量无效")?;
            let k: f64 = parts[3].trim().trim_end_matches('%').parse().map_err(|_| "CMYK K 分量无效")?;
            let (r, g, b) = cmyk_to_rgb(c, m, y, k);
            return Ok((r, g, b, 1.0));
        }
    }

    Err(format!("无法识别的颜色格式: '{}'. 支持 HEX, RGB, HSL, CMYK", input_str))
}

fn hsl_to_rgb(h_deg: f64, s_pct: f64, l_pct: f64) -> (u8, u8, u8) {
    let h = ((h_deg % 360.0) + 360.0) % 360.0;
    let s = (s_pct / 100.0).clamp(0.0, 1.0);
    let l = (l_pct / 100.0).clamp(0.0, 1.0);

    let c = (1.0 - (2.0 * l - 1.0).abs()) * s;
    let x = c * (1.0 - (((h / 60.0) % 2.0) - 1.0).abs());
    let m = l - c / 2.0;

    let (r_prime, g_prime, b_prime) = if h < 60.0 {
        (c, x, 0.0)
    } else if h < 120.0 {
        (x, c, 0.0)
    } else if h < 180.0 {
        (0.0, c, x)
    } else if h < 240.0 {
        (0.0, x, c)
    } else if h < 300.0 {
        (x, 0.0, c)
    } else {
        (c, 0.0, x)
    };

    let r = ((r_prime + m) * 255.0).round().clamp(0.0, 255.0) as u8;
    let g = ((g_prime + m) * 255.0).round().clamp(0.0, 255.0) as u8;
    let b = ((b_prime + m) * 255.0).round().clamp(0.0, 255.0) as u8;
    (r, g, b)
}

fn cmyk_to_rgb(c_pct: f64, m_pct: f64, y_pct: f64, k_pct: f64) -> (u8, u8, u8) {
    let c = (c_pct / 100.0).clamp(0.0, 1.0);
    let m = (m_pct / 100.0).clamp(0.0, 1.0);
    let y = (y_pct / 100.0).clamp(0.0, 1.0);
    let k = (k_pct / 100.0).clamp(0.0, 1.0);

    let r = (255.0 * (1.0 - c) * (1.0 - k)).round().clamp(0.0, 255.0) as u8;
    let g = (255.0 * (1.0 - m) * (1.0 - k)).round().clamp(0.0, 255.0) as u8;
    let b = (255.0 * (1.0 - y) * (1.0 - k)).round().clamp(0.0, 255.0) as u8;
    (r, g, b)
}

fn rgb_to_hsl(r: u8, g: u8, b: u8) -> HslValues {
    let rf = r as f64 / 255.0;
    let gf = g as f64 / 255.0;
    let bf = b as f64 / 255.0;

    let max = rf.max(gf).max(bf);
    let min = rf.min(gf).min(bf);
    let delta = max - min;

    let l = (max + min) / 2.0;

    let (h, s) = if delta == 0.0 {
        (0.0, 0.0)
    } else {
        let s = if l < 0.5 {
            delta / (max + min)
        } else {
            delta / (2.0 - max - min)
        };

        let mut h = if max == rf {
            ((gf - bf) / delta) + (if gf < bf { 6.0 } else { 0.0 })
        } else if max == gf {
            ((bf - rf) / delta) + 2.0
        } else {
            ((rf - gf) / delta) + 4.0
        };
        h *= 60.0;
        (h, s)
    };

    HslValues {
        h: round_1(h),
        s: round_1(s * 100.0),
        l: round_1(l * 100.0),
    }
}

fn rgb_to_hsv(r: u8, g: u8, b: u8) -> HsvValues {
    let rf = r as f64 / 255.0;
    let gf = g as f64 / 255.0;
    let bf = b as f64 / 255.0;

    let max = rf.max(gf).max(bf);
    let min = rf.min(gf).min(bf);
    let delta = max - min;

    let v = max;
    let s = if max == 0.0 { 0.0 } else { delta / max };

    let mut h = if delta == 0.0 {
        0.0
    } else if max == rf {
        ((gf - bf) / delta) + (if gf < bf { 6.0 } else { 0.0 })
    } else if max == gf {
        ((bf - rf) / delta) + 2.0
    } else {
        ((rf - gf) / delta) + 4.0
    };
    h *= 60.0;

    HsvValues {
        h: round_1(h),
        s: round_1(s * 100.0),
        v: round_1(v * 100.0),
    }
}

fn rgb_to_cmyk(r: u8, g: u8, b: u8) -> CmykValues {
    let rf = r as f64 / 255.0;
    let gf = g as f64 / 255.0;
    let bf = b as f64 / 255.0;

    let k = 1.0 - rf.max(gf).max(bf);
    if k >= 1.0 {
        return CmykValues { c: 0.0, m: 0.0, y: 0.0, k: 100.0 };
    }

    let c = (1.0 - rf - k) / (1.0 - k);
    let m = (1.0 - gf - k) / (1.0 - k);
    let y = (1.0 - bf - k) / (1.0 - k);

    CmykValues {
        c: round_1(c.clamp(0.0, 1.0) * 100.0),
        m: round_1(m.clamp(0.0, 1.0) * 100.0),
        y: round_1(y.clamp(0.0, 1.0) * 100.0),
        k: round_1(k.clamp(0.0, 1.0) * 100.0),
    }
}

// WCAG 2.1 相对亮度计算
fn calculate_wcag_luminance(r: u8, g: u8, b: u8) -> f64 {
    fn to_linear(c: u8) -> f64 {
        let v = c as f64 / 255.0;
        if v <= 0.04045 {
            v / 12.92
        } else {
            // Note: v + 0.055 / 1.055 ^ 2.4. In pure std/no_std we can use powf
            ((v + 0.055) / 1.055).powf(2.4)
        }
    }

    let r_lin = to_linear(r);
    let g_lin = to_linear(g);
    let b_lin = to_linear(b);

    round_2(0.2126 * r_lin + 0.7152 * g_lin + 0.0722 * b_lin)
}

pub fn convert_color(input_str: &str) -> Result<ColorProfile, String> {
    let (r, g, b, a) = parse_color(input_str)?;

    let hex = format!("#{:02x}{:02x}{:02x}", r, g, b);
    let hex8 = format!("#{:02x}{:02x}{:02x}{:02x}", r, g, b, (a * 255.0).round() as u8);
    let rgb = format!("rgb({}, {}, {})", r, g, b);
    let rgba = format!("rgba({}, {}, {}, {})", r, g, b, a);

    let hsl_values = rgb_to_hsl(r, g, b);
    let hsl = format!("hsl({:.0}, {:.0}%, {:.0}%)", hsl_values.h, hsl_values.s, hsl_values.l);

    let hsv_values = rgb_to_hsv(r, g, b);
    let hsv = format!("hsv({:.0}, {:.0}%, {:.0}%)", hsv_values.h, hsv_values.s, hsv_values.v);

    let cmyk_values = rgb_to_cmyk(r, g, b);
    let cmyk = format!("cmyk({:.0}%, {:.0}%, {:.0}%, {:.0}%)", cmyk_values.c, cmyk_values.m, cmyk_values.y, cmyk_values.k);

    let luminance = calculate_wcag_luminance(r, g, b);
    let contrast_white = round_2((1.0 + 0.05) / (luminance + 0.05));
    let contrast_black = round_2((luminance + 0.05) / (0.0 + 0.05));
    let is_light = luminance > 0.179;

    Ok(ColorProfile {
        hex,
        hex8,
        rgb,
        rgba,
        rgb_values: RgbValues { r, g, b, a },
        hsl,
        hsl_values,
        hsv,
        hsv_values,
        cmyk,
        cmyk_values,
        luminance,
        contrast_white,
        contrast_black,
        is_light,
    })
}

pub fn get_sample_palette() -> SampleResult {
    let samples = [
        "#38bdf8", // Sky 400
        "#34d399", // Emerald 400
        "#8b5cf6", // Violet 500
        "#fbbf24", // Amber 400
        "#f43f5e", // Rose 500
    ];

    let palette = samples
        .iter()
        .filter_map(|s| convert_color(s).ok())
        .collect();

    SampleResult { palette }
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
        "color/convert" => {
            let params: ConvertColorParams = match req.params {
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

            match convert_color(&params.input) {
                Ok(out) => {
                    let res = ResponseEnvelope {
                        code: 0,
                        msg: "颜色转换成功".to_string(),
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
        "color/sample" => {
            let sample = get_sample_palette();
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
    fn test_hex_conversion() {
        let res = convert_color("#38bdf8").unwrap();
        assert_eq!(res.hex, "#38bdf8");
        assert_eq!(res.rgb_values.r, 56);
        assert_eq!(res.rgb_values.g, 189);
        assert_eq!(res.rgb_values.b, 248);
        assert!(res.hsl.starts_with("hsl(198"));
    }

    #[test]
    fn test_rgb_conversion() {
        let res = convert_color("rgb(255, 0, 128)").unwrap();
        assert_eq!(res.hex, "#ff0080");
        assert_eq!(res.rgb_values.r, 255);
        assert_eq!(res.rgb_values.g, 0);
        assert_eq!(res.rgb_values.b, 128);
    }

    #[test]
    fn test_hsl_conversion() {
        let res = convert_color("hsl(120, 100%, 50%)").unwrap();
        assert_eq!(res.hex, "#00ff00");
    }

    #[test]
    fn test_sample_palette() {
        let sample = get_sample_palette();
        assert_eq!(sample.palette.len(), 5);
        assert_eq!(sample.palette[0].hex, "#38bdf8");
    }
}
