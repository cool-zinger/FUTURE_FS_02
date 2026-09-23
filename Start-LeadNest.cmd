@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -File "%~dp0Start-LeadNest.ps1"
pause

