import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Card } from '../../components/Card';
import { FormScreenContainer } from '../../components/FormScreenContainer';
import { CurrencyInput } from '../../components/CurrencyInput';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { UnsavedChangesModal } from '../../components/UnsavedChangesModal';
import {
  DELETE_DIALOG_COPY,
  ERROR_COPY,
  SUCCESS_COPY,
  VALIDATION_COPY,
} from '../../constants/dialogCopy';
import { databaseService } from '../../database';
import { TransactionType } from '../../database/types';
import { TransactionsStackParamList } from '../../navigation/TransactionsStackNavigator';
import { useAccountStore } from '../../store/useAccountStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useSmsDraftStore } from '../../store/useSmsDraftStore';
import { useModalStore } from '../../store/useModalStore';
import { navigateToOperationSuccess } from '../../navigation/operationSuccess';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import {
  todayDateString,
  useTransactionStore,
} from '../../store/useTransactionStore';
import { completePendingReview } from '../../services/reviews/reviewService';
import { matchAccountFromSms } from '../../utils/accountMatching';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { parseCurrencyValue } from '../../utils/currency';

type Props = NativeStackScreenProps<TransactionsStackParamList, 'TransactionForm'>;

type TransactionFormState = {
  type: TransactionType;
  title: string;
  amount: string;
  categoryId: string | null;
  accountId: string | null;
  date: string;
  notes: string;
};

function createEmptyForm(type: TransactionType = 'expense'): TransactionFormState {
  return {
    type,
    title: '',
    amount: '',
    categoryId: null,
    accountId: null,
    date: todayDateString(),
    notes: '',
  };
}

