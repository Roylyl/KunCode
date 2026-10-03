<p align="center">
  <img src="resources/kuncode/capybara-pixel.png" alt="KunCode水豚图标" width="120" />
</p>

<h1 align="center">KunCode</h1>

<p align="center">603的开发工作台 · 写代码，也把卡住的事说清楚</p>

<p align="center">
  <a href="package.json"><img src="https://img.shields.io/badge/version-2.0.0-65a87d?style=flat-square" alt="版本2.0.0" /></a>
  <a href="LICENSE.txt"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT许可证" /></a>
  <a href="#下载安装"><img src="https://img.shields.io/badge/installer-Windows_x64-0078d4?style=flat-square" alt="Windows x64安装包" /></a>
  <a href="https://github.com/Roylyl/KunCode/releases"><img src="https://img.shields.io/badge/downloads-Releases-5865f2?style=flat-square" alt="发行下载" /></a>
  <a href="https://github.com/Roylyl/KunCode/stargazers"><img src="https://img.shields.io/github/stars/Roylyl/KunCode?style=flat-square" alt="GitHub Stars" /></a>
</p>

<p align="center">
  <a href="#下载安装">下载安装</a> ·
  <a href="#主要功能">主要功能</a> ·
  <a href="#困困ai怎么用">困困AI</a> ·
  <a href="#从源码运行">源码运行</a> ·
  <a href="#构建windows安装包">构建安装包</a>
</p>

KunCode是由603维护的跨平台开发工具，基于Code - OSS定制。代码编辑、项目管理、终端、调试和扩展集中在同一个工作台，内置像素水豚主题与困困AI，适合日常编程、课程项目和学习交流。

2.0.0扩充了困困AI的本地场景语料，并改善场景匹配、连续追问和逐字输出。编辑器沿用KunCode的产品名称、应用标识与已有界面。

## 下载安装

