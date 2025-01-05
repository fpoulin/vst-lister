const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const fs = require('fs');
const path = require('path');

// Read database path from .db_path file
const dbPathFile = path.resolve('./.db_path');
if (!fs.existsSync(dbPathFile)) {
    console.error('Error: .db_path file not found. Please run the script using run-vst-lister.command');
    process.exit(1);
}
const dbPath = fs.readFileSync(dbPathFile, 'utf8').trim();
const outputPath = path.resolve('./plugins.csv');

async function exportPluginsToCSV(dbPath, outputPath) {
    try {
        console.log(`Attempting to open database at: ${dbPath}`);
        
        if (!fs.existsSync(dbPath)) {
            throw new Error(`Database file not found at ${dbPath}`);
        }

        const db = await sqlite.open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        
        console.log('Successfully opened database');

        // Get all rows from plugins table
        const rows = await db.all(`
            SELECT 
                vendor,
                name,
                version,
                sdk_version,
                subcategories
            FROM plugins
            ORDER BY 
                vendor COLLATE NOCASE,
                name COLLATE NOCASE,
                version COLLATE NOCASE
        `);

        // Create CSV content starting with headers
        let csvContent = 'Company,Software,Version,SDK Version,Type\n';

        // Add each row to CSV content
        rows.forEach(row => {
            csvContent += [
                escapeCsvField(row.vendor),
                escapeCsvField(row.name),
                escapeCsvField(row.version),
                escapeCsvField(row.sdk_version),
                escapeCsvField(row.subcategories)
            ].join(',') + '\n';
        });

        // Write to file
        fs.writeFileSync(outputPath, csvContent);
        console.log(`CSV file created successfully at: ${outputPath}`);
        console.log(`Total plugins exported: ${rows.length}`);

        await db.close();
    } catch (err) {
        console.error('Error:', err);
        if (err.code === 'SQLITE_CANTOPEN') {
            console.error('Could not open database file. Make sure the path is correct and you have proper permissions.');
        }
    }
}

// Helper function to escape CSV fields
function escapeCsvField(field) {
    if (field === null || field === undefined) {
        return '';
    }
    field = field.toString();
    // If the field contains commas, quotes, or newlines, wrap it in quotes
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        // Double up any quotes in the field
        field = field.replace(/"/g, '""');
        // Wrap the field in quotes
        return `"${field}"`;
    }
    return field;
}

// Usage
exportPluginsToCSV(dbPath, outputPath);