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

#[derive(Debug, Serialize, Clone, Default)]
struct ParsedDockerRun {
    service_name: String,
    image: String,
    container_name: Option<String>,
    ports: Vec<String>,
    environment: Vec<String>,
    volumes: Vec<String>,
    networks: Vec<String>,
    restart: Option<String>,
    working_dir: Option<String>,
    user: Option<String>,
    hostname: Option<String>,
    entrypoint: Option<String>,
    command: Option<String>,
    privileged: bool,
    memory: Option<String>,
    cpus: Option<String>,
    extra_hosts: Vec<String>,
}

#[derive(Debug, Serialize)]
struct DockerToComposeResult {
    compose_yaml: String,
    details: ParsedDockerRun,
}

#[derive(Debug, Serialize)]
struct SampleCommand {
    title: String,
    description: String,
    command: String,
}

#[derive(Debug, Serialize)]
struct SampleCommandsResult {
    samples: Vec<SampleCommand>,
}

// 词法分析器：支持反斜杠续行、单双引号、转义空格等标准 POSIX Shell 语法
fn tokenize_command(cmd: &str) -> Vec<String> {
    let mut tokens = Vec::new();
    let mut current = String::new();
    let mut in_single = false;
    let mut in_double = false;
    let mut escape = false;

    let chars: Vec<char> = cmd.chars().collect();
    let mut i = 0;
    let len = chars.len();

    while i < len {
        let ch = chars[i];

        if escape {
            current.push(ch);
            escape = false;
            i += 1;
            continue;
        }

        if ch == '\\' && !in_single {
            // 检查是否为续行符后跟换行
            if i + 1 < len && (chars[i + 1] == '\n' || (chars[i + 1] == '\r' && i + 2 < len && chars[i + 2] == '\n')) {
                if chars[i + 1] == '\r' {
                    i += 3;
                } else {
                    i += 2;
                }
                continue;
            }
            escape = true;
            i += 1;
            continue;
        }

        if ch == '\'' && !in_double {
            in_single = !in_single;
            i += 1;
            continue;
        }

        if ch == '"' && !in_single {
            in_double = !in_double;
            i += 1;
            continue;
        }

        if ch.is_whitespace() && !in_single && !in_double {
            if !current.is_empty() {
                tokens.push(current);
                current = String::new();
            }
        } else {
            current.push(ch);
        }

        i += 1;
    }

    if !current.is_empty() {
        tokens.push(current);
    }

    tokens
}

fn sanitize_service_name(name: &str) -> String {
    let clean: String = name
        .chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' { c } else { '_' })
        .collect();
    let trimmed = clean.trim_matches(|c| c == '_' || c == '-');
    if trimmed.is_empty() {
        "app".into()
    } else {
        trimmed.to_string()
    }
}

