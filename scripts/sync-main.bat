@echo off
chcp 65001 >nul
cd /d "%~dp0.."
echo === main ブランチに切替 + 最新取得 ===
echo.
git checkout main
git pull
echo.
echo === 完了 ===
pause
