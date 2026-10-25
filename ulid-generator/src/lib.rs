use serde::{Deserialize, Serialize};

// Crockford's Base32 alphabet: 32 chars (excludes I, L, O, U)
const CROCKFORD_CHARS: &[u8; 32] = b"0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/// Simple PRNG based on SplitMix64
pub struct Prng {
    state: u64,
}

impl Prng {
    fn new(seed: u64) -> Self {
        Self { state: if seed == 0 { 0x853c49e6748fea9b } else { seed } }
    }

    fn next_u64(&mut self) -> u64 {
        self.state = self.state.wrapping_add(0x9e3779b97f4a7c15);
        let mut z = self.state;
        z = (z ^ (z >> 30)).wrapping_mul(0xbf58476d1ce4e5b9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94d049bb133111eb);
        z ^ (z >> 31)
    }

    fn fill_bytes(&mut self, buf: &mut [u8]) {
        let mut i = 0;
        while i < buf.len() {
            let val = self.next_u64().to_le_bytes();
            let take = (buf.len() - i).min(8);
            buf[i..i + take].copy_from_slice(&val[..take]);
            i += take;
        }
    }
}

/// Encode 48-bit millisecond timestamp into 10 Crockford Base32 characters
fn encode_time(timestamp_ms: u64) -> [u8; 10] {
    let t = timestamp_ms & 0x0000_FFFF_FFFF_FFFF; // 48-bit mask
    [
        CROCKFORD_CHARS[((t >> 45) & 0x1F) as usize],
        CROCKFORD_CHARS[((t >> 40) & 0x1F) as usize],
        CROCKFORD_CHARS[((t >> 35) & 0x1F) as usize],
        CROCKFORD_CHARS[((t >> 30) & 0x1F) as usize],
        CROCKFORD_CHARS[((t >> 25) & 0x1F) as usize],
        CROCKFORD_CHARS[((t >> 20) & 0x1F) as usize],
        CROCKFORD_CHARS[((t >> 15) & 0x1F) as usize],
        CROCKFORD_CHARS[((t >> 10) & 0x1F) as usize],
        CROCKFORD_CHARS[((t >> 5) & 0x1F) as usize],
        CROCKFORD_CHARS[(t & 0x1F) as usize],
    ]
}

/// Encode 5 random bytes (40 bits) into 8 Crockford Base32 characters
fn encode_5bytes(b: &[u8; 5]) -> [u8; 8] {
    [
        CROCKFORD_CHARS[((b[0] >> 3) & 0x1F) as usize],
        CROCKFORD_CHARS[(((b[0] & 0x07) << 2) | ((b[1] >> 6) & 0x03)) as usize],
        CROCKFORD_CHARS[((b[1] >> 1) & 0x1F) as usize],
        CROCKFORD_CHARS[(((b[1] & 0x01) << 4) | ((b[2] >> 4) & 0x0F)) as usize],
        CROCKFORD_CHARS[(((b[2] & 0x0F) << 1) | ((b[3] >> 7) & 0x01)) as usize],
        CROCKFORD_CHARS[((b[3] >> 2) & 0x1F) as usize],
        CROCKFORD_CHARS[(((b[3] & 0x03) << 3) | ((b[4] >> 5) & 0x07)) as usize],
        CROCKFORD_CHARS[(b[4] & 0x1F) as usize],
    ]
}

/// Generate a single 26-character ULID
pub fn generate_ulid(timestamp_ms: u64, prng: &mut Prng) -> String {
    let mut rand_bytes = [0u8; 10];
    prng.fill_bytes(&mut rand_bytes);

    let t_chars = encode_time(timestamp_ms);
    let mut b1 = [0u8; 5];
    let mut b2 = [0u8; 5];
    b1.copy_from_slice(&rand_bytes[0..5]);
    b2.copy_from_slice(&rand_bytes[5..10]);

    let r_chars1 = encode_5bytes(&b1);
    let r_chars2 = encode_5bytes(&b2);

    let mut out = [0u8; 26];
    out[0..10].copy_from_slice(&t_chars);
    out[10..18].copy_from_slice(&r_chars1);
    out[18..26].copy_from_slice(&r_chars2);

    unsafe { String::from_utf8_unchecked(out.to_vec()) }
}

