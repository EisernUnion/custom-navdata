
export class UnsupportedSchemaError extends Error {
}

export class DataConflictError extends Error {
}

export function databaseError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    if (/locked|busy/i.test(message))
        return 'The database is busy. Close the aircraft software and any navdata updater, then try again.';
    if (/readonly|read.only|EACCES|EPERM|permission/i.test(message))
        return 'The database could not be written. Check folder permissions and close the aircraft software or any navdata updater.';
    return message;
}
