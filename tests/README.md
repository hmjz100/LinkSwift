# 回归检查

使用 Node.js 18+，无需额外测试依赖：

```sh
npm test
```

单元测试直接提取用户脚本中的实际函数，使用模拟响应检查分片完整性、完整文件回退、推送队列失败恢复和串行执行。命令行测试使用 Bash 和替代下载器函数检查实际收到的参数，不发起下载。

测试限制 Node 堆为 256 MiB。文件比较先检查长度，再比较字节，不生成大型数组差异。

浏览器检查需要 Chrome/Chromium，默认执行 `google-chrome`；可通过 `CHROME_BIN` 指定路径：

```sh
npm run test:browser
```

浏览器检查在临时配置目录中运行，退出后清理目录；只访问本地测试服务。jQuery 使用脚本声明的 3.6.0 版本，默认从 unpkg 获取；离线时可指定同版本文件：

```sh
JQUERY_PATH=/path/to/jquery-3.6.0.min.js npm run test:browser
```

浏览器检查使用原生 XMLHttpRequest 适配 GM 请求接口；未模拟浏览器禁止设置的 Cookie、User-Agent 等请求头。覆盖五种下载模式、悬浮提示、复制失败恢复、HTTP Range 与文件内容。

PowerShell、CMD 的引用规则由静态检查覆盖。PowerShell 使用[单引号字面字符串规则](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_quoting_rules)。CMD 的引号、百分号和感叹号会影响[参数解析和环境变量展开](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/cmd)，遇到这些输入会提示切换终端。Aria2 的 RPC 推送不依赖命令行转换，仍可正常使用。
