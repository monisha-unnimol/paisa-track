import { ConfirmationModal } from '../ConfirmationModal';
import { BACKUP_COPY } from '../../constants/dialogCopy';
import { useBackupRestoreFlow } from '../../hooks/useBackupRestoreFlow';

type BackupRestoreDialogsProps = {
  flow: ReturnType<typeof useBackupRestoreFlow>;
};

export function BackupRestoreDialogs({ flow }: BackupRestoreDialogsProps) {
  const {
    confirmCopy,
    restoreConfirmVisible,
    invalidBackupVisible,
    cancelRestore,
    confirmRestore,
    dismissInvalidBackup,
  } = flow;

  return (
    <>
      <ConfirmationModal
        visible={restoreConfirmVisible}
        title={confirmCopy.title}
        message={confirmCopy.message}
        confirmLabel={confirmCopy.confirmLabel}
        cancelLabel={confirmCopy.cancelLabel}
        destructive
        icon="cloud-download-outline"
        onConfirm={confirmRestore}
        onCancel={cancelRestore}
      />

      <ConfirmationModal
        visible={invalidBackupVisible}
        title={BACKUP_COPY.invalidBackup.title}
        message={BACKUP_COPY.invalidBackup.message}
        confirmLabel={BACKUP_COPY.invalidBackup.confirmLabel}
        singleAction
        icon="alert-circle-outline"
        onConfirm={dismissInvalidBackup}
      />
    </>
  );
}
