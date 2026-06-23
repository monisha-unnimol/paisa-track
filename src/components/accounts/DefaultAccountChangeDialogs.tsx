import { ConfirmationModal } from '../ConfirmationModal';
import { ChooseDefaultAccountModal } from './ChooseDefaultAccountModal';
import { DefaultAccountChangeFlow } from '../../hooks/useDefaultAccountChangeFlow';

type DefaultAccountChangeDialogsProps = {
  flow: DefaultAccountChangeFlow;
};

export function DefaultAccountChangeDialogs({ flow }: DefaultAccountChangeDialogsProps) {
  const {
    accounts,
    requiredDialogVisible,
    chooseDefaultVisible,
    confirmChangeVisible,
    confirmMakeDefaultVisible,
    dismissRequiredDialog,
    cancelChooseDefault,
    selectNewDefault,
    cancelChangeDefault,
    confirmChangeDefault,
    cancelMakeDefault,
    confirmMakeDefault,
    copy,
    excludeAccountId,
    makeDefaultMessage,
    changeDefaultMessage,
  } = flow;

  return (
    <>
      <ConfirmationModal
        visible={requiredDialogVisible}
        title={copy.required.title}
        message={copy.required.message}
        confirmLabel={copy.required.confirmLabel}
        singleAction
        icon="information-circle-outline"
        onConfirm={dismissRequiredDialog}
      />

      <ChooseDefaultAccountModal
        visible={chooseDefaultVisible}
        accounts={accounts}
        excludeAccountId={excludeAccountId}
        title={copy.chooseNew.title}
        message={copy.chooseNew.message}
        onSelect={selectNewDefault}
        onCancel={cancelChooseDefault}
      />

      <ConfirmationModal
        visible={confirmChangeVisible}
        title={copy.changeConfirm.title}
        message={changeDefaultMessage}
        confirmLabel={copy.changeConfirm.confirmLabel}
        cancelLabel={copy.changeConfirm.cancelLabel}
        onConfirm={confirmChangeDefault}
        onCancel={cancelChangeDefault}
      />

      <ConfirmationModal
        visible={confirmMakeDefaultVisible}
        title={copy.makeDefault.title}
        message={makeDefaultMessage}
        confirmLabel={copy.makeDefault.confirmLabel}
        cancelLabel={copy.makeDefault.cancelLabel}
        onConfirm={confirmMakeDefault}
        onCancel={cancelMakeDefault}
      />
    </>
  );
}
