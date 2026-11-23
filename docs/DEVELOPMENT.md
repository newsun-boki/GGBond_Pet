# 开发与发布

需要 Node.js 22+、Rust 1.100.0（rust-toolchain.toml 固定）及 [Tauri 平台依赖](https://v2.tauri.app/start/prerequisites/)。

```sh
npm ci
npm run test:motion
npm run build
npm run tauri:dev
```

网页：`npm run dev` 后访问 `/ggbond-preview.html`。单文件：`npm run build:preview` 输出 `dist-ggbond-preview/GGBond-Pet-preview.html`。

## 打包

```sh
# macOS 当前架构
npm run tauri -- build --bundles app
# macOS Universal
rustup target add aarch64-apple-darwin x86_64-apple-darwin
npm run tauri -- build --target universal-apple-darwin --bundles app
# 在 Windows 上
npm run tauri -- build --bundles nsis
# 在对应架构 Linux 上
npm run tauri -- build --bundles deb,appimage
```

产物在 `src-tauri/target/.../release/bundle/`。为兼容早期安装，应用名保留 `KuroCat-GGBond`，可执行文件名保留 `KuroCat`，应用标识为 `local.kurocat.ggbond`，公开发布名称为 GGBond Pet。

## 动作与皮肤

`ggbondMotion.ts`：可中断 Hermite 轨迹、抬手高度、临界阻尼弹簧、两段 IK。`ggbondRenderer.ts`：键位、手部分配、身体跟随、表情、连击、每条手臂 8×16 PNG 网格变形。图层顺序为身体 → 原生键鼠 → 双臂和特效。

注册链路：`catEngine.ts`、`catSkins.ts`、Rust `cats.rs` / `tray.rs`。锚点见 `docs/skin-manifest.json`。新角色应使用有权使用的素材，重新测量肩肘腕指尖，更新来源/许可并检查四种键盘配置和同时键鼠行为。这不是可直接导入原版的 JSON 换色皮肤，也没有 Live2D 运行时依赖。

## 自动构建

`ci.yml` 对 main/PR 运行前端、运动数学与离线预览检查。`release.yml` 对 v* tag 构建 Windows x64、macOS Universal、Linux amd64/arm64，汇总附件与 SHA-256 到 Draft Release。维护者检查全部产物后发布。workflow_dispatch 留空 release_tag 时只生成 artifacts；填写已存在标签时，从该标签检出源码并暂存 Draft Release，可用于修复打包流程后重新打包同一份源码。

版本号同步 package.json、package-lock.json、Cargo.toml、Cargo.lock、tauri.conf.json；更新 README 下载链接与 CHANGELOG。安装包必须保留各许可文件。不要提交令牌、个人设置、构建缓存、聊天记录或绝对本机路径。

运动数学测试不代替连续画面检查，CI 编译与 MCP 冒烟测试不等于全局输入、权限、全屏的实际验收。发布时分别记录两者。
