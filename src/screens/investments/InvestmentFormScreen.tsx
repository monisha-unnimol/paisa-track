import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
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
import { DateSelectorField } from '../../components/DateSelectorField';
import { UnsavedChangesModal } from '../../components/UnsavedChangesModal';
import {
  DELETE_DIALOG_COPY,
  ERROR_COPY,
  SUCCESS_COPY,
  VALIDATION_COPY,
} from '../../constants/dialogCopy';
import { databaseService } from '../../database';
import { InvestmentType, InvestmentTypeDefinition } from '../../database/types';
import { InvestmentTypeDuplicateNameError, InvestmentTypeDeleteBlockedError } from '../../database';
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
import { isValidDateString, parseDateString } from '../../utils/dateStrings';
import { getNextDeductionDate } from '../../utils/investmentHelpers';
import {
  clearInvestmentTypeCache,
  createInvestmentType,
  deleteInvestmentType,
  loadInvestmentTypeOptions,
  loadUserInvestmentTypes,
} from '../../services/investments/investmentTypeService';
import { CreateInvestmentTypeModal } from '../../components/InlineCreateModals';
import {
  ManageableDropdownField,
  ManageableDropdownItem,
} from '../../components/ManageableDropdownField';

type Props = NativeStackScreenProps<RecurringStackParamList, 'InvestmentForm'>;

