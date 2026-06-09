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
  RECURRING_EXPENSE_CATEGORY_ICONS,
  RECURRING_EXPENSE_CATEGORY_LABELS,
  RECURRING_EXPENSE_CATEGORY_TYPES,
  RECURRING_FREQUENCIES,
  RECURRING_FREQUENCY_ICONS,
  RECURRING_FREQUENCY_LABELS,
  WEEKDAYS,
} from '../../constants/recurringOptions';
import { databaseService } from '../../database';
import { RecurringFrequency } from '../../database/types';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { RecurringStackParamList } from '../../navigation/RecurringStackNavigator';
import { navigateToOperationSuccess } from '../../navigation/operationSuccess';
import {
  ensureRecurringExpenseCategories,
  RecurringCategoryOption,
} from '../../services/recurring/recurringCategoryService';
import { useAccountStore } from '../../store/useAccountStore';
import { useRecurringExpenseStore } from '../../store/useRecurringExpenseStore';
import { useModalStore } from '../../store/useModalStore';
import { todayDateString } from '../../store/useTransactionStore';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { parseCurrencyValue } from '../../utils/currency';

type Props = NativeStackScreenProps<RecurringStackParamList, 'RecurringExpenseForm'>;

const EMPTY_FORM = {
  name: '',
  amount: '',
  accountId: null as string | null,
  categoryId: null as string | null,
  frequency: 'monthly' as RecurringFrequency,
  deductionDay: 1,
  startDate: todayDateString(),
  endDate: '',
  notes: '',
  isActive: true,
};

