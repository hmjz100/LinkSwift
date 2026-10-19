# IDM 扩展名回归检查

运行 `node --test tests/get-extension.test.cjs`（Node.js 18+，无需额外依赖）。
测试直接从主用户脚本提取实际 getExtension 方法，不复制解析实现。

覆盖无扩展名、中文名称、空名、尾点、点文件、多点、大小写和 ASCII 扩展名。
`README`、`LICENSE`、`.env` 和 `file.` 返回空字符串；`.config.json` 返回 JSON。
保持原有 ASCII 字母、数字、下划线扩展名支持，不把连字符后半段误认成扩展名。

修复前 16 项中 6 项失败；修复后 16 项通过。仅检查字符串解析，
未在真实 IDM 安装环境验证字段 4，也不改 IDM RPC 协议和脚本版本号。
关联上游 Issue #520，与下载命令引用、队列恢复等 #509 的工作范围独立。
