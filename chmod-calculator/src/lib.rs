extern crate alloc;

use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec::Vec;
use serde::{Deserialize, Serialize};

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

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
struct TripletBits {
    read: bool,
    write: bool,
    execute: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
struct SpecialBits {
    suid: bool,
    sgid: bool,
    sticky: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
struct PermissionBreakdown {
    user: TripletBits,
    group: TripletBits,
    others: TripletBits,
    special: SpecialBits,
}

#[derive(Debug, Serialize)]
struct ChmodCommandVariants {
    numeric: String,
    symbolic: String,
    recursive: String,
}

#[derive(Debug, Serialize)]
struct UmaskEffect {
    umask: String,
    file_mode_octal: String,
    file_mode_symbolic: String,
    dir_mode_octal: String,
    dir_mode_symbolic: String,
}

#[derive(Debug, Serialize)]
struct ChmodCalculateResult {
    octal3: String,
    octal4: String,
    symbolic9: String,
    symbolic10: String,
    bits: PermissionBreakdown,
    commands: ChmodCommandVariants,
    security_notes: Vec<String>,
    umask_effect: Option<UmaskEffect>,
}

#[derive(Debug, Serialize)]
struct PresetItem {
    octal: String,
    symbolic: String,
    name: String,
    description: String,
    category: String,
}

#[derive(Debug, Serialize)]
struct PresetListResult {
    presets: Vec<PresetItem>,
}

// 核心权限位解析逻辑
fn mode_to_symbolic(mode: u32, is_dir: bool) -> (String, String) {
    let mut chars: [char; 9] = ['-'; 9];

    // User
    if (mode & 0o400) != 0 { chars[0] = 'r'; }
    if (mode & 0o200) != 0 { chars[1] = 'w'; }
    if (mode & 0o4000) != 0 {
        chars[2] = if (mode & 0o100) != 0 { 's' } else { 'S' };
    } else if (mode & 0o100) != 0 {
        chars[2] = 'x';
    }

    // Group
    if (mode & 0o040) != 0 { chars[3] = 'r'; }
    if (mode & 0o020) != 0 { chars[4] = 'w'; }
    if (mode & 0o2000) != 0 {
        chars[5] = if (mode & 0o010) != 0 { 's' } else { 'S' };
    } else if (mode & 0o010) != 0 {
        chars[5] = 'x';
    }

    // Others
    if (mode & 0o004) != 0 { chars[6] = 'r'; }
    if (mode & 0o002) != 0 { chars[7] = 'w'; }
    if (mode & 0o1000) != 0 {
        chars[8] = if (mode & 0o001) != 0 { 't' } else { 'T' };
    } else if (mode & 0o001) != 0 {
        chars[8] = 'x';
    }

    let sym9: String = chars.iter().collect();
    let prefix = if is_dir { 'd' } else { '-' };
    let sym10 = format!("{}{}", prefix, sym9);
    (sym9, sym10)
}

fn mode_to_breakdown(mode: u32) -> PermissionBreakdown {
    PermissionBreakdown {
        user: TripletBits {
            read: (mode & 0o400) != 0,
            write: (mode & 0o200) != 0,
            execute: (mode & 0o100) != 0,
        },
        group: TripletBits {
            read: (mode & 0o040) != 0,
            write: (mode & 0o020) != 0,
            execute: (mode & 0o010) != 0,
        },
        others: TripletBits {
            read: (mode & 0o004) != 0,
            write: (mode & 0o002) != 0,
            execute: (mode & 0o001) != 0,
        },
        special: SpecialBits {
            suid: (mode & 0o4000) != 0,
            sgid: (mode & 0o2000) != 0,
            sticky: (mode & 0o1000) != 0,
        },
    }
}

fn breakdown_to_mode(b: &PermissionBreakdown) -> u32 {
    let mut mode: u32 = 0;
    if b.special.suid { mode |= 0o4000; }
    if b.special.sgid { mode |= 0o2000; }
    if b.special.sticky { mode |= 0o1000; }

    if b.user.read { mode |= 0o400; }
    if b.user.write { mode |= 0o200; }
    if b.user.execute { mode |= 0o100; }

    if b.group.read { mode |= 0o040; }
    if b.group.write { mode |= 0o020; }
    if b.group.execute { mode |= 0o010; }

    if b.others.read { mode |= 0o004; }
    if b.others.write { mode |= 0o002; }
    if b.others.execute { mode |= 0o001; }

    mode
}

fn parse_octal_str(s: &str) -> Result<u32, String> {
    let trimmed = s.trim();
    if trimmed.is_empty() {
        return Err("八进制输入不能为空".into());
    }
    let sanitized = trimmed.strip_prefix("0o").or_else(|| trimmed.strip_prefix('0')).unwrap_or(trimmed);
    let target = if sanitized.is_empty() { "0" } else { sanitized };
    u32::from_str_radix(target, 8).map_err(|e| format!("八进制格式非法: {}", e))
}

fn parse_symbolic_str(s: &str) -> Result<u32, String> {
    let clean: String = s.chars().filter(|c| !c.is_whitespace()).collect();
    let chars: Vec<char> = clean.chars().collect();
    
    // 支持 9 位或 10 位（包含前缀 -/d/l/c/b 等）
    let slice = if chars.len() == 10 {
        &chars[1..10]
    } else if chars.len() == 9 {
        &chars[0..9]
    } else {
        return Err("符号权限串长度必须为 9 位或 10 位 (例如 rwxr-xr-x 或 -rwxr-xr-x)".into());
    };

    let mut mode: u32 = 0;

    // User (r, w, x/s/S)
    if slice[0] == 'r' { mode |= 0o400; }
    if slice[1] == 'w' { mode |= 0o200; }
    match slice[2] {
        'x' => mode |= 0o100,
        's' => mode |= 0o4000 | 0o100,
        'S' => mode |= 0o4000,
        '-' => {},
        c => return Err(format!("位置 3 字符非法 '{}', 期望为 x, s, S, -", c)),
    }

    // Group (r, w, x/s/S)
    if slice[3] == 'r' { mode |= 0o040; }
    if slice[4] == 'w' { mode |= 0o020; }
    match slice[5] {
        'x' => mode |= 0o010,
        's' => mode |= 0o2000 | 0o010,
        'S' => mode |= 0o2000,
        '-' => {},
        c => return Err(format!("位置 6 字符非法 '{}', 期望为 x, s, S, -", c)),
    }

    // Others (r, w, x/t/T)
    if slice[6] == 'r' { mode |= 0o004; }
    if slice[7] == 'w' { mode |= 0o002; }
    match slice[8] {
        'x' => mode |= 0o001,
        't' => mode |= 0o1000 | 0o001,
        'T' => mode |= 0o1000,
        '-' => {},
        c => return Err(format!("位置 9 字符非法 '{}', 期望为 x, t, T, -", c)),
    }

    Ok(mode)
}

fn build_symbolic_command(b: &PermissionBreakdown) -> String {
    let mut parts: Vec<String> = Vec::new();

    // User
    let mut u = String::new();
    if b.user.read { u.push('r'); }
    if b.user.write { u.push('w'); }
    if b.user.execute { u.push('x'); }
    if b.special.suid { u.push('s'); }
    if !u.is_empty() {
        parts.push(format!("u={}", u));
    } else {
        parts.push("u=".into());
    }

    // Group
    let mut g = String::new();
    if b.group.read { g.push('r'); }
    if b.group.write { g.push('w'); }
    if b.group.execute { g.push('x'); }
    if b.special.sgid { g.push('s'); }
    if !g.is_empty() {
        parts.push(format!("g={}", g));
    } else {
        parts.push("g=".into());
    }

    // Others
    let mut o = String::new();
    if b.others.read { o.push('r'); }
    if b.others.write { o.push('w'); }
    if b.others.execute { o.push('x'); }
    if b.special.sticky { o.push('t'); }
    if !o.is_empty() {
        parts.push(format!("o={}", o));
    } else {
        parts.push("o=".into());
    }

    parts.join(",")
}

fn generate_security_notes(mode: u32) -> Vec<String> {
    let mut notes = Vec::new();

    if (mode & 0o777) == 0o777 {
        notes.push("⚠️ 高危权限 777 (rwxrwxrwx): 任何用户均可读取、篡改或执行，严重违反最小权限准则！".into());
    } else if (mode & 0o002) != 0 {
        notes.push("⚠️ 警告: 其他用户 (Others) 拥有写权限，未授权用户可篡改或注入恶意内容。".into());
    }

    if (mode & 0o4000) != 0 {
        notes.push("ℹ️ SUID 标志生效: 任意执行者将以文件拥有者权限运行此程序 (如 /usr/bin/passwd)。".into());
    }
    if (mode & 0o2000) != 0 {
        notes.push("ℹ️ SGID 标志生效: 任意执行者将以所属组权限运行；应用于目录时新文件继承该目录的组。".into());
    }
    if (mode & 0o1000) != 0 {
        notes.push("ℹ️ Sticky Bit 粘滞位生效: 仅文件所有者或 root 用户才能删除或重命名该目录下的文件 (如 /tmp)。".into());
    }

    if (mode & 0o777) == 0o700 || (mode & 0o777) == 0o600 {
        notes.push("🔒 私密模式: 仅所有者拥有访问权限，非常适合 SSH 私钥 (~/.ssh/id_rsa) 或敏感凭证文件。".into());
    }

    notes
}

fn calculate_umask_effect(umask_mode: u32) -> UmaskEffect {
    let file_mode = (0o666 & !umask_mode) & 0o777;
    let dir_mode = (0o777 & !umask_mode) & 0o777;

    let (file_s9, file_s10) = mode_to_symbolic(file_mode, false);
    let (dir_s9, dir_s10) = mode_to_symbolic(dir_mode, true);

    UmaskEffect {
        umask: format!("{:03o}", umask_mode & 0o777),
        file_mode_octal: format!("{:03o}", file_mode),
        file_mode_symbolic: format!("{} ({})", file_s10, file_s9),
        dir_mode_octal: format!("{:03o}", dir_mode),
        dir_mode_symbolic: format!("{} ({})", dir_s10, dir_s9),
    }
}

fn get_all_presets() -> Vec<PresetItem> {
    alloc::vec![
        PresetItem {
            octal: "755".into(),
            symbolic: "-rwxr-xr-x".into(),
            name: "标准可执行程序 / 目录".into(),
            description: "所有者读写执行，组与其他用户只读并可执行 (Linux 目录默认)".into(),
            category: "常见标准".into(),
        },
        PresetItem {
            octal: "644".into(),
            symbolic: "-rw-r--r--".into(),
            name: "标准普通文本文件".into(),
            description: "所有者可读写，组与其他用户只读 (Linux 普通文件默认)".into(),
            category: "常见标准".into(),
        },
        PresetItem {
            octal: "700".into(),
            symbolic: "-rwx------".into(),
            name: "私有可执行文件 / 用户目录".into(),
            description: "仅所有者可读写执行，其他人完全隔离 (如 ~/.ssh/ 目录)".into(),
            category: "安全隔离".into(),
        },
        PresetItem {
            octal: "600".into(),
            symbolic: "-rw-------".into(),
            name: "私密凭证与密钥".into(),
            description: "仅所有者可读写，其他人无权访问 (如 id_rsa 私钥、.env 文件)".into(),
            category: "安全隔离".into(),
        },
        PresetItem {
            octal: "400".into(),
            symbolic: "-r--------".into(),
            name: "只读保护文件".into(),
            description: "仅所有者只读，防止被意外篡改或删除 (如只读证书)".into(),
            category: "安全隔离".into(),
        },
        PresetItem {
            octal: "777".into(),
            symbolic: "-rwxrwxrwx".into(),
            name: "完全开放权限 (高危)".into(),
            description: "所有用户完全读写执行控制，通常仅用于开发临时排错，生产严禁使用".into(),
            category: "特殊模式".into(),
        },
        PresetItem {
            octal: "666".into(),
            symbolic: "-rw-rw-rw-".into(),
            name: "所有人可读写文件".into(),
            description: "所有用户均可读取并覆盖写入，但无执行权".into(),
            category: "特殊模式".into(),
        },
        PresetItem {
            octal: "4755".into(),
            symbolic: "-rwsr-xr-x".into(),
            name: "SUID Root 特权二进制".into(),
            description: "以文件所有者身份运行程序，常用于需要提权的基础工具 (如 passwd, sudo)".into(),
            category: "特殊标志位".into(),
        },
        PresetItem {
            octal: "2755".into(),
            symbolic: "-rwxr-sr-x".into(),
            name: "SGID 协作目录 / 程序".into(),
            description: "组执行标志位替换为 s，目录内新文件继承父目录所属组，适合共享开发目录".into(),
            category: "特殊标志位".into(),
        },
        PresetItem {
            octal: "1777".into(),
            symbolic: "drwxrwxrwt".into(),
            name: "Sticky Bit 共享临时目录".into(),
            description: "所有人可创建写入，但只有文件作者本人或 root 可以删除 (如 /tmp 目录)".into(),
            category: "特殊标志位".into(),
        },
    ]
}

// ==============================================================================
// 内存管理与纯 C-ABI 导出
// ==============================================================================

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
    let slice = core::slice::from_raw_parts(ptr, len);
    let req: RequestEnvelope = match serde_json::from_slice(slice) {
        Ok(r) => r,
        Err(e) => {
            return pack_response(&ResponseEnvelope::<()> {
                code: 400,
                msg: format!("请求 JSON 反序列化失败: {}", e),
                request_id: "".into(),
                data: None,
            });
        }
    };

