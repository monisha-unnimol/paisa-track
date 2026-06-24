import * as Print from 'expo-print';
import { databaseService } from '../../database';
import { ACCOUNT_TYPE_LABELS } from '../../constants/accountOptions';
import { exportFileToUserStorage } from '../files/paisaTrackFileStorage';
import { formatCurrency } from '../../utils/currency';

export type PdfExportResult =
  | { ok: true; fileUri: string; shareableUri: string; fileName: string; displayPath: string }
  | {
      ok: false;
      reason:
        | 'cancelled'
        | 'permission_denied'
        | 'write_failed'
        | 'verify_failed'
        | 'generate_failed'
        | 'save_failed';
    };

function formatReportFileName(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `PaisaTrack_Report_${year}${month}${day}_${hours}${minutes}${seconds}.pdf`;
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getCurrentMonthPrefix(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function isInCurrentMonth(dateValue: string, monthPrefix: string): boolean {
  return dateValue.startsWith(monthPrefix);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildTableRow(cells: string[]): string {
  return `<tr>${cells.map((cell) => `<td>${cell}</td>`).join('')}</tr>`;
}

async function buildReportHtml(): Promise<string> {
  const now = new Date();
  const monthPrefix = getCurrentMonthPrefix(now);
  const [
    accounts,
    transactions,
    categories,
    investments,
    recurringExpenses,
    userProfile,
    investmentTypes,
  ] = await Promise.all([
    databaseService.getAllAccounts(),
    databaseService.getAllTransactions(),
    databaseService.getAllCategories(),
    databaseService.getAllInvestments(),
    databaseService.getAllRecurringExpenses(),
    databaseService.getUserProfile(),
    databaseService.getInvestmentTypes(),
  ]);

  const monthTransactions = transactions.filter((tx) => isInCurrentMonth(tx.date, monthPrefix));
  const monthIncome = monthTransactions.filter((tx) => tx.type === 'income');
  const monthExpenses = monthTransactions.filter((tx) => tx.type === 'expense');
  const totalIncome = monthIncome.reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpenses = monthExpenses.reduce((sum, tx) => sum + tx.amount, 0);
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const userName = userProfile?.name?.trim() || 'PaisaTrack User';

  const spendingCategories = categories.filter((category) => category.scope === 'spending');
  const categoryBreakdown = await Promise.all(
    spendingCategories.map(async (category) => {
      const amount = await databaseService.getMonthlySpentForCategory(
        category.id,
        now.getFullYear(),
        now.getMonth() + 1,
      );
      return { name: category.name, amount };
    }),
  );

  const sortedCategories = categoryBreakdown
    .filter((item) => item.amount > 0)
    .sort((left, right) => right.amount - left.amount);

  const categoryRows =
    sortedCategories.length > 0
      ? sortedCategories
          .map((item) => {
            const percentage = totalExpenses > 0 ? ((item.amount / totalExpenses) * 100).toFixed(1) : '0.0';
            return buildTableRow([
              escapeHtml(item.name),
              formatCurrency(item.amount),
              `${percentage}%`,
            ]);
          })
          .join('')
      : buildTableRow(['No expense categories this month', '-', '-']);

  const accountRows =
    accounts.length > 0
      ? accounts
          .map((account) =>
            buildTableRow([
              escapeHtml(account.name),
              ACCOUNT_TYPE_LABELS[account.type],
              formatCurrency(account.balance),
            ]),
          )
          .join('')
      : buildTableRow(['No accounts', '-', '-']);

  const activeInvestments = investments.filter((item) => item.isActive);
  const monthlyInvestmentTotal = activeInvestments.reduce((sum, item) => sum + item.amount, 0);
  const investmentTypeMap = new Map(investmentTypes.map((type) => [type.slug, type.name]));

  const investmentRows =
    activeInvestments.length > 0
      ? activeInvestments
          .map((item) =>
            buildTableRow([
              escapeHtml(item.name),
              escapeHtml(investmentTypeMap.get(item.type) ?? item.type),
              formatCurrency(item.amount),
            ]),
          )
          .join('')
      : buildTableRow(['No active investments', '-', '-']);

  const activeRecurring = recurringExpenses.filter((item) => item.isActive);
  const recurringRows =
    activeRecurring.length > 0
      ? activeRecurring
          .map((item) =>
            buildTableRow([escapeHtml(item.name), 'Recurring Expense', formatCurrency(item.amount)]),
          )
          .join('')
      : buildTableRow(['No active recurring expenses', '-', '-']);

  const topExpense = [...monthExpenses].sort((left, right) => right.amount - left.amount)[0];
  const topIncome = [...monthIncome].sort((left, right) => right.amount - left.amount)[0];
  const topCategories = sortedCategories.slice(0, 3);

  const statsRows = [
    buildTableRow([
      'Top Expense Categories',
      topCategories.length > 0
        ? topCategories.map((item) => `${escapeHtml(item.name)} (${formatCurrency(item.amount)})`).join(', ')
        : 'None',
    ]),
    buildTableRow([
      'Highest Expense',
      topExpense ? `${escapeHtml(topExpense.title)} (${formatCurrency(topExpense.amount)})` : 'None',
    ]),
    buildTableRow([
      'Highest Income',
      topIncome ? `${escapeHtml(topIncome.title)} (${formatCurrency(topIncome.amount)})` : 'None',
    ]),
  ].join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; padding: 28px; }
          h1 { font-size: 28px; margin: 0 0 8px; color: #0d9488; }
          h2 { font-size: 18px; margin: 28px 0 10px; color: #134e4a; border-bottom: 1px solid #d1d5db; padding-bottom: 6px; }
          p { margin: 0 0 8px; color: #475569; line-height: 1.5; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          td { border: 1px solid #e2e8f0; padding: 8px 10px; font-size: 13px; vertical-align: top; }
          tr:nth-child(even) td { background: #f8fafc; }
          .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
          .summary-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; background: #f8fafc; }
          .summary-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; }
          .summary-value { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 4px; }
        </style>
      </head>
      <body>
        <h1>PaisaTrack Financial Report</h1>
        <p>Generated On: ${escapeHtml(formatDisplayDate(now))}</p>

        <h2>Profile Summary</h2>
        <p><strong>User Name:</strong> ${escapeHtml(userName)}</p>
        <p><strong>Total Accounts:</strong> ${accounts.length}</p>
        <p><strong>Total Balance:</strong> ${formatCurrency(totalBalance)}</p>

        <h2>Accounts Summary</h2>
        <table>
          ${buildTableRow(['<strong>Account Name</strong>', '<strong>Type</strong>', '<strong>Current Balance</strong>'])}
          ${accountRows}
        </table>

        <h2>Income Summary (Current Month)</h2>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">Total Income</div>
            <div class="summary-value">${formatCurrency(totalIncome)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Transaction Count</div>
            <div class="summary-value">${monthIncome.length}</div>
          </div>
        </div>

        <h2>Expense Summary (Current Month)</h2>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">Total Expenses</div>
            <div class="summary-value">${formatCurrency(totalExpenses)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Transaction Count</div>
            <div class="summary-value">${monthExpenses.length}</div>
          </div>
        </div>

        <h2>Category Breakdown</h2>
        <table>
          ${buildTableRow(['<strong>Category Name</strong>', '<strong>Amount</strong>', '<strong>Percentage</strong>'])}
          ${categoryRows}
        </table>

        <h2>Investment Summary</h2>
        <p><strong>Total Active Investments:</strong> ${activeInvestments.length}</p>
        <p><strong>Monthly Contributions:</strong> ${formatCurrency(monthlyInvestmentTotal)}</p>
        <table>
          ${buildTableRow(['<strong>Investment</strong>', '<strong>Type</strong>', '<strong>Monthly Amount</strong>'])}
          ${investmentRows}
        </table>

        <h2>Recurring Items</h2>
        <table>
          ${buildTableRow(['<strong>Name</strong>', '<strong>Type</strong>', '<strong>Amount</strong>'])}
          ${recurringRows}
        </table>

        <h2>Statistics</h2>
        <table>
          ${statsRows}
        </table>
      </body>
    </html>
  `;
}

export async function createAndSavePdfReport(): Promise<PdfExportResult> {
  try {
    const html = await buildReportHtml();
    const { uri } = await Print.printToFileAsync({ html });
    const fileName = formatReportFileName(new Date());
    const saved = await exportFileToUserStorage({
      fileName,
      mimeType: 'application/pdf',
      sourceFileUri: uri,
    });

    if (!saved.ok) {
      const reason =
        saved.reason === 'read_failed' || saved.reason === 'permission_denied'
          ? 'save_failed'
          : saved.reason;
      return { ok: false, reason };
    }

    return {
      ok: true,
      fileUri: saved.fileUri,
      shareableUri: saved.shareableUri,
      fileName: saved.fileName,
      displayPath: saved.displayPath,
    };
  } catch (error) {
    console.error('[PDF] Export failed', error);
    return { ok: false, reason: 'generate_failed' };
  }
}
