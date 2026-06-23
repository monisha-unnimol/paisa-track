import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Account } from '../../database/types';
import { ACCOUNT_TYPE_LABELS } from '../../constants/accountOptions';
import { colors } from '../../theme/colors';
import { formStyles } from '../../theme/formStyles';
import { radius, spacing } from '../../theme/spacing';

type ChooseDefaultAccountModalProps = {
  visible: boolean;
  accounts: Account[];
  excludeAccountId: string;
  title?: string;
  message?: string;
  onSelect: (accountId: string) => void;
  onCancel: () => void;
};

export function ChooseDefaultAccountModal({
  visible,
  accounts,
  excludeAccountId,
  title = 'Choose Default Account',
  message = 'Select which account should become your default.',
  onSelect,
  onCancel,
}: ChooseDefaultAccountModalProps) {
  const options = accounts.filter((account) => account.id !== excludeAccountId);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.sheet}>
          <Text style={formStyles.screenTitle}>{title}</Text>
          <Text style={[formStyles.screenSubtitle, styles.subtitle]}>{message}</Text>

          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {options.map((account) => (
              <Pressable
                key={account.id}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                onPress={() => onSelect(account.id)}
              >
                <Text style={styles.optionIcon}>{account.icon}</Text>
                <View style={styles.optionInfo}>
                  <Text style={formStyles.label}>{account.name}</Text>
                  <Text style={formStyles.hint}>{ACCOUNT_TYPE_LABELS[account.type]}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '80%',
  },
  subtitle: {
    marginBottom: spacing.xs,
  },
  list: {
    maxHeight: 320,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  optionPressed: {
    opacity: 0.92,
  },
  optionIcon: {
    fontSize: 22,
  },
  optionInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
