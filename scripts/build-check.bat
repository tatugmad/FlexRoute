@echo off
chcp 65001 >nul
cd /d "%~dp0.."
echo === ビルドチェック ===
echo.
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo !!! ビルド失敗 !!!
) else (
    echo.
    echo === ビルド成功 ===
)
pause
