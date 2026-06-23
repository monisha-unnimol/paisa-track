import { useCallback, useState } from 'react';
import { DEFAULT_ACCOUNT_COPY } from '../constants/dialogCopy';
import { useAccountStore } from '../store/useAccountStore';

type UseDefaultAccountChangeFlowOptions = {
  accountId?: string;
  accountName: string;
  isDefault: boolean;
  isEditing: boolean;
  setIsDefault: (value: boolean) => void;
  onBaselineDefaultChange: (isDefault: boolean) => void;
  touch?: () => void;
};

export function useDefaultAccountChangeFlow({
  accountId,
  accountName,
  isDefault,
  isEditing,
  setIsDefault,
  onBaselineDefaultChange,
  touch,
}: UseDefaultAccountChangeFlowOptions) {
  const accounts = useAccountStore((state) => state.accounts);
  const setDefaultAccount = useAccountStore((state) => state.setDefaultAccount);

  const [requiredDialogVisible, setRequiredDialogVisible] = useState(false);
  const [chooseDefaultVisible, setChooseDefaultVisible] = useState(false);
  const [confirmChangeVisible, setConfirmChangeVisible] = useState(false);
  const [confirmMakeDefaultVisible, setConfirmMakeDefaultVisible] = useState(false);
  const [pendingDefaultAccountId, setPendingDefaultAccountId] = useState<string | null>(null);

  const currentDefault = accounts.find((account) => account.isDefault);
  const pendingDefaultAccount = pendingDefaultAccountId
    ? accounts.find((account) => account.id === pendingDefaultAccountId)
    : undefined;

  const applyDefaultToAccount = useCallback(
    async (nextDefaultId: string) => {
      await setDefaultAccount(nextDefaultId);

      if (accountId === nextDefaultId) {
        setIsDefault(true);
        onBaselineDefaultChange(true);
        return;
      }

      if (accountId && isDefault) {
        setIsDefault(false);
        onBaselineDefaultChange(false);
      }
    },
    [accountId, isDefault, onBaselineDefaultChange, setDefaultAccount, setIsDefault],
  );

  const handleDefaultChange = useCallback(
    (value: boolean) => {
      if (!value && !isDefault) {
        return;
      }

      if (value && isDefault) {
        return;
      }

      if (!value && isDefault) {
        if (isEditing && accountId) {
          if (accounts.length <= 1) {
            setRequiredDialogVisible(true);
            return;
          }

          setChooseDefaultVisible(true);
          return;
        }

        setIsDefault(false);
        touch?.();
        return;
      }

      if (value && !isDefault) {
        if (isEditing && accountId) {
          setConfirmMakeDefaultVisible(true);
          return;
        }

        if (currentDefault) {
          setConfirmMakeDefaultVisible(true);
          return;
        }

        setIsDefault(true);
        touch?.();
      }
    },
    [
      accountId,
      accounts.length,
      currentDefault,
      isDefault,
      isEditing,
      setIsDefault,
      touch,
    ],
  );

  const dismissRequiredDialog = useCallback(() => {
    setRequiredDialogVisible(false);
  }, []);

  const cancelChooseDefault = useCallback(() => {
    setChooseDefaultVisible(false);
    setPendingDefaultAccountId(null);
  }, []);

  const selectNewDefault = useCallback((nextDefaultId: string) => {
    setPendingDefaultAccountId(nextDefaultId);
    setChooseDefaultVisible(false);
    setConfirmChangeVisible(true);
  }, []);

  const cancelChangeDefault = useCallback(() => {
    setConfirmChangeVisible(false);
    setPendingDefaultAccountId(null);
  }, []);

  const confirmChangeDefault = useCallback(async () => {
    if (!pendingDefaultAccountId) return;

    await applyDefaultToAccount(pendingDefaultAccountId);
    setConfirmChangeVisible(false);
    setPendingDefaultAccountId(null);
  }, [applyDefaultToAccount, pendingDefaultAccountId]);

  const cancelMakeDefault = useCallback(() => {
    setConfirmMakeDefaultVisible(false);
  }, []);

  const confirmMakeDefault = useCallback(async () => {
    if (isEditing && accountId) {
      await applyDefaultToAccount(accountId);
      setConfirmMakeDefaultVisible(false);
      return;
    }

    setIsDefault(true);
    touch?.();
    setConfirmMakeDefaultVisible(false);
  }, [accountId, applyDefaultToAccount, isEditing, setIsDefault, touch]);

  return {
    accounts,
    requiredDialogVisible,
    chooseDefaultVisible,
    confirmChangeVisible,
    confirmMakeDefaultVisible,
    pendingDefaultAccount,
    currentDefault,
    handleDefaultChange,
    dismissRequiredDialog,
    cancelChooseDefault,
    selectNewDefault,
    cancelChangeDefault,
    confirmChangeDefault,
    cancelMakeDefault,
    confirmMakeDefault,
    copy: DEFAULT_ACCOUNT_COPY,
    excludeAccountId: accountId ?? '',
    makeDefaultMessage:
      currentDefault && accountName.trim()
        ? DEFAULT_ACCOUNT_COPY.makeDefault.message(accountName.trim(), currentDefault.name)
        : '',
    changeDefaultMessage: pendingDefaultAccount
      ? DEFAULT_ACCOUNT_COPY.changeConfirm.message(pendingDefaultAccount.name)
      : '',
  };
}

export type DefaultAccountChangeFlow = ReturnType<typeof useDefaultAccountChangeFlow>;
