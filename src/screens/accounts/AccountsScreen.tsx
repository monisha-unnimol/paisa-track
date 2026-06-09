import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AccountCard } from '../../components/AccountCard';
import { AccountDeleteDialogs } from '../../components/accounts/AccountDeleteDialogs';
import { BalanceText } from '../../components/BalanceText';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { Card } from '../../components/Card';
import { PrivacyToggle } from '../../components/PrivacyToggle';
import { ERROR_COPY, SUCCESS_COPY } from '../../constants/dialogCopy';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAccountDeleteFlow } from '../../hooks/useAccountDeleteFlow';
import { AccountsStackParamList } from '../../navigation/AccountsStackNavigator';
import { useAccountStore } from '../../store/useAccountStore';
import { useModalStore } from '../../store/useModalStore';
import { useOpenAccountDetails } from '../../hooks/useOpenAccountDetails';
import { navigateToOperationSuccess } from '../../navigation/operationSuccess';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<AccountsStackParamList, 'AccountsList'>;

export function AccountsScreen({ navigation }: Props) {
  const { accounts, loading, loadAccounts, getTotalBalance } = useAccountStore();
  const showError = useModalStore((state) => state.showError);
  const deleteFlow = useAccountDeleteFlow({
    onDeleted: () =>
      navigateToOperationSuccess(navigation, {
        title: SUCCESS_COPY.accountDeleted.title,
        message: SUCCESS_COPY.accountDeleted.message,
        listRoute: 'AccountsList',
      }),
    onDeleteBlocked: () =>
      showError(
        ERROR_COPY.accountDeleteBlocked.title,
        ERROR_COPY.accountDeleteBlocked.message,
      ),
  });

  useFocusEffect(
    useCallback(() => {
      loadAccounts();
    }, [loadAccounts]),
  );

  const handleDelete = (id: string, name: string) => {
    deleteFlow.requestDelete(id, name);
  };

  const totalBalance = getTotalBalance();
  const { openAccountDetails, pinModal } = useOpenAccountDetails(navigation);

  return (
    <>
      {pinModal}
      <AccountDeleteDialogs flow={deleteFlow} />
    <View style={styles.wrapper}>
      <ScreenContainer scrollable={accounts.length > 0}>
        <View style={styles.header}>
          <Text style={styles.title}>Accounts</Text>
          <Text style={styles.subtitle}>Manage your wallets & banks</Text>
        </View>

        <Card variant="primary" style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryLabel}>Total Balance</Text>
            <PrivacyToggle variant="light" />
          </View>
          <BalanceText amount={totalBalance} style={styles.summaryAmount} />
          <Text style={styles.summaryHint}>
            {accounts.length} account{accounts.length !== 1 ? 's' : ''}
          </Text>
        </Card>

        {loading && accounts.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : accounts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🏦</Text>
            <Text style={styles.emptyTitle}>No accounts yet</Text>
            <Text style={styles.emptyText}>
              Add your first account to start tracking balances.
            </Text>
          </Card>
        ) : (
          <View style={styles.list}>
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onPress={() => openAccountDetails(account.id)}
                onDelete={() => handleDelete(account.id, account.name)}
              />
            ))}
          </View>
        )}
      </ScreenContainer>

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => navigation.navigate('AccountForm', {})}
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
  summaryCard: {
    padding: spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: spacing.xs,
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
