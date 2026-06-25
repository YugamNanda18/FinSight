import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowUpRight, ArrowDownRight, Calendar, Tag, Building2,
  Search, Filter, MoreVertical, Eye, Edit2, Trash2,
  Download, RefreshCw, AlertCircle, CheckCircle, Clock,
  CreditCard, Wallet, Smartphone, Laptop, Coffee, Home,
  ShoppingBag, TrendingUp, TrendingDown, DollarSign
} from 'lucide-react'
import { formatCurrency, formatDate, getCategoryIcon, getCategoryColor } from '../../utils/formatters'

interface Transaction {
  _id: string
  description: string
  amount: number
  type: 'credit' | 'debit'
  category: string
  merchant: string
  date: string
  status?: 'pending' | 'completed' | 'failed'
  paymentMethod?: 'card' | 'cash' | 'bank_transfer' | 'upi'
}

interface RecentTransactionsProps {
  transactions: Transaction[]
  limit?: number
  onViewAll?: () => void
  onTransactionClick?: (transaction: Transaction) => void
  onEdit?: (transaction: Transaction) => void
  onDelete?: (id: string) => void
  showActions?: boolean
  enableSearch?: boolean
  title?: string
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ 
  transactions, 
  limit = 5, 
  onViewAll, 
  onTransactionClick,
  onEdit,
  onDelete,
  showActions = true,
  enableSearch = false,
  title = "Recent Transactions"
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showMenuId, setShowMenuId] = useState<string | null>(null)

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions]
    
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType)
    }
    
    return filtered.slice(0, limit)
  }, [transactions, searchTerm, filterType, limit])

  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0)
    const netTotal = totalIncome - totalExpenses
    
    return { totalIncome, totalExpenses, netTotal }
  }, [transactions])

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case 'card': return <CreditCard className="w-3 h-3" />
      case 'cash': return <DollarSign className="w-3 h-3" />
      case 'upi': return <Smartphone className="w-3 h-3" />
      default: return <Wallet className="w-3 h-3" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'text-green-500 bg-green-100 dark:bg-green-900/20'
      case 'pending': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20'
      case 'failed': return 'text-red-500 bg-red-100 dark:bg-red-900/20'
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-700'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-3 h-3" />
      case 'pending': return <Clock className="w-3 h-3" />
      case 'failed': return <AlertCircle className="w-3 h-3" />
      default: return null
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      onDelete?.(id)
      setShowMenuId(null)
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div className="p-8 text-center">
          <div className="inline-flex p-3 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
            <CreditCard className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500">No transactions yet</p>
          <p className="text-xs text-gray-400 mt-1">Add your first transaction to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {filteredTransactions.length} of {transactions.length} transactions
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {enableSearch && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            
            <div className="flex gap-1">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2 py-1 text-xs rounded-lg transition-all ${
                  filterType === 'all' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('credit')}
                className={`px-2 py-1 text-xs rounded-lg transition-all ${
                  filterType === 'credit' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                Income
              </button>
              <button
                onClick={() => setFilterType('debit')}
                className={`px-2 py-1 text-xs rounded-lg transition-all ${
                  filterType === 'debit' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                Expenses
              </button>
            </div>
            
            {onViewAll && (
              <button
                onClick={onViewAll}
                className="text-sm text-blue-500 hover:text-blue-600 font-medium"
              >
                View All →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-3 gap-0 border-b border-gray-200 dark:border-gray-700">
        <div className="p-3 text-center border-r border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500">Income</p>
          <p className="text-sm font-bold text-green-500">{formatCurrency(stats.totalIncome)}</p>
        </div>
        <div className="p-3 text-center border-r border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500">Expenses</p>
          <p className="text-sm font-bold text-red-500">{formatCurrency(stats.totalExpenses)}</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-xs text-gray-500">Net</p>
          <p className={`text-sm font-bold ${stats.netTotal >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(stats.netTotal)}
          </p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[400px] overflow-y-auto">
        <AnimatePresence>
          {filteredTransactions.map((transaction, index) => (
            <motion.div
              key={transaction._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
              className="relative"
            >
              <div 
                className="p-4 cursor-pointer"
                onClick={() => onTransactionClick?.(transaction)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Category Icon */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm"
                      style={{ backgroundColor: `${getCategoryColor(transaction.category)}20` }}
                    >
                      {getCategoryIcon(transaction.category)}
                    </div>
                    
                    {/* Transaction Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {transaction.description}
                        </p>
                        {transaction.status && (
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs ${getStatusColor(transaction.status)}`}>
                            {getStatusIcon(transaction.status)}
                            {transaction.status}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{transaction.merchant}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{transaction.category}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{formatDate(transaction.date)}</span>
                        </div>
                        {transaction.paymentMethod && (
                          <div className="flex items-center gap-1">
                            {getPaymentMethodIcon(transaction.paymentMethod)}
                            <span className="text-xs text-gray-500 capitalize">{transaction.paymentMethod}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Amount */}
                    <div className={`flex items-center gap-1 font-bold ${
                      transaction.type === 'credit' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {transaction.type === 'credit' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {formatCurrency(transaction.amount)}
                    </div>
                    
                    {/* Actions Menu */}
                    {showActions && (onEdit || onDelete) && (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowMenuId(showMenuId === transaction._id ? null : transaction._id)
                          }}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                        
                        <AnimatePresence>
                          {showMenuId === transaction._id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -10 }}
                              className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-10 border border-gray-200 dark:border-gray-700 overflow-hidden"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {onEdit && (
                                <button
                                  onClick={() => {
                                    onEdit(transaction)
                                    setShowMenuId(null)
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                                  Edit
                                </button>
                              )}
                              {onDelete && (
                                <button
                                  onClick={() => handleDelete(transaction._id)}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                  Delete
                                </button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedId === transaction._id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700"
                    >
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Transaction ID:</span>
                          <span className="ml-2 font-mono">{transaction._id.slice(-8)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Payment Method:</span>
                          <span className="ml-2 capitalize">{transaction.paymentMethod || 'Not specified'}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {filteredTransactions.length > 0 && (
        <div className="p-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>Last 7 days</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-3 h-3" />
              <span>{filteredTransactions.length} transactions</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecentTransactions