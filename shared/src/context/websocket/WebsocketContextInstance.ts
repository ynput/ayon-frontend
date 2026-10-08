import { createContext, useContext } from 'react'
import type { WebsocketContextType } from './WebsocketContext'

export const SocketContext = createContext<WebsocketContextType | undefined>(undefined)

export const useSocketContext = () => {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocketContext must be used within a SocketProvider')
  }
  return context
}