    let req_id = req.request_id.unwrap_or_else(|| "default".into());

    match req.action.as_str() {
        "chmod/calculate" => {
            let mut resolved_mode: Option<u32> = None;

            // 1. 优先尝试 bits 参数
            if let Some(bits_val) = req.params.get("bits") {
                if let Ok(b) = serde_json::from_value::<PermissionBreakdown>(bits_val.clone()) {
                    resolved_mode = Some(breakdown_to_mode(&b));
                }
            }

            // 2. 其次尝试 octal 参数
            if resolved_mode.is_none() {
                if let Some(octal_val) = req.params.get("octal") {
                    let octal_str = match octal_val {
                        serde_json::Value::String(s) => s.clone(),
                        serde_json::Value::Number(n) => n.to_string(),
                        _ => "".into(),
                    };
                    if !octal_str.is_empty() {
                        match parse_octal_str(&octal_str) {
                            Ok(m) => resolved_mode = Some(m),
                            Err(e) => {
                                return pack_response(&ResponseEnvelope::<()> {
                                    code: 400,
                                    msg: e,
                                    request_id: req_id,
                                    data: None,
                                });
                            }
                        }
                    }
                }
            }

            // 3. 再次尝试 symbolic 参数
            if resolved_mode.is_none() {
                if let Some(sym_val) = req.params.get("symbolic").and_then(|v| v.as_str()) {
                    if !sym_val.is_empty() {
                        match parse_symbolic_str(sym_val) {
                            Ok(m) => resolved_mode = Some(m),
                            Err(e) => {
                                return pack_response(&ResponseEnvelope::<()> {
                                    code: 400,
                                    msg: e,
                                    request_id: req_id,
                                    data: None,
                                });
                            }
                        }
                    }
                }
            }

            // 若仍无输入，默认采用 0755
            let mode = resolved_mode.unwrap_or(0o755);

            let (sym9, sym10) = mode_to_symbolic(mode, false);
            let octal3 = format!("{:03o}", mode & 0o777);
            let octal4 = format!("{:04o}", mode & 0o7777);
            let breakdown = mode_to_breakdown(mode);

            let sym_cmd_part = build_symbolic_command(&breakdown);
            let commands = ChmodCommandVariants {
                numeric: format!("chmod {} <file>", if (mode & 0o7000) != 0 { &octal4 } else { &octal3 }),
                symbolic: format!("chmod {} <file>", sym_cmd_part),
                recursive: format!("chmod -R {} <directory>", if (mode & 0o7000) != 0 { &octal4 } else { &octal3 }),
            };

            let security_notes = generate_security_notes(mode);

            let umask_effect = req.params.get("umask").and_then(|u| {
                let u_str = match u {
                    serde_json::Value::String(s) => s.clone(),
                    serde_json::Value::Number(n) => n.to_string(),
                    _ => "022".into(),
                };
                parse_octal_str(&u_str).ok().map(calculate_umask_effect)
            });

            pack_response(&ResponseEnvelope {
                code: 0,
                msg: "success".into(),
                request_id: req_id,
                data: Some(ChmodCalculateResult {
                    octal3,
                    octal4,
                    symbolic9: sym9,
                    symbolic10: sym10,
                    bits: breakdown,
                    commands,
                    security_notes,
                    umask_effect,
                }),
            })
        }
        "chmod/presets" => {
            pack_response(&ResponseEnvelope {
                code: 0,
                msg: "success".into(),
                request_id: req_id,
                data: Some(PresetListResult {
                    presets: get_all_presets(),
                }),
            })
        }
        "chmod/umask" => {
            let umask_val = req.params.get("umask").and_then(|v| {
                if let Some(s) = v.as_str() {
                    parse_octal_str(s).ok()
                } else if let Some(n) = v.as_u64() {
                    Some(n as u32)
                } else {
                    None
                }
            }).unwrap_or(0o022);

            let effect = calculate_umask_effect(umask_val);
            pack_response(&ResponseEnvelope {
                code: 0,
                msg: "success".into(),
                request_id: req_id,
                data: Some(effect),
            })
        }
        _ => pack_response(&ResponseEnvelope::<()> {
            code: 404,
            msg: format!("未知的 action: {}", req.action),
            request_id: req_id,
            data: None,
        }),
    }
}

unsafe fn pack_response<T: Serialize>(res: &ResponseEnvelope<T>) -> u64 {
    let bytes = serde_json::to_vec(res).unwrap_or_else(|_| {
        b"{\"code\":500,\"msg\":\"JSON serialization failed\",\"request_id\":\"\",\"data\":null}".to_vec()
    });
    let out_len = bytes.len();
    let out_ptr = alloc(out_len);
    core::ptr::copy_nonoverlapping(bytes.as_ptr(), out_ptr, out_len);
    ((out_ptr as u64) << 32) | (out_len as u64 & 0xffffffff)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mode_to_symbolic() {
        let (s9, s10) = mode_to_symbolic(0o755, false);
        assert_eq!(s9, "rwxr-xr-x");
        assert_eq!(s10, "-rwxr-xr-x");

        let (s9_suid, _) = mode_to_symbolic(0o4755, false);
        assert_eq!(s9_suid, "rwsr-xr-x");

        let (s9_sticky, s10_sticky) = mode_to_symbolic(0o1777, true);
        assert_eq!(s9_sticky, "rwxrwxrwt");
        assert_eq!(s10_sticky, "drwxrwxrwt");
    }

    #[test]
    fn test_parse_symbolic() {
        assert_eq!(parse_symbolic_str("rwxr-xr-x").unwrap(), 0o755);
        assert_eq!(parse_symbolic_str("-rw-r--r--").unwrap(), 0o644);
        assert_eq!(parse_symbolic_str("-rwsr-xr-x").unwrap(), 0o4755);
        assert_eq!(parse_symbolic_str("drwxrwxrwt").unwrap(), 0o1777);
    }

    #[test]
    fn test_parse_octal() {
        assert_eq!(parse_octal_str("755").unwrap(), 0o755);
        assert_eq!(parse_octal_str("0755").unwrap(), 0o755);
        assert_eq!(parse_octal_str("4755").unwrap(), 0o4755);
    }
}
