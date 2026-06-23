export const DIALOG_ACTIONS = {
  gotIt: 'Got It',
  close: 'Close',
  tryAgain: 'Try Again',
  keepEditing: 'Keep Editing',
  discardChanges: 'Discard Changes',
} as const;

export const UNSAVED_CHANGES_COPY = {
  title: 'Leave without saving?',
  message:
    "You've made changes that haven't been saved. If you leave now, those changes will be lost.",
  confirmLabel: DIALOG_ACTIONS.discardChanges,
  cancelLabel: DIALOG_ACTIONS.keepEditing,
} as const;

export const VALIDATION_COPY = {
  accountName: {
    title: 'Account Name Required',
    message: 'Please enter an account name.',
  },
  firstAccountName: {
    title: 'Account Name Required',
    message: 'Please enter an account name.',
  },
  firstAccountBalanceRequired: {
    title: 'Opening Balance Required',
    message: 'Please enter the current account balance.',
  },
  accountBalance: {
    title: 'Enter a valid balance',
    message:
      'The balance must be a number in rupees. Use digits only, such as 5000 or 1250.50.',
  },
  categoryName: {
    title: 'Name Required',
    message: 'Please enter a valid name.',
  },
  categoryBudget: {
    title: 'Enter a valid spending limit',
    message:
      'The monthly limit must be zero or a positive number in rupees, such as 5000.',
  },
  transactionTitle: {
    title: 'Transaction title required',
    message:
      'Add a short description so you can find this entry later — for example, "Grocery shopping" or "Salary".',
  },
  transactionAmount: {
    title: 'Enter a valid amount',
    message:
      'The amount must be greater than zero. Enter a number in rupees, such as 250 or 1499.99.',
  },
  transactionAccount: {
    title: 'Select an account',
    message:
      'Choose which account this transaction belongs to. Create an account first if you do not have one yet.',
  },
  transactionDate: {
    title: 'Date Required',
    message: 'Please select a transaction date.',
  },
  investmentName: {
    title: 'Investment name required',
    message:
      'Enter a name for this investment — for example, "SBI SIP" or "HDFC Mutual Fund".',
  },
  investmentType: {
    title: 'Select an investment type',
    message: 'Choose the type that best describes this investment.',
  },
  itemNameRequired: {
    title: 'Name Required',
    message: 'Please enter a valid name.',
  },
  investmentAmount: {
    title: 'Enter a valid monthly amount',
    message:
      'The monthly investment must be greater than zero. Enter an amount in rupees, such as 5000.',
  },
  investmentAccount: {
    title: 'Select a linked account',
    message:
      'Choose the account from which the monthly deduction will be made. Create an account first if needed.',
  },
  investmentDeductionDay: {
    title: 'Deduction Date Required',
    message: 'Please select a deduction date.',
  },
  recurringDeductionDate: {
    title: 'Deduction Date Required',
    message: 'Please select a deduction date.',
  },
  investmentStartDate: {
    title: 'Start Date Required',
    message: 'Please select a start date.',
  },
  recurringName: {
    title: 'Expense name required',
    message:
      'Enter a name for this recurring expense — for example, "House Rent" or "Internet Bill".',
  },
  recurringAmount: {
    title: 'Enter a valid amount',
    message:
      'The recurring expense amount must be greater than zero. Enter an amount in rupees, such as 15000.',
  },
  recurringAccount: {
    title: 'Select a linked account',
    message:
      'Choose the account from which the expense will be deducted. Create an account first if needed.',
  },
  recurringCategory: {
    title: 'Select an expense category',
    message:
      'Choose a category for this recurring expense — for example, Rent, EMI, or Internet.',
  },
  recurringStartDate: {
    title: 'Start Date Required',
    message: 'Please select a start date.',
  },
  recurringEndDate: {
    title: 'Enter a valid end date',
    message:
      'End date must use YYYY-MM-DD format and be on or after the start date. Leave blank if ongoing.',
  },
  profileName: {
    title: 'Name Required',
    message: 'Please enter your name to continue.',
  },
  profileSaveFailed: {
    title: 'Could not save profile',
    message: 'Your profile was not saved. Please try again.',
  },
} as const;

