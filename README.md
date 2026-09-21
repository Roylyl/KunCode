<p align="center">
  <img src="resources/kuncode/capybara-pixel.png" alt="KunCode 水豚图标" width="128" />
</p>

<h1 align="center">KunCode</h1>

<p align="center">
  603 官方 IDE · 让写代码变得更轻松
</p>

<p align="center">
  <a href="https://github.com/Roylyl/KunCode/releases/latest"><img src="https://img.shields.io/github/v/release/Roylyl/KunCode?display_name=tag&label=%E6%9C%80%E6%96%B0%E7%89%88%E6%9C%AC" alt="最新版本" /></a>
  <a href="https://github.com/Roylyl/KunCode/releases"><img src="https://img.shields.io/github/downloads/Roylyl/KunCode/total?label=%E4%B8%8B%E8%BD%BD%E9%87%8F" alt="下载量" /></a>
  <a href="https://github.com/Roylyl/KunCode/blob/main/LICENSE.txt"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="许可证" /></a>
</p>

<p align="center">
  <a href="#下载安装">下载安装</a> ·
  <a href="#主要功能">主要功能</a> ·
  <a href="#从源码运行">从源码运行</a> ·
  <a href="#参与贡献">参与贡献</a>
</p>

## KunCode 是什么

KunCode 是由 603 打造的跨平台开发工具，基于 Code - OSS 定制，兼顾熟悉的编辑器体验与更贴近中文开发者的产品设计。

KunCode 已适配 Windows 与 macOS，提供代码编辑、项目管理、终端、调试、扩展和 AI 辅助等能力。macOS 版本在保持 Windows 版本核心功能的基础上，针对 Mac 原生环境进行了适配。

KunCode 是独立的第三方开源项目，由 603 维护，与 Microsoft Corporation 没有隶属、授权、赞助或官方合作关系。Microsoft、Visual Studio Code 及相关标识属于其各自权利人的商标；本项目不使用微软官方品牌标识，也不代表微软发行产品。

## 主要功能

- **完整的开发工作台**：代码编辑、文件管理、项目管理、终端与调试工具集中在一个窗口中。
- **多语言开发支持**：支持 Python、C/C++、Java、ESP-IDF 等常用开发场景，并可通过扩展继续扩展能力。
- **困困 AI 助手**：在侧边栏中与困困 AI 对话，辅助理解代码、学习编程和解决开发问题。
- **Agent 逐字输出**：Agent 回复支持逐字输出，过程更清晰，交互更自然。
- **Windows 与 macOS 双平台**：Windows 提供 x64 安装包；macOS 提供 `.pkg` 安装包，并适配 Apple Silicon 环境。
- **KunCode 品牌体验**：像素风水豚应用图标、水豚绿色主题和简体中文界面贯穿 macOS 版本体验。

## 下载安装

