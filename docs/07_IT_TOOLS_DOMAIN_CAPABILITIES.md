# 07. it-tools 全功能领域分类与 WASM 赋能全景手册

---

## 一、 为什么将 `it-tools` 作为 WASM 工厂的参考字典？

[it-tools](https://github.com/CorentinTh/it-tools) 是目前开源社区中最受欢迎的离线开发者工具箱（25,000+ Stars），共沉淀了 **10 大核心领域、85 项高频实用工具**。
深入拆解该项目后发现：其现状大多依赖繁杂、古老的纯 JavaScript npm 库（如 `crypto-js`、`bcryptjs`、`js-yaml` 等）。这些工具在遇到大文件、长文本或高并发时，极易卡顿、阻塞浏览器主线程，且无法跨端输出到后端或其他语言环境。

这份全景手册按**领域分类完整罗列了这 85 项机能**，并逐项评估了其**通过 Rust/WASM 重构的价值与推荐的 Rust 生态库**，为 `WasmForge` 提供极具实战指导意义的功能生产清单。

---

## 二、 10 大核心领域机能全景清单

### 1. 密码学与安全 (Crypto) —— 【🌟🌟🌟🌟🌟 极高 WASM 改造价值】
*特点：重度 CPU 密集型运算、涉及密钥与算法保护、大文本处理易卡顿。*

| 工具名称 | 功能描述 | 当前 JS 实现/依赖 | WASM 价值 | 推荐 Rust Crate |
| :--- | :--- | :--- | :---: | :--- |
| **Token Generator** | 生成随机字符串、密码、UUID 等指定长度令牌 | Web Crypto API / 随机数 | ⭐⭐⭐ | `rand`, `getrandom` |
| **Hash Text** | 计算 MD5, SHA1, SHA256, SHA512, SHA3, RIPEMD160 | `crypto-js` (老旧慢) | ⭐⭐⭐⭐⭐ | `md-5`, `sha2`, `sha3` |
| **Bcrypt** | Bcrypt 密码哈希生成与比对校验 | `bcryptjs` | ⭐⭐⭐⭐⭐ | `bcrypt` |
| **UUID Generator** | 生成 v1, v4 等版本的标准 UUID | `uuid` npm | ⭐⭐⭐ | `uuid` |
| **ULID Generator** | 生成按时间排序的唯一标识符 ULID | `ulid` npm | ⭐⭐⭐ | `ulid` |
| **Encryption (Cypher)** | 对文本进行对称加密解密（AES, TripleDES, RC4 等） | `crypto-js` | ⭐⭐⭐⭐⭐ | `aes-gcm`, `cbc` |
| **BIP39 Generator** | 区块链助记词（Mnemonic）生成与校验 | `bip39` | ⭐⭐⭐⭐⭐ | `bip39` |
| **HMAC Generator** | 基于密钥的消息认证码（HMAC）生成 | `crypto-js` | ⭐⭐⭐⭐⭐ | `hmac`, `sha2` |
| **RSA Key Pair** | 生成 RSA 公钥与私钥对 | `node-forge` | ⭐⭐⭐⭐⭐ | `rsa`, `pkcs8` |
| **Password Strength** | 密码强度综合评估（熵值计算、常见字典检测） | `zxcvbn` | ⭐⭐⭐⭐ | `zxcvbn` (Rust移植版) |
| **PDF Signature** | PDF 数字签名检测与完整性解析 | `pdf-lib` / 自定义 | ⭐⭐⭐⭐⭐ | `lopdf` |

---

### 2. 格式与编码转换 (Converter) —— 【🌟🌟🌟🌟🌟 极高 WASM 改造价值】
*特点：结构化数据序列化/反序列化，Rust 的 Serde 生态在此具备压倒性优势。*

| 工具名称 | 功能描述 | 当前 JS 实现/依赖 | WASM 价值 | 推荐 Rust Crate |
| :--- | :--- | :--- | :---: | :--- |
| **YAML to JSON** | YAML 格式转为标准 JSON | `js-yaml` | ⭐⭐⭐⭐⭐ | `serde_yaml`, `serde_json` |
| **YAML to TOML** | YAML 格式转为 TOML 配置 | `js-yaml` + 自定义 | ⭐⭐⭐⭐⭐ | `serde_yaml`, `toml` |
| **JSON to YAML** | JSON 格式转为 YAML | `js-yaml` | ⭐⭐⭐⭐⭐ | `serde_json`, `serde_yaml` |
| **JSON to TOML** | JSON 格式转为 TOML | 自定义 | ⭐⭐⭐⭐⭐ | `serde_json`, `toml` |
| **TOML to JSON** | TOML 格式转为 JSON | `toml` npm | ⭐⭐⭐⭐⭐ | `toml`, `serde_json` |
| **TOML to YAML** | TOML 格式转为 YAML | 自定义 | ⭐⭐⭐⭐⭐ | `toml`, `serde_yaml` |
| **XML to JSON** | XML 格式转为 JSON 树 | `xml2js` / fast-xml | ⭐⭐⭐⭐⭐ | `quick-xml`, `serde_json` |
| **JSON to XML** | JSON 格式转为标准 XML | 自定义 | ⭐⭐⭐⭐⭐ | `quick-xml`, `serde_json` |
| **JSON to CSV** | 复杂 JSON 数组提取转为 CSV 表格 | 自定义解析 | ⭐⭐⭐⭐⭐ | `csv`, `serde_json` |
| **Base64 String** | 文本与 Base64 编码相互转换 | 原生 `atob` / `btoa` | ⭐⭐⭐ | `base64` |
| **Base64 File** | 本地文件与 Base64 DataURL 互转 | FileReader | ⭐⭐⭐⭐ | `base64` (流式处理大文件) |
| **Color Converter** | RGB, HEX, HSL, HSV, CMYK 颜色空间互转 | `colord` | ⭐⭐⭐ | 纯数学算法 |
| **Case Converter** | 驼峰、下划线、烤肉串、小写等命名互转 | `change-case` | ⭐⭐⭐ | `convert_case` |
| **Date Time** | 时间戳（Unix Timestamp）与多国时间格式互转 | `dayjs` | ⭐⭐⭐ | `chrono` |
| **Integer Base** | 2进制、8进制、10进制、16进制互转 | 原生 `parseInt` | ⭐⭐ | 纯数学位运算 |
| **Roman Numeral** | 阿拉伯数字与罗马数字相互转换 | 自定义算法 | ⭐⭐ | 纯查表算法 |
| **Text to Binary** | 字符串转为 01 二进制流 | 自定义循环 | ⭐⭐ | 字节位运算 |
| **Text to Unicode** | 字符转为 `\uXXXX` 编码转义 | 自定义循环 | ⭐⭐ | 纯字符串映射 |
| **Markdown to HTML** | Markdown 语法极速渲染为 HTML 标记 | `marked` | ⭐⭐⭐⭐⭐ | `pulldown-cmark` (极速) |
| **List Converter** | 列表排序、反转、去重、换行符规整 | 自定义数组逻辑 | ⭐⭐⭐ | 算法处理 |
| **Text to NATO** | 英文文本转为北约军用拼读音标字母表 | 字典映射 | ⭐ | 查表算法 |

---

### 3. 开发与代码工程 (Development) —— 【🌟🌟🌟🌟 高实用性】
*特点：代码语法解析、美化、差异比对、配置转换。*

| 工具名称 | 功能描述 | 当前 JS 实现/依赖 | WASM 价值 | 推荐 Rust Crate |
| :--- | :--- | :--- | :---: | :--- |
| **SQL Prettify** | SQL 语句关键词高亮与排版美化 | `sql-formatter` | ⭐⭐⭐⭐⭐ | `sqlformat` |
| **XML Formatter** | XML 树缩进美化与验证 | 自定义正则 | ⭐⭐⭐⭐ | `quick-xml` |
| **JSON Minify** | 压缩压缩 JSON 移除空白与注释 | `JSON.stringify` | ⭐⭐⭐ | `serde_json` |
| **JSON Viewer** | JSON 格式化与交互式查看器 | 自定义 UI | ⭐⭐⭐ | 前端 UI 结合 |
| **YAML Viewer** | YAML 树状交互查看 | 自定义 UI | ⭐⭐⭐ | 前端 UI 结合 |
| **Regex Tester** | 复杂正则表达式测试与匹配高亮 | JS 正则引擎 | ⭐⭐⭐⭐ | `regex` (防正则DoSLDOS) |
| **Regex Memo** | 常用正则表达式速查速记字典 | 静态文档 | ⭐ | 静态展示 |
| **Crontab Generator** | Cron 定时表达式生成与下一次运行推算 | `cron-parser` | ⭐⭐⭐⭐ | 算法推算 |
| **Chmod Calculator** | Linux 权限数值（755、644等）与 rwx 计算 | 位运算算法 | ⭐⭐ | 纯位掩码运算 |
| **Docker Run to Compose** | `docker run` 命令自动转为 `docker-compose.yml` | 自定义字符串正则 | ⭐⭐⭐⭐ | 正则与结构体映射 |
| **Email Normalizer** | 邮箱规整（去除 Gmail 点号、别名标签规整） | 自定义规则 | ⭐⭐⭐ | 字符串过滤 |
| **Git Memo** | 常用 Git 命令速查手册 | 静态数据 | ⭐ | 静态展示 |
| **Random Port** | 随机可用网络端口生成 | 随机算法 | ⭐ | 基础随机数 |

---

### 4. 文本分析与处理 (Text) —— 【🌟🌟🌟🌟 高实用性】
*特点：文本差异比对（Diff）、词频统计、字符混淆。*

| 工具名称 | 功能描述 | 当前 JS 实现/依赖 | WASM 价值 | 推荐 Rust Crate |
| :--- | :--- | :--- | :---: | :--- |
| **Text Diff** | 文本逐行、逐字对比，生成高亮差异 | `diff` npm | ⭐⭐⭐⭐⭐ | `similar` (Rust极速diff) |
| **Text Statistics** | 统计字数、字符数、词数、阅读时间推算 | 自定义正则遍历 | ⭐⭐⭐⭐ | 字符串线性扫描 |
| **String Obfuscator** | 敏感字符串脱敏或字符混淆 | 自定义算法 | ⭐⭐⭐ | 字符串处理 |
| **Lorem Ipsum** | 伪随机排版占位文本生成器 | 假文生成库 | ⭐⭐ | 伪随机数字典 |
| **ASCII Text Drawer** | 将英文转为大型 ASCII 字符艺术字画 | `figlet` npm | ⭐⭐⭐ | `figlet-rs` |
| **Numeronym Generator** | 缩略词生成（如 internationalization -> i18n） | 简单算法 | ⭐ | 纯字符计算 |
| **Emoji Picker** | Emoji 表情挑选与检索 | 静态数据 | ⭐ | 静态展示 |

---

### 5. Web 应用与协议 (Web) —— 【🌟🌟🌟 中高实用性】
*特点：常见网络标准编码、安全协议、URL 规范。*

| 工具名称 | 功能描述 | 当前 JS 实现/依赖 | WASM 价值 | 推荐 Rust Crate |
| :--- | :--- | :--- | :---: | :--- |
| **JWT Parser** | JWT 头部、载荷解码与时间校验（不含密钥也可读） | 自定义 base64url | ⭐⭐⭐⭐ | `jsonwebtoken` |
| **OTP Generator/Verify** | Google Authenticator (TOTP/HOTP) 验证码计算 | `otpauth` | ⭐⭐⭐⭐⭐ | `totp-rs` |
| **URL Encoder/Decoder** | URL 特殊字符与中文转义编码 | `encodeURIComponent` | ⭐⭐⭐ | `percent-encoding` |
| **URL Parser** | URL 协议、域名、端口、Query 参数树状拆解 | 原生 `URL` 类 | ⭐⭐⭐ | `url` |
| **JSON Diff** | 结构化 JSON 对象的深层 Key/Value 差异对比 | 自定义递归 | ⭐⭐⭐⭐⭐ | `serde_json` 深度对比 |
| **HTML Entities** | HTML 实体编码与解码（如 `&amp;` ↔ `&`） | `he` npm | ⭐⭐⭐ | `html-escape` |
| **User Agent Parser** | 浏览器与操作系统 UA 识别拆解 | `ua-parser-js` | ⭐⭐⭐⭐ | `woothee` / `uap-rust` |
| **Basic Auth Generator** | HTTP 基础认证 Header（Base64）生成 | Base64 | ⭐⭐ | 格式化拼装 |
| **Meta Tag Generator** | SEO 与 OpenGraph 标签表单生成 | 模板拼接 | ⭐ | 模板处理 |
| **Mime Types** | 文件扩展名与 MIME 类型快速速查 | 静态映射 | ⭐ | 静态查表 |
| **HTTP Status Codes** | HTTP 状态码（200、404、502）速查 | 静态映射 | ⭐ | 静态展示 |
| **Keycode Info** | 键盘按键与按键码（KeyCode）实时捕获 | 浏览器原生事件 | ⭐ | 纯前端 DOM 交互 |
| **Slugify String** | 将标题转为 URL 友好的短链形式（去除特殊符） | 正则过滤 | ⭐⭐⭐ | `slug` |
| **HTML Editor** | 所见即所得富文本编辑器 | Quill / Tiptap | ⭐ | 纯前端 DOM 组件 |
| **Device Info** | 屏幕分辨率、网络状态、GPU 驱动信息 | 浏览器原生 API | ⭐ | 纯前端 DOM 探针 |
| **Safelink Decoder** | 微软/各大平台重定向安全链接还原解码 | 正则提取 | ⭐⭐ | URL 解码 |

---

### 6. 网络协议与地址 (Network) —— 【🌟🌟🌟🌟 高实用性】
*特点：纯数学位运算与二进制网络协议处理。*

| 工具名称 | 功能描述 | 当前 JS 实现/依赖 | WASM 价值 | 推荐 Rust Crate |
| :--- | :--- | :--- | :---: | :--- |
| **IPv4 Subnet Calculator** | CIDR 子网掩码、广播地址、可用 IP 范围计算 | 自定义位运算 | ⭐⭐⭐⭐ | `ipnet` |
| **IPv4 Address Converter** | IP 转十进制、二进制、十六进制表示 | 自定义位运算 | ⭐⭐⭐ | 纯整型位运算 |
| **IPv4 Range Expander** | 将 CIDR 范围展开为全部 IP 列表 | 循环计算 | ⭐⭐⭐⭐ | 大规模 IP 展开 |
| **IPv6 ULA Generator** | IPv6 唯一本地地址（ULA）规范生成 | 规范算法 | ⭐⭐⭐ | `rand` + 规范格式化 |
| **MAC Address Generator** | 随机合法物理地址（MAC）生成 | 随机算法 | ⭐⭐ | 格式拼装 |
| **MAC Address Lookup** | 通过 MAC 前缀反查网卡硬件厂商（OUI） | 离线 OUI 字典 | ⭐⭐⭐ | 字典快速二分查找 |

---

### 7. 专用数据规范 (Data) —— 【🌟🌟🌟 中等价值】

| 工具名称 | 功能描述 | 当前 JS 实现/依赖 | WASM 价值 | 推荐 Rust Crate |
| :--- | :--- | :--- | :---: | :--- |
| **Phone Formatter** | 国际电话号码合法性校验与格式化 | `google-libphonenumber` | ⭐⭐⭐⭐ | `phonenumber` |
| **IBAN Validator** | 国际银行账户号码（IBAN）合规校验 | `iban` npm | ⭐⭐⭐ | 模 97 算法校验 |

---

### 8. 数学与数值计算 (Math) —— 【🌟🌟🌟 中等价值】

| 工具名称 | 功能描述 | 当前 JS 实现/依赖 | WASM 价值 | 推荐 Rust Crate |
| :--- | :--- | :--- | :---: | :--- |
| **Math Evaluator** | 复杂数学表达式、三角函数、统计公式计算 | `mathjs` | ⭐⭐⭐⭐ | `meval` / `evalexpr` |
| **ETA Calculator** | 进度完成百分比推算剩余预估时间 | 简单数学模型 | ⭐⭐ | 纯算法 |
| **Percentage Calculator** | 常用百分比变化、增减比例计算 | 基础算术 | ⭐ | 纯公式 |

---

### 9. 图像与多媒体 (Images and videos) —— 【🌟🌟🌟🌟 高性能需求】

| 工具名称 | 功能描述 | 当前 JS 实现/依赖 | WASM 价值 | 推荐 Rust Crate |
| :--- | :--- | :--- | :---: | :--- |
| **QR Code Generator** | 根据文本生成二维码图像矢量/点阵数据 | `qrcode` npm | ⭐⭐⭐⭐ | `qrcode` |
| **WiFi QR Code** | WiFi 账号密码一键扫码连接二维码 | 字符串封装+QR | ⭐⭐⭐⭐ | `qrcode` |
| **SVG Placeholder** | 快速生成指定宽高尺寸的占位图片 | Canvas / SVG 拼接 | ⭐⭐ | 矢量代码生成 |
| **Camera Recorder** | 浏览器摄像头视频录制与预览 | 浏览器 MediaRecorder | ⭐ | 纯前端硬件 API |

---

### 10. 测量与系统基准 (Measurement) —— 【🌟🌟 辅助类】

| 工具名称 | 功能描述 | 当前 JS 实现/依赖 | WASM 价值 | 推荐 Rust Crate |
| :--- | :--- | :--- | :---: | :--- |
| **Benchmark Builder** | 浏览器端代码片段性能跑马耗时比对 | `Benchmark.js` | ⭐⭐⭐ | 计时与统计回归 |
| **Chronometer** | 倒计时与秒表计数器 | 计时器 API | ⭐ | 前端状态控制 |
| **Temperature** | 摄氏度、华氏度、开尔文热力学温标互转 | 换算公式 | ⭐ | 纯数学乘除法 |

---

## 三、 对 WasmForge 下一步落地的选型启示

通过全盘扫描 `it-tools` 的 85 款工具，我们可以清晰地划分出 **WasmForge 首批攻坚的“黄金梯队”**：

### 🥇 第一梯队（核心主力：CPU 密集 + 算法壁垒 + 跨端通用）
1. **统一加解密模块 (`crypto.wasm`)**：
   - 整合 `hash` (MD5/SHA256/SHA3/SM3)、`aes`、`hmac`、`bcrypt`、`uuid`。
   - 彻底解决浏览器处理大文本卡顿问题，且在 Hono 后端或任何宿主即插即用。
2. **统一多格式数据转换器 (`converter.wasm`)**：
   - 整合 `json <-> yaml <-> toml <-> csv <-> xml` 互转。
   - 依赖 Rust 封神的 `serde` 体系，速度比原生 JS 快 10~50 倍。
3. **文本/代码高亮与比对引擎 (`diff.wasm`)**：
   - 整合高效 `text-diff` 与 `json-diff`，解决千万级文本对比的性能问题。

### 🥈 第二梯队（纯前端无须 WASM 化，保留在前端即可）
- 像 `emoji-picker`（纯字典）、`html-wysiwyg-editor`（纯 DOM 组件）、`camera-recorder`（纯硬件驱动），这些强依赖浏览器 DOM API 的功能，直接由前端 JS/HTML 呈现，**绝不强行搬入 WASM**。
