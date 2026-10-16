import { createContext } from 'react'
import { ReactReduxContextValue } from 'react-redux'

export const AddonStoreContext = createContext<ReactReduxContextValue | null>(null)
