# KunCode2.0.0

KunCode is an independent Code - OSS customization maintained by 603. It combines the editor workbench with pixel-art capybara branding and the built-in Kunkun AI local chat assistant.

The 2.0.0 corpus contains 1,522 original scenes across programming, campus life, and everyday collaboration. Responses use weighted keyword matching, limited follow-up context, and recent-response avoidance. Kunkun AI does not use a remote model or web search and does not edit project files. Its style simulation does not represent a real person's statements.

Product identifiers remain `kuncode` and `.kuncode`; the macOS bundle identifier is `com.kuncode.app`. The Windows x64 installer is named `KunCode-Windows-x64-2.0.0.exe`.

Application and workspace icons use the capybara app artwork. The Windows installer and wizard use the capybara with a blue installation arrow; the installed-apps list uses the red-cross uninstall artwork. Inno Setup shares the installer icon with its generated uninstaller executable. macOS application and DMG icons, and Linux package icons, also use the KunCode capybara assets.

Use Node.js24.18.0 or a newer release in the same 24.x line, with npm below version12. From the repository root:

```sh
npm ci
npm run compile
```

Launch with `./scripts/code.sh` on macOS/Linux or `.\scripts\code.bat` on Windows. See the main [README](README.md) for installation, assistant usage, corpus maintenance, and Windows packaging commands.

The project is not affiliated with Microsoft. Review [LICENSE.txt](LICENSE.txt), [ThirdPartyNotices.txt](ThirdPartyNotices.txt), and component-specific notices before redistribution.
