@echo off
echo ========================================
echo   Media to QR - Setup Script
echo ========================================
echo.

echo [1/4] Setting up Backend...
cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing Python dependencies...
pip install -r requirements.txt

echo.
echo [2/4] Backend setup complete!
echo.

cd ..

echo [3/4] Setting up Frontend...
cd frontend

echo Installing Node.js dependencies...
call npm install

echo.
echo [4/4] Frontend setup complete!
echo.

cd ..

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Start Backend:  cd backend ^&^& venv\Scripts\activate ^&^& uvicorn app.main:app --reload
echo 2. Start Frontend: cd frontend ^&^& npm run dev
echo.
echo Then open: http://localhost:5173
echo.
pause
