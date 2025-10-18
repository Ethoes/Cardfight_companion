@echo off
:: filepath: c:\Users\calvi\projects\Cardfight_companion\start.bat
echo Starting Cardfight Companion...

echo Building React frontend...
cd react_frontend
call npm run build
cd ..

echo Starting services with PM2...
call pm2 start ecosystem.config.js

echo Services started!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Next step: Run expose.bat to make it publicly accessible
echo.
echo To stop services: pm2 stop all
echo To restart services: pm2 restart all
echo To view logs: pm2 logs
pause