export const ERROR_COPY = {
  accountNotFound: {
    title: 'Account not found',
    message:
      'This account may have been deleted or is no longer available. Go back and refresh your accounts list.',
  },
  accountLoadFailed: {
    title: 'Could not load account',
    message:
      'Something went wrong while opening this account. Check your connection and try again.',
  },
  accountSaveFailed: {
    title: 'Could not save account',
    message:
      'Your account was not saved. Review the details and try again. If the problem continues, restart the app.',
  },
  accountDeleteFailed: {
    title: 'Could not delete account',
    message:
      'This account could not be deleted right now. Please try again in a moment.',
  },
  accountDeleteBlocked: {
    title: 'Account has transactions',
    message:
      'Remove or reassign all transactions linked to this account before deleting it.',
  },
  accountRequired: {
    title: 'Account Required',
    message: 'Please create an account before adding recurring items.',
  },
  categorySaveFailed: {
    title: 'Unable to Save Category',
    message:
      "We couldn't save your category. Please try again.",
  },
  categoryDuplicate: {
    title: 'Duplicate Category Name',
    message:
      'A spending limit with this name already exists. Choose a different name.',
  },
  recurringCategoryDuplicate: {
    title: 'Already Exists',
    message: 'Please choose another name.',
  },
  investmentTypeDuplicate: {
    title: 'Already Exists',
    message: 'Please choose another name.',
  },
  investmentTypeDeleteBlocked: {
    title: 'Cannot Delete Investment Type',
    message: 'This investment type is currently in use.',
  },
  categoryDeleteBlockedRecurring: {
    title: 'Cannot Delete Category',
    message: 'This category is currently in use.',
  },
  categoryDeleteFailed: {
    title: 'Could not delete category',
    message:
      'This category could not be deleted right now. Please try again in a moment.',
  },
  categoryDeleteBlocked: {
    title: 'Category has transactions',
    message:
      'Remove or reassign all transactions linked to this category before deleting it.',
  },
  transactionSaveFailed: {
    title: 'Could not save transaction',
    message:
      'Your transaction was not saved. Review the details and try again. If the problem continues, restart the app.',
  },
  investmentNotFound: {
    title: 'Investment not found',
    message:
      'This investment may have been deleted. Go back and refresh your investments list.',
  },
  investmentLoadFailed: {
    title: 'Could not load investment',
    message:
      'Something went wrong while opening this investment. Check your connection and try again.',
  },
  investmentSaveFailed: {
    title: 'Could not save investment',
    message:
      'Your investment was not saved. Review the details and try again. If the problem continues, restart the app.',
  },
  investmentDeleteFailed: {
    title: 'Could not delete investment',
    message:
      'This investment could not be deleted right now. Please try again in a moment.',
  },
  recurringNotFound: {
    title: 'Recurring expense not found',
    message:
      'This recurring expense may have been deleted. Go back and refresh your list.',
  },
  recurringLoadFailed: {
    title: 'Could not load recurring expense',
    message:
      'Something went wrong while opening this recurring expense. Check your connection and try again.',
  },
  recurringSaveFailed: {
    title: 'Could not save recurring expense',
    message:
      'Your recurring expense was not saved. Review the details and try again. If the problem continues, restart the app.',
  },
  recurringDeleteFailed: {
    title: 'Could not delete recurring expense',
    message:
      'This recurring expense could not be deleted right now. Please try again in a moment.',
  },
  smsPermissionDenied: {
    title: 'SMS Permission Required',
    message:
      'Automatic expense tracking from SMS needs SMS read permission. The setting stays off until you grant access.',
  },
  smsPermissionBlocked: {
    title: 'SMS Permission Blocked',
    message:
      'SMS access was previously denied. Open app settings to allow SMS permissions, then turn the toggle on again.',
  },
  smsTrackingUnavailable: {
    title: 'SMS Tracking Unavailable',
    message:
      'SMS tracking is not available on this device or build. You can still track expenses manually.',
  },
  smsTrackingInvalidState: {
    title: 'SMS Permission Required',
    message:
      'SMS tracking was turned off because SMS permission is not granted. Turn the toggle on again to grant access.',
  },
} as const;

