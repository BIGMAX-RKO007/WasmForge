use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicU64, Ordering};
use uuid::Uuid;

// -----------------------------------------------------------------------------
// Envelope Protocol Definitions
// -----------------------------------------------------------------------------

#[derive(Deserialize)]
struct Request {
    action: String,
    #[serde(rename = "requestId")]
    request_id: Option<String>,
    #[serde(default)]
    params: serde_json::Value,
}

#[derive(Serialize)]
struct Response<T: Serialize> {
    code: i32,
    msg: String,
    #[serde(rename = "requestId", skip_serializing_if = "Option::is_none")]
    request_id: Option<String>,
    data: Option<T>,
}

#[derive(Deserialize)]
struct GenParams {
    #[serde(default = "default_count")]
    count: usize,
    #[serde(default)]
    uppercase: bool,
    #[serde(default = "default_true")]
    hyphens: bool,
    #[serde(rename = "timestampMs")]
    timestamp_ms: Option<u64>,
    seed: Option<u64>,
}

fn default_count() -> usize {
    1
}
fn default_true() -> bool {
    true
}

#[derive(Serialize)]
struct GenData {
    uuids: Vec<String>,
    count: usize,
    version: &'static str,
}

#[derive(Deserialize)]
struct ParseParams {
    uuid: String,
}

#[derive(Serialize)]
struct ParseData {
    valid: bool,
    version: Option<usize>,
    variant: Option<String>,
    hyphenated: Option<String>,
    simple: Option<String>,
    urn: Option<String>,
}

// -----------------------------------------------------------------------------
// PRNG for 100% Host-Agnostic Standalone Execution
// -----------------------------------------------------------------------------

static PRNG_STATE: AtomicU64 = AtomicU64::new(0x2718281828459045);

fn next_random(state: &mut u64) -> u64 {
    *state = state.wrapping_add(0x9e3779b97f4a7c15);
    let mut z = *state;
    z = (z ^ (z >> 30)).wrapping_mul(0xbf58476d1ce4e5b9);
    z = (z ^ (z >> 27)).wrapping_mul(0x94d049bb133111eb);
    z ^ (z >> 31)
}

fn random_16_bytes(state: &mut u64) -> [u8; 16] {
    let r1 = next_random(state);
    let r2 = next_random(state);
    let mut bytes = [0u8; 16];
    bytes[0..8].copy_from_slice(&r1.to_le_bytes());
    bytes[8..16].copy_from_slice(&r2.to_le_bytes());
    bytes
}

fn format_uuid(id: &Uuid, hyphens: bool, uppercase: bool) -> String {
    let s = if hyphens {
        id.hyphenated().to_string()
    } else {
        id.simple().to_string()
    };

    if uppercase {
        s.to_uppercase()
    } else {
        s.to_lowercase()
    }
}

fn make_uuid_v4(mut bytes: [u8; 16]) -> Uuid {
    bytes[6] = 0x40 | (bytes[6] & 0x0F);
    bytes[8] = 0x80 | (bytes[8] & 0x3F);
    Uuid::from_bytes(bytes)
}

fn make_uuid_v7(ts_ms: u64, rand_bytes: [u8; 10]) -> Uuid {
    let mut bytes = [0u8; 16];
    bytes[0] = ((ts_ms >> 40) & 0xFF) as u8;
    bytes[1] = ((ts_ms >> 32) & 0xFF) as u8;
    bytes[2] = ((ts_ms >> 24) & 0xFF) as u8;
    bytes[3] = ((ts_ms >> 16) & 0xFF) as u8;
    bytes[4] = ((ts_ms >> 8) & 0xFF) as u8;
    bytes[5] = (ts_ms & 0xFF) as u8;

    bytes[6] = 0x70 | (rand_bytes[0] & 0x0F);
    bytes[7] = rand_bytes[1];

    bytes[8] = 0x80 | (rand_bytes[2] & 0x3F);
    bytes[9..16].copy_from_slice(&rand_bytes[3..10]);

    Uuid::from_bytes(bytes)
}

// -----------------------------------------------------------------------------
// Dispatch Handler
// -----------------------------------------------------------------------------

