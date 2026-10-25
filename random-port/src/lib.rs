extern crate alloc;

use alloc::format;
use alloc::string::{String, ToString};
use alloc::vec;
use alloc::vec::Vec;
use core::slice;
use serde::{Deserialize, Serialize};

#[derive(Clone, Copy)]
pub struct PortEntry {
    pub port: u16,
    pub service: &'static str,
    pub protocol: &'static str,
    pub description: &'static str,
    pub is_vulnerable: bool,
}

static KNOWN_PORTS: &[PortEntry] = &[
    PortEntry { port: 20, service: "FTP Data", protocol: "TCP", description: "File Transfer Protocol (Data channel)", is_vulnerable: true },
    PortEntry { port: 21, service: "FTP Control", protocol: "TCP", description: "File Transfer Protocol (Control channel)", is_vulnerable: true },
    PortEntry { port: 22, service: "SSH / SFTP", protocol: "TCP", description: "Secure Shell remote login", is_vulnerable: false },
    PortEntry { port: 23, service: "Telnet", protocol: "TCP", description: "Unencrypted plaintext remote terminal", is_vulnerable: true },
    PortEntry { port: 25, service: "SMTP", protocol: "TCP", description: "Simple Mail Transfer Protocol", is_vulnerable: false },
    PortEntry { port: 53, service: "DNS", protocol: "TCP/UDP", description: "Domain Name System queries and zone transfers", is_vulnerable: false },
    PortEntry { port: 67, service: "DHCP Server", protocol: "UDP", description: "Bootstrap Protocol / DHCP Server", is_vulnerable: false },
    PortEntry { port: 68, service: "DHCP Client", protocol: "UDP", description: "Bootstrap Protocol / DHCP Client", is_vulnerable: false },
    PortEntry { port: 69, service: "TFTP", protocol: "UDP", description: "Trivial File Transfer Protocol", is_vulnerable: true },
    PortEntry { port: 80, service: "HTTP", protocol: "TCP", description: "World Wide Web plaintext traffic", is_vulnerable: false },
    PortEntry { port: 110, service: "POP3", protocol: "TCP", description: "Post Office Protocol version 3", is_vulnerable: true },
    PortEntry { port: 123, service: "NTP", protocol: "UDP", description: "Network Time Protocol clock synchronization", is_vulnerable: false },
    PortEntry { port: 143, service: "IMAP", protocol: "TCP", description: "Internet Message Access Protocol", is_vulnerable: true },
    PortEntry { port: 161, service: "SNMP", protocol: "UDP", description: "Simple Network Management Protocol", is_vulnerable: true },
    PortEntry { port: 389, service: "LDAP", protocol: "TCP/UDP", description: "Lightweight Directory Access Protocol", is_vulnerable: false },
    PortEntry { port: 443, service: "HTTPS", protocol: "TCP", description: "HTTP over TLS/SSL secure web", is_vulnerable: false },
    PortEntry { port: 445, service: "SMB", protocol: "TCP", description: "Microsoft-DS Active Directory / Windows File Sharing", is_vulnerable: true },
    PortEntry { port: 465, service: "SMTPS", protocol: "TCP", description: "SMTP over TLS", is_vulnerable: false },
    PortEntry { port: 514, service: "Syslog", protocol: "UDP", description: "System logging protocol", is_vulnerable: false },
    PortEntry { port: 587, service: "SMTP Submission", protocol: "TCP", description: "Email message submission agent", is_vulnerable: false },
    PortEntry { port: 636, service: "LDAPS", protocol: "TCP", description: "LDAP over TLS/SSL", is_vulnerable: false },
    PortEntry { port: 993, service: "IMAPS", protocol: "TCP", description: "IMAP over TLS/SSL", is_vulnerable: false },
    PortEntry { port: 995, service: "POP3S", protocol: "TCP", description: "POP3 over TLS/SSL", is_vulnerable: false },
    PortEntry { port: 1080, service: "SOCKS Proxy", protocol: "TCP", description: "SOCKS proxy protocol", is_vulnerable: false },
    PortEntry { port: 1433, service: "MSSQL", protocol: "TCP", description: "Microsoft SQL Server database engine", is_vulnerable: false },
    PortEntry { port: 1521, service: "Oracle DB", protocol: "TCP", description: "Oracle Database listener", is_vulnerable: false },
    PortEntry { port: 2049, service: "NFS", protocol: "TCP/UDP", description: "Network File System", is_vulnerable: true },
    PortEntry { port: 2181, service: "ZooKeeper", protocol: "TCP", description: "Apache ZooKeeper coordination cluster", is_vulnerable: false },
    PortEntry { port: 2375, service: "Docker Daemon", protocol: "TCP", description: "Docker REST API (Unencrypted)", is_vulnerable: true },
    PortEntry { port: 2376, service: "Docker TLS", protocol: "TCP", description: "Docker REST API with TLS", is_vulnerable: false },
    PortEntry { port: 2379, service: "etcd Client", protocol: "TCP", description: "etcd distributed key-value store", is_vulnerable: false },
    PortEntry { port: 3000, service: "Dev Web / Grafana", protocol: "TCP", description: "Common Node.js / React / Grafana dev server", is_vulnerable: false },
    PortEntry { port: 3306, service: "MySQL / MariaDB", protocol: "TCP", description: "MySQL database engine", is_vulnerable: false },
    PortEntry { port: 4200, service: "Angular CLI", protocol: "TCP", description: "Default Angular development server", is_vulnerable: false },
    PortEntry { port: 4317, service: "OTLP gRPC", protocol: "TCP", description: "OpenTelemetry Protocol gRPC receiver", is_vulnerable: false },
    PortEntry { port: 4318, service: "OTLP HTTP", protocol: "TCP", description: "OpenTelemetry Protocol HTTP receiver", is_vulnerable: false },
    PortEntry { port: 5000, service: "Flask / Registry", protocol: "TCP", description: "Python Flask dev server / Docker registry", is_vulnerable: false },
    PortEntry { port: 5173, service: "Vite Dev", protocol: "TCP", description: "Default Vite development server", is_vulnerable: false },
    PortEntry { port: 5432, service: "PostgreSQL", protocol: "TCP", description: "PostgreSQL database engine", is_vulnerable: false },
    PortEntry { port: 5672, service: "RabbitMQ AMQP", protocol: "TCP", description: "RabbitMQ message broker AMQP protocol", is_vulnerable: false },
    PortEntry { port: 5900, service: "VNC", protocol: "TCP", description: "Virtual Network Computing remote desktop", is_vulnerable: true },
    PortEntry { port: 6379, service: "Redis", protocol: "TCP", description: "Redis in-memory key-value store", is_vulnerable: false },
    PortEntry { port: 7001, service: "WebLogic", protocol: "TCP", description: "Oracle WebLogic application server", is_vulnerable: true },
    PortEntry { port: 8000, service: "Django / HTTP Alt", protocol: "TCP", description: "Python Django dev server / MinIO Console", is_vulnerable: false },
    PortEntry { port: 8080, service: "HTTP Alt / Tomcat", protocol: "TCP", description: "Apache Tomcat / Spring Boot / Jenkins / Proxy", is_vulnerable: false },
    PortEntry { port: 8443, service: "HTTPS Alt", protocol: "TCP", description: "Alternate HTTPS SSL listener", is_vulnerable: false },
    PortEntry { port: 8500, service: "Consul", protocol: "TCP", description: "HashiCorp Consul HTTP API", is_vulnerable: false },
    PortEntry { port: 8888, service: "Jupyter", protocol: "TCP", description: "Jupyter Notebook web interface", is_vulnerable: false },
    PortEntry { port: 9000, service: "SonarQube / PHP-FPM", protocol: "TCP", description: "SonarQube / MinIO S3 API / PHP FastCGI", is_vulnerable: false },
    PortEntry { port: 9090, service: "Prometheus", protocol: "TCP", description: "Prometheus monitoring server web UI & API", is_vulnerable: false },
    PortEntry { port: 9092, service: "Apache Kafka", protocol: "TCP", description: "Apache Kafka message broker listener", is_vulnerable: false },
    PortEntry { port: 9200, service: "Elasticsearch HTTP", protocol: "TCP", description: "Elasticsearch REST API", is_vulnerable: false },
    PortEntry { port: 9300, service: "Elasticsearch Node", protocol: "TCP", description: "Elasticsearch internal cluster transport", is_vulnerable: false },
    PortEntry { port: 9411, service: "Zipkin", protocol: "TCP", description: "Zipkin distributed tracing collector", is_vulnerable: false },
    PortEntry { port: 9600, service: "Logstash", protocol: "TCP", description: "Logstash monitoring API", is_vulnerable: false },
    PortEntry { port: 10250, service: "Kubelet", protocol: "TCP", description: "Kubernetes Kubelet node agent API", is_vulnerable: false },
    PortEntry { port: 11211, service: "Memcached", protocol: "TCP/UDP", description: "Memcached memory cache daemon", is_vulnerable: true },
    PortEntry { port: 15672, service: "RabbitMQ Mgmt", protocol: "TCP", description: "RabbitMQ management web console", is_vulnerable: false },
    PortEntry { port: 27017, service: "MongoDB", protocol: "TCP", description: "MongoDB NoSQL database engine", is_vulnerable: false },
    PortEntry { port: 28017, service: "MongoDB Web", protocol: "TCP", description: "MongoDB legacy HTTP status page", is_vulnerable: true },
];

