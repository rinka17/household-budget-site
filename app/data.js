export const categories = [
  { name: 'Groceries', icon: '✳', tone: 'mint' },
  { name: 'Housing', icon: '⌂', tone: 'lilac' },
  { name: 'Transport', icon: '↗', tone: 'peach' },
  { name: 'Utilities', icon: 'ϟ', tone: 'sky' },
  { name: 'Dining', icon: '⌑', tone: 'rose' },
  { name: 'Health', icon: '+', tone: 'mint' },
  { name: 'Family', icon: '♡', tone: 'lilac' },
  { name: 'Personal', icon: '◉', tone: 'peach' },
  { name: 'Savings', icon: '✦', tone: 'sky' },
  { name: 'Other', icon: '·', tone: 'gray' },
];

export const budgets = [
  { category: 'Housing', limit: 2100 },
  { category: 'Groceries', limit: 850 },
  { category: 'Transport', limit: 420 },
  { category: 'Utilities', limit: 360 },
  { category: 'Dining', limit: 260 },
  { category: 'Family', limit: 300 },
];

export const initialTransactions = [
  { id: 't1', date: '2026-11-27', name: 'Paycheck · Jamie', type: 'income', category: 'Other', amount: 4320, account: 'Everyday checking' },
  { id: 't2', date: '2026-11-26', name: 'Market Street Co-op', type: 'expense', category: 'Groceries', amount: 86.42, account: 'Visa card' },
  { id: 't3', date: '2026-11-25', name: 'City water & power', type: 'expense', category: 'Utilities', amount: 148.7, account: 'Everyday checking' },
  { id: 't4', date: '2026-11-24', name: 'After-school club', type: 'expense', category: 'Family', amount: 95, account: 'Everyday checking' },
  { id: 't5', date: '2026-11-22', name: 'Sunday brunch', type: 'expense', category: 'Dining', amount: 48.25, account: 'Visa card' },
  { id: 't6', date: '2026-11-21', name: 'Transit monthly pass', type: 'expense', category: 'Transport', amount: 72, account: 'Visa card' },
  { id: 't7', date: '2026-11-20', name: 'Rent · Maple Avenue', type: 'expense', category: 'Housing', amount: 1850, account: 'Everyday checking' },
  { id: 't8', date: '2026-11-18', name: 'Northside Pharmacy', type: 'expense', category: 'Health', amount: 34.18, account: 'Visa card' },
  { id: 't9', date: '2026-11-16', name: 'Fresh Fields Market', type: 'expense', category: 'Groceries', amount: 122.63, account: 'Visa card' },
  { id: 't10', date: '2026-11-14', name: 'Streaming bundle', type: 'expense', category: 'Utilities', amount: 24.99, account: 'Visa card' },
  { id: 't11', date: '2026-11-13', name: 'Paycheck · Morgan', type: 'income', category: 'Other', amount: 3680, account: 'Everyday checking' },
  { id: 't12', date: '2026-11-12', name: 'Fuel & wash', type: 'expense', category: 'Transport', amount: 58.4, account: 'Visa card' },
  { id: 't13', date: '2026-11-10', name: 'Neighborhood bakery', type: 'expense', category: 'Dining', amount: 19.6, account: 'Visa card' },
  { id: 't14', date: '2026-11-08', name: 'Weekly groceries', type: 'expense', category: 'Groceries', amount: 104.31, account: 'Visa card' },
  { id: 't15', date: '2026-11-06', name: 'Internet · monthly', type: 'expense', category: 'Utilities', amount: 69, account: 'Everyday checking' },
  { id: 't16', date: '2026-11-04', name: 'Piano lesson', type: 'expense', category: 'Family', amount: 45, account: 'Everyday checking' },
  { id: 't17', date: '2026-11-03', name: 'Corner grocery', type: 'expense', category: 'Groceries', amount: 63.9, account: 'Visa card' },
  { id: 't18', date: '2026-10-31', name: 'Paycheck · Jamie', type: 'income', category: 'Other', amount: 4320, account: 'Everyday checking' },
  { id: 't19', date: '2026-10-29', name: 'Harvest Market', type: 'expense', category: 'Groceries', amount: 94.75, account: 'Visa card' },
  { id: 't20', date: '2026-10-28', name: 'Rent · Maple Avenue', type: 'expense', category: 'Housing', amount: 1850, account: 'Everyday checking' },
  { id: 't21', date: '2026-10-26', name: 'Paycheck · Morgan', type: 'income', category: 'Other', amount: 3680, account: 'Everyday checking' },
  { id: 't22', date: '2026-10-23', name: 'Gas & electric', type: 'expense', category: 'Utilities', amount: 162.2, account: 'Everyday checking' },
  { id: 't23', date: '2026-10-20', name: 'School supplies', type: 'expense', category: 'Family', amount: 73.45, account: 'Visa card' },
  { id: 't24', date: '2026-10-18', name: 'Grocery run', type: 'expense', category: 'Groceries', amount: 137.12, account: 'Visa card' },
  { id: 't25', date: '2026-10-15', name: 'Coffee & lunch', type: 'expense', category: 'Dining', amount: 32.8, account: 'Visa card' },
];

export const accounts = [
  { name: 'Everyday checking', kind: 'Checking · Parker family', last4: '4821', balance: 8240.35, icon: '▤', tone: 'sky' },
  { name: 'Joint savings', kind: 'Savings · Parker family', last4: '0956', balance: 12350, icon: '◈', tone: 'mint' },
  { name: 'Visa card', kind: 'Credit card · Jamie', last4: '7112', balance: -486.25, icon: '▰', tone: 'lilac' },
];
