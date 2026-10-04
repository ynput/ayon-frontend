import { createContext, useContext } from 'react'

export const PasteContext = createContext()

export const usePaste = () => useContext(PasteContext)
