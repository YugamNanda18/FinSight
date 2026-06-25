import api from './api'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

export interface UpdateProfileData {
  name?: string
  preferences?: {
    currency?: string
    theme?: 'light' | 'dark'
    monthlyBudget?: number
    notificationEnabled?: boolean
  }
}

class AuthService {
  async login(credentials: LoginCredentials) {
    const response = await api.post('/auth/login', credentials)
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('refreshToken', response.data.refreshToken)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response
  }

  async register(data: RegisterData) {
    const response = await api.post('/auth/register', data)
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('refreshToken', response.data.refreshToken)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response
  }

  async logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    }
  }

  async getProfile() {
    const response = await api.get('/auth/profile')
    return response
  }

  async updateProfile(data: UpdateProfileData) {
    const response = await api.put('/auth/profile', data)
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response
  }

  async changePassword(data: ChangePasswordData) {
    const response = await api.put('/auth/change-password', data)
    return response
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) throw new Error('No refresh token')
    
    const response = await api.post('/auth/refresh', { refreshToken })
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('refreshToken', response.data.refreshToken)
    }
    return response
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token')
  }

  getToken(): string | null {
    return localStorage.getItem('token')
  }

  getUser(): any {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  }
}

export const authService = new AuthService()