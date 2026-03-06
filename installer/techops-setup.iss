; ============================================================
; TechOps Asset Manager - Inno Setup Installer Script
; Creates a signed Windows installer (.exe)
; ============================================================
; Requirements:
;   - Inno Setup 6+ (https://jrsoftware.org/isinfo.php)
;   - Run build-installer.ps1 first to prepare files in staging/
; ============================================================

#define MyAppName "TechOps Asset Manager"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "PixelIT"
#define MyAppURL "https://github.com/TechFixDevelopers/techops-asset-manager"
#define MyAppExeName "start-techops.bat"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
DefaultDirName=C:\TechOps
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=output
OutputBaseFilename=TechOps-Asset-Manager-Setup-v{#MyAppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitModeOnly=x64compatible
SetupIconFile=icon\techops.ico
UninstallDisplayIcon={app}\icon\techops.ico
LicenseFile=license.txt
; For code signing, uncomment and configure:
; SignTool=signtool sign /f "$path-to-cert.pfx" /p "$password" /tr http://timestamp.digicert.com /td sha256 /fd sha256 $f

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Messages]
spanish.WelcomeLabel1=Bienvenido al instalador de {#MyAppName}
spanish.WelcomeLabel2=Este asistente instalara {#MyAppName} v{#MyAppVersion} en su equipo.%n%nSe instalara:%n- Servidor de aplicacion (Node.js)%n- Base de datos (PostgreSQL)%n- Servicio de Windows (auto-inicio)%n%nRequiere privilegios de Administrador.

[Types]
Name: "full"; Description: "Instalacion completa (App + PostgreSQL + Servicio)"
Name: "update"; Description: "Actualizar solo la aplicacion"

[Components]
Name: "app"; Description: "Aplicacion TechOps Asset Manager"; Types: full update; Flags: fixed
Name: "nodejs"; Description: "Node.js Runtime (portable)"; Types: full
Name: "pgsql"; Description: "PostgreSQL 15 (portable)"; Types: full
Name: "service"; Description: "Instalar como servicio Windows (auto-inicio)"; Types: full

[Files]
; Application files (standalone build)
Source: "staging\app\*"; DestDir: "{app}\app"; Components: app; Flags: ignoreversion recursesubdirs createallsubdirs

; Node.js portable
Source: "staging\node\*"; DestDir: "{app}\node"; Components: nodejs; Flags: ignoreversion recursesubdirs createallsubdirs

; PostgreSQL portable
Source: "staging\pgsql\*"; DestDir: "{app}\pgsql"; Components: pgsql; Flags: ignoreversion recursesubdirs createallsubdirs

; Scripts
Source: "scripts\*"; DestDir: "{app}\scripts"; Flags: ignoreversion recursesubdirs createallsubdirs

; Icon
Source: "icon\techops.ico"; DestDir: "{app}\icon"; Flags: ignoreversion

; Launcher batch
Source: "staging\start-techops.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "staging\stop-techops.bat"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\start-techops.bat"; IconFilename: "{app}\icon\techops.ico"; WorkingDir: "{app}"
Name: "{group}\Detener {#MyAppName}"; Filename: "{app}\stop-techops.bat"; IconFilename: "{app}\icon\techops.ico"; WorkingDir: "{app}"
Name: "{group}\Abrir en Navegador"; Filename: "http://localhost:3000"; IconFilename: "{app}\icon\techops.ico"
Name: "{group}\Desinstalar {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{commondesktop}\{#MyAppName}"; Filename: "http://localhost:3000"; IconFilename: "{app}\icon\techops.ico"

[Run]
; Configure environment
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\scripts\configure-env.ps1"" -InstallDir ""{app}"""; StatusMsg: "Configurando entorno..."; Flags: runhidden waituntilterminated
; Setup database
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\scripts\setup-db.ps1"" -InstallDir ""{app}"""; StatusMsg: "Inicializando base de datos..."; Flags: runhidden waituntilterminated; Components: pgsql
; Install service
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\scripts\install-service.ps1"" -InstallDir ""{app}"""; StatusMsg: "Instalando servicios..."; Flags: runhidden waituntilterminated; Components: service
; Open browser
Filename: "http://localhost:3000"; Description: "Abrir TechOps Asset Manager en el navegador"; Flags: postinstall shellexec nowait skipifsilent

[UninstallRun]
; Stop and uninstall services
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\scripts\install-service.ps1"" -InstallDir ""{app}"" -Uninstall"; Flags: runhidden waituntilterminated
; Stop PostgreSQL
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\scripts\stop-techops.ps1"" -InstallDir ""{app}"""; Flags: runhidden waituntilterminated

[UninstallDelete]
Type: filesandordirs; Name: "{app}\logs"
Type: filesandordirs; Name: "{app}\pgsql\data"

[Code]
// Add firewall rule during install
procedure CurStepChanged(CurStep: TSetupStep);
var
  ResultCode: Integer;
begin
  if CurStep = ssPostInstall then
  begin
    // Add firewall rule for port 3000
    Exec('netsh', 'advfirewall firewall add rule name="TechOps Asset Manager" dir=in action=allow protocol=TCP localport=3000', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
end;

// Remove firewall rule during uninstall
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  ResultCode: Integer;
begin
  if CurUninstallStep = usPostUninstall then
  begin
    Exec('netsh', 'advfirewall firewall delete rule name="TechOps Asset Manager"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
end;
