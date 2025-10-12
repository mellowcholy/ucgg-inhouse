@echo off
REM GitHub Desktop uses this .bat file to trigger the PowerShell script
powershell -ExecutionPolicy Bypass -File "%~dp0post-checkout.ps1"
