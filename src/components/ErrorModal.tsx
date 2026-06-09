import { DIALOG_ACTIONS } from '../constants/dialogCopy';
import { ConfirmationModal } from './ConfirmationModal';

type ErrorModalProps = {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
  onRetry?: (() => void) | null;
};

export function ErrorModal({
  visible,
  title,
  message,
  onDismiss,
  onRetry,
}: ErrorModalProps) {
  if (onRetry) {
    return (
      <ConfirmationModal
        visible={visible}
        title={title}
        message={message}
        confirmLabel={DIALOG_ACTIONS.tryAgain}
        cancelLabel={DIALOG_ACTIONS.close}
        icon="alert-circle-outline"
        onConfirm={() => {
          onRetry();
          onDismiss();
        }}
        onCancel={onDismiss}
      />
    );
  }

  return (
    <ConfirmationModal
      visible={visible}
      title={title}
      message={message}
      confirmLabel={DIALOG_ACTIONS.close}
      singleAction
      icon="alert-circle-outline"
      onConfirm={onDismiss}
    />
  );
}
