extern crate alloc;

use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec;
use alloc::vec::Vec;
use core::slice;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct RenderOptions {
    pub text: String,
    #[serde(default = "default_font")]
    pub font: String,
    #[serde(rename = "fillChar")]
    pub fill_char: Option<char>,
    #[serde(rename = "letterSpacing", default = "default_spacing")]
    pub letter_spacing: usize,
}

fn default_font() -> String {
    "standard".to_string()
}

fn default_spacing() -> usize {
    1
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RenderResult {
    #[serde(rename = "renderedText")]
    pub rendered_text: String,
    pub width: usize,
    pub height: usize,
    pub font: String,
    #[serde(rename = "charCount")]
    pub char_count: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AsciiPreset {
    pub id: String,
    pub name: String,
    pub text: String,
    pub font: String,
}

// 5-Row Standard Font Glyphs
fn get_standard_glyph(c: char) -> [&'static str; 5] {
    match c {
        'A' => [r#"  /\  "#, r#" /  \ "#, r#"/ /\ \"#, r#"| |  |"#, r#"|_|  |"#],
        'B' => [r#"| _ \ "#, r#"| |_) "#, r#"| _ < "#, r#"| |_) "#, r#"|___/ "#],
        'C' => [r#" / __|"#, r#"/ /   "#, r#"| |   "#, r#"\ \__ "#, r#" \___|"#],
        'D' => [r#"|  _ \ "#, r#"| | \ \"#, r#"| | | |"#, r#"| |_/ /"#, r#"|____/ "#],
        'E' => [r#"| ____|"#, r#"| |__  "#, r#"|  __| "#, r#"| |___ "#, r#"|_____|"#],
        'F' => [r#"| ____|"#, r#"| |__  "#, r#"|  __| "#, r#"| |    "#, r#"|_|    "#],
        'G' => [r#" / ___|"#, r#"/ /  _ "#, r#"| | |_|"#, r#"\ \__| "#, r#" \____|"#],
        'H' => [r#"| |  | |"#, r#"| |__| |"#, r#"|  __  |"#, r#"| |  | |"#, r#"|_|  |_|"#],
        'I' => [r#"|_   _|"#, r#"  | |  "#, r#"  | |  "#, r#"  | |  "#, r#" |___| "#],
        'J' => [r#"    |_|"#, r#"      |"#, r#"      |"#, r#"| |   |"#, r#" \___/ "#],
        'K' => [r#"| |/ / "#, r#"| ' /  "#, r#"| . \  "#, r#"| |\ \ "#, r#"|_| \_\"#],
        'L' => [r#"| |    "#, r#"| |    "#, r#"| |    "#, r#"| |___ "#, r#"|_____|"#],
        'M' => [r#"| \/ |"#, r#"| \/ |"#, r#"| |\/| |"#, r#"| |  | |"#, r#"|_|  |_|"#],
        'N' => [r#"| \ | |"#, r#"|  \| |"#, r#"| . ` |"#, r#"| |\  |"#, r#"|_| \_|"#],
        'O' => [r#" / _ \ "#, r#"| | | |"#, r#"| | | |"#, r#"| |_| |"#, r#" \___/ "#],
        'P' => [r#"|  _ \ "#, r#"| |_) |"#, r#"|  __/ "#, r#"| |    "#, r#"|_|    "#],
        'Q' => [r#" / _ \ "#, r#"| | | |"#, r#"| | | |"#, r#"| |_| |"#, r#" \__\_\"#],
        'R' => [r#"|  _ \ "#, r#"| |_) |"#, r#"|  _ < "#, r#"| | \ \"#, r#"|_|  \_\"#],
        'S' => [r#" / ___|"#, r#"/ /___ "#, r#"\___ \ "#, r#" ___) |"#, r#"|____/ "#],
        'T' => [r#"|_____|"#, r#"  | |  "#, r#"  | |  "#, r#"  | |  "#, r#"  |_|  "#],
        'U' => [r#"| |  | |"#, r#"| |  | |"#, r#"| |  | |"#, r#"| |__| |"#, r#" \____/ "#],
        'V' => [r#"\ \  / /"#, r#" \ \/ / "#, r#"  \  /  "#, r#"   \/   "#, r#"   \/   "#],
        'W' => [r#"\ \      / /"#, r#" \ \ /\ / / "#, r#"  \ V  V /  "#, r#"   \_/\_/   "#, r#"   \_/\_/   "#],
        'X' => [r#"\ \/ /"#, r#" \  / "#, r#"  \/  "#, r#" /  \ "#, r#"/_/\_\"#],
        'Y' => [r#"\ \   / /"#, r#" \ \_/ / "#, r#"  \   /  "#, r#"   | |   "#, r#"   |_|   "#],
        'Z' => [r#"|___  / "#, r#"   / /  "#, r#"  / /   "#, r#" / /__  "#, r#"/_____| "#],
        '0' => [r#" / _ \ "#, r#"| | | |"#, r#"| | | |"#, r#"| |_| |"#, r#" \___/ "#],
        '1' => [r#" / |   "#, r#"/_ |   "#, r#" | |   "#, r#" | |   "#, r#" |_|   "#],
        '2' => [r#" ___   "#, r#"|__ \  "#, r#"   ) | "#, r#"  / /  "#, r#" /____|"#],
        '3' => [r#" _____ "#, r#"|___ / "#, r#"  |_ \ "#, r#" ___) |"#, r#"|____/ "#],
        '4' => [r#" _  _  "#, r#"| || | "#, r#"| || |_"#, r#"|__   _|"#, r#"   |_| "#],
        '5' => [r#" ____  "#, r#"| ___| "#, r#"|___ \ "#, r#" ___) |"#, r#"|____/ "#],
        '6' => [r#"  __   "#, r#" / /_  "#, r#"| '_ \ "#, r#"| (_) |"#, r#" \___/ "#],
        '7' => [r#" _____ "#, r#"|___  /"#, r#"   / / "#, r#"  / /  "#, r#" /_/   "#],
        '8' => [r#"  ___  "#, r#" ( _ ) "#, r#" / _ \ "#, r#"| (_) |"#, r#" \___/ "#],
        '9' => [r#"  ___  "#, r#" / _ \ "#, r#"| (_) |"#, r#" \__, |"#, r#"   /_/ "#],
        '!' => [r#" _ "#, r#"| |"#, r#"| |"#, r#" _ "#, r#"(_)"#],
        '?' => [r#" ___  "#, r#"|__ \ "#, r#"  / / "#, r#" |_|  "#, r#" (_)  "#],
        ':' => [r#"   "#, r#" o "#, r#"   "#, r#" o "#, r#"   "#],
        '.' => [r#"   "#, r#"   "#, r#"   "#, r#" _ "#, r#"(_)"#],
        '-' => [r#"     "#, r#"     "#, r#" --- "#, r#"     "#, r#"     "#],
        '+' => [r#"     "#, r#"  |  "#, r#"--+--"#, r#"  |  "#, r#"     "#],
        ' ' => [r#"   "#, r#"   "#, r#"   "#, r#"   "#, r#"   "#],
        _ => [r#" ___ "#, r#"|_ _|"#, r#" | | "#, r#" | | "#, r#"|___|"#],
    }
}

// 5-Row Heavy Block Font Glyphs
fn get_block_glyph(c: char) -> [&'static str; 5] {
    match c {
        'A' => ["█████", "█   █", "█████", "█   █", "█   █"],
        'B' => ["████ ", "█   █", "████ ", "█   █", "████ "],
        'C' => [" ████", "█    ", "█    ", "█    ", " ████"],
        'D' => ["████ ", "█   █", "█   █", "█   █", "████ "],
        'E' => ["█████", "█    ", "████ ", "█    ", "█████"],
        'F' => ["█████", "█    ", "████ ", "█    ", "█    "],
        'G' => [" ████", "█    ", "█  ██", "█   █", " ████"],
        'H' => ["█   █", "█   █", "█████", "█   █", "█   █"],
        'I' => ["█████", "  █  ", "  █  ", "  █  ", "█████"],
        'J' => ["   ██", "    █", "    █", "█   █", " ████"],
        'K' => ["█   █", "█  █ ", "███  ", "█  █ ", "█   █"],
        'L' => ["█    ", "█    ", "█    ", "█    ", "█████"],
        'M' => ["█   █", "██ ██", "█ █ █", "█   █", "█   █"],
        'N' => ["█   █", "██  █", "█ █ █", "█  ██", "█   █"],
        'O' => ["█████", "█   █", "█   █", "█   █", "█████"],
        'P' => ["█████", "█   █", "█████", "█    ", "█    "],
        'Q' => ["█████", "█   █", "█ █ █", "█████", "    █"],
        'R' => ["████ ", "█   █", "████ ", "█  █ ", "█   █"],
        'S' => [" ████", "█    ", " ███ ", "    █", "████ "],
        'T' => ["█████", "  █  ", "  █  ", "  █  ", "  █  "],
        'U' => ["█   █", "█   █", "█   █", "█   █", "█████"],
        'V' => ["█   █", "█   █", "█   █", " █ █ ", "  █  "],
        'W' => ["█   █", "█   █", "█ █ █", "██ ██", "█   █"],
        'X' => ["█   █", " █ █ ", "  █  ", " █ █ ", "█   █"],
        'Y' => ["█   █", " █ █ ", "  █  ", "  █  ", "  █  "],
        'Z' => ["█████", "   █ ", "  █  ", " █   ", "█████"],
        '0' => ["█████", "█  ██", "█ █ █", "██  █", "█████"],
        '1' => ["  ██ ", " █ █ ", "   █ ", "   █ ", "█████"],
        '2' => ["█████", "    █", "█████", "█    ", "█████"],
        '3' => ["█████", "    █", "█████", "    █", "█████"],
        '4' => ["█   █", "█   █", "█████", "    █", "    █"],
        '5' => ["█████", "█    ", "█████", "    █", "█████"],
        '6' => ["█████", "█    ", "█████", "█   █", "█████"],
        '7' => ["█████", "    █", "   █ ", "  █  ", "  █  "],
        '8' => ["█████", "█   █", "█████", "█   █", "█████"],
        '9' => ["█████", "█   █", "█████", "    █", "█████"],
        '!' => ["  █  ", "  █  ", "  █  ", "     ", "  █  "],
        '?' => ["████ ", "    █", "  ██ ", "     ", "  █  "],
        ':' => ["     ", "  █  ", "     ", "  █  ", "     "],
        '.' => ["     ", "     ", "     ", "     ", "  █  "],
        '-' => ["     ", "     ", "████ ", "     ", "     "],
        '+' => ["     ", "  █  ", "█████", "  █  ", "     "],
        ' ' => ["    ", "    ", "    ", "    ", "    "],
        _ => ["█████", "█ ? █", "█████", "█   █", "█████"],
    }
}

// 3-Row Compact Small Font Glyphs
fn get_small_glyph(c: char) -> [&'static str; 3] {
    match c {
        'A' => [r#" _ "#, r#"/_\"#, r#"| |"#],
        'B' => [r#"__ "#, r#"|_)"#, r#"|_)"#],
        'C' => [r#" __"#, r#"/  "#, r#"\__"#],
        'D' => [r#"__ "#, r#"| )"#, r#"|_/"#],
        'E' => [r#"___"#, r#"|_ "#, r#"|__"#],
        'F' => [r#"___"#, r#"|_ "#, r#"|  "#],
        'G' => [r#" __"#, r#"/ _"#, r#"\__|"#],
        'H' => [r#"   "#, r#"|_|"#, r#"| |"#],
        'I' => [r#"_"#, r#"|"#, r#"|"#],
        'J' => [r#" _"#, r#" |"#, r#"\_/"#],
        'K' => [r#"   "#, r#"|/<"#, r#"|\ "#],
        'L' => [r#"   "#, r#"|  "#, r#"|__"#],
        'M' => [r#"   "#, r#"|V|"#, r#"| |"#],
        'N' => [r#"   "#, r#"|\|"#, r#"| |"#],
        'O' => [r#" _ "#, r#"/ \"#, r#"\_/"#],
        'P' => [r#"__ "#, r#"|_)"#, r#"|  "#],
        'Q' => [r#" _ "#, r#"/ \"#, r#"\_X"#],
        'R' => [r#"__ "#, r#"|_)"#, r#"|\ "#],
        'S' => [r#" __"#, r#"(_ "#, r#"__)"#],
        'T' => [r#"___"#, r#" | "#, r#" | "#],
        'U' => [r#"   "#, r#"| |"#, r#"\_/"#],
        'V' => [r#"   "#, r#"\ /"#, r#" V "#],
        'W' => [r#"   "#, r#"|/|"#, r#"| |"#],
        'X' => [r#"   "#, r#">< "#, r#"/ \"#],
        'Y' => [r#"   "#, r#"\_/"#, r#" | "#],
        'Z' => [r#"___"#, r#" _/"#, r#"/__"#],
        '0' => [r#" _ "#, r#"/0\"#, r#"\_/"#],
        '1' => [r#" _ "#, r#"/| "#, r#" | "#],
        '2' => [r#"__ "#, r#" _)"#, r#"/__"#],
        '3' => [r#"__ "#, r#" _)"#, r#"__)"#],
        '4' => [r#"   "#, r#"|_|"#, r#"  |"#],
        '5' => [r#" __"#, r#"|_ "#, r#"__)"#],
        '6' => [r#" _ "#, r#"/_ "#, r#"\_)"#],
        '7' => [r#"___"#, r#"  /"#, r#" / "#],
        '8' => [r#" _ "#, r#"(_)"#, r#"(_)"#],
        '9' => [r#" _ "#, r#"(_\"#, r#" _/"#],
        '!' => [r#"!"#, r#"!"#, r#"."#],
        '?' => [r#"__ "#, r#" _)"#, r#" . "#],
        ':' => [r#" "#, r#":"#, r#" "#],
        '.' => [r#" "#, r#" "#, r#"."#],
        '-' => [r#"   "#, r#"---"#, r#"   "#],
        '+' => [r#"   "#, r#"-+-"#, r#"   "#],
        ' ' => [r#"  "#, r#"  "#, r#"  "#],
        _ => [r#"["#, r#"?"#, r#"]"#],
    }
}

pub fn render_ascii(opts: &RenderOptions) -> RenderResult {
    let font = opts.font.to_lowercase();
    let text = opts.text.trim();
    let spacing_str: String = (0..opts.letter_spacing).map(|_| ' ').collect();

    let height = if font == "small" { 3 } else { 5 };
    let mut rows: Vec<String> = (0..height).map(|_| String::new()).collect();

    for ch in text.chars() {
        let upper_ch = ch.to_ascii_uppercase();
        let glyph: Vec<&'static str> = match font.as_str() {
            "block" => get_block_glyph(upper_ch).to_vec(),
            "small" => get_small_glyph(upper_ch).to_vec(),
            _ => get_standard_glyph(upper_ch).to_vec(),
        };

        for (row_idx, glyph_line) in glyph.iter().enumerate() {
            if !rows[row_idx].is_empty() {
                rows[row_idx].push_str(&spacing_str);
            }
            if let Some(fc) = opts.fill_char {
                // Replace non-space glyph characters with fill_char
                let replaced: String = glyph_line
                    .chars()
                    .map(|gc| if gc != ' ' { fc } else { ' ' })
                    .collect();
                rows[row_idx].push_str(&replaced);
            } else {
                rows[row_idx].push_str(glyph_line);
            }
        }
    }

    let rendered_text = rows.join("\n");
    let width = rows.iter().map(|r| r.chars().count()).max().unwrap_or(0);

    RenderResult {
        rendered_text,
        width,
        height,
        font,
        char_count: text.chars().count(),
    }
}

pub fn get_presets() -> Vec<AsciiPreset> {
    vec![
        AsciiPreset {
            id: "wasm-forge".to_string(),
            name: "WASM FORGE (Standard)".to_string(),
            text: "WASM FORGE".to_string(),
            font: "standard".to_string(),
        },
        AsciiPreset {
            id: "rust-block".to_string(),
            name: "RUST 2026 (Block)".to_string(),
            text: "RUST 2026".to_string(),
            font: "block".to_string(),
        },
        AsciiPreset {
            id: "compact-small".to_string(),
            name: "STANDALONE (Small)".to_string(),
            text: "STANDALONE".to_string(),
            font: "small".to_string(),
        },
        AsciiPreset {
            id: "matrix-hack".to_string(),
            name: "CYBERPUNK (Standard)".to_string(),
            text: "CYBERPUNK".to_string(),
            font: "standard".to_string(),
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
        "ascii/render" | "ascii/draw" => {
            let opts: RenderOptions = serde_json::from_value(req.params).unwrap_or(RenderOptions {
                text: "WASM".to_string(),
                font: default_font(),
                fill_char: None,
                letter_spacing: default_spacing(),
            });

            let res = render_ascii(&opts);

            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(res),
            })
        }
        "ascii/presets" | "ascii/samples" => {
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
    fn test_render_standard() {
        let opts = RenderOptions {
            text: "WASM".to_string(),
            font: "standard".to_string(),
            fill_char: None,
            letter_spacing: 1,
        };
        let res = render_ascii(&opts);
        assert_eq!(res.height, 5);
        assert!(res.width > 15);
        assert!(res.rendered_text.contains('\n'));
    }

    #[test]
    fn test_render_block() {
        let opts = RenderOptions {
            text: "RUST".to_string(),
            font: "block".to_string(),
            fill_char: None,
            letter_spacing: 1,
        };
        let res = render_ascii(&opts);
        assert_eq!(res.height, 5);
        assert!(res.rendered_text.contains('█'));
    }

    #[test]
    fn test_render_small_and_fill() {
        let opts = RenderOptions {
            text: "OK".to_string(),
            font: "small".to_string(),
            fill_char: Some('#'),
            letter_spacing: 1,
        };
        let res = render_ascii(&opts);
        assert_eq!(res.height, 3);
        assert!(res.rendered_text.contains('#'));
    }
}
