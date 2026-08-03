import { createContext } from 'react'
import { NewEntityContextType } from './NewEntityContext'

export const NewEntityContext = createContext<NewEntityContextType | undefined>(undefined)
