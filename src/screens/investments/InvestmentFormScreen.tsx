import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppSwitch } from '../../components/AppSwitch';
import { Card } from '../../components/Card';
import { FormScreenContainer } from '../../components/FormScreenContainer';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { CurrencyInput } from '../../components/CurrencyInput';
import { UnsavedChangesModal } from '../../components/UnsavedChangesModal';
import {
  DELETE_DIALOG_COPY,
  ERROR_COPY,
  SUCCESS_COPY,
  VALIDATION_COPY,
} from '../../constants/dialogCopy';
import {
  DEDUCTION_DAYS,
  INVESTMENT_TYPE_COLORS,
  INVESTMENT_TYPE_ICONS,
  INVESTMENT_TYPE_LABELS,
  INVESTMENT_TYPES,
} from '../../constants/investmentOptions';
import { databaseService } from '../../database';
import { InvestmentType } from '../../database/types';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { RecurringStackParamList } from '../../navigation/RecurringStackNavigator';
import { navigateToOperationSuccess } from '../../navigation/operationSuccess';
import { useAccountStore } from '../../store/useAccountStore';
import { useInvestmentStore } from '../../store/useInvestmentStore';
import { useModalStore } from '../../store/useModalStore';
import { todayDateString } from '../../store/useTransactionStore';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { parseCurrencyValue } from '../../utils/currency';

type Props = NativeStackScreenProps<RecurringStackParamList, 'InvestmentForm'>;

const EMPTY_FORM = {
  name: '',
  type: 'sip' as InvestmentType,
  amount: '',
  accountId: null as string | null,
  deductionDay: 1,
  startDate: todayDateString(),
  notes: '',
  isActive: true,
};

