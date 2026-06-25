export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api'

export const CATEGORIES = {
  INCOME: [
    { value: 'Salary', label: '💰 Salary', icon: '💰', color: '#10B981' },
    { value: 'Freelance', label: '💻 Freelance', icon: '💻', color: '#3B82F6' },
    { value: 'Investment', label: '📈 Investment', icon: '📈', color: '#8B5CF6' },
    { value: 'Gift', label: '🎁 Gift', icon: '🎁', color: '#F59E0B' },
    { value: 'Refund', label: '🔄 Refund', icon: '🔄', color: '#EF4444' },
  ],
  EXPENSES: [
    { value: 'Food & Dining', label: '🍔 Food & Dining', icon: '🍔', color: '#EF4444' },
    { value: 'Shopping', label: '🛍️ Shopping', icon: '🛍️', color: '#F97316' },
    { value: 'Transportation', label: '🚗 Transportation', icon: '🚗', color: '#F59E0B' },
    { value: 'Entertainment', label: '🎬 Entertainment', icon: '🎬', color: '#EAB308' },
    { value: 'Bills & Utilities', label: '💡 Bills & Utilities', icon: '💡', color: '#84CC16' },
    { value: 'Healthcare', label: '🏥 Healthcare', icon: '🏥', color: '#10B981' },
    { value: 'Education', label: '📚 Education', icon: '📚', color: '#06B6D4' },
    { value: 'Rent', label: '🏠 Rent', icon: '🏠', color: '#3B82F6' },
    { value: 'Investments', label: '📊 Investments', icon: '📊', color: '#6366F1' },
    { value: 'Other', label: '📌 Other', icon: '📌', color: '#6B7280' },
  ],
}

export const CHART_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']