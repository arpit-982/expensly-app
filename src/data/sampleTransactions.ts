export interface TransactionRow {
  id: string;
  date: string;
  narration: string;
  debitAccounts: string[];
  creditAccounts: string[];
  amount: number;
  tags: string[];
  comments?: string[];
}

export const sampleTransactions: TransactionRow[] = [
  {
    id: '1',
    date: '2025-01-15',
    narration: 'Coffee at Starbucks',
    debitAccounts: ['Expenses:Food:Coffee'],
    creditAccounts: ['Assets:Checking'],
    amount: 5.5,
    tags: ['work', 'coffee'],
  },
  {
    id: '2',
    date: '2025-01-14',
    narration: 'Salary Payment',
    debitAccounts: ['Assets:Checking'],
    creditAccounts: ['Income:Salary'],
    amount: -3500.0,
    tags: ['salary', 'monthly'],
  },
  {
    id: '3',
    date: '2025-01-13',
    narration: 'Gas Station Fill-up',
    debitAccounts: ['Expenses:Transportation:Gas'],
    creditAccounts: ['Assets:Credit Card'],
    amount: 45.3,
    tags: ['transportation', 'gas'],
  },
  {
    id: '4',
    date: '2025-01-12',
    narration: 'Grocery Shopping',
    debitAccounts: ['Expenses:Food:Groceries'],
    creditAccounts: ['Assets:Checking'],
    amount: 127.83,
    tags: ['food', 'groceries'],
  },
  {
    id: '5',
    date: '2025-01-11',
    narration: 'Internet Bill',
    debitAccounts: ['Expenses:Utilities:Internet'],
    creditAccounts: ['Assets:Checking'],
    amount: 79.99,
    tags: ['utilities', 'monthly'],
  },
  {
    id: '6',
    date: '2025-01-10',
    narration: 'Restaurant Dinner',
    debitAccounts: ['Expenses:Food:Restaurants'],
    creditAccounts: ['Assets:Credit Card'],
    amount: 67.45,
    tags: ['food', 'dining'],
  },
  {
    id: '7',
    date: '2025-01-09',
    narration: 'Amazon Purchase',
    debitAccounts: ['Expenses:Shopping:Online'],
    creditAccounts: ['Assets:Credit Card'],
    amount: 29.99,
    tags: ['shopping', 'online'],
  },
  {
    id: '8',
    date: '2025-01-08',
    narration: 'ATM Withdrawal',
    debitAccounts: ['Assets:Cash'],
    creditAccounts: ['Assets:Checking'],
    amount: 100.0,
    tags: ['cash', 'withdrawal'],
  },
];
