<p align="center">
  <img src="resources/kuncode/capybara-pixel.png" alt="KunCode 水豚图标" width="128" />
</p>

<h1 align="center">KunCode</h1>

<p align="center">
  603 官方 IDE · 让写代码变得更轻松
</p>

<p align="center">
  <a href="https://github.com/Roylyl/KunCode/releases/latest"><img src="https://img.shields.io/github/v/release/Roylyl/KunCode?display_name=tag&label=最新版本" alt="最新版本" /></a>
  <a href="https://github.com/Roylyl/KunCode/releases"><img src="https://img.shields.io/github/downloads/Roylyl/KunCode/total?label=下载量" alt="下载量" /></a>
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

## 主要功能

- **完整的开发工作台**：代码编辑、文件管理、项目管理、终端与调试工具集中在一个窗口中。
- **多语言开发支持**：支持 Python、C/C++、Java、ESP-IDF 等常用开发场景，并可通过扩展继续扩展能力。
- **困困 AI 助手**：在侧边栏中与困困 AI 对话，辅助理解代码、学习编程和解决开发问题。
- **Agent 逐字输出**：Agent 回复支持逐字输出，过程更清晰，交互更自然。
- **Windows 与 macOS 双平台**：Windows 提供 x64 安装包；macOS 提供 `.pkg` 安装包，并适配 Apple Silicon 环境。
- **KunCode 品牌体验**：像素风水豚应用图标、水豚绿色主题和简体中文界面贯穿 macOS 版本体验。

## 下载安装

请前往 [Releases](https://github.com/Roylyl/KunCode/releases) 下载最新版本。

当前版本：[v1.133.0｜Windows 与 macOS 版本](https://github.com/Roylyl/KunCode/releases/tag/v1.133.0)

| 平台 | 安装包 | 说明 |
| --- | --- | --- |
| Windows x64 | [KunCodeSetup-x64-1.133.0.exe](https://github.com/Roylyl/KunCode/releases/download/v1.133.0/KunCodeSetup-x64-1.133.0.exe) | Windows 安装程序 |
| macOS | [KunCode.pkg](https://github.com/Roylyl/KunCode/releases/download/v1.133.0/KunCode.pkg) | macOS 安装程序 |

> macOS 首次安装或打开时，如果系统提示安全确认，请在“系统设置 → 隐私与安全性”中允许打开 KunCode。

## 从源码运行

KunCode 基于 Code - OSS 构建。开发环境需要 Node.js LTS、Yarn，以及能够完成 Electron 构建的本地工具链。

```bash
git clone https://github.com/Roylyl/KunCode.git
cd KunCode
yarn
yarn gulp compile
```

完成编译后，可根据目标平台使用仓库现有的构建流程生成安装包或归档文件。构建产物会生成在 `.build/` 和 `out/` 目录下。不同平台的打包还需要对应的系统工具链，完整说明请参考 [Code - OSS 构建文档](https://github.com/microsoft/vscode/wiki/How-to-Contribute)。

## 项目结构

- `src/`：编辑器核心源码
- `extensions/`：内置扩展
- `resources/kuncode/`：KunCode 品牌、图标与安装资源
- `product.json`：KunCode 产品配置
- `.github/`：持续集成与项目协作配置

## 参与贡献

欢迎提交 Issue、功能建议和 Pull Request。提交前请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)，并确保改动符合项目现有的代码规范和测试要求。

## 致谢与许可证

KunCode 基于 [Code - OSS](https://github.com/microsoft/vscode) 定制，感谢开源社区的长期贡献。

本项目使用 [MIT License](LICENSE.txt) 发布。仓库中的第三方组件与依赖请同时参考 [ThirdPartyNotices.txt](ThirdPartyNotices.txt)。
