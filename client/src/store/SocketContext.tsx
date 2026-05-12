import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react'
import { getSocket, disconnectSocket } from '../services/socket'
import { useAuthStore } from './authStore'
import { Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  joinBusiness: () => void
  joinTable: (tableId: string) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      socketRef.current = getSocket()
    }
    return () => {
      if (!isAuthenticated) {
        disconnectSocket()
        socketRef.current = null
      }
    }
  }, [isAuthenticated])

  const joinBusiness = useCallback(() => {
    // Auto-joined on server via auth
  }, [])

  const joinTable = useCallback((tableId: string) => {
    socketRef.current?.emit('join:table', tableId)
  }, [])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, joinBusiness, joinTable }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocket must be used within SocketProvider')
  return ctx
}
