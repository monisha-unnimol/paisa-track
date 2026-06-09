import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
  CATEGORY_COLORS,
  CATEGORY_ICONS,
} from '../../constants/categoryOptions';
import { CategoryDeleteBlockedError, CategoryDuplicateNameError, databaseService } from '../../database';
import { CategoriesStackParamList } from '../../navigation/CategoriesStackNavigator';
import {
  isTransactionCategoryFormSource,
  resolveCategoryFormSource,
} from '../../navigation/categoryFormParams';
import { useAccountStore } from '../../store/useAccountStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { navigateToOperationSuccess } from '../../navigation/operationSuccess';
import { useModalStore } from '../../store/useModalStore';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { parseCurrencyValue } from '../../utils/currency';

type Props = NativeStackScreenProps<CategoriesStackParamList, 'CategoryForm'>;

const EMPTY_FORM = {
  name: '',
  budget: '',
  icon: CATEGORY_ICONS[0],
  color: CATEGORY_COLORS[0],
  accountId: null as string | null,
};

export function CategoryFormScreen({ navigation, route }: Props) {
  const { categoryId, defaultAccountId } = route.params ?? {};
  const source = resolveCategoryFormSource(route.params);
  const fromTransactionForm = isTransactionCategoryFormSource(source);
  const isEditing = Boolean(categoryId);
  const { accounts, loadAccounts } = useAccountStore();
  const { addCategory, editCategory, removeCategory, setSearchQuery, setAccountFilter } =
    useCategoryStore();
  const showError = useModalStore((state) => state.showError);
  const baselineRef = useRef(EMPTY_FORM);

  const resetForm = useCallback(() => {
    const baseline = baselineRef.current;
    setName(baseline.name);
    setBudget(baseline.budget);
    setIcon(baseline.icon);
    setColor(baseline.color);
    setAccountId(baseline.accountId);
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
    formId: `category-form-${categoryId ?? 'new'}`,
    navigation,
    rootRoute: fromTransactionForm ? 'TransactionForm' : 'CategoriesList',
    onDiscard: resetForm,
    preferGoBack: fromTransactionForm,
  });

  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [icon, setIcon] = useState(CATEGORY_ICONS[0]);
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    if (categoryId) return;

    const values = {
      ...EMPTY_FORM,
      accountId: defaultAccountId ?? null,
    };
    baselineRef.current = values;
    setName(values.name);
    setBudget(values.budget);
    setIcon(values.icon);
    setColor(values.color);
    setAccountId(values.accountId);
  }, [categoryId, defaultAccountId]);

  useEffect(() => {
    if (!categoryId) return;

    databaseService.getCategoryById(categoryId).then((category) => {
      if (!category) return;
      const values = {
        name: category.name,
        budget: String(category.budget),
        icon: category.icon,
        color: category.color,
        accountId: category.accountId,
      };
      baselineRef.current = values;
      setName(values.name);
      setBudget(values.budget);
      setIcon(values.icon);
      setColor(values.color);
      setAccountId(values.accountId);
    });
  }, [categoryId]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showError(VALIDATION_COPY.categoryName.title, VALIDATION_COPY.categoryName.message);
      return;
    }

    const parsedBudget = parseCurrencyValue(budget);
    if (budget.trim() === '' || Number.isNaN(parsedBudget) || parsedBudget < 0) {
      showError(VALIDATION_COPY.categoryBudget.title, VALIDATION_COPY.categoryBudget.message);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: trimmedName,
        icon,
        color,
        budget: parsedBudget,
        accountId,
      };

      if (isEditing && categoryId) {
        await editCategory(categoryId, payload);
      } else {
        await addCategory(payload);
        setSearchQuery('');
        setAccountFilter(null);
      }

      resetDirty();
      prepareNavigation();

      if (fromTransactionForm) {
        navigation.goBack();
        return;
      }

      navigateToOperationSuccess(navigation, {
        title: isEditing ? SUCCESS_COPY.categoryUpdated.title : SUCCESS_COPY.categoryCreated.title,
        message: isEditing ? SUCCESS_COPY.categoryUpdated.message : SUCCESS_COPY.categoryCreated.message,
        listRoute: 'CategoriesList',
      });
    } catch (error) {
      console.error('[CategoryForm] save failed', error);

      if (error instanceof CategoryDuplicateNameError) {
        showError(ERROR_COPY.categoryDuplicate.title, ERROR_COPY.categoryDuplicate.message);
        return;
      }

      showError(
        ERROR_COPY.categorySaveFailed.title,
        ERROR_COPY.categorySaveFailed.message,
        handleSave,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!categoryId) return;
    setDeleteDialogVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryId) return;

    try {
      const deleted = await removeCategory(categoryId);
      if (!deleted) {
        showError(ERROR_COPY.categoryDeleteFailed.title, ERROR_COPY.categoryDeleteFailed.message);
        return;
      }

      setDeleteDialogVisible(false);
      resetDirty();
      prepareNavigation();

      if (fromTransactionForm) {
        navigation.goBack();
        return;
      }

      navigateToOperationSuccess(navigation, {
        title: SUCCESS_COPY.categoryDeleted.title,
        message: SUCCESS_COPY.categoryDeleted.message,
        listRoute: 'CategoriesList',
      });
    } catch (error) {
      setDeleteDialogVisible(false);
      if (error instanceof CategoryDeleteBlockedError) {
        showError(
          ERROR_COPY.categoryDeleteBlocked.title,
          ERROR_COPY.categoryDeleteBlocked.message,
        );
        return;
      }
      showError(
        ERROR_COPY.categoryDeleteFailed.title,
        ERROR_COPY.categoryDeleteFailed.message,
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
        title={DELETE_DIALOG_COPY.category.title}
        message={DELETE_DIALOG_COPY.category.message(name)}
        confirmLabel={DELETE_DIALOG_COPY.category.confirmLabel}
        cancelLabel={DELETE_DIALOG_COPY.category.cancelLabel}
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogVisible(false)}
      />
    <FormScreenContainer contentContainerStyle={styles.content}>
        <Card style={styles.section}>
          <Text style={styles.label}>Spending Limit Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(value) => {
              touch();
              setName(value);
            }}
            placeholder="e.g. Food & Dining"
            placeholderTextColor={colors.textMuted}
          />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.label}>Monthly Spending Limit (₹)</Text>
          <CurrencyInput
            style={styles.input}
            value={budget}
            onChangeValue={(value) => {
              touch();
              setBudget(value);
            }}
            placeholder="5,000"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.hint}>
            Set a monthly cap to track how much you spend in this category.
          </Text>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.label}>Linked Account</Text>
          <Text style={styles.hint}>
            Optionally tie this category to a specific account.
          </Text>
          <View style={styles.accountGrid}>
            <Pressable
              style={[
                styles.accountOption,
                accountId === null && styles.accountOptionSelected,
              ]}
              onPress={() => {
                touch();
                setAccountId(null);
              }}
            >
              <Ionicons
                name="apps-outline"
                size={18}
                color={accountId === null ? colors.primaryDark : colors.textSecondary}
              />
              <Text
                style={[
                  styles.accountOptionText,
                  accountId === null && styles.accountOptionTextSelected,
                ]}
              >
                Any Account
              </Text>
            </Pressable>
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
        </Card>

        <Card style={styles.section}>
          <Text style={styles.label}>Icon</Text>
          <View style={styles.iconGrid}>
            {CATEGORY_ICONS.map((item) => {
              const selected = icon === item;
              return (
                <Pressable
                  key={item}
                  style={[
                    styles.iconOption,
                    selected && { borderColor: color, backgroundColor: `${color}15` },
                  ]}
                  onPress={() => {
                    touch();
                    setIcon(item);
                  }}
                >
                  <Text style={styles.iconEmoji}>{item}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorGrid}>
            {CATEGORY_COLORS.map((item) => {
              const selected = color === item;
              return (
                <Pressable
                  key={item}
                  style={[
                    styles.colorOption,
                    { backgroundColor: item },
                    selected && styles.colorOptionSelected,
                  ]}
                  onPress={() => {
                    touch();
                    setColor(item);
                  }}
                >
                  {selected && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : isEditing ? 'Update Spending Limit' : 'Add Spending Limit'}
          </Text>
        </Pressable>

        {isEditing && (
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={styles.deleteButtonText}>Delete Spending Limit</Text>
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
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  accountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
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
  accountEmoji: {
    fontSize: 16,
  },
  accountOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    flexShrink: 1,
  },
  accountOptionTextSelected: {
    color: colors.primaryDark,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  iconEmoji: {
    fontSize: 22,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: colors.text,
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
