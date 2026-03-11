@echo off
chcp 65001 >nul
cd /d "%~dp0.."
echo === Claude Code Web ブランチに切替 ===
echo.
git fetch
echo.
echo --- リモートブランチ一覧（新しい順） ---
git branch -r --sort=-committerdate | findstr /v HEAD
echo.
set /p BRANCH="ブランチ名を入力（origin/ は不要）: "
if "%BRANCH%"=="" (
    echo キャンセルしました
    pause
    exit /b
)
git checkout %BRANCH%
git pull origin %BRANCH%
echo.
echo === %BRANCH% に切替完了 ===
pause