fn parse_docker_run(tokens: &[String], user_service_name: Option<&str>) -> Result<ParsedDockerRun, String> {
    let mut iter = tokens.iter().peekable();

    // 跳过开头的 "sudo" "docker" "container" "run" 等前缀
    while let Some(&token) = iter.peek() {
        let lower = token.to_ascii_lowercase();
        if lower == "sudo" || lower == "docker" || lower == "container" {
            iter.next();
        } else if lower == "run" {
            iter.next();
            break;
        } else {
            break;
        }
    }

    let mut details = ParsedDockerRun::default();
    let mut trailing_args = Vec::new();

    while let Some(tok) = iter.next() {
        // 如果遇到了非选项参数，并且此时 image 尚未确定，则此 token 即为 image
        if !tok.starts_with('-') {
            details.image = tok.clone();
            // 镜像后面的所有参数全部归属于容器启动 CMD
            for arg in iter {
                trailing_args.push(arg.clone());
            }
            break;
        }

        let (flag, inline_val) = if let Some(idx) = tok.find('=') {
            (&tok[..idx], Some(&tok[idx + 1..]))
        } else {
            (tok.as_str(), None)
        };

        match flag {
            "-d" | "--detach" | "--rm" | "-it" | "-i" | "-t" => {
                // 标准运行模式标志，无需额外参数
            }
            "--name" => {
                let val = inline_val.map(|s| s.to_string()).or_else(|| iter.next().cloned());
                details.container_name = val;
            }
            "-p" | "--publish" => {
                if let Some(val) = inline_val.map(|s| s.to_string()).or_else(|| iter.next().cloned()) {
                    details.ports.push(val);
                }
            }
            "-e" | "--env" => {
                if let Some(val) = inline_val.map(|s| s.to_string()).or_else(|| iter.next().cloned()) {
                    details.environment.push(val);
                }
            }
            "-v" | "--volume" => {
                if let Some(val) = inline_val.map(|s| s.to_string()).or_else(|| iter.next().cloned()) {
                    details.volumes.push(val);
                }
            }
            "--net" | "--network" => {
                if let Some(val) = inline_val.map(|s| s.to_string()).or_else(|| iter.next().cloned()) {
                    details.networks.push(val);
                }
            }
            "--restart" => {
                details.restart = inline_val.map(|s| s.to_string()).or_else(|| iter.next().cloned());
            }
            "-w" | "--workdir" => {
                details.working_dir = inline_val.map(|s| s.to_string()).or_else(|| iter.next().cloned());
            }
            "-u" | "--user" => {
                details.user = inline_val.map(|s| s.to_string()).or_else(|| iter.next().cloned());
            }
            "-h" | "--hostname" => {
                details.hostname = inline_val.map(|s| s.to_string()).or_else(|| iter.next().cloned());
            }
            "--entrypoint" => {
                details.entrypoint = inline_val.map(|s| s.to_string()).or_else(|| iter.next().cloned());
            }
            "--privileged" => {
                details.privileged = true;
            }
            "-m" | "--memory" => {
                details.memory = inline_val.map(|s| s.to_string()).or_else(|| iter.next().cloned());
            }
            "--cpus" => {
                details.cpus = inline_val.map(|s| s.to_string()).or_else(|| iter.next().cloned());
            }
            "--add-host" => {
                if let Some(val) = inline_val.map(|s| s.to_string()).or_else(|| iter.next().cloned()) {
                    details.extra_hosts.push(val);
                }
            }
            _ => {
                // 其他带值的未知长选项尝试跳过下一个参数
                if inline_val.is_none() && iter.peek().map_or(false, |next_tok| !next_tok.starts_with('-')) {
                    iter.next();
                }
            }
        }
    }

    if details.image.is_empty() {
        return Err("无法从命令中识别到 Docker 镜像名称 (Image)".into());
    }

    if !trailing_args.is_empty() {
        details.command = Some(trailing_args.join(" "));
    }

    // 确定 service 名称
    let s_name = if let Some(n) = user_service_name {
        sanitize_service_name(n)
    } else if let Some(ref c_name) = details.container_name {
        sanitize_service_name(c_name)
    } else {
        let base_img = details.image.split(':').next().unwrap_or("app");
        let slash_last = base_img.split('/').last().unwrap_or("app");
        sanitize_service_name(slash_last)
    };
    details.service_name = s_name;

    Ok(details)
}

