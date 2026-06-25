export const CURRENCIES = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export const TRANSACTION_CATEGORIES = {
  INCOME: [
    'Salary',
    'Freelance',
    'Investment',
    'Gift',
    'Refund',
    'Other Income',
  ],
  EXPENSES: [
    'Food & Dining',
    'Shopping',
    'Transportation',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Rent',
    'Investments',
    'Insurance',
    'Other',
  ],
};

export const BUDGET_FREQUENCIES = ['weekly', 'monthly', 'yearly'];

export const REPORT_TYPES = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];

export const NOTIFICATION_TYPES = {
  BUDGET_ALERT: 'budget_alert',
  RECURRING_DETECTED: 'recurring_detected',
  REPORT_READY: 'report_ready',
  GOAL_ACHIEVED: 'goal_achieved',
};

export const GOAL_PRIORITIES = ['low', 'medium', 'high'];

export const TRANSACTION_TYPES = ['credit', 'debit'];

export const USER_ROLES = ['user', 'admin'];

export const CACHE_KEYS = {
  DASHBOARD: (userId: string) => `dashboard:${userId}`,
  TRANSACTIONS: (userId: string) => `transactions:${userId}`,
  BUDGETS: (userId: string) => `budgets:${userId}`,
  ANALYTICS: (userId: string) => `analytics:${userId}`,
};

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/profile',
  },
  TRANSACTIONS: {
    BASE: '/api/transactions',
    UPLOAD_CSV: '/api/transactions/upload-csv',
    STATS: '/api/transactions/stats',
  },
  BUDGETS: {
    BASE: '/api/budgets',
    ALERTS: '/api/budgets/alerts',
  },
  ANALYTICS: {
    DASHBOARD: '/api/analytics/dashboard',
    INSIGHTS: '/api/analytics/insights',
    CASHFLOW: '/api/analytics/cashflow',
  },
  REPORTS: {
    GENERATE: '/api/reports/generate',
    EXPORT: '/api/reports/export',
  },
};

export const CSV_HEADERS = {
  HDFC: ['Date', 'Narration', 'Withdrawal', 'Deposit', 'Balance'],
  ICICI: ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
  SBI: ['Transaction Date', 'Description', 'Debit', 'Credit', 'Balance'],
};

export const MERCHANT_KEYWORDS: Record<string, string[]> = {
  'Food & Dining': ['swiggy', 'zomato', 'restaurant', 'cafe', 'starbucks', 'pizza hut'],
  Shopping: ['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa'],
  Transportation: ['uber', 'ola', 'rapido', 'petrol', 'fuel', 'metro'],
  Entertainment: ['netflix', 'amazon prime', 'hotstar', 'bookmyshow', 'cinema'],
  Utilities: ['electricity', 'water bill', 'gas', 'broadband', 'mobile recharge'],
  Healthcare: ['pharmacy', 'hospital', 'doctor', 'medicines', 'clinic'],
  Education: ['course', 'udemy', 'coursera', 'college', 'tuition'],
};