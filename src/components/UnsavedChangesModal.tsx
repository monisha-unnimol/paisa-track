import { UNSAVED_CHANGES_COPY } from '../constants/dialogCopy';
import { ConfirmationModal } from './ConfirmationModal';

type UnsavedChangesModalProps = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function UnsavedChangesModal({
  visible,
  onConfirm,
  onCancel,
}: UnsavedChangesModalProps) {
  return (
    <ConfirmationModal
      visible={visible}
      title={UNSAVED_CHANGES_COPY.title}
      message={UNSAVED_CHANGES_COPY.message}
      confirmLabel={UNSAVED_CHANGES_COPY.confirmLabel}
      cancelLabel={UNSAVED_CHANGES_COPY.cancelLabel}
      destructive
      icon="document-text-outline"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
