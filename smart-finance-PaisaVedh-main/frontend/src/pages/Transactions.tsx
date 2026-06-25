import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Search, Filter, Download, Upload, Trash2, Edit, 
  ChevronLeft, ChevronRight, X, Calendar, Tag, DollarSign,
  FileText, Image as ImageIcon, Eye, TrendingUp, TrendingDown
} from 'lucide-react'
import { useTransactionStore } from '../store/transaction.store'
import { formatCurrency, formatDate, getCategoryIcon, getCategoryColor } from '../utils/formatters'
import { CATEGORIES } from '../utils/constants'
import TransactionForm from '../components/transactions/TransactionForm'
import CSVUploader from '../components/transactions/CSVUploader'
import toast from 'react-hot-toast'

const Transactions = () => {
  const { transactions, isLoading, totalPages, currentPage, fetchTransactions, deleteTransaction } = useTransactionStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState(null)

  useEffect(() => {
    fetchTransactions(1)
  }, [])

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions]
    
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.merchant.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(t => t.category === selectedCategory)
    }
    
    if (selectedType) {
      filtered = filtered.filter(t => t.type === selectedType)
    }
    
    if (dateRange.start) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(dateRange.start))
    }
    if (dateRange.end) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(dateRange.end))
    }
    
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    return filtered
  }, [transactions, searchTerm, selectedCategory, selectedType, dateRange])

  // Calculate totals
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0)
    const expenses = filteredTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0)
    return { income, expenses, balance: income - expenses }
  }, [filteredTransactions])

  const handleDelete = async () => {
    if (transactionToDelete) {
      await deleteTransaction(transactionToDelete)
      toast.success('Transaction deleted successfully!')
      setShowDeleteConfirm(false)
      setTransactionToDelete(null)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedType('')
    setDateRange({ start: '', end: '' })
  }

  const hasActiveFilters = searchTerm || selectedCategory || selectedType || dateRange.start || dateRange.end

  // Export to CSV
  const handleExport = () => {
    const headers = ['Date', 'Description', 'Category', 'Merchant', 'Type', 'Amount']
    const csvRows = [headers.join(',')]
    
    filteredTransactions.forEach(t => {
      const row = [
        `"${formatDate(t.date)}"`,
        `"${t.description}"`,
        `"${t.category}"`,
        `"${t.merchant}"`,
        t.type === 'credit' ? 'Income' : 'Expense',
        t.type === 'credit' ? t.amount : -t.amount
      ]
      csvRows.push(row.join(','))
    })
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Transactions exported successfully!')
  }

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 sm:h-96">
        <div className="relative">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 animate-pulse" />
          </div>
        </div>
        <p className="mt-4 text-gray-500 text-sm sm:text-base">Loading your transactions...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-8">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Transactions
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage and track all your financial transactions
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleExport}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 dark:bg-gray-800 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" /> Export
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 dark:bg-gray-800 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center gap-2 text-sm"
            >
              <Upload className="w-4 h-4" /> Import
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-3 sm:p-4 text-white">
            <p className="text-xs sm:text-sm opacity-90">Total Income</p>
            <p className="text-lg sm:text-2xl font-bold">{formatCurrency(totals.income)}</p>
          </div>
          <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-3 sm:p-4 text-white">
            <p className="text-xs sm:text-sm opacity-90">Total Expenses</p>
            <p className="text-lg sm:text-2xl font-bold">{formatCurrency(totals.expenses)}</p>
          </div>
          <div className={`bg-gradient-to-r ${totals.balance >= 0 ? 'from-blue-500 to-cyan-500' : 'from-orange-500 to-red-500'} rounded-xl p-3 sm:p-4 text-white`}>
            <p className="text-xs sm:text-sm opacity-90">Net Balance</p>
            <p className="text-lg sm:text-2xl font-bold">{formatCurrency(totals.balance)}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 mb-6">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <div className="flex-1 min-w-[150px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 sm:py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Categories</option>
              {[...CATEGORIES.EXPENSES, ...CATEGORIES.INCOME].map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Types</option>
              <option value="credit">Income</option>
              <option value="debit">Expense</option>
            </select>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-1.5 sm:py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center gap-1 text-sm"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Date</span>
            </button>
            
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 sm:py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all text-sm"
              >
                Clear
              </button>
            )}
          </div>

          {/* Date Range Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">End Date</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
          {/* Mobile Card View (for small screens) */}
          <div className="block sm:hidden divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No transactions found</p>
              </div>
            ) : (
              filteredTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                        style={{ backgroundColor: `${getCategoryColor(transaction.category)}20` }}
                      >
                        {getCategoryIcon(transaction.category)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{transaction.description}</p>
                        <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                      </div>
                    </div>
                    <div className={`font-semibold ${transaction.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                      {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {transaction.category}
                      </span>
                      <span className="text-xs text-gray-500">{transaction.merchant}</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEditingTransaction(transaction)}
                        className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 text-blue-500" />
                      </button>
                      <button 
                        onClick={() => {
                          setTransactionToDelete(transaction._id)
                          setShowDeleteConfirm(true)
                        }}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Merchant</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-500">Loading...</td></tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-500">No transactions found</td></tr>
                ) : (
                  filteredTransactions.map((transaction, index) => (
                    <motion.tr
                      key={transaction._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{formatDate(transaction.date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{transaction.description}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs" style={{ backgroundColor: `${getCategoryColor(transaction.category)}20`, color: getCategoryColor(transaction.category) }}>
                          {getCategoryIcon(transaction.category)} {transaction.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{transaction.merchant}</td>
                      <td className={`px-4 py-3 text-right font-semibold text-sm ${transaction.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                        {transaction.type === 'credit' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => setSelectedTransaction(transaction)}
                            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4 text-blue-500" />
                          </button>
                          <button 
                            onClick={() => setEditingTransaction(transaction)}
                            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4 text-blue-500" />
                          </button>
                          <button 
                            onClick={() => {
                              setTransactionToDelete(transaction._id)
                              setShowDeleteConfirm(true)
                            }}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => fetchTransactions(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50 flex items-center gap-1 text-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => fetchTransactions(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50 flex items-center gap-1 text-sm"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Transaction Count */}
        <div className="mt-4 text-center text-xs sm:text-sm text-gray-500">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="absolute inset-0" onClick={() => setShowDeleteConfirm(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-red-500 to-pink-500 px-5 py-4">
              <h2 className="text-lg font-bold text-white">Delete Transaction</h2>
              <p className="text-white/80 text-xs">This action cannot be undone</p>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-5">
                Are you sure you want to delete this transaction?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium text-sm"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="absolute inset-0" onClick={() => setSelectedTransaction(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`bg-gradient-to-r ${selectedTransaction.type === 'credit' ? 'from-green-500 to-emerald-500' : 'from-red-500 to-pink-500'} px-5 py-4`}>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="absolute top-3 right-3 p-1.5 bg-white/20 rounded-lg"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <h2 className="text-lg font-bold text-white">Transaction Details</h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500">Amount</span>
                <span className={`text-xl font-bold ${selectedTransaction.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                  {selectedTransaction.type === 'credit' ? '+' : '-'}{formatCurrency(selectedTransaction.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Description</span>
                <span className="text-sm font-medium">{selectedTransaction.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Category</span>
                <span className="text-sm">{selectedTransaction.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Merchant</span>
                <span className="text-sm">{selectedTransaction.merchant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Date</span>
                <span className="text-sm">{formatDate(selectedTransaction.date)}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Transaction Form Modal */}
      <TransactionForm
        isOpen={showAddModal}
        onCancel={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false)
          fetchTransactions()
        }}
      />

      {/* Edit Transaction Form */}
      <TransactionForm
        isOpen={!!editingTransaction}
        transaction={editingTransaction}
        onCancel={() => setEditingTransaction(null)}
        onSuccess={() => {
          setEditingTransaction(null)
          fetchTransactions()
        }}
      />

      {/* CSV Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="absolute inset-0" onClick={() => setShowUploadModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowUploadModal(false)} className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-xl font-bold mb-4">Import CSV</h2>
            <CSVUploader onSuccess={() => { setShowUploadModal(false); fetchTransactions() }} />
          </div>
        </div>
      )}
    </div>
  )
}

export default Transactions