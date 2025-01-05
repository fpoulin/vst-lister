const fs = require('fs');
const path = require('path');
const csv = require('csv-parse');
const { stringify } = require('csv-stringify/sync');

function parseVersion(version) {
    if (!version) return [0];
    
    // Handle numeric versions (e.g., "2400")
    if (/^\d+$/.test(version)) {
        return [parseInt(version)];
    }
    
    // Handle VST version format (e.g., "VST 3.7.6")
    if (version.startsWith('VST ')) {
        version = version.replace('VST ', '');
    }
    
    // Handle semver format (e.g., "3.7.6")
    return version.split('.').map(n => parseInt(n) || 0);
}

function compareVersions(v1, v2) {
    // If either version is null/undefined, treat them as equal
    if (!v1 || !v2) return 0;
    
    // Check if versions are in different formats (VST2 vs VST3)
    const isV1Numeric = /^\d+$/.test(v1);
    const isV2Numeric = /^\d+$/.test(v2);
    
    // If they're in different formats, they should never be compared
    if (isV1Numeric !== isV2Numeric) {
        throw new Error('Cannot compare VST2 and VST3 versions');
    }
    
    // If both versions are numeric (VST2), compare them directly
    if (isV1Numeric && isV2Numeric) {
        return parseInt(v1) - parseInt(v2);
    }
    
    // Otherwise, compare as semver (VST3)
    const parts1 = parseVersion(v1);
    const parts2 = parseVersion(v2);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const part1 = parts1[i] || 0;
        const part2 = parts2[i] || 0;
        if (part1 > part2) return 1;
        if (part1 < part2) return -1;
    }
    return 0;
}

function validateCsvFormat(headers) {
    const requiredColumns = ['Company', 'Software', 'SDK Version', 'Type'];
    return requiredColumns.every(col => headers.includes(col));
}

async function readCsvFile(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv.parse({ columns: true, skip_empty_lines: true }))
            .on('data', data => results.push(data))
            .on('end', () => resolve(results))
            .on('error', error => reject(error));
    });
}

function comparePluginVersions(row1, row2) {
    // First compare SDK versions
    const sdkCompare = compareVersions(row1['SDK Version'], row2['SDK Version']);
    if (sdkCompare !== 0) return sdkCompare;
    
    // If SDK versions are equal, compare plugin versions
    return compareVersions(row1.Version, row2.Version);
}

async function combineCsvFiles(mainFile, additionalFiles) {
    try {
        // Read the main file first
        const mainData = await readCsvFile(mainFile);
        if (mainData.length === 0 || !validateCsvFormat(Object.keys(mainData[0]))) {
            throw new Error(`Invalid format in main file: ${mainFile}`);
        }

        // Create a map to store the combined data
        const pluginMap = new Map();
        
        // Process main file
        const mainFileName = path.basename(mainFile, '.csv');
        mainData.forEach(row => {
            // Include VST version type in the key
            const isVst2 = /^\d+$/.test(row['SDK Version']);
            const key = `${row.Software}|${row.Company}|${isVst2 ? 'VST2' : 'VST3'}`;
            const allSources = {};
            // Initialize all sources as MISSING
            [mainFileName, ...additionalFiles.map(f => path.basename(f, '.csv'))].forEach(source => {
                allSources[source] = 'MISSING';
            });
            // Set main file as OK
            allSources[mainFileName] = 'OK';
            
            pluginMap.set(key, {
                Company: row.Company,
                Software: row.Software,
                Version: row.Version || '',
                'SDK Version': row['SDK Version'],
                Type: row.Type || '',
                sources: allSources
            });
        });

        // Process additional files
        for (const file of additionalFiles) {
            const fileName = path.basename(file, '.csv');
            const fileData = await readCsvFile(file);
            
            if (!validateCsvFormat(Object.keys(fileData[0]))) {
                console.warn(`Skipping ${file} due to invalid format`);
                continue;
            }

            fileData.forEach(row => {
                // Include VST version type in the key
                const isVst2 = /^\d+$/.test(row['SDK Version']);
                const key = `${row.Software}|${row.Company}|${isVst2 ? 'VST2' : 'VST3'}`;
                if (pluginMap.has(key)) {
                    const existing = pluginMap.get(key);
                    try {
                        const versionCompare = comparePluginVersions(row, {
                            'SDK Version': existing['SDK Version'],
                            'Version': existing.Version
                        });
                        
                        if (versionCompare === 0) {
                            // Same version - mark as OK
                            existing.sources[fileName] = 'OK';
                        } else if (versionCompare > 0) {
                            // Current file has newer version
                            // Update the version info
                            existing['SDK Version'] = row['SDK Version'];
                            existing.Version = row.Version || '';
                            existing.Type = row.Type || '';
                            // Mark current file as OK
                            existing.sources[fileName] = 'OK';
                            // Mark all other non-MISSING sources as UPDATE
                            Object.keys(existing.sources).forEach(source => {
                                if (source !== fileName && existing.sources[source] !== 'MISSING') {
                                    existing.sources[source] = {
                                        status: 'UPDATE',
                                        originalVersion: source === mainFileName ? existing.Version : 
                                            (typeof existing.sources[source] === 'object' ? 
                                                existing.sources[source].originalVersion : existing.Version)
                                    };
                                }
                            });
                        } else {
                            // Current file has older version
                            existing.sources[fileName] = {
                                status: 'UPDATE',
                                originalVersion: row.Version || ''
                            };
                        }
                    } catch (error) {
                        // If version comparison fails (different VST types), treat as a separate plugin
                        const allSources = {};
                        [mainFileName, ...additionalFiles.map(f => path.basename(f, '.csv'))].forEach(source => {
                            allSources[source] = 'MISSING';
                        });
                        allSources[fileName] = 'OK';
                        
                        pluginMap.set(key, {
                            Company: row.Company,
                            Software: row.Software,
                            Version: row.Version || '',
                            'SDK Version': row['SDK Version'],
                            Type: row.Type || '',
                            sources: allSources
                        });
                    }
                } else {
                    // New plugin found in additional file
                    const allSources = {};
                    [mainFileName, ...additionalFiles.map(f => path.basename(f, '.csv'))].forEach(source => {
                        allSources[source] = 'MISSING';
                    });
                    allSources[fileName] = 'OK';
                    
                    pluginMap.set(key, {
                        Company: row.Company,
                        Software: row.Software,
                        Version: row.Version || '',
                        'SDK Version': row['SDK Version'],
                        Type: row.Type || '',
                        sources: allSources
                    });
                }
            });
        }

        // Convert map to array and prepare for CSV output
        const allSourceFiles = [mainFileName, ...additionalFiles.map(f => path.basename(f, '.csv'))];
        const output = Array.from(pluginMap.values())
            .sort((a, b) => {
                // First sort by vendor (case-insensitive)
                const vendorCompare = a.Company.toLowerCase().localeCompare(b.Company.toLowerCase());
                if (vendorCompare !== 0) return vendorCompare;
                
                // Then by name (case-insensitive)
                return a.Software.toLowerCase().localeCompare(b.Software.toLowerCase());
            })
            .map(plugin => {
                const baseColumns = {
                    Company: plugin.Company,
                    Software: plugin.Software,
                    Version: plugin.Version,
                    'SDK Version': plugin['SDK Version'],
                    Type: plugin.Type
                };
                
                // Add source columns
                const sourceColumns = allSourceFiles.reduce((acc, source) => ({
                    ...acc,
                    [source]: typeof plugin.sources[source] === 'object' ? 
                        plugin.sources[source].status : plugin.sources[source] || 'MISSING'
                }), {});

                // Calculate overall status by looking at source columns only
                const sourceStatuses = allSourceFiles.map(source => 
                    typeof plugin.sources[source] === 'object' ? 
                        plugin.sources[source].status : plugin.sources[source] || 'MISSING'
                );
                const collaborationStatus = sourceStatuses.includes('MISSING') ? 'No' :
                                          sourceStatuses.includes('UPDATE') ? 'Check version' : 'Yes';

                // Generate remarks for version mismatches
                const remarks = [];
                allSourceFiles.forEach(source => {
                    const sourceData = plugin.sources[source];
                    if (typeof sourceData === 'object' && sourceData.status === 'UPDATE') {
                        remarks.push(`${source}: v${sourceData.originalVersion}`);
                    }
                });

                return { 
                    ...baseColumns, 
                    ...sourceColumns,
                    'Collaboration Material': collaborationStatus,
                    'Remarks': remarks.length > 0 ? 
                        `Current: v${plugin.Version}; ${remarks.join('; ')}` : ''
                };
            });

        return output;
    } catch (error) {
        console.error('Error combining CSV files:', error);
        throw error;
    }
}

// Handle command line execution
if (require.main === module) {
    const files = process.argv.slice(2);
    if (files.length < 2) {
        console.error('Usage: node vst-combine.js <main-file.csv> [additional-files.csv...]');
        process.exit(1);
    }

    const [mainFile, ...additionalFiles] = files;
    
    combineCsvFiles(mainFile, additionalFiles)
        .then(result => {
            // Output the combined CSV to stdout with specific column order
            process.stdout.write(stringify(result, {
                header: true,
                columns: [
                    'Company',
                    'Software',
                    'Version',
                    'SDK Version',
                    'Type',
                    ...result[0] ? Object.keys(result[0]).filter(k => 
                        !['Company', 'Software', 'Version', 'SDK Version', 'Type', 'Collaboration Material', 'Remarks'].includes(k)
                    ) : [],
                    'Collaboration Material',
                    'Remarks'
                ]
            }));
        })
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { combineCsvFiles }; 