const EMPTY_FORM = {
  name: '',
  type: null as InvestmentType | null,
  amount: '',
  accountId: null as string | null,
  deductionDate: todayDateString(),
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
    setDeductionDate(EMPTY_FORM.deductionDate);
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
    setDeductionDate(baseline.deductionDate);
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
  const [type, setType] = useState<InvestmentType | null>(EMPTY_FORM.type);
  const [amount, setAmount] = useState(EMPTY_FORM.amount);
  const [accountId, setAccountId] = useState<string | null>(EMPTY_FORM.accountId);
  const [deductionDate, setDeductionDate] = useState(EMPTY_FORM.deductionDate);
  const [startDate, setStartDate] = useState(EMPTY_FORM.startDate);
  const [notes, setNotes] = useState(EMPTY_FORM.notes);
  const [isActive, setIsActive] = useState(EMPTY_FORM.isActive);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [typeOptions, setTypeOptions] = useState<InvestmentTypeDefinition[]>([]);
  const [allTypeOptions, setAllTypeOptions] = useState<InvestmentTypeDefinition[]>([]);
  const [createTypeVisible, setCreateTypeVisible] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [creatingType, setCreatingType] = useState(false);
  const [deleteTypeTarget, setDeleteTypeTarget] = useState<InvestmentTypeDefinition | null>(null);
  const [typeDeleteBlockedVisible, setTypeDeleteBlockedVisible] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const refreshTypeOptions = useCallback(async () => {
    clearInvestmentTypeCache();
    const all = await loadInvestmentTypeOptions();
    const userTypes = await loadUserInvestmentTypes();
    setAllTypeOptions(all);
    setTypeOptions(userTypes);
    return userTypes;
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshTypeOptions().catch(console.error);
    }, [refreshTypeOptions]),
  );

  const investmentTypeDropdownItems: ManageableDropdownItem[] = (() => {
    const items = typeOptions.map((option) => ({
      id: option.id,
      value: option.slug,
      label: option.name,
      icon: option.icon,
      color: option.color,
      deletable: true,
    }));

    if (type && !typeOptions.some((option) => option.slug === type)) {
      const legacy = allTypeOptions.find((option) => option.slug === type);
      if (legacy) {
        items.unshift({
          id: legacy.id,
          value: legacy.slug,
          label: legacy.name,
          icon: legacy.icon,
          color: legacy.color,
          deletable: false,
        });
      }
    }

    return items;
  })();

  const handleCreateInvestmentType = async () => {
    const trimmedName = newTypeName.trim();
    if (!trimmedName) {
      showError(VALIDATION_COPY.itemNameRequired.title, VALIDATION_COPY.itemNameRequired.message);
      return;
    }

    setCreatingType(true);
    try {
      const created = await createInvestmentType({ name: trimmedName });
      await refreshTypeOptions();
      setType(created.slug);
      setCreateTypeVisible(false);
      setNewTypeName('');
      touch();
    } catch (error) {
      if (error instanceof InvestmentTypeDuplicateNameError) {
        showError(
          ERROR_COPY.investmentTypeDuplicate.title,
          ERROR_COPY.investmentTypeDuplicate.message,
        );
        return;
      }
      showError(ERROR_COPY.investmentSaveFailed.title, ERROR_COPY.investmentSaveFailed.message);
    } finally {
      setCreatingType(false);
    }
  };

  const handleDeleteTypePress = async (item: ManageableDropdownItem) => {
    const option = allTypeOptions.find((entry) => entry.id === item.id);
    if (!option) return;

    const usageCount = await databaseService.getInvestmentTypeUsageCount(option.slug);
    if (usageCount > 0) {
      setTypeDeleteBlockedVisible(true);
      return;
    }
    setDeleteTypeTarget(option);
  };

  const handleConfirmDeleteType = async () => {
    if (!deleteTypeTarget) return;

    try {
      await deleteInvestmentType(deleteTypeTarget.id);
      if (type === deleteTypeTarget.slug) {
        setType(null);
      }
      await refreshTypeOptions();
      setDeleteTypeTarget(null);
    } catch (error) {
      if (error instanceof InvestmentTypeDeleteBlockedError) {
        setDeleteTypeTarget(null);
        setTypeDeleteBlockedVisible(true);
        return;
      }
      showError(ERROR_COPY.investmentSaveFailed.title, ERROR_COPY.investmentSaveFailed.message);
    }
  };

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
          deductionDate: getNextDeductionDate(investment.deductionDay),
          startDate: investment.startDate,
          notes: investment.notes ?? '',
          isActive: investment.isActive,
        };
        baselineRef.current = values;
        setName(values.name);
        setType(values.type);
        setAmount(values.amount);
        setAccountId(values.accountId);
        setDeductionDate(values.deductionDate);
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

    if (!type) {
      showError(VALIDATION_COPY.investmentType.title, VALIDATION_COPY.investmentType.message);
      return;
    }

    if (!isValidDateString(deductionDate)) {
      showError(
        VALIDATION_COPY.investmentDeductionDay.title,
        VALIDATION_COPY.investmentDeductionDay.message,
      );
      return;
    }

    if (!isValidDateString(startDate)) {
      showError(VALIDATION_COPY.investmentStartDate.title, VALIDATION_COPY.investmentStartDate.message);
      return;
    }

    const deductionDay = parseDateString(deductionDate).getDate();

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
                <ManageableDropdownField
                  placeholder="Select investment type"
                  selectedValue={type}
                  items={investmentTypeDropdownItems}
                  onSelect={(value) => {
                    touch();
                    setType(value);
                  }}
                  onDelete={(item) => {
                    handleDeleteTypePress(item).catch(console.error);
                  }}
                  onCreate={() => setCreateTypeVisible(true)}
                  createLabel="Create Investment Type"
                  emptyMessage="No investment types yet. Create one to continue."
                  onOpen={touch}
                />
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
                <Text style={styles.label}>Deduction Date</Text>
                <DateSelectorField
                  value={deductionDate}
                  onChange={(value) => {
                    touch();
                    setDeductionDate(value);
                  }}
                  onPress={touch}
                  placeholder="Select deduction date"
                />
              </Card>

              <Card style={styles.section}>
                <Text style={styles.label}>Start Date</Text>
                <DateSelectorField
                  value={startDate}
                  onChange={(value) => {
                    touch();
                    setStartDate(value);
                  }}
                  onPress={touch}
                  placeholder="Select start date"
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

      <CreateInvestmentTypeModal
        visible={createTypeVisible}
        name={newTypeName}
        onChangeName={setNewTypeName}
        onCancel={() => {
          setCreateTypeVisible(false);
          setNewTypeName('');
        }}
        onSubmit={handleCreateInvestmentType}
        submitting={creatingType}
      />

      <ConfirmationModal
        visible={deleteTypeTarget !== null}
        title={DELETE_DIALOG_COPY.investmentType.title}
        message={DELETE_DIALOG_COPY.investmentType.message()}
        confirmLabel={DELETE_DIALOG_COPY.investmentType.confirmLabel}
        cancelLabel={DELETE_DIALOG_COPY.investmentType.cancelLabel}
        destructive
        onConfirm={handleConfirmDeleteType}
        onCancel={() => setDeleteTypeTarget(null)}
      />

      <ConfirmationModal
        visible={typeDeleteBlockedVisible}
        title={ERROR_COPY.investmentTypeDeleteBlocked.title}
        message={ERROR_COPY.investmentTypeDeleteBlocked.message}
        confirmLabel="Got It"
        singleAction
        icon="alert-circle-outline"
        onConfirm={() => setTypeDeleteBlockedVisible(false)}
      />
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
  emptyState: { gap: spacing.sm, alignItems: 'flex-start' },
  emptyText: { fontSize: 13, color: colors.textMuted },
  placeholderText: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
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
