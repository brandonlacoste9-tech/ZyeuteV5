#!/usr/bin/env node
/**
 * Dependency Usage Analyzer
 * 
 * This script scans the codebase to identify which dependencies
 * from package.json are actually being imported and used.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const PACKAGE_JSON_PATH = './package.json';
const SRC_DIRS = ['./client/src', './server', './src'];
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

interface DependencyUsage {
    package: string;
    used: boolean;
    importCount: number;
    files: string[];
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
    try {
        const files = readdirSync(dirPath);

        files.forEach((file) => {
            const filePath = join(dirPath, file);
            try {
                if (statSync(filePath).isDirectory()) {
                    if (!file.startsWith('.') && file !== 'node_modules') {
                        arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
                    }
                } else {
                    if (FILE_EXTENSIONS.some(ext => file.endsWith(ext))) {
                        arrayOfFiles.push(filePath);
                    }
                }
            } catch (err) {
                // Skip files we can't read
            }
        });
    } catch (err) {
        // Skip directories we can't read
    }

    return arrayOfFiles;
}

function findImports(filePath: string): Set<string> {
    const imports = new Set<string>();

    try {
        const content = readFileSync(filePath, 'utf-8');

        // Match: import ... from 'package'
        // Match: import ... from "package"
        // Match: require('package')
        // Match: require("package")
        const importRegex = /(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g;

        let match;
        while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];

            // Extract package name (handle scoped packages)
            let packageName = importPath;
            if (importPath.startsWith('@')) {
                // Scoped package: @scope/package or @scope/package/subpath
                const parts = importPath.split('/');
                packageName = `${parts[0]}/${parts[1]}`;
            } else if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
                // Regular package: package or package/subpath
                packageName = importPath.split('/')[0];
            } else {
                // Relative import, skip
                continue;
            }

            imports.add(packageName);
        }
    } catch (err) {
        // Skip files we can't read
    }

    return imports;
}

function analyzeDependencies(): void {
    console.log('🔍 Analyzing dependency usage...\n');

    // Read package.json
    const packageJson = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
    const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
    };

    // Initialize usage tracking
    const usageMap = new Map<string, DependencyUsage>();
    Object.keys(dependencies).forEach(pkg => {
        usageMap.set(pkg, {
            package: pkg,
            used: false,
            importCount: 0,
            files: []
        });
    });

    // Scan all source files
    const allFiles: string[] = [];
    SRC_DIRS.forEach(dir => {
        try {
            const files = getAllFiles(dir);
            allFiles.push(...files);
        } catch (err) {
            // Skip directories that don't exist
        }
    });

    console.log(`📁 Scanning ${allFiles.length} files...\n`);

    // Find all imports
    allFiles.forEach(file => {
        const imports = findImports(file);

        imports.forEach(importedPkg => {
            const usage = usageMap.get(importedPkg);
            if (usage) {
                usage.used = true;
                usage.importCount++;
                usage.files.push(relative(process.cwd(), file));
            }
        });
    });

    // Generate reports
    const unused: DependencyUsage[] = [];
    const lightlyUsed: DependencyUsage[] = [];
    const used: DependencyUsage[] = [];

    usageMap.forEach(usage => {
        if (!usage.used) {
            unused.push(usage);
        } else if (usage.importCount <= 2) {
            lightlyUsed.push(usage);
        } else {
            used.push(usage);
        }
    });

    // Print results
    console.log('='.repeat(80));
    console.log('📊 DEPENDENCY USAGE REPORT');
    console.log('='.repeat(80));
    console.log();

    console.log(`✅ Used Dependencies: ${used.length}`);
    console.log(`⚠️  Lightly Used Dependencies (≤2 imports): ${lightlyUsed.length}`);
    console.log(`❌ Unused Dependencies: ${unused.length}`);
    console.log();

    // Unused dependencies
    if (unused.length > 0) {
        console.log('='.repeat(80));
        console.log('❌ UNUSED DEPENDENCIES - Consider Removing');
        console.log('='.repeat(80));
        console.log();

        unused.sort((a, b) => a.package.localeCompare(b.package));
        unused.forEach(dep => {
            console.log(`  • ${dep.package}`);
        });
        console.log();

        console.log('Command to remove:');
        const uninstallCmd = `npm uninstall ${unused.map(d => d.package).join(' ')}`;
        console.log(`  ${uninstallCmd}`);
        console.log();
    }

    // Lightly used dependencies
    if (lightlyUsed.length > 0) {
        console.log('='.repeat(80));
        console.log('⚠️  LIGHTLY USED DEPENDENCIES - Review These');
        console.log('='.repeat(80));
        console.log();

        lightlyUsed.sort((a, b) => a.package.localeCompare(b.package));
        lightlyUsed.forEach(dep => {
            console.log(`  • ${dep.package} (${dep.importCount} import${dep.importCount > 1 ? 's' : ''})`);
            dep.files.forEach(file => {
                console.log(`    - ${file}`);
            });
            console.log();
        });
    }

    // Summary
    console.log('='.repeat(80));
    console.log('💡 RECOMMENDATIONS');
    console.log('='.repeat(80));
    console.log();

    const totalDeps = Object.keys(dependencies).length;
    const potentialSavings = Math.round((unused.length / totalDeps) * 100);

    console.log(`Total dependencies: ${totalDeps}`);
    console.log(`Potential removal: ${unused.length} (${potentialSavings}%)`);
    console.log();

    if (unused.length > 0) {
        console.log('1. Review the unused dependencies list above');
        console.log('2. Verify they are truly not needed');
        console.log('3. Run the uninstall command provided');
        console.log('4. Test the application thoroughly');
        console.log('5. Commit the changes');
    }

    if (lightlyUsed.length > 0) {
        console.log();
        console.log('Lightly used dependencies might indicate:');
        console.log('  • Feature in early development');
        console.log('  • Utility used sparingly');
        console.log('  • Candidate for removal if feature is removed');
    }

    console.log();
    console.log('='.repeat(80));
}

// Run analysis
analyzeDependencies();
