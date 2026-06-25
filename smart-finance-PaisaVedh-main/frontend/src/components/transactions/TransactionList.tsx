import React, { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Edit2, Trash2, Eye, Filter, ChevronDown, ChevronUp, 
  Search, Calendar, DollarSign, Tag, Download, Printer,
  CreditCard, Receipt, Clock, AlertCircle, CheckCircle,
  TrendingUp, TrendingDown, Archive, Share2, MoreVertical,
  Star, StarOff, Copy, FileText, MessageSquare, Image
} from 'lucide-react'
import { formatCurrency, formatDate, getCategoryIcon, getCategoryColor } from '../../utils/formatters'
import toast from 'react-hot-toast'

interface TransactionListProps {
  transactions: any[]
  onEdit: (transaction: any) => void
  onDelete: (id: string) => void
  onView?: (transaction: any) => void
  onDuplicate?: (transaction: any) => void
  onShare?: (transaction: any) => void
  isLoading?: boolean
  showFilters?: boolean
  enableBulkActions?: boolean
}

interface FilterState {
  search: string
  type: 'all' | 'credit' | 'debit'
  category: string
  minAmount: number
  maxAmount: number
  startDate: string
  endDate: string
  tags: string[]
}

const TransactionCard: React.FC<{
  transaction: any
  index: number
  isExpanded: boolean
  isSelected: boolean
  onToggleExpand: () => void
  onToggleSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onView?: () => void
  onDuplicate?: () => void
  onShare?: () => void
}> = ({
  transaction,
  index,
  isExpanded,
  isSelected,
  onToggleExpand,
  onToggleSelect,
  onEdit,
  onDelete,
  onView,
  onDuplicate,
  onShare
}) => {
  const [showActions, setShowActions] = useState(false)
  const isCredit = transaction.type === 'credit'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ scale: 1.01 }}
      className={`relative group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${
        isSelected ? 'ring-2 ring-blue-500 shadow-blue-100 dark:shadow-blue-900/20' : ''
      }`}
    >
      {/* Gradient Border Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ padding: '2px' }} />
      
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
        {/* Selection Checkbox */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
          <button
            onClick={onToggleSelect}
            className={`w-5 h-5 rounded-lg border-2 transition-all ${
              isSelected 
                ? 'bg-blue-500 border-blue-500 text-white' 
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
            }`}
          >
            {isSelected && <CheckCircle className="w-4 h-4" />}
          </button>
        </div>

        <div className="p-4 pl-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              {/* Category Icon */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="relative"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
                  style={{ backgroundColor: `${getCategoryColor(transaction.category)}20` }}
                >
                  {getCategoryIcon(transaction.category)}
                </div>
                {isCredit ? (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <TrendingDown className="w-3 h-3 text-white" />
                  </div>
                )}
              </motion.div>

              {/* Transaction Details */}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-lg text-gray-900 dark:text-white">
                    {transaction.description}
                  </p>
                  {transaction.isRecurring && (
                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium">
                      Recurring
                    </span>
                  )}
                  {transaction.isFlagged && (
                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-medium">
                      Flagged
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                    {transaction.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Building2 className="w-3 h-3" />
                    <span>{transaction.merchant}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(transaction.date)}</span>
                  </div>
                  {transaction.receipt && (
                    <div className="flex items-center gap-1 text-xs text-blue-500">
                      <Image className="w-3 h-3" />
                      <span>Receipt</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {transaction.tags && transaction.tags.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {transaction.tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs">
                        #{tag}
                      </span>
                    ))}
                    {transaction.tags.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 rounded-full text-xs">
                        +{transaction.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="text-right">
                <motion.p 
                  initial={{ scale: 1 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  className={`text-2xl font-bold ${
                    isCredit ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {isCredit ? '+' : '-'} {formatCurrency(transaction.amount)}
                </motion.p>
                {transaction.originalAmount && transaction.originalAmount !== transaction.amount && (
                  <p className="text-xs text-gray-500 mt-1">
                    Original: {formatCurrency(transaction.originalAmount)}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onToggleExpand}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                </motion.button>
                
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowActions(!showActions)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </motion.button>
                  
                  <AnimatePresence>
                    {showActions && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50 border border-gray-100 dark:border-gray-700"
                      >
                        <div className="py-1">
                          {onView && (
                            <button
                              onClick={() => { onView(); setShowActions(false) }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" /> View Details
                            </button>
                          )}
                          {onDuplicate && (
                            <button
                              onClick={() => { onDuplicate(); setShowActions(false) }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Copy className="w-4 h-4" /> Duplicate
                            </button>
                          )}
                          {onShare && (
                            <button
                              onClick={() => { onShare(); setShowActions(false) }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Share2 className="w-4 h-4" /> Share
                            </button>
                          )}
                          <button
                            onClick={() => { onEdit(); setShowActions(false) }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Edit2 className="w-4 h-4 text-yellow-500" /> Edit
                          </button>
                          <button
                            onClick={() => { onDelete(); setShowActions(false) }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" /> Delete
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Receipt className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Transaction ID:</span>
                      <span className="font-mono text-xs">{transaction._id}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(transaction._id)
                          toast.success('ID copied to clipboard')
                        }}
                        className="ml-auto text-blue-500 hover:text-blue-600"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Created:</span>
                      <span>{formatDate(transaction.createdAt, 'long')}</span>
                    </div>
                    {transaction.updatedAt && transaction.updatedAt !== transaction.createdAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">Last Modified:</span>
                        <span>{formatDate(transaction.updatedAt, 'long')}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Payment Method:</span>
                      <span>{transaction.paymentMethod || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Reference:</span>
                      <span>{transaction.reference || 'N/A'}</span>
                    </div>
                    {transaction.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">Location:</span>
                        <span>{transaction.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Tax:</span>
                      <span>{transaction.tax ? formatCurrency(transaction.tax) : 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Invoice #:</span>
                      <span>{transaction.invoiceNumber || 'N/A'}</span>
                    </div>
                  </div>

                  {transaction.notes && (
                    <div className="md:col-span-3">
                      <div className="flex items-start gap-2 text-sm">
                        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <span className="text-gray-500">Notes:</span>
                          <p className="mt-1 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                            {transaction.notes}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {transaction.receipt && (
                    <div className="md:col-span-3">
                      <button
                        onClick={() => window.open(transaction.receipt, '_blank')}
                        className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600"
                      >
                        <Image className="w-4 h-4" />
                        View Receipt
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

// Main Component
const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  onEdit, 
  onDelete, 
  onView, 
  onDuplicate,
  onShare,
  isLoading,
  showFilters = true,
  enableBulkActions = true
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'all',
    category: '',
    minAmount: 0,
    maxAmount: Infinity,
    startDate: '',
    endDate: '',
    tags: []
  })
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Get unique categories from transactions
  const uniqueCategories = useMemo(() => {
    const categories = new Set(transactions.map(t => t.category))
    return Array.from(categories)
  }, [transactions])

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchLower) ||
        t.merchant.toLowerCase().includes(searchLower) ||
        t.category.toLowerCase().includes(searchLower)
      )
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type)
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(t => t.category === filters.category)
    }

    // Amount filter
    filtered = filtered.filter(t => 
      t.amount >= filters.minAmount && t.amount <= filters.maxAmount
    )

    // Date filter
    if (filters.startDate) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(filters.startDate))
    }
    if (filters.endDate) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(filters.endDate))
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(t => 
        t.tags && filters.tags.some(tag => t.tags.includes(tag))
      )
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0
      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount
      } else if (sortBy === 'category') {
        comparison = a.category.localeCompare(b.category)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [transactions, filters, sortBy, sortOrder])

  // Stats
  const stats = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0)
    const netTotal = totalIncome - totalExpenses
    
    return { totalIncome, totalExpenses, netTotal }
  }, [filteredTransactions])

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredTransactions.map(t => t._id)))
    }
  }, [filteredTransactions, selectedIds.size])

  const handleBulkDelete = useCallback(() => {
    if (window.confirm(`Delete ${selectedIds.size} transactions?`)) {
      selectedIds.forEach(id => onDelete(id))
      setSelectedIds(new Set())
      toast.success(`${selectedIds.size} transactions deleted`)
    }
  }, [selectedIds, onDelete])

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: '',
      type: 'all',
      category: '',
      minAmount: 0,
      maxAmount: Infinity,
      startDate: '',
      endDate: '',
      tags: []
    })
    toast.success('Filters cleared')
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
          </div>
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-xl"
      >
        <div className="inline-flex p-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full mb-4">
          <Receipt className="w-12 h-12 text-blue-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Transactions Found</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Get started by adding your first transaction using the "Add Transaction" button above.
        </p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-4 text-white">
          <p className="text-sm opacity-90">Total Income</p>
          <p className="text-2xl font-bold">{formatCurrency(stats.totalIncome)}</p>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-4 text-white">
          <p className="text-sm opacity-90">Total Expenses</p>
          <p className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</p>
        </div>
        <div className={`bg-gradient-to-r ${stats.netTotal >= 0 ? 'from-blue-500 to-cyan-500' : 'from-orange-500 to-red-500'} rounded-2xl p-4 text-white`}>
          <p className="text-sm opacity-90">Net Total</p>
          <p className="text-2xl font-bold">{formatCurrency(stats.netTotal)}</p>
        </div>
      </motion.div>

      {/* Filters Bar */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4"
        >
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search Input */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Type Filter */}
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="credit">Income</option>
              <option value="debit">Expenses</option>
            </select>

            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Sort Controls */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
                <option value="category">Sort by Category</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Advanced Filters
              {showFilterPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Clear Filters */}
            {(filters.search || filters.type !== 'all' || filters.category || filters.minAmount > 0 || filters.startDate || filters.endDate) && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Advanced Filter Panel */}
          <AnimatePresence>
            {showFilterPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Min Amount</label>
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minAmount || ''}
                      onChange={(e) => setFilters({ ...filters, minAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Amount</label>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxAmount === Infinity ? '' : filters.maxAmount}
                      onChange={(e) => setFilters({ ...filters, maxAmount: parseFloat(e.target.value) || Infinity })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Date</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">End Date</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Bulk Actions Bar */}
      {enableBulkActions && selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedIds.size === filteredTransactions.length}
              onChange={handleSelectAll}
              className="w-5 h-5 rounded border-blue-300"
            />
            <span className="text-sm font-medium">
              {selectedIds.size} transaction{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </button>
            <button
              onClick={() => {
                // Export selected transactions
                const selected = filteredTransactions.filter(t => selectedIds.has(t._id))
                const data = JSON.stringify(selected, null, 2)
                const blob = new Blob([data], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `transactions-${new Date().toISOString()}.json`
                a.click()
                URL.revokeObjectURL(url)
                toast.success('Transactions exported')
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </motion.div>
      )}

      {/* Transactions List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </p>
          {enableBulkActions && filteredTransactions.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              {selectedIds.size === filteredTransactions.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        <AnimatePresence>
          {filteredTransactions.map((transaction, index) => (
            <TransactionCard
              key={transaction._id}
              transaction={transaction}
              index={index}
              isExpanded={expandedId === transaction._id}
              isSelected={selectedIds.has(transaction._id)}
              onToggleExpand={() => setExpandedId(expandedId === transaction._id ? null : transaction._id)}
              onToggleSelect={() => {
                const newSelected = new Set(selectedIds)
                if (newSelected.has(transaction._id)) {
                  newSelected.delete(transaction._id)
                } else {
                  newSelected.add(transaction._id)
                }
                setSelectedIds(newSelected)
              }}
              onEdit={() => onEdit(transaction)}
              onDelete={() => onDelete(transaction._id)}
              onView={onView ? () => onView(transaction) : undefined}
              onDuplicate={onDuplicate ? () => onDuplicate(transaction) : undefined}
              onShare={onShare ? () => onShare(transaction) : undefined}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default TransactionList