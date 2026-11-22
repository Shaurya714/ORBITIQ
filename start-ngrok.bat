@echo off
setlocal
echo ========================================================
echo  ORBITIQ - Temporary Live Public Demonstration (ngrok)
echo ========================================================
echo.
echo Both Frontend (Vite) and Dual Orbital Gateway (API) are
echo automatically proxied through port 5173.
echo.

if exist "%~dp0ngrok.exe" (
  set NGROK_BIN="%~dp0ngrok.exe"
) else (
  set NGROK_BIN=ngrok
)

rem Check if authtoken argument provided
if not "%~1"=="" (
  echo Configuring ngrok authtoken...
  %NGROK_BIN% config add-authtoken %~1
  echo Authtoken saved successfully.
  echo.
)

echo Starting public HTTPS tunnel to ORBITIQ (Port 5173)...
echo Share the displayed https://*.ngrok-free.app link with your teammates.
echo.
%NGROK_BIN% http 5173

pause
