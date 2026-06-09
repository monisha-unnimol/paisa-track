import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PinLength } from '../services/security/pinService';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

type PinEntryProps = {
  length: PinLength;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  focusKey?: number | string;
  onComplete?: (pin: string) => void;
  testID?: string;
  compact?: boolean;
};

export function PinEntry({
  length,
  value,
  onChange,
  autoFocus = true,
  focusKey,
  onComplete,
  testID,
  compact = false,
}: PinEntryProps) {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const scales = useRef(Array.from({ length }, () => new Animated.Value(1))).current;
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const boxSize = compact ? (length >= 6 ? 38 : 42) : length >= 6 ? 44 : 48;
  const boxGap = compact ? spacing.xs : length >= 6 ? spacing.xs + 2 : spacing.sm;

  const digits = Array.from({ length }, (_, index) => value[index] ?? '');

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  useEffect(() => {
    if (!autoFocus) return;

    const timer = setTimeout(() => {
      const firstEmpty = digits.findIndex((digit) => !digit);
      const targetIndex = firstEmpty === -1 ? length - 1 : firstEmpty;
      inputRefs.current[targetIndex]?.focus();
    }, 300);

    return () => clearTimeout(timer);
  }, [autoFocus, focusKey, length]);

  const animateBox = (index: number) => {
    Animated.sequence([
      Animated.spring(scales[index], {
        toValue: 1.08,
        damping: 12,
        stiffness: 260,
        useNativeDriver: true,
      }),
      Animated.spring(scales[index], {
        toValue: 1,
        damping: 14,
        stiffness: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const updateValue = (next: string) => {
    const cleaned = next.replace(/\D/g, '').slice(0, length);
    onChange(cleaned);
    if (cleaned.length === length) {
      onComplete?.(cleaned);
    }
  };

  const handleChange = (text: string, index: number) => {
    const cleaned = text.replace(/\D/g, '');

    if (cleaned.length > 1) {
      const pasted = `${value.slice(0, index)}${cleaned}`.slice(0, length);
      updateValue(pasted);
      const focusIndex = Math.min(pasted.length, length - 1);
      setTimeout(() => inputRefs.current[focusIndex]?.focus(), 0);
      if (pasted.length > index) {
        animateBox(Math.min(index + cleaned.length - 1, length - 1));
      }
      return;
    }

    const digit = cleaned.slice(-1);

    if (!digit) {
      const chars = digits.slice();
      chars[index] = '';
      updateValue(chars.join(''));
      return;
    }

    animateBox(index);
    const chars = digits.slice();
    chars[index] = digit;
    updateValue(chars.join(''));

    if (index < length - 1) {
      setTimeout(() => inputRefs.current[index + 1]?.focus(), 0);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key !== 'Backspace') return;

    if (digits[index]) {
      const chars = digits.slice();
      chars[index] = '';
      updateValue(chars.join(''));
      return;
    }

    if (index > 0) {
      const chars = digits.slice();
      chars[index - 1] = '';
      updateValue(chars.join(''));
      setTimeout(() => inputRefs.current[index - 1]?.focus(), 0);
    }
  };

  const handleBoxPress = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  return (
    <View style={styles.wrapper} accessibilityRole="none">
      <View style={[styles.boxRow, { gap: boxGap }]}>
        {digits.map((digit, index) => {
          const filled = digit.length > 0;
          const focused = focusedIndex === index;

          return (
            <Pressable
              key={`${length}-${index}`}
              onPress={() => handleBoxPress(index)}
              accessibilityRole="button"
              accessibilityLabel={`PIN digit ${index + 1} of ${length}`}
              accessibilityHint="Enter one numeric digit"
            >
              <Animated.View
                style={[
                  styles.box,
                  { width: boxSize, height: boxSize },
                  filled && styles.boxFilled,
                  focused && styles.boxFocused,
                  { transform: [{ scale: scales[index] }] },
                ]}
              >
                <Text
                  style={[
                    styles.boxDigit,
                    compact && styles.boxDigitCompact,
                    filled ? styles.boxDigitFilled : styles.boxDigitEmpty,
                  ]}
                >
                  {filled ? '●' : '□'}
                </Text>
                <TextInput
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  value={digit}
                  onChangeText={(text) => handleChange(text, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  onFocus={() => {
                    setFocusedIndex(index);
                    animateBox(index);
                  }}
                  onBlur={() => {
                    setFocusedIndex((current) => (current === index ? null : current));
                  }}
                  keyboardType="number-pad"
                  maxLength={length}
                  secureTextEntry={false}
                  editable
                  selectTextOnFocus
                  caretHidden
                  textContentType="oneTimeCode"
                  importantForAutofill="yes"
                  autoComplete="sms-otp"
                  style={styles.boxInput}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  testID={testID ? `${testID}-${index}` : undefined}
                />
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type PinLengthSelectorProps = {
  value: PinLength;
  onChange: (length: PinLength) => void;
};

export function PinLengthSelector({ value, onChange }: PinLengthSelectorProps) {
  return (
    <View style={selectorStyles.wrapper}>
      <Text style={selectorStyles.title}>Choose Security PIN</Text>
      {([4, 6] as PinLength[]).map((option) => {
        const selected = value === option;
        return (
          <Pressable
            key={option}
            style={[selectorStyles.option, selected && selectorStyles.optionSelected]}
            onPress={() => onChange(option)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <View style={[selectorStyles.radio, selected && selectorStyles.radioSelected]}>
              {selected && <View style={selectorStyles.radioDot} />}
            </View>
            <Text style={[selectorStyles.optionText, selected && selectorStyles.optionTextSelected]}>
              {option} Digits
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type PinMatchIndicatorProps = {
  pin: string;
  confirmPin: string;
  length: PinLength;
};

export function PinMatchIndicator({ pin, confirmPin, length }: PinMatchIndicatorProps) {
  if (pin.length < length || confirmPin.length < length) {
    return null;
  }

  const matches = pin === confirmPin;

  return (
    <View style={matchStyles.row}>
      <Ionicons
        name={matches ? 'checkmark-circle' : 'close-circle'}
        size={18}
        color={matches ? colors.success : colors.danger}
      />
      <Text style={[matchStyles.text, matches ? matchStyles.match : matchStyles.mismatch]}>
        {matches ? 'PINs Match' : 'PINs Do Not Match'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
  boxRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  box: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.surface,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  boxFilled: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primaryLight}80`,
  },
  boxDigit: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 24,
  },
  boxDigitCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  boxDigitEmpty: {
    color: colors.textMuted,
    fontSize: 14,
  },
  boxDigitFilled: {
    color: colors.primaryDark,
    fontSize: 14,
  },
  boxInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.015,
    fontSize: 16,
    textAlign: 'center',
    color: colors.text,
  },
});

const selectorStyles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  optionTextSelected: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
});

const matchStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
  },
  match: {
    color: colors.success,
  },
  mismatch: {
    color: colors.danger,
  },
});
