@echo off
setlocal enabledelayedexpansion

:: Change to the directory where the script is located
cd /d "%~dp0"

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org/en
    echo Click the 'LTS' version, then run this script again.
    echo.
    echo Press Enter to open the Node.js website...
    pause >nul
    start https://nodejs.org/en
    exit /b 1
)

:: Check if npm packages are installed
if not exist "node_modules\" (
    echo Installing required packages...
    call npm install
)

:: Try to automatically locate the database file
set "DEFAULT_DB_PATH=%LOCALAPPDATA%\Ableton\Live Database\Live-plugins-1.db"

:: Check if we have a saved database path
set "DB_PATH_FILE=.db_path"
if exist "%DB_PATH_FILE%" (
    set /p SAVED_PATH=<"%DB_PATH_FILE%"
    echo Last used database: !SAVED_PATH!
    echo Press Enter to use this path again, or drag a new file to change it:
    set /p "NEW_PATH="
    if "!NEW_PATH!"=="" (
        set "DB_PATH=!SAVED_PATH!"
    ) else (
        set "DB_PATH=!NEW_PATH!"
        echo !DB_PATH!> "%DB_PATH_FILE%"
    )
) else (
    if exist "%DEFAULT_DB_PATH%" (
        echo Found Ableton database at: %DEFAULT_DB_PATH%
        echo Press Enter to use this file, or drag a different file to change it:
        set /p "NEW_PATH="
        if "!NEW_PATH!"=="" (
            set "DB_PATH=%DEFAULT_DB_PATH%"
        ) else (
            set "DB_PATH=!NEW_PATH!"
        )
    ) else (
        echo Please drag your Live-plugins-1.db file into this window and press Enter.
        echo Tip: The file is usually located at:
        echo %DEFAULT_DB_PATH%
        set /p "DB_PATH="
    )
    echo !DB_PATH!> "%DB_PATH_FILE%"
)

:: Run the script
node vst-lister.js

:: If successful, open the CSV file
if %ERRORLEVEL% EQU 0 (
    echo Done! Opening the CSV file...
    start "" "plugins.csv"
)

echo.
echo Press Enter to exit...
pause >nul 