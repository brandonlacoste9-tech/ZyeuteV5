/**
 * Database Backup Utility
 * 
 * Automated PostgreSQL backup script with compression and retention policy.
 * Can be run manually or scheduled via cron/Railway cron jobs.
 * 
 * Usage:
 *   - Manual: npm run backup
 *   - Scheduled: Add to Railway cron or use GitHub Actions
 * 
 * Environment Variables Required:
 *   - DATABASE_URL: PostgreSQL connection string
 *   - BACKUP_RETENTION_DAYS: Number of days to keep backups (default: 7)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGzip } from 'zlib';

const execAsync = promisify(exec);

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '7');
const DATABASE_URL = process.env.DATABASE_URL;

interface BackupResult {
  success: boolean;
  filename?: string;
  size?: number;
  error?: string;
  timestamp: string;
}

/**
 * Create a compressed PostgreSQL dump
 */
export async function createBackup(): Promise<BackupResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `zyeutev5-backup-${timestamp}.sql.gz`;
  const filepath = path.join(BACKUP_DIR, filename);

  try {
    // Ensure backup directory exists
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    console.log(`🔄 Starting database backup: ${filename}`);

    // Use pg_dump to create backup
    // Format: Custom compressed format for optimal storage
    const dumpCommand = `pg_dump "${DATABASE_URL}" --format=custom --compress=9 --file="${filepath}.tmp"`;
    
    await execAsync(dumpCommand, {
      maxBuffer: 1024 * 1024 * 100, // 100MB buffer
    });

    // Rename temp file to final name
    await fs.rename(`${filepath}.tmp`, filepath);

    // Get file size
    const stats = await fs.stat(filepath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Backup created successfully: ${filename} (${sizeInMB} MB)`);

    return {
      success: true,
      filename,
      size: stats.size,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('❌ Backup failed:', error.message);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Clean up old backups based on retention policy
 */
export async function cleanupOldBackups(): Promise<number> {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files.filter((f) => f.startsWith('zyeutev5-backup-'));

    const now = Date.now();
    const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;

    let deletedCount = 0;

    for (const file of backupFiles) {
      const filepath = path.join(BACKUP_DIR, file);
      const stats = await fs.stat(filepath);
      const age = now - stats.mtimeMs;

      if (age > retentionMs) {
        await fs.unlink(filepath);
        console.log(`🗑️  Deleted old backup: ${file}`);
        deletedCount++;
      }
    }

    console.log(`✅ Cleanup complete: ${deletedCount} old backups removed`);
    return deletedCount;
  } catch (error: any) {
    console.error('❌ Cleanup failed:', error.message);
    return 0;
  }
}

/**
 * List all available backups
 */
export async function listBackups(): Promise<Array<{ filename: string; size: number; created: Date }>> {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files.filter((f) => f.startsWith('zyeutev5-backup-'));

    const backups = await Promise.all(
      backupFiles.map(async (file) => {
        const filepath = path.join(BACKUP_DIR, file);
        const stats = await fs.stat(filepath);
        return {
          filename: file,
          size: stats.size,
          created: stats.mtime,
        };
      })
    );

    // Sort by creation date (newest first)
    return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
  } catch (error) {
    console.error('❌ Failed to list backups:', error);
    return [];
  }
}

/**
 * Restore database from a backup file
 * WARNING: This will overwrite the current database!
 */
export async function restoreBackup(filename: string): Promise<boolean> {
  const filepath = path.join(BACKUP_DIR, filename);

  try {
    // Verify backup file exists
    await fs.access(filepath);

    console.log(`⚠️  WARNING: About to restore database from ${filename}`);
    console.log('⚠️  This will OVERWRITE the current database!');

    // Use pg_restore to restore backup
    const restoreCommand = `pg_restore --clean --if-exists --dbname="${DATABASE_URL}" "${filepath}"`;

    await execAsync(restoreCommand, {
      maxBuffer: 1024 * 1024 * 100, // 100MB buffer
    });

    console.log(`✅ Database restored successfully from ${filename}`);
    return true;
  } catch (error: any) {
    console.error('❌ Restore failed:', error.message);
    return false;
  }
}

/**
 * Main backup routine
 */
async function main() {
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not set');
    process.exit(1);
  }

  console.log('🦫 ZyeuteV5 Database Backup Utility');
  console.log('====================================');
  console.log(`Retention Policy: ${RETENTION_DAYS} days`);
  console.log(`Backup Directory: ${BACKUP_DIR}\n`);

  // Create backup
  const result = await createBackup();

  if (!result.success) {
    process.exit(1);
  }

  // Cleanup old backups
  await cleanupOldBackups();

  // List current backups
  const backups = await listBackups();
  console.log(`\n📦 Current backups: ${backups.length}`);
  backups.slice(0, 5).forEach((backup) => {
    const sizeInMB = (backup.size / (1024 * 1024)).toFixed(2);
    console.log(`  - ${backup.filename} (${sizeInMB} MB) - ${backup.created.toLocaleString()}`);
  });

  console.log('\n✅ Backup complete!');
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
