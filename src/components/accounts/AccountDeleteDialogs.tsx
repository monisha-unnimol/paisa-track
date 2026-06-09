import { ConfirmationModal } from '../ConfirmationModal';
import { ChooseDefaultAccountModal } from './ChooseDefaultAccountModal';
import { AccountDeleteFlow } from '../../hooks/useAccountDeleteFlow';

type AccountDeleteDialogsProps = {
  flow: AccountDeleteFlow;
  excludeAccountId?: string;
};

export function AccountDeleteDialogs({ flow, excludeAccountId }: AccountDeleteDialogsProps) {
  const {
    accounts,
    deleteTarget,
    onlyAccountDialogVisible,
    defaultBlockDialogVisible,
    chooseDefaultVisible,
    showDeleteConfirm,
    cancelDelete,
    cancelDefaultBlock,
    openChooseDefault,
    cancelChooseDefault,
    confirmDelete,
    chooseDefaultAccount,
    dismissOnlyAccountDialog,
    deleteDialogCopy,
  } = flow;

  return (
    <>
      <ConfirmationModal
        visible={onlyAccountDialogVisible}
        title={deleteDialogCopy.accountOnlyAccount.title}
        message={deleteDialogCopy.accountOnlyAccount.message}
        confirmLabel={deleteDialogCopy.accountOnlyAccount.confirmLabel}
        singleAction
        onConfirm={dismissOnlyAccountDialog}
      />

      <ConfirmationModal
        visible={defaultBlockDialogVisible}
        title={deleteDialogCopy.accountDefaultMustChange.title}
        message={deleteDialogCopy.accountDefaultMustChange.message}
        confirmLabel={deleteDialogCopy.accountDefaultMustChange.confirmLabel}
        cancelLabel={deleteDialogCopy.accountDefaultMustChange.cancelLabel}
        onConfirm={openChooseDefault}
        onCancel={cancelDefaultBlock}
      />

      <ChooseDefaultAccountModal
        visible={chooseDefaultVisible}
        accounts={accounts}
        excludeAccountId={excludeAccountId ?? deleteTarget?.id ?? ''}
        onSelect={chooseDefaultAccount}
        onCancel={cancelChooseDefault}
      />

      <ConfirmationModal
        visible={showDeleteConfirm}
        title={deleteDialogCopy.account.title}
        message={deleteTarget ? deleteDialogCopy.account.message(deleteTarget.name) : ''}
        confirmLabel={deleteDialogCopy.account.confirmLabel}
        cancelLabel={deleteDialogCopy.account.cancelLabel}
        destructive
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}