fn generate_compose_yaml(details: &ParsedDockerRun, version: &str) -> String {
    let mut out = String::new();
    let ver_header = if version.is_empty() { "3.8" } else { version };
    out.push_str(&format!("version: '{}'\n\nservices:\n", ver_header));
    out.push_str(&format!("  {}:\n", details.service_name));
    out.push_str(&format!("    image: {}\n", details.image));

    if let Some(ref cn) = details.container_name {
        out.push_str(&format!("    container_name: {}\n", cn));
    }

    if let Some(ref r) = details.restart {
        out.push_str(&format!("    restart: {}\n", r));
    }

    if details.privileged {
        out.push_str("    privileged: true\n");
    }

    if let Some(ref u) = details.user {
        out.push_str(&format!("    user: \"{}\"\n", u));
    }

    if let Some(ref h) = details.hostname {
        out.push_str(&format!("    hostname: {}\n", h));
    }

    if let Some(ref w) = details.working_dir {
        out.push_str(&format!("    working_dir: {}\n", w));
    }

    if let Some(ref ep) = details.entrypoint {
        out.push_str(&format!("    entrypoint: {}\n", ep));
    }

    if let Some(ref cmd) = details.command {
        out.push_str(&format!("    command: {}\n", cmd));
    }

    if !details.ports.is_empty() {
        out.push_str("    ports:\n");
        for p in &details.ports {
            out.push_str(&format!("      - \"{}\"\n", p));
        }
    }

    if !details.environment.is_empty() {
        out.push_str("    environment:\n");
        for e in &details.environment {
            out.push_str(&format!("      - {}\n", e));
        }
    }

    if !details.volumes.is_empty() {
        out.push_str("    volumes:\n");
        for v in &details.volumes {
            out.push_str(&format!("      - {}\n", v));
        }
    }

    if !details.networks.is_empty() {
        out.push_str("    networks:\n");
        for net in &details.networks {
            out.push_str(&format!("      - {}\n", net));
        }
    }

    if !details.extra_hosts.is_empty() {
        out.push_str("    extra_hosts:\n");
        for h in &details.extra_hosts {
            out.push_str(&format!("      - \"{}\"\n", h));
        }
    }

    // 资源限制 (deploy.resources)
    if details.memory.is_some() || details.cpus.is_some() {
        out.push_str("    deploy:\n      resources:\n        limits:\n");
        if let Some(ref c) = details.cpus {
            out.push_str(&format!("          cpus: '{}'\n", c));
        }
        if let Some(ref m) = details.memory {
            out.push_str(&format!("          memory: {}\n", m));
        }
    }

    // 如果指定了网络且不是默认的 bridge/host/none，声明顶层 networks
    let custom_networks: Vec<&String> = details
        .networks
        .iter()
        .filter(|n| *n != "bridge" && *n != "host" && *n != "none")
        .collect();

    if !custom_networks.is_empty() {
        out.push_str("\nnetworks:\n");
        for net in custom_networks {
            out.push_str(&format!("  {}:\n    external: true\n", net));
        }
    }

    out
}

