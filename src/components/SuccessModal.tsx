import { ConfirmationModal } from './ConfirmationModal';

type SuccessModalProps = {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
};

export function SuccessModal({ visible, title, message, onDismiss }: SuccessModalProps) {
  return (
    <ConfirmationModal
      visible={visible}
      title={title}
      message={message}
      confirmLabel="Done"
      singleAction
      icon="checkmark-circle-outline"
      onConfirm={onDismiss}
    />
  );
}
