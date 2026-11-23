# 来源与署名

GGBond Pet 是基于 [qianyiai/kurocat](https://github.com/qianyiai/kurocat) 的衍生项目，独立维护，并非 KuroCat 官方版本。

- 上游版本：KuroCat 4.7.0。
- 引入提交：[`9d278754cb1d2c34acc379b9df8edffa47fcfc51`](https://github.com/qianyiai/kurocat/tree/9d278754cb1d2c34acc379b9df8edffa47fcfc51)。
- 原作者与贡献者：KuroCat Contributors；上游 Cargo 元数据署名 Kevin Hao。
- 许可：MIT；原始许可原文保存在 [docs/LICENSE-KuroCat.txt](docs/LICENSE-KuroCat.txt)，根目录 [LICENSE](LICENSE) 保留原版权行并增加本项目修改的署名。

## 继承的工作

Tauri/Rust 桌面外壳、全局键鼠监听、Canvas 键盘和鼠标、65%/108 键布局与投影、原有猫咪与大肥鱼渲染器、隐私检测、托盘、设置、MCP、Windows/Linux 平台支持均源于 KuroCat。尤其参考了 `src/dafeiyuRenderer.ts` 的分层角色接入设计。不能将这些基础能力归为本项目原创。

## 本项目新增与修改

新增猪猪侠角色贴图、双臂 IK 与网格变形、连续换键轨迹、键鼠同时操作的手部分配、连击奖励与表情、独立预览及测试；补充 macOS 跨应用全屏行为；隔离设置、快捷方式和自启动标识；停用上游自动更新；重做文档和发布流程。

## 大肥鱼素材

沿用上游的 MIT 运行时素材，来源为 [PC2005-cloud/dsh-pet](https://github.com/PC2005-cloud/dsh-pet)，参考衍生项目 [QCYTSN/dsh-dafeiyu](https://github.com/QCYTSN/dsh-dafeiyu)。原版权与许可保存在 [src/assets/dafeiyu/LICENSE-MIT.txt](src/assets/dafeiyu/LICENSE-MIT.txt)，并随安装包分发。

## 其他依赖

Tauri、Rust crates、TypeScript、Vite 及其依赖保留各自的许可。精确版本由 `Cargo.lock` 和 `package-lock.json` 记录。软件代码许可不等于角色、名称或商标授权，角色素材范围见 [ASSET_LICENSE.md](ASSET_LICENSE.md)。
