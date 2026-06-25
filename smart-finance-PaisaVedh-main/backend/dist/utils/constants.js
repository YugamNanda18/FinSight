"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MERCHANT_KEYWORDS = exports.CSV_HEADERS = exports.API_ENDPOINTS = exports.CACHE_KEYS = exports.USER_ROLES = exports.TRANSACTION_TYPES = exports.GOAL_PRIORITIES = exports.NOTIFICATION_TYPES = exports.REPORT_TYPES = exports.BUDGET_FREQUENCIES = exports.TRANSACTION_CATEGORIES = exports.CURRENCIES = void 0;
exports.CURRENCIES = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
};
exports.TRANSACTION_CATEGORIES = {
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
exports.BUDGET_FREQUENCIES = ['weekly', 'monthly', 'yearly'];
exports.REPORT_TYPES = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
exports.NOTIFICATION_TYPES = {
    BUDGET_ALERT: 'budget_alert',
    RECURRING_DETECTED: 'recurring_detected',
    REPORT_READY: 'report_ready',
    GOAL_ACHIEVED: 'goal_achieved',
};
exports.GOAL_PRIORITIES = ['low', 'medium', 'high'];
exports.TRANSACTION_TYPES = ['credit', 'debit'];
exports.USER_ROLES = ['user', 'admin'];
exports.CACHE_KEYS = {
    DASHBOARD: (userId) => `dashboard:${userId}`,
    TRANSACTIONS: (userId) => `transactions:${userId}`,
    BUDGETS: (userId) => `budgets:${userId}`,
    ANALYTICS: (userId) => `analytics:${userId}`,
};
exports.API_ENDPOINTS = {
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
exports.CSV_HEADERS = {
    HDFC: ['Date', 'Narration', 'Withdrawal', 'Deposit', 'Balance'],
    ICICI: ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
    SBI: ['Transaction Date', 'Description', 'Debit', 'Credit', 'Balance'],
};
exports.MERCHANT_KEYWORDS = {
    'Food & Dining': ['swiggy', 'zomato', 'restaurant', 'cafe', 'starbucks', 'pizza hut'],
    Shopping: ['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa'],
    Transportation: ['uber', 'ola', 'rapido', 'petrol', 'fuel', 'metro'],
    Entertainment: ['netflix', 'amazon prime', 'hotstar', 'bookmyshow', 'cinema'],
    Utilities: ['electricity', 'water bill', 'gas', 'broadband', 'mobile recharge'],
    Healthcare: ['pharmacy', 'hospital', 'doctor', 'medicines', 'clinic'],
    Education: ['course', 'udemy', 'coursera', 'college', 'tuition'],
};
//# sourceMappingURL=constants.js.map