export function InvestmentFormScreen({ navigation, route }: Props) {
  const { investmentId } = route.params ?? {};
  const isEditing = Boolean(investmentId);
  const { accounts, loadAccounts } = useAccountStore();
  const { addInvestment, editInvestment, removeInvestment } = useInvestmentStore();
  const showError = useModalStore((state) => state.showError);
  const baselineRef = useRef(EMPTY_FORM);

  const clearFormState = useCallback(() => {
    baselineRef.current = EMPTY_FORM;
    setName(EMPTY_FORM.name);
    setType(EMPTY_FORM.type);
    setAmount(EMPTY_FORM.amount);
    setAccountId(EMPTY_FORM.accountId);
    setDeductionDay(EMPTY_FORM.deductionDay);
    setStartDate(EMPTY_FORM.startDate);
    setNotes(EMPTY_FORM.notes);
    setIsActive(EMPTY_FORM.isActive);
    setSaving(false);
    setDeleteDialogVisible(false);
  }, []);

  const resetForm = useCallback(() => {
    const baseline = baselineRef.current;
    setName(baseline.name);
    setType(baseline.type);
    setAmount(baseline.amount);
    setAccountId(baseline.accountId);
    setDeductionDay(baseline.deductionDay);
    setStartDate(baseline.startDate);
    setNotes(baseline.notes);
    setIsActive(baseline.isActive);
  }, []);

  const {
    touch,
    resetDirty,
    discardVisible,
    confirmDiscard,
    cancelDiscard,
    prepareNavigation,
  } = useUnsavedChanges({
    formId: `investment-form-${investmentId ?? 'new'}`,
    navigation,
    rootRoute: 'RecurringList',
    onDiscard: resetForm,
  });

  useEffect(() => () => clearFormState(), [clearFormState]);

  const [name, setName] = useState(EMPTY_FORM.name);
  const [type, setType] = useState<InvestmentType>(EMPTY_FORM.type);
  const [amount, setAmount] = useState(EMPTY_FORM.amount);
  const [accountId, setAccountId] = useState<string | null>(EMPTY_FORM.accountId);
  const [deductionDay, setDeductionDay] = useState(EMPTY_FORM.deductionDay);
  const [startDate, setStartDate] = useState(EMPTY_FORM.startDate);
  const [notes, setNotes] = useState(EMPTY_FORM.notes);
  const [isActive, setIsActive] = useState(EMPTY_FORM.isActive);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadInvestmentForEdit() {
        if (!investmentId) {
          baselineRef.current = EMPTY_FORM;
          resetForm();
          setLoading(false);
          return;
        }

        setLoading(true);
        const investment = await databaseService.getInvestmentById(investmentId);
        if (!active) return;

        if (!investment) {
          showError(ERROR_COPY.investmentNotFound.title, ERROR_COPY.investmentNotFound.message);
          prepareNavigation();
          navigation.goBack();
          setLoading(false);
          return;
        }

        const values = {
          name: investment.name,
          type: investment.type,
          amount: String(investment.amount),
          accountId: investment.accountId,
          deductionDay: investment.deductionDay,
          startDate: investment.startDate,
          notes: investment.notes ?? '',
          isActive: investment.isActive,
        };
        baselineRef.current = values;
        setName(values.name);
        setType(values.type);
        setAmount(values.amount);
        setAccountId(values.accountId);
        setDeductionDay(values.deductionDay);
        setStartDate(values.startDate);
        setNotes(values.notes);
        setIsActive(values.isActive);
        setLoading(false);
      }

      loadInvestmentForEdit().catch(() => {
        if (active) {
          setLoading(false);
          showError(ERROR_COPY.investmentLoadFailed.title, ERROR_COPY.investmentLoadFailed.message);
        }
      });

      return () => {
        active = false;
      };
    }, [investmentId, navigation, prepareNavigation, resetForm, showError]),
  );

  useEffect(() => {
    if (isEditing || accounts.length === 0) return;
    const defaultAccount = accounts.find((account) => account.isDefault) ?? accounts[0];
    setAccountId((current) => {
      const next = current ?? defaultAccount.id;
      baselineRef.current = { ...baselineRef.current, accountId: next };
      return next;
    });
  }, [accounts, isEditing]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showError(VALIDATION_COPY.investmentName.title, VALIDATION_COPY.investmentName.message);
      return;
    }

    const parsedAmount = parseCurrencyValue(amount);
    if (amount.trim() === '' || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      showError(VALIDATION_COPY.investmentAmount.title, VALIDATION_COPY.investmentAmount.message);
      return;
    }

    if (!accountId) {
      showError(VALIDATION_COPY.investmentAccount.title, VALIDATION_COPY.investmentAccount.message);
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())) {
      showError(VALIDATION_COPY.investmentStartDate.title, VALIDATION_COPY.investmentStartDate.message);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: trimmedName,
        type,
        amount: parsedAmount,
        accountId,
        deductionDay,
        startDate: startDate.trim(),
        notes: notes.trim() || null,
        isActive,
      };

      if (isEditing && investmentId) {
        await editInvestment(investmentId, payload);
      } else {
        await addInvestment(payload);
      }

      resetDirty();
      prepareNavigation();
      clearFormState();
      navigateToOperationSuccess(navigation, {
        title: isEditing
          ? SUCCESS_COPY.investmentUpdated.title
          : SUCCESS_COPY.investmentCreated.title,
        message: isEditing
          ? SUCCESS_COPY.investmentUpdated.message
          : SUCCESS_COPY.investmentCreated.message,
        listRoute: 'RecurringList',
      });
    } catch {
      showError(ERROR_COPY.investmentSaveFailed.title, ERROR_COPY.investmentSaveFailed.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!investmentId) return;

    try {
      const deleted = await removeInvestment(investmentId);
      if (!deleted) {
        showError(ERROR_COPY.investmentDeleteFailed.title, ERROR_COPY.investmentDeleteFailed.message);
        return;
      }

      setDeleteDialogVisible(false);
      resetDirty();
      prepareNavigation();
      clearFormState();
      navigateToOperationSuccess(navigation, {
        title: SUCCESS_COPY.investmentDeleted.title,
        message: SUCCESS_COPY.investmentDeleted.message,
        listRoute: 'RecurringList',
      });
    } catch {
      setDeleteDialogVisible(false);
      showError(ERROR_COPY.investmentDeleteFailed.title, ERROR_COPY.investmentDeleteFailed.message);
    }
  };

  return (
    <>
      <UnsavedChangesModal
        visible={discardVisible}
        onConfirm={confirmDiscard}
        onCancel={cancelDiscard}
      />
      <ConfirmationModal
        visible={deleteDialogVisible}
        title={DELETE_DIALOG_COPY.investment.title}
        message={DELETE_DIALOG_COPY.investment.message()}
        confirmLabel={DELETE_DIALOG_COPY.investment.confirmLabel}
        cancelLabel={DELETE_DIALOG_COPY.investment.cancelLabel}
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogVisible(false)}
      />

      <FormScreenContainer contentContainerStyle={styles.content}>
          {loading ? (
            <Card style={styles.loadingCard}>
              <Text style={styles.loadingText}>Loading investment...</Text>
            </Card>
          ) : (
            <>
              <Card style={styles.section}>
                <Text style={styles.label}>Investment Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={(value) => {
                    touch();
                    setName(value);
                  }}
                  placeholder="e.g. SBI SIP"
                  placeholderTextColor={colors.textMuted}
                />
              </Card>

              <Card style={styles.section}>
                <Text style={styles.label}>Investment Type</Text>
                <View style={styles.typeGrid}>
                  {INVESTMENT_TYPES.map((investmentType) => {
                    const selected = type === investmentType;
                    const typeColor = INVESTMENT_TYPE_COLORS[investmentType];
                    return (
                      <Pressable
                        key={investmentType}
                        style={[
                          styles.typeChip,
                          selected && {
                            borderColor: typeColor,
                            backgroundColor: `${typeColor}15`,
                          },
                        ]}
                        onPress={() => {
                          touch();
                          setType(investmentType);
                        }}
                      >
                        <Text style={styles.typeEmoji}>
                          {INVESTMENT_TYPE_ICONS[investmentType]}
                        </Text>
                        <Text
                          style={[styles.typeChipText, selected && { color: typeColor }]}
                          numberOfLines={1}
                        >
                          {INVESTMENT_TYPE_LABELS[investmentType]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>

              <Card style={styles.section}>
                <Text style={styles.label}>Monthly Amount (₹)</Text>
                <CurrencyInput
                  style={styles.input}
                  value={amount}
                  onChangeValue={(value) => {
                    touch();
                    setAmount(value);
                  }}
                  placeholder="5,000"
                  placeholderTextColor={colors.textMuted}
                />
              </Card>

              <Card style={styles.section}>
                <Text style={styles.label}>Linked Account</Text>
                <View style={styles.accountGrid}>
                  {accounts.map((account) => {
                    const selected = accountId === account.id;
                    return (
                      <Pressable
                        key={account.id}
                        style={[
                          styles.accountOption,
                          selected && styles.accountOptionSelected,
                        ]}
                        onPress={() => {
                          touch();
                          setAccountId(account.id);
                        }}
                      >
                        <Text style={styles.accountEmoji}>{account.icon}</Text>
                        <Text
                          style={[
                            styles.accountOptionText,
                            selected && styles.accountOptionTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {account.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {accounts.length === 0 && (
                  <Text style={styles.hint}>Create an account first to link investments.</Text>
                )}
              </Card>

              <Card style={styles.section}>
                <Text style={styles.label}>Deduction Date (day of month)</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dayRow}
                >
                  {DEDUCTION_DAYS.map((day) => {
                    const selected = deductionDay === day;
                    return (
                      <Pressable
                        key={day}
                        style={[styles.dayChip, selected && styles.dayChipSelected]}
                        onPress={() => {
                          touch();
                          setDeductionDay(day);
                        }}
                      >
                        <Text
                          style={[styles.dayChipText, selected && styles.dayChipTextSelected]}
                        >
                          {day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </Card>

              <Card style={styles.section}>
                <Text style={styles.label}>Start Date</Text>
                <TextInput
                  style={styles.input}
                  value={startDate}
                  onChangeText={(value) => {
                    touch();
                    setStartDate(value);
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                />
              </Card>

              <Card style={styles.section}>
                <Text style={styles.label}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  value={notes}
                  onChangeText={(value) => {
                    touch();
                    setNotes(value);
                  }}
                  placeholder="Add a note..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                />
              </Card>

              <Card style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Active</Text>
                  <Text style={styles.switchHint}>
                    Pause to stop automatic monthly deductions
                  </Text>
                </View>
                <AppSwitch
                  value={isActive}
                  onValueChange={(value) => {
                    touch();
                    setIsActive(value);
                  }}
                  accessibilityLabel="Active investment"
                />
              </Card>

              <Pressable
                style={[styles.saveButton, (saving || loading) && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving || loading}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : isEditing ? 'Update Investment' : 'Add Investment'}
                </Text>
              </Pressable>

              {isEditing && (
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => setDeleteDialogVisible(true)}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  <Text style={styles.deleteButtonText}>Delete Investment</Text>
                </Pressable>
              )}
            </>
          )}
      </FormScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  section: { gap: spacing.sm },
  loadingCard: { alignItems: 'center', paddingVertical: spacing.xl },
  loadingText: { fontSize: 14, color: colors.textSecondary },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  hint: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: '100%',
  },
  typeEmoji: { fontSize: 16 },
  typeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    flexShrink: 1,
  },
  accountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: '100%',
  },
  accountOptionSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  accountEmoji: { fontSize: 16 },
  accountOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    flexShrink: 1,
  },
  accountOptionTextSelected: { color: colors.primaryDark },
  dayRow: { gap: spacing.xs, paddingVertical: spacing.xs },
  dayChip: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayChipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  dayChipText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  dayChipTextSelected: { color: colors.primaryDark },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: { flex: 1, marginRight: spacing.md },
  switchLabel: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  switchHint: { fontSize: 12, color: colors.textMuted },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
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
  deleteButtonText: { fontSize: 15, fontWeight: '600', color: colors.danger },
});
