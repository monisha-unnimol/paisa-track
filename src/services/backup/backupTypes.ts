import { Account } from '../../database/types';
import { Category } from '../../database/types';
import { Investment } from '../../database/types';
import { InvestmentTypeDefinition } from '../../database/types';
import { RecurringExpense } from '../../database/types';
import { ReviewRequest } from '../../database/types';
import { Transaction } from '../../database/types';
import { UserProfile } from '../../database/types';
import { SmsTransactionDraft } from '../../store/useSmsDraftStore';

export const CURRENT_BACKUP_VERSION = 1;

export type BackupSecuritySettings = {
  pinConfigured: boolean;
  pinHash: string | null;
  pinSalt: string | null;
  pinLength: '4' | '6' | null;
};

export type BackupSettings = {
  smsAutoTrackingEnabled: boolean;
  hasCompletedOnboarding: boolean;
};

export type BackupAvatarFile = {
  base64: string;
  mimeType: string;
};

export type PaisaTrackBackup = {
  backupVersion: number;
  appVersion: string;
  createdAt: string;
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  recurringItems: RecurringExpense[];
  investments: Investment[];
  investmentTypes: InvestmentTypeDefinition[];
  userProfile: UserProfile | null;
  reviewRequests: ReviewRequest[];
  settings: BackupSettings;
  asyncStorage: Record<string, string>;
  security: BackupSecuritySettings;
  smsDrafts: Record<string, SmsTransactionDraft>;
  avatarFiles: Record<string, BackupAvatarFile>;
};

export type BackupExportResult =
  | { ok: true; fileUri: string; shareableUri: string; fileName: string; displayPath: string }
  | {
      ok: false;
      reason: 'cancelled' | 'permission_denied' | 'write_failed' | 'verify_failed' | 'export_failed';
    };

export type BackupRestoreResult =
  | { ok: true; smsTrackingEnabled: boolean }
  | { ok: false; reason: 'invalid_file' | 'read_failed' | 'restore_failed' };

export type RestoreBackupOptions = {
  deferOnboardingCompletion?: boolean;
};
