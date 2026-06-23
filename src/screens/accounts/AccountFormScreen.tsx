import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { AccountFormFields } from '../../components/accounts/AccountFormFields';
import { AccountDeleteDialogs } from '../../components/accounts/AccountDeleteDialogs';
import { DefaultAccountChangeDialogs } from '../../components/accounts/DefaultAccountChangeDialogs';
import { accountFormStyles } from '../../components/accounts/accountFormStyles';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Card } from '../../components/Card';
import { FormScreenContainer } from '../../components/FormScreenContainer';
import { UnsavedChangesModal } from '../../components/UnsavedChangesModal';
import {
  ERROR_COPY,
  SUCCESS_COPY,
  VALIDATION_COPY,
} from '../../constants/dialogCopy';
import {
  ACCOUNT_COLORS,
  ACCOUNT_ICONS,
} from '../../constants/accountOptions';
import { databaseService } from '../../database';
import { Account, AccountType } from '../../database/types';
import { AccountsStackParamList } from '../../navigation/AccountsStackNavigator';
import { useAccountStore } from '../../store/useAccountStore';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { navigateToOperationSuccess } from '../../navigation/operationSuccess';
import { PinVerificationModal } from '../../components/PinVerificationModal';
import { SECURITY_COPY } from '../../constants/dialogCopy';
import { useAccountDetailsAccess } from '../../hooks/useAccountDetailsAccess';
import { useAccountDeleteFlow } from '../../hooks/useAccountDeleteFlow';
import { useDefaultAccountChangeFlow } from '../../hooks/useDefaultAccountChangeFlow';
import { useModalStore } from '../../store/useModalStore';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { parseCurrencyValue } from '../../utils/currency';

type Props = NativeStackScreenProps<AccountsStackParamList, 'AccountForm'>;

const EMPTY_FORM = {
  name: '',
  type: 'bank' as AccountType,
  balance: '',
  icon: ACCOUNT_ICONS[0],
  color: ACCOUNT_COLORS[0],
  isDefault: false,
};

function applyAccountToForm(account: Account) {
  return {
    name: account.name,
    type: account.type,
    balance: String(account.balance),
    icon: account.icon,
    color: account.color,
    isDefault: account.isDefault,
  };
}

