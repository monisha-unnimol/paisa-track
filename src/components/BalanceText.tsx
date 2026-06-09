import { StyleProp, Text, TextStyle } from 'react-native';
import { maskedBalanceWithSign } from '../constants/privacy';
import { usePrivacyStore } from '../store/usePrivacyStore';
import { formatCurrency } from '../utils/currency';

type BalanceTextProps = {
  amount: number;
  style?: StyleProp<TextStyle>;
  sign?: 'positive' | 'negative' | 'none';
};

export function BalanceText({ amount, style, sign = 'none' }: BalanceTextProps) {
  const balanceVisibilityVerified = usePrivacyStore(
    (state) => state.balanceVisibilityVerified,
  );

  if (!balanceVisibilityVerified) {
    return <Text style={style}>{maskedBalanceWithSign(sign)}</Text>;
  }

  const formatted = formatCurrency(amount);
  if (sign === 'positive') {
    return <Text style={style}>+{formatted}</Text>;
  }
  if (sign === 'negative') {
    return <Text style={style}>-{formatted}</Text>;
  }

  return <Text style={style}>{formatted}</Text>;
}
