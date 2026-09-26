@echo off
cd /d "%~dp0"
set "FREEMAP_NODE=node"
where node >nul 2>&1
if errorlevel 1 set "FREEMAP_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
echo FreeMap - http://localhost:4173
echo Keep this window open while using the website.
"%FREEMAP_NODE%" server.mjs
pause
