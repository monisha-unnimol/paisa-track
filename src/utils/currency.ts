const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number): string {
  return INR_FORMATTER.format(amount);
}

export function formatIndianInteger(intPart: string): string {
  const digits = intPart.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length <= 3) return digits;

  const lastThree = digits.slice(-3);
  let remaining = digits.slice(0, -3);
  const groups: string[] = [];

  while (remaining.length > 0) {
    if (remaining.length <= 2) {
      groups.unshift(remaining);
      break;
    }
    groups.unshift(remaining.slice(-2));
    remaining = remaining.slice(0, -2);
  }

  return `${groups.join(',')},${lastThree}`;
}

export function sanitizeCurrencyInput(input: string): string {
  let cleaned = input.replace(/,/g, '').replace(/[^\d.]/g, '');

  const firstDot = cleaned.indexOf('.');
  if (firstDot !== -1) {
    const intPart = cleaned.slice(0, firstDot);
    const decPart = cleaned.slice(firstDot + 1).replace(/\./g, '').slice(0, 2);
    const endsWithDot = cleaned.endsWith('.');
    cleaned =
      decPart.length > 0
        ? `${intPart}.${decPart}`
        : endsWithDot
          ? `${intPart}.`
          : intPart;
  }

  if (cleaned === '.') {
    return '0.';
  }

  if (cleaned.includes('.')) {
    const [intPart, decPart = ''] = cleaned.split('.');
    const normalizedInt = intPart.replace(/^0+(?=\d)/, '') || '0';
    return decPart.length > 0 || cleaned.endsWith('.')
      ? `${normalizedInt}.${decPart}`
      : normalizedInt;
  }

  return cleaned.replace(/^0+(?=\d)/, '');
}

export function formatIndianNumberInput(raw: string): string {
  if (!raw) return '';

  const hasTrailingDot = raw.endsWith('.');
  const [intPartRaw, decPart] = raw.split('.');
  const formattedInt = formatIndianInteger(intPartRaw || '0');

  if (decPart !== undefined) {
    return hasTrailingDot && decPart === ''
      ? `${formattedInt}.`
      : `${formattedInt}.${decPart}`;
  }

  return formattedInt;
}

export function parseCurrencyValue(raw: string): number {
  if (!raw || raw === '.' || raw === '0.') {
    return Number.NaN;
  }

  return Number.parseFloat(raw.replace(/,/g, ''));
}

/** Count raw characters (digits and decimal point) before a cursor index in formatted text. */
export function countRawContentBefore(formatted: string, index: number): number {
  return formatted.slice(0, Math.max(0, index)).replace(/,/g, '').length;
}

/** Map a raw content index to the matching cursor position in formatted text. */
export function cursorFromRawContentIndex(formatted: string, rawContentIndex: number): number {
  if (rawContentIndex <= 0) {
    return 0;
  }

  let count = 0;
  for (let i = 0; i < formatted.length; i += 1) {
    if (formatted[i] !== ',') {
      count += 1;
      if (count >= rawContentIndex) {
        return i + 1;
      }
    }
  }

  return formatted.length;
}

export type CurrencyEditResult = {
  raw: string;
  formatted: string;
  cursor: number;
};

export function applyCurrencyEdit(
  previousFormatted: string,
  previousRaw: string,
  incomingText: string,
  selectionStart: number,
  selectionEnd: number,
): CurrencyEditResult {
  const contentBefore = countRawContentBefore(previousFormatted, selectionStart);
  const selectedLength = previousFormatted
    .slice(selectionStart, selectionEnd)
    .replace(/,/g, '').length;

  let nextRaw = sanitizeCurrencyInput(incomingText);

  const isBackspaceOnComma =
    nextRaw === previousRaw &&
    incomingText.length < previousFormatted.length &&
    selectionStart === selectionEnd &&
    selectionStart > 0 &&
    previousFormatted[selectionStart - 1] === ',';

  if (isBackspaceOnComma && contentBefore > 0) {
    nextRaw = sanitizeCurrencyInput(
      previousRaw.slice(0, contentBefore - 1) + previousRaw.slice(contentBefore),
    );
  }

  const nextFormatted = formatIndianNumberInput(nextRaw);
  const rawDelta = nextRaw.length - previousRaw.length;

  let nextContentIndex =
    selectionStart !== selectionEnd
      ? contentBefore + rawDelta + selectedLength
      : contentBefore + rawDelta;

  nextContentIndex = Math.max(0, Math.min(nextRaw.length, nextContentIndex));

  return {
    raw: nextRaw,
    formatted: nextFormatted,
    cursor: cursorFromRawContentIndex(nextFormatted, nextContentIndex),
  };
}
