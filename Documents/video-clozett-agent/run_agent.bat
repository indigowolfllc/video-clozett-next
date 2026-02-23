@echo off
cd /d %~dp0

:: Node v20 ‚Ì‹êŠi‚±‚ê‚Í¡‚Ì‚Ü‚Ü‚ÅOKIj
set "NODE_PATH=C:\Users\Administrator\AppData\Local\nvm\v20.11.0"
set "PATH=%NODE_PATH%;%PATH%"

echo Checking Node version...
node -v

:loop
echo [Starting Agent with Node v20...]
node clozett-agent.mjs
echo [Agent stopped. Restarting in 5 seconds...]
timeout /t 5
goto loop