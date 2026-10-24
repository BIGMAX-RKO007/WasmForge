# 06. WASM 统一接口通信规范 (Envelope Protocol)

---

## 一、 规范制定背景与设计目标

在早期的 Demo 阶段，宿主与 WASM 之间直接通过 C-ABI 单个暴露函数（如 `add(a, b)`、`greet(ptr, len)`）。这种单点硬编码调用在面对复杂实际业务时存在显著弊端：
1. **字段拓展脆弱**：入参或出参每增加一个属性，底层的 C 函数签名就必须推倒重构；
2. **缺乏状态机与错误处理**：无法统一表达业务错误码（Code）、异常消息（Message）与堆栈跟踪；
3. **接口爆炸**：业务模块有几十个功能时，WASM 需要导出几十个不同的 ABI 符号，增加了跨宿主对接的繁琐度。

为此，WasmForge 正式确立 **通用信封契约协议（Universal Envelope Protocol）** 作为后续所有业务模块的标准开发约束。

---

## 二、 底层 ABI 导出规约 (极简 3 符号原则)

无论内部包含多少业务逻辑，每个纯 WASM 模块对外仅强制暴露以下 **3 个标准 ABI 符号**：

```rust
// 1. 内存申请：宿主在写入数据前向 WASM 申请空间
#[no_mangle]
pub extern "C" fn alloc(size: usize) -> *mut u8;

// 2. 内存回收：宿主消费完输出或写入完毕后释放空间
#[no_mangle]
pub extern "C" fn dealloc(ptr: *mut u8, size: usize);

// 3. 通用信封调度入口：接收序列化入参，返回序列化出参
#[no_mangle]
pub extern "C" fn dispatch(ptr: *const u8, len: usize) -> u64;
```

> **返回值打包规则**：
> `dispatch` 返回一个 64 位无符号整数（u64 / BigInt）：
> - 高 32 位：输出数据的线性内存指针 `outPtr`；
> - 低 32 位：输出数据的字节长度 `outLen`；
> - 格式：`((outPtr as u64) << 32) | ((outLen as u64) & 0xFFFFFFFF)`。

---

## 三、 数据信封标准 (JSON 载荷规范)

目前阶段以 **JSON** 作为跨语言交互的标准序列化协议（未来无缝平替 MessagePack / Protobuf 时外围信封保持不变）。

### 1. 输入信封 (Request Envelope)

```json
{
  "action": "crypto/sha256",
  "requestId": "req-1729760000000-001",
  "params": {
    "text": "Hello, WasmForge!",
    "encoding": "utf-8"
  }
}
```

| 字段名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| **`action`** | `string` | 是 | 业务路由动作，采用 `领域/子方法` 命名法（如 `crypto/sha256`、`parser/csv_to_json`）。 |
| **`requestId`** | `string` | 否 | 链路追踪 ID，原样随响应信封返回，方便异步并发匹配。 |
| **`params`** | `object` | 是 | 传递给具体算法/业务逻辑的强类型参数字典。 |

---

### 2. 输出信封 (Response Envelope)

```json
{
  "code": 0,
  "msg": "success",
  "requestId": "req-1729760000000-001",
  "durationMs": 0.045,
  "data": {
    "hash": "7b79e27c082cbddb82a71f00a581e261f...",
    "algorithm": "sha256"
  }
}
```

| 字段名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| **`code`** | `number` | 是 | 状态码。`0` 表示成功，非 0（如 `400`、`500`、`1001`）表示业务或解析异常。 |
| **`msg`** | `string` | 是 | 状态描述。发生错误时返回人类可读的具体原因。 |
| **`requestId`** | `string` | 否 | 与请求中的 `requestId` 严格一致。 |
| **`durationMs`** | `number` | 否 | WASM 内部纯计算执行耗时（毫秒）。 |
| **`data`** | `any` | 否 | 业务执行成功时的实际返回载荷（对象、数组、数值等）。 |

---

## 四、 错误响应标准示例

当 WASM 内部发生非法入参或计算崩溃时，**严禁触发 Panic / unreachable 导致实例暴毙**，必须在内部捕获并包装为标准错误信封返回：

```json
{
  "code": 4001,
  "msg": "InvalidParams: missing required parameter 'text' for action 'crypto/sha256'",
  "requestId": "req-1729760000000-002",
  "data": null
}
```

---

## 五、 统一基础设施层调用约定

基于此信封协议，所有宿主消费端（Node.js / 浏览器 / Java / Python / Go）的基础设施只需提供一个标准的无状态方法：

```javascript
// 通用调用方法签名
const response = await wasmEngine.dispatch({
  action: "crypto/sha256",
  params: { text: "Hello" }
});

if (response.code === 0) {
  console.log("计算成功:", response.data);
} else {
  console.error("计算失败:", response.msg);
}
```

这套契约从根源上杜绝了接口频繁变动对跨端带来的破坏性影响。
