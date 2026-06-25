import axios from 'axios'

// ✅ Add /api to the URL
const API_URL = import.meta.env.VITE_API_URL || 'https://smart-finance-paisavedh.onrender.com'

console.log('🔗 API_URL:', API_URL)

const api = axios.create({
  baseURL: API_URL,  // Now this already includes /api
  headers: {
    'Content-Type': 'application/json',
  },
})

// Rest of your code remains the same...

/* =========================
   REQUEST INTERCEPTOR
========================= */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

/* =========================
   RESPONSE INTERCEPTOR
========================= */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')

        const response = await axios.post(
          `${API_URL}/api/auth/refresh`,
          { refreshToken }
        )

        const { token, refreshToken: newRefreshToken } = response.data

        localStorage.setItem('token', token)
        localStorage.setItem('refreshToken', newRefreshToken)

        originalRequest.headers.Authorization = `Bearer ${token}`

        return api(originalRequest)
      } catch (refreshError) {
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

/* =========================
   AUTH SERVICE
========================= */
export const authService = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  logout: () =>
    api.post('/auth/logout'),

  getProfile: () =>
    api.get('/auth/profile'),

  updateProfile: (data: any) =>
    api.put('/auth/profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', data),
}

/* =========================
   TRANSACTIONS
========================= */
export const transactionService = {
  getAll: (params?: any) =>
    api.get('/transactions', { params }),

  create: (data: any) =>
    api.post('/transactions', data),

  update: (id: string, data: any) =>
    api.put(`/transactions/${id}`, data),

  delete: (id: string) =>
    api.delete(`/transactions/${id}`),

  uploadCSV: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    return api.post('/transactions/upload-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getStats: () =>
    api.get('/transactions/stats'),
}

/* =========================
   BUDGETS
========================= */
export const budgetService = {
  getAll: (params?: any) =>
    api.get('/budgets', { params }),

  create: (data: any) =>
    api.post('/budgets', data),

  update: (id: string, data: any) =>
    api.put(`/budgets/${id}`, data),

  delete: (id: string) =>
    api.delete(`/budgets/${id}`),

  getAlerts: () =>
    api.get('/budgets/alerts'),
}

/* =========================
   ANALYTICS
========================= */
export const analyticsService = {
  getDashboard: () =>
    api.get('/analytics/dashboard'),

  getInsights: () =>
    api.get('/analytics/insights'),

  getCashFlow: () =>
    api.get('/analytics/cashflow'),
}

/* =========================
   SAVINGS
========================= */
export const savingsService = {
  getAll: () =>
    api.get('/savings/goals'),

  create: (data: any) =>
    api.post('/savings/goals', data),

  update: (id: string, data: any) =>
    api.put(`/savings/goals/${id}`, data),

  delete: (id: string) =>
    api.delete(`/savings/goals/${id}`),

  addContribution: (id: string, data: { amount: number; description: string }) =>
    api.post(`/savings/goals/${id}/contribute`, data),
}

/* =========================
   REPORTS
========================= */
export const reportService = {
  generate: (params?: any) =>
    api.get('/reports/generate', { params }),

  export: (params?: any) =>
    api.get('/reports/export', { params, responseType: 'blob' }),

  send: (data: any) =>
    api.post('/reports/send', data),
}

export default api