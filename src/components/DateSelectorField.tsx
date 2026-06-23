import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {
  formatDateLabel,
  isValidDateString,
  parseDateString,
  toDateString,
} from '../utils/dateStrings';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

type DateSelectorFieldProps = {
  value: string | null;
  onChange: (value: string) => void;
  onPress?: () => void;
  placeholder?: string;
  style?: ViewStyle;
};

export function DateSelectorField({
  value,
  onChange,
  onPress,
  placeholder = 'Select date',
  style,
}: DateSelectorFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerDate = isValidDateString(value) ? parseDateString(value) : new Date();

  const handleOpen = () => {
    onPress?.();
    setShowPicker(true);
  };

  const handlePickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'dismissed' || !date) return;
      onChange(toDateString(date));
      return;
    }

    if (event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }

    if (date) {
      onChange(toDateString(date));
      setShowPicker(false);
    }
  };

  return (
    <View>
      <Pressable
        style={[styles.field, style]}
        onPress={handleOpen}
        accessibilityRole="button"
        accessibilityLabel="Select date"
      >
        <Text
          style={[styles.fieldText, !isValidDateString(value) && styles.placeholderText]}
        >
          {isValidDateString(value) ? formatDateLabel(value) : placeholder}
        </Text>
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'default' : 'calendar'}
          onChange={handlePickerChange}
          themeVariant="light"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  fieldText: {
    fontSize: 16,
    color: colors.text,
  },
  placeholderText: {
    color: colors.textMuted,
  },
});
