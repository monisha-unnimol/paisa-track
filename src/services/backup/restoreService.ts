import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { databaseService } from '../../database';
import { formatUriAvatar } from '../../constants/avatarOptions';
import { restorePinConfig } from '../security/pinService';
import { disableSmsTracking } from '../sms/smsTrackingService';
import { useSmsDraftStore } from '../../store/useSmsDraftStore';
import { BACKUP_ASYNC_STORAGE_KEYS } from './backupKeys';
import { migrateBackupPayload, parseBackupJson, validateBackupPayload } from './backupValidation';
import { BackupRestoreResult, PaisaTrackBackup, RestoreBackupOptions } from './backupTypes';

async function readBackupFile(uri: string): Promise<string | null> {
  try {
    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (error) {
    console.error('[Restore] Failed to read backup file', error);
    return null;
  }
}

async function restoreAvatarFiles(backup: PaisaTrackBackup): Promise<string | null> {
  if (!backup.userProfile?.avatar) {
    return backup.userProfile?.avatar ?? null;
  }

  const avatarFile = backup.avatarFiles[backup.userProfile.avatar];
  if (!avatarFile) {
    return backup.userProfile.avatar;
  }

  const directory = `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory}avatars/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true }).catch(() => undefined);

  const extension = avatarFile.mimeType === 'image/png' ? 'png' : 'jpg';
  const restoredUri = `${directory}profile-${Date.now()}.${extension}`;

  await FileSystem.writeAsStringAsync(restoredUri, avatarFile.base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return formatUriAvatar(restoredUri);
}

async function applyBackup(backup: PaisaTrackBackup, options: RestoreBackupOptions = {}): Promise<void> {
  const restoredAvatar = await restoreAvatarFiles(backup);
  const userProfile = backup.userProfile
    ? {
        ...backup.userProfile,
        avatar: restoredAvatar,
      }
    : null;

  await databaseService.clearAllUserData();
  await databaseService.importBackupTables({
    accounts: backup.accounts,
    categories: backup.categories,
    transactions: backup.transactions,
    investments: backup.investments,
    recurringItems: backup.recurringItems,
    investmentTypes: backup.investmentTypes,
    userProfile,
    reviewRequests: backup.reviewRequests,
  });

  const asyncStorageValues: [string, string][] = BACKUP_ASYNC_STORAGE_KEYS.map((key) => {
    const storedValue = backup.asyncStorage[key];
    if (storedValue !== undefined) {
      if (key === '@paisatrack/hasCompletedOnboarding' && options.deferOnboardingCompletion) {
        return [key, 'false'];
      }
      return [key, storedValue];
    }

    if (key === '@paisatrack/smsAutoTrackingEnabled') {
      return [key, backup.settings.smsAutoTrackingEnabled ? 'true' : 'false'];
    }

    if (key === '@paisatrack/hasCompletedOnboarding') {
      return [key, options.deferOnboardingCompletion ? 'false' : backup.settings.hasCompletedOnboarding ? 'true' : 'false'];
    }

    return [key, '{}'];
  });

  await AsyncStorage.multiSet(asyncStorageValues);
  await restorePinConfig(backup.security);

  if (options.deferOnboardingCompletion) {
    await AsyncStorage.multiRemove([
      '@paisatrack/onboardingAccountId',
      '@paisatrack/onboardingAccountCreated',
    ]);
  }

  useSmsDraftStore.setState({
    drafts: backup.smsDrafts ?? {},
    activeDraftId: null,
  });

  if (!backup.settings.smsAutoTrackingEnabled) {
    await disableSmsTracking().catch(() => undefined);
  }
}

export async function pickBackupFile(): Promise<string | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error) {
    console.error('[Restore] Document picker failed', error);
    return null;
  }
}

export async function restoreBackupFromUri(
  uri: string,
  options: RestoreBackupOptions = {},
): Promise<BackupRestoreResult> {
  const raw = await readBackupFile(uri);
  if (!raw) {
    return { ok: false, reason: 'read_failed' };
  }

  const parsed = parseBackupJson(raw);
  const validated = validateBackupPayload(parsed);
  if (!validated) {
    return { ok: false, reason: 'invalid_file' };
  }

  try {
    const backup = migrateBackupPayload(validated);
    await applyBackup(backup, options);
    return { ok: true, smsTrackingEnabled: backup.settings.smsAutoTrackingEnabled };
  } catch (error) {
    console.error('[Restore] Import failed', error);
    return { ok: false, reason: 'restore_failed' };
  }
}

export async function reloadApplicationState(): Promise<void> {
  const { useAccountStore } = await import('../../store/useAccountStore');
  const { useUserProfileStore } = await import('../../store/useUserProfileStore');
  const { usePrivacyStore } = await import('../../store/usePrivacyStore');
  const { useSettingsStore } = await import('../../store/useSettingsStore');
  const { useReviewStore } = await import('../../store/useReviewStore');
  const { useCategoryStore } = await import('../../store/useCategoryStore');
  const { useTransactionStore } = await import('../../store/useTransactionStore');
  const { syncSmsTracking } = await import('../sms/smsTrackingService');

  await databaseService.initialize();
  await useUserProfileStore.getState().loadProfileState();
  await usePrivacyStore.getState().loadPrivacyState();
  await useAccountStore.getState().loadAccounts();
  await useSettingsStore.getState().loadSettings();
  await useCategoryStore.getState().loadCategories().catch(() => undefined);
  await useTransactionStore.getState().loadTransactions().catch(() => undefined);
  await useReviewStore.getState().loadReviews().catch(() => undefined);
  await syncSmsTracking().catch(() => undefined);
}
