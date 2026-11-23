# 安装与故障排查

从[本仓库 Releases](https://github.com/newsun-boki/GGBond_Pet/releases/latest) 下载，选择正确架构，不要与上游升级包混用。

## macOS

打开 DMG，将 `KuroCat-GGBond.app` 拖入 Applications。退出旧副本再启动新副本。跟随其他应用输入时，为当前应用开启“辅助功能”和“输入监控”；只运行网页预览不需要这些权限。

发布包未经过 Apple 公证。确认来源、核对 SHA-256 后，按 [Apple 官方文档](https://support.apple.com/102445) 在“隐私与安全性”中对该应用选择“仍要打开”，不要全局关闭安全检查。

**键盘没反应：**确认授权的是“应用程序”里的当前副本。托盘提供“键盘监听与权限诊断”和“重新连接键盘监听”。升级后权限失效，可退出应用，移除旧权限条目后重新添加当前应用。

**全屏后不见：**开启“始终置顶显示”，关闭“暂停监听并隐藏”。macOS 13+ 增加跨应用全屏与台前调度角色，旧系统保留全空间/全屏辅助行为。实测为 macOS 14 ARM64；独占全屏游戏不同于普通原生全屏，异常时请记录应用名、系统版本和显示器配置。

## Windows

运行安装 EXE，或解压 ZIP 后运行 `KuroCat.exe`。需要 [Microsoft WebView2 Evergreen Runtime](https://developer.microsoft.com/microsoft-edge/webview2/)。设置、自启动注册表项和桌面快捷方式与上游隔离。

普通用户权限即可驱动普通应用的输入。Windows 可能隔离管理员程序的事件，保留上游管理员重启选项但不默认提权。反作弊与独占全屏游戏不保证兼容，可使用暂停监听并隐藏。

## Linux

根据架构选择 amd64 / arm64。

```sh
sudo apt install ./GGBond-Pet-v1.0.0-linux-amd64.deb
# 或 AppImage
chmod +x GGBond-Pet-v1.0.0-linux-amd64.AppImage
./GGBond-Pet-v1.0.0-linux-amd64.AppImage
```

没有 FUSE 时可尝试 AppImage 的 `--appimage-extract-and-run` 参数。DEB 需要 WebKitGTK 4.1 与托盘库，不要强行忽略依赖错误。X11 下使用继承的 XRecord 监听；Wayland 全局输入受会话隔离、设备权限限制，不建议把整个桌宠长期作为 root 运行。Kylin/UOS 等发行版尚未逐一实测。

## 配置、更新与卸载

- macOS：`~/Library/Application Support/kurocat-ggbond/`
- Windows：`%APPDATA%\kurocat-ggbond\`
- Linux：`~/.config/kurocat-ggbond/`

设置在 `settings.json`，自定义外观在 `cats.json`。从本仓库手动更新；不启用上游自动安装。卸载前关闭开机自启动并退出。Mac 删除 APP，Windows 使用卸载入口或删除便携目录，Linux 使用包管理器或删除 AppImage。配置可选择保留，不影响上游 KuroCat。

## 下载校验

Mac/Linux：`shasum -a 256 文件名` 或 `sha256sum 文件名`。Windows PowerShell：`Get-FileHash 文件名 -Algorithm SHA256`。比对同一 Release 的 `SHA256SUMS.txt`。
