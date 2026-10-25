import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { loadWasmFromDisk } from "./infrastructure/wasm/wasm-loader.node.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = new Hono();

// 后端直接从 public/wasm 磁盘路径加载单一 WASM 模块
const rsWasmPath = path.resolve(__dirname, "../public/wasm/rs.wasm");
const tsWasmPath = path.resolve(__dirname, "../public/wasm/ts.wasm");
const tokenWasmPath = path.resolve(__dirname, "../public/wasm/token-generator.wasm");
const hashWasmPath = path.resolve(__dirname, "../public/wasm/hash-text.wasm");
const bcryptWasmPath = path.resolve(__dirname, "../public/wasm/bcrypt.wasm");
const uuidWasmPath = path.resolve(__dirname, "../public/wasm/uuid-generator.wasm");
const ulidWasmPath = path.resolve(__dirname, "../public/wasm/ulid-generator.wasm");
const encryptionWasmPath = path.resolve(__dirname, "../public/wasm/encryption.wasm");
const bip39WasmPath = path.resolve(__dirname, "../public/wasm/bip39-generator.wasm");
const hmacWasmPath = path.resolve(__dirname, "../public/wasm/hmac-generator.wasm");
const rsaWasmPath = path.resolve(__dirname, "../public/wasm/rsa-key-pair.wasm");
const passwordStrengthWasmPath = path.resolve(__dirname, "../public/wasm/password-strength.wasm");
const pdfSignatureWasmPath = path.resolve(__dirname, "../public/wasm/pdf-signature.wasm");
const yamlToJsonWasmPath = path.resolve(__dirname, "../public/wasm/yaml-to-json.wasm");
const yamlToTomlWasmPath = path.resolve(__dirname, "../public/wasm/yaml-to-toml.wasm");
const jsonToYamlWasmPath = path.resolve(__dirname, "../public/wasm/json-to-yaml.wasm");
const jsonToTomlWasmPath = path.resolve(__dirname, "../public/wasm/json-to-toml.wasm");
const tomlToJsonWasmPath = path.resolve(__dirname, "../public/wasm/toml-to-json.wasm");
const tomlToYamlWasmPath = path.resolve(__dirname, "../public/wasm/toml-to-yaml.wasm");
const xmlToJsonWasmPath = path.resolve(__dirname, "../public/wasm/xml-to-json.wasm");
const jsonToXmlWasmPath = path.resolve(__dirname, "../public/wasm/json-to-xml.wasm");
const jsonToCsvWasmPath = path.resolve(__dirname, "../public/wasm/json-to-csv.wasm");
const base64StringWasmPath = path.resolve(__dirname, "../public/wasm/base64-string.wasm");
const base64FileWasmPath = path.resolve(__dirname, "../public/wasm/base64-file.wasm");
const colorConverterWasmPath = path.resolve(__dirname, "../public/wasm/color-converter.wasm");
const caseConverterWasmPath = path.resolve(__dirname, "../public/wasm/case-converter.wasm");
const dateTimeConverterWasmPath = path.resolve(__dirname, "../public/wasm/date-time-converter.wasm");
const integerBaseConverterWasmPath = path.resolve(__dirname, "../public/wasm/integer-base-converter.wasm");
const romanNumeralConverterWasmPath = path.resolve(__dirname, "../public/wasm/roman-numeral-converter.wasm");
const textToBinaryWasmPath = path.resolve(__dirname, "../public/wasm/text-to-binary.wasm");
const textToUnicodeWasmPath = path.resolve(__dirname, "../public/wasm/text-to-unicode.wasm");
const markdownToHtmlWasmPath = path.resolve(__dirname, "../public/wasm/markdown-to-html.wasm");
const listConverterWasmPath = path.resolve(__dirname, "../public/wasm/list-converter.wasm");
const textToNatoWasmPath = path.resolve(__dirname, "../public/wasm/text-to-nato.wasm");
const sqlPrettifyWasmPath = path.resolve(__dirname, "../public/wasm/sql-prettify.wasm");
const xmlFormatterWasmPath = path.resolve(__dirname, "../public/wasm/xml-formatter.wasm");
const jsonMinifyWasmPath = path.resolve(__dirname, "../public/wasm/json-minify.wasm");
const jsonViewerWasmPath = path.resolve(__dirname, "../public/wasm/json-viewer.wasm");
const yamlViewerWasmPath = path.resolve(__dirname, "../public/wasm/yaml-viewer.wasm");
const regexTesterWasmPath = path.resolve(__dirname, "../public/wasm/regex-tester.wasm");
const regexMemoWasmPath = path.resolve(__dirname, "../public/wasm/regex-memo.wasm");
const crontabGeneratorWasmPath = path.resolve(__dirname, "../public/wasm/crontab-generator.wasm");
const chmodCalculatorWasmPath = path.resolve(__dirname, "../public/wasm/chmod-calculator.wasm");
const dockerRunToComposeWasmPath = path.resolve(__dirname, "../public/wasm/docker-run-to-compose.wasm");
const emailNormalizerWasmPath = path.resolve(__dirname, "../public/wasm/email-normalizer.wasm");
const gitMemoWasmPath = path.resolve(__dirname, "../public/wasm/git-memo.wasm");
const randomPortWasmPath = path.resolve(__dirname, "../public/wasm/random-port.wasm");
const textDiffWasmPath = path.resolve(__dirname, "../public/wasm/text-diff.wasm");
const textStatisticsWasmPath = path.resolve(__dirname, "../public/wasm/text-statistics.wasm");
const stringObfuscatorWasmPath = path.resolve(__dirname, "../public/wasm/string-obfuscator.wasm");
const loremIpsumWasmPath = path.resolve(__dirname, "../public/wasm/lorem-ipsum.wasm");
const asciiTextDrawerWasmPath = path.resolve(__dirname, "../public/wasm/ascii-text-drawer.wasm");
const numeronymGeneratorWasmPath = path.resolve(__dirname, "../public/wasm/numeronym-generator.wasm");
const emojiPickerWasmPath = path.resolve(__dirname, "../public/wasm/emoji-picker.wasm");
const jwtParserWasmPath = path.resolve(__dirname, "../public/wasm/jwt-parser.wasm");
const otpGeneratorWasmPath = path.resolve(__dirname, "../public/wasm/otp-generator.wasm");
const urlEncoderDecoderWasmPath = path.resolve(__dirname, "../public/wasm/url-encoder-decoder.wasm");

let rsEngine = null;
let tsEngine = null;
let tokenEngine = null;
let hashEngine = null;
let bcryptEngine = null;
let uuidEngine = null;
let ulidEngine = null;
let encryptionEngine = null;
let bip39Engine = null;
let hmacEngine = null;
let rsaEngine = null;
let passwordStrengthEngine = null;
let pdfSignatureEngine = null;
let yamlToJsonEngine = null;
let yamlToTomlEngine = null;
let jsonToYamlEngine = null;
let jsonToTomlEngine = null;
let tomlToJsonEngine = null;
let tomlToYamlEngine = null;
let xmlToJsonEngine = null;
let jsonToXmlEngine = null;
let jsonToCsvEngine = null;
let base64StringEngine = null;
let base64FileEngine = null;
let colorConverterEngine = null;
let caseConverterEngine = null;
let dateTimeConverterEngine = null;
let integerBaseConverterEngine = null;
let romanNumeralConverterEngine = null;
let textToBinaryEngine = null;
let textToUnicodeEngine = null;
let markdownToHtmlEngine = null;
let listConverterEngine = null;
let textToNatoEngine = null;
let sqlPrettifyEngine = null;
let xmlFormatterEngine = null;
let jsonMinifyEngine = null;
let jsonViewerEngine = null;
let yamlViewerEngine = null;
let regexTesterEngine = null;
let regexMemoEngine = null;
let crontabGeneratorEngine = null;
let chmodCalculatorEngine = null;
let dockerRunToComposeEngine = null;
let emailNormalizerEngine = null;
let gitMemoEngine = null;
let randomPortEngine = null;
let textDiffEngine = null;
let textStatisticsEngine = null;
let stringObfuscatorEngine = null;
let loremIpsumEngine = null;
let asciiTextDrawerEngine = null;
let numeronymGeneratorEngine = null;
let emojiPickerEngine = null;
let jwtParserEngine = null;
let otpGeneratorEngine = null;
let urlEncoderDecoderEngine = null;

