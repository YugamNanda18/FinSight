import { useAuthStore } from '../store/auth.store'

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, login, register, logout, updateProfile } = useAuthStore()
  
  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  }
}