export const SMS_COPY = {
  enableExplanation: {
    title: 'Enable SMS Tracking?',
    message:
      'PaisaTrack reads bank transaction SMS on your device to suggest expenses automatically. Messages are not uploaded or shared. You will be asked to grant SMS permission next.',
    confirmLabel: 'Continue',
    cancelLabel: 'Cancel',
  },
  onboardingEnableExplanation: {
    title: 'Enable SMS Transaction Detection',
    message:
      'PaisaTrack needs SMS access to automatically detect bank transactions and create review requests.',
    confirmLabel: 'Continue',
    cancelLabel: 'Cancel',
  },
  onboardingPermissionDenied: {
    title: 'SMS Permission Required',
    message:
      'You can still use PaisaTrack without SMS tracking and enable it later from Settings.',
    continueLabel: 'Continue',
    retryLabel: 'Retry',
  },
  onboardingEnabled: {
    title: 'SMS Tracking Enabled',
    message: 'Bank transaction SMS will be detected automatically on this device.',
    confirmLabel: 'Continue',
  },
} as const;

export const DELETE_DIALOG_COPY = {
  account: {
    title: 'Delete this account?',
    confirmLabel: 'Delete Account',
    cancelLabel: 'Keep Account',
    message: (name: string) =>
      `"${name}" will be permanently removed. This cannot be undone. If it has linked transactions, deletion will be blocked.`,
  },
  accountOnlyAccount: {
    title: 'Cannot Delete Account',
    message:
      'You must have at least one account in PaisaTrack. Create another account before deleting this one.',
    confirmLabel: 'Got It',
  },
  accountDefaultMustChange: {
    title: 'Change Default Account First',
    message:
      'Please select another account as the default account before deleting this one.',
    confirmLabel: 'Choose Default',
    cancelLabel: 'Cancel',
  },
  category: {
    title: 'Delete this category?',
    confirmLabel: 'Delete Category',
    cancelLabel: 'Keep Category',
    message: (name: string) =>
      `"${name}" will be permanently removed. This cannot be undone. If it has linked transactions, deletion will be blocked.`,
  },
  transaction: {
    title: 'Delete this transaction?',
    confirmLabel: 'Delete Transaction',
    cancelLabel: 'Keep Transaction',
    message: (title: string) =>
      `"${title}" will be permanently removed. The linked account balance and category spending totals will be updated.`,
  },
  investment: {
    title: 'Delete Investment?',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    message: () => 'This investment will be removed from your tracking records.',
  },
  recurring: {
    title: 'Delete Recurring Expense?',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    message: () => 'This recurring expense will be removed from your tracking records.',
  },
  investmentType: {
    title: 'Delete Investment Type?',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    message: () => 'This action cannot be undone.',
  },
  recurringCategoryInline: {
    title: 'Delete Category?',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    message: () => 'This action cannot be undone.',
  },
} as const;

export const DEFAULT_ACCOUNT_COPY = {
  required: {
    title: 'Default Account Required',
    message:
      'You must always have one default account. Create another account and make it the default before removing this one.',
    confirmLabel: DIALOG_ACTIONS.gotIt,
  },
  chooseNew: {
    title: 'Choose New Default Account',
    message:
      'A default account is required. Please select another account to become the default account.',
  },
  changeConfirm: {
    title: 'Change Default Account?',
    message: (name: string) => `${name} will become the new default account.`,
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
  },
  makeDefault: {
    title: 'Make Default Account?',
    message: (name: string, currentDefaultName: string) =>
      `${name} will become your default account and replace ${currentDefaultName}.`,
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
  },
} as const;

