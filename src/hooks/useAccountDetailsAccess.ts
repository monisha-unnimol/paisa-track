import { useCallback, useEffect, useState } from 'react';
import { usePrivacyStore } from '../store/usePrivacyStore';

/** Screen-level PIN gate for account details (covers deep links and direct navigation). */
export function useAccountDetailsAccess(required: boolean) {
  const balanceVisibilityVerified = usePrivacyStore(
    (state) => state.balanceVisibilityVerified,
  );
  const [accessGranted, setAccessGranted] = useState(
    () => !required || balanceVisibilityVerified,
  );
  const [verifyVisible, setVerifyVisible] = useState(
    () => required && !balanceVisibilityVerified,
  );

  useEffect(() => {
    if (balanceVisibilityVerified) {
      setAccessGranted(true);
    }
  }, [balanceVisibilityVerified]);

  const ensureAccessOnFocus = useCallback(() => {
    if (required && !accessGranted) {
      setVerifyVisible(true);
    }
  }, [accessGranted, required]);

  const handleVerifySuccess = useCallback(() => {
    setAccessGranted(true);
    setVerifyVisible(false);
  }, []);

  const handleVerifyCancel = useCallback((onCancel: () => void) => {
    setVerifyVisible(false);
    onCancel();
  }, []);

  return {
    accessGranted,
    verifyVisible,
    ensureAccessOnFocus,
    handleVerifySuccess,
    handleVerifyCancel,
  };
}
