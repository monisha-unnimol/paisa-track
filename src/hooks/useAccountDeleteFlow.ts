import { useCallback, useState } from 'react';
import { DELETE_DIALOG_COPY } from '../constants/dialogCopy';
import { AccountDeleteBlockedError, useAccountStore } from '../store/useAccountStore';
import { getAccountDeleteBlockReason } from '../utils/accountDeleteRules';

type DeleteTarget = {
  id: string;
  name: string;
};

type UseAccountDeleteFlowOptions = {
  onDeleted?: () => void | Promise<void>;
  onDeleteBlocked?: () => void;
};

export function useAccountDeleteFlow(options: UseAccountDeleteFlowOptions = {}) {
  const accounts = useAccountStore((state) => state.accounts);
  const removeAccount = useAccountStore((state) => state.removeAccount);
  const setDefaultAccount = useAccountStore((state) => state.setDefaultAccount);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [onlyAccountDialogVisible, setOnlyAccountDialogVisible] = useState(false);
  const [defaultBlockDialogVisible, setDefaultBlockDialogVisible] = useState(false);
  const [chooseDefaultVisible, setChooseDefaultVisible] = useState(false);

  const requestDelete = useCallback(
    (id: string, name: string) => {
      const blockReason = getAccountDeleteBlockReason(accounts, id);

      if (blockReason === 'only_account') {
        setOnlyAccountDialogVisible(true);
        return;
      }

      if (blockReason === 'default_account') {
        setDeleteTarget({ id, name });
        setDefaultBlockDialogVisible(true);
        return;
      }

      setDeleteTarget({ id, name });
    },
    [accounts],
  );

  const cancelDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const cancelDefaultBlock = useCallback(() => {
    setDefaultBlockDialogVisible(false);
    setDeleteTarget(null);
  }, []);

  const openChooseDefault = useCallback(() => {
    setDefaultBlockDialogVisible(false);
    setChooseDefaultVisible(true);
  }, []);

  const cancelChooseDefault = useCallback(() => {
    setChooseDefaultVisible(false);
    setDeleteTarget(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    try {
      const deleted = await removeAccount(deleteTarget.id);
      if (!deleted) return;

      setDeleteTarget(null);
      await options.onDeleted?.();
    } catch (error) {
      if (error instanceof AccountDeleteBlockedError) {
        if (error.reason === 'only_account') {
          setDeleteTarget(null);
          setOnlyAccountDialogVisible(true);
        } else if (error.reason === 'default_account') {
          setDefaultBlockDialogVisible(true);
        }
        return;
      }

      if (error instanceof Error && error.message === 'Account has linked transactions') {
        setDeleteTarget(null);
        options.onDeleteBlocked?.();
        return;
      }

      throw error;
    }
  }, [deleteTarget, options, removeAccount]);

  const chooseDefaultAccount = useCallback(
    async (accountId: string) => {
      await setDefaultAccount(accountId);
      setChooseDefaultVisible(false);
      setDeleteTarget(null);
    },
    [setDefaultAccount],
  );

  const showDeleteConfirm =
    deleteTarget !== null && !defaultBlockDialogVisible && !chooseDefaultVisible;

  return {
    accounts,
    deleteTarget,
    onlyAccountDialogVisible,
    defaultBlockDialogVisible,
    chooseDefaultVisible,
    showDeleteConfirm,
    requestDelete,
    cancelDelete,
    cancelDefaultBlock,
    openChooseDefault,
    cancelChooseDefault,
    confirmDelete,
    chooseDefaultAccount,
    dismissOnlyAccountDialog: () => setOnlyAccountDialogVisible(false),
    deleteDialogCopy: DELETE_DIALOG_COPY,
  };
}

export type AccountDeleteFlow = ReturnType<typeof useAccountDeleteFlow>;
