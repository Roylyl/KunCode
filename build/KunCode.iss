[Setup]
AppId={{9E1B55D3-7C1F-4A7C-9B53-1E6C2A31F0A1}
AppName=KunCode
AppVersion=1.133.0
AppPublisher=KunCode
DefaultDirName={autopf}\KunCode
DefaultGroupName=KunCode
OutputDir=C:\Users\l3092\Desktop
OutputBaseFilename=KunCodeSetup-x64-1.133.0
Compression=lzma2
SolidCompression=yes
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=admin
WizardStyle=modern
SetupIconFile=C:\Users\l3092\Desktop\KunCode\resources\kuncode\installer-icon.ico
UninstallDisplayName=KunCode卸载程序
UninstallDisplayIcon={app}\KunCode卸载程序.ico

[Files]
Source: "C:\Users\l3092\Desktop\KunCode\.build\VSCode-win32-x64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "C:\Users\l3092\Desktop\KunCode\resources\kuncode\uninstaller-icon.ico"; DestDir: "{app}"; DestName: "KunCode卸载程序.ico"; Flags: ignoreversion
Source: "C:\Users\l3092\Desktop\KunCode\build\KunCode卸载程序.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\KunCode"; Filename: "{app}\KunCode.exe"; WorkingDir: "{app}"
Name: "{autodesktop}\KunCode"; Filename: "{app}\KunCode.exe"; WorkingDir: "{app}"
Name: "{autoprograms}\KunCode卸载程序"; Filename: "{app}\KunCode卸载程序.exe"; IconFilename: "{app}\KunCode卸载程序.ico"

[Registry]
Root: HKLM; Subkey: "Software\Microsoft\Windows\CurrentVersion\Uninstall\{{9E1B55D3-7C1F-4A7C-9B53-1E6C2A31F0A1}_is1"; ValueType: string; ValueName: "UninstallString"; ValueData: "{app}\KunCode卸载程序.exe"; Flags: uninsdeletevalue
Root: HKLM; Subkey: "Software\Microsoft\Windows\CurrentVersion\Uninstall\{{9E1B55D3-7C1F-4A7C-9B53-1E6C2A31F0A1}_is1"; ValueType: string; ValueName: "QuietUninstallString"; ValueData: "{app}\KunCode卸载程序.exe /VERYSILENT /SUPPRESSMSGBOXES /NORESTART"; Flags: uninsdeletevalue

[Run]
Filename: "{app}\KunCode.exe"; Description: "启动 KunCode"; Flags: nowait postinstall skipifsilent

[Code]
procedure CurStepChanged(CurStep: TSetupStep);
var
  UninstallKey: string;
  LauncherPath: string;
begin
  if CurStep = ssPostInstall then
  begin
    UninstallKey := 'Software\Microsoft\Windows\CurrentVersion\Uninstall\{9E1B55D3-7C1F-4A7C-9B53-1E6C2A31F0A1}_is1';
    LauncherPath := ExpandConstant('{app}\KunCode卸载程序.exe');
    RegWriteStringValue(HKLM, UninstallKey, 'UninstallString', '"' + LauncherPath + '"');
    RegWriteStringValue(HKLM, UninstallKey, 'QuietUninstallString', '"' + LauncherPath + '" /VERYSILENT /SUPPRESSMSGBOXES /NORESTART');
  end;
end;
