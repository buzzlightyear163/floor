@echo off
setlocal
cd /d "%~dp0"
title DESK - buildafirm clone (dev server)

where node >/dev/null 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js hittades inte. Installera Node 20.19+ eller 22.12+ fran https://nodejs.org/
  echo  och kor start.bat igen.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\vite" (
  echo  Installerar dependencies - forsta gangen tar det en liten stund...
  call npm install
  if errorlevel 1 (
    echo.
    echo  npm install misslyckades. Se felmeddelandet ovan.
    pause
    exit /b 1
  )
)

echo  Startar dev-servern pa http://localhost:5173 ...
call npm run dev

pause
