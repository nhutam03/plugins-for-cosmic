@echo off
echo Starting AI Assistant Plugin...
cd %~dp0
node dist/index.js --port=5001
