import { useCallback, useRef, useState } from 'react';
import { BACKUP_COPY } from '../constants/dialogCopy';
import { pickBackupFile, reloadApplicationState, restoreBackupFromUri } from '../services/backup/restoreService';
import { RestoreBackupOptions } from '../services/backup/backupTypes';
import { useModalStore } from '../store/useModalStore';

type RestoreConfirmCopy = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
};

type UseBackupRestoreFlowOptions = {
  confirmCopy?: RestoreConfirmCopy;
  restoreOptions?: RestoreBackupOptions;
  onRestoreSuccess: () => void | Promise<void>;
};

export function useBackupRestoreFlow({
  confirmCopy = BACKUP_COPY.restoreConfirm,
  restoreOptions,
  onRestoreSuccess,
}: UseBackupRestoreFlowOptions) {
  const showError = useModalStore((state) => state.showError);
  const [restoreConfirmVisible, setRestoreConfirmVisible] = useState(false);
  const [invalidBackupVisible, setInvalidBackupVisible] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [pendingRestoreUri, setPendingRestoreUri] = useState<string | null>(null);
  const restoringRef = useRef(false);

  const startRestore = useCallback(async () => {
    if (restoreBusy || restoringRef.current) {
      return;
    }

    const uri = await pickBackupFile();
    if (!uri) {
      return;
    }

    setPendingRestoreUri(uri);
    setRestoreConfirmVisible(true);
  }, [restoreBusy]);

  const cancelRestore = useCallback(() => {
    setRestoreConfirmVisible(false);
    setPendingRestoreUri(null);
  }, []);

  const confirmRestore = useCallback(async () => {
    if (!pendingRestoreUri || restoringRef.current) {
      return;
    }

    restoringRef.current = true;
    setRestoreConfirmVisible(false);
    setRestoreBusy(true);

    try {
      const result = await restoreBackupFromUri(pendingRestoreUri, restoreOptions);
      if (!result.ok) {
        if (result.reason === 'invalid_file') {
          setInvalidBackupVisible(true);
        } else {
          showError(BACKUP_COPY.restoreFailed.title, BACKUP_COPY.restoreFailed.message);
        }
        return;
      }

      await reloadApplicationState();
      await onRestoreSuccess();
    } finally {
      setRestoreBusy(false);
      setPendingRestoreUri(null);
      restoringRef.current = false;
    }
  }, [onRestoreSuccess, pendingRestoreUri, restoreOptions, showError]);

  return {
    confirmCopy,
    restoreConfirmVisible,
    invalidBackupVisible,
    restoreBusy,
    startRestore,
    cancelRestore,
    confirmRestore,
    dismissInvalidBackup: () => setInvalidBackupVisible(false),
  };
}
