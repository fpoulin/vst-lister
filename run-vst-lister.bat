@echo off
setlocal EnableDelayedExpansion

:: Change to the directory where the script is located
cd /d "%~dp0"

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org/en
    echo Click the 'LTS' version, then run this script again.
    echo.
    echo Press any key to open the Node.js website...
    pause >nul
    start https://nodejs.org/en
    exit /b 1
)

:: Check if npm packages are installed
if not exist "node_modules" (
    echo 📦 Installing required packages...
    npm install
)

:: Try to automatically locate the database file
set "DEFAULT_DB_PATH=%LOCALAPPDATA%\Ableton\Live Database\Live-plugins-1.db"

:: Check if we have a saved database path
set "DB_PATH_FILE=.db_path"
if exist "%DB_PATH_FILE%" (
    set /p SAVED_PATH=<"%DB_PATH_FILE%"
    echo 💾 Last used database: !SAVED_PATH!
    echo Press Enter to use this path again, or drag a new file to change it:
    set /p "NEW_PATH="
    if "!NEW_PATH!"=="" (
        set "DB_PATH=!SAVED_PATH!"
    ) else (
        set "DB_PATH=!NEW_PATH!"
        echo !DB_PATH!>"%DB_PATH_FILE%"
    )
) else (
    if exist "%DEFAULT_DB_PATH%" (
        echo 📂 Found Ableton database at: %DEFAULT_DB_PATH%
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
    echo !DB_PATH!>"%DB_PATH_FILE%"
)

:: Run the script
node vst-lister.js

:: If successful, offer to compare with other CSVs
if %ERRORLEVEL% equ 0 (
    echo ✅ Initial CSV generated successfully!
    echo.
    set /p "COMPARE_CHOICE=Would you like to compare with other CSV files in this directory? (y/n) "
    
    if /i "!COMPARE_CHOICE!"=="y" (
        :: Create a temporary file to store the list of CSVs to compare
        set "TEMP_LIST=.csv_list"
        echo plugins.csv> "!TEMP_LIST!"
        
        :: Find all other CSV files
        for %%F in (*.csv) do (
            if /i not "%%F"=="plugins.csv" if /i not "%%F"=="combined_plugins.csv" (
                echo Found: %%F
                set /p "INCLUDE_FILE=Include this file in comparison? (y/n) "
                if /i "!INCLUDE_FILE!"=="y" (
                    echo %%F>> "!TEMP_LIST!"
                )
            )
        )
        
        :: If we have more than just the original file
        set "COUNT=0"
        for /f %%A in ('type "!TEMP_LIST!"') do set /a "COUNT+=1"
        
        if !COUNT! gtr 1 (
            echo Combining CSV files...
            node vst-combine.js @"!TEMP_LIST!" > combined_plugins.csv
            if !ERRORLEVEL! equ 0 (
                echo ✅ Combined CSV generated successfully!
                start combined_plugins.csv
            ) else (
                echo ❌ Error combining CSV files
            )
        ) else (
            echo No additional CSV files selected for comparison.
            start plugins.csv
        )
        
        :: Clean up
        del "!TEMP_LIST!" 2>nul
    ) else (
        start plugins.csv
    )
)

echo.
echo Press any key to exit...
pause >nul 