@echo off
:: filepath: c:\Users\calvi\projects\Cardfight_companion\expose.bat
echo Starting ngrok tunnels...
echo.
echo This will create public URLs for your Cardfight Companion app
echo Keep this window open while friends are using the app
echo.
echo Starting frontend tunnel (port 3000)...
start "ngrok-frontend" ngrok http 3000

echo Waiting 3 seconds for frontend tunnel to start...
timeout /t 3 /nobreak >nul

echo Starting backend tunnel (port 5000)...
start "ngrok-backend" ngrok http 5000

echo.
echo ========================================
echo Both tunnels are starting!
echo ========================================
echo.
echo 1. Check the ngrok windows that opened
echo 2. Look for the https://xxxxx.ngrok.io URLs
echo 3. Share the FRONTEND URL with your friends
echo.
echo The frontend will automatically connect to the backend
echo ========================================
pause