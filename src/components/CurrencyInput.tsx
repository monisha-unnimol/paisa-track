import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import {
  applyCurrencyEdit,
  formatIndianNumberInput,
  sanitizeCurrencyInput,
} from '../utils/currency';

type CurrencyInputProps = Omit<TextInputProps, 'value' | 'onChangeText' | 'keyboardType'> & {
  value: string;
  onChangeValue: (rawValue: string) => void;
};

export function CurrencyInput({
  value,
  onChangeValue,
  style,
  onFocus,
  onBlur,
  onSelectionChange,
  ...rest
}: CurrencyInputProps) {
  const inputRef = useRef<TextInput>(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const isFocusedRef = useRef(false);
  const skipPropSyncRef = useRef(false);
  const displayTextRef = useRef(formatIndianNumberInput(value));

  const [displayText, setDisplayText] = useState(() => formatIndianNumberInput(value));

  displayTextRef.current = displayText;

  useEffect(() => {
    if (skipPropSyncRef.current) {
      skipPropSyncRef.current = false;
      return;
    }

    if (!isFocusedRef.current) {
      const formatted = formatIndianNumberInput(value);
      setDisplayText(formatted);
      displayTextRef.current = formatted;
    }
  }, [value]);

  const applyCursor = useCallback((position: number) => {
    requestAnimationFrame(() => {
      inputRef.current?.setNativeProps({
        selection: { start: position, end: position },
      });
      selectionRef.current = { start: position, end: position };
    });
  }, []);

  const handleChangeText = useCallback(
    (incomingText: string) => {
      const { start, end } = selectionRef.current;
      const previousFormatted = displayTextRef.current;
      const previousRaw = sanitizeCurrencyInput(previousFormatted);

      const result = applyCurrencyEdit(
        previousFormatted,
        previousRaw,
        incomingText,
        start,
        end,
      );

      skipPropSyncRef.current = true;
      setDisplayText(result.formatted);
      displayTextRef.current = result.formatted;
      onChangeValue(result.raw);
      applyCursor(result.cursor);
    },
    [applyCursor, onChangeValue],
  );

  return (
    <TextInput
      {...rest}
      ref={inputRef}
      style={[styles.input, style]}
      value={displayText}
      onChangeText={handleChangeText}
      onSelectionChange={(event) => {
        selectionRef.current = event.nativeEvent.selection;
        onSelectionChange?.(event);
      }}
      onFocus={(event) => {
        isFocusedRef.current = true;
        onFocus?.(event);
      }}
      onBlur={(event) => {
        isFocusedRef.current = false;
        const formatted = formatIndianNumberInput(value);
        setDisplayText(formatted);
        displayTextRef.current = formatted;
        onBlur?.(event);
      }}
      keyboardType="decimal-pad"
      placeholderTextColor={rest.placeholderTextColor ?? colors.textMuted}
    />
  );
}

const styles = StyleSheet.create({
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
});
