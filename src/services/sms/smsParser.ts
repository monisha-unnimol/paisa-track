export type SmsTransactionType = 'debit' | 'credit';

export interface ParsedBankSms {
  type: SmsTransactionType;
  amount: number;
  accountNumber: string | null;
  merchant: string | null;
  rawBody: string;
  sender: string;
}

const DEBIT_KEYWORDS =
  /\b(debited|has been debited|is debited|debit(?! card)|spent|withdrawn|paid|purchase|sent|transferred to|deducted|dr\b|upi[-\s]?dr)\b/i;
const CREDIT_KEYWORDS =
  /\b(credited|has been credited|is credited|received|deposited|refund|salary|incoming|cr\b|upi[-\s]?cr)\b/i;

const AMOUNT_PATTERNS = [
  /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
  /([\d,]+(?:\.\d{1,2})?)\s*(?:Rs\.?|INR|₹)/i,
  /(?:debited|credited|spent|paid|received|withdrawn|deducted)\s*(?:with|for|of|by|from|to)?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
  /\bINR\s*([\d,]+(?:\.\d{1,2})?)/i,
];

const ACCOUNT_PATTERNS = [
  /(?:debited from|debited in|deducted from|withdrawn from|paid from)\s+(?:A\/c|Acct|Account|a\/c)\s*(?:No\.?|no\.?|#)?\s*(?:\*+|X+|x+|XX)*(\d{4})/i,
  /(?:credited to|deposited to|received in|added to)\s+(?:A\/c|Acct|Account|a\/c)\s*(?:No\.?|no\.?|#)?\s*(?:\*+|X+|x+|XX)*(\d{4})/i,
  /(?:A\/c|Acct|Account|a\/c)\s*(?:No\.?|no\.?|#)?\s*(?:\*+|X+|x+|XX)*(\d{4})/i,
  /(?:ending|end)\s*(?:with|in)?\s*(?:\*+|X+|x+|XX)*(\d{4})/i,
  /\*{2,}(\d{4})/,
  /\bXX+(\d{4})\b/i,
  /\bX+(\d{4})\b/i,
];

const MERCHANT_PATTERNS = [
  /\b(?:at|to|from|info|towards|merchant|payee)\s+([A-Za-z0-9][A-Za-z0-9\s&\-\.'*]{1,40}?)(?:\s+on\b|\.\s|\s+Avl|\s+Bal|\s+Ref|\s+upi|\s+UPI|\s+Txn|$)/i,
  /UPI(?:\/|\-|\/CR\/|\/DR\/)([A-Za-z0-9\-\._@]{3,40})/i,
  /(?:VPA|vpa)[\s\-:]+([A-Za-z0-9\-\._@]{3,40})/i,
  /trf(?:er)?\s+to\s+([A-Za-z0-9\s&\-\.'*]{2,40})/i,
  /(?:spent on|paid to)\s+([A-Za-z0-9][A-Za-z0-9\s&\-\.'*]{1,40}?)(?:\s+on\b|\.\s|\s+Avl|\s+Bal|$)/i,
];

function parseAmount(body: string): number | null {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = body.match(pattern);
    if (match?.[1]) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      if (!Number.isNaN(value) && value > 0) {
        return value;
      }
    }
  }
  return null;
}

function parseAccountNumber(body: string): string | null {
  for (const pattern of ACCOUNT_PATTERNS) {
    const match = body.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

function parseMerchant(body: string): string | null {
  for (const pattern of MERCHANT_PATTERNS) {
    const match = body.match(pattern);
    if (match?.[1]) {
      const merchant = match[1].trim().replace(/\s+/g, ' ');
      if (merchant.length >= 2) {
        return merchant;
      }
    }
  }
  return null;
}

function detectType(body: string): SmsTransactionType | null {
  const isDebit = DEBIT_KEYWORDS.test(body);
  const isCredit = CREDIT_KEYWORDS.test(body);

  if (isDebit && !isCredit) return 'debit';
  if (isCredit && !isDebit) return 'credit';
  if (isDebit && isCredit) {
    const debitIndex = body.search(DEBIT_KEYWORDS);
    const creditIndex = body.search(CREDIT_KEYWORDS);
    return debitIndex <= creditIndex ? 'debit' : 'credit';
  }
  return null;
}

export function parseBankSms(sender: string, body: string): ParsedBankSms | null {
  const normalizedBody = body.replace(/\s+/g, ' ').trim();
  const type = detectType(normalizedBody);
  const amount = parseAmount(normalizedBody);

  if (!type || amount == null) {
    return null;
  }

  return {
    type,
    amount,
    accountNumber: parseAccountNumber(normalizedBody),
    merchant: parseMerchant(normalizedBody),
    rawBody: normalizedBody,
    sender,
  };
}

export function computeSmsDedupeKey(sender: string, body: string): string {
  return `${sender.trim().toLowerCase()}|${body.replace(/\s+/g, ' ').trim()}`;
}

export function formatReviewTransactionNotificationBody(parsed: ParsedBankSms): string {
  const amountText = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(parsed.amount);

  if (parsed.type === 'debit') {
    const merchant = parsed.merchant ?? 'a merchant';
    return `${amountText} spent at ${merchant}. Tap to review and add to your records.`;
  }

  const destination =
    parsed.merchant ??
    (parsed.accountNumber ? `account **${parsed.accountNumber}` : 'your account');

  return `${amountText} credited to ${destination}. Tap to review and add to your records.`;
}

export function formatParsedSmsSummary(parsed: ParsedBankSms): string {
  const amountText = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(parsed.amount);

  const parts = [amountText];

  if (parsed.merchant) {
    parts.push(`at ${parsed.merchant}`);
  }

  if (parsed.accountNumber) {
    parts.push(`A/c **${parsed.accountNumber}`);
  }

  return parts.join(' · ');
}
