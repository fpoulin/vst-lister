#!/bin/bash

# Change to the directory where the script is located
cd "$(dirname "$0")"

# Check if Node.js is installed
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js is not installed!"
    echo "Please download and install Node.js from: https://nodejs.org/en"
    echo "Click the 'LTS' version, then run this script again."
    echo ""
    echo "Press Enter to open the Node.js website..."
    read
    open "https://nodejs.org/en"
    exit 1
fi

# Check if npm packages are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing required packages..."
    npm install
fi

# Try to automatically locate the database file
DEFAULT_DB_PATH="$HOME/Library/Application Support/Ableton/Live Database/Live-plugins-1.db"

# Check if we have a saved database path
DB_PATH_FILE=".db_path"
if [ -f "$DB_PATH_FILE" ]; then
    SAVED_PATH=$(cat "$DB_PATH_FILE")
    echo "💾 Last used database: $SAVED_PATH"
    echo "Press Enter to use this path again, or drag a new file to change it:"
    read NEW_PATH
    if [ -z "$NEW_PATH" ]; then
        DB_PATH="$SAVED_PATH"
    else
        DB_PATH=$(echo "$NEW_PATH" | tr -d "'")
        echo "$DB_PATH" > "$DB_PATH_FILE"
    fi
else
    if [ -f "$DEFAULT_DB_PATH" ]; then
        echo "📂 Found Ableton database at: $DEFAULT_DB_PATH"
        echo "Press Enter to use this file, or drag a different file to change it:"
        read NEW_PATH
        if [ -z "$NEW_PATH" ]; then
            DB_PATH="$DEFAULT_DB_PATH"
        else
            DB_PATH=$(echo "$NEW_PATH" | tr -d "'")
        fi
    else
        echo "Please drag your Live-plugins-1.db file into this window and press Enter."
        echo "Tip: The file is usually located at:"
        echo "$DEFAULT_DB_PATH"
        read DB_PATH
        DB_PATH=$(echo "$DB_PATH" | tr -d "'")
    fi
    echo "$DB_PATH" > "$DB_PATH_FILE"
fi

# Run the script
node vst-lister.js

# If successful, open the CSV file
if [ $? -eq 0 ]; then
    echo "✅ Done! Opening the CSV file..."
    open plugins.csv
fi

echo ""
echo "Press Enter to exit..."
read 