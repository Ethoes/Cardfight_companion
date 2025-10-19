@echo off
:: filepath: c:\Users\calvi\projects\Cardfight_companion\expose.bat
echo Starting ngrok tunnels...
echo.
echo Stopping any existing ngrok processes...
taskkill /f /im ngrok.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo Checking if backend is running (serving both frontend and API)...
netstat -an | findstr ":5000" >nul
if %errorlevel% neq 0 (
    echo ERROR: No service running on port 5000 - start your backend first
    echo The backend now serves both the frontend and API
    echo Run: cd backend && python app.py
    pause
    exit /b 1
)

echo Starting single ngrok tunnel for combined frontend/backend (port 5000)...
start "ngrok-cardfight" cmd /k "ngrok http 5000"

echo ========================================
echo SUCCESS! Your Cardfight Companion is now public!
echo ========================================
echo.
echo Share this URL with friends to access your app:
echo Check the ngrok window for your public URL
echo.
echo The URL will serve both:
echo - Frontend: https://your-url.ngrok.io/
echo - API: https://your-url.ngrok.io/api/
echo ========================================

echo.
echo ========================================
echo IMPORTANT: Update your frontend config!
echo ========================================
echo.
echo 1. Check the ngrok backend window for the https URL
echo 2. Copy the backend URL (https://xxxxx.ngrok.io)
echo 3. Update react_frontend/.env with:
echo    REACT_APP_API_URL=https://your-backend-url.ngrok.io
echo 4. Restart your frontend with: npm start
echo.
echo Then share the FRONTEND ngrok URL with friends
echo ========================================
pause