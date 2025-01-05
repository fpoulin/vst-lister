# VST Plugin Lister

This tool creates a CSV file listing all your VST plugins from Ableton Live's database.

⚠️ Disclaimer: This tool is 100% AI-generated and has only been tested with Ableton Live 12.1. Use at your own risk.

## Quick Start

### One-time Setup (for all platforms)
1. Download and install Node.js from: https://nodejs.org/en (click the "LTS" version)

### For Windows Users
1. Double-click the `run-vst-lister.bat` file
2. The script will try to automatically find your Ableton database. If it can't find it, you'll be asked to locate it manually. The database is typically located at:
   ```
   C:\Users\YOUR_USERNAME\AppData\Local\Ableton\Live Database\Live-plugins-1.db
   ```
   If prompted, just drag and drop this file into the command window and press Enter.
   
   Note: Replace `YOUR_USERNAME` with your Windows username.

### For Mac Users
1. First time only: Open Terminal (press Cmd+Space, type "Terminal" and press Enter) and run:
   ```bash
   cd path/to/vst-lister
   chmod +x run-vst-lister.command
   ```

2. Double-click the `run-vst-lister.command` file
3. The script will try to automatically find your Ableton database. If it can't find it, you'll be asked to locate it manually. The database is typically located at:
   ```
   /Users/YOUR_USERNAME/Library/Application Support/Ableton/Live Database/Live-plugins-1.db
   ```
   If prompted, just drag and drop this file into the terminal window and press Enter.
   
   Note: Replace `YOUR_USERNAME` with your Mac username. To find your username, type `whoami` in Terminal.

### After Running (all platforms)
The exported plugins list will be saved as `plugins.csv` and should open automatically in your default spreadsheet application (Excel/Numbers). 