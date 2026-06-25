import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../store/auth.store'
import toast from 'react-hot-toast'

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const { token } = useAuthStore()

  useEffect(() => {
    if (!token) return

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5002'
    const ws = new WebSocket(`${wsUrl}?token=${token}`)
    
    ws.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
    }
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'budget_alert':
          toast.error(data.message, { duration: 10000 })
          break
        case 'transaction_added':
          toast.success('New transaction added', { duration: 3000 })
          break
        case 'goal_achieved':
          toast.success(`🎉 ${data.message}`, { duration: 8000 })
          break
        default:
          console.log('WebSocket message:', data)
      }
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setIsConnected(false)
    }
    
    ws.onclose = () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
    }
    
    wsRef.current = ws
    
    return () => {
      ws.close()
    }
  }, [token])

  return { isConnected, ws: wsRef.current }
}