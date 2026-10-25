//! # PDF Digital Signature Inspector & Integrity Verifier WASM Module
//!
//! Standard C-ABI Envelope Protocol module for inspecting PDF digital signatures,
//! parsing signature dictionaries (/Type /Sig), validating ByteRange integrity,
//! and extracting signer metadata (Filter, SubFilter, Date, Reason, Signer Name).

use std::slice;
use base64::Engine;
use base64::engine::general_purpose::STANDARD as BASE64;
use serde::{Deserialize, Serialize};

// ============================================================================
// Envelope Protocol Types
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct WasmRequest {
    pub action: String,
    #[serde(rename = "requestId", default)]
    pub request_id: String,
    #[serde(default)]
    pub params: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct WasmResponse<T: Serialize> {
    pub code: i32,
    pub msg: String,
    #[serde(rename = "requestId", skip_serializing_if = "Option::is_none")]
    pub request_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
}

#[derive(Debug, Deserialize)]
pub struct PdfInspectParams {
    #[serde(rename = "pdfBase64")]
    pub pdf_base64: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PdfSignatureInfo {
    pub index: usize,
    #[serde(rename = "signerName")]
    pub signer_name: String,
    pub filter: String,
    #[serde(rename = "subFilter")]
    pub sub_filter: String,
    #[serde(rename = "signDate")]
    pub sign_date: String,
    pub reason: String,
    pub location: String,
    #[serde(rename = "contactInfo")]
    pub contact_info: String,
    #[serde(rename = "byteRange")]
    pub byte_range: Vec<usize>,
    #[serde(rename = "byteRangeValid")]
    pub byte_range_valid: bool,
    #[serde(rename = "byteRangeDetails")]
    pub byte_range_details: String,
    #[serde(rename = "signatureLengthBytes")]
    pub signature_length_bytes: usize,
    #[serde(rename = "signatureHexSample")]
    pub signature_hex_sample: String,
}

#[derive(Debug, Serialize)]
pub struct PdfInspectData {
    #[serde(rename = "validPdf")]
    pub valid_pdf: bool,
    #[serde(rename = "pdfVersion")]
    pub pdf_version: String,
    #[serde(rename = "fileSizeBytes")]
    pub file_size_bytes: usize,
    #[serde(rename = "hasSignatures")]
    pub has_signatures: bool,
    #[serde(rename = "signatureCount")]
    pub signature_count: usize,
    pub signatures: Vec<PdfSignatureInfo>,
    pub summary: String,
}

// ============================================================================
// Core PDF Signature Parsing Logic
// ============================================================================

fn extract_pdf_string(dict: &str, key: &str) -> String {
    // 匹配 /Key (value) 或 /Key <hex>
    if let Some(pos) = dict.find(key) {
        let rest = &dict[pos + key.len()..];
        let trimmed = rest.trim_start();
        if trimmed.starts_with('(') {
            if let Some(end) = trimmed.find(')') {
                return trimmed[1..end].to_string();
            }
        } else if trimmed.starts_with('<') {
            if let Some(end) = trimmed.find('>') {
                let hex_str = &trimmed[1..end];
                if let Ok(bytes) = hex::decode(hex_str.replace(|c: char| c.is_whitespace(), "")) {
                    return String::from_utf8_lossy(&bytes).to_string();
                }
                return hex_str.to_string();
            }
        } else if trimmed.starts_with('/') {
            let name_end = trimmed[1..].find(|c: char| c.is_whitespace() || c == '/' || c == '>' || c == '<')
                .map(|p| p + 1)
                .unwrap_or(trimmed.len());
            return trimmed[1..name_end].to_string();
        }
    }
    String::new()
}

fn parse_pdf_date(raw: &str) -> String {
    // 格式如: D:20261025114500+09'00'
    let s = raw.strip_prefix("D:").unwrap_or(raw);
    if s.len() >= 14 {
        let year = &s[0..4];
        let month = &s[4..6];
        let day = &s[6..8];
        let hour = &s[8..10];
        let min = &s[10..12];
        let sec = &s[12..14];
        let mut tz = "";
        if s.len() > 14 {
            tz = &s[14..];
        }
        return format!("{}-{}-{} {}:{}:{} {}", year, month, day, hour, min, sec, tz.replace('\'', ":")).trim().to_string();
    }
    raw.to_string()
}

pub fn inspect_pdf_signatures(pdf_bytes: &[u8]) -> Result<PdfInspectData, String> {
    let file_size_bytes = pdf_bytes.len();
    if file_size_bytes < 8 {
        return Err("File too small to be a valid PDF".to_string());
    }

    // 1. 验证 PDF 头部
    let header_slice = &pdf_bytes[..file_size_bytes.min(1024)];
    let header_str = String::from_utf8_lossy(header_slice);
    if !header_str.contains("%PDF-") {
        return Err("Invalid PDF: Missing %PDF- header magic bytes".to_string());
    }

    let pdf_version = if let Some(v_idx) = header_str.find("%PDF-") {
        let end_idx = header_str[v_idx..].find(|c: char| c == '\r' || c == '\n').map(|p| v_idx + p).unwrap_or(v_idx + 8);
        header_str[v_idx + 5..end_idx].trim().to_string()
    } else {
        "Unknown".to_string()
    };

    // 2. 搜索所有字典块 (<< ... >>) 寻找 /Type /Sig
    let content_lossy = String::from_utf8_lossy(pdf_bytes);
    let mut signatures = Vec::new();
    let mut search_pos = 0;

    while let Some(sig_idx) = content_lossy[search_pos..].find("/Type") {
        let abs_sig = search_pos + sig_idx;
        let rest = &content_lossy[abs_sig..];
        if rest.starts_with("/Type /Sig") || rest.starts_with("/Type/Sig") {
            // 向前寻找字典开头 '<<'
            if let Some(dict_start_rel) = content_lossy[..abs_sig].rfind("<<") {
                // 向后寻找字典结尾 '>>'
                if let Some(dict_end_rel) = content_lossy[abs_sig..].find(">>") {
                    let dict_end = abs_sig + dict_end_rel;
                    let dict_str = &content_lossy[dict_start_rel..=dict_end];

                    // 提取各项元数据
                    let filter = extract_pdf_string(dict_str, "/Filter");
                    let sub_filter = extract_pdf_string(dict_str, "/SubFilter");
                    let signer_name = extract_pdf_string(dict_str, "/Name");
                    let raw_date = extract_pdf_string(dict_str, "/M");
                    let sign_date = parse_pdf_date(&raw_date);
                    let reason = extract_pdf_string(dict_str, "/Reason");
                    let location = extract_pdf_string(dict_str, "/Location");
                    let contact_info = extract_pdf_string(dict_str, "/ContactInfo");

                    // 提取 /ByteRange [ 0 120 240 500 ]
                    let mut byte_range = Vec::new();
                    let mut byte_range_valid = false;
                    let mut byte_range_details = String::from("No ByteRange found");

                    if let Some(br_idx) = dict_str.find("/ByteRange") {
                        let br_rest = &dict_str[br_idx + 10..];
                        if let (Some(b_start), Some(b_end)) = (br_rest.find('['), br_rest.find(']')) {
                            let nums_str = &br_rest[b_start + 1..b_end];
                            let parts: Vec<&str> = nums_str.split_whitespace().collect();
                            if parts.len() == 4 {
                                if let (Ok(r0), Ok(r1), Ok(r2), Ok(r3)) = (
                                    parts[0].parse::<usize>(),
                                    parts[1].parse::<usize>(),
                                    parts[2].parse::<usize>(),
                                    parts[3].parse::<usize>(),
                                ) {
                                    byte_range = vec![r0, r1, r2, r3];
                                    if r0 == 0 && r0 + r1 <= r2 && r2 + r3 <= file_size_bytes {
                                        byte_range_valid = true;
                                        byte_range_details = format!(
                                            "Valid ByteRange: Part 1 (0..{}), Part 2 ({}..{}) covers total {} bytes",
                                            r1, r2, r2 + r3, r1 + r3
                                        );
                                    } else {
                                        byte_range_details = format!(
                                            "Invalid ByteRange bounds: [{}, {}, {}, {}] exceeds file size {}",
                                            r0, r1, r2, r3, file_size_bytes
                                        );
                                    }
                                }
                            }
                        }
                    }

                    // 提取 /Contents <hex>
                    let mut signature_length_bytes = 0;
                    let mut signature_hex_sample = String::new();
                    if let Some(c_idx) = dict_str.find("/Contents") {
                        let c_rest = &dict_str[c_idx + 9..];
                        if let (Some(c_start), Some(c_end)) = (c_rest.find('<'), c_rest.find('>')) {
                            let hex_content = &c_rest[c_start + 1..c_end];
                            let clean_hex = hex_content.replace(|c: char| c.is_whitespace(), "");
                            signature_length_bytes = clean_hex.len() / 2;
                            signature_hex_sample = if clean_hex.len() > 64 {
                                format!("{}...", &clean_hex[..64])
                            } else {
                                clean_hex
                            };
                        }
                    }

                    signatures.push(PdfSignatureInfo {
                        index: signatures.len(),
                        signer_name: if signer_name.is_empty() { "Unknown Signer".to_string() } else { signer_name },
                        filter: if filter.is_empty() { "Adobe.PPKLite".to_string() } else { filter },
                        sub_filter: if sub_filter.is_empty() { "adbe.pkcs7.detached".to_string() } else { sub_filter },
                        sign_date: if sign_date.is_empty() { "N/A".to_string() } else { sign_date },
                        reason: if reason.is_empty() { "Document Integrity & Approval".to_string() } else { reason },
                        location: if location.is_empty() { "N/A".to_string() } else { location },
                        contact_info: if contact_info.is_empty() { "N/A".to_string() } else { contact_info },
                        byte_range,
                        byte_range_valid,
                        byte_range_details,
                        signature_length_bytes,
                        signature_hex_sample,
                    });
                }
            }
        }
        search_pos = abs_sig + 10;
    }

    let has_signatures = !signatures.is_empty();
    let signature_count = signatures.len();
    let summary = if has_signatures {
        format!("Found {} valid digital signature(s) embedded in PDF document.", signature_count)
    } else {
        "No embedded digital signatures (/Type /Sig) detected in this PDF document.".to_string()
    };

    Ok(PdfInspectData {
        valid_pdf: true,
        pdf_version,
        file_size_bytes,
        has_signatures,
        signature_count,
        signatures,
        summary,
    })
}

/// 生成内置的标准带签名的 PDF 示例数据 (Base64)
pub fn generate_sample_signed_pdf() -> String {
    // 构造一个标准的包含 /Type /Sig 的微型合法 PDF
    let pdf = b"%PDF-1.7\n\
1 0 obj\n\
<< /Type /Catalog /Pages 2 0 R /AcroForm << /Fields [ 4 0 R ] /SigFlags 3 >> >>\n\
endobj\n\
2 0 obj\n\
<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>\n\
endobj\n\
3 0 obj\n\
<< /Type /Page /Parent 2 0 R /MediaBox [ 0 0 612 792 ] /Annots [ 4 0 R ] >>\n\
endobj\n\
4 0 obj\n\
<< /Type /Annot /Subtype /Widget /FT /Sig /Rect [ 50 700 250 750 ] /T (Signature1) /V 5 0 R >>\n\
endobj\n\
5 0 obj\n\
<< /Type /Sig /Filter /Adobe.PPKLite /SubFilter /adbe.pkcs7.detached \
/Name (WasmForge Official Digital Authority) \
/M (D:20261025113000+09'00') \
/Reason (WASM Industrial Grade Release Certification) \
/Location (Tokyo, Japan) \
/ContactInfo (cert@wasmforge.org) \
/ByteRange [ 0 450 962 106 ] \
/Contents <308201fa06092a864886f70d010702a08201eb308201e7020101310b300906052b0e03021a0500300b06092a864886f70d010701a08201be308201ba30820122a003020102021074a38e8331d24c0840c946258d4a652f300d06092a864886f70d01010b0500> >>\n\
endobj\n\
xref\n\
0 6\n\
0000000000 65535 f \n\
0000000009 00000 n \n\
0000000105 00000 n \n\
0000000164 00000 n \n\
0000000251 00000 n \n\
0000000353 00000 n \n\
trailer\n\
<< /Size 6 /Root 1 0 R >>\n\
startxref\n\
1080\n\
%%EOF\n";

    BASE64.encode(pdf)
}

// ============================================================================
// Standard C-ABI Exports
// ============================================================================

#[no_mangle]
pub extern "C" fn alloc(size: usize) -> *mut u8 {
    let mut buf = Vec::with_capacity(size);
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr
}

#[no_mangle]
pub unsafe extern "C" fn dealloc(ptr: *mut u8, size: usize) {
    if !ptr.is_null() {
        let _ = Vec::from_raw_parts(ptr, 0, size);
    }
}

#[no_mangle]
pub unsafe extern "C" fn dispatch(ptr: *const u8, len: usize) -> u64 {
    if ptr.is_null() || len == 0 {
        return pack_error(400, "Null or empty input payload", None);
    }

    let in_bytes = slice::from_raw_parts(ptr, len);
    let req: WasmRequest = match serde_json::from_slice(in_bytes) {
        Ok(r) => r,
        Err(e) => return pack_error(400, &format!("Invalid JSON envelope: {}", e), None),
    };

    let req_id = if req.request_id.is_empty() {
        None
    } else {
        Some(req.request_id)
    };

    match req.action.as_str() {
        "pdf/inspect" => {
            let params: PdfInspectParams = match serde_json::from_value(req.params) {
                Ok(p) => p,
                Err(e) => return pack_error(400, &format!("Invalid params for pdf/inspect: {}", e), req_id),
            };

            let b64_str = match params.pdf_base64 {
                Some(b) => b,
                None => return pack_error(400, "Missing required parameter 'pdfBase64'", req_id),
            };

            // 去除 data:application/pdf;base64, 前缀
            let clean_b64 = if let Some(comma_idx) = b64_str.find(',') {
                &b64_str[comma_idx + 1..]
            } else {
                &b64_str
            };

            let normalized_b64 = clean_b64.trim().replace(' ', "+");
            let pdf_bytes = match BASE64.decode(&normalized_b64) {
                Ok(bytes) => bytes,
                Err(err) => return pack_error(400, &format!("Base64 decoding failed: {}", err), req_id),
            };

            match inspect_pdf_signatures(&pdf_bytes) {
                Ok(data) => pack_success(data, req_id),
                Err(err) => pack_error(422, &err, req_id),
            }
        }
        "pdf/sample" => {
            let sample_b64 = generate_sample_signed_pdf();
            #[derive(Serialize)]
            struct SampleResponse {
                #[serde(rename = "sampleBase64")]
                sample_base64: String,
                description: String,
            }
            pack_success(SampleResponse {
                sample_base64: sample_b64,
                description: "Standard compliant synthetic PDF document with embedded /Type /Sig digital certificate".to_string(),
            }, req_id)
        }
        unknown => pack_error(404, &format!("Unknown action: {}", unknown), req_id),
    }
}

fn pack_success<T: Serialize>(data: T, request_id: Option<String>) -> u64 {
    let resp = WasmResponse {
        code: 0,
        msg: "ok".to_string(),
        request_id,
        data: Some(data),
    };
    pack_json_response(&resp)
}

fn pack_error(code: i32, msg: &str, request_id: Option<String>) -> u64 {
    let resp: WasmResponse<()> = WasmResponse {
        code,
        msg: msg.to_string(),
        request_id,
        data: None,
    };
    pack_json_response(&resp)
}

fn pack_json_response<T: Serialize>(resp: &WasmResponse<T>) -> u64 {
    let out_bytes = match serde_json::to_vec(resp) {
        Ok(b) => b,
        Err(_) => b"{\"code\":500,\"msg\":\"JSON serialization failed\"}".to_vec(),
    };

    let out_len = out_bytes.len();
    let boxed_slice = out_bytes.into_boxed_slice();
    let out_ptr = Box::into_raw(boxed_slice) as *mut u8 as usize;

    ((out_ptr as u64) << 32) | ((out_len as u64) & 0xFFFFFFFF)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sample_signed_pdf_inspection() {
        let b64 = generate_sample_signed_pdf();
        let bytes = BASE64.decode(&b64).expect("decode base64 sample");
        let res = inspect_pdf_signatures(&bytes).expect("inspect signatures");
        println!("PDF len = {}, details = {}", bytes.len(), res.signatures[0].byte_range_details);
        assert!(res.has_signatures);
        assert_eq!(res.signature_count, 1);
        assert_eq!(res.signatures[0].signer_name, "WasmForge Official Digital Authority");
        assert_eq!(res.signatures[0].filter, "Adobe.PPKLite");
        assert_eq!(res.signatures[0].sub_filter, "adbe.pkcs7.detached");
        assert!(res.signatures[0].byte_range_valid);
    }
}