已发布的安装包在[Releases](https://github.com/Roylyl/KunCode/releases)获取。本次2.0.0的Windows构建产物名称为`KunCode-Windows-x64-2.0.0.exe`；本地构建与上传发行是两个独立步骤，下载时以发行页实际附件为准。

| 使用方式 | 入口 | 使用要求 |
| --- | --- | --- |
| Windows安装版 | 运行`KunCode-Windows-x64-2.0.0.exe` | Windows10及以上、x64系统，按向导完成安装 |
| Windows源码运行 | `scripts/code.bat` | 准备Node.js、npm与C++构建工具 |
| macOS源码运行 | `scripts/code.sh` | 准备Node.js、npm与Xcode Command Line Tools |
| Linux源码运行 | `scripts/code.sh` | 准备Node.js、npm与对应的系统构建依赖 |

安装后打开项目文件夹即可开始编辑。通过扩展视图安装所需语言工具，再按项目需要配置解释器、编译器或SDK。扩展市场使用[Open VSX](https://open-vsx.org/)。

KunCode的产品版本为2.0.0，扩展API兼容版本保留为1.133.0，与本工程[对应的上游提交](https://github.com/microsoft/vscode/blob/4bef75520b2f8d1d76a1e44962dbada7a7b34a7b/package.json)一致。产品版本升级不会把已有的^1.x扩展错误判为不兼容。

## 主要功能

- 开发工作台：代码编辑、文件搜索、终端、调试和Git操作集中在一个窗口。
- 多语言开发：支持常见语言编辑，通过扩展配置Python、C/C++、Java、ESP-IDF等开发环境。
- 困困AI：内置1522条原创场景语料，覆盖编程、校园学习与日常交流，离线即可使用。
- 连续对话：简短追问可以参考最近的用户问题；优先避开近期使用过的匹配回复。
- 逐字输出：按完整Unicode字符输出，取消回复时及时结束等待，中文和表情不会被拆成半个字符。
- 中文与品牌体验：沿用简体中文资源、KunCode应用标识和像素水豚素材，尊重用户已经设置的主题与聊天选项。

## 困困AI怎么用

打开聊天面板，选择`Kunkun AI`，或使用`@kunkun`与困困AI对话。直接说遇到了什么事、卡在哪一步，具体的场景比单独一个“报错”或“学习”更容易接上。

```text
Python报ModuleNotFoundError，装了包还是找不到
Git提交到了错误分支，怎么处理？
论文题目太大，选题范围收不住
小组任务全压给我，最后都要我收尾
困教练，今天任务太多，帮我排一下
```

困困AI参考[KunSytle](https://github.com/Roylyl/KunSytle)技能的表达规则：先接住场景，再给追问、判断或具体安排；用短句推进信息，减少套话和随机角色前后缀。技术内容以准确、可操作为先，普通对话不会自动进入教练角色。

| 语料主题 | 条数 | 内容 |
| --- | ---: | --- |
| 编程与开发 | 502 | 语言问题、Git、依赖、调试、测试、性能、工程协作与AI使用 |
| 校园与生活 | 520 | 课堂、复习、考试、论文、小组、社团、室友、沟通与求职 |
| 日常与协作 | 500 | 任务安排、信息判断、工具选择、消费、数字生活与正式沟通 |

另有问候与补充信息回复。43条困教练语料包含在编程和日常主题中，只在明确请求教练模式等角色前情时参与匹配。

聊天支持两个命令：

- `@kunkun /random`：随机抽取一条普通场景回复。
- `@kunkun /about`：查看当前语料数量与助手能力说明。

困困AI通过关键词相关性从本地语料中选择回复，支持有限的追问上下文。它没有联网检索和大模型推理能力，不会替你修改项目文件；没有接上场景时会请你补充信息。风格模拟与原创语料不代表真人发言，也不会编造私人经历或群聊事实。

## 从源码运行

准备Git与[.nvmrc](.nvmrc)指定的Node.js24.18.0，或同一24主版本下的更新版本。安装检查要求npm低于12，不使用Yarn。

依赖包含Electron和原生模块。Windows需要Visual Studio2022的C++构建工具、ATL、Spectre库及Windows SDK；macOS需要Xcode Command Line Tools。其他系统依赖参考[Code - OSS构建说明](https://github.com/microsoft/vscode/wiki/How-to-Contribute)。构建Rust CLI另需Rust工具链。

```bash
git clone https://github.com/Roylyl/KunCode.git
cd KunCode
npm ci
npm run compile
```

依赖安装和首次启动需要下载npm包、Electron及内置扩展。编译完成后，在仓库根目录运行：

| 平台 | 启动命令 |
| --- | --- |
| Windows PowerShell | `.\scripts\code.bat` |
| macOS/Linux | `./scripts/code.sh` |

持续开发时，在一个终端运行`npm run watch`，在另一个终端启动应用。`compile`和`watch`处理编辑器客户端及仓库中的扩展；当前工程不包含上游Copilot扩展源码。

## 构建Windows安装包

在具备Windows构建依赖的环境中，从仓库根目录依次执行：

```powershell
npm ci
npm run download-builtin-extensions
npm run gulp vscode-win32-x64-min
npm run gulp vscode-win32-x64-user-setup
```

发行构建会生成编辑器客户端、内置扩展与Electron应用，再使用Inno Setup制作安装程序。应用目录位于仓库同级的`VSCode-win32-x64`，安装包输出到`.build/win32-x64/user-setup/KunCode-Windows-x64-2.0.0.exe`。安装器使用KunCode名称与603发布者信息，支持安装、覆盖升级与卸载。

主程序、快捷方式与工作区文件使用水豚应用图标，安装器和安装向导使用带蓝色箭头的水豚图标，Windows卸载列表使用红叉水豚图标。Inno Setup生成的卸载EXE与安装EXE共享图标。品牌图标源文件位于`resources/kuncode/`；Mac应用与DMG使用同一份水豚ICNS，Linux打包也使用水豚图标。

KunCode没有配置后台更新服务，当前安装包使用常规安装流程。其他平台的打包任务可通过`npm run gulp -- --tasks-simple`查看。

## 语料维护

语料入口是[manifest.json](extensions/kuncode-kunkun-ai/corpus/manifest.json)，主题文件位于`extensions/kuncode-kunkun-ai/corpus/topics/`。每条包含具体触发短语、回复正文、场景类别、表达模式和回应动作。

```json
{
  "cat": "课堂跟进",
  "keys": ["上课听不懂", "课上跟不上"],
  "text": "卡在定义还是例题？",
  "mode": "chat",
  "action": "question"
}
```

新增内容应对应一个实际场景，使用原创短句，避免把不同触发词机械组合成大量重复回复。`mode`可用`chat`、`explain`或`coach`；`action`可用`question`、`support`、`judge`、`plan`、`explain`或`react`。新主题需要登记到manifest的`sources`，教练角色内容使用`coach`。

## 项目结构

| 路径 | 用途 |
| --- | --- |
| `src/` | 编辑器核心 |
| `extensions/` | 内置扩展与困困AI |
| `build/` | 正式构建和安装包脚本 |
| `scripts/` | 开发启动与辅助入口 |
| `cli/` | Rust CLI工程 |
| `resources/kuncode/` | 品牌、图标与安装资源 |
| `product.json` | 应用身份、扩展市场与产品配置 |

构建输出、依赖、本地缓存和根目录安装包由`.gitignore`排除，发行文件放到Releases。`build/`中的正式脚本、锁文件与品牌素材属于源码，应保留在版本控制中。

## 参与贡献

欢迎通过[Issues](https://github.com/Roylyl/KunCode/issues)反馈问题和建议，也欢迎补充具体场景语料。参与代码贡献前请阅读[CONTRIBUTING.md](CONTRIBUTING.md)，沿用现有工程规范和产品身份。

## 致谢与许可证

KunCode基于[Code - OSS](https://github.com/microsoft/vscode)定制，主体采用[MIT License](LICENSE.txt)，保留上游版权与许可声明。第三方组件请同时参考[ThirdPartyNotices.txt](ThirdPartyNotices.txt)及组件各自的许可。KunStyle规则仅作为原创语料的写作参考，技能包与私人聊天材料不随安装包分发。

KunCode是由603维护的独立项目，与Microsoft没有隶属、赞助或官方合作关系。Microsoft、Visual Studio Code及其他商标归其各自权利人所有。
