import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CategoryCard } from '../../components/CategoryCard';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { Card } from '../../components/Card';
import { DELETE_DIALOG_COPY, ERROR_COPY, SUCCESS_COPY } from '../../constants/dialogCopy';
import { ScreenContainer } from '../../components/ScreenContainer';
import { CategoryDeleteBlockedError } from '../../database';
import { CategoriesStackParamList } from '../../navigation/CategoriesStackNavigator';
import { useAccountStore } from '../../store/useAccountStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useModalStore } from '../../store/useModalStore';
import { navigateToOperationSuccess } from '../../navigation/operationSuccess';
import { formatCurrency } from '../../utils/currency';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<CategoriesStackParamList, 'CategoriesList'>;

export function CategoriesScreen({ navigation }: Props) {
  const {
    categories,
    loading,
    filters,
    setSearchQuery,
    setAccountFilter,
    loadCategories,
    removeCategory,
    getTotalBudget,
    getTotalSpent,
  } = useCategoryStore();

  const { accounts, loadAccounts } = useAccountStore();
  const showError = useModalStore((state) => state.showError);
  const [searchText, setSearchText] = useState(filters.searchQuery);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(
    null,
  );

  useFocusEffect(
    useCallback(() => {
      loadAccounts();
      loadCategories();
    }, [loadAccounts, loadCategories]),
  );

  useEffect(() => {
    setSearchText(filters.searchQuery);
  }, [filters.searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchText);
      loadCategories();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText, setSearchQuery, loadCategories]);

  const handleAccountFilter = (accountId: string | null) => {
    setAccountFilter(accountId);
    loadCategories();
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await removeCategory(deleteTarget.id);
      setDeleteTarget(null);
      navigateToOperationSuccess(navigation, {
        title: SUCCESS_COPY.categoryDeleted.title,
        message: SUCCESS_COPY.categoryDeleted.message,
        listRoute: 'CategoriesList',
      });
    } catch (error) {
      setDeleteTarget(null);
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

  const totalBudget = getTotalBudget();
  const totalSpent = getTotalSpent();
  const budgetUsedPercent =
    totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  return (
    <>
      <ConfirmationModal
        visible={deleteTarget !== null}
        title={DELETE_DIALOG_COPY.category.title}
        message={deleteTarget ? DELETE_DIALOG_COPY.category.message(deleteTarget.name) : ''}
        confirmLabel={DELETE_DIALOG_COPY.category.confirmLabel}
        cancelLabel={DELETE_DIALOG_COPY.category.cancelLabel}
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    <View style={styles.wrapper}>
      <ScreenContainer scrollable={categories.length > 0}>
        <View style={styles.header}>
          <Text style={styles.title}>Spending Limits</Text>
          <Text style={styles.subtitle}>Set monthly caps for everyday expense categories</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search categories..."
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText('')} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <Pressable
            style={[
              styles.filterChip,
              filters.accountId === null && styles.filterChipActive,
            ]}
            onPress={() => handleAccountFilter(null)}
          >
            <Text
              style={[
                styles.filterChipText,
                filters.accountId === null && styles.filterChipTextActive,
              ]}
            >
              All Accounts
            </Text>
          </Pressable>
          {accounts.map((account) => (
            <Pressable
              key={account.id}
              style={[
                styles.filterChip,
                filters.accountId === account.id && styles.filterChipActive,
              ]}
              onPress={() => handleAccountFilter(account.id)}
            >
              <Text style={styles.filterEmoji}>{account.icon}</Text>
              <Text
                style={[
                  styles.filterChipText,
                  filters.accountId === account.id && styles.filterChipTextActive,
                ]}
              >
                {account.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Card variant="primary" style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Monthly Spending Overview</Text>
          <Text style={styles.summaryAmount}>
            {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${budgetUsedPercent}%` }]}
            />
          </View>
          <Text style={styles.summaryHint}>
            {budgetUsedPercent.toFixed(0)}% of limits used
          </Text>
        </Card>

        {loading && categories.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : categories.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📂</Text>
            <Text style={styles.emptyTitle}>
              {searchText || filters.accountId ? 'No Results Found' : 'No Spending Limits Yet'}
            </Text>
            <Text style={styles.emptyText}>
              {searchText || filters.accountId
                ? "We couldn't find anything matching your filters."
                : 'Add your first spending limit to track monthly expense caps.'}
            </Text>
          </Card>
        ) : (
          <View style={styles.list}>
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onPress={() =>
                  navigation.navigate('CategoryForm', { categoryId: category.id })
                }
                onDelete={() => handleDelete(category.id, category.name)}
              />
            ))}
          </View>
        )}
      </ScreenContainer>

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => navigation.navigate('CategoryForm', {})}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  header: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
  },
  filterRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterEmoji: {
    fontSize: 14,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.primaryDark,
  },
  summaryCard: {
    padding: spacing.lg,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.xs,
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing.md,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.full,
  },
  summaryHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  loader: {
    marginTop: spacing.xl,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  list: {
    gap: spacing.md,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
});