export function TransactionFormScreen({ navigation, route }: Props) {
  const { transactionId, type: initialType, smsDraftId, reviewId } = route.params;
  const isEditing = Boolean(transactionId);
  const isSmsDraft = Boolean(smsDraftId);
  const { accounts, loadAccounts } = useAccountStore();
  const { categories, loadCategories, lastCreatedCategoryId, clearLastCreatedCategory } =
    useCategoryStore();
  const { getDraft, removeDraft } = useSmsDraftStore();
  const { addTransaction, editTransaction, removeTransaction } = useTransactionStore();
  const showError = useModalStore((state) => state.showError);
  const baselineRef = useRef<TransactionFormState>(createEmptyForm(initialType ?? 'expense'));

  const applyFormState = useCallback((values: TransactionFormState) => {
    setType(values.type);
    setTitle(values.title);
    setAmount(values.amount);
    setCategoryId(values.categoryId);
    setAccountId(values.accountId);
    setDate(values.date);
    setNotes(values.notes);
  }, []);

  const clearFormState = useCallback(() => {
    const empty = createEmptyForm(initialType ?? 'expense');
    baselineRef.current = empty;
    applyFormState(empty);
    setSaving(false);
    setDeleteDialogVisible(false);
  }, [applyFormState, initialType]);

  const resetForm = useCallback(() => {
    applyFormState(baselineRef.current);
  }, [applyFormState]);

  const {
    touch,
    resetDirty,
    discardVisible,
    confirmDiscard,
    cancelDiscard,
    exitForm,
    prepareNavigation,
  } = useUnsavedChanges({
    formId: `transaction-form-${transactionId ?? smsDraftId ?? initialType ?? 'new'}`,
    navigation,
    rootRoute: 'TransactionsList',
    onDiscard: resetForm,
  });

  useEffect(() => () => clearFormState(), [clearFormState]);

  const [type, setType] = useState<TransactionType>(initialType ?? 'expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [date, setDate] = useState(todayDateString());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  useEffect(() => {
    loadAccounts();
    loadCategories();
  }, [loadAccounts, loadCategories]);

  useEffect(() => {
    if (!transactionId) return;

    databaseService.getTransactionById(transactionId).then((transaction) => {
      if (!transaction) return;
      const values: TransactionFormState = {
        type: transaction.type === 'transfer' ? 'expense' : transaction.type,
        title: transaction.title,
        amount: String(transaction.amount),
        categoryId: transaction.categoryId,
        accountId: transaction.accountId,
        date: transaction.date,
        notes: transaction.notes ?? '',
      };
      baselineRef.current = values;
      applyFormState(values);
    });
  }, [transactionId, applyFormState]);

  useEffect(() => {
    if (!smsDraftId) return;

    const draft = getDraft(smsDraftId);
    if (!draft) return;

    const values: TransactionFormState = {
      type: draft.type,
      title: draft.title,
      amount: String(draft.amount),
      categoryId: null,
      accountId: null,
      date: todayDateString(),
      notes: `${draft.notes}\n\n${draft.rawBody}`,
    };
    baselineRef.current = values;
    applyFormState(values);
  }, [smsDraftId, getDraft, applyFormState]);

  useEffect(() => {
    if (!isSmsDraft) return;
    touch();
  }, [isSmsDraft, touch]);

  useEffect(() => {
    if (!smsDraftId || accounts.length === 0) return;

    const draft = getDraft(smsDraftId);
    if (!draft) return;

    const matchedAccount = matchAccountFromSms(accounts, {
      accountHint: draft.accountHint,
      rawBody: draft.rawBody,
      sender: draft.sender,
    });

    if (matchedAccount) {
      setAccountId(matchedAccount.id);
      baselineRef.current = {
        ...baselineRef.current,
        accountId: matchedAccount.id,
      };
    }
  }, [smsDraftId, accounts, getDraft]);

  useFocusEffect(
    useCallback(() => {
      loadCategories().then(() => {
        if (lastCreatedCategoryId) {
          touch();
          setCategoryId(lastCreatedCategoryId);
          clearLastCreatedCategory();
        }
      });
    }, [loadCategories, lastCreatedCategoryId, clearLastCreatedCategory, touch]),
  );

  useEffect(() => {
    if (isEditing || isSmsDraft || accounts.length === 0) return;
    const defaultAccount = accounts.find((account) => account.isDefault) ?? accounts[0];
    setAccountId((current) => {
      const next = current ?? defaultAccount.id;
      baselineRef.current = { ...baselineRef.current, accountId: next };
      return next;
    });
  }, [accounts, isEditing, isSmsDraft]);

  useEffect(() => {
    if (type === 'income') {
      setCategoryId(null);
    }
  }, [type]);

  const availableCategories = useMemo(() => {
    if (!accountId) return categories;
    return categories.filter(
      (category) => !category.accountId || category.accountId === accountId,
    );
  }, [categories, accountId]);

  useEffect(() => {
    if (!categoryId) return;
    const stillValid = availableCategories.some((category) => category.id === categoryId);
    if (!stillValid) {
      setCategoryId(null);
    }
  }, [availableCategories, categoryId]);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      showError(VALIDATION_COPY.transactionTitle.title, VALIDATION_COPY.transactionTitle.message);
      return;
    }

    const parsedAmount = parseCurrencyValue(amount);
    if (amount.trim() === '' || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      showError(VALIDATION_COPY.transactionAmount.title, VALIDATION_COPY.transactionAmount.message);
      return;
    }

    if (!accountId) {
      showError(VALIDATION_COPY.transactionAccount.title, VALIDATION_COPY.transactionAccount.message);
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      showError(VALIDATION_COPY.transactionDate.title, VALIDATION_COPY.transactionDate.message);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: trimmedTitle,
        amount: parsedAmount,
        categoryId: type === 'expense' ? categoryId : null,
        accountId,
        date: date.trim(),
        type,
        notes: notes.trim() || null,
      };

      if (isEditing && transactionId) {
        await editTransaction(transactionId, payload);
      } else {
        await addTransaction(payload);
        if (smsDraftId || reviewId) {
          await completePendingReview({ reviewId, draftId: smsDraftId }).catch(console.error);
        }
        if (smsDraftId) {
          removeDraft(smsDraftId);
        }
      }

      resetDirty();
      prepareNavigation();
      clearFormState();

      if (isEditing) {
        navigateToOperationSuccess(navigation, {
          title: SUCCESS_COPY.transactionUpdated.title,
          message: SUCCESS_COPY.transactionUpdated.message,
          listRoute: 'TransactionsList',
        });
      } else {
        const copy = SUCCESS_COPY.transactionCreated(type === 'income' ? 'income' : 'expense');
        navigateToOperationSuccess(navigation, {
          title: copy.title,
          message: copy.message,
          listRoute: 'TransactionsList',
        });
      }
    } catch {
      showError(ERROR_COPY.transactionSaveFailed.title, ERROR_COPY.transactionSaveFailed.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!transactionId) return;
    setDeleteDialogVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!transactionId) return;

    const deleted = await removeTransaction(transactionId);
    if (!deleted) return;

    setDeleteDialogVisible(false);
    resetDirty();
    prepareNavigation();
    clearFormState();
    navigateToOperationSuccess(navigation, {
      title: SUCCESS_COPY.transactionDeleted.title,
      message: SUCCESS_COPY.transactionDeleted.message,
      listRoute: 'TransactionsList',
    });
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
        title={DELETE_DIALOG_COPY.transaction.title}
        message={DELETE_DIALOG_COPY.transaction.message(title)}
        confirmLabel={DELETE_DIALOG_COPY.transaction.confirmLabel}
        cancelLabel={DELETE_DIALOG_COPY.transaction.cancelLabel}
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogVisible(false)}
      />
    <FormScreenContainer contentContainerStyle={styles.content}>
        {isSmsDraft && (
          <Card variant="outlined" style={styles.smsBanner}>
            <Text style={styles.smsBannerTitle}>Review SMS-detected transaction</Text>
            <Text style={styles.smsBannerText}>
              Details were extracted from your bank SMS. Nothing is saved until you tap
              save below.
            </Text>
          </Card>
        )}

        <Card style={styles.section}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            {(['income', 'expense'] as TransactionType[]).map((option) => {
              const selected = type === option;
              const isIncome = option === 'income';
              return (
                <Pressable
                  key={option}
                  style={[
                    styles.typeChip,
                    selected && (isIncome ? styles.incomeChip : styles.expenseChip),
                  ]}
                  onPress={() => {
                    touch();
                    setType(option);
                  }}
                >
                  <Ionicons
                    name={isIncome ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                    size={18}
                    color={selected ? (isIncome ? colors.income : colors.expense) : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeChipText,
                      selected && (isIncome ? styles.incomeChipText : styles.expenseChipText),
                    ]}
                  >
                    {isIncome ? 'Income' : 'Expense'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={(value) => {
              touch();
              setTitle(value);
            }}
            placeholder={type === 'income' ? 'e.g. Salary' : 'e.g. Grocery shopping'}
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
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
          />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.label}>Account</Text>
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
                      styles.optionText,
                      selected && styles.optionTextSelected,
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
            <Text style={styles.hint}>Create an account first to record transactions.</Text>
          )}
        </Card>

        {type === 'expense' && (
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Category (optional)</Text>
              <Pressable
                style={styles.addCategoryButton}
                onPress={() => {
                  touch();
                  navigation.navigate('CategoryForm', {
                    defaultAccountId: accountId,
                    source: isEditing ? 'edit_expense' : 'create_expense',
                  });
                }}
              >
                <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                <Text style={styles.addCategoryText}>New Category</Text>
              </Pressable>
            </View>
            <View style={styles.optionGrid}>
              <Pressable
                style={[
                  styles.optionChip,
                  categoryId === null && styles.optionChipSelected,
                ]}
                onPress={() => {
                  touch();
                  setCategoryId(null);
                }}
              >
                <Ionicons
                  name="remove-circle-outline"
                  size={16}
                  color={categoryId === null ? colors.primaryDark : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.optionText,
                    categoryId === null && styles.optionTextSelected,
                  ]}
                >
                  None
                </Text>
              </Pressable>
              {availableCategories.map((category) => {
                const selected = categoryId === category.id;
                return (
                  <Pressable
                    key={category.id}
                    style={[
                      styles.optionChip,
                      selected && styles.optionChipSelected,
                      selected && { borderColor: category.color },
                    ]}
                    onPress={() => {
                      touch();
                      setCategoryId(category.id);
                    }}
                  >
                    <Text style={styles.optionEmoji}>{category.icon}</Text>
                    <Text
                      style={[
                        styles.optionText,
                        selected && styles.optionTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {category.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {availableCategories.length === 0 && (
              <Text style={styles.hint}>
                No categories yet. You can still save this expense without one.
              </Text>
            )}
          </Card>
        )}

        <Card style={styles.section}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={(value) => {
              touch();
              setDate(value);
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

        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving
              ? 'Saving...'
              : isEditing
                ? 'Update Transaction'
                : type === 'income'
                  ? 'Add Income'
                  : 'Add Expense'}
          </Text>
        </Pressable>

        {isEditing && (
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={styles.deleteButtonText}>Delete Transaction</Text>
          </Pressable>
        )}
    </FormScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
  },
  addCategoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  smsBanner: {
    backgroundColor: `${colors.primary}08`,
    borderColor: `${colors.primary}30`,
  },
  smsBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  smsBannerText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
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
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  incomeChip: {
    backgroundColor: `${colors.income}10`,
    borderColor: `${colors.income}40`,
  },
  expenseChip: {
    backgroundColor: `${colors.expense}10`,
    borderColor: `${colors.expense}40`,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  incomeChipText: {
    color: colors.income,
  },
  expenseChipText: {
    color: colors.expense,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
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
  optionEmoji: {
    fontSize: 16,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    flexShrink: 1,
  },
  optionTextSelected: {
    color: colors.primaryDark,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
