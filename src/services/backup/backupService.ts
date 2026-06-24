import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import { exportFileToUserStorage } from '../files/paisaTrackFileStorage';
import { databaseService } from '../../database';
import { parseAvatarValue } from '../../constants/avatarOptions';
import { exportPinConfig } from '../security/pinService';
import { useSmsDraftStore, SmsTransactionDraft } from '../../store/useSmsDraftStore';
import { ReviewRequest } from '../../database/types';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useUserProfileStore } from '../../store/useUserProfileStore';
import { BACKUP_ASYNC_STORAGE_KEYS } from './backupKeys';
import {
  BackupAvatarFile,
  BackupExportResult,
  CURRENT_BACKUP_VERSION,
  PaisaTrackBackup,
} from './backupTypes';

function formatBackupFileName(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `PaisaTrack_Backup_${year}${month}${day}_${hours}${minutes}${seconds}.json`;
}

function guessMimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  return 'image/jpeg';
}

async function readAvatarFile(uri: string): Promise<BackupAvatarFile | null> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) {
      return null;
    }

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return {
      base64,
      mimeType: guessMimeType(uri),
    };
  } catch {
    return null;
  }
}

function collectSmsDraftsForBackup(reviewRequests: ReviewRequest[]): Record<string, SmsTransactionDraft> {
  const drafts = { ...useSmsDraftStore.getState().drafts };

  for (const review of reviewRequests) {
    if (review.status !== 'pending') {
      continue;
    }

    try {
      const data = JSON.parse(review.reviewData) as {
        draftId?: string;
        amount?: number;
        transactionType?: 'income' | 'expense';
        title?: string;
        accountHint?: string | null;
      };

      if (!data.draftId || drafts[data.draftId]) {
        continue;
      }

      drafts[data.draftId] = {
        id: data.draftId,
        type: data.transactionType ?? 'expense',
        title: data.title ?? review.title,
        amount: data.amount ?? 0,
        accountHint: data.accountHint ?? null,
        notes: review.description,
        rawBody: '',
        sender: review.source ?? 'unknown',
        createdAt: Date.parse(review.createdAt),
      };
    } catch {
      continue;
    }
  }

  return drafts;
}

export async function buildBackupPayload(): Promise<PaisaTrackBackup> {
  const createdAt = new Date().toISOString();
  const tables = await databaseService.exportBackupTables();
  const pinConfig = await exportPinConfig();
  const avatarFiles: Record<string, BackupAvatarFile> = {};

  if (tables.userProfile?.avatar) {
    const parsed = parseAvatarValue(tables.userProfile.avatar);
    if (parsed.type === 'uri' && parsed.value) {
      const file = await readAvatarFile(parsed.value);
      if (file) {
        avatarFiles[tables.userProfile.avatar] = file;
      }
    }
  }

  const asyncStorageEntries = await AsyncStorage.multiGet([...BACKUP_ASYNC_STORAGE_KEYS]);
  const asyncStorage = Object.fromEntries(
    asyncStorageEntries.filter((entry): entry is [string, string] => entry[1] !== null),
  );

  const settingsStore = useSettingsStore.getState();
  const profileStore = useUserProfileStore.getState();

  if (!settingsStore.hydrated) {
    await settingsStore.loadSettings();
  }
  if (!profileStore.hydrated) {
    await profileStore.loadProfileState();
  }

  return {
    backupVersion: CURRENT_BACKUP_VERSION,
    appVersion: Constants.expoConfig?.version ?? '1.0.0',
    createdAt,
    accounts: tables.accounts,
    transactions: tables.transactions,
    categories: tables.categories,
    recurringItems: tables.recurringExpenses,
    investments: tables.investments,
    investmentTypes: tables.investmentTypes,
    userProfile: tables.userProfile,
    reviewRequests: tables.reviewRequests,
    settings: {
      smsAutoTrackingEnabled: useSettingsStore.getState().smsAutoTrackingEnabled,
      hasCompletedOnboarding: useUserProfileStore.getState().hasCompletedOnboarding,
    },
    asyncStorage,
    security: {
      pinConfigured: pinConfig.pinConfigured,
      pinHash: pinConfig.pinHash,
      pinSalt: pinConfig.pinSalt,
      pinLength: pinConfig.pinLength,
    },
    smsDrafts: collectSmsDraftsForBackup(tables.reviewRequests),
    avatarFiles,
  };
}

export async function createAndSaveBackup(): Promise<BackupExportResult> {
  try {
    const payload = await buildBackupPayload();
    const fileName = formatBackupFileName(new Date(payload.createdAt));
    const saved = await exportFileToUserStorage({
      fileName,
      mimeType: 'application/json',
      textContents: JSON.stringify(payload, null, 2),
    });

    if (!saved.ok) {
      return { ok: false, reason: saved.reason === 'read_failed' ? 'export_failed' : saved.reason };
    }

    return {
      ok: true,
      fileUri: saved.fileUri,
      shareableUri: saved.shareableUri,
      fileName: saved.fileName,
      displayPath: saved.displayPath,
    };
  } catch (error) {
    console.error('[Backup] Export failed', error);
    return { ok: false, reason: 'export_failed' };
  }
}
