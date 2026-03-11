@echo off
chcp 65001 >nul
cd /d "%~dp0.."
echo === FlexRoute Dev Server (LAN) ===
echo.
echo スマホから Network URL にアクセスしてください
echo.
npm run dev:host
pause