export function AccountFormScreen({ navigation, route }: Props) {
  const { accountId } = route.params ?? {};
  const isEditing = Boolean(accountId);
  const { addAccount, editAccount, loadAccounts } = useAccountStore();
  const showError = useModalStore((state) => state.showError);
  const baselineRef = useRef(EMPTY_FORM);
  const {
    accessGranted,
    verifyVisible,
    ensureAccessOnFocus,
    handleVerifySuccess,
    handleVerifyCancel,
  } = useAccountDetailsAccess(isEditing);

  const clearFormState = useCallback(() => {
    baselineRef.current = EMPTY_FORM;
    setName(EMPTY_FORM.name);
    setType(EMPTY_FORM.type);
    setBalance(EMPTY_FORM.balance);
    setIcon(EMPTY_FORM.icon);
    setColor(EMPTY_FORM.color);
    setIsDefault(EMPTY_FORM.isDefault);
    setSaving(false);
    setLoading(false);
  }, []);

  const resetForm = useCallback(() => {
    const baseline = baselineRef.current;
    setName(baseline.name);
    setType(baseline.type);
    setBalance(baseline.balance);
    setIcon(baseline.icon);
    setColor(baseline.color);
    setIsDefault(baseline.isDefault);
  }, []);

  const {
    touch,
    resetDirty,
    discardVisible,
    confirmDiscard,
    cancelDiscard,
    exitForm,
    prepareNavigation,
  } = useUnsavedChanges({
    formId: `account-form-${accountId ?? 'new'}`,
    navigation,
    rootRoute: 'AccountsList',
    onDiscard: resetForm,
  });

  useEffect(() => () => clearFormState(), [clearFormState]);

  const [name, setName] = useState(EMPTY_FORM.name);
  const [type, setType] = useState<AccountType>(EMPTY_FORM.type);
  const [balance, setBalance] = useState(EMPTY_FORM.balance);
  const [icon, setIcon] = useState(EMPTY_FORM.icon);
  const [color, setColor] = useState(EMPTY_FORM.color);
  const [isDefault, setIsDefault] = useState(EMPTY_FORM.isDefault);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing && accessGranted);

  const deleteFlow = useAccountDeleteFlow({
    onDeleted: () => {
      resetDirty();
      prepareNavigation();
      clearFormState();
      navigateToOperationSuccess(navigation, {
        title: SUCCESS_COPY.accountDeleted.title,
        message: SUCCESS_COPY.accountDeleted.message,
        listRoute: 'AccountsList',
      });
    },
    onDeleteBlocked: () =>
      showError(
        ERROR_COPY.accountDeleteBlocked.title,
        ERROR_COPY.accountDeleteBlocked.message,
      ),
  });

  const defaultAccountFlow = useDefaultAccountChangeFlow({
    accountId,
    accountName: name,
    isDefault,
    isEditing,
    setIsDefault,
    onBaselineDefaultChange: (nextIsDefault) => {
      baselineRef.current = { ...baselineRef.current, isDefault: nextIsDefault };
    },
    touch,
  });

  const populateForm = useCallback((account: Account) => {
    const values = applyAccountToForm(account);
    baselineRef.current = values;
    setName(values.name);
    setType(values.type);
    setBalance(values.balance);
    setIcon(values.icon);
    setColor(values.color);
    setIsDefault(values.isDefault);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isEditing && !accessGranted) {
        ensureAccessOnFocus();
        return;
      }

      let active = true;

      async function loadAccountForEdit() {
        if (!accountId) {
          baselineRef.current = EMPTY_FORM;
          resetForm();
          setLoading(false);
          return;
        }

        setLoading(true);

        const storeAccounts = useAccountStore.getState().accounts;
        const fromStore = storeAccounts.find((account) => account.id === accountId);
        if (fromStore) {
          populateForm(fromStore);
          setLoading(false);
          return;
        }

        await loadAccounts();
        const refreshed = useAccountStore
          .getState()
          .accounts.find((account) => account.id === accountId);

        if (refreshed && active) {
          populateForm(refreshed);
          setLoading(false);
          return;
        }

        const fromDatabase = await databaseService.getAccountById(accountId);
        if (!active) return;

        if (fromDatabase) {
          populateForm(fromDatabase);
        } else {
          showError(ERROR_COPY.accountNotFound.title, ERROR_COPY.accountNotFound.message);
          prepareNavigation();
          navigation.goBack();
        }

        setLoading(false);
      }

      loadAccountForEdit().catch(() => {
        if (active) {
          setLoading(false);
          showError(ERROR_COPY.accountLoadFailed.title, ERROR_COPY.accountLoadFailed.message);
        }
      });

      return () => {
        active = false;
      };
    }, [
      accessGranted,
      accountId,
      ensureAccessOnFocus,
      isEditing,
      loadAccounts,
      navigation,
      populateForm,
      prepareNavigation,
      resetForm,
      showError,
    ]),
  );

  const onVerifyCancel = () => {
    handleVerifyCancel(() => {
      prepareNavigation();
      navigation.goBack();
    });
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showError(VALIDATION_COPY.accountName.title, VALIDATION_COPY.accountName.message);
      return;
    }

    const parsedBalance = parseCurrencyValue(balance);
    if (balance.trim() === '' || Number.isNaN(parsedBalance)) {
      showError(VALIDATION_COPY.accountBalance.title, VALIDATION_COPY.accountBalance.message);
      return;
    }

    setSaving(true);
    try {
      if (isEditing && accountId) {
        await editAccount(accountId, {
          name: trimmedName,
          type,
          balance: parsedBalance,
          icon,
          color,
          isDefault,
        });
      } else {
        await addAccount({
          name: trimmedName,
          type,
          balance: parsedBalance,
          icon,
          color,
          isDefault,
        });
      }
      resetDirty();
      prepareNavigation();
      clearFormState();
      navigateToOperationSuccess(navigation, {
        title: isEditing ? SUCCESS_COPY.accountUpdated.title : SUCCESS_COPY.accountCreated.title,
        message: isEditing ? SUCCESS_COPY.accountUpdated.message : SUCCESS_COPY.accountCreated.message,
        listRoute: 'AccountsList',
      });
    } catch {
      showError(ERROR_COPY.accountSaveFailed.title, ERROR_COPY.accountSaveFailed.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!accountId) return;
    deleteFlow.requestDelete(accountId, name);
  };

  return (
    <>
      <UnsavedChangesModal
        visible={discardVisible}
        onConfirm={confirmDiscard}
        onCancel={cancelDiscard}
      />
      <AccountDeleteDialogs flow={deleteFlow} excludeAccountId={accountId} />
      <DefaultAccountChangeDialogs flow={defaultAccountFlow} />
      <PinVerificationModal
        visible={verifyVisible}
        onCancel={onVerifyCancel}
        onSuccess={handleVerifySuccess}
        title={SECURITY_COPY.accountDetailsPin.title}
        message={SECURITY_COPY.accountDetailsPin.message}
      />
    {accessGranted ? (
    <FormScreenContainer contentContainerStyle={accountFormStyles.content}>
        {loading ? (
          <Card style={styles.loadingCard}>
            <Text style={styles.loadingText}>Loading account...</Text>
          </Card>
        ) : (
          <>
        <AccountFormFields
          values={{ name, type, balance, icon, color, isDefault }}
          onNameChange={setName}
          onTypeChange={setType}
          onBalanceChange={setBalance}
          onIconChange={setIcon}
          onColorChange={setColor}
          onDefaultChange={defaultAccountFlow.handleDefaultChange}
          onTouch={touch}
        />

        <PrimaryButton
          label={saving ? 'Saving...' : isEditing ? 'Update Account' : 'Add Account'}
          onPress={handleSave}
          disabled={saving || loading}
          loading={saving}
        />

        {isEditing && (
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </Pressable>
        )}
          </>
        )}
    </FormScreenContainer>
    ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  loadingCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.danger}40`,
    backgroundColor: `${colors.danger}08`,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.danger,
  },
});
