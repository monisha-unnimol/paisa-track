import { CURRENT_BACKUP_VERSION, PaisaTrackBackup } from './backupTypes';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function parseBackupJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function validateBackupPayload(value: unknown): PaisaTrackBackup | null {
  if (!isRecord(value)) {
    return null;
  }

  const backupVersion = value.backupVersion;
  if (typeof backupVersion !== 'number' || backupVersion < 1 || backupVersion > CURRENT_BACKUP_VERSION) {
    return null;
  }

  if (typeof value.createdAt !== 'string') {
    return null;
  }

  if (!isArray(value.accounts)) return null;
  if (!isArray(value.transactions)) return null;
  if (!isArray(value.categories)) return null;
  if (!isArray(value.recurringItems)) return null;
  if (!isArray(value.investments)) return null;
  if (!isArray(value.investmentTypes)) return null;
  if (!isArray(value.reviewRequests)) return null;

  if (value.userProfile !== null && !isRecord(value.userProfile)) {
    return null;
  }

  if (!isRecord(value.settings)) return null;
  if (typeof value.settings.smsAutoTrackingEnabled !== 'boolean') return null;
  if (typeof value.settings.hasCompletedOnboarding !== 'boolean') return null;

  if (!isRecord(value.asyncStorage)) return null;
  if (!isRecord(value.security)) return null;
  if (typeof value.security.pinConfigured !== 'boolean') return null;

  if (!isRecord(value.smsDrafts)) return null;
  if (!isRecord(value.avatarFiles)) return null;

  return value as PaisaTrackBackup;
}

export function migrateBackupPayload(backup: PaisaTrackBackup): PaisaTrackBackup {
  if (backup.backupVersion === CURRENT_BACKUP_VERSION) {
    return backup;
  }

  return backup;
}
