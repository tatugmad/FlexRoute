@echo off
chcp 65001 >nul
cd /d "%~dp0.."
echo === FlexRoute Dev Server ===
echo.
npm run dev:host
pause
