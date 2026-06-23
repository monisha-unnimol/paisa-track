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
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { Card } from './Card';

export type ActionSheetOption<T extends string> = {
  value: T;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
  backgroundColor: string;
  accessibilityLabel: string;
};

type ActionSheetSelectorProps<T extends string> = {
  visible: boolean;
  title: string;
  subtitle: string;
  options: ActionSheetOption<T>[];
  onClose: () => void;
  onSelect: (value: T) => void;
};

export function ActionSheetSelector<T extends string>({
  visible,
  title,
  subtitle,
  options,
  onClose,
  onSelect,
}: ActionSheetSelectorProps<T>) {
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

  const handleSelect = (value: T) => {
    onClose();
    onSelect(value);
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

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {options.map((option) => (
            <Pressable
              key={option.value}
              style={({ pressed }) => [styles.optionCard, pressed && styles.optionPressed]}
              onPress={() => handleSelect(option.value)}
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
