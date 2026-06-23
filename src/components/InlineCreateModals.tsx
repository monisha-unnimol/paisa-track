import { StyleSheet, Text, TextInput } from 'react-native';
import { CenteredFormModal } from './CenteredFormModal';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

type CreateInvestmentTypeModalProps = {
  visible: boolean;
  name: string;
  onChangeName: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitting?: boolean;
};

export function CreateInvestmentTypeModal({
  visible,
  name,
  onChangeName,
  onCancel,
  onSubmit,
  submitting = false,
}: CreateInvestmentTypeModalProps) {
  return (
    <CenteredFormModal
      visible={visible}
      title="Create Investment Type"
      onCancel={onCancel}
      onSubmit={onSubmit}
      submitting={submitting}
    >
      <Text style={styles.fieldLabel}>Investment Type Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={onChangeName}
        placeholder="e.g. ETF, Bonds, Real Estate"
        placeholderTextColor={colors.textMuted}
      />
    </CenteredFormModal>
  );
}

type CreateExpenseCategoryModalProps = {
  visible: boolean;
  name: string;
  onChangeName: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitting?: boolean;
};

export function CreateExpenseCategoryModal({
  visible,
  name,
  onChangeName,
  onCancel,
  onSubmit,
  submitting = false,
}: CreateExpenseCategoryModalProps) {
  return (
    <CenteredFormModal
      visible={visible}
      title="Create Expense Category"
      onCancel={onCancel}
      onSubmit={onSubmit}
      submitting={submitting}
    >
      <Text style={styles.fieldLabel}>Category Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={onChangeName}
        placeholder="e.g. Pet Care, Childcare"
        placeholderTextColor={colors.textMuted}
      />
    </CenteredFormModal>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
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
