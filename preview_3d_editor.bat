@echo off
setlocal
title The Vault - 3D Room Editor

echo ====================================================
echo   THE VAULT: ROOM 04 - 3D ROOM EDITOR AND VIEWER
echo ====================================================
echo.
echo Launching 3D Editor Preview Server...
echo Hotkeys:
echo   [G] Toggle 3D Transform Gizmo and Editor Panel
echo   [W] Move / Translate Mode
echo   [E] Rotate Mode (Degrees)
echo   [R] Scale Mode
echo   [Esc] Deselect Asset
echo.
echo Opening browser to http://localhost:5173/?editor=true
echo Press Ctrl+C in this window to stop the server when done.
echo.

start "" "http://localhost:5173/?editor=true"
call npx vite --port 5173 --strictPort

endlocal