/** @deprecated Use DELETE_DIALOG_COPY.account.message */
export function deleteAccountMessage(name: string): string {
  return DELETE_DIALOG_COPY.account.message(name);
}

/** @deprecated Use DELETE_DIALOG_COPY.category.message */
export function deleteCategoryMessage(name: string): string {
  return DELETE_DIALOG_COPY.category.message(name);
}

/** @deprecated Use DELETE_DIALOG_COPY.transaction.message */
export function deleteTransactionMessage(title: string): string {
  return DELETE_DIALOG_COPY.transaction.message(title);
}

export const SECURITY_COPY = {
  revealBalancesPin: {
    title: 'Enter PIN',
    message: 'Enter your PIN to reveal balances.',
  },
  accountDetailsPin: {
    title: 'Verify PIN',
    message: 'Enter your PIN to view account details.',
  },
  pinRequired: {
    title: 'PIN Required',
    message: 'Please create a PIN to protect your financial information.',
  },
  pinMismatch: {
    title: 'PINs Do Not Match',
    message: 'Please enter the same PIN in both fields.',
  },
  incorrectPin: {
    title: 'Incorrect PIN',
    message: 'The PIN entered is incorrect.',
  },
  currentPinRequired: {
    title: 'Current PIN Required',
    message: 'Enter your current PIN to continue.',
  },
  pinResetUnavailable: {
    title: 'PIN Reset Not Available',
    message: 'PIN recovery is not yet supported. Please reinstall the app if necessary.',
  },
  pinSaveFailed: {
    title: 'Could Not Save PIN',
    message: 'Something went wrong while saving your PIN. Please try again.',
  },
} as const;

export const SUCCESS_COPY = {
  accountCreated: {
    title: 'Account Created',
    message: 'Your account has been created successfully.',
  },
  firstAccountCreated: {
    title: 'Account Created',
    message:
      'Your first account is ready. You can now start tracking income, expenses, investments, and recurring transactions.',
  },
  accountUpdated: {
    title: 'Account Updated',
    message: 'Your account has been updated successfully.',
  },
  accountDeleted: {
    title: 'Account Deleted',
    message: 'Your account has been deleted successfully.',
  },
  categoryCreated: {
    title: 'Category Created',
    message: 'Your category has been created successfully.',
  },
  categoryUpdated: {
    title: 'Category Updated',
    message: 'Your category has been updated successfully.',
  },
  categoryDeleted: {
    title: 'Category Deleted',
    message: 'Your category has been deleted successfully.',
  },
  transactionCreated: (type: 'income' | 'expense') => ({
    title: type === 'income' ? 'Income Added' : 'Expense Added',
    message:
      type === 'income'
        ? 'Your income has been recorded successfully.'
        : 'Your expense has been recorded successfully.',
  }),
  transactionUpdated: {
    title: 'Transaction Updated',
    message: 'Your transaction has been updated successfully.',
  },
  transactionDeleted: {
    title: 'Transaction Deleted',
    message: 'Your transaction has been deleted successfully.',
  },
  investmentCreated: {
    title: 'Investment Created',
    message: 'Your investment has been created and will be tracked monthly.',
  },
  investmentUpdated: {
    title: 'Investment Updated',
    message: 'Your investment has been updated successfully.',
  },
  investmentDeleted: {
    title: 'Investment Deleted',
    message: 'Your investment has been removed from tracking.',
  },
  recurringCreated: {
    title: 'Recurring Expense Created',
    message: 'Your recurring expense has been created and will be tracked automatically.',
  },
  recurringUpdated: {
    title: 'Recurring Expense Updated',
    message: 'Your recurring expense has been updated successfully.',
  },
  recurringDeleted: {
    title: 'Recurring Expense Deleted',
    message: 'Your recurring expense has been removed from tracking.',
  },
  pinUpdated: {
    title: 'PIN Updated',
    message: 'Your security PIN has been updated successfully.',
  },
} as const;

export type DialogMessage = {
  title: string;
  message: string;
};

export function dialogMessage(copy: DialogMessage): DialogMessage {
  return copy;
}
