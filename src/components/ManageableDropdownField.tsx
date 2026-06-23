import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

export type ManageableDropdownItem = {
  id: string;
  value: string;
  label: string;
  icon: string;
  color: string;
  deletable?: boolean;
};

type ManageableDropdownFieldProps = {
  placeholder: string;
  selectedValue: string | null;
  items: ManageableDropdownItem[];
  onSelect: (value: string) => void;
  onDelete: (item: ManageableDropdownItem) => void;
  onCreate: () => void;
  createLabel: string;
  emptyMessage: string;
  onOpen?: () => void;
  style?: ViewStyle;
};

export function ManageableDropdownField({
  placeholder,
  selectedValue,
  items,
  onSelect,
  onDelete,
  onCreate,
  createLabel,
  emptyMessage,
  onOpen,
  style,
}: ManageableDropdownFieldProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const backdrop = useRef(new Animated.Value(0)).current;
  const sheet = useRef(new Animated.Value(0)).current;

  const selectedItem = items.find((item) => item.value === selectedValue) ?? null;

  useEffect(() => {
    if (!open) return;

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
  }, [open, backdrop, sheet]);

  const close = () => {
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
    ]).start(() => setOpen(false));
  };

  const handleOpen = () => {
    onOpen?.();
    setOpen(true);
  };

  const handleSelect = (value: string) => {
    onSelect(value);
    close();
  };

  const handleCreate = () => {
    close();
    onCreate();
  };

  return (
    <>
      <Pressable
        style={[styles.trigger, style]}
        onPress={handleOpen}
        accessibilityRole="button"
        accessibilityLabel={selectedItem?.label ?? placeholder}
      >
        <View style={styles.triggerContent}>
          {selectedItem ? (
            <>
              <Text style={styles.triggerIcon}>{selectedItem.icon}</Text>
              <Text style={styles.triggerText} numberOfLines={1}>
                {selectedItem.label}
              </Text>
            </>
          ) : (
            <Text style={styles.placeholderText}>{placeholder}</Text>
          )}
        </View>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

      <Modal
        transparent
        visible={open}
        animationType="none"
        onRequestClose={close}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close" />
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
                maxHeight: '72%',
                transform: [
                  {
                    translateY: sheet.interpolate({
                      inputRange: [0, 1],
                      outputRange: [420, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.handle} />

            {items.length === 0 ? (
              <Text style={styles.emptyText}>{emptyMessage}</Text>
            ) : (
              <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                style={styles.list}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const selected = item.value === selectedValue;
                  const showDelete = item.deletable !== false;

                  return (
                    <View style={[styles.row, selected && styles.rowSelected]}>
                      <Pressable
                        style={styles.rowSelect}
                        onPress={() => handleSelect(item.value)}
                        accessibilityRole="button"
                        accessibilityLabel={item.label}
                      >
                        <Text style={styles.rowIcon}>{item.icon}</Text>
                        <Text
                          style={[styles.rowLabel, selected && styles.rowLabelSelected]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                        {selected ? (
                          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        ) : null}
                      </Pressable>
                      {showDelete ? (
                        <Pressable
                          style={({ pressed }) => [
                            styles.deleteButton,
                            pressed && styles.deletePressed,
                          ]}
                          onPress={() => onDelete(item)}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={`Delete ${item.label}`}
                        >
                          <Ionicons name="trash-outline" size={18} color={colors.danger} />
                        </Pressable>
                      ) : null}
                    </View>
                  );
                }}
              />
            )}

            <Pressable style={styles.createButton} onPress={handleCreate}>
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.createButtonText}>{createLabel}</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  triggerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  triggerIcon: {
    fontSize: 18,
  },
  triggerText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 16,
    color: colors.textMuted,
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
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    marginBottom: spacing.xs,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  rowSelect: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minWidth: 0,
  },
  rowIcon: {
    fontSize: 18,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  rowLabelSelected: {
    color: colors.primaryDark,
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: `${colors.danger}10`,
  },
  deletePressed: {
    opacity: 0.85,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 20,
  },
});
