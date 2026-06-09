import { useCallback, useState } from 'react';
import { PinVerificationModal } from '../components/PinVerificationModal';
import { SECURITY_COPY } from '../constants/dialogCopy';
import { usePrivacyStore } from '../store/usePrivacyStore';

type PinGateOptions = {
  title?: string;
  message?: string;
};

export function usePinGate({
  title = SECURITY_COPY.accountDetailsPin.title,
  message = SECURITY_COPY.accountDetailsPin.message,
}: PinGateOptions = {}) {
  const balanceVisibilityVerified = usePrivacyStore(
    (state) => state.balanceVisibilityVerified,
  );
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [visible, setVisible] = useState(false);

  const requestAccess = useCallback(
    (onGranted: () => void) => {
      if (balanceVisibilityVerified) {
        onGranted();
        return;
      }
      setPendingAction(() => onGranted);
      setVisible(true);
    },
    [balanceVisibilityVerified],
  );

  const handleSuccess = useCallback(() => {
    setVisible(false);
    const action = pendingAction;
    setPendingAction(null);
    action?.();
  }, [pendingAction]);

  const handleCancel = useCallback(() => {
    setVisible(false);
    setPendingAction(null);
  }, []);

  const pinModal = (
    <PinVerificationModal
      visible={visible}
      onCancel={handleCancel}
      onSuccess={handleSuccess}
      title={title}
      message={message}
    />
  );

  return { requestAccess, pinModal, balanceVisibilityVerified };
}
