import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import {
  AccountFormFields,
  AccountFormValues,
} from '../../components/accounts/AccountFormFields';
import { FirstAccountTemplatesPicker } from '../../components/accounts/FirstAccountTemplatesPicker';
import { FirstAccountTemplate } from '../../constants/firstAccountTemplates';
import {
  ACCOUNT_COLORS,
  ACCOUNT_ICONS,
} from '../../constants/accountOptions';
import { OnboardingHeader } from '../../components/OnboardingHeader';
import { OnboardingScreen } from '../../components/OnboardingScreen';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ERROR_COPY, VALIDATION_COPY } from '../../constants/dialogCopy';
import { Account, AccountType } from '../../database/types';
import { databaseService } from '../../database';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { useAccountStore } from '../../store/useAccountStore';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { useModalStore } from '../../store/useModalStore';
import { spacing } from '../../theme/spacing';
import { parseCurrencyValue } from '../../utils/currency';

type Props = {
  mode?: 'onboarding' | 'migration';
} & Partial<NativeStackScreenProps<OnboardingStackParamList, 'FirstAccountSetup'>>;

const MIGRATION_HEADER = {
  title: 'First Account',
  subtitle:
    "You'll use this account for tracking income, expenses, investments, and recurring transactions.",
} as const;

const INITIAL_FORM: AccountFormValues = {
  name: '',
  type: 'bank',
  balance: '',
  icon: ACCOUNT_ICONS[0],
  color: ACCOUNT_COLORS[0],
  isDefault: true,
};

function accountToFormValues(account: Account): AccountFormValues {
  return {
    name: account.name,
    type: account.type,
    balance: String(account.balance),
    icon: account.icon,
    color: account.color,
    isDefault: account.isDefault,
  };
}

function formsMatch(
  left: AccountFormValues,
  right: AccountFormValues,
  leftBalance: number,
  rightBalance: number,
): boolean {
  return (
    left.name.trim() === right.name.trim() &&
    left.type === right.type &&
    left.icon === right.icon &&
    left.color === right.color &&
    leftBalance === rightBalance
  );
}

