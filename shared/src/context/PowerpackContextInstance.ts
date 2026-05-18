import { createContext } from 'react'
import { PowerpackContextType } from './PowerpackContext'

export const PowerpackContext = createContext<PowerpackContextType | undefined>(undefined)