export function RecurringExpenseFormScreen({ navigation, route }: Props) {
  const { recurringExpenseId } = route.params ?? {};
  const isEditing = Boolean(recurringExpenseId);
  const { accounts, loadAccounts } = useAccountStore();
  const { addRecurringExpense, editRecurringExpense, removeRecurringExpense } =
    useRecurringExpenseStore();
  const showError = useModalStore((state) => state.showError);
  const baselineRef = useRef(EMPTY_FORM);

  const clearFormState = useCallback(() => {
    baselineRef.current = EMPTY_FORM;
    setName(EMPTY_FORM.name);
    setAmount(EMPTY_FORM.amount);
    setAccountId(EMPTY_FORM.accountId);
    setCategoryId(EMPTY_FORM.categoryId);
    setFrequency(EMPTY_FORM.frequency);
    setDeductionDay(EMPTY_FORM.deductionDay);
    setStartDate(EMPTY_FORM.startDate);
    setEndDate(EMPTY_FORM.endDate);
    setNotes(EMPTY_FORM.notes);
    setIsActive(EMPTY_FORM.isActive);
    setSaving(false);
    setDeleteDialogVisible(false);
  }, []);

  const resetForm = useCallback(() => {
    const baseline = baselineRef.current;
    setName(baseline.name);
    setAmount(baseline.amount);
    setAccountId(baseline.accountId);
    setCategoryId(baseline.categoryId);
    setFrequency(baseline.frequency);
    setDeductionDay(baseline.deductionDay);
    setStartDate(baseline.startDate);
    setEndDate(baseline.endDate);
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
    formId: `recurring-form-${recurringExpenseId ?? 'new'}`,
    navigation,
    rootRoute: 'RecurringList',
    onDiscard: resetForm,
  });

  useEffect(() => () => clearFormState(), [clearFormState]);

  const [name, setName] = useState(EMPTY_FORM.name);
  const [amount, setAmount] = useState(EMPTY_FORM.amount);
  const [accountId, setAccountId] = useState<string | null>(EMPTY_FORM.accountId);
  const [categoryId, setCategoryId] = useState<string | null>(EMPTY_FORM.categoryId);
  const [frequency, setFrequency] = useState<RecurringFrequency>(EMPTY_FORM.frequency);
  const [deductionDay, setDeductionDay] = useState(EMPTY_FORM.deductionDay);
  const [startDate, setStartDate] = useState(EMPTY_FORM.startDate);
  const [endDate, setEndDate] = useState(EMPTY_FORM.endDate);
  const [notes, setNotes] = useState(EMPTY_FORM.notes);
  const [isActive, setIsActive] = useState(EMPTY_FORM.isActive);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<RecurringCategoryOption[]>([]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadForm() {
        const options = await ensureRecurringExpenseCategories();
        if (!active) return;

        setCategoryOptions(options);
        const defaultCategory =
          options.find((option) => option.type === 'rent') ?? options[0] ?? null;

        if (!recurringExpenseId) {
          const values = {
            ...EMPTY_FORM,
            categoryId: defaultCategory?.categoryId ?? null,
          };
          baselineRef.current = values;
          resetForm();
          setCategoryId(values.categoryId);
          setLoading(false);
          return;
        }

        setLoading(true);
        const expense = await databaseService.getRecurringExpenseById(recurringExpenseId);
        if (!active) return;

        if (!expense) {
          showError(
            ERROR_COPY.recurringNotFound.title,
            ERROR_COPY.recurringNotFound.message,
          );
          prepareNavigation();
          navigation.goBack();
          setLoading(false);
          return;
        }

        const matchedCategory = options.find((option) => option.categoryId === expense.categoryId);
        const fallbackCategory =
          options.find((option) => option.type === 'custom') ?? defaultCategory;

        const values = {
          name: expense.name,
          amount: String(expense.amount),
          accountId: expense.accountId,
          categoryId: matchedCategory?.categoryId ?? fallbackCategory?.categoryId ?? expense.categoryId,
          frequency: expense.frequency,
          deductionDay: expense.deductionDay,
          startDate: expense.startDate,
          endDate: expense.endDate ?? '',
          notes: expense.notes ?? '',
          isActive: expense.isActive,
        };
        baselineRef.current = values;
        setName(values.name);
        setAmount(values.amount);
        setAccountId(values.accountId);
        setCategoryId(values.categoryId);
        setFrequency(values.frequency);
        setDeductionDay(values.deductionDay);
        setStartDate(values.startDate);
        setEndDate(values.endDate);
        setNotes(values.notes);
        setIsActive(values.isActive);
        setLoading(false);
      }

      loadForm().catch(() => {
        if (active) {
          setLoading(false);
          showError(
            ERROR_COPY.recurringLoadFailed.title,
            ERROR_COPY.recurringLoadFailed.message,
          );
        }
      });

      return () => {
        active = false;
      };
    }, [recurringExpenseId, navigation, prepareNavigation, resetForm, showError]),
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

  const handleFrequencyChange = (nextFrequency: RecurringFrequency) => {
    touch();
    setFrequency(nextFrequency);
    if (nextFrequency === 'weekly') {
      setDeductionDay(1);
    } else {
      setDeductionDay(1);
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showError(VALIDATION_COPY.recurringName.title, VALIDATION_COPY.recurringName.message);
      return;
    }

    const parsedAmount = parseCurrencyValue(amount);
    if (amount.trim() === '' || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      showError(VALIDATION_COPY.recurringAmount.title, VALIDATION_COPY.recurringAmount.message);
      return;
    }

    if (!accountId) {
      showError(VALIDATION_COPY.recurringAccount.title, VALIDATION_COPY.recurringAccount.message);
      return;
    }

    if (!categoryId) {
      showError(VALIDATION_COPY.recurringCategory.title, VALIDATION_COPY.recurringCategory.message);
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())) {
      showError(VALIDATION_COPY.recurringStartDate.title, VALIDATION_COPY.recurringStartDate.message);
      return;
    }

    const trimmedEndDate = endDate.trim();
    if (trimmedEndDate && !/^\d{4}-\d{2}-\d{2}$/.test(trimmedEndDate)) {
      showError(VALIDATION_COPY.recurringEndDate.title, VALIDATION_COPY.recurringEndDate.message);
      return;
    }

    if (trimmedEndDate && trimmedEndDate < startDate.trim()) {
      showError(VALIDATION_COPY.recurringEndDate.title, VALIDATION_COPY.recurringEndDate.message);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: trimmedName,
        amount: parsedAmount,
        accountId,
        categoryId,
        frequency,
        deductionDay,
        startDate: startDate.trim(),
        endDate: trimmedEndDate || null,
        notes: notes.trim() || null,
        isActive,
      };

      if (isEditing && recurringExpenseId) {
        await editRecurringExpense(recurringExpenseId, payload);
      } else {
        await addRecurringExpense(payload);
      }

      resetDirty();
      prepareNavigation();
      clearFormState();
      navigateToOperationSuccess(navigation, {
        title: isEditing
          ? SUCCESS_COPY.recurringUpdated.title
          : SUCCESS_COPY.recurringCreated.title,
        message: isEditing
          ? SUCCESS_COPY.recurringUpdated.message
          : SUCCESS_COPY.recurringCreated.message,
        listRoute: 'RecurringList',
      });
    } catch {
      showError(ERROR_COPY.recurringSaveFailed.title, ERROR_COPY.recurringSaveFailed.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!recurringExpenseId) return;

    try {
      const deleted = await removeRecurringExpense(recurringExpenseId);
      if (!deleted) {
        showError(
          ERROR_COPY.recurringDeleteFailed.title,
          ERROR_COPY.recurringDeleteFailed.message,
        );
        return;
      }

      setDeleteDialogVisible(false);
      resetDirty();
      prepareNavigation();
      clearFormState();
      navigateToOperationSuccess(navigation, {
        title: SUCCESS_COPY.recurringDeleted.title,
        message: SUCCESS_COPY.recurringDeleted.message,
        listRoute: 'RecurringList',
      });
    } catch {
      setDeleteDialogVisible(false);
      showError(
        ERROR_COPY.recurringDeleteFailed.title,
        ERROR_COPY.recurringDeleteFailed.message,
      );
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
        title={DELETE_DIALOG_COPY.recurring.title}
        message={DELETE_DIALOG_COPY.recurring.message()}
        confirmLabel={DELETE_DIALOG_COPY.recurring.confirmLabel}
        cancelLabel={DELETE_DIALOG_COPY.recurring.cancelLabel}
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogVisible(false)}
      />

      <FormScreenContainer contentContainerStyle={styles.content}>
          {loading ? (
            <Card style={styles.loadingCard}>
              <Text style={styles.loadingText}>Loading recurring expense...</Text>
            </Card>
          ) : (
            <>
              <Card style={styles.section}>
                <Text style={styles.label}>Expense Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={(value) => {
                    touch();
                    setName(value);
                  }}
                  placeholder="e.g. House Rent"
                  placeholderTextColor={colors.textMuted}
                />
              </Card>

              <Card style={styles.section}>
                <Text style={styles.label}>Amount (₹)</Text>
                <CurrencyInput
                  style={styles.input}
                  value={amount}
                  onChangeValue={(value) => {
                    touch();
                    setAmount(value);
                  }}
                  placeholder="15,000"
                  placeholderTextColor={colors.textMuted}
                />
              </Card>

              <Card style={styles.section}>
                <Text style={styles.label}>Linked Account</Text>
                <View style={styles.optionGrid}>
                  {accounts.map((account) => {
                    const selected = accountId === account.id;
                    return (
                      <Pressable
                        key={account.id}
                        style={[styles.optionChip, selected && styles.optionChipSelected]}
                        onPress={() => {
                          touch();
                          setAccountId(account.id);
                        }}
                      >
                        <Text style={styles.optionEmoji}>{account.icon}</Text>
                        <Text
                          style={[
                            styles.optionChipText,
                            selected && styles.optionChipTextSelected,
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
                  <Text style={styles.hint}>Create an account first to link expenses.</Text>
                )}
              </Card>

              <Card style={styles.section}>
                <Text style={styles.label}>Expense Category</Text>
                <View style={styles.categoryGrid}>
                  {RECURRING_EXPENSE_CATEGORY_TYPES.map((type) => {
                    const option = categoryOptions.find((item) => item.type === type);
                    const color = option?.color ?? '#94A3B8';
                    const selected = option ? categoryId === option.categoryId : false;

                    return (
                      <Pressable
                        key={type}
                        style={[
                          styles.categoryChip,
                          selected && {
                            borderColor: color,
                            backgroundColor: `${color}15`,
                          },
                        ]}
                        onPress={() => {
                          if (!option) return;
                          touch();
                          setCategoryId(option.categoryId);
                        }}
                        disabled={!option}
                      >
                        <Text style={styles.optionEmoji}>
                          {RECURRING_EXPENSE_CATEGORY_ICONS[type]}
                        </Text>
                        <Text
                          style={[
                            styles.categoryChipText,
                            selected && { color },
                          ]}
                          numberOfLines={2}
                        >
                          {RECURRING_EXPENSE_CATEGORY_LABELS[type]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>

              <Card style={styles.section}>
                <Text style={styles.label}>Frequency</Text>
                <View style={styles.optionGrid}>
                  {RECURRING_FREQUENCIES.map((item) => {
                    const selected = frequency === item;
                    return (
                      <Pressable
                        key={item}
                        style={[styles.optionChip, selected && styles.optionChipSelected]}
                        onPress={() => handleFrequencyChange(item)}
                      >
                        <Text style={styles.optionEmoji}>
                          {RECURRING_FREQUENCY_ICONS[item]}
                        </Text>
                        <Text
                          style={[
                            styles.optionChipText,
                            selected && styles.optionChipTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {RECURRING_FREQUENCY_LABELS[item]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>

              <Card style={styles.section}>
                <Text style={styles.label}>
                  {frequency === 'weekly' ? 'Deduction Day (weekday)' : 'Deduction Date (day of month)'}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dayRow}
                >
                  {frequency === 'weekly'
                    ? WEEKDAYS.map((weekday) => {
                        const selected = deductionDay === weekday.value;
                        return (
                          <Pressable
                            key={weekday.value}
                            style={[styles.dayChip, selected && styles.dayChipSelected]}
                            onPress={() => {
                              touch();
                              setDeductionDay(weekday.value);
                            }}
                          >
                            <Text
                              style={[
                                styles.dayChipText,
                                selected && styles.dayChipTextSelected,
                              ]}
                            >
                              {weekday.label}
                            </Text>
                          </Pressable>
                        );
                      })
                    : DEDUCTION_DAYS.map((day) => {
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
                              style={[
                                styles.dayChipText,
                                selected && styles.dayChipTextSelected,
                              ]}
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
                <Text style={styles.label}>End Date (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={endDate}
                  onChangeText={(value) => {
                    touch();
                    setEndDate(value);
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
                    Pause to stop automatic expense creation
                  </Text>
                </View>
                <AppSwitch
                  value={isActive}
                  onValueChange={(value) => {
                    touch();
                    setIsActive(value);
                  }}
                  accessibilityLabel="Active recurring expense"
                />
              </Card>

              <Pressable
                style={[styles.saveButton, (saving || loading) && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving || loading}
              >
                <Text style={styles.saveButtonText}>
                  {saving
                    ? 'Saving...'
                    : isEditing
                      ? 'Update Recurring Expense'
                      : 'Add Recurring Expense'}
                </Text>
              </Pressable>

              {isEditing && (
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => setDeleteDialogVisible(true)}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  <Text style={styles.deleteButtonText}>Delete Recurring Expense</Text>
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
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  optionChip: {
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
  optionChipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  optionEmoji: { fontSize: 16 },
  optionChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    flexShrink: 1,
  },
  optionChipTextSelected: { color: colors.primaryDark },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  categoryChip: {
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
    minWidth: '47%',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    flexShrink: 1,
  },
  dayRow: { gap: spacing.xs, paddingVertical: spacing.xs },
  dayChip: {
    minWidth: 44,
    height: 40,
    paddingHorizontal: spacing.sm,
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