fn get_sample_commands() -> Vec<SampleCommand> {
    alloc::vec![
        SampleCommand {
            title: "Redis 缓存数据库".into(),
            description: "端口映射、数据卷持久化、环境变量与追加写持久化启动参数".into(),
            command: "docker run -d --name redis-server \\\n  -p 6379:6379 \\\n  -v /data/redis:/data \\\n  -e REDIS_PASSWORD=secret \\\n  --restart always \\\n  redis:7-alpine redis-server --appendonly yes".into(),
        },
        SampleCommand {
            title: "Nginx 反向代理服务器".into(),
            description: "多端口暴露、静态资源与配置文件卷挂载".into(),
            command: "docker run -d --name web-proxy \\\n  -p 80:80 -p 443:443 \\\n  -v /etc/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \\\n  -v /var/www/html:/usr/share/nginx/html:ro \\\n  --restart unless-stopped \\\n  nginx:latest".into(),
        },
        SampleCommand {
            title: "PostgreSQL 关系型数据库".into(),
            description: "环境变量初始化库名用户、密码及持久化数据卷".into(),
            command: "docker run -d --name postgres-db \\\n  -p 5432:5432 \\\n  -e POSTGRES_DB=appdb \\\n  -e POSTGRES_USER=postgres \\\n  -e POSTGRES_PASSWORD=mysecretpassword \\\n  -v pgdata:/var/lib/postgresql/data \\\n  --restart always \\\n  postgres:16".into(),
        },
        SampleCommand {
            title: "Node.js 开发环境与工作目录".into(),
            description: "指定当前目录挂载、工作目录及自定义入口命令".into(),
            command: "docker run -it --rm --name node-app \\\n  -p 3000:3000 \\\n  -v $(pwd):/app \\\n  -w /app \\\n  -e NODE_ENV=development \\\n  node:20-alpine npm run dev".into(),
        },
        SampleCommand {
            title: "特权模式与资源限制".into(),
            description: "限制 CPU/内存规格并启用 privileged 特权模式".into(),
            command: "docker run -d --name runner \\\n  --privileged \\\n  --cpus 2.0 \\\n  --memory 2g \\\n  -v /var/run/docker.sock:/var/run/docker.sock \\\n  docker:dind".into(),
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
        "docker/to-compose" => {
            let command = match req.params.get("command").and_then(|v| v.as_str()) {
                Some(c) if !c.trim().is_empty() => c,
                _ => {
                    return pack_response(&ResponseEnvelope::<()> {
                        code: 400,
                        msg: "command 参数不能为空".into(),
                        request_id: req_id,
                        data: None,
                    });
                }
            };

            let version = req.params.get("composeVersion").and_then(|v| v.as_str()).unwrap_or("3.8");
            let user_svc = req.params.get("serviceName").and_then(|v| v.as_str());

            let tokens = tokenize_command(command);
            let details = match parse_docker_run(&tokens, user_svc) {
                Ok(d) => d,
                Err(e) => {
                    return pack_response(&ResponseEnvelope::<()> {
                        code: 400,
                        msg: e,
                        request_id: req_id,
                        data: None,
                    });
                }
            };

            let compose_yaml = generate_compose_yaml(&details, version);

            pack_response(&ResponseEnvelope {
                code: 0,
                msg: "success".into(),
                request_id: req_id,
                data: Some(DockerToComposeResult {
                    compose_yaml,
                    details,
                }),
            })
        }
        "docker/samples" => {
            pack_response(&ResponseEnvelope {
                code: 0,
                msg: "success".into(),
                request_id: req_id,
                data: Some(SampleCommandsResult {
                    samples: get_sample_commands(),
                }),
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
    fn test_tokenize_simple() {
        let cmd = "docker run -d --name web -p 80:80 nginx:alpine";
        let tokens = tokenize_command(cmd);
        assert_eq!(tokens, vec!["docker", "run", "-d", "--name", "web", "-p", "80:80", "nginx:alpine"]);
    }

    #[test]
    fn test_tokenize_with_quotes_and_multiline() {
        let cmd = "docker run -d \\\n  --name redis \\\n  -e 'PASS=secret 123' \\\n  redis:7";
        let tokens = tokenize_command(cmd);
        assert_eq!(tokens, vec!["docker", "run", "-d", "--name", "redis", "-e", "PASS=secret 123", "redis:7"]);
    }

    #[test]
    fn test_parse_and_generate() {
        let cmd = "docker run -d --name my-redis -p 6379:6379 -v /data:/data -e REDIS_PW=123 --restart always redis:7-alpine redis-server --appendonly yes";
        let tokens = tokenize_command(cmd);
        let details = parse_docker_run(&tokens, None).unwrap();

        assert_eq!(details.service_name, "my-redis");
        assert_eq!(details.image, "redis:7-alpine");
        assert_eq!(details.container_name.as_deref(), Some("my-redis"));
        assert_eq!(details.ports, vec!["6379:6379"]);
        assert_eq!(details.command.as_deref(), Some("redis-server --appendonly yes"));

        let yaml = generate_compose_yaml(&details, "3.8");
        assert!(yaml.contains("version: '3.8'"));
        assert!(yaml.contains("image: redis:7-alpine"));
        assert!(yaml.contains("- \"6379:6379\""));
        assert!(yaml.contains("command: redis-server --appendonly yes"));
    }
}
