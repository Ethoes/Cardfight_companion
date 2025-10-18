@echo off
:: filepath: c:\Users\calvi\projects\Cardfight_companion\stop.bat
echo Stopping Cardfight Companion services...
call pm2 stop all
echo Services stopped.
pause