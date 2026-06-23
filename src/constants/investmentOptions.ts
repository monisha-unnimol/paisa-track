import { BuiltinInvestmentType, InvestmentType, InvestmentTypeDefinition } from '../database/types';

export type InvestmentTypeDisplay = {
  label: string;
  icon: string;
  color: string;
};

export const INVESTMENT_TYPES: InvestmentType[] = [
  'sip',
  'mutual_fund',
  'stocks',
  'ppf',
  'epf',
  'nps',
  'fixed_deposit',
  'recurring_deposit',
  'gold',
  'crypto',
  'custom',
];

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  sip: 'SIP',
  mutual_fund: 'Mutual Fund',
  stocks: 'Stocks',
  ppf: 'PPF',
  epf: 'EPF',
  nps: 'NPS',
  fixed_deposit: 'Fixed Deposit',
  recurring_deposit: 'Recurring Deposit',
  gold: 'Gold',
  crypto: 'Crypto',
  custom: 'Custom',
};

export const INVESTMENT_TYPE_ICONS: Record<InvestmentType, string> = {
  sip: '📊',
  mutual_fund: '📈',
  stocks: '💹',
  ppf: '🏛️',
  epf: '👔',
  nps: '🎯',
  fixed_deposit: '🏦',
  recurring_deposit: '🔁',
  gold: '🥇',
  crypto: '₿',
  custom: '💼',
};

export const INVESTMENT_TYPE_COLORS: Record<InvestmentType, string> = {
  sip: '#6366F1',
  mutual_fund: '#0D9488',
  stocks: '#3B82F6',
  ppf: '#8B5CF6',
  epf: '#14B8A6',
  nps: '#F59E0B',
  fixed_deposit: '#64748B',
  recurring_deposit: '#06B6D4',
  gold: '#EAB308',
  crypto: '#F97316',
  custom: '#94A3B8',
};

export const DEDUCTION_DAYS = Array.from({ length: 31 }, (_, index) => index + 1);

export function resolveInvestmentTypeDisplay(
  slug: InvestmentType,
  definitions?: InvestmentTypeDefinition[],
): InvestmentTypeDisplay {
  const fromDb = definitions?.find((item) => item.slug === slug);
  if (fromDb) {
    return {
      label: fromDb.name,
      icon: fromDb.icon,
      color: fromDb.color,
    };
  }

  if (slug in INVESTMENT_TYPE_LABELS) {
    const builtin = slug as BuiltinInvestmentType;
    return {
      label: INVESTMENT_TYPE_LABELS[builtin],
      icon: INVESTMENT_TYPE_ICONS[builtin],
      color: INVESTMENT_TYPE_COLORS[builtin],
    };
  }

  return {
    label: slug.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    icon: INVESTMENT_TYPE_ICONS.custom,
    color: INVESTMENT_TYPE_COLORS.custom,
  };
}
