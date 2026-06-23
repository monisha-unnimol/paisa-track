import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { ActionSheetOption, ActionSheetSelector } from './ActionSheetSelector';

export type RecurringItemType = 'investment' | 'expense';

type AddRecurringFabProps = {
  onSelectType: (type: RecurringItemType) => void;
  selectorVisible: boolean;
  onSelectorVisibleChange: (visible: boolean) => void;
  onFabPress: () => void;
};

const OPTIONS: ActionSheetOption<RecurringItemType>[] = [
  {
    value: 'investment',
    title: 'Investment',
    description: 'Track recurring investments like SIPs, PPF, stocks, etc.',
    icon: 'trending-up-outline',
    accentColor: colors.income,
    backgroundColor: `${colors.income}15`,
    accessibilityLabel: 'Add Investment',
  },
  {
    value: 'expense',
    title: 'Recurring Expense',
    description: 'Track recurring expenses like rent, EMI, subscriptions, etc.',
    icon: 'home-outline',
    accentColor: colors.warning,
    backgroundColor: `${colors.warning}15`,
    accessibilityLabel: 'Add Recurring Expense',
  },
];

export function AddRecurringFab({
  onSelectType,
  selectorVisible,
  onSelectorVisibleChange,
  onFabPress,
}: AddRecurringFabProps) {
  const handleSelect = (type: RecurringItemType) => {
    onSelectorVisibleChange(false);
    onSelectType(type);
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={onFabPress}
        accessibilityRole="button"
        accessibilityLabel="Add Recurring Item"
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      <ActionSheetSelector
        visible={selectorVisible}
        title="Add Recurring Item"
        subtitle="Choose what you want to schedule"
        options={OPTIONS}
        onClose={() => onSelectorVisibleChange(false)}
        onSelect={handleSelect}
      />
    </>
  );
}

const styles = StyleSheet.create({
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