fn handle_dispatch(input: &[u8]) -> String {
    let req: Request = match serde_json::from_slice(input) {
        Ok(r) => r,
        Err(err) => {
            let resp: Response<()> = Response {
                code: 4001,
                msg: format!("Invalid JSON request: {}", err),
                request_id: None,
                data: None,
            };
            return serde_json::to_string(&resp).unwrap_or_else(|_| "{\"code\":5000,\"msg\":\"Internal error\"}".into());
        }
    };

    match req.action.as_str() {
        "uuid/v4" | "v4" => {
            let params: GenParams = match serde_json::from_value(req.params) {
                Ok(p) => p,
                Err(err) => {
                    let resp: Response<()> = Response {
                        code: 4002,
                        msg: format!("Invalid parameters: {}", err),
                        request_id: req.request_id,
                        data: None,
                    };
                    return serde_json::to_string(&resp).unwrap();
                }
            };

            let count = params.count.clamp(1, 100);
            let mut state = params.seed.unwrap_or_else(|| {
                PRNG_STATE.fetch_add(0x9e3779b97f4a7c15, Ordering::Relaxed)
            });

            let mut uuids = Vec::with_capacity(count);
            for _ in 0..count {
                let bytes = random_16_bytes(&mut state);
                let id = make_uuid_v4(bytes);
                uuids.push(format_uuid(&id, params.hyphens, params.uppercase));
            }

            let resp = Response {
                code: 0,
                msg: "success".to_string(),
                request_id: req.request_id,
                data: Some(GenData {
                    uuids,
                    count,
                    version: "v4",
                }),
            };
            serde_json::to_string(&resp).unwrap()
        }
        "uuid/v7" | "v7" => {
            let params: GenParams = match serde_json::from_value(req.params) {
                Ok(p) => p,
                Err(err) => {
                    let resp: Response<()> = Response {
                        code: 4002,
                        msg: format!("Invalid parameters: {}", err),
                        request_id: req.request_id,
                        data: None,
                    };
                    return serde_json::to_string(&resp).unwrap();
                }
            };

            let count = params.count.clamp(1, 100);
            let mut state = params.seed.unwrap_or_else(|| {
                PRNG_STATE.fetch_add(0x9e3779b97f4a7c15, Ordering::Relaxed)
            });

            let mut uuids = Vec::with_capacity(count);
            let base_ts = params.timestamp_ms.unwrap_or(1729760000000);

            for i in 0..count {
                let bytes = random_16_bytes(&mut state);
                let mut rand_10 = [0u8; 10];
                rand_10.copy_from_slice(&bytes[0..10]);
                let id = make_uuid_v7(base_ts + i as u64, rand_10);
                uuids.push(format_uuid(&id, params.hyphens, params.uppercase));
            }

            let resp = Response {
                code: 0,
                msg: "success".to_string(),
                request_id: req.request_id,
                data: Some(GenData {
                    uuids,
                    count,
                    version: "v7",
                }),
            };
            serde_json::to_string(&resp).unwrap()
        }
        "uuid/parse" | "parse" => {
            let params: ParseParams = match serde_json::from_value(req.params) {
                Ok(p) => p,
                Err(err) => {
                    let resp: Response<()> = Response {
                        code: 4002,
                        msg: format!("Invalid parameters: {}", err),
                        request_id: req.request_id,
                        data: None,
                    };
                    return serde_json::to_string(&resp).unwrap();
                }
            };

            match Uuid::parse_str(params.uuid.trim()) {
                Ok(id) => {
                    let resp = Response {
                        code: 0,
                        msg: "success".to_string(),
                        request_id: req.request_id,
                        data: Some(ParseData {
                            valid: true,
                            version: id.get_version_num().into(),
                            variant: Some(format!("{:?}", id.get_variant())),
                            hyphenated: Some(id.hyphenated().to_string()),
                            simple: Some(id.simple().to_string()),
                            urn: Some(id.urn().to_string()),
                        }),
                    };
                    serde_json::to_string(&resp).unwrap()
                }
                Err(err) => {
                    let resp = Response {
                        code: 0,
                        msg: format!("Invalid UUID: {}", err),
                        request_id: req.request_id,
                        data: Some(ParseData {
                            valid: false,
                            version: None,
                            variant: None,
                            hyphenated: None,
                            simple: None,
                            urn: None,
                        }),
                    };
                    serde_json::to_string(&resp).unwrap()
                }
            }
        }
        _ => {
            let resp: Response<()> = Response {
                code: 4040,
                msg: format!("Unknown action '{}'. Supported: 'uuid/v4', 'uuid/v7', 'uuid/parse'", req.action),
                request_id: req.request_id,
                data: None,
            };
            serde_json::to_string(&resp).unwrap()
        }
    }
}

// -----------------------------------------------------------------------------
// Universal C-ABI Exports (alloc, dealloc, dispatch)
// -----------------------------------------------------------------------------

#[no_mangle]
pub extern "C" fn alloc(size: usize) -> *mut u8 {
    let buf = vec![0u8; size].into_boxed_slice();
    Box::into_raw(buf) as *mut u8
}

#[no_mangle]
pub extern "C" fn dealloc(ptr: *mut u8, size: usize) {
    if !ptr.is_null() && size > 0 {
        unsafe {
            let slice = std::slice::from_raw_parts_mut(ptr, size);
            drop(Box::from_raw(slice));
        }
    }
}

#[no_mangle]
pub extern "C" fn dispatch(ptr: *const u8, len: usize) -> u64 {
    let input_slice = unsafe { std::slice::from_raw_parts(ptr, len) };
    let response_json = handle_dispatch(input_slice);

    let boxed = response_json.into_bytes().into_boxed_slice();
    let out_len = boxed.len() as u64;
    let out_ptr = Box::into_raw(boxed) as *mut u8 as u64;
    (out_ptr << 32) | (out_len & 0xFFFFFFFF)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_uuid_v4_generation() {
        let req = r#"{
            "action": "uuid/v4",
            "params": {
                "count": 3,
                "hyphens": true
            }
        }"#;

        let res_json = handle_dispatch(req.as_bytes());
        assert!(res_json.contains(r#""code":0"#));
        assert!(res_json.contains(r#""count":3"#));
    }

    #[test]
    fn test_uuid_parse() {
        let req = r#"{
            "action": "uuid/parse",
            "params": {
                "uuid": "550e8400-e29b-41d4-a716-446655440000"
            }
        }"#;

        let res_json = handle_dispatch(req.as_bytes());
        assert!(res_json.contains(r#""valid":true"#));
        assert!(res_json.contains(r#""version":4"#));
    }
}
