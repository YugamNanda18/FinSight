import { create } from 'zustand'
import api from '../services/api'
import toast from 'react-hot-toast'

export interface Transaction {
  _id: string
  amount: number
  type: 'credit' | 'debit'
  category: string
  subcategory?: string
  description: string
  merchant: string
  date: string
  tags: string[]
  notes?: string
  receiptUrl?: string
}

interface TransactionState {
  transactions: Transaction[]
  isLoading: boolean
  totalPages: number
  currentPage: number
  fetchTransactions: (page?: number) => Promise<void>
  addTransaction: (data: Partial<Transaction>) => Promise<void>
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  uploadCSV: (file: File) => Promise<void>
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,
  totalPages: 0,
  currentPage: 1,

  fetchTransactions: async (page = 1) => {
    set({ isLoading: true })
    try {
      const response = await api.get('/transactions', { params: { page } })
      set({
        transactions: response.data.data,
        totalPages: response.data.pagination?.pages || 1,
        currentPage: page,
        isLoading: false,
      })
    } catch (error: any) {
      set({ isLoading: false })
      toast.error(error.response?.data?.message || 'Failed to fetch transactions')
    }
  },

  addTransaction: async (data) => {
    set({ isLoading: true })
    try {
      const response = await api.post('/transactions', data)
      set((state) => ({
        transactions: [response.data.data, ...state.transactions],
        isLoading: false,
      }))
      toast.success('Transaction added successfully!')
      get().fetchTransactions()
    } catch (error: any) {
      set({ isLoading: false })
      toast.error(error.response?.data?.message || 'Failed to add transaction')
    }
  },

  updateTransaction: async (id, data) => {
    set({ isLoading: true })
    try {
      const response = await api.put(`/transactions/${id}`, data)
      set((state) => ({
        transactions: state.transactions.map((t) =>
          t._id === id ? response.data.data : t
        ),
        isLoading: false,
      }))
      toast.success('Transaction updated successfully!')
      get().fetchTransactions()
    } catch (error: any) {
      set({ isLoading: false })
      toast.error(error.response?.data?.message || 'Failed to update transaction')
    }
  },

  deleteTransaction: async (id) => {
    set({ isLoading: true })
    try {
      await api.delete(`/transactions/${id}`)
      set((state) => ({
        transactions: state.transactions.filter((t) => t._id !== id),
        isLoading: false,
      }))
      toast.success('Transaction deleted successfully!')
      get().fetchTransactions()
    } catch (error: any) {
      set({ isLoading: false })
      toast.error(error.response?.data?.message || 'Failed to delete transaction')
    }
  },

  uploadCSV: async (file) => {
    set({ isLoading: true })
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await api.post('/transactions/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success(`Successfully processed ${response.data.processed} transactions!`)
      get().fetchTransactions()
      set({ isLoading: false })
    } catch (error: any) {
      set({ isLoading: false })
      toast.error(error.response?.data?.message || 'Failed to upload CSV')
    }
  },
}))