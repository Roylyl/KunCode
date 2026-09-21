# KunCode

KunCode is an independent cross-platform Code - OSS customization maintained by 603, with Windows and macOS support and a pixel-art capybara visual identity.

## Current customization

- Product branding: KunCode
- Application/data identifiers: `kuncode` / `.kuncode`
- Pixel capybara branding asset: `resources/kuncode/capybara-pixel.png`
- macOS bundle identifier: `com.kuncode.app`

## Build prerequisites

Use Node.js 24.18.0, or a newer release in the same 24.x line, as specified by [`.nvmrc`](.nvmrc). The install check requires npm below version 12 and rejects Yarn. From the repository root, run:

```sh
npm ci
npm run compile
```

Launch the development build with `./scripts/code.sh` on macOS/Linux or `.\scripts\code.bat` on Windows. Compilation output is placed under `.build/`, `out/`, and extension-specific output directories; release packaging is a separate platform-specific workflow. See the main [README](README.md) for current setup, validation, and packaging guidance.

This repository is based on Code - OSS and is not affiliated with Microsoft. Review [LICENSE.txt](LICENSE.txt) and [ThirdPartyNotices.txt](ThirdPartyNotices.txt) before redistribution.