/// Decode single Crockford character to 5-bit value (0..31)
fn decode_char(c: u8) -> Result<u64, &'static str> {
    match c {
        b'0' | b'O' | b'o' => Ok(0),
        b'1' | b'I' | b'i' | b'L' | b'l' => Ok(1),
        b'2' => Ok(2),
        b'3' => Ok(3),
        b'4' => Ok(4),
        b'5' => Ok(5),
        b'6' => Ok(6),
        b'7' => Ok(7),
        b'8' => Ok(8),
        b'9' => Ok(9),
        b'A' | b'a' => Ok(10),
        b'B' | b'b' => Ok(11),
        b'C' | b'c' => Ok(12),
        b'D' | b'd' => Ok(13),
        b'E' | b'e' => Ok(14),
        b'F' | b'f' => Ok(15),
        b'G' | b'g' => Ok(16),
        b'H' | b'h' => Ok(17),
        b'J' | b'j' => Ok(18),
        b'K' | b'k' => Ok(19),
        b'M' | b'm' => Ok(20),
        b'N' | b'n' => Ok(21),
        b'P' | b'p' => Ok(22),
        b'Q' | b'q' => Ok(23),
        b'R' | b'r' => Ok(24),
        b'S' | b's' => Ok(25),
        b'T' | b't' => Ok(26),
        b'V' | b'v' => Ok(27),
        b'W' | b'w' => Ok(28),
        b'X' | b'x' => Ok(29),
        b'Y' | b'y' => Ok(30),
        b'Z' | b'z' => Ok(31),
        _ => Err("Invalid Crockford Base32 character"),
    }
}

/// Parse 48-bit timestamp from first 10 characters of ULID
pub fn parse_ulid_timestamp(ulid: &str) -> Result<u64, &'static str> {
    let bytes = ulid.as_bytes();
    if bytes.len() != 26 {
        return Err("ULID must be exactly 26 characters long");
    }

    let mut t: u64 = 0;
    for (i, &b) in bytes[0..10].iter().enumerate() {
        let val = decode_char(b)?;
        if i == 0 && val > 7 {
            return Err("ULID timestamp exceeds 48 bits");
        }
        t = (t << 5) | val;
    }
    Ok(t)
}

/// Convert unix timestamp in ms to ISO 8601 UTC string (e.g. "2026-10-25T01:50:00.123Z")
fn format_iso8601_utc(timestamp_ms: u64) -> String {
    let total_secs = (timestamp_ms / 1000) as i64;
    let millis = (timestamp_ms % 1000) as u32;

    let sec_in_day = total_secs.rem_euclid(86400);
    let days = total_secs.div_euclid(86400);

    let hour = sec_in_day / 3600;
    let min = (sec_in_day % 3600) / 60;
    let sec = sec_in_day % 60;

    let z = days + 719468;
    let era = if z >= 0 { z } else { z - 146096 } / 146097;
    let doe = (z - era * 146097) as u32;
    let yoe = (doe - doe / 1024 + doe / 1461 - doe / 142401) / 365;
    let y = (yoe as i64) + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y + 1 } else { y };

    format!("{:04}-{:02}-{:02}T{:02}:{:02}:{:02}.{:03}Z", y, m, d, hour, min, sec, millis)
}

// ==================== Envelope Protocol Data Structures ====================

#[derive(Deserialize)]
struct EnvelopeRequest {
    action: String,
    #[serde(rename = "requestId")]
    request_id: Option<String>,
    #[serde(default)]
    params: serde_json::Value,
}

#[derive(Serialize)]
struct EnvelopeResponse<T: Serialize> {
    code: i32,
    msg: String,
    #[serde(rename = "requestId", skip_serializing_if = "Option::is_none")]
    request_id: Option<String>,
    data: Option<T>,
}

#[derive(Deserialize)]
struct GenerateParams {
    #[serde(default = "default_count")]
    count: usize,
    #[serde(rename = "timestampMs")]
    timestamp_ms: Option<u64>,
    seed: Option<u64>,
}

fn default_count() -> usize { 1 }

#[derive(Serialize)]
struct GenerateData {
    ulids: Vec<String>,
    #[serde(rename = "timestampMs")]
    timestamp_ms: u64,
    #[serde(rename = "datetimeIso")]
    datetime_iso: String,
}

#[derive(Deserialize)]
struct ParseParams {
    ulid: String,
}

#[derive(Serialize)]
struct ParseData {
    ulid: String,
    #[serde(rename = "timestampMs")]
    timestamp_ms: u64,
    #[serde(rename = "datetimeIso")]
    datetime_iso: String,
    #[serde(rename = "isValid")]
    is_valid: bool,
}

// ==================== Standard C-ABI Exports ====================

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
        let _ = Vec::from_raw_parts(ptr, size, size);
    }
}

