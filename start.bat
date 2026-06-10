@echo off
echo Starting Smart Notes System...
echo.

echo Starting Backend (Port 3000)...
start "Backend" cmd /k "cd /d %~dp0backend && npm start"

echo Starting Frontend (Port 5180)...
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5180
echo ============================================
echo Press any key to exit...
pause > nul