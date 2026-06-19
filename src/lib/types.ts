export type AccountType =
  | "Cash"
  | "Bank"
  | "Credit Card"
  | "Loan"
  | "E-Wallet"
  | "Savings";

export const ACCOUNT_TYPES: AccountType[] = [
  "Cash",
  "Bank",
  "Credit Card",
  "Loan",
  "E-Wallet",
  "Savings",
];

export const ACCOUNT_ICONS: Record<AccountType, string> = {
  Cash: "banknote",
  Bank: "building",
  "Credit Card": "credit-card",
  Loan: "arrow-left-right",
  "E-Wallet": "smartphone",
  Savings: "shield",
};

export type TransactionCategory =
  | "Food"
  | "Transport"
  | "Shopping"
  | "Entertainment"
  | "Bills"
  | "Salary"
  | "Health"
  | "Other";

export const CATEGORIES: TransactionCategory[] = [
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Bills",
  "Salary",
  "Health",
  "Other",
];

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  isSettled?: boolean;
  settledAt?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: TransactionCategory;
  date: string;
  isIncome: boolean;
  accountId: string | null;
  createdAt: string;
}

export interface RecurringTransaction {
  id: string;
  title: string;
  amount: number;
  category: TransactionCategory;
  isIncome: boolean;
  dayOfMonth: number;
  nextDueDate: string;
  isActive: boolean;
  accountId: string | null;
  createdAt: string;
}

export interface FinanceData {
  accounts: Account[];
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  lastUpdated: string;
}

export function getAccountBalance(
  account: Account,
  transactions: Transaction[]
): number {
  const accountTransactions = transactions.filter(
    (t) => t.accountId === account.id
  );
  return accountTransactions.reduce((balance, t) => {
    return balance + (t.isIncome ? t.amount : -t.amount);
  }, account.initialBalance);
}

export function getTotalBalance(
  accounts: Account[],
  transactions: Transaction[]
): number {
  const accountsBalance = accounts.reduce(
    (sum, a) => sum + getAccountBalance(a, transactions),
    0
  );
  const unassigned = transactions
    .filter((t) => !t.accountId)
    .reduce((sum, t) => sum + (t.isIncome ? t.amount : -t.amount), 0);
  return accountsBalance + unassigned;
}

export function getTotalIncome(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getTotalExpense(transactions: Transaction[]): number {
  return transactions
    .filter((t) => !t.isIncome)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function formatIDR(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function processRecurring(
  recurringList: RecurringTransaction[],
  existingTransactions: Transaction[]
): { newTransactions: Transaction[]; updatedRecurring: RecurringTransaction[] } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const newTransactions: Transaction[] = [];
  const updatedRecurring: RecurringTransaction[] = [];

  for (const recurring of recurringList) {
    if (!recurring.isActive) continue;
    const nextDue = new Date(recurring.nextDueDate);
    nextDue.setHours(0, 0, 0, 0);

    if (nextDue <= today) {
      // Idempotency check: skip if a matching transaction already exists
      const alreadyGenerated = existingTransactions.some((tx) =>
        tx.title === recurring.title &&
        tx.amount === recurring.amount &&
        tx.category === recurring.category &&
        tx.isIncome === recurring.isIncome &&
        new Date(tx.date).getMonth() === nextDue.getMonth() &&
        new Date(tx.date).getFullYear() === nextDue.getFullYear()
      );
      if (alreadyGenerated) continue;

      const tx: Transaction = {
        id: crypto.randomUUID(),
        title: recurring.title,
        amount: recurring.amount,
        category: recurring.category,
        date: recurring.nextDueDate,
        isIncome: recurring.isIncome,
        accountId: recurring.accountId,
        createdAt: new Date().toISOString(),
      };
      newTransactions.push(tx);

      const next = new Date(nextDue);
      const dayOfMonth = next.getDate();
      next.setMonth(next.getMonth() + 1);
      if (next.getDate() !== dayOfMonth) {
        next.setDate(0); // roll back to last day of previous month
      }
      updatedRecurring.push({
        ...recurring,
        nextDueDate: next.toISOString(),
      });
    }
  }

  return { newTransactions, updatedRecurring };
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function getActiveAccounts(accounts: Account[]): Account[] {
  return accounts.filter(a => !a.isSettled);
}

export function getSettledAccounts(accounts: Account[]): Account[] {
  return accounts.filter(a => a.isSettled);
}
