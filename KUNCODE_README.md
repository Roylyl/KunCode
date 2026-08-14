# KunCode

KunCode is an independent cross-platform Code - OSS customization maintained by 603, with Windows and macOS support and a pixel-art capybara visual identity.

## Current customization

- Product branding: KunCode
- Application/data identifiers: `kuncode` / `.kuncode`
- Pixel capybara branding asset: `resources/kuncode/capybara-pixel.png`
- macOS bundle identifier: `com.kuncode.app`

## Build prerequisites

Install Node.js LTS and Yarn, then from this directory run:

```powershell
yarn
yarn gulp compile
yarn gulp vscode-win32-x64-archive
```

Build output is placed under `.build/` and `out/`.

This repository is based on Code - OSS and is not affiliated with Microsoft. Review [LICENSE.txt](LICENSE.txt) and [ThirdPartyNotices.txt](ThirdPartyNotices.txt) before redistribution.