async function initEngines() {
  try {
    if (fs.existsSync(rsWasmPath)) {
      rsEngine = await loadWasmFromDisk(rsWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 rs.wasm 加载成功");
    } else {
      console.warn("⚠️ rs.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(tsWasmPath)) {
      tsEngine = await loadWasmFromDisk(tsWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 ts.wasm 加载成功");
    } else {
      console.warn("⚠️ ts.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(tokenWasmPath)) {
      tokenEngine = await loadWasmFromDisk(tokenWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 token-generator.wasm 加载成功");
    } else {
      console.warn("⚠️ token-generator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(hashWasmPath)) {
      hashEngine = await loadWasmFromDisk(hashWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 hash-text.wasm 加载成功");
    } else {
      console.warn("⚠️ hash-text.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(bcryptWasmPath)) {
      bcryptEngine = await loadWasmFromDisk(bcryptWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 bcrypt.wasm 加载成功");
    } else {
      console.warn("⚠️ bcrypt.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(uuidWasmPath)) {
      uuidEngine = await loadWasmFromDisk(uuidWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 uuid-generator.wasm 加载成功");
    } else {
      console.warn("⚠️ uuid-generator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(ulidWasmPath)) {
      ulidEngine = await loadWasmFromDisk(ulidWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 ulid-generator.wasm 加载成功");
    } else {
      console.warn("⚠️ ulid-generator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(encryptionWasmPath)) {
      encryptionEngine = await loadWasmFromDisk(encryptionWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 encryption.wasm 加载成功");
    } else {
      console.warn("⚠️ encryption.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(bip39WasmPath)) {
      bip39Engine = await loadWasmFromDisk(bip39WasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 bip39-generator.wasm 加载成功");
    } else {
      console.warn("⚠️ bip39-generator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(hmacWasmPath)) {
      hmacEngine = await loadWasmFromDisk(hmacWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 hmac-generator.wasm 加载成功");
    } else {
      console.warn("⚠️ hmac-generator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(rsaWasmPath)) {
      rsaEngine = await loadWasmFromDisk(rsaWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 rsa-key-pair.wasm 加载成功");
    } else {
      console.warn("⚠️ rsa-key-pair.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(passwordStrengthWasmPath)) {
      passwordStrengthEngine = await loadWasmFromDisk(passwordStrengthWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 password-strength.wasm 加载成功");
    } else {
      console.warn("⚠️ password-strength.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(pdfSignatureWasmPath)) {
      pdfSignatureEngine = await loadWasmFromDisk(pdfSignatureWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 pdf-signature.wasm 加载成功");
    } else {
      console.warn("⚠️ pdf-signature.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(yamlToJsonWasmPath)) {
      yamlToJsonEngine = await loadWasmFromDisk(yamlToJsonWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 yaml-to-json.wasm 加载成功");
    } else {
      console.warn("⚠️ yaml-to-json.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(yamlToTomlWasmPath)) {
      yamlToTomlEngine = await loadWasmFromDisk(yamlToTomlWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 yaml-to-toml.wasm 加载成功");
    } else {
      console.warn("⚠️ yaml-to-toml.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(jsonToYamlWasmPath)) {
      jsonToYamlEngine = await loadWasmFromDisk(jsonToYamlWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 json-to-yaml.wasm 加载成功");
    } else {
      console.warn("⚠️ json-to-yaml.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(jsonToTomlWasmPath)) {
      jsonToTomlEngine = await loadWasmFromDisk(jsonToTomlWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 json-to-toml.wasm 加载成功");
    } else {
      console.warn("⚠️ json-to-toml.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(tomlToJsonWasmPath)) {
      tomlToJsonEngine = await loadWasmFromDisk(tomlToJsonWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 toml-to-json.wasm 加载成功");
    } else {
      console.warn("⚠️ toml-to-json.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(tomlToYamlWasmPath)) {
      tomlToYamlEngine = await loadWasmFromDisk(tomlToYamlWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 toml-to-yaml.wasm 加载成功");
    } else {
      console.warn("⚠️ toml-to-yaml.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(xmlToJsonWasmPath)) {
      xmlToJsonEngine = await loadWasmFromDisk(xmlToJsonWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 xml-to-json.wasm 加载成功");
    } else {
      console.warn("⚠️ xml-to-json.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(jsonToXmlWasmPath)) {
      jsonToXmlEngine = await loadWasmFromDisk(jsonToXmlWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 json-to-xml.wasm 加载成功");
    } else {
      console.warn("⚠️ json-to-xml.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(jsonToCsvWasmPath)) {
      jsonToCsvEngine = await loadWasmFromDisk(jsonToCsvWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 json-to-csv.wasm 加载成功");
    } else {
      console.warn("⚠️ json-to-csv.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(base64StringWasmPath)) {
      base64StringEngine = await loadWasmFromDisk(base64StringWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 base64-string.wasm 加载成功");
    } else {
      console.warn("⚠️ base64-string.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(base64FileWasmPath)) {
      base64FileEngine = await loadWasmFromDisk(base64FileWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 base64-file.wasm 加载成功");
    } else {
      console.warn("⚠️ base64-file.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(colorConverterWasmPath)) {
      colorConverterEngine = await loadWasmFromDisk(colorConverterWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 color-converter.wasm 加载成功");
    } else {
      console.warn("⚠️ color-converter.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(caseConverterWasmPath)) {
      caseConverterEngine = await loadWasmFromDisk(caseConverterWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 case-converter.wasm 加载成功");
    } else {
      console.warn("⚠️ case-converter.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(dateTimeConverterWasmPath)) {
      dateTimeConverterEngine = await loadWasmFromDisk(dateTimeConverterWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 date-time-converter.wasm 加载成功");
    } else {
      console.warn("⚠️ date-time-converter.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(integerBaseConverterWasmPath)) {
      integerBaseConverterEngine = await loadWasmFromDisk(integerBaseConverterWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 integer-base-converter.wasm 加载成功");
    } else {
      console.warn("⚠️ integer-base-converter.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(romanNumeralConverterWasmPath)) {
      romanNumeralConverterEngine = await loadWasmFromDisk(romanNumeralConverterWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 roman-numeral-converter.wasm 加载成功");
    } else {
      console.warn("⚠️ roman-numeral-converter.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(textToBinaryWasmPath)) {
      textToBinaryEngine = await loadWasmFromDisk(textToBinaryWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 text-to-binary.wasm 加载成功");
    } else {
      console.warn("⚠️ text-to-binary.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(textToUnicodeWasmPath)) {
      textToUnicodeEngine = await loadWasmFromDisk(textToUnicodeWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 text-to-unicode.wasm 加载成功");
    } else {
      console.warn("⚠️ text-to-unicode.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(markdownToHtmlWasmPath)) {
      markdownToHtmlEngine = await loadWasmFromDisk(markdownToHtmlWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 markdown-to-html.wasm 加载成功");
    } else {
      console.warn("⚠️ markdown-to-html.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(listConverterWasmPath)) {
      listConverterEngine = await loadWasmFromDisk(listConverterWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 list-converter.wasm 加载成功");
    } else {
      console.warn("⚠️ list-converter.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(textToNatoWasmPath)) {
      textToNatoEngine = await loadWasmFromDisk(textToNatoWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 text-to-nato.wasm 加载成功");
    } else {
      console.warn("⚠️ text-to-nato.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(sqlPrettifyWasmPath)) {
      sqlPrettifyEngine = await loadWasmFromDisk(sqlPrettifyWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 sql-prettify.wasm 加载成功");
    } else {
      console.warn("⚠️ sql-prettify.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(xmlFormatterWasmPath)) {
      xmlFormatterEngine = await loadWasmFromDisk(xmlFormatterWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 xml-formatter.wasm 加载成功");
    } else {
      console.warn("⚠️ xml-formatter.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(jsonMinifyWasmPath)) {
      jsonMinifyEngine = await loadWasmFromDisk(jsonMinifyWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 json-minify.wasm 加载成功");
    } else {
      console.warn("⚠️ json-minify.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(jsonViewerWasmPath)) {
      jsonViewerEngine = await loadWasmFromDisk(jsonViewerWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 json-viewer.wasm 加载成功");
    } else {
      console.warn("⚠️ json-viewer.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(yamlViewerWasmPath)) {
      yamlViewerEngine = await loadWasmFromDisk(yamlViewerWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 yaml-viewer.wasm 加载成功");
    } else {
      console.warn("⚠️ yaml-viewer.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(regexTesterWasmPath)) {
      regexTesterEngine = await loadWasmFromDisk(regexTesterWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 regex-tester.wasm 加载成功");
    } else {
      console.warn("⚠️ regex-tester.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(regexMemoWasmPath)) {
      regexMemoEngine = await loadWasmFromDisk(regexMemoWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 regex-memo.wasm 加载成功");
    } else {
      console.warn("⚠️ regex-memo.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(crontabGeneratorWasmPath)) {
      crontabGeneratorEngine = await loadWasmFromDisk(crontabGeneratorWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 crontab-generator.wasm 加载成功");
    } else {
      console.warn("⚠️ crontab-generator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(chmodCalculatorWasmPath)) {
      chmodCalculatorEngine = await loadWasmFromDisk(chmodCalculatorWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 chmod-calculator.wasm 加载成功");
    } else {
      console.warn("⚠️ chmod-calculator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(dockerRunToComposeWasmPath)) {
      dockerRunToComposeEngine = await loadWasmFromDisk(dockerRunToComposeWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 docker-run-to-compose.wasm 加载成功");
    } else {
      console.warn("⚠️ docker-run-to-compose.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(emailNormalizerWasmPath)) {
      emailNormalizerEngine = await loadWasmFromDisk(emailNormalizerWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 email-normalizer.wasm 加载成功");
    } else {
      console.warn("⚠️ email-normalizer.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(gitMemoWasmPath)) {
      gitMemoEngine = await loadWasmFromDisk(gitMemoWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 git-memo.wasm 加载成功");
    } else {
      console.warn("⚠️ git-memo.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(randomPortWasmPath)) {
      randomPortEngine = await loadWasmFromDisk(randomPortWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 random-port.wasm 加载成功");
    } else {
      console.warn("⚠️ random-port.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(textDiffWasmPath)) {
      textDiffEngine = await loadWasmFromDisk(textDiffWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 text-diff.wasm 加载成功");
    } else {
      console.warn("⚠️ text-diff.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(textStatisticsWasmPath)) {
      textStatisticsEngine = await loadWasmFromDisk(textStatisticsWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 text-statistics.wasm 加载成功");
    } else {
      console.warn("⚠️ text-statistics.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(stringObfuscatorWasmPath)) {
      stringObfuscatorEngine = await loadWasmFromDisk(stringObfuscatorWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 string-obfuscator.wasm 加载成功");
    } else {
      console.warn("⚠️ string-obfuscator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(loremIpsumWasmPath)) {
      loremIpsumEngine = await loadWasmFromDisk(loremIpsumWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 lorem-ipsum.wasm 加载成功");
    } else {
      console.warn("⚠️ lorem-ipsum.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(asciiTextDrawerWasmPath)) {
      asciiTextDrawerEngine = await loadWasmFromDisk(asciiTextDrawerWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 ascii-text-drawer.wasm 加载成功");
    } else {
      console.warn("⚠️ ascii-text-drawer.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(numeronymGeneratorWasmPath)) {
      numeronymGeneratorEngine = await loadWasmFromDisk(numeronymGeneratorWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 numeronym-generator.wasm 加载成功");
    } else {
      console.warn("⚠️ numeronym-generator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(emojiPickerWasmPath)) {
      emojiPickerEngine = await loadWasmFromDisk(emojiPickerWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 emoji-picker.wasm 加载成功");
    } else {
      console.warn("⚠️ emoji-picker.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(jwtParserWasmPath)) {
      jwtParserEngine = await loadWasmFromDisk(jwtParserWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 jwt-parser.wasm 加载成功");
    } else {
      console.warn("⚠️ jwt-parser.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(otpGeneratorWasmPath)) {
      otpGeneratorEngine = await loadWasmFromDisk(otpGeneratorWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 otp-generator.wasm 加载成功");
    } else {
      console.warn("⚠️ otp-generator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    if (fs.existsSync(urlEncoderDecoderWasmPath)) {
      urlEncoderDecoderEngine = await loadWasmFromDisk(urlEncoderDecoderWasmPath);
      console.log("✅ [Backend Infra] 纯单一文件 url-encoder-decoder.wasm 加载成功");
    } else {
      console.warn("⚠️ url-encoder-decoder.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }
  } catch (err) {
    console.error("❌ 后端 WASM 基础设施初始化失败:", err);
  }
}

await initEngines();

// 静态资源托管：提供前端访问 index.html, wasm/rs.wasm, wasm/ts.wasm 等
app.use("/*", serveStatic({
  root: "./public",
  onFound: (path, c) => {
    if (path.endsWith(".wasm")) {
      c.header("Content-Type", "application/wasm");
    }
  }
}));

// API: 后端执行加法 (由 HTMX 调用)
app.post("/api/backend/calc", async (c) => {
  try {
    const body = await c.req.parseBody();
    const engineType = (body.engine || "rust").toString();
    const a = parseInt(body.a || "0", 10);
    const b = parseInt(body.b || "0", 10);

    const engine = engineType === "rust" ? rsEngine : tsEngine;
    if (!engine) {
      throw new Error(`引擎 ${engineType} 尚未初始化，请确保 public/wasm/${engineType === "rust" ? "rs" : "ts"}.wasm 存在`);
    }

    const t0 = performance.now();
    const result = engine.add(a, b);
    const duration = (performance.now() - t0).toFixed(4);

    const engineName = engineType === "rust" ? "🦀 Rust WASM" : "🚀 AssemblyScript WASM";
    const tagClass = engineType === "rust" ? "tag-rust" : "tag-ts";

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag ${tagClass}">${engineName}</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生 WASM 计算)</span>
        </div>
        <div class="result-value">${a} + ${b} = <strong>${result}</strong></div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>执行失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端执行问候 (由 HTMX 调用)
app.post("/api/backend/greet", async (c) => {
  try {
    const body = await c.req.parseBody();
    const engineType = (body.engine || "rust").toString();
    const name = (body.name || "World").toString().trim();

    const engine = engineType === "rust" ? rsEngine : tsEngine;
    if (!engine) {
      throw new Error(`引擎 ${engineType} 尚未初始化，请确保 public/wasm/${engineType === "rust" ? "rs" : "ts"}.wasm 存在`);
    }

    const t0 = performance.now();
    const result = engine.greet(name);
    const duration = (performance.now() - t0).toFixed(4);

    const engineName = engineType === "rust" ? "🦀 Rust WASM" : "🚀 AssemblyScript WASM";
    const tagClass = engineType === "rust" ? "tag-rust" : "tag-ts";

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag ${tagClass}">${engineName}</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生 WASM 内存解算)</span>
        </div>
        <div class="result-value">${result}</div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>执行失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端执行 Token 生成 (支持 HTMX Form 表单与 JSON 调用)
app.post("/api/backend/token/generate", async (c) => {
  try {
    if (!tokenEngine) {
      throw new Error("token-generator.wasm 模块尚未就绪，请先完成编译");
    }

    const contentType = c.req.header("content-type") || "";
    let params = {};

    if (contentType.includes("application/json")) {
      const json = await c.req.json();
      params = json.params || json;
    } else {
      const body = await c.req.parseBody();
      params = {
        length: parseInt(body.length || "32", 10),
        withUppercase: body.withUppercase === "on" || body.withUppercase === "true" || body.withUppercase === true,
        withLowercase: body.withLowercase === "on" || body.withLowercase === "true" || body.withLowercase === true,
        withNumbers: body.withNumbers === "on" || body.withNumbers === "true" || body.withNumbers === true,
        withSymbols: body.withSymbols === "on" || body.withSymbols === "true" || body.withSymbols === true,
        customAlphabet: body.customAlphabet ? body.customAlphabet.toString().trim() : undefined,
        seed: body.seed ? parseInt(body.seed, 10) : undefined,
      };
    }

    const t0 = performance.now();
    const response = tokenEngine.dispatch({
      action: "token/generate",
      requestId: `req-${Date.now()}`,
      params,
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg || "Token 生成失败");
    }

    const { token, length, entropyBits, charsetSize } = response.data;

    if (c.req.header("accept")?.includes("application/json") && !c.req.header("hx-request")) {
      return c.json({ ...response, serverDurationMs: duration });
    }

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: token-generator</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生 WASM 计算)</span>
        </div>
        <div class="token-display-wrap" style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:10px 14px; border-radius:8px; margin:8px 0;">
          <div class="result-value" id="server-token-text" style="font-size:15px; color:#38bdf8; word-break:break-all; flex:1;">${token}</div>
          <button type="button" class="btn-copy" style="margin-left:12px; padding:6px 12px; border-radius:6px; background:#1e293b; color:#fff; border:1px solid #38bdf8; cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('server-token-text').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
        </div>
        <div class="token-meta" style="display:flex; gap:16px; font-size:12px; color:var(--text-muted); margin-top:6px;">
          <span>📏 长度: <strong style="color:#fff;">${length}</strong></span>
          <span>🔤 字符集大小: <strong style="color:#fff;">${charsetSize}</strong></span>
          <span>🔐 密码熵: <strong style="color:#34d399;">${entropyBits.toFixed(1)} bits</strong></span>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>生成失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端执行哈希计算 (hash/all: 一键返回 6 种主流哈希)
app.post("/api/backend/hash/all", async (c) => {
  try {
    if (!hashEngine) {
      throw new Error("hash-text.wasm 模块尚未就绪，请先完成编译");
    }

    const contentType = c.req.header("content-type") || "";
    let text = "";

    if (contentType.includes("application/json")) {
      const json = await c.req.json();
      text = json.text || (json.params && json.params.text) || "";
    } else {
      const body = await c.req.parseBody();
      text = (body.text || "").toString();
    }

    const t0 = performance.now();
    const response = hashEngine.dispatch({
      action: "hash/all",
      requestId: `req-${Date.now()}`,
      params: { text },
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg || "哈希计算失败");
    }

    const d = response.data;

    if (c.req.header("accept")?.includes("application/json") && !c.req.header("hx-request")) {
      return c.json({ ...response, serverDurationMs: duration });
    }

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: hash-text</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端微秒级 6 哈希全量运算)</span>
        </div>
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:10px;">
          字符数: <strong style="color:#fff;">${d.textLength}</strong> | 字节数 (UTF-8): <strong style="color:#fff;">${d.byteLength}</strong>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <div class="hash-row" style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:6px; font-size:13px; font-family:var(--font-mono);">
            <span style="color:#f97316; font-weight:bold; width:80px;">MD5</span>
            <span id="srv-hash-md5" style="color:#f1f5f9; word-break:break-all; flex:1;">${d.md5}</span>
            <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.2); cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-hash-md5').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
          <div class="hash-row" style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:6px; font-size:13px; font-family:var(--font-mono);">
            <span style="color:#38bdf8; font-weight:bold; width:80px;">SHA-1</span>
            <span id="srv-hash-sha1" style="color:#f1f5f9; word-break:break-all; flex:1;">${d.sha1}</span>
            <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.2); cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-hash-sha1').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
          <div class="hash-row" style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:6px; font-size:13px; font-family:var(--font-mono);">
            <span style="color:#34d399; font-weight:bold; width:80px;">SHA-256</span>
            <span id="srv-hash-sha256" style="color:#34d399; word-break:break-all; flex:1; font-weight:bold;">${d.sha256}</span>
            <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid #34d399; cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-hash-sha256').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
          <div class="hash-row" style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:6px; font-size:13px; font-family:var(--font-mono);">
            <span style="color:#eab308; font-weight:bold; width:80px;">SHA-512</span>
            <span id="srv-hash-sha512" style="color:#f1f5f9; word-break:break-all; flex:1; font-size:11px;">${d.sha512}</span>
            <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.2); cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-hash-sha512').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
          <div class="hash-row" style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:6px; font-size:13px; font-family:var(--font-mono);">
            <span style="color:#a855f7; font-weight:bold; width:80px;">SHA3-256</span>
            <span id="srv-hash-sha3" style="color:#f1f5f9; word-break:break-all; flex:1;">${d.sha3_256}</span>
            <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.2); cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-hash-sha3').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
          <div class="hash-row" style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:6px; font-size:13px; font-family:var(--font-mono);">
            <span style="color:#ec4899; font-weight:bold; width:80px;">RIPEMD160</span>
            <span id="srv-hash-ripemd" style="color:#f1f5f9; word-break:break-all; flex:1;">${d.ripemd160}</span>
            <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.2); cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-hash-ripemd').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>计算失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端执行 Bcrypt 计算
app.post("/api/backend/bcrypt/hash", async (c) => {
  try {
    if (!bcryptEngine) {
      throw new Error("bcrypt.wasm 模块尚未就绪，请先完成编译");
    }

    const body = await c.req.parseBody();
    const password = (body.password || "").toString();
    const cost = parseInt(body.cost || "10", 10);

    const t0 = performance.now();
    const response = bcryptEngine.dispatch({
      action: "bcrypt/hash",
      requestId: `req-${Date.now()}`,
      params: { password, cost },
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg || "Bcrypt 哈希计算失败");
    }

    const { hash } = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: bcrypt</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端高抗碰撞哈希计算)</span>
        </div>
        <div class="token-display-wrap" style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:10px 14px; border-radius:8px; margin:8px 0;">
          <div class="result-value" id="server-bcrypt-hash" style="font-size:14px; color:#38bdf8; word-break:break-all; flex:1;">${hash}</div>
          <button type="button" class="btn-copy" style="margin-left:12px; padding:6px 12px; border-radius:6px; background:#1e293b; color:#fff; border:1px solid #38bdf8; cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('server-bcrypt-hash').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
        </div>
        <div class="token-meta" style="display:flex; gap:16px; font-size:12px; color:var(--text-muted); margin-top:6px;">
          <span>🎯 运算轮次 (Cost): <strong style="color:#fff;">${cost}</strong></span>
          <span>🔒 密码学算法: <strong style="color:#34d399;">Blowfish-based Bcrypt</strong></span>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>生成失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

app.post("/api/backend/bcrypt/verify", async (c) => {
  try {
    if (!bcryptEngine) {
      throw new Error("bcrypt.wasm 模块尚未就绪，请先完成编译");
    }

    const body = await c.req.parseBody();
    const password = (body.password || "").toString();
    const hash = (body.hash || "").toString().trim();

    const t0 = performance.now();
    const response = bcryptEngine.dispatch({
      action: "bcrypt/verify",
      requestId: `req-${Date.now()}`,
      params: { password, hash },
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg || "比对失败");
    }

    const { valid } = response.data;
    const badgeColor = valid ? "#34d399" : "#ef4444";
    const statusText = valid ? "✅ 验证通过：密码与哈希完全匹配" : "❌ 验证失败：密码错误或哈希不匹配";

    return c.html(`
      <div class="result-box" style="border-color:${badgeColor};">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: bcrypt 恒定时间校验</span>
          <span class="badge-time">⚡ ${duration} ms</span>
        </div>
        <div style="font-size:15px; font-weight:bold; color:${badgeColor}; margin-top:4px;">
          ${statusText}
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>比对异常:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端生成 UUID (支持 v4 与 v7)
app.post("/api/backend/uuid/generate", async (c) => {
  try {
    if (!uuidEngine) {
      throw new Error("uuid-generator.wasm 模块尚未就绪，请先完成编译");
    }

    const body = await c.req.parseBody();
    const version = (body.version || "v4").toString();
    const count = parseInt(body.count || "1", 10);
    const uppercase = body.uppercase === "on" || body.uppercase === "true" || body.uppercase === true;
    const hyphens = body.hyphens !== "off" && body.hyphens !== "false" && body.hyphens !== false;

    const t0 = performance.now();
    const response = uuidEngine.dispatch({
      action: version === "v7" ? "uuid/v7" : "uuid/v4",
      requestId: `req-${Date.now()}`,
      params: {
        count,
        uppercase,
        hyphens,
        timestampMs: Date.now(),
      },
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg || "UUID 生成失败");
    }

    const { uuids } = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: uuid-${version} (${count} 个)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生极速生成)</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px; margin:8px 0;">
          ${uuids.map((id, idx) => `
            <div class="token-display-wrap" style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:6px;">
              <div class="result-value" id="srv-uuid-${idx}" style="font-size:14px; color:#38bdf8; word-break:break-all; flex:1;">${id}</div>
              <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid #38bdf8; cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-uuid-${idx}').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
            </div>
          `).join("")}
        </div>
        <div class="token-meta" style="display:flex; gap:16px; font-size:12px; color:var(--text-muted);">
          <span>规格: <strong style="color:#fff;">${version.toUpperCase()} (RFC ${version === "v7" ? "9562 时间单调" : "4122 强随机"})</strong></span>
          <span>连字符: <strong style="color:#34d399;">${hyphens ? "是" : "否"}</strong></span>
          <span>大写字母: <strong style="color:#34d399;">${uppercase ? "是" : "否"}</strong></span>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>生成失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端 ULID 生成 (由 HTMX 调用)
app.post("/api/backend/ulid/generate", async (c) => {
  try {
    if (!ulidEngine) {
      throw new Error("ulid-generator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    const body = await c.req.parseBody();
    const count = parseInt(body.count || "3", 10);
    const customTs = body.timestampMs ? parseInt(body.timestampMs, 10) : Date.now();

    const t0 = performance.now();
    const response = ulidEngine.dispatch({
      action: "ulid/generate",
      requestId: `srv-${Date.now()}`,
      params: {
        count,
        timestampMs: customTs,
        seed: Math.floor(Math.random() * 0xFFFFFFFF)
      }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg);
    }

    const { ulids, timestampMs, datetimeIso } = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: ulid-generator (${count} 个)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生毫秒级生成)</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px; margin:8px 0;">
          ${ulids.map((id, idx) => `
            <div class="token-display-wrap" style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:6px;">
              <div class="result-value" id="srv-ulid-${idx}" style="font-size:14px; color:#a855f7; word-break:break-all; flex:1;">${id}</div>
              <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid #a855f7; cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-ulid-${idx}').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
            </div>
          `).join("")}
        </div>
        <div class="token-meta" style="display:flex; gap:16px; font-size:12px; color:var(--text-muted);">
          <span>编码规范: <strong style="color:#fff;">Crockford's Base32 (26 字符)</strong></span>
          <span>时间戳: <strong style="color:#34d399;">${timestampMs}</strong> (${datetimeIso})</span>
          <span>字典排序: <strong style="color:#38bdf8;">单调递增</strong></span>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>生成失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端 ULID 解析 (由 HTMX 调用)
app.post("/api/backend/ulid/parse", async (c) => {
  try {
    if (!ulidEngine) {
      throw new Error("ulid-generator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    const body = await c.req.parseBody();
    const ulid = (body.ulid || "").toString().trim();

    const t0 = performance.now();
    const response = ulidEngine.dispatch({
      action: "ulid/parse",
      requestId: `srv-${Date.now()}`,
      params: { ulid }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg);
    }

    const { timestampMs, datetimeIso, isValid } = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: ULID 结构逆向解析</span>
          <span class="badge-time">⚡ ${duration} ms</span>
        </div>
        <div style="font-size:13px; font-family:var(--font-mono); margin:8px 0; color:#fff;">
          <div>目标 ULID: <strong style="color:#a855f7;">${ulid}</strong></div>
          <div style="margin-top:6px; color:#34d399;">⏱️ 提取时间戳: <strong>${timestampMs} ms</strong></div>
          <div style="margin-top:4px; color:#38bdf8;">📅 ISO 8601 UTC: <strong>${datetimeIso}</strong></div>
          <div style="margin-top:4px; color:#e2e8f0;">48-bit 毫秒前缀: <strong>${ulid.slice(0, 10)}</strong> | 80-bit 随机后缀: <strong>${ulid.slice(10)}</strong></div>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>解析失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端 AES 加密 (由 HTMX 调用)
app.post("/api/backend/aes/encrypt", async (c) => {
  try {
    if (!encryptionEngine) {
      throw new Error("encryption.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    const body = await c.req.parseBody();
    const text = (body.text || "").toString();
    const secretKey = (body.secretKey || "").toString();
    const keyBits = parseInt(body.keyBits || "256", 10);
    const format = (body.format || "base64").toString();

    const t0 = performance.now();
    const response = encryptionEngine.dispatch({
      action: "aes/encrypt",
      requestId: `srv-${Date.now()}`,
      params: {
        text,
        secretKey,
        keyBits,
        format,
        seed: Math.floor(Math.random() * 0xFFFFFFFF)
      }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg);
    }

    const { ciphertext, nonce, algorithm } = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: ${algorithm}</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生极速加密)</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px; margin:8px 0;">
          <div>
            <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">密文 (Ciphertext + 128-bit Auth Tag):</div>
            <div class="token-display-wrap" style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:6px;">
              <div class="result-value" id="srv-aes-cipher" style="font-size:13px; color:#10b981; word-break:break-all; flex:1;">${ciphertext}</div>
              <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid #10b981; cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-aes-cipher').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
            </div>
          </div>
          <div>
            <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">随机 Nonce / IV (96-bit 认证初始向量):</div>
            <div class="token-display-wrap" style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:6px;">
              <div class="result-value" id="srv-aes-nonce" style="font-size:13px; color:#38bdf8; word-break:break-all; flex:1;">${nonce}</div>
              <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid #38bdf8; cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-aes-nonce').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
            </div>
          </div>
        </div>
        <div class="token-meta" style="display:flex; gap:16px; font-size:12px; color:var(--text-muted);">
          <span>模式: <strong style="color:#fff;">Galois/Counter Mode (AEAD)</strong></span>
          <span>密钥长度: <strong style="color:#34d399;">${keyBits} bits</strong></span>
          <span>编码: <strong style="color:#38bdf8;">${format.toUpperCase()}</strong></span>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>加密失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端 AES 解密 (由 HTMX 调用)
app.post("/api/backend/aes/decrypt", async (c) => {
  try {
    if (!encryptionEngine) {
      throw new Error("encryption.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    const body = await c.req.parseBody();
    const ciphertext = (body.ciphertext || "").toString().trim();
    const secretKey = (body.secretKey || "").toString();
    const nonce = (body.nonce || "").toString().trim();
    const keyBits = parseInt(body.keyBits || "256", 10);
    const format = (body.format || "base64").toString();

    const t0 = performance.now();
    const response = encryptionEngine.dispatch({
      action: "aes/decrypt",
      requestId: `srv-${Date.now()}`,
      params: {
        ciphertext,
        secretKey,
        nonce,
        keyBits,
        format
      }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg);
    }

    const { plaintext, verified, algorithm } = response.data;

    return c.html(`
      <div class="result-box" style="border-color:#10b981;">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: ${algorithm} 解密校验通过</span>
          <span class="badge-time">⚡ ${duration} ms (恒定时间认证)</span>
        </div>
        <div style="margin:8px 0;">
          <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">解密明文 (Plaintext Payload):</div>
          <div class="token-display-wrap" style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:6px;">
            <div class="result-value" id="srv-aes-plain" style="font-size:14px; color:#34d399; font-weight:bold; word-break:break-all; flex:1;">${plaintext}</div>
            <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid #34d399; cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-aes-plain').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
        </div>
        <div class="token-meta" style="display:flex; gap:16px; font-size:12px; color:var(--text-muted);">
          <span>🔒 认证标签验证: <strong style="color:#34d399;">✅ 完整且未被篡改</strong></span>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>解密失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端 BIP-39 助记词生成 (由 HTMX 调用)
app.post("/api/backend/bip39/generate", async (c) => {
  try {
    if (!bip39Engine) {
      throw new Error("bip39-generator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    const body = await c.req.parseBody();
    const wordCount = parseInt(body.wordCount || "12", 10);
    const passphrase = (body.passphrase || "").toString();

    const t0 = performance.now();
    const response = bip39Engine.dispatch({
      action: "bip39/generate",
      requestId: `srv-${Date.now()}`,
      params: {
        wordCount,
        passphrase,
        seed: Math.floor(Math.random() * 0xFFFFFFFF)
      }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg);
    }

    const { mnemonic, words, entropyHex, seedHex } = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: BIP-39 (${wordCount} 单词)</span>
          <span class="badge-time">⚡ ${duration} ms (PBKDF2 2048轮原生秒出)</span>
        </div>
        <div style="margin:8px 0;">
          <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">英文标准助记词 (Mnemonic Phrase):</div>
          <div style="display:flex; flex-wrap:wrap; gap:6px; background:rgba(0,0,0,0.3); padding:10px 14px; border-radius:8px;">
            ${words.map((w, idx) => `
              <span style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); padding:4px 8px; border-radius:4px; font-family:var(--font-mono); font-size:13px; color:#38bdf8;">
                <span style="color:var(--text-muted); font-size:10px; margin-right:4px;">${idx + 1}</span>${w}
              </span>
            `).join("")}
          </div>
          <div style="display:flex; justify-content:flex-end; margin-top:6px;">
            <button type="button" class="btn-copy" style="padding:4px 10px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid #38bdf8; cursor:pointer; font-size:12px;" onclick="navigator.clipboard.writeText('${mnemonic}'); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制完整助记词', 1500)">复制完整助记词</button>
          </div>
        </div>
        <div style="margin-top:8px;">
          <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">512-bit 主种子 (Seed Hex):</div>
          <div class="result-value" style="font-size:11px; color:#34d399; background:rgba(0,0,0,0.2); padding:6px 10px; border-radius:4px; word-break:break-all;">${seedHex}</div>
        </div>
        <div class="token-meta" style="display:flex; gap:16px; font-size:12px; color:var(--text-muted); margin-top:8px;">
          <span>熵值: <strong style="color:#fff;">${entropyHex.length * 4} bits</strong></span>
          <span>字典: <strong style="color:#34d399;">English (2048 words)</strong></span>
          <span>盐口令: <strong style="color:#38bdf8;">${passphrase ? '已启用' : '无'}</strong></span>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>生成失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端 BIP-39 助记词校验 (由 HTMX 调用)
app.post("/api/backend/bip39/validate", async (c) => {
  try {
    if (!bip39Engine) {
      throw new Error("bip39-generator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    const body = await c.req.parseBody();
    const mnemonic = (body.mnemonic || "").toString().trim();
    const passphrase = (body.passphrase || "").toString();

    const t0 = performance.now();
    const response = bip39Engine.dispatch({
      action: "bip39/validate",
      requestId: `srv-${Date.now()}`,
      params: { mnemonic, passphrase }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg);
    }

    const { isValid, wordCount, seedHex } = response.data;
    const badgeColor = isValid ? "#34d399" : "#ef4444";
    const statusText = isValid ? `✅ 助记词格式与 SHA-256 校验和完全合法 (${wordCount} 词)` : `❌ 校验失败：单词非法或校验和不匹配 (${wordCount} 词)`;

    return c.html(`
      <div class="result-box" style="border-color:${badgeColor};">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: BIP-39 校验核验</span>
          <span class="badge-time">⚡ ${duration} ms</span>
        </div>
        <div style="font-size:14px; font-weight:bold; color:${badgeColor}; margin:6px 0;">
          ${statusText}
        </div>
        ${isValid && seedHex ? `
          <div style="font-size:12px; color:var(--text-muted); margin-top:6px;">派生种子 (512-bit Seed):</div>
          <div class="result-value" style="font-size:11px; color:#38bdf8; word-break:break-all;">${seedHex}</div>
        ` : ''}
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>校验失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端 HMAC 全量生成 (由 HTMX 调用)
app.post("/api/backend/hmac/all", async (c) => {
  try {
    if (!hmacEngine) {
      throw new Error("hmac-generator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    const body = await c.req.parseBody();
    const text = (body.text || "").toString();
    const secretKey = (body.secretKey || "").toString();
    const format = (body.format || "hex").toString();

    const t0 = performance.now();
    const response = hmacEngine.dispatch({
      action: "hmac/all",
      requestId: `srv-${Date.now()}`,
      params: { text, secretKey, format }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg);
    }

    const d = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: HMAC 5 大算法矩阵</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生极速运算)</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px; margin:8px 0;">
          <div class="hash-row" style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:6px; font-size:13px; font-family:var(--font-mono);">
            <span style="color:#f97316; font-weight:bold; width:110px;">HMAC-MD5</span>
            <span id="srv-hmac-md5" style="color:#f1f5f9; word-break:break-all; flex:1;">${d.md5}</span>
            <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.2); cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-hmac-md5').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
          <div class="hash-row" style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:6px; font-size:13px; font-family:var(--font-mono);">
            <span style="color:#38bdf8; font-weight:bold; width:110px;">HMAC-SHA1</span>
            <span id="srv-hmac-sha1" style="color:#f1f5f9; word-break:break-all; flex:1;">${d.sha1}</span>
            <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.2); cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-hmac-sha1').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
          <div class="hash-row" style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:6px; font-size:13px; font-family:var(--font-mono);">
            <span style="color:#34d399; font-weight:bold; width:110px;">HMAC-SHA256</span>
            <span id="srv-hmac-sha256" style="color:#34d399; word-break:break-all; flex:1; font-weight:bold;">${d.sha256}</span>
            <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid #34d399; cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-hmac-sha256').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
          <div class="hash-row" style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:6px; font-size:13px; font-family:var(--font-mono);">
            <span style="color:#eab308; font-weight:bold; width:110px;">HMAC-SHA512</span>
            <span id="srv-hmac-sha512" style="color:#f1f5f9; word-break:break-all; flex:1; font-size:11px;">${d.sha512}</span>
            <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.2); cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-hmac-sha512').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
          <div class="hash-row" style="display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:6px; font-size:13px; font-family:var(--font-mono);">
            <span style="color:#a855f7; font-weight:bold; width:110px;">HMAC-SHA3-256</span>
            <span id="srv-hmac-sha3" style="color:#f1f5f9; word-break:break-all; flex:1;">${d.sha3_256}</span>
            <button type="button" class="btn-copy" style="margin-left:8px; padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.2); cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-hmac-sha3').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
        </div>
        <div class="token-meta" style="display:flex; gap:16px; font-size:12px; color:var(--text-muted);">
          <span>编码: <strong style="color:#fff;">${d.format.toUpperCase()}</strong></span>
          <span>密钥长度: <strong style="color:#38bdf8;">${secretKey.length} 字符</strong></span>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>计算失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端 HMAC 恒定时间校验 (由 HTMX 调用)
app.post("/api/backend/hmac/verify", async (c) => {
  try {
    if (!hmacEngine) {
      throw new Error("hmac-generator.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    const body = await c.req.parseBody();
    const text = (body.text || "").toString();
    const secretKey = (body.secretKey || "").toString();
    const hmac = (body.hmac || "").toString().trim();
    const algorithm = (body.algorithm || "sha256").toString();
    const format = (body.format || "hex").toString();

    const t0 = performance.now();
    const response = hmacEngine.dispatch({
      action: "hmac/verify",
      requestId: `srv-${Date.now()}`,
      params: { text, secretKey, hmac, algorithm, format }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg);
    }

    const { valid } = response.data;
    const badgeColor = valid ? "#34d399" : "#ef4444";
    const statusText = valid ? `✅ HMAC 恒定时间比对通过：消息认证完全有效 (${algorithm.toUpperCase()})` : `❌ HMAC 比对失败：消息被篡改或密钥错误 (${algorithm.toUpperCase()})`;

    return c.html(`
      <div class="result-box" style="border-color:${badgeColor};">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: 恒定时间校验</span>
          <span class="badge-time">⚡ ${duration} ms (防时序侧信道)</span>
        </div>
        <div style="font-size:14px; font-weight:bold; color:${badgeColor}; margin:4px 0;">
          ${statusText}
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>校验失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端 RSA 密钥对生成 (由 HTMX 调用)
app.post("/api/backend/rsa/generate", async (c) => {
  try {
    if (!rsaEngine) {
      throw new Error("rsa-key-pair.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    const body = await c.req.parseBody();
    const bits = parseInt(body.bits) || 2048;
    const format = (body.format || "pkcs8").toString();

    const t0 = performance.now();
    const response = rsaEngine.dispatch({
      action: "rsa/generate",
      requestId: `srv-${Date.now()}`,
      params: {
        bits,
        seed: Math.floor(Math.random() * 0xFFFFFFFF)
      }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg);
    }

    const d = response.data;
    const pubPem = format === "pkcs1" ? d.publicKeyPkcs1Pem : d.publicKeyPkcs8Pem;
    const privPem = format === "pkcs1" ? d.privateKeyPkcs1Pem : d.privateKeyPkcs8Pem;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: RSA-${d.bits} (${format.toUpperCase()})</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 原生极速生成)</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:12px; margin:10px 0;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <span style="font-size:12px; color:var(--text-muted);">公钥 (${format.toUpperCase()} Public Key):</span>
              <button type="button" class="btn-copy" style="padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid #34d399; cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-rsa-pub').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制公钥', 1500)">复制公钥</button>
            </div>
            <pre id="srv-rsa-pub" style="background:rgba(0,0,0,0.4); padding:10px; border-radius:6px; font-family:var(--font-mono); font-size:11px; color:#34d399; overflow-x:auto; margin:0; max-height:140px;">${pubPem}</pre>
          </div>
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <span style="font-size:12px; color:var(--text-muted);">私钥 (${format.toUpperCase()} Private Key):</span>
              <button type="button" class="btn-copy" style="padding:2px 8px; border-radius:4px; background:#1e293b; color:#fff; border:1px solid #f97316; cursor:pointer;" onclick="navigator.clipboard.writeText(document.getElementById('srv-rsa-priv').innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制私钥', 1500)">复制私钥</button>
            </div>
            <pre id="srv-rsa-priv" style="background:rgba(0,0,0,0.4); padding:10px; border-radius:6px; font-family:var(--font-mono); font-size:11px; color:#f97316; overflow-x:auto; margin:0; max-height:140px;">${privPem}</pre>
          </div>
        </div>
        <div class="token-meta" style="display:flex; gap:16px; font-size:12px; color:var(--text-muted);">
          <span>模长: <strong style="color:#fff;">${d.bits} bits</strong></span>
          <span>标准: <strong style="color:#38bdf8;">${format.toUpperCase()} PEM</strong></span>
          <span>算法: <strong style="color:#34d399;">RSA (PKCS#1 / PKCS#8)</strong></span>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>RSA 生成失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 后端密码强度评估 (由 HTMX 调用)
app.post("/api/backend/password/analyze", async (c) => {
  try {
    if (!passwordStrengthEngine) {
      throw new Error("password-strength.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    const body = await c.req.parseBody();
    const password = (body.password || "").toString();

    const t0 = performance.now();
    const response = passwordStrengthEngine.dispatch({
      action: "password/analyze",
      requestId: `srv-${Date.now()}`,
      params: { password }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg);
    }

    const d = response.data;
    const scoreColors = ["#ef4444", "#f97316", "#eab308", "#38bdf8", "#34d399"];
    const scorePercent = [15, 35, 60, 85, 100][d.score];
    const color = scoreColors[d.score];

    return c.html(`
      <div class="result-box" style="border-color:${color};">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: ${d.scoreText} (${d.score} / 4)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 原生极速分析)</span>
        </div>
        
        <!-- 强度进度条 -->
        <div style="background:rgba(255,255,255,0.1); height:8px; border-radius:4px; overflow:hidden; margin:10px 0;">
          <div style="background:${color}; width:${scorePercent}%; height:100%; transition:width 0.3s ease;"></div>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:10px; margin:10px 0; font-size:12px;">
          <div style="background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:6px;">
            <span style="color:var(--text-muted);">香农密码熵:</span> <strong style="color:${color};">${d.entropyBits.toFixed(1)} bits</strong>
          </div>
          <div style="background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:6px;">
            <span style="color:var(--text-muted);">在线暴力破解 (100次/秒):</span> <strong style="color:#fff;">${d.crackTimes.online100PerSec}</strong>
          </div>
          <div style="background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:6px;">
            <span style="color:var(--text-muted);">离线慢速哈希 (1万次/秒):</span> <strong style="color:#fff;">${d.crackTimes.offlineSlowHash10kPerSec}</strong>
          </div>
          <div style="background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:6px;">
            <span style="color:var(--text-muted);">离线 GPU 集群 (百亿次/秒):</span> <strong style="color:#fff;">${d.crackTimes.offlineFastHash10GPerSec}</strong>
          </div>
        </div>

        ${d.warning ? `
          <div style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); padding:8px 12px; border-radius:6px; font-size:12px; color:#fca5a5; margin-top:8px;">
            ⚠️ <strong>风险预警:</strong> ${d.warning}
          </div>
        ` : ''}

        <div style="margin-top:8px; font-size:12px; color:var(--text-muted);">
          💡 <strong>改进建议:</strong> ${d.suggestions.join(" | ")}
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>评估失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 PDF 内置签名示例 Base64
app.get("/api/backend/pdf/sample", async (c) => {
  try {
    if (!pdfSignatureEngine) {
      throw new Error("pdf-signature.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    const response = pdfSignatureEngine.dispatch({
      action: "pdf/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });

    if (response.code !== 0) {
      throw new Error(response.msg);
    }

    return c.json(response.data);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// API: 后端 PDF 签名检测与完整性解析 (由 HTMX 调用)
app.post("/api/backend/pdf/inspect", async (c) => {
  try {
    if (!pdfSignatureEngine) {
      throw new Error("pdf-signature.wasm 尚未就绪，请先编译并拷贝至 public/wasm/");
    }

    const body = await c.req.parseBody();
    let pdfBase64 = (body.pdfBase64 || "").toString().trim();

    // 如果上传了文件
    if (body.pdfFile && typeof body.pdfFile === "object" && body.pdfFile.arrayBuffer) {
      const buffer = await body.pdfFile.arrayBuffer();
      pdfBase64 = Buffer.from(buffer).toString("base64");
    }

    if (!pdfBase64) {
      throw new Error("请提供有效的 PDF 文件或 Base64 数据编码");
    }
    pdfBase64 = pdfBase64.replace(/ /g, "+");

    const t0 = performance.now();
    const response = pdfSignatureEngine.dispatch({
      action: "pdf/inspect",
      requestId: `srv-${Date.now()}`,
      params: { pdfBase64 }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      throw new Error(response.msg);
    }

    const d = response.data;
    const badgeColor = d.hasSignatures ? "#34d399" : "#f97316";

    return c.html(`
      <div class="result-box" style="border-color:${badgeColor};">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: PDF ${d.pdfVersion} (${d.fileSizeBytes} 字节)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 原生结构化解析)</span>
        </div>

        <div style="font-size:14px; font-weight:bold; color:${badgeColor}; margin:8px 0;">
          ${d.hasSignatures ? `✅ 成功检测到 ${d.signatureCount} 个数字签名 (/Type /Sig)` : `⚠️ 未在文档中发现任何数字签名 (/Type /Sig)`}
        </div>

        ${d.signatures.map((sig) => `
          <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.08); padding:12px; border-radius:8px; margin-top:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-weight:600; color:#38bdf8;">🔏 签名者: ${sig.signerName}</span>
              <span style="font-size:11px; padding:2px 8px; border-radius:4px; background:${sig.byteRangeValid ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)'}; color:${sig.byteRangeValid ? '#34d399' : '#f87171'};">
                ${sig.byteRangeValid ? '✅ ByteRange 完整性闭合' : '❌ ByteRange 校验越界'}
              </span>
            </div>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:6px; font-size:12px; color:var(--text-muted);">
              <div>签名标准 (SubFilter): <strong style="color:#fff;">${sig.subFilter}</strong></div>
              <div>加密引擎 (Filter): <strong style="color:#fff;">${sig.filter}</strong></div>
              <div>签名时间戳: <strong style="color:#fff;">${sig.signDate}</strong></div>
              <div>签名签署原因: <strong style="color:#fff;">${sig.reason}</strong></div>
              <div>签署物理位置: <strong style="color:#fff;">${sig.location}</strong></div>
              <div>签名数据长度: <strong style="color:#fff;">${sig.signatureLengthBytes} 字节 (PKCS#7)</strong></div>
            </div>
            <div style="margin-top:8px; font-size:11px; color:#94a3b8; font-family:var(--font-mono); background:rgba(0,0,0,0.2); padding:4px 8px; border-radius:4px;">
              ByteRange 校验细节: ${sig.byteRangeDetails}
            </div>
          </div>
        `).join("")}
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>PDF 签名检测失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: YAML 转 JSON (由 HTMX 调用)
app.post("/api/backend/yaml/to-json", async (c) => {
  const start = performance.now();
  try {
    const body = await c.req.parseBody();
    const yaml = (body.yaml || "").toString();
    const indent = parseInt(body.indent || "2", 10);

    if (!yamlToJsonEngine) {
      throw new Error("yaml-to-json WASM 引擎未就绪");
    }

    const response = yamlToJsonEngine.dispatch({
      action: "yaml/to-json",
      requestId: `srv-${Date.now()}`,
      params: {
        yaml,
        indent: isNaN(indent) ? 2 : indent
      }
    });

    const duration = (performance.now() - start).toFixed(2);

    if (response.code !== 0) {
      throw new Error(response.msg || "转换 YAML 失败");
    }

    const d = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: YAML ➜ JSON (缩进: ${d.indent} 空格)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>输入 YAML 大小: <strong>${d.sourceSizeBytes} 字节</strong></span>
          <span>转换 JSON 大小: <strong>${d.targetSizeBytes} 字节</strong></span>
        </div>
        <pre class="code-preview" style="max-height:280px; overflow-y:auto; background:rgba(0,0,0,0.4); padding:10px; border-radius:6px; font-size:12px; font-family:var(--font-mono); color:#38bdf8;"><code>${d.json.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>YAML 转 JSON 失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 YAML 示例模版
app.get("/api/backend/yaml/sample", async (c) => {
  try {
    if (!yamlToJsonEngine) {
      throw new Error("yaml-to-json WASM 引擎未就绪");
    }
    const response = yamlToJsonEngine.dispatch({
      action: "yaml/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.text(response.data.yaml);
  } catch (err) {
    return c.text("# 获取示例失败: " + err.message, 500);
  }
});

// API: YAML 转 TOML (由 HTMX 调用)
app.post("/api/backend/yaml/to-toml", async (c) => {
  const start = performance.now();
  try {
    const body = await c.req.parseBody();
    const yaml = (body.yaml || "").toString();
    const pretty = body.pretty !== "false";

    if (!yamlToTomlEngine) {
      throw new Error("yaml-to-toml WASM 引擎未就绪");
    }

    const response = yamlToTomlEngine.dispatch({
      action: "yaml/to-toml",
      requestId: `srv-${Date.now()}`,
      params: { yaml, pretty }
    });

    const duration = (performance.now() - start).toFixed(2);

    if (response.code !== 0) {
      throw new Error(response.msg || "转换 YAML 失败");
    }

    const d = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: YAML ➜ TOML (${d.lineCount} 行)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>输入 YAML 大小: <strong>${d.sourceSizeBytes} 字节</strong></span>
          <span>转换 TOML 大小: <strong>${d.targetSizeBytes} 字节</strong></span>
        </div>
        <pre class="code-preview" style="max-height:280px; overflow-y:auto; background:rgba(0,0,0,0.4); padding:10px; border-radius:6px; font-size:12px; font-family:var(--font-mono); color:#a7f3d0;"><code>${d.toml.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>YAML 转 TOML 失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 YAML 示例模版 (TOML)
app.get("/api/backend/yaml-to-toml/sample", async (c) => {
  try {
    if (!yamlToTomlEngine) {
      throw new Error("yaml-to-toml WASM 引擎未就绪");
    }
    const response = yamlToTomlEngine.dispatch({
      action: "yaml/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.text(response.data.yaml);
  } catch (err) {
    return c.text("# 获取示例失败: " + err.message, 500);
  }
});

// API: JSON 转 YAML (由 HTMX 调用)
app.post("/api/backend/json/to-yaml", async (c) => {
  const start = performance.now();
  try {
    const body = await c.req.parseBody();
    const json = (body.json || "").toString();

    if (!jsonToYamlEngine) {
      throw new Error("json-to-yaml WASM 引擎未就绪");
    }

    const response = jsonToYamlEngine.dispatch({
      action: "json/to-yaml",
      requestId: `srv-${Date.now()}`,
      params: { json }
    });

    const duration = (performance.now() - start).toFixed(2);

    if (response.code !== 0) {
      throw new Error(response.msg || "转换 JSON 失败");
    }

    const d = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: JSON ➜ YAML (${d.lineCount} 行)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>输入 JSON 大小: <strong>${d.sourceSizeBytes} 字节</strong></span>
          <span>转换 YAML 大小: <strong>${d.targetSizeBytes} 字节</strong></span>
        </div>
        <pre class="code-preview" style="max-height:280px; overflow-y:auto; background:rgba(0,0,0,0.4); padding:10px; border-radius:6px; font-size:12px; font-family:var(--font-mono); color:#fbbf24;"><code>${d.yaml.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>JSON 转 YAML 失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 JSON 示例模版
app.get("/api/backend/json-to-yaml/sample", async (c) => {
  try {
    if (!jsonToYamlEngine) {
      throw new Error("json-to-yaml WASM 引擎未就绪");
    }
    const response = jsonToYamlEngine.dispatch({
      action: "json/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.text(response.data.json);
  } catch (err) {
    return c.text("# 获取示例失败: " + err.message, 500);
  }
});

// API: JSON 转 TOML (由 HTMX 调用)
app.post("/api/backend/json/to-toml", async (c) => {
  const start = performance.now();
  try {
    const body = await c.req.parseBody();
    const json = (body.json || "").toString();
    const pretty = body.pretty !== "false";

    if (!jsonToTomlEngine) {
      throw new Error("json-to-toml WASM 引擎未就绪");
    }

    const response = jsonToTomlEngine.dispatch({
      action: "json/to-toml",
      requestId: `srv-${Date.now()}`,
      params: { json, pretty }
    });

    const duration = (performance.now() - start).toFixed(2);

    if (response.code !== 0) {
      throw new Error(response.msg || "转换 JSON 失败");
    }

    const d = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: JSON ➜ TOML (${d.lineCount} 行)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>输入 JSON 大小: <strong>${d.sourceSizeBytes} 字节</strong></span>
          <span>转换 TOML 大小: <strong>${d.targetSizeBytes} 字节</strong></span>
        </div>
        <pre class="code-preview" style="max-height:280px; overflow-y:auto; background:rgba(0,0,0,0.4); padding:10px; border-radius:6px; font-size:12px; font-family:var(--font-mono); color:#f472b6;"><code>${d.toml.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>JSON 转 TOML 失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 JSON 示例模版 (TOML)
app.get("/api/backend/json-to-toml/sample", async (c) => {
  try {
    if (!jsonToTomlEngine) {
      throw new Error("json-to-toml WASM 引擎未就绪");
    }
    const response = jsonToTomlEngine.dispatch({
      action: "json/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.text(response.data.json);
  } catch (err) {
    return c.text("# 获取示例失败: " + err.message, 500);
  }
});

// API: TOML 转 JSON (由 HTMX 调用)
app.post("/api/backend/toml/to-json", async (c) => {
  const start = performance.now();
  try {
    const body = await c.req.parseBody();
    const toml = (body.toml || "").toString();
    const indent = parseInt(body.indent || "2", 10);

    if (!tomlToJsonEngine) {
      throw new Error("toml-to-json WASM 引擎未就绪");
    }

    const response = tomlToJsonEngine.dispatch({
      action: "toml/to-json",
      requestId: `srv-${Date.now()}`,
      params: {
        toml,
        indent: isNaN(indent) ? 2 : indent
      }
    });

    const duration = (performance.now() - start).toFixed(2);

    if (response.code !== 0) {
      throw new Error(response.msg || "转换 TOML 失败");
    }

    const d = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: TOML ➜ JSON (缩进: ${d.indent} 空格)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>输入 TOML 大小: <strong>${d.sourceSizeBytes} 字节</strong></span>
          <span>转换 JSON 大小: <strong>${d.targetSizeBytes} 字节</strong></span>
        </div>
        <pre class="code-preview" style="max-height:280px; overflow-y:auto; background:rgba(0,0,0,0.4); padding:10px; border-radius:6px; font-size:12px; font-family:var(--font-mono); color:#38bdf8;"><code>${d.json.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>TOML 转 JSON 失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 TOML 示例模版
app.get("/api/backend/toml/sample", async (c) => {
  try {
    if (!tomlToJsonEngine) {
      throw new Error("toml-to-json WASM 引擎未就绪");
    }
    const response = tomlToJsonEngine.dispatch({
      action: "toml/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.text(response.data.toml);
  } catch (err) {
    return c.text("# 获取示例失败: " + err.message, 500);
  }
});

// API: TOML 转 YAML (由 HTMX 调用)
app.post("/api/backend/toml/to-yaml", async (c) => {
  const start = performance.now();
  try {
    const body = await c.req.parseBody();
    const toml = (body.toml || "").toString();

    if (!tomlToYamlEngine) {
      throw new Error("toml-to-yaml WASM 引擎未就绪");
    }

    const response = tomlToYamlEngine.dispatch({
      action: "toml/to-yaml",
      requestId: `srv-${Date.now()}`,
      params: { toml }
    });

    const duration = (performance.now() - start).toFixed(2);

    if (response.code !== 0) {
      throw new Error(response.msg || "转换 TOML 失败");
    }

    const d = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: TOML ➜ YAML (${d.lineCount} 行)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>输入 TOML 大小: <strong>${d.sourceSizeBytes} 字节</strong></span>
          <span>转换 YAML 大小: <strong>${d.targetSizeBytes} 字节</strong></span>
        </div>
        <pre class="code-preview" style="max-height:280px; overflow-y:auto; background:rgba(0,0,0,0.4); padding:10px; border-radius:6px; font-size:12px; font-family:var(--font-mono); color:#f59e0b;"><code>${d.yaml.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>TOML 转 YAML 失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 TOML 示例模版 (YAML)
app.get("/api/backend/toml-to-yaml/sample", async (c) => {
  try {
    if (!tomlToYamlEngine) {
      throw new Error("toml-to-yaml WASM 引擎未就绪");
    }
    const response = tomlToYamlEngine.dispatch({
      action: "toml/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.text(response.data.toml);
  } catch (err) {
    return c.text("# 获取示例失败: " + err.message, 500);
  }
});

// API: HTMX 提交 XML 转 JSON
app.post("/api/backend/xml/to-json", async (c) => {
  try {
    const body = await c.req.parseBody();
    const xml = (body.xml || "").toString();
    const indent = parseInt(body.indent || "2", 10);

    if (!xml.trim()) {
      return c.html(`
        <div class="result-box error">
          <strong>转换失败:</strong> 输入的 XML 内容不能为空
        </div>
      `, 400);
    }

    if (!xmlToJsonEngine) {
      throw new Error("xml-to-json WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = xmlToJsonEngine.dispatch({
      action: "xml/to-json",
      requestId: `srv-${Date.now()}`,
      params: { xml, indent }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>XML 解析转换失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: XML ➜ JSON (缩进: ${d.indent} 空格)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>输入 XML 大小: <strong>${d.sourceSizeBytes} 字节</strong></span>
          <span>转换 JSON 大小: <strong>${d.targetSizeBytes} 字节</strong></span>
        </div>
        <pre class="code-preview" style="max-height:280px; overflow-y:auto; background:rgba(0,0,0,0.4); padding:10px; border-radius:6px; font-size:12px; font-family:var(--font-mono); color:#38bdf8;"><code>${d.json.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>XML 转 JSON 失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 XML 示例模版
app.get("/api/backend/xml-to-json/sample", async (c) => {
  try {
    if (!xmlToJsonEngine) {
      throw new Error("xml-to-json WASM 引擎未就绪");
    }
    const response = xmlToJsonEngine.dispatch({
      action: "xml/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.text(response.data.xml);
  } catch (err) {
    return c.text("<!-- 获取示例失败: " + err.message + " -->", 500);
  }
});

// API: HTMX 提交 JSON 转 XML
app.post("/api/backend/json/to-xml", async (c) => {
  try {
    const body = await c.req.parseBody();
    const json = (body.json || "").toString();
    const rootName = (body.rootName || "").toString().trim() || null;
    const indent = parseInt(body.indent || "2", 10);

    if (!json.trim()) {
      return c.html(`
        <div class="result-box error">
          <strong>转换失败:</strong> 输入的 JSON 内容不能为空
        </div>
      `, 400);
    }

    if (!jsonToXmlEngine) {
      throw new Error("json-to-xml WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = jsonToXmlEngine.dispatch({
      action: "json/to-xml",
      requestId: `srv-${Date.now()}`,
      params: { json, rootName, indent }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>JSON 转换 XML 失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: JSON ➜ XML (缩进: ${d.indent} 空格)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>输入 JSON 大小: <strong>${d.sourceSizeBytes} 字节</strong></span>
          <span>转换 XML 大小: <strong>${d.targetSizeBytes} 字节</strong></span>
        </div>
        <pre class="code-preview" style="max-height:280px; overflow-y:auto; background:rgba(0,0,0,0.4); padding:10px; border-radius:6px; font-size:12px; font-family:var(--font-mono); color:#f59e0b;"><code>${d.xml.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>JSON 转 XML 失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 JSON 示例模版 (XML)
app.get("/api/backend/json-to-xml/sample", async (c) => {
  try {
    if (!jsonToXmlEngine) {
      throw new Error("json-to-xml WASM 引擎未就绪");
    }
    const response = jsonToXmlEngine.dispatch({
      action: "json/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.text(response.data.json);
  } catch (err) {
    return c.text("{}", 500);
  }
});

// API: HTMX 提交 JSON 转 CSV
app.post("/api/backend/json/to-csv", async (c) => {
  try {
    const body = await c.req.parseBody();
    const json = (body.json || "").toString();
    const delimiter = (body.delimiter || ",").toString();
    const includeHeaders = body.includeHeaders !== "false";
    const flatten = body.flatten !== "false";

    if (!json.trim()) {
      return c.html(`
        <div class="result-box error">
          <strong>转换失败:</strong> 输入的 JSON 内容不能为空
        </div>
      `, 400);
    }

    if (!jsonToCsvEngine) {
      throw new Error("json-to-csv WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = jsonToCsvEngine.dispatch({
      action: "json/to-csv",
      requestId: `srv-${Date.now()}`,
      params: { json, delimiter, includeHeaders, flatten }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>JSON 转换 CSV 失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: JSON ➜ CSV (${d.rowCount} 行, 分隔符: '${d.delimiter}')</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>输入 JSON 大小: <strong>${d.sourceSizeBytes} 字节</strong></span>
          <span>转换 CSV 大小: <strong>${d.targetSizeBytes} 字节</strong></span>
        </div>
        <pre class="code-preview" style="max-height:280px; overflow-y:auto; background:rgba(0,0,0,0.4); padding:10px; border-radius:6px; font-size:12px; font-family:var(--font-mono); color:#38bdf8;"><code>${d.csv.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>JSON 转 CSV 失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 JSON 示例模版 (CSV)
app.get("/api/backend/json-to-csv/sample", async (c) => {
  try {
    if (!jsonToCsvEngine) {
      throw new Error("json-to-csv WASM 引擎未就绪");
    }
    const response = jsonToCsvEngine.dispatch({
      action: "json/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.text(response.data.json);
  } catch (err) {
    return c.text("[]", 500);
  }
});

// API: HTMX 提交 Base64 编码
app.post("/api/backend/base64/encode", async (c) => {
  try {
    const body = await c.req.parseBody();
    const text = (body.text || "").toString();
    const urlSafe = body.urlSafe === "true";
    const padding = body.padding !== "false";

    if (!text) {
      return c.html(`
        <div class="result-box error">
          <strong>编码失败:</strong> 输入的待编码文本不能为空
        </div>
      `, 400);
    }

    if (!base64StringEngine) {
      throw new Error("base64-string WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = base64StringEngine.dispatch({
      action: "base64/encode",
      requestId: `srv-${Date.now()}`,
      params: { text, urlSafe, padding }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>Base64 编码失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: Base64 编码 (${d.urlSafe ? "URL-Safe" : "Standard"})</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>输入文本大小: <strong>${d.sourceSizeBytes} 字节</strong></span>
          <span>Base64 字符串长度: <strong>${d.targetSizeBytes} 字符</strong></span>
        </div>
        <textarea readonly style="width:100%; padding:10px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:6px; font-family:var(--font-mono); font-size:12px; color:#38bdf8; box-sizing:border-box; resize:vertical;" rows="4">${d.base64}</textarea>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>Base64 编码失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: HTMX 提交 Base64 解码
app.post("/api/backend/base64/decode", async (c) => {
  try {
    const body = await c.req.parseBody();
    const base64 = (body.base64 || "").toString();
    const urlSafe = body.urlSafe === "true";

    if (!base64.trim()) {
      return c.html(`
        <div class="result-box error">
          <strong>解码失败:</strong> 输入的 Base64 内容不能为空
        </div>
      `, 400);
    }

    if (!base64StringEngine) {
      throw new Error("base64-string WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = base64StringEngine.dispatch({
      action: "base64/decode",
      requestId: `srv-${Date.now()}`,
      params: { base64, urlSafe }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>Base64 解码失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: Base64 解码成功</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>输入 Base64 长度: <strong>${d.sourceSizeBytes} 字符</strong></span>
          <span>解码文本大小: <strong>${d.targetSizeBytes} 字节</strong></span>
        </div>
        <textarea readonly style="width:100%; padding:10px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:6px; font-family:var(--font-mono); font-size:12px; color:#34d399; box-sizing:border-box; resize:vertical;" rows="4">${d.text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</textarea>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>Base64 解码失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 Base64 示例
app.get("/api/backend/base64/sample", async (c) => {
  try {
    if (!base64StringEngine) {
      throw new Error("base64-string WASM 引擎未就绪");
    }
    const response = base64StringEngine.dispatch({
      action: "base64/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.json(response.data);
  } catch (err) {
    return c.json({ text: "Hello WasmForge!", base64: "SGVsbG8gV2FzbUZvcmdlIQ==" }, 500);
  }
});

// API: HTMX 提交 Base64 转 Data URL
app.post("/api/backend/base64-file/to-data-url", async (c) => {
  try {
    const body = await c.req.parseBody();
    const base64 = (body.base64 || "").toString();
    const fileName = (body.fileName || "").toString();
    const mimeType = (body.mimeType || "").toString();

    if (!base64.trim()) {
      return c.html(`
        <div class="result-box error">
          <strong>转换失败:</strong> 输入的 Base64 文件内容不能为空
        </div>
      `, 400);
    }

    if (!base64FileEngine) {
      throw new Error("base64-file WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = base64FileEngine.dispatch({
      action: "file/to-data-url",
      requestId: `srv-${Date.now()}`,
      params: { base64, fileName: fileName || undefined, mimeType: mimeType || undefined }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>Data URL 转换失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    const isImage = d.mimeType.startsWith("image/");
    const previewHtml = isImage
      ? `<div style="margin-top:10px; display:flex; align-items:center; gap:12px;">
           <span style="font-size:12px; color:var(--text-muted);">图像预览:</span>
           <img src="${d.dataUrl}" style="max-height:80px; max-width:120px; object-fit:contain; border-radius:6px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); padding:4px;" alt="preview" />
         </div>`
      : "";

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: Data URL 封装成功</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>文件名: <strong style="color:var(--text-primary);">${d.fileName}</strong></span>
          <span>MIME 类型: <strong style="color:#38bdf8;">${d.mimeType}</strong></span>
          <span>解码文件大小: <strong>${d.fileSizeBytes} 字节</strong></span>
          <span>Base64 字符数: <strong>${d.base64SizeBytes}</strong></span>
        </div>
        <textarea readonly style="width:100%; padding:10px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:6px; font-family:var(--font-mono); font-size:12px; color:#38bdf8; box-sizing:border-box; resize:vertical;" rows="4">${d.dataUrl}</textarea>
        ${previewHtml}
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>Data URL 转换失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: HTMX 提交 Data URL 解析
app.post("/api/backend/base64-file/from-data-url", async (c) => {
  try {
    const body = await c.req.parseBody();
    const dataUrl = (body.dataUrl || "").toString();

    if (!dataUrl.trim()) {
      return c.html(`
        <div class="result-box error">
          <strong>解析失败:</strong> 输入的 Data URL 不能为空
        </div>
      `, 400);
    }

    if (!base64FileEngine) {
      throw new Error("base64-file WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = base64FileEngine.dispatch({
      action: "file/from-data-url",
      requestId: `srv-${Date.now()}`,
      params: { dataUrl }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>Data URL 解析失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    const isImage = d.mimeType.startsWith("image/");
    const previewHtml = isImage
      ? `<div style="margin-top:10px; display:flex; align-items:center; gap:12px;">
           <span style="font-size:12px; color:var(--text-muted);">图像预览:</span>
           <img src="${dataUrl}" style="max-height:80px; max-width:120px; object-fit:contain; border-radius:6px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); padding:4px;" alt="preview" />
         </div>`
      : "";

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: Data URL 解析成功</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:8px; font-size:12px; color:var(--text-muted);">
          <span>提取 MIME 类型: <strong style="color:#38bdf8;">${d.mimeType}</strong></span>
          <span>二进制实体大小: <strong>${d.fileSizeBytes} 字节</strong></span>
          <span>Base64 纯数据长度: <strong>${d.base64.length} 字符</strong></span>
        </div>
        <textarea readonly style="width:100%; padding:10px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:6px; font-family:var(--font-mono); font-size:12px; color:#34d399; box-sizing:border-box; resize:vertical;" rows="4">${d.base64}</textarea>
        ${previewHtml}
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>Data URL 解析失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 Base64 File 示例
app.get("/api/backend/base64-file/sample", async (c) => {
  try {
    if (!base64FileEngine) {
      throw new Error("base64-file WASM 引擎未就绪");
    }
    const response = base64FileEngine.dispatch({
      action: "file/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.json(response.data);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// API: HTMX 提交颜色转换
app.post("/api/backend/color/convert", async (c) => {
  try {
    const body = await c.req.parseBody();
    const input = (body.color || body.input || "").toString().trim();

    if (!input) {
      return c.html(`
        <div class="result-box error">
          <strong>转换失败:</strong> 输入的颜色值不能为空
        </div>
      `, 400);
    }

    if (!colorConverterEngine) {
      throw new Error("color-converter WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = colorConverterEngine.dispatch({
      action: "color/convert",
      requestId: `srv-${Date.now()}`,
      params: { input }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>颜色转换失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    const textColor = d.is_light ? "#0f172a" : "#ffffff";
    const aaWhite = d.contrast_white >= 4.5 ? "✅ AA" : "❌";
    const aaBlack = d.contrast_black >= 4.5 ? "✅ AA" : "❌";

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: 全色彩空间转换与可访问性分析</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>

        <!-- 视觉展示色块 -->
        <div style="display:flex; gap:16px; align-items:center; margin-bottom:12px; background:rgba(0,0,0,0.3); padding:12px; border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
          <div style="width:72px; height:72px; border-radius:8px; background-color:${d.hex}; box-shadow:0 4px 12px rgba(0,0,0,0.4); border:2px solid rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; color:${textColor}; font-weight:bold; font-size:12px;">
            ${d.hex}
          </div>
          <div style="flex:1; font-size:12px; color:var(--text-muted); display:flex; flex-direction:column; gap:4px;">
            <div><strong>相对亮度 (Luminance):</strong> <span style="color:#38bdf8;">${d.luminance}</span> (${d.is_light ? "亮色基底" : "暗色基底"})</div>
            <div><strong>对白色对比度:</strong> <strong>${d.contrast_white}:1</strong> (${aaWhite})</div>
            <div><strong>对黑色对比度:</strong> <strong>${d.contrast_black}:1</strong> (${aaBlack})</div>
          </div>
        </div>

        <!-- 各格式芯片网格 -->
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:10px; font-family:var(--font-mono); font-size:12px;">
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">HEX</div>
            <strong style="color:#38bdf8;">${d.hex}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">HEX8 (含 Alpha)</div>
            <strong style="color:#38bdf8;">${d.hex8}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">RGB</div>
            <strong style="color:#34d399;">${d.rgb}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">HSL</div>
            <strong style="color:#a78bfa;">${d.hsl}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">HSV</div>
            <strong style="color:#fbbf24;">${d.hsv}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">CMYK</div>
            <strong style="color:#f43f5e;">${d.cmyk}</strong>
          </div>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>颜色转换失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 Color 示例调色板
app.get("/api/backend/color/sample", async (c) => {
  try {
    if (!colorConverterEngine) {
      throw new Error("color-converter WASM 引擎未就绪");
    }
    const response = colorConverterEngine.dispatch({
      action: "color/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.json(response.data);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// API: HTMX 提交命名风格转换
app.post("/api/backend/case/convert", async (c) => {
  try {
    const body = await c.req.parseBody();
    const input = (body.text || body.input || "").toString().trim();

    if (!input) {
      return c.html(`
        <div class="result-box error">
          <strong>转换失败:</strong> 输入的待转换文本不能为空
        </div>
      `, 400);
    }

    if (!caseConverterEngine) {
      throw new Error("case-converter WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = caseConverterEngine.dispatch({
      action: "case/convert",
      requestId: `srv-${Date.now()}`,
      params: { input }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>转换失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    const cases = [
      { label: "camelCase", val: d.camelCase, desc: "小驼峰 (JavaScript/TypeScript 变量与方法)" },
      { label: "PascalCase", val: d.pascalCase, desc: "大驼峰 (类名/组件名/类型定义)" },
      { label: "snake_case", val: d.snakeCase, desc: "蛇形下划线 (Python/Rust/数据库字段)" },
      { label: "SCREAMING_SNAKE_CASE", val: d.screamingSnakeCase, desc: "常量大写蛇形 (常量/宏/环境变量)" },
      { label: "kebab-case", val: d.kebabCase, desc: "短横线/烤肉串 (CSS 类名/URL 短链/NPM 包名)" },
      { label: "SCREAMING-KEBAB-CASE", val: d.screamingKebabCase, desc: "大写短横线 (COBOL 规范)" },
      { label: "Title Case", val: d.titleCase, desc: "首字母大写标题 (文章与标题)" },
      { label: "Sentence case", val: d.sentenceCase, desc: "自然句首大写 (句子与描述)" },
      { label: "lower case", val: d.lowerCase, desc: "纯小写空格分隔 (分词/检索)" },
      { label: "UPPER CASE", val: d.upperCase, desc: "纯大写空格分隔 (醒目标题)" },
      { label: "dot.case", val: d.dotCase, desc: "点号连接 (属性链/国际化键值)" },
      { label: "path/case", val: d.pathCase, desc: "文件路径连接 (URL 路径/模块路由)" },
    ];

    const rowsHtml = cases.map(c => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:8px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.06); font-family:var(--font-mono); font-size:12px;">
        <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-right:12px;">
          <span style="color:var(--text-muted); font-size:11px; display:inline-block; width:170px;">${c.label}:</span>
          <strong style="color:#38bdf8;">${c.val}</strong>
        </div>
        <button type="button" onclick="navigator.clipboard.writeText('${c.val.replace(/'/g, "\\'")}')" style="padding:2px 8px; font-size:10px; background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3); border-radius:4px; cursor:pointer;">复制</button>
      </div>
    `).join("");

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: 多命名风格全量转换成功</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">
          识别词法 Token (${d.words.length} 个): <span style="color:#34d399;">[${d.words.join(", ")}]</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          ${rowsHtml}
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>命名转换失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 Case 示例
app.get("/api/backend/case/sample", async (c) => {
  try {
    if (!caseConverterEngine) {
      throw new Error("case-converter WASM 引擎未就绪");
    }
    const response = caseConverterEngine.dispatch({
      action: "case/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.json(response.data);
  } catch (err) {
    return c.json({ sample: "wasmForge_universalEnvelope-protocol v2" }, 500);
  }
});

// API: HTMX 提交日期时间转换
app.post("/api/backend/datetime/convert", async (c) => {
  try {
    let input = "";
    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      input = (json.input || json.value || json.date || json.timestamp || json.datetime_input || "").toString().trim();
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      input = (body.input || body.value || body.date || body.timestamp || body.datetime_input || "").toString().trim();
    }

    if (!input) {
      if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
        return c.json({ code: 400, msg: "输入的日期时间或时间戳不能为空", data: null }, 400);
      }
      return c.html(`
        <div class="result-box error">
          <strong>转换失败:</strong> 输入的日期时间或时间戳不能为空
        </div>
      `, 400);
    }

    if (!dateTimeConverterEngine) {
      throw new Error("date-time-converter WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = dateTimeConverterEngine.dispatch({
      action: "datetime/convert",
      requestId: `srv-${Date.now()}`,
      params: { input }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>日期时间转换失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: 时间戳与跨时区投影分析</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:12px; font-size:12px; color:var(--text-muted);">
          <span>星期: <strong style="color:#38bdf8;">${d.dayOfWeek}</strong></span>
          <span>年中第几天: <strong>${d.dayOfYear} 天</strong></span>
          <span>ISO 周数: <strong>第 ${d.weekNumber} 周</strong></span>
          <span>闰年标记: <strong>${d.isLeapYear ? "是 (闰年 366天)" : "否 (平年 365天)"}</strong></span>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:10px; font-family:var(--font-mono); font-size:12px;">
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">Unix 秒级时间戳 (10位)</div>
            <strong style="color:#38bdf8;">${d.unixSeconds}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">Unix 毫秒时间戳 (13位)</div>
            <strong style="color:#38bdf8;">${d.unixMilliseconds}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">ISO 8601 (RFC 3339)</div>
            <strong style="color:#34d399;">${d.iso8601}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">RFC 2822</div>
            <strong style="color:#34d399;">${d.rfc2822}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">UTC 世界标准时间</div>
            <strong style="color:#a78bfa;">${d.utc}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">CST 中国标准时间 (UTC+8)</div>
            <strong style="color:#fbbf24;">${d.cst}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">JST 日本标准时间 (UTC+9)</div>
            <strong style="color:#f43f5e;">${d.jst}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">EST 北美东部时间 (UTC-5)</div>
            <strong style="color:#e2e8f0;">${d.est}</strong>
          </div>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>转换失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: HTMX 提交进制转换
app.post("/api/backend/base/convert", async (c) => {
  try {
    let input = "";
    let fromBase = null;
    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      input = (json.input || json.number || json.val || "").toString().trim();
      if (json.fromBase || json.from_base) fromBase = parseInt(json.fromBase || json.from_base, 10);
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      input = (body.input || body.number || body.val || "").toString().trim();
      if (body.fromBase || body.from_base) fromBase = parseInt(body.fromBase || body.from_base, 10);
    }

    if (!input) {
      if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
        return c.json({ code: 400, msg: "输入的整数不能为空", data: null }, 400);
      }
      return c.html(`
        <div class="result-box error">
          <strong>转换失败:</strong> 输入的数值不能为空
        </div>
      `, 400);
    }

    if (!integerBaseConverterEngine) {
      throw new Error("integer-base-converter WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = integerBaseConverterEngine.dispatch({
      action: "base/convert",
      requestId: `srv-${Date.now()}`,
      params: { input, fromBase: isNaN(fromBase) ? null : fromBase }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>进制转换失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: 任意进制转换与位分析成功</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>

        <div style="font-size:12px; color:var(--text-muted); margin-bottom:10px;">
          识别原进制: <strong style="color:#38bdf8;">Base ${d.detectedBase}</strong> |
          符号: <strong>${d.isNegative ? "负数 (-)" : "非负数 (+)"}</strong> |
          位宽 (Bit Length): <strong style="color:#34d399;">${d.bitLength} bits</strong> |
          有效字节: <strong>${d.byteLength} bytes</strong>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:8px; font-family:var(--font-mono); font-size:12px;">
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">十进制 (Decimal / Base 10)</div>
            <strong style="color:#38bdf8;">${d.decimal}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">二进制 (Binary / Base 2)</div>
            <strong style="color:#34d399; word-break:break-all;">${d.binary}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">八进制 (Octal / Base 8)</div>
            <strong style="color:#fbbf24;">${d.octal}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">十六进制 (Hexadecimal / Base 16)</div>
            <strong style="color:#f43f5e;">0x${d.hexUpper}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">Base 36 (0-9, a-z)</div>
            <strong style="color:#a78bfa;">${d.base36}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">大端序字节序列 (Big-Endian Hex)</div>
            <strong style="color:#e2e8f0;">${d.beBytesHex}</strong>
          </div>
        </div>

        ${d.twocompl8bit || d.twocompl16bit || d.twocompl32bit ? `
          <div style="margin-top:10px; padding:8px 10px; background:rgba(255,255,255,0.02); border-radius:6px; border:1px dashed rgba(255,255,255,0.1); font-size:11px; font-family:var(--font-mono);">
            <div style="color:var(--text-muted); margin-bottom:4px;">整型补码投影 (Two's Complement):</div>
            <div style="display:flex; flex-wrap:wrap; gap:12px;">
              ${d.twocompl8bit ? `<span>8-bit: <strong style="color:#38bdf8;">${d.twocompl8bit}</strong></span>` : ""}
              ${d.twocompl16bit ? `<span>16-bit: <strong style="color:#34d399;">${d.twocompl16bit}</strong></span>` : ""}
              ${d.twocompl32bit ? `<span>32-bit: <strong style="color:#fbbf24;">${d.twocompl32bit}</strong></span>` : ""}
              ${d.twocompl64bit ? `<span>64-bit: <strong style="color:#f43f5e;">${d.twocompl64bit}</strong></span>` : ""}
            </div>
          </div>
        ` : ""}
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>进制转换失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: HTMX 提交罗马数字转换
app.post("/api/backend/roman/convert", async (c) => {
  try {
    let input = "";
    let mode = "auto";
    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      input = (json.input || json.val || json.text || "").toString().trim();
      if (json.mode) mode = json.mode;
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      input = (body.input || body.val || body.text || "").toString().trim();
      if (body.mode) mode = body.mode;
    }

    if (!input) {
      if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
        return c.json({ code: 400, msg: "输入不能为空", data: null }, 400);
      }
      return c.html(`
        <div class="result-box error">
          <strong>转换失败:</strong> 输入不能为空
        </div>
      `, 400);
    }

    if (!romanNumeralConverterEngine) {
      throw new Error("roman-numeral-converter WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = romanNumeralConverterEngine.dispatch({
      action: "roman/convert",
      requestId: `srv-${Date.now()}`,
      params: { input, mode }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>罗马数字转换失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: 罗马数字与阿拉伯数字双向互转成功</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:12px; font-size:12px; color:var(--text-muted);">
          <span>识别转换模式: <strong style="color:#38bdf8;">${d.mode === "toRoman" ? "阿拉伯数字 ➔ 罗马数字" : "罗马数字 ➔ 阿拉伯数字"}</strong></span>
          <span>原输入: <strong>${d.input}</strong></span>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:10px; font-family:var(--font-mono); font-size:12px;">
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">阿拉伯数字 (Arabic)</div>
            <strong style="color:#38bdf8; font-size:15px;">${d.arabic}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">罗马数字 (Roman)</div>
            <strong style="color:#34d399; font-size:15px; letter-spacing:1px;">${d.roman}</strong>
          </div>
        </div>

        <div style="margin-top:10px; padding:8px 10px; background:rgba(255,255,255,0.02); border-radius:6px; border:1px dashed rgba(255,255,255,0.1); font-size:11px; font-family:var(--font-mono);">
          <div style="color:var(--text-muted); margin-bottom:4px;">符号分解公式: <span style="color:#fbbf24;">${d.formula}</span></div>
          <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:6px;">
            ${d.breakdown.map(item => `
              <span style="background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px; border:1px solid rgba(255,255,255,0.08);">
                <strong>${item.symbol}</strong> = ${item.desc}
              </span>
            `).join("")}
          </div>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>罗马数字转换失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: HTMX 提交文本与二进制互转
app.post("/api/backend/text-binary/convert", async (c) => {
  try {
    let input = "";
    let mode = "auto";
    let delimiter = "space";
    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      input = (json.input || json.text || json.binary || "").toString();
      if (json.mode) mode = json.mode;
      if (json.delimiter) delimiter = json.delimiter;
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      input = (body.input || body.text || body.binary || "").toString();
      if (body.mode) mode = body.mode;
      if (body.delimiter) delimiter = body.delimiter;
    }

    if (!input) {
      if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
        return c.json({ code: 400, msg: "输入内容不能为空", data: null }, 400);
      }
      return c.html(`
        <div class="result-box error">
          <strong>转换失败:</strong> 输入内容不能为空
        </div>
      `, 400);
    }

    if (!textToBinaryEngine) {
      throw new Error("text-to-binary WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = textToBinaryEngine.dispatch({
      action: "binary/convert",
      requestId: `srv-${Date.now()}`,
      params: { input, mode, delimiter }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>二进制转换失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: 文本与 8位二进制流转换成功</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:12px; font-size:12px; color:var(--text-muted);">
          <span>转换模式: <strong style="color:#38bdf8;">${d.mode === "encode" ? "文本 ➔ 二进制 (Encode)" : "二进制 ➔ 文本 (Decode)"}</strong></span>
          <span>字符数: <strong>${d.totalChars}</strong></span>
          <span>字节数: <strong>${d.totalBytes} B</strong></span>
          <span>0 比特: <strong>${d.totalZeros}</strong> | 1 比特: <strong>${d.totalOnes}</strong> (密度: <strong style="color:#34d399;">${d.oneDensityPct}%</strong>)</span>
        </div>

        <div style="margin-bottom:10px;">
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">解码文本 (UTF-8 Plain Text):</div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); font-family:var(--font-mono); font-size:13px; color:#38bdf8; word-break:break-all;">
            ${d.text}
          </div>
        </div>

        <div>
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">二进制数据流 (${d.delimiter} 分隔):</div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); font-family:var(--font-mono); font-size:12px; color:#34d399; word-break:break-all; max-height:160px; overflow-y:auto;">
            ${d.binary}
          </div>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>转换失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: HTMX 提交 Unicode 互转
app.post("/api/backend/unicode/convert", async (c) => {
  try {
    let input = "";
    let mode = "auto";
    let escapeAll = false;
    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      input = (json.input || json.text || json.str || "").toString();
      if (json.mode) mode = json.mode;
      if (json.escapeAll !== undefined) escapeAll = Boolean(json.escapeAll);
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      input = (body.input || body.text || body.str || "").toString();
      if (body.mode) mode = body.mode;
      if (body.escape_all !== undefined || body.escapeAll !== undefined) {
        escapeAll = (body.escape_all === "true" || body.escapeAll === "true" || body.escape_all === "on");
      }
    }

    if (!input) {
      if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
        return c.json({ code: 400, msg: "输入内容不能为空", data: null }, 400);
      }
      return c.html(`
        <div class="result-box error">
          <strong>转换失败:</strong> 输入内容不能为空
        </div>
      `, 400);
    }

    if (!textToUnicodeEngine) {
      throw new Error("text-to-unicode WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = textToUnicodeEngine.dispatch({
      action: "unicode/convert",
      requestId: `srv-${Date.now()}`,
      params: { input, mode, escapeAll }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>Unicode 转换失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: Unicode 转义与逆转处理成功</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:12px; font-size:12px; color:var(--text-muted);">
          <span>模式: <strong style="color:#38bdf8;">${d.mode === "encode" ? "文本 ➔ 转义序列 (Encode)" : "转义序列 ➔ 还原文本 (Decode)"}</strong></span>
          <span>总字符数: <strong>${d.totalChars}</strong></span>
          <span>转义字符数: <strong style="color:#34d399;">${d.escapedChars}</strong></span>
        </div>

        <div style="margin-bottom:10px;">
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">还原明文文本 (Decoded Plain Text):</div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); font-family:var(--font-mono); font-size:13px; color:#38bdf8; word-break:break-all;">
            ${d.text}
          </div>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:10px; font-family:var(--font-mono); font-size:12px;">
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">标准 16-bit 转义 (\\uXXXX)</div>
            <strong style="color:#34d399; word-break:break-all;">${d.standardEscape}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">ES6 变宽转义 (\\u{XXXX})</div>
            <strong style="color:#a78bfa; word-break:break-all;">${d.es6Escape}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">HTML 16进制实体 (&#xXXXX;)</div>
            <strong style="color:#fbbf24; word-break:break-all;">${d.htmlHexEntity}</strong>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:2px;">HTML 10进制实体 (&#DDDD;)</div>
            <strong style="color:#f43f5e; word-break:break-all;">${d.htmlDecEntity}</strong>
          </div>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>转换失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: HTMX 提交 Markdown 渲染
app.post("/api/backend/markdown/render", async (c) => {
  try {
    let markdown = "";
    let enableTables = true;
    let enableTasklists = true;
    let enableStrikethrough = true;
    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      markdown = (json.markdown || json.text || json.md || "").toString();
      if (json.enableTables !== undefined) enableTables = Boolean(json.enableTables);
      if (json.enableTasklists !== undefined) enableTasklists = Boolean(json.enableTasklists);
      if (json.enableStrikethrough !== undefined) enableStrikethrough = Boolean(json.enableStrikethrough);
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      markdown = (body.markdown || body.text || body.md || "").toString();
      if (body.enable_tables !== undefined) enableTables = body.enable_tables === "true" || body.enable_tables === "on";
      if (body.enable_tasklists !== undefined) enableTasklists = body.enable_tasklists === "true" || body.enable_tasklists === "on";
      if (body.enable_strikethrough !== undefined) enableStrikethrough = body.enable_strikethrough === "true" || body.enable_strikethrough === "on";
    }

    if (!markdown) {
      if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
        return c.json({ code: 400, msg: "Markdown 内容不能为空", data: null }, 400);
      }
      return c.html(`
        <div class="result-box error">
          <strong>渲染失败:</strong> Markdown 内容不能为空
        </div>
      `, 400);
    }

    if (!markdownToHtmlEngine) {
      throw new Error("markdown-to-html WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = markdownToHtmlEngine.dispatch({
      action: "markdown/render",
      requestId: `srv-${Date.now()}`,
      params: {
        markdown,
        enableTables,
        enableTasklists,
        enableStrikethrough,
        enableFootnotes: true,
        enableSmartPunctuation: true
      }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>Markdown 渲染失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: pulldown-cmark 极速渲染成功</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:12px; font-size:12px; color:var(--text-muted);">
          <span>标题数: <strong>${d.stats.headingsCount}</strong></span>
          <span>链接数: <strong>${d.stats.linksCount}</strong></span>
          <span>代码块: <strong>${d.stats.codeBlocksCount}</strong></span>
          <span>源大小: <strong>${d.stats.inputBytes} B</strong> ➔ HTML: <strong>${d.stats.outputBytes} B</strong></span>
        </div>

        <div style="margin-bottom:12px;">
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">HTML 实时渲染预览 (Rich Preview):</div>
          <div style="background:#0f172a; padding:12px 16px; border-radius:6px; border:1px solid rgba(255,255,255,0.1); color:#f8fafc; font-size:13px; line-height:1.6; max-height:220px; overflow-y:auto;">
            ${d.html}
          </div>
        </div>

        <div>
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">生成原生 HTML 代码:</div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); font-family:var(--font-mono); font-size:11px; color:#34d399; word-break:break-all; max-height:120px; overflow-y:auto; white-space:pre-wrap;">
            ${d.html.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
          </div>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>渲染失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: HTMX 提交多行列表规整与转换
app.post("/api/backend/list/convert", async (c) => {
  try {
    let input = "";
    let sort = "none";
    let deduplicate = false;
    let trim = true;
    let removeEmpty = true;
    let prefix = "";
    let suffix = "";
    let lineNumbers = false;
    let joinDelimiter = "\n";

    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      input = (json.input || json.text || "").toString();
      if (json.sort) sort = json.sort;
      if (json.deduplicate !== undefined) deduplicate = Boolean(json.deduplicate);
      if (json.trim !== undefined) trim = Boolean(json.trim);
      if (json.removeEmpty !== undefined) removeEmpty = Boolean(json.removeEmpty);
      if (json.prefix !== undefined) prefix = json.prefix;
      if (json.suffix !== undefined) suffix = json.suffix;
      if (json.lineNumbers !== undefined) lineNumbers = Boolean(json.lineNumbers);
      if (json.joinDelimiter !== undefined) joinDelimiter = json.joinDelimiter;
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      input = (body.input || body.text || "").toString();
      if (body.sort) sort = body.sort;
      if (body.deduplicate !== undefined) deduplicate = body.deduplicate === "true" || body.deduplicate === "on";
      if (body.trim !== undefined) trim = body.trim === "true" || body.trim === "on";
      if (body.remove_empty !== undefined) removeEmpty = body.remove_empty === "true" || body.remove_empty === "on";
      if (body.prefix !== undefined) prefix = body.prefix;
      if (body.suffix !== undefined) suffix = body.suffix;
      if (body.line_numbers !== undefined) lineNumbers = body.line_numbers === "true" || body.line_numbers === "on";
      if (body.join_delimiter !== undefined) joinDelimiter = body.join_delimiter;
    }

    if (!input) {
      if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
        return c.json({ code: 400, msg: "输入列表内容不能为空", data: null }, 400);
      }
      return c.html(`
        <div class="result-box error">
          <strong>转换失败:</strong> 输入列表内容不能为空
        </div>
      `, 400);
    }

    if (!listConverterEngine) {
      throw new Error("list-converter WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = listConverterEngine.dispatch({
      action: "list/convert",
      requestId: `srv-${Date.now()}`,
      params: {
        input,
        sort,
        deduplicate,
        trim,
        removeEmpty,
        prefix,
        suffix,
        lineNumbers,
        joinDelimiter
      }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>列表转换失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: 多行列表规整与排序去重成功</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:12px; font-size:12px; color:var(--text-muted);">
          <span>原行数: <strong>${d.stats.initialLines}</strong></span>
          <span>规整后行数: <strong style="color:#38bdf8;">${d.stats.finalLines}</strong></span>
          <span>空行过滤: <strong>${d.stats.emptyRemoved}</strong></span>
          <span>重复剔除: <strong style="color:#34d399;">${d.stats.duplicatesRemoved}</strong></span>
        </div>

        <div>
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">规整结果输出 (共 ${d.lines.length} 行):</div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); font-family:var(--font-mono); font-size:12px; color:#38bdf8; word-break:break-all; max-height:180px; overflow-y:auto; white-space:pre-wrap;">
            ${d.output}
          </div>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>转换失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 List 示例
app.get("/api/backend/list/sample", async (c) => {
  try {
    if (!listConverterEngine) {
      throw new Error("list-converter WASM 引擎未就绪");
    }
    const response = listConverterEngine.dispatch({
      action: "list/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.json(response.data);
  } catch (err) {
    return c.json({ sampleInput: "Banana\nApple\nBanana" }, 500);
  }
});

// API: HTMX 提交北约音标拼读转换
app.post("/api/backend/nato/convert", async (c) => {
  try {
    let mode = "encode";
    let text = "";
    let delimiter = " ";

    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      if (json.mode) mode = json.mode;
      text = (json.text || json.input || "").toString();
      if (json.delimiter !== undefined) delimiter = json.delimiter;
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      if (body.mode) mode = body.mode;
      text = (body.text || body.input || "").toString();
      if (body.delimiter !== undefined) delimiter = body.delimiter;
    }

    if (!text) {
      if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
        return c.json({ code: 400, msg: "输入内容不能为空", data: null }, 400);
      }
      return c.html(`
        <div class="result-box error">
          <strong>转换失败:</strong> 输入内容不能为空
        </div>
      `, 400);
    }

    if (!textToNatoEngine) {
      throw new Error("text-to-nato WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const action = mode === "decode" ? "nato/decode" : "nato/encode";
    const params = mode === "decode" ? { text } : { text, delimiter };

    const response = textToNatoEngine.dispatch({
      action,
      requestId: `srv-${Date.now()}`,
      params
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>北约字母转换失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    if (mode === "decode") {
      return c.html(`
        <div class="result-box">
          <div class="result-header">
            <span class="tag tag-rust">🦀 Rust WASM: 北约音标逆向还原成功</span>
            <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
          </div>

          <div style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">
            识别有效词数: <strong>${d.stats.recognized}</strong> / ${d.stats.totalTokens}
          </div>

          <div>
            <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">文本还原输出:</div>
            <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); font-family:var(--font-mono); font-size:14px; font-weight:bold; color:#38bdf8; word-break:break-all;">
              ${d.decoded}
            </div>
          </div>
        </div>
      `);
    }

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: 北约字母拼读音标转换成功</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:12px; font-size:12px; color:var(--text-muted);">
          <span>总字符: <strong>${d.stats.totalChars}</strong></span>
          <span>字母: <strong style="color:#38bdf8;">${d.stats.letters}</strong></span>
          <span>数字: <strong style="color:#a78bfa;">${d.stats.digits}</strong></span>
          <span>空格: <strong>${d.stats.spaces}</strong></span>
        </div>

        <div>
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">音标拼读串 (NATO Phonetic):</div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); font-family:var(--font-mono); font-size:13px; color:#34d399; word-break:break-all; line-height:1.5;">
            ${d.encoded}
          </div>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>转换失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 NATO 示例
app.get("/api/backend/nato/sample", async (c) => {
  try {
    if (!textToNatoEngine) {
      throw new Error("text-to-nato WASM 引擎未就绪");
    }
    const response = textToNatoEngine.dispatch({
      action: "nato/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.json(response.data);
  } catch (err) {
    return c.json({ sampleText: "SOS 2026", sampleNato: "Sierra Oscar Sierra [Space] Two Zero Two Six" }, 500);
  }
});

// API: HTMX 提交 SQL 排版与压缩
app.post("/api/backend/sql/format", async (c) => {
  try {
    let mode = "format";
    let sql = "";
    let indent = 2;
    let uppercase = true;

    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      if (json.mode) mode = json.mode;
      sql = (json.sql || json.text || "").toString();
      if (json.indent !== undefined) indent = parseInt(json.indent, 10) || 2;
      if (json.uppercase !== undefined) uppercase = Boolean(json.uppercase);
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      if (body.mode) mode = body.mode;
      sql = (body.sql || body.text || "").toString();
      if (body.indent !== undefined) indent = parseInt(body.indent, 10) || 2;
      if (body.uppercase !== undefined) uppercase = body.uppercase === "true" || body.uppercase === "on";
    }

    if (!sql) {
      if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
        return c.json({ code: 400, msg: "SQL 语句不能为空", data: null }, 400);
      }
      return c.html(`
        <div class="result-box error">
          <strong>排版失败:</strong> SQL 语句不能为空
        </div>
      `, 400);
    }

    if (!sqlPrettifyEngine) {
      throw new Error("sql-prettify WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const action = mode === "minify" ? "sql/minify" : "sql/format";
    const params = mode === "minify" ? { sql } : { sql, indent, uppercase };

    const response = sqlPrettifyEngine.dispatch({
      action,
      requestId: `srv-${Date.now()}`,
      params
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>SQL 处理失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    if (mode === "minify") {
      return c.html(`
        <div class="result-box">
          <div class="result-header">
            <span class="tag tag-rust">🦀 Rust WASM: SQL 压缩瘦身成功</span>
            <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
          </div>

          <div style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">
            原体积: <strong>${d.stats.originalLength} 字符</strong> | 瘦身后: <strong style="color:#38bdf8;">${d.stats.minifiedLength} 字符</strong> | 压缩率: <strong style="color:#34d399;">${d.stats.compressionRatioPercent}%</strong>
          </div>

          <div>
            <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">压缩 SQL 语句:</div>
            <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); font-family:var(--font-mono); font-size:12px; color:#38bdf8; word-break:break-all; max-height:180px; overflow-y:auto; white-space:pre-wrap;">
              ${d.minified}
            </div>
          </div>
        </div>
      `);
    }

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: SQL 关键词排版美化成功</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:12px; font-size:12px; color:var(--text-muted);">
          <span>原长: <strong>${d.stats.originalLength} 字符</strong></span>
          <span>排版后: <strong style="color:#38bdf8;">${d.stats.formattedLength} 字符</strong></span>
          <span>总行数: <strong style="color:#a78bfa;">${d.stats.lineCount} 行</strong></span>
        </div>

        <div>
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">格式化输出:</div>
          <pre style="background:rgba(255,255,255,0.03); padding:10px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); font-family:var(--font-mono); font-size:12px; color:#34d399; margin:0; overflow-x:auto; line-height:1.4;"><code>${d.formatted}</code></pre>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>处理失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 SQL 示例
app.get("/api/backend/sql/sample", async (c) => {
  try {
    if (!sqlPrettifyEngine) {
      throw new Error("sql-prettify WASM 引擎未就绪");
    }
    const response = sqlPrettifyEngine.dispatch({
      action: "sql/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.json(response.data);
  } catch (err) {
    return c.json({ sampleSql: "SELECT id, name FROM users WHERE active = 1;" }, 500);
  }
});

function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

// API: HTMX 提交 XML 排版与压缩
app.post("/api/backend/xml/format", async (c) => {
  try {
    let mode = "format";
    let xml = "";
    let indent = 2;
    let stripComments = false;

    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      if (json.mode) mode = json.mode;
      xml = (json.xml || json.text || "").toString();
      if (json.indent !== undefined) indent = parseInt(json.indent, 10) || 2;
      if (json.stripComments !== undefined) stripComments = Boolean(json.stripComments);
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      if (body.mode) mode = body.mode;
      xml = (body.xml || body.text || "").toString();
      if (body.indent !== undefined) indent = parseInt(body.indent, 10) || 2;
      if (body.strip_comments !== undefined) stripComments = body.strip_comments === "true" || body.strip_comments === "on";
    }

    if (!xml) {
      if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
        return c.json({ code: 400, msg: "XML 内容不能为空", data: null }, 400);
      }
      return c.html(`
        <div class="result-box error">
          <strong>排版失败:</strong> XML 内容不能为空
        </div>
      `, 400);
    }

    if (!xmlFormatterEngine) {
      throw new Error("xml-formatter WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const action = mode === "minify" ? "xml/minify" : "xml/format";
    const params = mode === "minify" ? { xml, stripComments } : { xml, indent, stripComments };

    const response = xmlFormatterEngine.dispatch({
      action,
      requestId: `srv-${Date.now()}`,
      params
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>XML 处理失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    if (mode === "minify") {
      return c.html(`
        <div class="result-box">
          <div class="result-header">
            <span class="tag tag-rust">🦀 Rust WASM: XML 压缩瘦身成功</span>
            <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
          </div>

          <div style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">
            原体积: <strong>${d.stats.originalLength} 字节</strong> | 瘦身后: <strong style="color:#38bdf8;">${d.stats.minifiedLength} 字节</strong> | 压缩率: <strong style="color:#34d399;">${d.stats.compressionRatioPercent}%</strong>
          </div>

          <div>
            <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">压缩 XML 源码:</div>
            <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); font-family:var(--font-mono); font-size:12px; color:#38bdf8; word-break:break-all; max-height:180px; overflow-y:auto; white-space:pre-wrap;">
              ${escapeHtml(d.minified)}
            </div>
          </div>
        </div>
      `);
    }

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: XML 树排版缩进成功</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:12px; font-size:12px; color:var(--text-muted);">
          <span>原长: <strong>${d.stats.originalLength} 字符</strong></span>
          <span>排版后: <strong style="color:#38bdf8;">${d.stats.formattedLength} 字符</strong></span>
          <span>行数: <strong style="color:#a78bfa;">${d.stats.lineCount} 行</strong></span>
          <span>XML 元素数: <strong style="color:#34d399;">${d.stats.elementCount}</strong></span>
        </div>

        <div>
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">排版后 XML:</div>
          <pre style="background:rgba(255,255,255,0.03); padding:10px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); font-family:var(--font-mono); font-size:12px; color:#34d399; margin:0; overflow-x:auto; line-height:1.4;"><code>${escapeHtml(d.formatted)}</code></pre>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>处理失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 XML 示例
app.get("/api/backend/xml/sample", async (c) => {
  try {
    if (!xmlFormatterEngine) {
      throw new Error("xml-formatter WASM 引擎未就绪");
    }
    const response = xmlFormatterEngine.dispatch({
      action: "xml/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.json(response.data);
  } catch (err) {
    return c.json({ sampleXml: "<root><item>Hello</item></root>" }, 500);
  }
});

// API: HTMX 提交 JSON 压缩与格式化美化
app.post("/api/backend/json/minify", async (c) => {
  try {
    let mode = "minify";
    let jsonStr = "";
    let indent = 2;

    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      if (json.mode) mode = json.mode;
      jsonStr = (json.json || json.text || "").toString();
      if (json.indent !== undefined) indent = parseInt(json.indent, 10) || 2;
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      if (body.mode) mode = body.mode;
      jsonStr = (body.json || body.text || "").toString();
      if (body.indent !== undefined) indent = parseInt(body.indent, 10) || 2;
    }

    if (!jsonStr) {
      if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
        return c.json({ code: 400, msg: "JSON 文本不能为空", data: null }, 400);
      }
      return c.html(`
        <div class="result-box error">
          <strong>处理失败:</strong> JSON 文本不能为空
        </div>
      `, 400);
    }

    if (!jsonMinifyEngine) {
      throw new Error("json-minify WASM 引擎未就绪");
    }

    const t0 = performance.now();
    let action = "json/minify";
    let params = { json: jsonStr };

    if (mode === "prettify") {
      action = "json/prettify";
      params = { json: jsonStr, indent };
    } else if (mode === "validate") {
      action = "json/validate";
      params = { json: jsonStr };
    }

    const response = jsonMinifyEngine.dispatch({
      action,
      requestId: `srv-${Date.now()}`,
      params
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>JSON 处理失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    if (mode === "prettify") {
      return c.html(`
        <div class="result-box">
          <div class="result-header">
            <span class="tag tag-rust">🦀 Rust WASM: JSON 美化排版成功</span>
            <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
          </div>

          <div style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">
            排版后体积: <strong style="color:#38bdf8;">${d.stats.processedLength} 字节</strong> | 行数: <strong style="color:#a78bfa;">${d.stats.lineCount} 行</strong>
          </div>

          <div>
            <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">美化后 JSON:</div>
            <pre style="background:rgba(255,255,255,0.03); padding:10px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); font-family:var(--font-mono); font-size:12px; color:#34d399; margin:0; overflow-x:auto; line-height:1.4;"><code>${escapeHtml(d.prettified)}</code></pre>
          </div>
        </div>
      `);
    }

    if (mode === "validate") {
      const b = d.typeBreakdown;
      return c.html(`
        <div class="result-box">
          <div class="result-header">
            <span class="tag tag-rust">🦀 Rust WASM: JSON 结构合法性校验通过</span>
            <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
          </div>

          <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:12px; font-size:12px; color:var(--text-muted);">
            <span>根节点类型: <strong style="color:#38bdf8;">${d.rootType}</strong></span>
            <span>最大嵌套深度: <strong style="color:#a78bfa;">${b.maxDepth} 层</strong></span>
            <span>对象(Object): <strong>${b.objects}</strong></span>
            <span>数组(Array): <strong>${b.arrays}</strong></span>
            <span>字符串(String): <strong>${b.strings}</strong></span>
            <span>数字(Number): <strong>${b.numbers}</strong></span>
          </div>

          <div style="background:rgba(52,211,153,0.1); border:1px solid rgba(52,211,153,0.3); padding:8px 12px; border-radius:6px; font-size:12px; color:#34d399;">
            ✅ ${d.message}
          </div>
        </div>
      `);
    }

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: JSON 极速压缩瘦身成功</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:12px; font-size:12px; color:var(--text-muted);">
          <span>原长: <strong>${d.stats.originalLength} 字节</strong></span>
          <span>压缩后: <strong style="color:#38bdf8;">${d.stats.processedLength} 字节</strong></span>
          <span>压缩率: <strong style="color:#34d399;">${d.stats.compressionRatioPercent}%</strong></span>
        </div>

        <div>
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">单行紧凑 JSON:</div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); font-family:var(--font-mono); font-size:12px; color:#38bdf8; word-break:break-all; max-height:180px; overflow-y:auto; white-space:pre-wrap;">
            ${escapeHtml(d.minified)}
          </div>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>处理失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 JSON 示例
app.get("/api/backend/json/sample", async (c) => {
  try {
    if (!jsonMinifyEngine) {
      throw new Error("json-minify WASM 引擎未就绪");
    }
    const response = jsonMinifyEngine.dispatch({
      action: "json/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.json(response.data);
  } catch (err) {
    return c.json({ sampleJson: '{"key": "value"}' }, 500);
  }
});

// API: HTMX 提交 JSON 树状节点探针与检索
app.post("/api/backend/json/view", async (c) => {
  try {
    let mode = "inspect";
    let jsonStr = "";
    let query = "";

    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      if (json.mode) mode = json.mode;
      jsonStr = (json.json || json.text || "").toString();
      if (json.query !== undefined) query = json.query.toString();
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      if (body.mode) mode = body.mode;
      jsonStr = (body.json || body.text || "").toString();
      if (body.query !== undefined) query = body.query.toString();
    }

    if (!jsonStr) {
      if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
        return c.json({ code: 400, msg: "JSON 文本不能为空", data: null }, 400);
      }
      return c.html(`
        <div class="result-box error">
          <strong>解析失败:</strong> JSON 文本不能为空
        </div>
      `, 400);
    }

    if (!jsonViewerEngine) {
      throw new Error("json-viewer WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const action = mode === "query" ? "json/query" : "json/inspect";
    const params = mode === "query" ? { json: jsonStr, query } : { json: jsonStr, maxDepth: 100 };

    const response = jsonViewerEngine.dispatch({
      action,
      requestId: `srv-${Date.now()}`,
      params
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>JSON 树解析失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    if (mode === "query") {
      const matchRows = d.matches.map((n) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 8px; border-bottom:1px solid rgba(255,255,255,0.05); font-family:var(--font-mono); font-size:12px;">
          <span style="color:#38bdf8;">${escapeHtml(n.path)}</span>
          <span style="color:var(--text-muted); font-size:11px;">[${n.nodeType}]</span>
          <span style="color:#34d399;">${escapeHtml(n.preview)}</span>
        </div>
      `).join("");

      return c.html(`
        <div class="result-box">
          <div class="result-header">
            <span class="tag tag-rust">🦀 Rust WASM: JSON 节点检索成功</span>
            <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
          </div>

          <div style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">
            检索词: <strong style="color:#38bdf8;">"${escapeHtml(d.query)}"</strong> | 匹配节点数: <strong style="color:#34d399;">${d.matchCount}</strong>
          </div>

          <div style="background:rgba(255,255,255,0.02); border-radius:6px; border:1px solid rgba(255,255,255,0.08); max-height:200px; overflow-y:auto;">
            ${matchRows || '<div style="padding:10px; color:var(--text-muted); font-size:12px;">无匹配节点</div>'}
          </div>
        </div>
      `);
    }

    const s = d.stats;
    const nodeRows = d.nodes.slice(0, 50).map((n) => {
      const indentPx = n.depth * 14;
      const typeBadgeColor = {
        object: "#a78bfa",
        array: "#f472b6",
        string: "#34d399",
        number: "#38bdf8",
        boolean: "#f59e0b",
        null: "#94a3b8"
      }[n.nodeType] || "#94a3b8";

      return `
        <div style="display:flex; align-items:center; gap:8px; padding:3px 8px; margin-left:${indentPx}px; font-family:var(--font-mono); font-size:12px; border-left:1px dashed rgba(255,255,255,0.1);">
          <span style="color:#e2e8f0; font-weight:600;">${escapeHtml(n.key)}:</span>
          <span style="font-size:10px; padding:1px 5px; border-radius:3px; background:${typeBadgeColor}20; color:${typeBadgeColor}; border:1px solid ${typeBadgeColor}40;">${n.nodeType}</span>
          <span style="color:#94a3b8;">${escapeHtml(n.preview)}</span>
        </div>
      `;
    }).join("");

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: JSON 树状层级探针解析成功</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:12px; font-size:12px; color:var(--text-muted);">
          <span>总节点数: <strong style="color:#38bdf8;">${s.totalNodes}</strong></span>
          <span>叶子值: <strong style="color:#34d399;">${s.leafNodes}</strong></span>
          <span>总键数: <strong>${s.keyCount}</strong></span>
          <span>最大层深: <strong style="color:#a78bfa;">${s.maxDepth} 层</strong></span>
        </div>

        <div style="background:rgba(255,255,255,0.02); border-radius:6px; border:1px solid rgba(255,255,255,0.08); padding:8px; max-height:220px; overflow-y:auto;">
          ${nodeRows}
          ${d.nodes.length > 50 ? `<div style="padding:4px 8px; font-size:11px; color:var(--text-muted);">... 其余 ${d.nodes.length - 50} 个节点已折叠</div>` : ""}
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>处理失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 JSON Viewer 示例
app.get("/api/backend/json/viewer-sample", async (c) => {
  try {
    if (!jsonViewerEngine) {
      throw new Error("json-viewer WASM 引擎未就绪");
    }
    const response = jsonViewerEngine.dispatch({
      action: "json/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.json(response.data);
  } catch (err) {
    return c.json({ sampleJson: '{"project": "WasmForge"}' }, 500);
  }
});

// API: HTMX 提交 YAML 树状节点探针与检索
app.post("/api/backend/yaml/view", async (c) => {
  try {
    let mode = "inspect";
    let yamlStr = "";
    let query = "";

    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      if (json.mode) mode = json.mode;
      yamlStr = (json.yaml || json.text || "").toString();
      if (json.query !== undefined) query = json.query.toString();
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      if (body.mode) mode = body.mode;
      yamlStr = (body.yaml || body.text || "").toString();
      if (body.query !== undefined) query = body.query.toString();
    }

    if (!yamlStr) {
      if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
        return c.json({ code: 400, msg: "YAML 文本不能为空", data: null }, 400);
      }
      return c.html(`
        <div class="result-box error">
          <strong>解析失败:</strong> YAML 文本不能为空
        </div>
      `, 400);
    }

    if (!yamlViewerEngine) {
      throw new Error("yaml-viewer WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const action = mode === "query" ? "yaml/query" : "yaml/inspect";
    const params = mode === "query" ? { yaml: yamlStr, query } : { yaml: yamlStr };

    const response = yamlViewerEngine.dispatch({
      action,
      requestId: `srv-${Date.now()}`,
      params
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>YAML 树解析失败:</strong> ${response.msg}
        </div>
      `, 400);
    }

    const d = response.data;
    if (mode === "query") {
      const matchRows = d.matches.map((n) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 8px; border-bottom:1px solid rgba(255,255,255,0.05); font-family:var(--font-mono); font-size:12px;">
          <span style="color:#38bdf8;">${escapeHtml(n.path)}</span>
          <span style="color:var(--text-muted); font-size:11px;">[${n.nodeType}]</span>
          <span style="color:#34d399;">${escapeHtml(n.preview)}</span>
        </div>
      `).join("");

      return c.html(`
        <div class="result-box">
          <div class="result-header">
            <span class="tag tag-rust">🦀 Rust WASM: YAML 节点检索成功</span>
            <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
          </div>

          <div style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">
            检索词: <strong style="color:#38bdf8;">"${escapeHtml(d.query)}"</strong> | 匹配节点数: <strong style="color:#34d399;">${d.matchCount}</strong>
          </div>

          <div style="background:rgba(255,255,255,0.02); border-radius:6px; border:1px solid rgba(255,255,255,0.08); max-height:200px; overflow-y:auto;">
            ${matchRows || '<div style="padding:10px; color:var(--text-muted); font-size:12px;">无匹配节点</div>'}
          </div>
        </div>
      `);
    }

    const s = d.stats;
    const nodeRows = d.nodes.slice(0, 60).map((n) => {
      const indentPx = n.depth * 14;
      const typeBadgeColor = {
        mapping: "#a78bfa",
        sequence: "#f472b6",
        string: "#34d399",
        number: "#38bdf8",
        boolean: "#f59e0b",
        null: "#94a3b8"
      }[n.nodeType] || "#94a3b8";

      return `
        <div style="display:flex; align-items:center; gap:8px; padding:3px 8px; margin-left:${indentPx}px; font-family:var(--font-mono); font-size:12px; border-left:1px dashed rgba(255,255,255,0.1);">
          <span style="color:#e2e8f0; font-weight:600;">${escapeHtml(n.key)}:</span>
          <span style="font-size:10px; padding:1px 5px; border-radius:3px; background:${typeBadgeColor}20; color:${typeBadgeColor}; border:1px solid ${typeBadgeColor}40;">${n.nodeType}</span>
          <span style="color:#94a3b8;">${escapeHtml(n.preview)}</span>
        </div>
      `;
    }).join("");

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: YAML 树状层级探针解析成功</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:12px; font-size:12px; color:var(--text-muted);">
          <span>总节点数: <strong style="color:#38bdf8;">${s.totalNodes}</strong></span>
          <span>叶子值: <strong style="color:#34d399;">${s.leafNodes}</strong></span>
          <span>文档数: <strong style="color:#f59e0b;">${d.documentCount}</strong></span>
          <span>映射: <strong>${s.mappingCount}</strong> | 序列: <strong>${s.sequenceCount}</strong></span>
          <span>最大层深: <strong style="color:#a78bfa;">${s.maxDepth} 层</strong></span>
        </div>

        <div style="background:rgba(255,255,255,0.02); border-radius:6px; border:1px solid rgba(255,255,255,0.08); padding:8px; max-height:220px; overflow-y:auto;">
          ${nodeRows}
          ${d.nodes.length > 60 ? `<div style="padding:4px 8px; font-size:11px; color:var(--text-muted);">... 其余 ${d.nodes.length - 60} 个节点已折叠</div>` : ""}
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>处理失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 YAML Viewer 示例
app.get("/api/backend/yaml/viewer-sample", async (c) => {
  try {
    if (!yamlViewerEngine) {
      throw new Error("yaml-viewer WASM 引擎未就绪");
    }
    const response = yamlViewerEngine.dispatch({
      action: "yaml/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.json(response.data);
  } catch (err) {
    return c.json({ sampleYaml: "app: WasmForge\nversion: 1.0" }, 500);
  }
});

// API: HTMX 提交 正则表达式测试与替换
app.post("/api/backend/regex/test", async (c) => {
  try {
    let mode = "test";
    let pattern = "";
    let text = "";
    let replacement = "";
    let replaceAll = true;
    let flags = {
      caseInsensitive: false,
      multiLine: false,
      dotMatchesNewLine: false,
      unicode: true
    };

    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      if (json.mode) mode = json.mode;
      pattern = (json.pattern || "").toString();
      text = (json.text || "").toString();
      if (json.replacement !== undefined) replacement = json.replacement.toString();
      if (json.replaceAll !== undefined) replaceAll = Boolean(json.replaceAll);
      if (json.flags) flags = { ...flags, ...json.flags };
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      if (body.mode) mode = body.mode;
      pattern = (body.pattern || "").toString();
      text = (body.text || "").toString();
      if (body.replacement !== undefined) replacement = body.replacement.toString();
      if (body.replaceAll !== undefined) replaceAll = body.replaceAll === "true" || body.replaceAll === true;
      flags.caseInsensitive = Boolean(body.caseInsensitive);
      flags.multiLine = Boolean(body.multiLine);
      flags.dotMatchesNewLine = Boolean(body.dotMatchesNewLine);
    }

    if (!pattern) {
      if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
        return c.json({ code: 400, msg: "正则表达式 pattern 不能为空", data: null }, 400);
      }
      return c.html(`
        <div class="result-box error">
          <strong>测试失败:</strong> 正则表达式 pattern 不能为空
        </div>
      `, 400);
    }

    if (!regexTesterEngine) {
      throw new Error("regex-tester WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const action = mode === "replace" ? "regex/replace" : "regex/test";
    const params = mode === "replace"
      ? { pattern, text, replacement, replaceAll, flags }
      : { pattern, text, flags };

    const response = regexTesterEngine.dispatch({
      action,
      requestId: `srv-${Date.now()}`,
      params
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>正则执行错误:</strong> ${escapeHtml(response.msg)}
        </div>
      `, 400);
    }

    const d = response.data;
    if (mode === "replace") {
      return c.html(`
        <div class="result-box">
          <div class="result-header">
            <span class="tag tag-rust">🦀 Rust WASM: 正则文本替换完成 (ReDoS-Safe)</span>
            <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
          </div>

          <div style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">
            替换次数: <strong style="color:#38bdf8;">${d.replacementsMade} 处</strong> | 规则: <code>${escapeHtml(pattern)}</code> ➜ <code>${escapeHtml(replacement)}</code>
          </div>

          <div>
            <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">替换结果:</div>
            <pre style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:4px; border:1px solid rgba(255,255,255,0.06); font-family:var(--font-mono); font-size:12px; color:#34d399; margin:0; overflow-x:auto; line-height:1.4;"><code>${escapeHtml(d.result)}</code></pre>
          </div>
        </div>
      `);
    }

    // mode === "test"
    const matchRows = d.matches.slice(0, 30).map((m) => {
      const groupRows = m.captures.map((g) => `
        <span style="background:rgba(255,255,255,0.06); padding:1px 5px; border-radius:3px; font-size:11px;">
          <span style="color:#a78bfa;">${g.name ? escapeHtml(g.name) : '#' + g.index}:</span>
          <span style="color:#34d399;">"${escapeHtml(g.text)}"</span>
        </span>
      `).join(" ");

      return `
        <div style="padding:6px 8px; border-bottom:1px solid rgba(255,255,255,0.05); font-family:var(--font-mono); font-size:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
            <span style="color:#38bdf8; font-weight:600;">Match #${m.index + 1}</span>
            <span style="color:var(--text-muted); font-size:11px;">[${m.start}..${m.end}]</span>
          </div>
          <div style="color:#facc15; margin-bottom:4px; word-break:break-all;">"${escapeHtml(m.text)}"</div>
          ${m.captures.length > 1 ? `<div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:2px;">${groupRows}</div>` : ""}
        </div>
      `;
    }).join("");

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: 正则匹配成功 (ReDoS-Safe 线性保证)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>

        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:12px; font-size:12px; color:var(--text-muted);">
          <span>匹配状态: <strong style="color:${d.isMatch ? '#34d399' : '#ef4444'};">${d.isMatch ? '✅ MATCHED' : '❌ NO MATCH'}</strong></span>
          <span>匹配次数: <strong style="color:#38bdf8;">${d.matchCount} 处</strong></span>
          <span>引擎安全保证: <strong style="color:#a78bfa;">${escapeHtml(d.executionInfo)}</strong></span>
        </div>

        <div style="background:rgba(255,255,255,0.02); border-radius:6px; border:1px solid rgba(255,255,255,0.08); max-height:220px; overflow-y:auto;">
          ${matchRows || '<div style="padding:10px; color:var(--text-muted); font-size:12px;">无任何匹配项</div>'}
          ${d.matches.length > 30 ? `<div style="padding:4px 8px; font-size:11px; color:var(--text-muted);">... 其余 ${d.matches.length - 30} 个匹配项已折叠</div>` : ""}
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>处理失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 Regex 经典模板示例
app.get("/api/backend/regex/samples", async (c) => {
  try {
    if (!regexTesterEngine) {
      throw new Error("regex-tester WASM 引擎未就绪");
    }
    const response = regexTesterEngine.dispatch({
      action: "regex/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.json(response.data);
  } catch (err) {
    return c.json({ samples: [] }, 500);
  }
});

// API: HTMX 检索 正则表达式备忘字典 (GET / POST)
const handleRegexMemo = async (c) => {
  try {
    let query = "";
    let category = "";

    const method = c.req.method;
    const contentType = c.req.header("content-type") || "";

    if (method === "GET") {
      query = (c.req.query("query") || "").toString();
      category = (c.req.query("category") || "").toString();
    } else if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      if (json.query !== undefined) query = json.query.toString();
      if (json.category !== undefined) category = json.category.toString();
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      if (body.query !== undefined) query = body.query.toString();
      if (body.category !== undefined) category = body.category.toString();
    }

    if (!regexMemoEngine) {
      throw new Error("regex-memo WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const action = "memo/search";
    const params = { query, category: category || undefined };

    const response = regexMemoEngine.dispatch({
      action,
      requestId: `srv-${Date.now()}`,
      params
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>备忘字典查询失败:</strong> ${escapeHtml(response.msg)}
        </div>
      `, 400);
    }

    const d = response.data;
    const itemRows = d.matches.map((item) => `
      <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:10px 12px; margin-bottom:8px; display:flex; flex-direction:column; gap:6px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:8px;">
            <code style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3); padding:2px 8px; border-radius:4px; font-weight:700; font-size:13px;">${escapeHtml(item.token)}</code>
            <span style="font-size:13px; font-weight:600; color:#f1f5f9;">${escapeHtml(item.name)}</span>
          </div>
          <span style="font-size:10px; color:#a78bfa; background:rgba(167,139,250,0.1); border:1px solid rgba(167,139,250,0.25); padding:1px 6px; border-radius:3px;">${escapeHtml(item.categoryName)}</span>
        </div>
        <div style="font-size:12px; color:var(--text-muted); line-height:1.4;">${escapeHtml(item.description)}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2); padding:4px 8px; border-radius:4px; font-size:11px; font-family:var(--font-mono);">
          <span style="color:#34d399;">💡 示例: ${escapeHtml(item.example)}</span>
          <button type="button" class="btn-copy" style="padding:1px 6px; font-size:10px; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:3px; cursor:pointer;" onclick="navigator.clipboard.writeText('${escapeHtml(item.token)}'); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制表达式</button>
        </div>
      </div>
    `).join("");

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: 正则速查字典检索完成</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>

        <div style="font-size:12px; color:var(--text-muted); margin-bottom:10px;">
          检索词: <strong style="color:#38bdf8;">"${escapeHtml(query || '全部')}"</strong> | 匹配语法条目: <strong style="color:#34d399;">${d.matchCount} 项</strong>
        </div>

        <div style="max-height:280px; overflow-y:auto;">
          ${itemRows || '<div style="padding:10px; color:var(--text-muted); font-size:12px;">未匹配到相关正则语法条目</div>'}
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>处理失败:</strong> ${err.message}
      </div>
    `, 400);
  }
};

app.get("/api/backend/regex/memo", handleRegexMemo);
app.post("/api/backend/regex/memo", handleRegexMemo);

// API: HTMX 提交 Cron 表达式解析与未来运行推算
app.post("/api/backend/cron/evaluate", async (c) => {
  try {
    let expression = "";
    let referenceTime = Math.floor(Date.now() / 1000);
    let count = 5;

    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      expression = (json.expression || "").toString();
      if (json.referenceTime !== undefined) referenceTime = Number(json.referenceTime);
      if (json.count !== undefined) count = Number(json.count);
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      expression = (body.expression || "").toString();
      if (body.referenceTime) referenceTime = Number(body.referenceTime);
      if (body.count) count = Number(body.count);
    }

    if (!expression) {
      if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
        return c.json({ code: 400, msg: "Cron 表达式不能为空", data: null }, 400);
      }
      return c.html(`
        <div class="result-box error">
          <strong>解析失败:</strong> Cron 表达式不能为空
        </div>
      `, 400);
    }

    if (!crontabGeneratorEngine) {
      throw new Error("crontab-generator WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = crontabGeneratorEngine.dispatch({
      action: "cron/evaluate",
      requestId: `srv-${Date.now()}`,
      params: { expression, referenceTime, count }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>Cron 语法解析错误:</strong> ${escapeHtml(response.msg)}
        </div>
      `, 400);
    }

    const d = response.data;
    const b = d.breakdown;

    const runRows = d.nextRuns.map((r) => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:5px 8px; border-bottom:1px solid rgba(255,255,255,0.05); font-family:var(--font-mono); font-size:12px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="color:#f59e0b; font-weight:600;">#${r.index}</span>
          <span style="color:#34d399;">${escapeHtml(r.utcTime)}</span>
        </div>
        <span style="color:var(--text-muted); font-size:11px;">${escapeHtml(r.readable)}</span>
      </div>
    `).join("");

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: Cron 表达式解析成功</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>

        <div style="margin-bottom:12px; display:flex; flex-direction:column; gap:4px;">
          <div style="font-size:14px; font-weight:600; color:#38bdf8;">
            📢 ${escapeHtml(d.humanZh)}
            <span style="font-size:12px; font-weight:400; color:var(--text-muted); margin-left:8px;">(${escapeHtml(d.humanEn)})</span>
          </div>
        </div>

        <!-- 字段分解条 -->
        <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap:6px; margin-bottom:12px; font-family:var(--font-mono); font-size:12px; text-align:center;">
          <div style="background:rgba(255,255,255,0.04); padding:6px 2px; border-radius:4px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted);">分钟 (Min)</div>
            <div style="color:#38bdf8; font-weight:700;">${escapeHtml(b.minute)}</div>
          </div>
          <div style="background:rgba(255,255,255,0.04); padding:6px 2px; border-radius:4px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted);">小时 (Hour)</div>
            <div style="color:#38bdf8; font-weight:700;">${escapeHtml(b.hour)}</div>
          </div>
          <div style="background:rgba(255,255,255,0.04); padding:6px 2px; border-radius:4px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted);">日期 (Day)</div>
            <div style="color:#38bdf8; font-weight:700;">${escapeHtml(b.dayOfMonth)}</div>
          </div>
          <div style="background:rgba(255,255,255,0.04); padding:6px 2px; border-radius:4px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted);">月份 (Month)</div>
            <div style="color:#38bdf8; font-weight:700;">${escapeHtml(b.month)}</div>
          </div>
          <div style="background:rgba(255,255,255,0.04); padding:6px 2px; border-radius:4px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:10px; color:var(--text-muted);">星期 (Week)</div>
            <div style="color:#38bdf8; font-weight:700;">${escapeHtml(b.dayOfWeek)}</div>
          </div>
        </div>

        <div>
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">未来 ${d.nextRuns.length} 次调度触发时序 (UTC):</div>
          <div style="background:rgba(255,255,255,0.02); border-radius:6px; border:1px solid rgba(255,255,255,0.08); max-height:160px; overflow-y:auto;">
            ${runRows || '<div style="padding:10px; color:var(--text-muted); font-size:12px;">无计划运行</div>'}
          </div>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>处理失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 Cron 常用预设列表
app.get("/api/backend/cron/presets", async (c) => {
  try {
    if (!crontabGeneratorEngine) {
      throw new Error("crontab-generator WASM 引擎未就绪");
    }
    const response = crontabGeneratorEngine.dispatch({
      action: "cron/presets",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取预设失败");
    }
    return c.json(response.data);
  } catch (err) {
    return c.json({ presets: [] }, 500);
  }
});

// API: HTMX / JSON 提交 Chmod 计算与权限分析
app.post("/api/backend/chmod/calculate", async (c) => {
  try {
    let octal = "";
    let symbolic = "";
    let umask = "022";
    let bits = null;

    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      octal = (json.octal || "").toString();
      symbolic = (json.symbolic || "").toString();
      if (json.umask !== undefined) umask = json.umask.toString();
      if (json.bits) bits = json.bits;
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      octal = (body.octal || "").toString();
      symbolic = (body.symbolic || "").toString();
      if (body.umask) umask = body.umask.toString();
      
      // 解析三元组复选框
      bits = {
        user: {
          read: body["u_r"] === "on" || body["u_r"] === "true",
          write: body["u_w"] === "on" || body["u_w"] === "true",
          execute: body["u_x"] === "on" || body["u_x"] === "true",
        },
        group: {
          read: body["g_r"] === "on" || body["g_r"] === "true",
          write: body["g_w"] === "on" || body["g_w"] === "true",
          execute: body["g_x"] === "on" || body["g_x"] === "true",
        },
        others: {
          read: body["o_r"] === "on" || body["o_r"] === "true",
          write: body["o_w"] === "on" || body["o_w"] === "true",
          execute: body["o_x"] === "on" || body["o_x"] === "true",
        },
        special: {
          suid: body["s_suid"] === "on" || body["s_suid"] === "true",
          sgid: body["s_sgid"] === "on" || body["s_sgid"] === "true",
          sticky: body["s_sticky"] === "on" || body["s_sticky"] === "true",
        }
      };
    }

    if (!chmodCalculatorEngine) {
      throw new Error("chmod-calculator WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = chmodCalculatorEngine.dispatch({
      action: "chmod/calculate",
      requestId: `srv-${Date.now()}`,
      params: { octal, symbolic, bits, umask }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>计算失败:</strong> ${escapeHtml(response.msg)}
        </div>
      `, 400);
    }

    const d = response.data;
    const b = d.bits;
    const notesHtml = d.security_notes.map((n) => `
      <div style="font-size:12px; padding:3px 0; color:${n.includes('高危') ? '#ef4444' : n.includes('警告') ? '#f59e0b' : '#38bdf8'};">
        ${escapeHtml(n)}
      </div>
    `).join("");

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: Linux Chmod 权限计算成功</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:10px; margin-bottom:12px;">
          <div style="background:rgba(255,255,255,0.04); padding:8px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); text-align:center;">
            <div style="font-size:11px; color:var(--text-muted);">八进制 (Octal)</div>
            <div style="font-size:20px; font-weight:700; color:#38bdf8; font-family:var(--font-mono);">${escapeHtml(d.octal4)} <span style="font-size:13px; color:var(--text-muted); font-weight:400;">(${escapeHtml(d.octal3)})</span></div>
          </div>
          <div style="background:rgba(255,255,255,0.04); padding:8px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); text-align:center;">
            <div style="font-size:11px; color:var(--text-muted);">符号模式 (Symbolic)</div>
            <div style="font-size:18px; font-weight:700; color:#34d399; font-family:var(--font-mono);">${escapeHtml(d.symbolic10)}</div>
          </div>
          <div style="background:rgba(255,255,255,0.04); padding:8px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); text-align:center;">
            <div style="font-size:11px; color:var(--text-muted);">目录视图</div>
            <div style="font-size:18px; font-weight:700; color:#f59e0b; font-family:var(--font-mono);">d${escapeHtml(d.symbolic9)}</div>
          </div>
        </div>

        <!-- 常用命令复制区 -->
        <div style="margin-bottom:12px; background:rgba(0,0,0,0.25); border-radius:6px; padding:8px 12px; font-family:var(--font-mono); font-size:12px; display:flex; flex-direction:column; gap:6px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span><span style="color:#a78bfa;">$</span> <span style="color:#f1f5f9;">${escapeHtml(d.commands.numeric)}</span></span>
            <button type="button" class="btn-copy" style="padding:2px 8px; font-size:11px; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:3px; cursor:pointer;" onclick="navigator.clipboard.writeText('${escapeHtml(d.commands.numeric)}'); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span><span style="color:#a78bfa;">$</span> <span style="color:#f1f5f9;">${escapeHtml(d.commands.symbolic)}</span></span>
            <button type="button" class="btn-copy" style="padding:2px 8px; font-size:11px; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:3px; cursor:pointer;" onclick="navigator.clipboard.writeText('${escapeHtml(d.commands.symbolic)}'); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制', 1500)">复制</button>
          </div>
        </div>

        ${d.umask_effect ? `
          <div style="margin-bottom:10px; font-size:12px; color:var(--text-muted); background:rgba(255,255,255,0.02); padding:6px 10px; border-radius:4px; border:1px solid rgba(255,255,255,0.05);">
            💡 <strong>Umask ${escapeHtml(d.umask_effect.umask)} 默认衍生:</strong> 文件为 <code>${escapeHtml(d.umask_effect.file_mode_octal)}</code> (${escapeHtml(d.umask_effect.file_mode_symbolic)})，目录为 <code>${escapeHtml(d.umask_effect.dir_mode_octal)}</code> (${escapeHtml(d.umask_effect.dir_mode_symbolic)})
          </div>
        ` : ''}

        ${notesHtml ? `
          <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:8px;">
            ${notesHtml}
          </div>
        ` : ''}
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>处理失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 Chmod 常用预设列表
app.get("/api/backend/chmod/presets", async (c) => {
  try {
    if (!chmodCalculatorEngine) {
      throw new Error("chmod-calculator WASM 引擎未就绪");
    }
    const response = chmodCalculatorEngine.dispatch({
      action: "chmod/presets",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取预设失败");
    }
    return c.json(response.data);
  } catch (err) {
    return c.json({ presets: [] }, 500);
  }
});

// API: HTMX / JSON 提交 docker run 转 docker-compose.yml
app.post("/api/backend/docker/to-compose", async (c) => {
  try {
    let command = "";
    let composeVersion = "3.8";
    let serviceName = "";

    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      command = (json.command || "").toString();
      if (json.composeVersion) composeVersion = json.composeVersion.toString();
      if (json.serviceName) serviceName = json.serviceName.toString();
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      command = (body.command || "").toString();
      if (body.composeVersion) composeVersion = body.composeVersion.toString();
      if (body.serviceName) serviceName = body.serviceName.toString();
    }

    if (!command.trim()) {
      if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
        return c.json({ code: 400, msg: "command 命令参数不能为空", data: null }, 400);
      }
      return c.html(`
        <div class="result-box error">
          <strong>转换失败:</strong> docker run 命令输入不能为空
        </div>
      `, 400);
    }

    if (!dockerRunToComposeEngine) {
      throw new Error("docker-run-to-compose WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = dockerRunToComposeEngine.dispatch({
      action: "docker/to-compose",
      requestId: `srv-${Date.now()}`,
      params: { command, composeVersion, serviceName: serviceName || undefined }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>解析失败:</strong> ${escapeHtml(response.msg)}
        </div>
      `, 400);
    }

    const d = response.data;
    const det = d.details;

    const tags = [
      `服务: <strong style="color:#38bdf8;">${escapeHtml(det.service_name)}</strong>`,
      `镜像: <strong style="color:#34d399;">${escapeHtml(det.image)}</strong>`,
      det.container_name ? `容器名: ${escapeHtml(det.container_name)}` : null,
      det.ports.length > 0 ? `端口: ${det.ports.length} 个` : null,
      det.volumes.length > 0 ? `卷: ${det.volumes.length} 个` : null,
      det.environment.length > 0 ? `环境变量: ${det.environment.length} 个` : null,
      det.restart ? `重启: ${escapeHtml(det.restart)}` : null,
      det.privileged ? `<span style="color:#f59e0b;">特权模式</span>` : null,
    ].filter(Boolean).map(t => `<span style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); padding:2px 8px; border-radius:4px; font-size:11px;">${t}</span>`).join(" ");

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: Docker Compose YAML 生成完成</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>

        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px;">
          ${tags}
        </div>

        <div style="position:relative;">
          <pre style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:6px; padding:12px; font-family:var(--font-mono); font-size:12px; color:#e2e8f0; overflow-x:auto; margin:0; line-height:1.5;">${escapeHtml(d.compose_yaml)}</pre>
          <button type="button" class="btn-copy" style="position:absolute; top:8px; right:8px; padding:3px 8px; font-size:11px; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:4px; cursor:pointer;" onclick="navigator.clipboard.writeText(this.nextElementSibling ? this.nextElementSibling.innerText : this.previousElementSibling.innerText); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制 YAML', 1500)">复制 YAML</button>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>处理失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 Docker Run 常用示例列表
app.get("/api/backend/docker/samples", async (c) => {
  try {
    if (!dockerRunToComposeEngine) {
      throw new Error("docker-run-to-compose WASM 引擎未就绪");
    }
    const response = dockerRunToComposeEngine.dispatch({
      action: "docker/samples",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.json(response.data);
  } catch (err) {
    return c.json({ samples: [] }, 500);
  }
});

// API: HTMX / JSON 提交 邮箱地址规范化与别名清洗
app.post("/api/backend/email/normalize", async (c) => {
  try {
    let email = "";
    let emails = [];
    let stripTags = true;
    let stripDots = true;
    let deduplicate = true;

    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      email = (json.email || "").toString();
      if (Array.isArray(json.emails)) emails = json.emails;
      if (json.stripTags !== undefined) stripTags = Boolean(json.stripTags);
      if (json.stripDots !== undefined) stripDots = Boolean(json.stripDots);
      if (json.deduplicate !== undefined) deduplicate = Boolean(json.deduplicate);
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      email = (body.email || "").toString();
      if (body.stripTags !== undefined) stripTags = body.stripTags === "on" || body.stripTags === "true";
      if (body.stripDots !== undefined) stripDots = body.stripDots === "on" || body.stripDots === "true";
      if (body.deduplicate !== undefined) deduplicate = body.deduplicate === "on" || body.deduplicate === "true";
    }

    if (!email.trim() && emails.length === 0) {
      if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
        return c.json({ code: 400, msg: "email 参数不能为空", data: null }, 400);
      }
      return c.html(`
        <div class="result-box error">
          <strong>清洗失败:</strong> 邮箱输入不能为空
        </div>
      `, 400);
    }

    if (!emailNormalizerEngine) {
      throw new Error("email-normalizer WASM 引擎未就绪");
    }

    const t0 = performance.now();
    let action = "email/normalize";
    let params = { email, stripTags, stripDots };

    // 如果包含多行换行，自动使用批量模式
    if (email.includes("\n") || emails.length > 0) {
      action = "email/batch";
      params = { emails: emails.length > 0 ? emails : email, stripTags, stripDots, deduplicate };
    }

    const response = emailNormalizerEngine.dispatch({
      action,
      requestId: `srv-${Date.now()}`,
      params
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>处理失败:</strong> ${escapeHtml(response.msg)}
        </div>
      `, 400);
    }

    if (action === "email/batch") {
      const b = response.data;
      const rows = b.items.map((it, idx) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 10px; border-bottom:1px solid rgba(255,255,255,0.05); font-family:var(--font-mono); font-size:12px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="color:#f59e0b; font-weight:600;">#${idx + 1}</span>
            <span style="color:#38bdf8; font-weight:600;">${escapeHtml(it.normalized)}</span>
            <span style="color:var(--text-muted); font-size:11px;">(${escapeHtml(it.original)})</span>
          </div>
          <span style="color:#34d399; font-size:11px;">${escapeHtml(it.provider)}</span>
        </div>
      `).join("");

      return c.html(`
        <div class="result-box">
          <div class="result-header">
            <span class="tag tag-rust">🦀 Rust WASM: 批量邮箱清洗去重完成</span>
            <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
          </div>
          <div style="display:flex; gap:12px; margin-bottom:10px; font-size:12px; color:var(--text-muted);">
            <span>原始条目: <strong style="color:#f1f5f9;">${b.total}</strong></span>
            <span>去重后独立邮箱: <strong style="color:#38bdf8;">${b.unique}</strong></span>
            <span>清洗重复数: <strong style="color:#34d399;">${b.duplicates_removed}</strong></span>
          </div>
          <div style="max-height:220px; overflow-y:auto; background:rgba(0,0,0,0.25); border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            ${rows}
          </div>
        </div>
      `);
    }

    const d = response.data;
    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: 邮箱标准化完成</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.25); padding:10px 14px; border-radius:6px; margin-bottom:12px;">
          <div>
            <div style="font-size:11px; color:var(--text-muted);">规范化标准邮箱地址 (Canonical Email):</div>
            <div style="font-size:18px; font-weight:700; color:#38bdf8; font-family:var(--font-mono);">${escapeHtml(d.normalized)}</div>
          </div>
          <button type="button" class="btn-copy" style="padding:4px 10px; font-size:11px; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:4px; cursor:pointer;" onclick="navigator.clipboard.writeText('${escapeHtml(d.normalized)}'); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制邮箱', 1500)">复制邮箱</button>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:8px; font-size:12px; margin-bottom:10px;">
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:4px; border:1px solid rgba(255,255,255,0.06);">
            <div style="color:var(--text-muted); font-size:11px;">基础用户名:</div>
            <div style="color:#f1f5f9; font-weight:600; font-family:var(--font-mono);">${escapeHtml(d.username)}</div>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:4px; border:1px solid rgba(255,255,255,0.06);">
            <div style="color:var(--text-muted); font-size:11px;">规范域名:</div>
            <div style="color:#f1f5f9; font-weight:600; font-family:var(--font-mono);">${escapeHtml(d.domain)}</div>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:4px; border:1px solid rgba(255,255,255,0.06);">
            <div style="color:var(--text-muted); font-size:11px;">服务托管商:</div>
            <div style="color:#34d399; font-weight:600;">${escapeHtml(d.provider)}</div>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:8px 10px; border-radius:4px; border:1px solid rgba(255,255,255,0.06);">
            <div style="color:var(--text-muted); font-size:11px;">别名标签 (+tag):</div>
            <div style="color:${d.tag ? '#f59e0b' : 'var(--text-muted)'}; font-weight:600; font-family:var(--font-mono);">${d.tag ? escapeHtml(d.tag) : '无别名'}</div>
          </div>
        </div>

        <div style="display:flex; gap:8px; flex-wrap:wrap; font-size:11px; color:var(--text-muted);">
          <span>原输入: <code>${escapeHtml(d.original)}</code></span>
          ${d.stripped_dots ? '<span style="color:#38bdf8;">• 已去除 Gmail 点号</span>' : ''}
          ${d.domain_aliased ? '<span style="color:#38bdf8;">• googlemail 映射为 gmail</span>' : ''}
          ${d.has_alias ? '<span style="color:#f59e0b;">• 已剥离别名标签</span>' : ''}
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>处理失败:</strong> ${err.message}
      </div>
    `, 400);
  }
});

// API: 获取 Email 常用测试示例列表
app.get("/api/backend/email/samples", async (c) => {
  try {
    if (!emailNormalizerEngine) {
      throw new Error("email-normalizer WASM 引擎未就绪");
    }
    const response = emailNormalizerEngine.dispatch({
      action: "email/samples",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.json(response.data);
  } catch (err) {
    return c.json({ samples: [] }, 500);
  }
});

// API: Git Memo 类别列表
app.get("/api/backend/git/categories", async (c) => {
  try {
    if (!gitMemoEngine) {
      throw new Error("git-memo WASM 引擎未就绪");
    }
    const response = gitMemoEngine.dispatch({
      action: "git/categories",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    return c.json(response);
  } catch (err) {
    return c.json({ code: 500, msg: err.message, data: null }, 500);
  }
});

// API: Git Memo 命令列表与过滤
app.get("/api/backend/git/list", async (c) => {
  try {
    if (!gitMemoEngine) {
      throw new Error("git-memo WASM 引擎未就绪");
    }
    const category = c.req.query("category") || "";
    const keyword = c.req.query("keyword") || "";
    const response = gitMemoEngine.dispatch({
      action: "git/list",
      requestId: `srv-${Date.now()}`,
      params: { category, keyword }
    });
    return c.json(response);
  } catch (err) {
    return c.json({ code: 500, msg: err.message, data: null }, 500);
  }
});

// API: Git Memo 实战问题场景解决方案
app.get("/api/backend/git/scenarios", async (c) => {
  try {
    if (!gitMemoEngine) {
      throw new Error("git-memo WASM 引擎未就绪");
    }
    const keyword = c.req.query("keyword") || "";
    const response = gitMemoEngine.dispatch({
      action: "git/scenarios",
      requestId: `srv-${Date.now()}`,
      params: { keyword }
    });
    return c.json(response);
  } catch (err) {
    return c.json({ code: 500, msg: err.message, data: null }, 500);
  }
});

// API: Git Memo 搜索（支持 HTMX 交互与 JSON）
app.post("/api/backend/git/search", async (c) => {
  try {
    const contentType = c.req.header("Content-Type") || "";
    let keyword = "";
    let category = "all";

    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      keyword = (json.keyword || json.query || "").toString();
      if (json.category) category = json.category.toString();
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      keyword = (body.keyword || body.query || "").toString();
      if (body.category) category = body.category.toString();
    }

    if (!gitMemoEngine) {
      throw new Error("git-memo WASM 引擎未就绪");
    }

    const t0 = performance.now();
    let response;
    if (category && category !== "all" && !keyword.trim()) {
      response = gitMemoEngine.dispatch({
        action: "git/list",
        requestId: `srv-${Date.now()}`,
        params: { category, keyword: "" }
      });
    } else {
      response = gitMemoEngine.dispatch({
        action: "git/search",
        requestId: `srv-${Date.now()}`,
        params: { keyword }
      });
    }
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>检索失败:</strong> ${escapeHtml(response.msg)}
        </div>
      `, 400);
    }

    // HTMX 卡片式渲染
    const data = response.data;
    let commands = [];
    let scenarios = [];
    if (data.matchedCommands) {
      commands = data.matchedCommands;
      scenarios = data.matchedScenarios || [];
    } else if (data.commands) {
      commands = data.commands;
    }

    if (category && category !== "all") {
      commands = commands.filter(c => c.category === category);
    }

    let cmdHtml = commands.map(cmd => `
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:12px; margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-weight:600; font-size:13px; color:#f1f5f9;">${escapeHtml(cmd.title)}</span>
          <div style="display:flex; gap:6px;">
            <span style="font-size:11px; padding:2px 6px; border-radius:4px; background:rgba(56,189,248,0.15); color:#38bdf8;">${escapeHtml(cmd.category)}</span>
            ${cmd.isDestructive ? '<span style="font-size:11px; padding:2px 6px; border-radius:4px; background:rgba(239,68,68,0.2); color:#ef4444; font-weight:600;">⚠️ 谨慎执行</span>' : ''}
          </div>
        </div>
        <p style="font-size:12px; color:var(--text-muted); margin:0 0 8px 0;">${escapeHtml(cmd.description)}</p>
        <div style="background:rgba(0,0,0,0.35); padding:8px 10px; border-radius:6px; font-family:var(--font-mono); font-size:12px; color:#a5f3fc; border:1px solid rgba(255,255,255,0.05); white-space:pre-wrap;">${escapeHtml(cmd.command)}</div>
      </div>
    `).join("");

    let scenHtml = "";
    if (scenarios.length > 0) {
      scenHtml = `
        <div style="margin-top:16px;">
          <h4 style="font-size:13px; color:#f59e0b; margin:0 0 10px 0;">💡 实战场景与解决方案 (${scenarios.length})</h4>
          ${scenarios.map(sc => `
            <div style="background:rgba(245,158,11,0.05); border:1px solid rgba(245,158,11,0.2); border-radius:8px; padding:12px; margin-bottom:10px;">
              <div style="font-weight:600; font-size:13px; color:#fcd34d; margin-bottom:4px;">Q: ${escapeHtml(sc.problem)}</div>
              <div style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">${escapeHtml(sc.explanation)}</div>
              ${sc.commands.map(c => `
                <div style="background:rgba(0,0,0,0.4); padding:6px 10px; border-radius:4px; font-family:var(--font-mono); font-size:12px; color:#34d399; margin-bottom:4px; border:1px solid rgba(255,255,255,0.05);">${escapeHtml(c)}</div>
              `).join("")}
            </div>
          `).join("")}
        </div>
      `;
    }

    if (commands.length === 0 && scenarios.length === 0) {
      cmdHtml = `<div style="text-align:center; padding:24px; color:var(--text-muted); font-size:13px;">未匹配到相关 Git 命令或场景</div>`;
    }

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: Git 命令检索</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">
          匹配命令: <strong style="color:#38bdf8;">${commands.length}</strong> 条 | 场景对策: <strong style="color:#f59e0b;">${scenarios.length}</strong> 条
        </div>
        <div style="max-height:360px; overflow-y:auto; padding-right:4px;">
          ${cmdHtml}
          ${scenHtml}
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>执行失败:</strong> ${escapeHtml(err.message)}
      </div>
    `, 500);
  }
});

// API: 随机端口生成（支持 HTMX 与 JSON）
app.post("/api/backend/port/generate", async (c) => {
  try {
    const contentType = c.req.header("Content-Type") || "";
    let count = 1;
    let range = "ephemeral";
    let minPort = 1024;
    let maxPort = 65535;
    let excludeWellKnown = true;

    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      if (json.count !== undefined) count = parseInt(json.count, 10) || 1;
      if (json.range) range = json.range.toString();
      if (json.minPort !== undefined) minPort = parseInt(json.minPort, 10);
      if (json.maxPort !== undefined) maxPort = parseInt(json.maxPort, 10);
      if (json.excludeWellKnown !== undefined) excludeWellKnown = Boolean(json.excludeWellKnown);
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      if (body.count !== undefined) count = parseInt(body.count, 10) || 1;
      if (body.range) range = body.range.toString();
      if (body.minPort !== undefined) minPort = parseInt(body.minPort, 10);
      if (body.maxPort !== undefined) maxPort = parseInt(body.maxPort, 10);
      if (body.excludeWellKnown !== undefined) excludeWellKnown = body.excludeWellKnown === "on" || body.excludeWellKnown === "true";
    }

    if (!randomPortEngine) {
      throw new Error("random-port WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const seed = Date.now();
    const response = randomPortEngine.dispatch({
      action: "port/generate",
      requestId: `srv-${Date.now()}`,
      params: { count, range, minPort, maxPort, excludeWellKnown, seed }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>生成失败:</strong> ${escapeHtml(response.msg)}
        </div>
      `, 400);
    }

    const d = response.data;
    const cards = d.ports.map(p => `
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:12px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:20px; font-weight:800; font-family:var(--font-mono); color:#38bdf8;">:${p.port}</span>
            <span style="font-size:11px; padding:2px 6px; border-radius:4px; background:rgba(255,255,255,0.06); color:var(--text-muted);">${escapeHtml(p.range_type)}</span>
            <span style="font-size:11px; padding:2px 6px; border-radius:4px; background:rgba(52,211,153,0.15); color:#34d399;">${escapeHtml(p.conflict_risk)}</span>
          </div>
          ${p.service ? `<div style="font-size:12px; color:#f59e0b; margin-top:4px;">服务冲突提示: ${escapeHtml(p.service)} (${escapeHtml(p.protocol || "")})</div>` : ''}
          ${p.description ? `<div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${escapeHtml(p.description)}</div>` : ''}
        </div>
        <button type="button" class="btn-copy" style="padding:4px 10px; font-size:11px; background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:4px; cursor:pointer;" onclick="navigator.clipboard.writeText('${p.port}'); this.innerText='已复制!'; setTimeout(()=>this.innerText='复制端口', 1500)">复制端口</button>
      </div>
    `).join("");

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: 随机端口生成完成</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">
          生成数量: <strong style="color:#38bdf8;">${d.total}</strong> 个 | 约束范围: <code>${escapeHtml(d.range)}</code> | 避开已知服务: <strong>${excludeWellKnown ? '开启' : '关闭'}</strong>
        </div>
        <div>${cards}</div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>执行失败:</strong> ${escapeHtml(err.message)}
      </div>
    `, 500);
  }
});

// API: 端口反查诊断与风险评估
app.get("/api/backend/port/lookup", async (c) => {
  try {
    if (!randomPortEngine) {
      throw new Error("random-port WASM 引擎未就绪");
    }
    const port = parseInt(c.req.query("port") || "80", 10);
    const response = randomPortEngine.dispatch({
      action: "port/lookup",
      requestId: `srv-${Date.now()}`,
      params: { port }
    });
    return c.json(response);
  } catch (err) {
    return c.json({ code: 500, msg: err.message, data: null }, 500);
  }
});

// API: 常用开发端口预设
app.get("/api/backend/port/samples", async (c) => {
  try {
    if (!randomPortEngine) {
      throw new Error("random-port WASM 引擎未就绪");
    }
    const response = randomPortEngine.dispatch({
      action: "port/samples",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    return c.json(response);
  } catch (err) {
    return c.json({ code: 500, msg: err.message, data: null }, 500);
  }
});

// API: 文本差异对比 (Text Diff)
app.post("/api/backend/diff/compare", async (c) => {
  try {
    const contentType = c.req.header("Content-Type") || "";
    let oldText = "";
    let newText = "";
    let mode = "lines";

    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      oldText = (json.oldText || "").toString();
      newText = (json.newText || "").toString();
      if (json.mode) mode = json.mode.toString();
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      oldText = (body.oldText || "").toString();
      newText = (body.newText || "").toString();
      if (body.mode) mode = body.mode.toString();
    }

    if (!textDiffEngine) {
      throw new Error("text-diff WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = textDiffEngine.dispatch({
      action: "diff/compare",
      requestId: `srv-${Date.now()}`,
      params: { oldText, newText, mode }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>Diff 失败:</strong> ${escapeHtml(response.msg)}
        </div>
      `, 400);
    }

    const d = response.data;
    const similarityPct = (d.similarity * 100).toFixed(1);

    const diffRows = d.changes.map(ch => {
      let bg = "transparent";
      let color = "#e2e8f0";
      let sign = " ";
      let signColor = "var(--text-muted)";

      if (ch.tag === "insert") {
        bg = "rgba(34, 197, 94, 0.12)";
        color = "#86efac";
        sign = "+";
        signColor = "#22c55e";
      } else if (ch.tag === "delete") {
        bg = "rgba(239, 68, 68, 0.12)";
        color = "#fca5a5";
        sign = "-";
        signColor = "#ef4444";
      }

      const oNum = ch.oldLine !== null && ch.oldLine !== undefined ? ch.oldLine : "";
      const nNum = ch.newLine !== null && ch.newLine !== undefined ? ch.newLine : "";

      return `
        <tr style="background:${bg}; font-family:var(--font-mono); font-size:12px; line-height:1.5;">
          <td style="width:36px; user-select:none; text-align:right; padding:1px 6px; color:var(--text-muted); opacity:0.6; border-right:1px solid rgba(255,255,255,0.06);">${oNum}</td>
          <td style="width:36px; user-select:none; text-align:right; padding:1px 6px; color:var(--text-muted); opacity:0.6; border-right:1px solid rgba(255,255,255,0.06);">${nNum}</td>
          <td style="width:20px; user-select:none; text-align:center; font-weight:700; color:${signColor};">${sign}</td>
          <td style="padding:1px 8px; color:${color}; white-space:pre-wrap; word-break:break-all;">${escapeHtml(ch.value)}</td>
        </tr>
      `;
    }).join("");

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: Myers 极速文本比对</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:12px; font-size:12px; align-items:center;">
          <span style="color:#22c55e; font-weight:600;">+${d.additions} 新增</span>
          <span style="color:#ef4444; font-weight:600;">-${d.deletions} 删除</span>
          <span style="color:var(--text-muted);">= ${d.unchanged} 未变</span>
          <span style="color:#38bdf8;">相似度: <strong>${similarityPct}%</strong></span>
          <span style="color:var(--text-muted);">比对模式: <code>${escapeHtml(d.mode)}</code></span>
        </div>
        <div style="max-height:300px; overflow-y:auto; background:rgba(0,0,0,0.35); border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
          <table style="width:100%; border-collapse:collapse;">
            <tbody>${diffRows}</tbody>
          </table>
        </div>
        <details style="margin-top:10px;">
          <summary style="font-size:11px; color:var(--text-muted); cursor:pointer;">查看标准 Unified Diff Patch 补丁</summary>
          <pre style="margin-top:6px; max-height:160px; overflow-y:auto; background:rgba(0,0,0,0.5); padding:8px 12px; border-radius:4px; font-family:var(--font-mono); font-size:11px; color:#a5f3fc;">${escapeHtml(d.unifiedPatch || "无差异")}</pre>
        </details>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>执行失败:</strong> ${escapeHtml(err.message)}
      </div>
    `, 500);
  }
});

// API: 获取 Diff 示例样本
app.get("/api/backend/diff/samples", async (c) => {
  try {
    if (!textDiffEngine) {
      throw new Error("text-diff WASM 引擎未就绪");
    }
    const response = textDiffEngine.dispatch({
      action: "diff/samples",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    return c.json(response);
  } catch (err) {
    return c.json({ code: 500, msg: err.message, data: null }, 500);
  }
});

// API: 文本指标与词频统计分析 (Text Statistics)
app.post("/api/backend/text/stats", async (c) => {
  try {
    const contentType = c.req.header("Content-Type") || "";
    let text = "";

    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      text = (json.text || "").toString();
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      text = (body.text || "").toString();
    }

    if (!textStatisticsEngine) {
      throw new Error("text-statistics WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = textStatisticsEngine.dispatch({
      action: "text/stats",
      requestId: `srv-${Date.now()}`,
      params: { text }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>分析失败:</strong> ${escapeHtml(response.msg)}
        </div>
      `, 400);
    }

    const d = response.data;
    const topWordBadges = d.topWords.map(tw => `
      <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:6px 10px; display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span style="font-family:var(--font-mono); font-size:12px; color:#38bdf8; font-weight:600;">${escapeHtml(tw.word)}</span>
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:11px; color:#34d399;">${tw.count} 次</span>
          <span style="font-size:11px; color:var(--text-muted);">(${tw.percentage.toFixed(1)}%)</span>
        </div>
      </div>
    `).join("");

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: 文本全维统计分析</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:8px; margin-bottom:14px;">
          <div style="background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.2); border-radius:6px; padding:8px 10px;">
            <div style="font-size:11px; color:var(--text-muted);">总字符数</div>
            <div style="font-size:18px; font-weight:700; color:#38bdf8; font-family:var(--font-mono);">${d.totalCharacters}</div>
          </div>
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:8px 10px;">
            <div style="font-size:11px; color:var(--text-muted);">不计空格字符</div>
            <div style="font-size:18px; font-weight:700; color:#f1f5f9; font-family:var(--font-mono);">${d.charactersNoSpaces}</div>
          </div>
          <div style="background:rgba(52,211,153,0.08); border:1px solid rgba(52,211,153,0.2); border-radius:6px; padding:8px 10px;">
            <div style="font-size:11px; color:var(--text-muted);">词数 (总计)</div>
            <div style="font-size:18px; font-weight:700; color:#34d399; font-family:var(--font-mono);">${d.totalWords}</div>
          </div>
          <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2); border-radius:6px; padding:8px 10px;">
            <div style="font-size:11px; color:var(--text-muted);">中日韩字数 (CJK)</div>
            <div style="font-size:18px; font-weight:700; color:#f59e0b; font-family:var(--font-mono);">${d.cjkCharacters}</div>
          </div>
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:8px 10px;">
            <div style="font-size:11px; color:var(--text-muted);">行数 / 段落</div>
            <div style="font-size:18px; font-weight:700; color:#f1f5f9; font-family:var(--font-mono);">${d.totalLines} / ${d.paragraphsCount}</div>
          </div>
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:6px; padding:8px 10px;">
            <div style="font-size:11px; color:var(--text-muted);">句子总数</div>
            <div style="font-size:18px; font-weight:700; color:#f1f5f9; font-family:var(--font-mono);">${d.sentencesCount}</div>
          </div>
        </div>

        <div style="display:flex; gap:16px; flex-wrap:wrap; margin-bottom:14px; font-size:12px;">
          <div style="background:rgba(14,165,233,0.1); border:1px solid rgba(14,165,233,0.3); border-radius:6px; padding:6px 12px; display:flex; align-items:center; gap:6px;">
            <span style="color:#38bdf8;">📖 预估阅读用时:</span>
            <strong style="color:#f8fafc;">${escapeHtml(d.readingTimeFormatted)}</strong>
            <span style="font-size:11px; color:var(--text-muted);">(~225 wpm)</span>
          </div>
          <div style="background:rgba(168,85,247,0.1); border:1px solid rgba(168,85,247,0.3); border-radius:6px; padding:6px 12px; display:flex; align-items:center; gap:6px;">
            <span style="color:#c084fc;">🎙️ 预估演讲朗读用时:</span>
            <strong style="color:#f8fafc;">${escapeHtml(d.speakingTimeFormatted)}</strong>
            <span style="font-size:11px; color:var(--text-muted);">(~140 wpm)</span>
          </div>
        </div>

        ${d.topWords.length > 0 ? `
          <div>
            <div style="font-size:12px; color:var(--text-muted); margin-bottom:8px; font-weight:600;">高频词分布 (Top Words):</div>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:8px;">
              ${topWordBadges}
            </div>
          </div>
        ` : ''}
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>执行失败:</strong> ${escapeHtml(err.message)}
      </div>
    `, 500);
  }
});

// API: 获取文本统计样本
app.get("/api/backend/text/samples", async (c) => {
  try {
    if (!textStatisticsEngine) {
      throw new Error("text-statistics WASM 引擎未就绪");
    }
    const response = textStatisticsEngine.dispatch({
      action: "text/samples",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    return c.json(response);
  } catch (err) {
    return c.json({ code: 500, msg: err.message, data: null }, 500);
  }
});

// API: 敏感字符串脱敏与混淆处理 (String Obfuscator)
app.post("/api/backend/obfuscate/process", async (c) => {
  try {
    const contentType = c.req.header("Content-Type") || "";
    let action = "obfuscate/mask";
    let text = "";
    let strategy = "email";
    let mode = "leet";
    let maskChar = "*";
    let unmaskedPrefix = 2;
    let unmaskedSuffix = 2;

    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      action = json.action || "obfuscate/mask";
      text = (json.text || "").toString();
      strategy = json.strategy || "email";
      mode = json.mode || "leet";
      maskChar = json.maskChar || "*";
      unmaskedPrefix = typeof json.unmaskedPrefix === "number" ? json.unmaskedPrefix : 2;
      unmaskedSuffix = typeof json.unmaskedSuffix === "number" ? json.unmaskedSuffix : 2;
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      const opType = (body.opType || "mask").toString();
      if (opType === "sanitize") {
        action = "obfuscate/sanitize-log";
      } else if (opType === "transform") {
        action = "obfuscate/transform";
      } else {
        action = "obfuscate/mask";
      }
      text = (body.text || "").toString();
      strategy = (body.strategy || "email").toString();
      mode = (body.mode || "leet").toString();
      maskChar = (body.maskChar || "*").toString().charAt(0) || "*";
      unmaskedPrefix = parseInt(body.unmaskedPrefix || "2", 10);
      unmaskedSuffix = parseInt(body.unmaskedSuffix || "2", 10);
    }

    if (!stringObfuscatorEngine) {
      throw new Error("string-obfuscator WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = stringObfuscatorEngine.dispatch({
      action,
      requestId: `srv-${Date.now()}`,
      params: {
        text,
        strategy,
        mode,
        maskChar,
        unmaskedPrefix,
        unmaskedSuffix,
      }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>处理失败:</strong> ${escapeHtml(response.msg)}
        </div>
      `, 400);
    }

    const d = response.data;

    if (action === "obfuscate/sanitize-log") {
      const detectionsHtml = d.detections.length > 0 ? `
        <div style="margin-top:10px;">
          <div style="font-size:12px; color:var(--text-muted); margin-bottom:6px; font-weight:600;">已捕获并脱敏敏感特征项清单 (${d.redactionsCount} 项):</div>
          <div style="max-height:160px; overflow-y:auto; display:flex; flex-direction:column; gap:4px;">
            ${d.detections.map(det => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:4px; padding:4px 8px; font-size:11px; font-family:var(--font-mono);">
                <div>
                  <span style="color:#f59e0b; font-weight:600;">[行 ${det.line}]</span>
                  <span style="color:#38bdf8; margin-left:6px;">${escapeHtml(det.kind)}:</span>
                </div>
                <div style="display:flex; gap:8px;">
                  <span style="color:var(--text-muted); text-decoration:line-through;">${escapeHtml(det.original)}</span>
                  <span style="color:#34d399; font-weight:600;">➜ ${escapeHtml(det.masked)}</span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      ` : `<div style="font-size:12px; color:#34d399; margin-top:8px;">✅ 未在文本中检测到已知的高危敏感格式。</div>`;

      return c.html(`
        <div class="result-box">
          <div class="result-header">
            <span class="tag tag-rust">🦀 Rust WASM: 全局日志敏感词脱敏完成</span>
            <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
          </div>
          <textarea readonly style="width:100%; padding:10px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:6px; font-family:var(--font-mono); font-size:12px; color:#34d399; box-sizing:border-box; resize:vertical;" rows="5">${escapeHtml(d.sanitizedText)}</textarea>
          ${detectionsHtml}
        </div>
      `);
    } else if (action === "obfuscate/transform") {
      return c.html(`
        <div class="result-box">
          <div class="result-header">
            <span class="tag tag-rust">🦀 Rust WASM: 字符混淆转换完成 (${escapeHtml(d.mode)})</span>
            <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
          </div>
          <textarea readonly style="width:100%; padding:10px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:6px; font-family:var(--font-mono); font-size:13px; color:#38bdf8; box-sizing:border-box; resize:vertical;" rows="4">${escapeHtml(d.result)}</textarea>
        </div>
      `);
    } else {
      return c.html(`
        <div class="result-box">
          <div class="result-header">
            <span class="tag tag-rust">🦀 Rust WASM: 单项脱敏完成 (${escapeHtml(d.strategy)})</span>
            <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
          </div>
          <div style="margin-bottom:8px; font-size:12px; color:var(--text-muted);">
            原文本长度: <strong>${d.originalLength} 字符</strong>
          </div>
          <input type="text" readonly value="${escapeHtml(d.maskedText)}" style="width:100%; padding:10px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:6px; font-family:var(--font-mono); font-size:14px; color:#34d399; box-sizing:border-box;" />
        </div>
      `);
    }
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>执行失败:</strong> ${escapeHtml(err.message)}
      </div>
    `, 500);
  }
});

// API: 获取脱敏与混淆预设示例
app.get("/api/backend/obfuscate/samples", async (c) => {
  try {
    if (!stringObfuscatorEngine) {
      throw new Error("string-obfuscator WASM 引擎未就绪");
    }
    const response = stringObfuscatorEngine.dispatch({
      action: "obfuscate/samples",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    return c.json(response);
  } catch (err) {
    return c.json({ code: 500, msg: err.message, data: null }, 500);
  }
});

// API: 假文占位排版生成器 (Lorem Ipsum Generator)
app.post("/api/backend/lorem/generate", async (c) => {
  try {
    const contentType = c.req.header("Content-Type") || "";
    let unit = "paragraphs";
    let count = 3;
    let startWithLorem = true;
    let format = "plain";
    let seed = null;

    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      unit = json.unit || "paragraphs";
      count = typeof json.count === "number" ? json.count : 3;
      startWithLorem = json.startWithLorem !== false;
      format = json.format || "plain";
      seed = typeof json.seed === "number" ? json.seed : null;
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      unit = (body.unit || "paragraphs").toString();
      count = parseInt(body.count || "3", 10) || 3;
      startWithLorem = body.startWithLorem === "true" || body.startWithLorem === "on" || body.startWithLorem === true;
      format = (body.format || "plain").toString();
      seed = body.seed ? parseInt(body.seed, 10) : null;
    }

    if (!loremIpsumEngine) {
      throw new Error("lorem-ipsum WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = loremIpsumEngine.dispatch({
      action: "lorem/generate",
      requestId: `srv-${Date.now()}`,
      params: {
        unit,
        count,
        startWithLorem,
        format,
        seed,
      }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>生成失败:</strong> ${escapeHtml(response.msg)}
        </div>
      `, 400);
    }

    const d = response.data;
    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: 假文排版生成成功 (${escapeHtml(d.format)})</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:10px; font-size:12px; color:var(--text-muted);">
          <span>段落数: <strong style="color:#38bdf8;">${d.paragraphsCount}</strong></span>
          <span>句子数: <strong style="color:#34d399;">${d.sentencesCount}</strong></span>
          <span>总词数: <strong style="color:#f59e0b;">${d.wordsCount}</strong></span>
          <span>字节数: <strong style="color:#c084fc;">${d.bytesCount} 字节</strong></span>
        </div>
        <textarea readonly style="width:100%; padding:10px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:6px; font-family:var(--font-mono); font-size:12px; color:#f8fafc; box-sizing:border-box; resize:vertical; line-height:1.6;" rows="7">${escapeHtml(d.text)}</textarea>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>执行失败:</strong> ${escapeHtml(err.message)}
      </div>
    `, 500);
  }
});

// API: 获取 Lorem Ipsum 预设
app.get("/api/backend/lorem/presets", async (c) => {
  try {
    if (!loremIpsumEngine) {
      throw new Error("lorem-ipsum WASM 引擎未就绪");
    }
    const response = loremIpsumEngine.dispatch({
      action: "lorem/presets",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    return c.json(response);
  } catch (err) {
    return c.json({ code: 500, msg: err.message, data: null }, 500);
  }
});

// API: ASCII 艺术艺术字画生成器 (ASCII Text Drawer)
app.post("/api/backend/ascii/render", async (c) => {
  try {
    const contentType = c.req.header("Content-Type") || "";
    let text = "WASM";
    let font = "standard";
    let fillChar = null;
    let letterSpacing = 1;

    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      text = (json.text || "WASM").toString();
      font = (json.font || "standard").toString();
      fillChar = json.fillChar ? json.fillChar.toString().charAt(0) : null;
      letterSpacing = typeof json.letterSpacing === "number" ? json.letterSpacing : 1;
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      text = (body.text || "WASM").toString();
      font = (body.font || "standard").toString();
      fillChar = body.fillChar ? body.fillChar.toString().charAt(0) : null;
      letterSpacing = parseInt(body.letterSpacing || "1", 10) || 1;
    }

    if (!asciiTextDrawerEngine) {
      throw new Error("ascii-text-drawer WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = asciiTextDrawerEngine.dispatch({
      action: "ascii/render",
      requestId: `srv-${Date.now()}`,
      params: {
        text,
        font,
        fillChar,
        letterSpacing,
      }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>渲染失败:</strong> ${escapeHtml(response.msg)}
        </div>
      `, 400);
    }

    const d = response.data;
    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: ASCII 横幅渲染完成 (${escapeHtml(d.font)})</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:10px; font-size:12px; color:var(--text-muted);">
          <span>字符数: <strong style="color:#38bdf8;">${d.charCount}</strong></span>
          <span>横幅宽度: <strong style="color:#34d399;">${d.width} 字符</strong></span>
          <span>横幅高度: <strong style="color:#f59e0b;">${d.height} 行</strong></span>
        </div>
        <pre style="width:100%; padding:14px; background:#020617; border:1px solid rgba(56,189,248,0.2); border-radius:6px; font-family:var(--font-mono); font-size:11px; color:#38bdf8; box-sizing:border-box; overflow-x:auto; line-height:1.2; font-weight:700;">${escapeHtml(d.renderedText)}</pre>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>执行失败:</strong> ${escapeHtml(err.message)}
      </div>
    `, 500);
  }
});

// API: 获取 ASCII 艺术字预设
app.get("/api/backend/ascii/presets", async (c) => {
  try {
    if (!asciiTextDrawerEngine) {
      throw new Error("ascii-text-drawer WASM 引擎未就绪");
    }
    const response = asciiTextDrawerEngine.dispatch({
      action: "ascii/presets",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    return c.json(response);
  } catch (err) {
    return c.json({ code: 500, msg: err.message, data: null }, 500);
  }
});

// API: 字符数字缩写器 (Numeronym Generator)
app.post("/api/backend/numeronym/generate", async (c) => {
  try {
    const contentType = c.req.header("Content-Type") || "";
    let text = "internationalization";
    let minLen = 4;
    let mode = "text";

    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      text = (json.text || "internationalization").toString();
      minLen = typeof json.minLen === "number" ? json.minLen : 4;
      mode = (json.mode || "text").toString();
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      text = (body.text || "internationalization").toString();
      minLen = parseInt(body.minLen || "4", 10) || 4;
      mode = (body.mode || "text").toString();
    }

    if (!numeronymGeneratorEngine) {
      throw new Error("numeronym-generator WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = numeronymGeneratorEngine.dispatch({
      action: "numeronym/generate",
      requestId: `srv-${Date.now()}`,
      params: {
        text,
        minLen,
        mode,
      }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>缩写生成失败:</strong> ${escapeHtml(response.msg)}
        </div>
      `, 400);
    }

    const d = response.data;
    const tableRows = d.items.map(it => `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
        <td style="padding:6px 10px; font-family:var(--font-mono); color:#f8fafc;">${escapeHtml(it.original)}</td>
        <td style="padding:6px 10px; font-family:var(--font-mono); color:#38bdf8; font-weight:700;">${escapeHtml(it.numeronym)}</td>
        <td style="padding:6px 10px; color:#f59e0b; font-family:var(--font-mono);">${it.omittedCount} 个字母</td>
        <td style="padding:6px 10px; color:#34d399; font-family:var(--font-mono);">-${it.savingsPercent}%</td>
      </tr>
    `).join("");

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: 数字缩写生成完成 (${escapeHtml(mode)})</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:10px; font-size:12px; color:var(--text-muted);">
          <span>总词数: <strong style="color:#f8fafc;">${d.totalWords}</strong></span>
          <span>缩写词数: <strong style="color:#38bdf8;">${d.abbreviatedWords}</strong></span>
        </div>
        <textarea readonly style="width:100%; padding:10px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:6px; font-family:var(--font-mono); font-size:13px; color:#34d399; box-sizing:border-box; resize:vertical; line-height:1.5;" rows="4">${escapeHtml(d.transformedText)}</textarea>
        ${d.items.length > 0 ? `
          <div style="margin-top:12px; max-height:180px; overflow-y:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:11px; text-align:left;">
              <thead>
                <tr style="color:var(--text-muted); border-bottom:1px solid rgba(255,255,255,0.1);">
                  <th style="padding:4px 10px;">原词</th>
                  <th style="padding:4px 10px;">数字缩写</th>
                  <th style="padding:4px 10px;">省略字母</th>
                  <th style="padding:4px 10px;">字符节约率</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>
        ` : ''}
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>执行失败:</strong> ${escapeHtml(err.message)}
      </div>
    `, 500);
  }
});

// API: 获取缩写预设
app.get("/api/backend/numeronym/presets", async (c) => {
  try {
    if (!numeronymGeneratorEngine) {
      throw new Error("numeronym-generator WASM 引擎未就绪");
    }
    const response = numeronymGeneratorEngine.dispatch({
      action: "numeronym/presets",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    return c.json(response);
  } catch (err) {
    return c.json({ code: 500, msg: err.message, data: null }, 500);
  }
});

// API: 常见技术数字缩写词典速查
app.get("/api/backend/numeronym/lookup", async (c) => {
  try {
    const query = c.req.query("query") || "";
    if (!numeronymGeneratorEngine) {
      throw new Error("numeronym-generator WASM 引擎未就绪");
    }
    const response = numeronymGeneratorEngine.dispatch({
      action: "numeronym/lookup",
      requestId: `srv-${Date.now()}`,
      params: { query }
    });
    return c.json(response);
  } catch (err) {
    return c.json({ code: 500, msg: err.message, data: null }, 500);
  }
});

// API: 表情符号选择与检索器 (Emoji Picker)
app.post("/api/backend/emoji/search", async (c) => {
  try {
    const contentType = c.req.header("Content-Type") || "";
    let query = "";
    let category = null;
    let limit = 50;

    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      query = (json.query || "").toString();
      category = json.category ? json.category.toString() : null;
      limit = typeof json.limit === "number" ? json.limit : 50;
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      query = (body.query || "").toString();
      category = body.category && body.category !== "all" ? body.category.toString() : null;
      limit = parseInt(body.limit || "50", 10) || 50;
    }

    if (!emojiPickerEngine) {
      throw new Error("emoji-picker WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = emojiPickerEngine.dispatch({
      action: "emoji/search",
      requestId: `srv-${Date.now()}`,
      params: {
        query,
        category,
        limit,
      }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>表情检索失败:</strong> ${escapeHtml(response.msg)}
        </div>
      `, 400);
    }

    const d = response.data;
    const cards = d.emojis.map(e => `
      <div style="background:#0f172a; border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:10px; display:flex; flex-direction:column; align-items:center; text-align:center; transition:all 0.2s;" title="${escapeHtml(e.name)} (${e.unicode})">
        <span style="font-size:32px; line-height:1; margin-bottom:6px; cursor:pointer;" onclick="navigator.clipboard.writeText('${e.emoji}')">${e.emoji}</span>
        <span style="font-size:11px; font-weight:600; color:#f8fafc; max-width:90px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(e.name)}</span>
        <span style="font-size:10px; color:#38bdf8; font-family:var(--font-mono); margin-top:2px;">${escapeHtml(e.shortcode)}</span>
      </div>
    `).join("");

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: 表情检索成功 (${d.total} 项匹配)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:12px; font-size:12px; color:var(--text-muted);">
          <span>搜索词: <strong style="color:#f8fafc;">${escapeHtml(d.query || "全部")}</strong></span>
          <span>分类过滤: <strong style="color:#34d399;">${escapeHtml(d.category || "全部")}</strong></span>
          <span>点击表情即可复制到剪贴板</span>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap:10px; max-height:280px; overflow-y:auto; padding:4px;">
          ${cards}
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>执行失败:</strong> ${escapeHtml(err.message)}
      </div>
    `, 500);
  }
});

// API: 获取 Emoji 类别清单
app.get("/api/backend/emoji/categories", async (c) => {
  try {
    if (!emojiPickerEngine) {
      throw new Error("emoji-picker WASM 引擎未就绪");
    }
    const response = emojiPickerEngine.dispatch({
      action: "emoji/categories",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    return c.json(response);
  } catch (err) {
    return c.json({ code: 500, msg: err.message, data: null }, 500);
  }
});

// API: 获取 Emoji 精选合集
app.get("/api/backend/emoji/presets", async (c) => {
  try {
    if (!emojiPickerEngine) {
      throw new Error("emoji-picker WASM 引擎未就绪");
    }
    const response = emojiPickerEngine.dispatch({
      action: "emoji/presets",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    return c.json(response);
  } catch (err) {
    return c.json({ code: 500, msg: err.message, data: null }, 500);
  }
});

// API: JWT 令牌解析与声明检验 (JWT Parser)
app.post("/api/backend/jwt/parse", async (c) => {
  try {
    const contentType = c.req.header("Content-Type") || "";
    let token = "";
    let currentTime = Math.floor(Date.now() / 1000);

    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      token = (json.token || "").toString();
      if (typeof json.currentTime === "number") {
        currentTime = json.currentTime;
      }
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      token = (body.token || "").toString();
      if (body.currentTime) {
        currentTime = parseInt(body.currentTime, 10) || currentTime;
      }
    }

    if (!jwtParserEngine) {
      throw new Error("jwt-parser WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = jwtParserEngine.dispatch({
      action: "jwt/parse",
      requestId: `srv-${Date.now()}`,
      params: {
        token,
        currentTime,
      }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>JWT 解析失败:</strong> ${escapeHtml(response.msg)}
        </div>
      `, 400);
    }

    const d = response.data;
    const claimsRows = d.claims.map(cl => {
      let badge = '<span style="color:#94a3b8;">信息</span>';
      if (cl.status === "valid") badge = '<span style="color:#34d399; font-weight:600;">有效 (Active)</span>';
      else if (cl.status === "expired") badge = '<span style="color:#ef4444; font-weight:600;">已过期 (Expired)</span>';
      else if (cl.status === "not_yet_valid") badge = '<span style="color:#f59e0b; font-weight:600;">尚未生效 (NBF)</span>';

      return `
        <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
          <td style="padding:6px 10px; font-family:var(--font-mono); color:#38bdf8; font-weight:600;">${escapeHtml(cl.name)}</td>
          <td style="padding:6px 10px; font-family:var(--font-mono); color:#f8fafc;">${escapeHtml(JSON.stringify(cl.value))}</td>
          <td style="padding:6px 10px; color:var(--text-muted); font-size:11px;">${escapeHtml(cl.description)}</td>
          <td style="padding:6px 10px;">${badge}</td>
        </tr>
      `;
    }).join("");

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: JWT 解析成功 (${escapeHtml(d.algorithm)} / ${escapeHtml(d.tokenType)})</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:12px; font-size:12px; color:var(--text-muted);">
          <span>签名算法: <strong style="color:#38bdf8;">${escapeHtml(d.algorithm)}</strong></span>
          <span>令牌类型: <strong style="color:#34d399;">${escapeHtml(d.tokenType)}</strong></span>
          <span>时间状态: <strong>${d.isValidTime === false || d.is_valid_time === false ? '<span style="color:#ef4444;">时间异常/已过期</span>' : '<span style="color:#34d399;">时间校验正常</span>'}</strong></span>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:12px;">
          <div>
            <div style="font-size:11px; color:#38bdf8; font-weight:600; margin-bottom:4px;">Header 头部声明:</div>
            <pre style="padding:10px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:6px; font-family:var(--font-mono); font-size:11px; color:#38bdf8; overflow-x:auto;">${escapeHtml(d.formattedHeader)}</pre>
          </div>
          <div>
            <div style="font-size:11px; color:#34d399; font-weight:600; margin-bottom:4px;">Payload 载荷声明:</div>
            <pre style="padding:10px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:6px; font-family:var(--font-mono); font-size:11px; color:#34d399; overflow-x:auto;">${escapeHtml(d.formattedPayload)}</pre>
          </div>
        </div>

        ${d.claims.length > 0 ? `
          <div style="margin-top:12px;">
            <div style="font-size:11px; color:var(--text-muted); font-weight:600; margin-bottom:4px;">核心声明审计表:</div>
            <table style="width:100%; border-collapse:collapse; font-size:11px; text-align:left;">
              <thead>
                <tr style="color:var(--text-muted); border-bottom:1px solid rgba(255,255,255,0.1);">
                  <th style="padding:4px 10px;">声明</th>
                  <th style="padding:4px 10px;">值</th>
                  <th style="padding:4px 10px;">解析描述</th>
                  <th style="padding:4px 10px;">校验状态</th>
                </tr>
              </thead>
              <tbody>
                ${claimsRows}
              </tbody>
            </table>
          </div>
        ` : ''}

        <div style="margin-top:10px; font-size:11px; color:var(--text-muted);">
          <span>数字签名 (Base64URL): </span><code style="font-family:var(--font-mono); color:#f59e0b;">${escapeHtml(d.signature)}</code>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>执行失败:</strong> ${escapeHtml(err.message)}
      </div>
    `, 500);
  }
});

// API: 获取 JWT 预设示例
app.get("/api/backend/jwt/presets", async (c) => {
  try {
    if (!jwtParserEngine) {
      throw new Error("jwt-parser WASM 引擎未就绪");
    }
    const response = jwtParserEngine.dispatch({
      action: "jwt/presets",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    return c.json(response);
  } catch (err) {
    return c.json({ code: 500, msg: err.message, data: null }, 500);
  }
});

// API: TOTP / HOTP 双因子动态令牌计算 (OTP Generator)
app.post("/api/backend/otp/totp", async (c) => {
  try {
    const contentType = c.req.header("Content-Type") || "";
    let secret = "JBSWY3DPEHPK3PXP";
    let digits = 6;
    let period = 30;
    let currentTime = Math.floor(Date.now() / 1000);

    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      if (json.secret) secret = json.secret.toString();
      if (json.digits) digits = parseInt(json.digits, 10) || 6;
      if (json.period) period = parseInt(json.period, 10) || 30;
      if (json.currentTime) currentTime = parseInt(json.currentTime, 10) || currentTime;
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      if (body.secret) secret = body.secret.toString();
      if (body.digits) digits = parseInt(body.digits, 10) || 6;
      if (body.period) period = parseInt(body.period, 10) || 30;
      if (body.currentTime) currentTime = parseInt(body.currentTime, 10) || currentTime;
    }

    if (!otpGeneratorEngine) {
      throw new Error("otp-generator WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = otpGeneratorEngine.dispatch({
      action: "otp/totp",
      requestId: `srv-${Date.now()}`,
      params: {
        secret,
        digits,
        period,
        currentTime,
      }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>OTP 生成失败:</strong> ${escapeHtml(response.msg)}
        </div>
      `, 400);
    }

    const d = response.data;

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: TOTP 生成成功 (RFC 6238 / ${d.digits} 位)</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; flex-direction:column; align-items:center; margin:16px 0;">
          <div style="font-family:var(--font-mono); font-size:36px; font-weight:800; letter-spacing:6px; color:#38bdf8; background:rgba(0,0,0,0.4); padding:10px 24px; border-radius:8px; border:1px solid rgba(56,189,248,0.3); text-shadow:0 0 12px rgba(56,189,248,0.4);">
            ${escapeHtml(d.code)}
          </div>
          <div style="margin-top:10px; font-size:12px; color:var(--text-muted); display:flex; gap:16px;">
            <span>有效周期: <strong style="color:#34d399;">${d.periodSeconds} 秒</strong></span>
            <span>当前时间步剩余: <strong style="color:#f59e0b;">${d.remainingSeconds} 秒</strong></span>
            <span>计数器步数: <strong style="color:#c084fc;">#${d.counter}</strong></span>
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-muted); padding-top:6px; border-top:1px solid rgba(255,255,255,0.06);">
          <span>算法标准: RFC 6238 HMAC-SHA1</span>
          <span>有效截止时间戳: ${d.validUntil}</span>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>执行失败:</strong> ${escapeHtml(err.message)}
      </div>
    `, 500);
  }
});

// API: TOTP 口令验证
app.post("/api/backend/otp/verify", async (c) => {
  try {
    const json = await c.req.json().catch(() => ({}));
    if (!otpGeneratorEngine) {
      throw new Error("otp-generator WASM 引擎未就绪");
    }
    const response = otpGeneratorEngine.dispatch({
      action: "otp/verify",
      requestId: `srv-${Date.now()}`,
      params: {
        secret: json.secret || "JBSWY3DPEHPK3PXP",
        code: json.code || "",
        digits: json.digits || 6,
        period: json.period || 30,
        window: json.window ?? 1,
        currentTime: json.currentTime || Math.floor(Date.now() / 1000),
      }
    });
    return c.json(response);
  } catch (err) {
    return c.json({ code: 500, msg: err.message, data: null }, 500);
  }
});

// API: 获取 OTP 预设
app.get("/api/backend/otp/presets", async (c) => {
  try {
    if (!otpGeneratorEngine) {
      throw new Error("otp-generator WASM 引擎未就绪");
    }
    const response = otpGeneratorEngine.dispatch({
      action: "otp/presets",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    return c.json(response);
  } catch (err) {
    return c.json({ code: 500, msg: err.message, data: null }, 500);
  }
});

// API: URL 编码与解码 (URL Encoder/Decoder)
app.post("/api/backend/url/process", async (c) => {
  try {
    const contentType = c.req.header("Content-Type") || "";
    let text = "";
    let mode = "encode";
    let standard = "rfc3986";
    let plusAsSpace = true;

    if (contentType.includes("application/json")) {
      const json = await c.req.json().catch(() => ({}));
      text = (json.text || "").toString();
      if (json.mode) mode = json.mode.toString();
      if (json.standard) standard = json.standard.toString();
      if (json.plusAsSpace !== undefined) plusAsSpace = !!json.plusAsSpace;
    } else {
      const body = await c.req.parseBody().catch(() => ({}));
      text = (body.text || "").toString();
      if (body.mode) mode = body.mode.toString();
      if (body.standard) standard = body.standard.toString();
      if (body.plusAsSpace !== undefined) plusAsSpace = body.plusAsSpace === "true" || body.plusAsSpace === "1" || body.plusAsSpace === "on";
    }

    if (!urlEncoderDecoderEngine) {
      throw new Error("url-encoder-decoder WASM 引擎未就绪");
    }

    const t0 = performance.now();
    const response = urlEncoderDecoderEngine.dispatch({
      action: "url/process",
      requestId: `srv-${Date.now()}`,
      params: {
        text,
        mode,
        standard,
        plusAsSpace,
      }
    });
    const duration = (performance.now() - t0).toFixed(4);

    if (contentType.includes("application/json") && !c.req.header("HX-Request")) {
      return c.json(response);
    }

    if (response.code !== 0) {
      return c.html(`
        <div class="result-box error">
          <strong>URL 处理失败:</strong> ${escapeHtml(response.msg)}
        </div>
      `, 400);
    }

    const d = response.data;
    const modeBadge = d.mode === "encode" ? "编码 (Encode)" : "解码 (Decode)";

    return c.html(`
      <div class="result-box">
        <div class="result-header">
          <span class="tag tag-rust">🦀 Rust WASM: URL ${modeBadge} 成功 (${escapeHtml(d.standard.toUpperCase())})</span>
          <span class="badge-time">⚡ ${duration} ms (Hono 后端原生)</span>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:12px; font-size:12px; color:var(--text-muted);">
          <span>输入大小: <strong>${d.inputBytes} 字节</strong></span>
          <span>输出大小: <strong>${d.outputBytes} 字节</strong></span>
          <span>转换字符数: <strong style="color:#38bdf8;">${d.changedCount}</strong></span>
          <span>长度变化倍率: <strong style="color:#34d399;">${d.ratio}x</strong></span>
        </div>
        <div style="position:relative;">
          <pre style="padding:12px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:6px; font-family:var(--font-mono); font-size:12px; color:#38bdf8; overflow-x:auto; white-space:pre-wrap; word-break:break-all;">${escapeHtml(d.result)}</pre>
          <button type="button" onclick="navigator.clipboard.writeText(decodeURIComponent('${encodeURIComponent(d.result)}'))" style="position:absolute; top:8px; right:8px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:4px; padding:4px 8px; color:#f8fafc; font-size:11px; cursor:pointer;">复制结果</button>
        </div>
      </div>
    `);
  } catch (err) {
    return c.html(`
      <div class="result-box error">
        <strong>执行失败:</strong> ${escapeHtml(err.message)}
      </div>
    `, 500);
  }
});

// API: 获取 URL 预设
app.get("/api/backend/url/presets", async (c) => {
  try {
    if (!urlEncoderDecoderEngine) {
      throw new Error("url-encoder-decoder WASM 引擎未就绪");
    }
    const response = urlEncoderDecoderEngine.dispatch({
      action: "url/presets",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    return c.json(response);
  } catch (err) {
    return c.json({ code: 500, msg: err.message, data: null }, 500);
  }
});

// API: 获取 Markdown 示例
app.get("/api/backend/markdown/sample", async (c) => {
  try {
    if (!markdownToHtmlEngine) {
      throw new Error("markdown-to-html WASM 引擎未就绪");
    }
    const response = markdownToHtmlEngine.dispatch({
      action: "markdown/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.json(response.data);
  } catch (err) {
    return c.json({ sampleMarkdown: "# Hello WasmForge" }, 500);
  }
});

// API: 获取 Unicode 示例
app.get("/api/backend/unicode/sample", async (c) => {
  try {
    if (!textToUnicodeEngine) {
      throw new Error("text-to-unicode WASM 引擎未就绪");
    }
    const response = textToUnicodeEngine.dispatch({
      action: "unicode/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.json(response.data);
  } catch (err) {
    return c.json({ sampleText: "你好，WasmForge! 🚀", sampleEscape: "\\u4f60\\u597d" }, 500);
  }
});

// API: 获取 Binary 示例
app.get("/api/backend/text-binary/sample", async (c) => {
  try {
    if (!textToBinaryEngine) {
      throw new Error("text-to-binary WASM 引擎未就绪");
    }
    const response = textToBinaryEngine.dispatch({
      action: "binary/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.json(response.data);
  } catch (err) {
    return c.json({ sampleText: "WasmForge 2026", sampleBinary: "01010111 01100001" }, 500);
  }
});

// API: 获取 Roman 示例
app.get("/api/backend/roman/sample", async (c) => {
  try {
    if (!romanNumeralConverterEngine) {
      throw new Error("roman-numeral-converter WASM 引擎未就绪");
    }
    const response = romanNumeralConverterEngine.dispatch({
      action: "roman/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.json(response.data);
  } catch (err) {
    return c.json({ sampleArabic: 2026, sampleRoman: "MMXXVI" }, 500);
  }
});

// API: 获取 Base 示例
app.get("/api/backend/base/sample", async (c) => {
  try {
    if (!integerBaseConverterEngine) {
      throw new Error("integer-base-converter WASM 引擎未就绪");
    }
    const response = integerBaseConverterEngine.dispatch({
      action: "base/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.json(response.data);
  } catch (err) {
    return c.json({ sample: "0x7F_FF", detectedBase: 16 }, 500);
  }
});

// API: 获取 DateTime 示例
app.get("/api/backend/datetime/sample", async (c) => {
  try {
    if (!dateTimeConverterEngine) {
      throw new Error("date-time-converter WASM 引擎未就绪");
    }
    const response = dateTimeConverterEngine.dispatch({
      action: "datetime/sample",
      requestId: `srv-${Date.now()}`,
      params: {}
    });
    if (response.code !== 0) {
      throw new Error(response.msg || "获取示例失败");
    }
    return c.json(response.data);
  } catch (err) {
    return c.json({ sample: "2026-10-25 14:30:00" }, 500);
  }
});

// API: 模块统计信息
app.get("/api/stats", (c) => {
  const rsSize = fs.existsSync(rsWasmPath) ? fs.statSync(rsWasmPath).size : 0;
  const tsSize = fs.existsSync(tsWasmPath) ? fs.statSync(tsWasmPath).size : 0;
  const tokenSize = fs.existsSync(tokenWasmPath) ? fs.statSync(tokenWasmPath).size : 0;
  const hashSize = fs.existsSync(hashWasmPath) ? fs.statSync(hashWasmPath).size : 0;
  const bcryptSize = fs.existsSync(bcryptWasmPath) ? fs.statSync(bcryptWasmPath).size : 0;
  const uuidSize = fs.existsSync(uuidWasmPath) ? fs.statSync(uuidWasmPath).size : 0;
  const ulidSize = fs.existsSync(ulidWasmPath) ? fs.statSync(ulidWasmPath).size : 0;
  const encryptionSize = fs.existsSync(encryptionWasmPath) ? fs.statSync(encryptionWasmPath).size : 0;
  const bip39Size = fs.existsSync(bip39WasmPath) ? fs.statSync(bip39WasmPath).size : 0;
  const hmacSize = fs.existsSync(hmacWasmPath) ? fs.statSync(hmacWasmPath).size : 0;
  const rsaSize = fs.existsSync(rsaWasmPath) ? fs.statSync(rsaWasmPath).size : 0;
  const passwordStrengthSize = fs.existsSync(passwordStrengthWasmPath) ? fs.statSync(passwordStrengthWasmPath).size : 0;
  const pdfSignatureSize = fs.existsSync(pdfSignatureWasmPath) ? fs.statSync(pdfSignatureWasmPath).size : 0;
  const yamlToJsonSize = fs.existsSync(yamlToJsonWasmPath) ? fs.statSync(yamlToJsonWasmPath).size : 0;
  const yamlToTomlSize = fs.existsSync(yamlToTomlWasmPath) ? fs.statSync(yamlToTomlWasmPath).size : 0;
  const jsonToYamlSize = fs.existsSync(jsonToYamlWasmPath) ? fs.statSync(jsonToYamlWasmPath).size : 0;
  const jsonToTomlSize = fs.existsSync(jsonToTomlWasmPath) ? fs.statSync(jsonToTomlWasmPath).size : 0;
  const tomlToJsonSize = fs.existsSync(tomlToJsonWasmPath) ? fs.statSync(tomlToJsonWasmPath).size : 0;
  const tomlToYamlSize = fs.existsSync(tomlToYamlWasmPath) ? fs.statSync(tomlToYamlWasmPath).size : 0;
  const xmlToJsonSize = fs.existsSync(xmlToJsonWasmPath) ? fs.statSync(xmlToJsonWasmPath).size : 0;
  const jsonToXmlSize = fs.existsSync(jsonToXmlWasmPath) ? fs.statSync(jsonToXmlWasmPath).size : 0;
  const jsonToCsvSize = fs.existsSync(jsonToCsvWasmPath) ? fs.statSync(jsonToCsvWasmPath).size : 0;
  const base64StringSize = fs.existsSync(base64StringWasmPath) ? fs.statSync(base64StringWasmPath).size : 0;
  const base64FileSize = fs.existsSync(base64FileWasmPath) ? fs.statSync(base64FileWasmPath).size : 0;
  const colorConverterSize = fs.existsSync(colorConverterWasmPath) ? fs.statSync(colorConverterWasmPath).size : 0;
  const caseConverterSize = fs.existsSync(caseConverterWasmPath) ? fs.statSync(caseConverterWasmPath).size : 0;
  const dateTimeConverterSize = fs.existsSync(dateTimeConverterWasmPath) ? fs.statSync(dateTimeConverterWasmPath).size : 0;
  const integerBaseConverterSize = fs.existsSync(integerBaseConverterWasmPath) ? fs.statSync(integerBaseConverterWasmPath).size : 0;
  const romanNumeralConverterSize = fs.existsSync(romanNumeralConverterWasmPath) ? fs.statSync(romanNumeralConverterWasmPath).size : 0;
  const textToBinarySize = fs.existsSync(textToBinaryWasmPath) ? fs.statSync(textToBinaryWasmPath).size : 0;
  const textToUnicodeSize = fs.existsSync(textToUnicodeWasmPath) ? fs.statSync(textToUnicodeWasmPath).size : 0;
  const markdownToHtmlSize = fs.existsSync(markdownToHtmlWasmPath) ? fs.statSync(markdownToHtmlWasmPath).size : 0;
  const listConverterSize = fs.existsSync(listConverterWasmPath) ? fs.statSync(listConverterWasmPath).size : 0;
  const textToNatoSize = fs.existsSync(textToNatoWasmPath) ? fs.statSync(textToNatoWasmPath).size : 0;
  const sqlPrettifySize = fs.existsSync(sqlPrettifyWasmPath) ? fs.statSync(sqlPrettifyWasmPath).size : 0;
  const xmlFormatterSize = fs.existsSync(xmlFormatterWasmPath) ? fs.statSync(xmlFormatterWasmPath).size : 0;
  const jsonMinifySize = fs.existsSync(jsonMinifyWasmPath) ? fs.statSync(jsonMinifyWasmPath).size : 0;
  const jsonViewerSize = fs.existsSync(jsonViewerWasmPath) ? fs.statSync(jsonViewerWasmPath).size : 0;
  const yamlViewerSize = fs.existsSync(yamlViewerWasmPath) ? fs.statSync(yamlViewerWasmPath).size : 0;
  const regexTesterSize = fs.existsSync(regexTesterWasmPath) ? fs.statSync(regexTesterWasmPath).size : 0;
  const regexMemoSize = fs.existsSync(regexMemoWasmPath) ? fs.statSync(regexMemoWasmPath).size : 0;
  const crontabGeneratorSize = fs.existsSync(crontabGeneratorWasmPath) ? fs.statSync(crontabGeneratorWasmPath).size : 0;
  const chmodCalculatorSize = fs.existsSync(chmodCalculatorWasmPath) ? fs.statSync(chmodCalculatorWasmPath).size : 0;
  const dockerRunToComposeSize = fs.existsSync(dockerRunToComposeWasmPath) ? fs.statSync(dockerRunToComposeWasmPath).size : 0;
  const emailNormalizerSize = fs.existsSync(emailNormalizerWasmPath) ? fs.statSync(emailNormalizerWasmPath).size : 0;
  const gitMemoSize = fs.existsSync(gitMemoWasmPath) ? fs.statSync(gitMemoWasmPath).size : 0;
  const randomPortSize = fs.existsSync(randomPortWasmPath) ? fs.statSync(randomPortWasmPath).size : 0;
  const textDiffSize = fs.existsSync(textDiffWasmPath) ? fs.statSync(textDiffWasmPath).size : 0;
  const textStatisticsSize = fs.existsSync(textStatisticsWasmPath) ? fs.statSync(textStatisticsWasmPath).size : 0;
  const stringObfuscatorSize = fs.existsSync(stringObfuscatorWasmPath) ? fs.statSync(stringObfuscatorWasmPath).size : 0;
  const loremIpsumSize = fs.existsSync(loremIpsumWasmPath) ? fs.statSync(loremIpsumWasmPath).size : 0;
  const asciiTextDrawerSize = fs.existsSync(asciiTextDrawerWasmPath) ? fs.statSync(asciiTextDrawerWasmPath).size : 0;
  const numeronymGeneratorSize = fs.existsSync(numeronymGeneratorWasmPath) ? fs.statSync(numeronymGeneratorWasmPath).size : 0;
  const emojiPickerSize = fs.existsSync(emojiPickerWasmPath) ? fs.statSync(emojiPickerWasmPath).size : 0;
  const jwtParserSize = fs.existsSync(jwtParserWasmPath) ? fs.statSync(jwtParserWasmPath).size : 0;
  const otpGeneratorSize = fs.existsSync(otpGeneratorWasmPath) ? fs.statSync(otpGeneratorWasmPath).size : 0;
  const urlEncoderDecoderSize = fs.existsSync(urlEncoderDecoderWasmPath) ? fs.statSync(urlEncoderDecoderWasmPath).size : 0;
  return c.json({
    rust: {
      file: "rs.wasm",
      sizeBytes: rsSize,
      sizeFormatted: `${(rsSize / 1024).toFixed(2)} KB`,
    },
    ts: {
      file: "ts.wasm",
      sizeBytes: tsSize,
      sizeFormatted: `${(tsSize / 1024).toFixed(2)} KB`,
    },
    tokenGenerator: {
      file: "token-generator.wasm",
      sizeBytes: tokenSize,
      sizeFormatted: `${(tokenSize / 1024).toFixed(2)} KB`,
    },
    hashText: {
      file: "hash-text.wasm",
      sizeBytes: hashSize,
      sizeFormatted: `${(hashSize / 1024).toFixed(2)} KB`,
    },
    bcrypt: {
      file: "bcrypt.wasm",
      sizeBytes: bcryptSize,
      sizeFormatted: `${(bcryptSize / 1024).toFixed(2)} KB`,
    },
    uuidGenerator: {
      file: "uuid-generator.wasm",
      sizeBytes: uuidSize,
      sizeFormatted: `${(uuidSize / 1024).toFixed(2)} KB`,
    },
    ulidGenerator: {
      file: "ulid-generator.wasm",
      sizeBytes: ulidSize,
      sizeFormatted: `${(ulidSize / 1024).toFixed(2)} KB`,
    },
    encryption: {
      file: "encryption.wasm",
      sizeBytes: encryptionSize,
      sizeFormatted: `${(encryptionSize / 1024).toFixed(2)} KB`,
    },
    bip39: {
      file: "bip39-generator.wasm",
      sizeBytes: bip39Size,
      sizeFormatted: `${(bip39Size / 1024).toFixed(2)} KB`,
    },
    hmac: {
      file: "hmac-generator.wasm",
      sizeBytes: hmacSize,
      sizeFormatted: `${(hmacSize / 1024).toFixed(2)} KB`,
    },
    rsa: {
      file: "rsa-key-pair.wasm",
      sizeBytes: rsaSize,
      sizeFormatted: `${(rsaSize / 1024).toFixed(2)} KB`,
    },
    passwordStrength: {
      file: "password-strength.wasm",
      sizeBytes: passwordStrengthSize,
      sizeFormatted: `${(passwordStrengthSize / 1024).toFixed(2)} KB`,
    },
    pdfSignature: {
      file: "pdf-signature.wasm",
      sizeBytes: pdfSignatureSize,
      sizeFormatted: `${(pdfSignatureSize / 1024).toFixed(2)} KB`,
    },
    yamlToJson: {
      file: "yaml-to-json.wasm",
      sizeBytes: yamlToJsonSize,
      sizeFormatted: `${(yamlToJsonSize / 1024).toFixed(2)} KB`,
    },
    yamlToToml: {
      file: "yaml-to-toml.wasm",
      sizeBytes: yamlToTomlSize,
      sizeFormatted: `${(yamlToTomlSize / 1024).toFixed(2)} KB`,
    },
    jsonToYaml: {
      file: "json-to-yaml.wasm",
      sizeBytes: jsonToYamlSize,
      sizeFormatted: `${(jsonToYamlSize / 1024).toFixed(2)} KB`,
    },
    jsonToToml: {
      file: "json-to-toml.wasm",
      sizeBytes: jsonToTomlSize,
      sizeFormatted: `${(jsonToTomlSize / 1024).toFixed(2)} KB`,
    },
    tomlToJson: {
      file: "toml-to-json.wasm",
      sizeBytes: tomlToJsonSize,
      sizeFormatted: `${(tomlToJsonSize / 1024).toFixed(2)} KB`,
    },
    tomlToYaml: {
      file: "toml-to-yaml.wasm",
      sizeBytes: tomlToYamlSize,
      sizeFormatted: `${(tomlToYamlSize / 1024).toFixed(2)} KB`,
    },
    xmlToJson: {
      file: "xml-to-json.wasm",
      sizeBytes: xmlToJsonSize,
      sizeFormatted: `${(xmlToJsonSize / 1024).toFixed(2)} KB`,
    },
    jsonToXml: {
      file: "json-to-xml.wasm",
      sizeBytes: jsonToXmlSize,
      sizeFormatted: `${(jsonToXmlSize / 1024).toFixed(2)} KB`,
    },
    jsonToCsv: {
      file: "json-to-csv.wasm",
      sizeBytes: jsonToCsvSize,
      sizeFormatted: `${(jsonToCsvSize / 1024).toFixed(2)} KB`,
    },
    base64String: {
      file: "base64-string.wasm",
      sizeBytes: base64StringSize,
      sizeFormatted: `${(base64StringSize / 1024).toFixed(2)} KB`,
    },
    base64File: {
      file: "base64-file.wasm",
      sizeBytes: base64FileSize,
      sizeFormatted: `${(base64FileSize / 1024).toFixed(2)} KB`,
    },
    colorConverter: {
      file: "color-converter.wasm",
      sizeBytes: colorConverterSize,
      sizeFormatted: `${(colorConverterSize / 1024).toFixed(2)} KB`,
    },
    caseConverter: {
      file: "case-converter.wasm",
      sizeBytes: caseConverterSize,
      sizeFormatted: `${(caseConverterSize / 1024).toFixed(2)} KB`,
    },
    dateTimeConverter: {
      file: "date-time-converter.wasm",
      sizeBytes: dateTimeConverterSize,
      sizeFormatted: `${(dateTimeConverterSize / 1024).toFixed(2)} KB`,
    },
    integerBaseConverter: {
      file: "integer-base-converter.wasm",
      sizeBytes: integerBaseConverterSize,
      sizeFormatted: `${(integerBaseConverterSize / 1024).toFixed(2)} KB`,
    },
    romanNumeralConverter: {
      file: "roman-numeral-converter.wasm",
      sizeBytes: romanNumeralConverterSize,
      sizeFormatted: `${(romanNumeralConverterSize / 1024).toFixed(2)} KB`,
    },
    textToBinary: {
      file: "text-to-binary.wasm",
      sizeBytes: textToBinarySize,
      sizeFormatted: `${(textToBinarySize / 1024).toFixed(2)} KB`,
    },
    textToUnicode: {
      file: "text-to-unicode.wasm",
      sizeBytes: textToUnicodeSize,
      sizeFormatted: `${(textToUnicodeSize / 1024).toFixed(2)} KB`,
    },
    markdownToHtml: {
      file: "markdown-to-html.wasm",
      sizeBytes: markdownToHtmlSize,
      sizeFormatted: `${(markdownToHtmlSize / 1024).toFixed(2)} KB`,
    },
    listConverter: {
      file: "list-converter.wasm",
      sizeBytes: listConverterSize,
      sizeFormatted: `${(listConverterSize / 1024).toFixed(2)} KB`,
    },
    textToNato: {
      file: "text-to-nato.wasm",
      sizeBytes: textToNatoSize,
      sizeFormatted: `${(textToNatoSize / 1024).toFixed(2)} KB`,
    },
    sqlPrettify: {
      file: "sql-prettify.wasm",
      sizeBytes: sqlPrettifySize,
      sizeFormatted: `${(sqlPrettifySize / 1024).toFixed(2)} KB`,
    },
    xmlFormatter: {
      file: "xml-formatter.wasm",
      sizeBytes: xmlFormatterSize,
      sizeFormatted: `${(xmlFormatterSize / 1024).toFixed(2)} KB`,
    },
    jsonMinify: {
      file: "json-minify.wasm",
      sizeBytes: jsonMinifySize,
      sizeFormatted: `${(jsonMinifySize / 1024).toFixed(2)} KB`,
    },
    jsonViewer: {
      file: "json-viewer.wasm",
      sizeBytes: jsonViewerSize,
      sizeFormatted: `${(jsonViewerSize / 1024).toFixed(2)} KB`,
    },
    yamlViewer: {
      file: "yaml-viewer.wasm",
      sizeBytes: yamlViewerSize,
      sizeFormatted: `${(yamlViewerSize / 1024).toFixed(2)} KB`,
    },
    regexTester: {
      file: "regex-tester.wasm",
      sizeBytes: regexTesterSize,
      sizeFormatted: `${(regexTesterSize / 1024).toFixed(2)} KB`,
    },
    regexMemo: {
      file: "regex-memo.wasm",
      sizeBytes: regexMemoSize,
      sizeFormatted: `${(regexMemoSize / 1024).toFixed(2)} KB`,
    },
    crontabGenerator: {
      file: "crontab-generator.wasm",
      sizeBytes: crontabGeneratorSize,
      sizeFormatted: `${(crontabGeneratorSize / 1024).toFixed(2)} KB`,
    },
    chmodCalculator: {
      file: "chmod-calculator.wasm",
      sizeBytes: chmodCalculatorSize,
      sizeFormatted: `${(chmodCalculatorSize / 1024).toFixed(2)} KB`,
    },
    dockerRunToCompose: {
      file: "docker-run-to-compose.wasm",
      sizeBytes: dockerRunToComposeSize,
      sizeFormatted: `${(dockerRunToComposeSize / 1024).toFixed(2)} KB`,
    },
    emailNormalizer: {
      file: "email-normalizer.wasm",
      sizeBytes: emailNormalizerSize,
      sizeFormatted: `${(emailNormalizerSize / 1024).toFixed(2)} KB`,
    },
    gitMemo: {
      file: "git-memo.wasm",
      sizeBytes: gitMemoSize,
      sizeFormatted: `${(gitMemoSize / 1024).toFixed(2)} KB`,
    },
    randomPort: {
      file: "random-port.wasm",
      sizeBytes: randomPortSize,
      sizeFormatted: `${(randomPortSize / 1024).toFixed(2)} KB`,
    },
    textDiff: {
      file: "text-diff.wasm",
      sizeBytes: textDiffSize,
      sizeFormatted: `${(textDiffSize / 1024).toFixed(2)} KB`,
    },
    textStatistics: {
      file: "text-statistics.wasm",
      sizeBytes: textStatisticsSize,
      sizeFormatted: `${(textStatisticsSize / 1024).toFixed(2)} KB`,
    },
    stringObfuscator: {
      file: "string-obfuscator.wasm",
      sizeBytes: stringObfuscatorSize,
      sizeFormatted: `${(stringObfuscatorSize / 1024).toFixed(2)} KB`,
    },
    loremIpsum: {
      file: "lorem-ipsum.wasm",
      sizeBytes: loremIpsumSize,
      sizeFormatted: `${(loremIpsumSize / 1024).toFixed(2)} KB`,
    },
    asciiTextDrawer: {
      file: "ascii-text-drawer.wasm",
      sizeBytes: asciiTextDrawerSize,
      sizeFormatted: `${(asciiTextDrawerSize / 1024).toFixed(2)} KB`,
    },
    numeronymGenerator: {
      file: "numeronym-generator.wasm",
      sizeBytes: numeronymGeneratorSize,
      sizeFormatted: `${(numeronymGeneratorSize / 1024).toFixed(2)} KB`,
    },
    emojiPicker: {
      file: "emoji-picker.wasm",
      sizeBytes: emojiPickerSize,
      sizeFormatted: `${(emojiPickerSize / 1024).toFixed(2)} KB`,
    },
    jwtParser: {
      file: "jwt-parser.wasm",
      sizeBytes: jwtParserSize,
      sizeFormatted: `${(jwtParserSize / 1024).toFixed(2)} KB`,
    },
    otpGenerator: {
      file: "otp-generator.wasm",
      sizeBytes: otpGeneratorSize,
      sizeFormatted: `${(otpGeneratorSize / 1024).toFixed(2)} KB`,
    },
    urlEncoderDecoder: {
      file: "url-encoder-decoder.wasm",
      sizeBytes: urlEncoderDecoderSize,
      sizeFormatted: `${(urlEncoderDecoderSize / 1024).toFixed(2)} KB`,
    },
  });
});

const port = 3000;
console.log(`🚀 Hono 服务已启动: http://localhost:${port}`);
serve({
  fetch: app.fetch,
  port
});
