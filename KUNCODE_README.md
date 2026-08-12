# KunCode

KunCode is a Windows-focused Code - OSS customization with a pixel-art capybara visual identity.

## Current customization

- Product branding: KunCode
- Windows application/data identifiers: `kuncode` / `.kuncode`
- Pixel capybara branding asset: `resources/kuncode/capybara-pixel.png`

## Build prerequisites

Install Node.js LTS and Yarn, then from this directory run:

```powershell
yarn
yarn gulp compile
yarn gulp vscode-win32-x64-archive
```

The generated Windows archive is placed under `.build/win32-x64-archive`.

This repository is based on Code - OSS. Review the upstream license and third-party notices before redistribution.
