import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
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
import { ERROR_COPY, SUCCESS_COPY, VALIDATION_COPY } from '../../constants/dialogCopy';
import { AccountType } from '../../database/types';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { navigateToOperationSuccess } from '../../navigation/operationSuccess';
import { useAccountStore } from '../../store/useAccountStore';
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

export function FirstAccountSetupScreen(props: Props) {
  const mode = props.mode ?? props.route?.params?.mode ?? 'onboarding';
  const navigation = props.navigation;
  const addAccount = useAccountStore((state) => state.addAccount);
  const showError = useModalStore((state) => state.showError);

  const [form, setForm] = useState<AccountFormValues>(INITIAL_FORM);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const parsedBalance = useMemo(() => parseCurrencyValue(form.balance), [form.balance]);
  const hasValidBalance = form.balance.trim() !== '' && !Number.isNaN(parsedBalance);
  const canContinue = form.name.trim().length > 0 && hasValidBalance && !saving;

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
      await addAccount({
        name: trimmedName,
        type: form.type,
        balance: parsedBalance,
        icon: form.icon,
        color: form.color,
        isDefault: true,
      });

      if (mode === 'onboarding' && navigation) {
        navigateToOperationSuccess(navigation, {
          title: SUCCESS_COPY.firstAccountCreated.title,
          message: SUCCESS_COPY.firstAccountCreated.message,
          listRoute: 'Coachmarks',
        });
        return;
      }
    } catch {
      showError(
        ERROR_COPY.accountSaveFailed.title,
        ERROR_COPY.accountSaveFailed.message,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingScreen
      useStackHeaderOffset={mode === 'onboarding'}
      contentContainerStyle={styles.content}
      footer={
        <PrimaryButton
          label="Continue"
          onPress={handleContinue}
          disabled={!canContinue}
          loading={saving}
          accessibilityLabel="Create account and continue"
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
