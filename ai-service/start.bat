@echo off
echo.
echo ================================================
echo   Livora AI Service - Startup Script
echo ================================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Install Python 3.9+ and add to PATH.
    pause
    exit /b 1
)

REM Check if models are trained
if not exist "models\saved\complaint_classifier.pkl" (
    echo [!] Models not found. Training now...
    echo.
    python -W ignore train.py
    if errorlevel 1 (
        echo ERROR: Training failed. Check data/ folder.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Training complete!
)

echo [OK] Starting Flask AI server on port 8000...
echo [OK] Press CTRL+C to stop
echo.
python app.py