export function FirstAccountSetupScreen(props: Props) {
  const mode = props.mode ?? props.route?.params?.mode ?? 'onboarding';
  const navigation = props.navigation;
  const addAccount = useAccountStore((state) => state.addAccount);
  const editAccount = useAccountStore((state) => state.editAccount);
  const showError = useModalStore((state) => state.showError);
  const {
    onboardingAccountId,
    onboardingAccountCreated,
    hydrated: onboardingHydrated,
    hydrate: hydrateOnboarding,
    setOnboardingAccount,
  } = useOnboardingStore();

  const [form, setForm] = useState<AccountFormValues>(INITIAL_FORM);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingAccount, setLoadingAccount] = useState(mode === 'onboarding');
  const baselineRef = useRef<AccountFormValues>(INITIAL_FORM);

  const isEditMode = mode === 'onboarding' && onboardingAccountCreated && Boolean(onboardingAccountId);

  const parsedBalance = useMemo(() => parseCurrencyValue(form.balance), [form.balance]);
  const hasValidBalance = form.balance.trim() !== '' && !Number.isNaN(parsedBalance);
  const canContinue = form.name.trim().length > 0 && hasValidBalance && !saving && !loadingAccount;

  const updateForm = (patch: Partial<AccountFormValues>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const applyTemplate = (template: FirstAccountTemplate) => {
    setSelectedTemplateId(template.id);
    updateForm({
      name: template.name,
      type: template.type,
      icon: template.icon,
      color: template.color,
      isDefault: true,
    });
  };

  const handleFieldChange = <K extends keyof AccountFormValues>(
    key: K,
    value: AccountFormValues[K],
  ) => {
    setSelectedTemplateId(null);
    updateForm({ [key]: value });
  };

  const handleTypeChange = (nextType: AccountType) => {
    setSelectedTemplateId(null);
    updateForm({ type: nextType });
  };

  const loadOnboardingAccount = useCallback(async () => {
    if (mode !== 'onboarding') {
      setLoadingAccount(false);
      return;
    }

    if (!onboardingHydrated) {
      await hydrateOnboarding();
    }

    const accountId = useOnboardingStore.getState().onboardingAccountId;
    const accountCreated = useOnboardingStore.getState().onboardingAccountCreated;

    if (!accountCreated || !accountId) {
      setLoadingAccount(false);
      return;
    }

    setLoadingAccount(true);
    try {
      const account = await databaseService.getAccountById(accountId);
      if (!account) {
        setLoadingAccount(false);
        return;
      }

      const values = accountToFormValues(account);
      baselineRef.current = values;
      setForm(values);
    } finally {
      setLoadingAccount(false);
    }
  }, [hydrateOnboarding, mode, onboardingHydrated]);

  useFocusEffect(
    useCallback(() => {
      loadOnboardingAccount().catch(console.error);
    }, [loadOnboardingAccount]),
  );

  const continueOnboarding = () => {
    navigation?.navigate('SmsTrackingSetup');
  };

  const handleContinue = async () => {
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      showError(VALIDATION_COPY.accountName.title, VALIDATION_COPY.accountName.message);
      return;
    }

    if (form.balance.trim() === '') {
      showError(
        VALIDATION_COPY.firstAccountBalanceRequired.title,
        VALIDATION_COPY.firstAccountBalanceRequired.message,
      );
      return;
    }

    if (Number.isNaN(parsedBalance)) {
      showError(VALIDATION_COPY.accountBalance.title, VALIDATION_COPY.accountBalance.message);
      return;
    }

    setSaving(true);
    try {
      if (mode === 'onboarding' && isEditMode && onboardingAccountId) {
        const baselineBalance = parseCurrencyValue(baselineRef.current.balance);
        const unchanged = formsMatch(form, baselineRef.current, parsedBalance, baselineBalance);

        if (unchanged) {
          continueOnboarding();
          return;
        }

        const updated = await editAccount(onboardingAccountId, {
          name: trimmedName,
          type: form.type,
          balance: parsedBalance,
          icon: form.icon,
          color: form.color,
          isDefault: true,
        });

        if (!updated) {
          showError(
            ERROR_COPY.accountSaveFailed.title,
            ERROR_COPY.accountSaveFailed.message,
          );
          return;
        }

        baselineRef.current = accountToFormValues(updated);
        setForm(baselineRef.current);
        continueOnboarding();
        return;
      }

      if (mode === 'onboarding' && onboardingAccountCreated && onboardingAccountId) {
        continueOnboarding();
        return;
      }

      const account = await addAccount({
        name: trimmedName,
        type: form.type,
        balance: parsedBalance,
        icon: form.icon,
        color: form.color,
        isDefault: true,
      });

      baselineRef.current = accountToFormValues(account);
      setForm(baselineRef.current);
      await setOnboardingAccount(account.id);
      continueOnboarding();
    } catch {
      showError(
        ERROR_COPY.accountSaveFailed.title,
        ERROR_COPY.accountSaveFailed.message,
      );
    } finally {
      setSaving(false);
    }
  };

  const primaryLabel = isEditMode ? 'Update Account' : 'Save Account';

  return (
    <OnboardingScreen
      useStackHeaderOffset={mode === 'onboarding'}
      contentContainerStyle={styles.content}
      footer={
        <PrimaryButton
          label={primaryLabel}
          onPress={handleContinue}
          disabled={!canContinue}
          loading={saving || loadingAccount}
          accessibilityLabel={
            isEditMode ? 'Update account and continue' : 'Save account and continue'
          }
          compact
        />
      }
    >
      {mode === 'migration' ? (
        <OnboardingHeader
          title={MIGRATION_HEADER.title}
          subtitle={MIGRATION_HEADER.subtitle}
        />
      ) : null}

      <AccountFormFields
        values={form}
        onNameChange={(value) => handleFieldChange('name', value)}
        onTypeChange={handleTypeChange}
        onBalanceChange={(value) => handleFieldChange('balance', value)}
        onIconChange={(value) => handleFieldChange('icon', value)}
        onColorChange={(value) => handleFieldChange('color', value)}
        onDefaultChange={() => undefined}
        showDefaultSwitch={false}
        balanceLabel="Opening Balance"
        balanceHint="Enter your current balance in rupees (₹0 is allowed)."
        namePlaceholder="e.g. HDFC Salary Account"
        style={styles.formFields}
        afterBalance={
          <FirstAccountTemplatesPicker
            selectedTemplateId={selectedTemplateId}
            onSelect={applyTemplate}
          />
        }
      />
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  formFields: {
    gap: spacing.md,
  },
});
