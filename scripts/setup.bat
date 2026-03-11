@echo off
cd /d "%~dp0.."
echo === FlexRoute 初期セットアップ ===
echo.

echo [1/2] npm install ...
call npm install
echo.

if not exist .env (
    echo [2/2] .env ファイルを作成します
    echo VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE> .env
    echo VITE_GOOGLE_MAPS_MAP_ID=YOUR_MAP_ID_HERE>> .env
    echo.
    echo .env を作成しました。APIキーを書き換えてください:
    echo   %cd%\.env
) else (
    echo [2/2] .env は既に存在します。スキップ
)

echo.
echo === セットアップ完了 ===
echo 「dev.bat」で開発サーバーを起動できます
pause
