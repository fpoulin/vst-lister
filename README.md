# VST Plugin Lister

This tool creates a CSV file listing all your VST plugins from Ableton Live's database. It also helps music collaborators identify which plugins they have in common.

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

## Collaboration Features

This tool helps music producers identify which plugins they have in common with their collaborators. Here's how to use it:

1. Each collaborator should run this tool on their own machine to generate their personal `plugins.csv`
2. Share your CSV files with each other (e.g., via email, Dropbox, etc.)
3. Place all the CSV files in the same folder as this tool
4. Run the tool again, and when prompted to compare with other CSV files:
   - Select 'y' to enable comparison
   - Choose which CSV files to include in the comparison

The tool will generate a new `combined_plugins.csv` that shows:
- All plugins from all collaborators
- Which plugins are present in each collaborator's system
- Version differences between installations
- A "Collaboration Material" column indicating if a plugin is:
  - "Yes": Available on all systems with matching versions
  - "Check version": Available but with different versions
  - "No": Missing on some systems
- A "Remarks" column showing version details when there are differences

This makes it easy to:
- Find plugins you all have in common
- Identify which plugins need to be shared or purchased
- Spot version mismatches that might cause compatibility issues 