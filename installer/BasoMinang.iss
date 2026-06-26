#define MyAppName "BasoMinang"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Syahrul Efendi"
#define MyAppURL "https://github.com/syhrlf-e/basominang"

[Setup]
AppId={{E65EBD29-6DB5-498C-AC26-C1DF9809BD1A}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={localappdata}\Programs\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=..\installer-output
OutputBaseFilename=BasoMinang-Setup-{#MyAppVersion}
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayName={#MyAppName}

[Files]
Source: "..\dist\bm.exe"; DestDir: "{app}\bin"; Flags: ignoreversion
Source: "..\dist\basominang.exe"; DestDir: "{app}\bin"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\BasoMinang REPL"; Filename: "{app}\bin\bm.exe"
Name: "{autoprograms}\BasoMinang Help"; Filename: "{app}\bin\bm.exe"; Parameters: "--help"

[Code]
const
  UserEnvironmentKey = 'Environment';
  WM_SETTINGCHANGE = $001A;
  SMTO_ABORTIFHUNG = $0002;

function SendMessageTimeout(hWnd: Longint; Msg: Longint; wParam: Longint;
  lParam: String; fuFlags: Longint; uTimeout: Longint;
  var lpdwResult: Longint): Longint;
  external 'SendMessageTimeoutW@user32.dll stdcall';

function IsPathInList(PathValue, Candidate: String): Boolean;
begin
  Result := Pos(';' + Lowercase(Candidate) + ';', ';' + Lowercase(PathValue) + ';') > 0;
end;

procedure BroadcastEnvironmentChange;
var
  ResultCode: Longint;
begin
  SendMessageTimeout(HWND_BROADCAST, WM_SETTINGCHANGE, 0, 'Environment',
    SMTO_ABORTIFHUNG, 5000, ResultCode);
end;

procedure AddToUserPath(InstallPath: String);
var
  PathValue: String;
begin
  if not RegQueryStringValue(HKCU, UserEnvironmentKey, 'Path', PathValue) then
    PathValue := '';

  if not IsPathInList(PathValue, InstallPath) then begin
    if (PathValue <> '') and (PathValue[Length(PathValue)] <> ';') then
      PathValue := PathValue + ';';
    RegWriteStringValue(HKCU, UserEnvironmentKey, 'Path', PathValue + InstallPath);
    BroadcastEnvironmentChange;
  end;
end;

procedure RemoveFromUserPath(InstallPath: String);
var
  PathValue: String;
  WrappedPath: String;
begin
  if not RegQueryStringValue(HKCU, UserEnvironmentKey, 'Path', PathValue) then
    exit;

  WrappedPath := ';' + PathValue + ';';
  while StringChangeEx(WrappedPath, ';' + InstallPath + ';', ';', True) > 0 do begin
  end;
  while StringChangeEx(WrappedPath, ';;', ';', True) > 0 do begin
  end;

  if Length(WrappedPath) > 2 then begin
    PathValue := Copy(WrappedPath, 2, Length(WrappedPath) - 2);
    RegWriteStringValue(HKCU, UserEnvironmentKey, 'Path', PathValue);
  end else begin
    RegDeleteValue(HKCU, UserEnvironmentKey, 'Path');
  end;
  BroadcastEnvironmentChange;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
    AddToUserPath(ExpandConstant('{app}\bin'));
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usUninstall then
    RemoveFromUserPath(ExpandConstant('{app}\bin'));
end;