请前往 [Releases](https://github.com/Roylyl/KunCode/releases) 下载最新版本。

当前版本：[V1.0.0｜Windows 与 macOS 版本](https://github.com/Roylyl/KunCode/releases/tag/V1.0.0)

| 平台 | 安装包 | 说明 |
| --- | --- | --- |
| Windows x64 | [KunCode-Windows-x64-V1.0.0.exe](https://github.com/Roylyl/KunCode/releases/download/V1.0.0/KunCode-Windows-x64-V1.0.0.exe) | Windows 安装程序 |
| macOS（Apple Silicon） | [KunCode-macOS-arm64-V1.0.0.pkg](https://github.com/Roylyl/KunCode/releases/download/V1.0.0/KunCode-macOS-arm64-V1.0.0.pkg) | macOS 安装程序 |

> macOS 首次安装或打开时，如果系统提示安全确认，请在“系统设置 → 隐私与安全性”中允许打开 KunCode。

## 从源码运行

KunCode 基于 Code - OSS 构建。请先准备 Git、[.nvmrc](.nvmrc) 指定的 **Node.js 24.18.0** 或同一 24 主版本下的更新版本，以及 **npm 低于 12 的版本**。安装脚本会检查这些条件，并拒绝使用 Yarn；升级工具版本时以 [.nvmrc](.nvmrc) 和 [安装检查](build/npm/preinstall.ts) 为准。

依赖包含 Electron 与原生模块。Windows 需要兼容的 Visual Studio C++ 构建工具；macOS 需要 Xcode Command Line Tools；构建 Rust CLI 时另需 Rust 工具链。具体系统依赖见 [Code - OSS 构建文档](https://github.com/microsoft/vscode/wiki/How-to-Contribute)。依赖安装和首次启动会下载 npm 包、Electron 与内置扩展，需要网络访问。

```bash
git clone https://github.com/Roylyl/KunCode.git
cd KunCode
npm ci
npm run compile
```

`npm run compile` 同时编译编辑器客户端和内置 Copilot 扩展。随后在仓库根目录启动开发版：

| 平台 | 启动命令 |
| --- | --- |
| macOS / Linux | `./scripts/code.sh` |
| Windows PowerShell | `.\scripts\code.bat` |

持续开发时可在一个终端运行 `npm run watch`，在另一个终端启动应用；停止监听时按 `Ctrl+C`。编译和启动命令不会自动生成发行安装包。

### 验证改动

安装依赖并编译后，按改动范围选择检查：

```bash
npm run typecheck-client
npm run test-node
git diff --check
```

`typecheck-client` 检查编辑器客户端类型，`test-node` 运行 Node 测试；二者不覆盖全部扩展或 Electron 界面。涉及窗口、编辑器或平台行为时，还应启动开发版实际验证，并根据 [测试说明](test/README.md) 使用 `scripts/test.sh` / `scripts/test.bat` 等对应测试入口。根目录的 `npm test` 会提示选择测试脚本并返回失败，不是完整测试入口。

### 构建产物与发布

开发运行使用 `.build/`、`out/` 及扩展各自的输出目录；发行任务还可能生成 `out-vscode*`，并将平台应用放到仓库的同级 `VSCode-<platform>-<arch>` 目录。不要将这些目录误认为需要提交的源码。

不同平台的安装包还需要各自的打包、签名与验证步骤，不能只运行 `compile`。可通过 `npm run gulp -- --tasks-simple` 查看当前工程的任务，并查阅 `build/gulpfile.vscode.ts`、`build/gulpfile.vscode.win32.ts` 等实现。发行安装包与归档上传到 [Releases](https://github.com/Roylyl/KunCode/releases)，不放入 Git 源码历史。

## 项目结构

- `src/`：编辑器核心源码
- `extensions/`：内置扩展
- `build/`：构建与打包源码，需保留在版本控制中
- `scripts/`、`test/`：开发运行脚本与测试入口
- `cli/`：Rust CLI 工程
- `resources/kuncode/`：KunCode 品牌、图标与安装资源
- `product.json`：KunCode 产品配置
- `.github/`：持续集成与项目协作配置

### 仓库卫生

[.gitignore](.gitignore) 排除 `node_modules/`、`.build/`、编译输出、测试报告、常见本地缓存和根目录发行安装包。临时截图与验证结果可放在根目录 `tmp/`。根目录 `.env` 与 `.env.*` 覆盖文件不提交，`.env.example` 和 `.env.*.example` 模板可提交。

保留 `build/` 中的正式构建脚本、`package-lock.json`、Rust 锁文件、品牌资源、测试源码与夹具；不要为方便而统一忽略整个 `build/`、所有归档或所有环境示例。忽略规则不会自动移除已经跟踪的文件，提交前应检查 `git status --short` 与实际差异。

## 参与贡献

欢迎提交 Issue、功能建议和 Pull Request。提交前请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)，并确保改动符合项目现有的代码规范和测试要求。

## 致谢与许可证

KunCode 基于 [Code - OSS](https://github.com/microsoft/vscode) 定制，感谢开源社区的长期贡献。

本项目基于 Code - OSS 从源码构建，主体采用 [MIT License](LICENSE.txt)，并保留上游 Code - OSS 的版权和许可声明。仓库中的第三方组件与依赖请同时参考 [ThirdPartyNotices.txt](ThirdPartyNotices.txt)；各依赖的商标和版权仍归其权利人所有。本项目未使用微软官方分发的二进制或品牌标识，亦不代表微软发行或背书任何产品。
