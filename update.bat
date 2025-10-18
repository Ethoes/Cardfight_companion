@echo off
:: filepath: c:\Users\calvi\projects\Cardfight_companion\update.bat
echo Updating Cardfight Companion...

echo Pulling latest changes from GitHub...
git pull origin main

echo Stopping services...
call pm2 stop all

echo Building React frontend...
cd react_frontend
call npm run build
cd ..

echo Restarting services...
call pm2 start ecosystem.config.js

echo Update complete!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
pause