import { Account } from '../database/types';

const BANK_KEYWORDS = [
  'hdfc',
  'icici',
  'sbi',
  'axis',
  'kotak',
  'idbi',
  'pnb',
  'bob',
  'canara',
  'yes bank',
  'indusind',
  'federal',
  'union bank',
  'paytm',
  'phonepe',
  'gpay',
  'google pay',
];

function getLastFourFromName(name: string): string | null {
  const maskedMatch = name.match(/(?:\*+|X+|x+|XX)+(\d{4})\b/i);
  if (maskedMatch?.[1]) return maskedMatch[1];

  const trailingMatch = name.match(/\b(\d{4})\b(?!.*\b\d{4}\b)/);
  return trailingMatch?.[1] ?? null;
}

function extractLastFourDigits(text: string): string[] {
  const matches = text.match(/\b(\d{4})\b/g) ?? [];
  return [...new Set(matches)];
}

function scoreAccountMatch(
  account: Account,
  accountHint: string | null,
  rawBody: string,
  sender: string,
): number {
  let score = 0;
  const nameLower = account.name.toLowerCase();
  const bodyLower = rawBody.toLowerCase();
  const senderLower = sender.toLowerCase();
  const lastFour = getLastFourFromName(account.name);

  if (accountHint) {
    if (lastFour === accountHint) score += 100;
    if (nameLower.includes(accountHint)) score += 80;
    if (bodyLower.includes(accountHint)) score += 50;
  }

  for (const digits of extractLastFourDigits(rawBody)) {
    if (lastFour === digits) score += 70;
    if (nameLower.includes(digits)) score += 40;
  }

  for (const bank of BANK_KEYWORDS) {
    const inSms = senderLower.includes(bank) || bodyLower.includes(bank);
    if (inSms && nameLower.includes(bank)) {
      score += 45;
    }
  }

  if (bodyLower.includes('credit card') && account.type === 'credit') score += 35;
  if (bodyLower.includes('savings') && nameLower.includes('saving')) score += 25;
  if (bodyLower.includes('current') && nameLower.includes('current')) score += 25;
  if (bodyLower.includes('wallet') && account.type === 'wallet') score += 25;
  if (bodyLower.includes('cash') && account.type === 'cash') score += 20;

  if (account.isDefault) score += 5;

  return score;
}

export function matchAccountFromSms(
  accounts: Account[],
  options: {
    accountHint: string | null;
    rawBody: string;
    sender: string;
  },
): Account | null {
  if (accounts.length === 0) return null;

  const ranked = accounts
    .map((account) => ({
      account,
      score: scoreAccountMatch(
        account,
        options.accountHint,
        options.rawBody,
        options.sender,
      ),
    }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < 40) return null;

  const tied = ranked.filter((entry) => entry.score === best.score);
  if (tied.length === 1) return best.account;

  return tied.find((entry) => entry.account.isDefault)?.account ?? best.account;
}
