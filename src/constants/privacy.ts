export const MASKED_BALANCE = '₹••••••';

export function maskedBalanceWithSign(sign: 'positive' | 'negative' | 'none'): string {
  if (sign === 'positive') return `+${MASKED_BALANCE}`;
  if (sign === 'negative') return `-${MASKED_BALANCE}`;
  return MASKED_BALANCE;
}
