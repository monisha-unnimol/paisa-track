import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TransactionType } from '../database/types';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { Card } from './Card';

type TransactionTypeSelectorProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: TransactionType) => void;
};

type TransactionOption = {
  type: TransactionType;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
  backgroundColor: string;
  accessibilityLabel: string;
};

const OPTIONS: TransactionOption[] = [
  {
    type: 'income',
    title: 'Income',
    description: 'Salary, refunds, interest, and other money received',
    icon: 'arrow-down-circle-outline',
    accentColor: colors.income,
    backgroundColor: `${colors.income}15`,
    accessibilityLabel: 'Add Income',
  },
  {
    type: 'expense',
    title: 'Expense',
    description: 'Purchases, bills, transfers, and everyday spending',
    icon: 'arrow-up-circle-outline',
    accentColor: colors.expense,
    backgroundColor: `${colors.expense}15`,
    accessibilityLabel: 'Add Expense',
  },
];

export function TransactionTypeSelector({
  visible,
  onClose,
  onSelect,
}: TransactionTypeSelectorProps) {
  const insets = useSafeAreaInsets();
  const backdrop = useRef(new Animated.Value(0)).current;
  const sheet = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(sheet, {
          toValue: 1,
          damping: 18,
          stiffness: 220,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(sheet, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, backdrop, sheet]);

  const handleSelect = (type: TransactionType) => {
    onClose();
    onSelect(type);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdrop.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.45],
              }),
            },
          ]}
          pointerEvents="none"
        />

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, spacing.md),
              transform: [
                {
                  translateY: sheet.interpolate({
                    inputRange: [0, 1],
                    outputRange: [320, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.handle} />

          <Text style={styles.title}>Add Transaction</Text>
          <Text style={styles.subtitle}>Choose what you want to record</Text>

          {OPTIONS.map((option) => (
            <Pressable
              key={option.type}
              style={({ pressed }) => [styles.optionCard, pressed && styles.optionPressed]}
              onPress={() => handleSelect(option.type)}
              accessibilityRole="button"
              accessibilityLabel={option.accessibilityLabel}
            >
              <Card style={styles.optionInner}>
                <View style={[styles.iconWrap, { backgroundColor: option.backgroundColor }]}>
                  <Ionicons name={option.icon} size={28} color={option.accentColor} />
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionText}>{option.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </Card>
            </Pressable>
          ))}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  optionCard: {
    marginBottom: spacing.xs,
  },
  optionPressed: {
    opacity: 0.96,
  },
  optionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  optionText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
