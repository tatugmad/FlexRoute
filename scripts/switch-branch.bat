@echo off
chcp 65001 >nul
cd /d "%~dp0.."
echo === Claude Code Web ブランチに切替 ===
echo.
git fetch
echo.
for /f "tokens=1" %%i in ('git branch -r --sort^=-committerdate ^| findstr /v HEAD ^| findstr /v main') do (
    set "LATEST=%%i"
    goto :found
)
:found
if not defined LATEST (
    echo リモートブランチが見つかりません
    pause
    exit /b
)
set "LATEST=%LATEST:origin/=%"
echo --- 最新ブランチ: %LATEST% ---
echo.
set /p BRANCH="Enter でこのブランチに切替（変更する場合は入力）: "
if "%BRANCH%"=="" set "BRANCH=%LATEST%"
git checkout %BRANCH%
git pull origin %BRANCH%
echo.
echo === %BRANCH% に切替完了 ===
pause
