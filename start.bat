@echo off
setlocal
title The Vault: Room 04

echo ===================================================
echo [The Vault: Room 04] - Initialization Sequence
echo ===================================================
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js was not found in PATH.
    echo Please install Node.js from https://nodejs.org/ to launch this application.
    echo.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm was not found in PATH.
    echo Please verify your Node.js installation.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [SETUP] Initial setup: Installing dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install project dependencies.
        echo.
        pause
        exit /b %ERRORLEVEL%
    )
)

echo [SERVER] Starting development server and opening browser...
echo Close this window or press Ctrl+C to terminate the session.
echo.

call npm run dev -- --open

if %ERRORLEVEL% neq 0 (
    echo.
    echo [SERVER] Server stopped with status code %ERRORLEVEL%.
    pause
)

endlocal
