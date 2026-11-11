# LinkSwift · Horoaw fork

这是 [LinkSwift](https://github.com/hmjz100/LinkSwift) 的个人 fork，提供一个用于获取网盘文件下载地址的浏览器用户脚本。本仓库的 `LinkSwift-Horoaw.user.js` 包含针对百度网盘页面的调整。

## 安装

1. 在 Firefox 中安装并启用 Tampermonkey（篡改猴）。
2. 打开 [安装 Horoaw 版脚本](https://raw.githubusercontent.com/Horoaw/LinkSwift/d3419c7d0b94b7fa01f63c11734890f173a2f091/LinkSwift-Horoaw.user.js)，在篡改猴的安装页面确认安装。
3. 刷新百度网盘页面，在文件列表中勾选文件或文件夹，使用“下载助手”选择下载方式。首次使用时按提示完成百度授权。

如果之前安装过其他 LinkSwift 版本，请在篡改猴中停用旧版本，避免两个脚本同时运行。

## 本 fork 的百度网盘调整

- 尝试识别新版分享页面中勾选的文件和文件夹。
- 尝试递归读取分享文件夹及自己的网盘文件夹，处理分页，并在接口失败时显示错误代码。
- 调整分享页签名请求和下载助手悬停菜单。
- 增加“重置百度授权令牌”脚本菜单，便于排查缓存授权问题。
- 百度网盘的 cURL 下载保留所选文件夹及子文件夹层级。cURL 下载提供单个及批量续传与从头下载命令；从头下载需要 curl 7.83.0 或更高版本，会保留同名文件。

## 当前状态

这些调整已通过 JavaScript 语法检查和模拟测试，尚未在真实的 Firefox、Tampermonkey 和百度网盘环境中完成端到端验证。部分账号或文件可能出现接口返回成功但没有文件信息的情况，目前仍在排查。百度接口、授权和下载限制可能影响实际效果。

遇到问题时，可以在篡改猴菜单选择“重置百度授权令牌”，确认当前登录账号后重试。反馈时请提供错误提示，不要公开访问令牌、Cookie 或私人文件信息。

## 其他文件与上游

- 仓库中的 `（改）网盘直链下载助手.user.js` 保留上游 `dev` 分支的版本。
- [上游 README](README.upstream.md) 保留原项目说明及其他安装选项。
- 上游项目：[hmjz100/LinkSwift](https://github.com/hmjz100/LinkSwift)。
- 本项目遵循 [AGPL-3.0-or-later](LICENSE)；原作者信息保留在脚本中。
