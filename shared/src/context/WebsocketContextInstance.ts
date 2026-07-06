import { createContext } from 'react'
import { WebsocketContextType } from './WebsocketContext'

export const SocketContext = createContext<WebsocketContextType | undefined>(undefined)
