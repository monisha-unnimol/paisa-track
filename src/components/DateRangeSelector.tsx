import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { formatRangeLabel } from '../utils/statisticsFilters';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

type DateField = 'start' | 'end';

type DateRangeSelectorProps = {
  startDate: string;
  endDate: string;
  active?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onChange: (startDate: string, endDate: string) => void;
};

function parseDateString(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatPickerLabel(value: string): string {
  return parseDateString(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function DateRangeSelector({
  startDate,
  endDate,
  active = false,
  open: controlledOpen,
  onOpenChange,
  onChange,
}: DateRangeSelectorProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeField, setActiveField] = useState<DateField>('start');
  const [draftStart, setDraftStart] = useState(startDate);
  const [draftEnd, setDraftEnd] = useState(endDate);
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);

  const backdrop = useRef(new Animated.Value(0)).current;
  const sheet = useRef(new Animated.Value(0)).current;

  const isOpen = controlledOpen ?? internalOpen;

  const setOpen = (next: boolean) => {
    if (onOpenChange) {
      onOpenChange(next);
    } else {
      setInternalOpen(next);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setDraftStart(startDate);
    setDraftEnd(endDate);
    setActiveField('start');
    setShowAndroidPicker(Platform.OS === 'android');
  }, [isOpen, startDate, endDate]);

  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen, backdrop, sheet]);

  const activeValue = activeField === 'start' ? draftStart : draftEnd;
  const activeDate = parseDateString(activeValue);

  const handlePickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowAndroidPicker(false);
      if (event.type === 'dismissed' || !date) return;
    } else if (!date) {
      return;
    }

    const nextValue = toDateString(date);
    if (activeField === 'start') {
      setDraftStart(nextValue);
      if (nextValue > draftEnd) {
        setDraftEnd(nextValue);
      }
      if (Platform.OS === 'android') {
        setActiveField('end');
        setShowAndroidPicker(true);
      }
      return;
    }

    setDraftEnd(nextValue);
    if (nextValue < draftStart) {
      setDraftStart(nextValue);
    }
  };

  const handleApply = () => {
    const start = draftStart <= draftEnd ? draftStart : draftEnd;
    const end = draftStart <= draftEnd ? draftEnd : draftStart;
    onChange(start, end);
    setOpen(false);
  };

  const openPickerForField = (field: DateField) => {
    setActiveField(field);
    if (Platform.OS === 'android') {
      setShowAndroidPicker(true);
    }
  };

  return (
    <>
      <Pressable
        style={[styles.trigger, active && styles.triggerActive]}
        onPress={() => setOpen(true)}
      >
        <Ionicons
          name="calendar-outline"
          size={16}
          color={active ? colors.primaryDark : colors.primary}
        />
        <Text
          style={[styles.triggerText, active && styles.triggerTextActive]}
          numberOfLines={1}
        >
          {formatRangeLabel(startDate, endDate)}
        </Text>
        <Ionicons
          name="chevron-down"
          size={14}
          color={active ? colors.primaryDark : colors.textSecondary}
        />
      </Pressable>

      <Modal
        transparent
        visible={isOpen}
        animationType="none"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
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
          />
          <Animated.View
            style={[
              styles.sheet,
              {
                opacity: sheet,
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
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Custom Date Range</Text>

            <View style={styles.fieldRow}>
              {(['start', 'end'] as DateField[]).map((field) => {
                const selected = activeField === field;
                const value = field === 'start' ? draftStart : draftEnd;
                return (
                  <Pressable
                    key={field}
                    style={[styles.fieldChip, selected && styles.fieldChipActive]}
                    onPress={() => openPickerForField(field)}
                  >
                    <Text style={styles.fieldChipLabel}>
                      {field === 'start' ? 'From' : 'To'}
                    </Text>
                    <Text
                      style={[
                        styles.fieldChipValue,
                        selected && styles.fieldChipValueActive,
                      ]}
                    >
                      {formatPickerLabel(value)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {Platform.OS === 'ios' && (
              <DateTimePicker
                value={activeDate}
                mode="date"
                display="inline"
                onChange={handlePickerChange}
                themeVariant="light"
                style={styles.iosPicker}
              />
            )}

            <View style={styles.actions}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={() => setOpen(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.applyButton]}
                onPress={handleApply}
              >
                <Text style={styles.applyText}>Apply</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {Platform.OS === 'android' && isOpen && showAndroidPicker && (
        <DateTimePicker
          value={activeDate}
          mode="date"
          display="calendar"
          onChange={handlePickerChange}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: '62%',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  triggerActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  triggerText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  triggerTextActive: {
    color: colors.primaryDark,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  fieldChip: {
    flex: 1,
    padding: spacing.sm + 2,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  fieldChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  fieldChipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fieldChipValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  fieldChipValueActive: {
    color: colors.primaryDark,
  },
  iosPicker: {
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  applyButton: {
    backgroundColor: colors.primary,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  applyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
