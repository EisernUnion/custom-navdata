import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { backup, type DatabaseSync } from 'node:sqlite';

/** Use SQLite's backup API so committed WAL contents are included in the snapshot. */
export async function createDatabaseBackup(db: DatabaseSync, source: string, directory: string): Promise<string> {
    await mkdir(directory, { recursive: true });
    const filename = `${path.basename(source)}.${Date.now()}.${randomUUID()}.bak`;
    const destination = path.join(directory, filename);
    await backup(db, destination);
    return destination;
}
