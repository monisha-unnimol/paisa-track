import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { TransactionType } from '../database/types';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { TransactionTypeSelector } from './TransactionTypeSelector';

type AddTransactionFabProps = {
  onSelectType: (type: TransactionType) => void;
};

export function AddTransactionFab({ onSelectType }: AddTransactionFabProps) {
  const [selectorVisible, setSelectorVisible] = useState(false);

  const handleSelect = (type: TransactionType) => {
    setSelectorVisible(false);
    onSelectType(type);
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => setSelectorVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Add Transaction Button"
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      <TransactionTypeSelector
        visible={selectorVisible}
        onClose={() => setSelectorVisible(false)}
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