#[no_mangle]
pub unsafe extern "C" fn dispatch(ptr: *const u8, len: usize) -> u64 {
    let in_bytes = core::slice::from_raw_parts(ptr, len);
    let req: Result<EnvelopeRequest, _> = serde_json::from_slice(in_bytes);

    let resp_bytes = match req {
        Ok(req) => {
            let req_id = req.request_id;
            match req.action.as_str() {
                "ulid/generate" => {
                    let params: GenerateParams = serde_json::from_value(req.params)
                        .unwrap_or(GenerateParams { count: 1, timestamp_ms: None, seed: None });

                    let count = params.count.clamp(1, 100);
                    let ts = params.timestamp_ms.unwrap_or(1700000000000);
                    let mut prng = Prng::new(params.seed.unwrap_or(0));

                    let mut list = Vec::with_capacity(count);
                    for _ in 0..count {
                        list.push(generate_ulid(ts, &mut prng));
                    }

                    let resp = EnvelopeResponse {
                        code: 0,
                        msg: "Success".to_string(),
                        request_id: req_id,
                        data: Some(GenerateData {
                            ulids: list,
                            timestamp_ms: ts,
                            datetime_iso: format_iso8601_utc(ts),
                        }),
                    };
                    serde_json::to_vec(&resp).unwrap_or_default()
                }
                "ulid/parse" => {
                    let parse_res: Result<ParseParams, _> = serde_json::from_value(req.params);
                    match parse_res {
                        Ok(params) => {
                            match parse_ulid_timestamp(&params.ulid) {
                                Ok(ts) => {
                                    let resp = EnvelopeResponse {
                                        code: 0,
                                        msg: "Success".to_string(),
                                        request_id: req_id,
                                        data: Some(ParseData {
                                            ulid: params.ulid,
                                            timestamp_ms: ts,
                                            datetime_iso: format_iso8601_utc(ts),
                                            is_valid: true,
                                        }),
                                    };
                                    serde_json::to_vec(&resp).unwrap_or_default()
                                }
                                Err(err_msg) => {
                                    let err = EnvelopeResponse {
                                        code: 422,
                                        msg: err_msg.to_string(),
                                        request_id: req_id,
                                        data: Some(ParseData {
                                            ulid: params.ulid,
                                            timestamp_ms: 0,
                                            datetime_iso: "".to_string(),
                                            is_valid: false,
                                        }),
                                    };
                                    serde_json::to_vec(&err).unwrap_or_default()
                                }
                            }
                        }
                        Err(_) => {
                            let err: EnvelopeResponse<()> = EnvelopeResponse {
                                code: 400,
                                msg: "Missing or invalid 'ulid' string parameter".to_string(),
                                request_id: req_id,
                                data: None,
                            };
                            serde_json::to_vec(&err).unwrap_or_default()
                        }
                    }
                }
                unknown => {
                    let err: EnvelopeResponse<()> = EnvelopeResponse {
                        code: 404,
                        msg: format!("Action '{}' not supported in ulid-generator", unknown),
                        request_id: req_id,
                        data: None,
                    };
                    serde_json::to_vec(&err).unwrap_or_default()
                }
            }
        }
        Err(e) => {
            let err: EnvelopeResponse<()> = EnvelopeResponse {
                code: 400,
                msg: format!("Invalid JSON request envelope: {}", e),
                request_id: None,
                data: None,
            };
            serde_json::to_vec(&err).unwrap_or_default()
        }
    };

    let boxed_slice = resp_bytes.into_boxed_slice();
    let out_len = boxed_slice.len();
    let out_ptr = Box::into_raw(boxed_slice) as *mut u8;

    ((out_ptr as u64) << 32) | (out_len as u64)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ulid_generation_and_parsing() {
        let mut prng = Prng::new(42);
        let ts = 1729828800000; // 2024-10-25 04:00:00 UTC
        let ulid = generate_ulid(ts, &mut prng);

        assert_eq!(ulid.len(), 26);
        let parsed_ts = parse_ulid_timestamp(&ulid).expect("Should parse valid ULID");
        assert_eq!(parsed_ts, ts);
    }

    #[test]
    fn test_iso8601_formatting() {
        let ts = 1729828800123;
        let iso = format_iso8601_utc(ts);
        assert_eq!(iso, "2024-10-25T04:00:00.123Z");
    }

    #[test]
    fn test_lexicographical_sortability() {
        let mut prng = Prng::new(100);
        let ulid1 = generate_ulid(1000, &mut prng);
        let ulid2 = generate_ulid(2000, &mut prng);
        assert!(ulid1 < ulid2, "Earlier ULID must be lexicographically smaller than later ULID");
    }
}
