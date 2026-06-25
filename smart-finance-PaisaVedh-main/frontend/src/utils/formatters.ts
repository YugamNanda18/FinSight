export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatDate = (date: string | Date, format: 'short' | 'long' = 'short'): string => {
  const d = new Date(date)
  
  if (format === 'short') {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    'Food & Dining': '🍔',
    'Shopping': '🛍️',
    'Transportation': '🚗',
    'Entertainment': '🎬',
    'Bills & Utilities': '💡',
    'Healthcare': '🏥',
    'Education': '📚',
    'Rent': '🏠',
    'Investments': '📊',
    'Salary': '💰',
    'Freelance': '💻',
    'Gift': '🎁',
  }
  return icons[category] || '📌'
}

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Food & Dining': '#EF4444',
    'Shopping': '#F97316',
    'Transportation': '#F59E0B',
    'Entertainment': '#EAB308',
    'Bills & Utilities': '#84CC16',
    'Healthcare': '#10B981',
    'Education': '#06B6D4',
    'Rent': '#3B82F6',
    'Investments': '#6366F1',
    'Salary': '#10B981',
    'Freelance': '#3B82F6',
  }
  return colors[category] || '#6B7280'
}