pub struct SimpleRng(u64);

impl SimpleRng {
    pub fn new(seed: u64) -> Self {
        Self(if seed == 0 { 0x853c49e6748fea9b } else { seed })
    }

    pub fn next_u64(&mut self) -> u64 {
        let mut x = self.0;
        x ^= x >> 12;
        x ^= x << 25;
        x ^= x >> 27;
        self.0 = x;
        x.wrapping_mul(0x2545F4914F6CDD1D)
    }

    pub fn gen_range(&mut self, min: u16, max: u16) -> u16 {
        if min >= max {
            return min;
        }
        let span = (max - min + 1) as u64;
        min + (self.next_u64() % span) as u16
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PortLookupResult {
    pub port: u16,
    pub range_type: String,
    pub is_privileged: bool,
    pub service: Option<String>,
    pub protocol: Option<String>,
    pub description: Option<String>,
    pub is_vulnerable: bool,
    pub conflict_risk: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GeneratedPort {
    pub port: u16,
    pub range_type: String,
    pub is_privileged: bool,
    pub service: Option<String>,
    pub protocol: Option<String>,
    pub description: Option<String>,
    pub conflict_risk: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PortGenerateResult {
    pub total: usize,
    pub range: String,
    pub ports: Vec<GeneratedPort>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PortAuditResult {
    pub audited_count: usize,
    pub safe_count: usize,
    pub collision_count: usize,
    pub results: Vec<PortLookupResult>,
}

pub fn get_port_range_type(port: u16) -> &'static str {
    match port {
        0..=1023 => "System / Well-Known (0-1023)",
        1024..=49151 => "User / Registered (1024-49151)",
        49152..=65535 => "Dynamic / Ephemeral (49152-65535)",
    }
}

pub fn lookup_port(port: u16) -> PortLookupResult {
    let is_privileged = port < 1024;
    let range_type = get_port_range_type(port).to_string();

    let entry = KNOWN_PORTS.iter().find(|e| e.port == port);

    let conflict_risk = if is_privileged {
        "High (Privileged/Root Required)".to_string()
    } else if let Some(e) = entry {
        if e.is_vulnerable {
            "High (Known High-Risk / Exploit Target)".to_string()
        } else {
            "Moderate (Occupied by Standard Service)".to_string()
        }
    } else {
        "Low (Free for Application Use)".to_string()
    };

    PortLookupResult {
        port,
        range_type,
        is_privileged,
        service: entry.map(|e| e.service.to_string()),
        protocol: entry.map(|e| e.protocol.to_string()),
        description: entry.map(|e| e.description.to_string()),
        is_vulnerable: entry.map_or(false, |e| e.is_vulnerable),
        conflict_risk,
    }
}

pub fn generate_ports(
    count: usize,
    range_mode: &str,
    custom_min: Option<u16>,
    custom_max: Option<u16>,
    exclude_known: bool,
    seed: u64,
) -> PortGenerateResult {
    let max_count = count.clamp(1, 100);
    let mut rng = SimpleRng::new(seed);

    let (min_port, max_port) = match range_mode {
        "ephemeral" => (49152, 65535),
        "user" => (1024, 49151),
        "custom" => {
            let mi = custom_min.unwrap_or(1024).clamp(1, 65535);
            let ma = custom_max.unwrap_or(65535).clamp(1, 65535);
            if mi <= ma { (mi, ma) } else { (ma, mi) }
        }
        _ => (1024, 65535), // "all" non-privileged safe range
    };

    let mut selected = Vec::with_capacity(max_count);
    let mut attempts = 0;
    let max_attempts = max_count * 200;

    while selected.len() < max_count && attempts < max_attempts {
        attempts += 1;
        let cand = rng.gen_range(min_port, max_port);

        if selected.contains(&cand) {
            continue;
        }

        if exclude_known {
            if KNOWN_PORTS.iter().any(|e| e.port == cand) {
                continue;
            }
        }

        selected.push(cand);
    }

    selected.sort_unstable();

    let ports: Vec<GeneratedPort> = selected
        .into_iter()
        .map(|p| {
            let info = lookup_port(p);
            GeneratedPort {
                port: p,
                range_type: info.range_type,
                is_privileged: info.is_privileged,
                service: info.service,
                protocol: info.protocol,
                description: info.description,
                conflict_risk: info.conflict_risk,
            }
        })
        .collect();

    PortGenerateResult {
        total: ports.len(),
        range: format!("{}-{}", min_port, max_port),
        ports,
    }
}

pub fn audit_ports(ports: &[u16]) -> PortAuditResult {
    let mut results = Vec::new();
    let mut collision_count = 0;
    let mut safe_count = 0;

    for &p in ports {
        let info = lookup_port(p);
        if info.service.is_some() || info.is_privileged {
            collision_count += 1;
        } else {
            safe_count += 1;
        }
        results.push(info);
    }

    PortAuditResult {
        audited_count: results.len(),
        safe_count,
        collision_count,
        results,
    }
}

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
        "port/generate" => {
            let count = req.params.get("count").and_then(|v| v.as_u64()).unwrap_or(1) as usize;
            let range = req.params.get("range").and_then(|v| v.as_str()).unwrap_or("ephemeral");
            let custom_min = req.params.get("minPort").and_then(|v| v.as_u64()).map(|v| v as u16);
            let custom_max = req.params.get("maxPort").and_then(|v| v.as_u64()).map(|v| v as u16);
            let exclude_known = req.params.get("excludeWellKnown").and_then(|v| v.as_bool()).unwrap_or(true);
            let seed = req.params.get("seed").and_then(|v| v.as_u64()).unwrap_or(1761379200);

            let res = generate_ports(count, range, custom_min, custom_max, exclude_known, seed);
            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(res),
            })
        }
        "port/lookup" => {
            let port = req.params.get("port").and_then(|v| v.as_u64()).unwrap_or(80) as u16;
            let res = lookup_port(port);
            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(res),
            })
        }
        "port/audit" => {
            let ports: Vec<u16> = req.params.get("ports")
                .and_then(|v| v.as_array())
                .map(|arr| arr.iter().filter_map(|x| x.as_u64().map(|n| n as u16)).collect())
                .unwrap_or_default();
            let res = audit_ports(&ports);
            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(res),
            })
        }
        "port/samples" => {
            let sample_ports = vec![22, 80, 443, 3000, 3306, 5432, 6379, 8080, 27017, 51730];
            let res = audit_ports(&sample_ports);
            serde_json::to_string(&ResponseEnvelope {
                code: 0,
                msg: "ok".to_string(),
                request_id: req_id,
                data: Some(res),
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
    fn test_lookup_port() {
        let p80 = lookup_port(80);
        assert!(p80.is_privileged);
        assert_eq!(p80.service.as_deref(), Some("HTTP"));

        let p3306 = lookup_port(3306);
        assert!(!p3306.is_privileged);
        assert_eq!(p3306.service.as_deref(), Some("MySQL / MariaDB"));

        let p54321 = lookup_port(54321);
        assert!(!p54321.is_privileged);
        assert!(p54321.service.is_none());
    }

    #[test]
    fn test_generate_ports() {
        let res = generate_ports(5, "ephemeral", None, None, true, 12345);
        assert_eq!(res.ports.len(), 5);
        for p in &res.ports {
            assert!(p.port >= 49152);
            assert!(p.port <= 65535);
        }
    }

    #[test]
    fn test_audit_ports() {
        let sample = [22, 80, 54321];
        let res = audit_ports(&sample);
        assert_eq!(res.audited_count, 3);
        assert_eq!(res.collision_count, 2);
        assert_eq!(res.safe_count, 1);
    }
}
