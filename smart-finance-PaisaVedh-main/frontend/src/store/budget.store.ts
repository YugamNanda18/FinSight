import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import toast from 'react-hot-toast'

export interface Budget {
  _id: string
  category: string
  amount: number
  spent: number
  remaining: number
  percentageUsed: number
  status: 'on_track' | 'warning' | 'exceeded'
  createdAt: string
  updatedAt: string
}

interface BudgetStore {
  budgets: Budget[]
  isLoading: boolean
  addBudget: (data: { category: string; amount: number }) => void
  updateBudget: (id: string, data: { category: string; amount: number }) => void
  deleteBudget: (id: string) => void
  fetchBudgets: () => void
}

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set, get) => ({
      budgets: [],
      isLoading: false,

      fetchBudgets: () => {
        set({ isLoading: false })
      },

      addBudget: ({ category, amount }) => {
        const newBudget: Budget = {
          _id: generateId(),
          category,
          amount,
          spent: 0,
          remaining: amount,
          percentageUsed: 0,
          status: 'on_track',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        set((state) => ({
          budgets: [...state.budgets, newBudget]
        }))
        
        toast.success('Budget created successfully!')
      },

      updateBudget: (id, data) => {
        set((state) => ({
          budgets: state.budgets.map((budget) => {
            if (budget._id !== id) return budget
            
            const newAmount = data.amount
            const newRemaining = newAmount - budget.spent
            const newPercentageUsed = budget.spent > 0 ? (budget.spent / newAmount) * 100 : 0
            
            let newStatus: 'on_track' | 'warning' | 'exceeded' = 'on_track'
            if (newPercentageUsed >= 100) newStatus = 'exceeded'
            else if (newPercentageUsed >= 80) newStatus = 'warning'
            
            return {
              ...budget,
              category: data.category,
              amount: newAmount,
              remaining: newRemaining,
              percentageUsed: newPercentageUsed,
              status: newStatus,
              updatedAt: new Date().toISOString()
            }
          })
        }))
        toast.success('Budget updated successfully!')
      },

      deleteBudget: (id) => {
        set((state) => ({
          budgets: state.budgets.filter((budget) => budget._id !== id)
        }))
        toast.success('Budget deleted successfully!')
      },
    }),
    {
      name: 'budget-storage',
    }
  )
)