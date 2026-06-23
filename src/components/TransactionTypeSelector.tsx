import { TransactionType } from '../database/types';
import { colors } from '../theme/colors';
import { ActionSheetOption, ActionSheetSelector } from './ActionSheetSelector';

type TransactionTypeSelectorProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: TransactionType) => void;
};

const OPTIONS: ActionSheetOption<TransactionType>[] = [
  {
    value: 'income',
    title: 'Income',
    description: 'Salary, refunds, interest, and other money received',
    icon: 'arrow-down-circle-outline',
    accentColor: colors.income,
    backgroundColor: `${colors.income}15`,
    accessibilityLabel: 'Add Income',
  },
  {
    value: 'expense',
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
  return (
    <ActionSheetSelector
      visible={visible}
      title="Add Transaction"
      subtitle="Choose what you want to record"
      options={OPTIONS}
      onClose={onClose}
      onSelect={onSelect}
    />
  );
}
