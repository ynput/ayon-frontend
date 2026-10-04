import { createContext, useContext } from 'react'

export const RestartContext = createContext()

export const useRestart = () => useContext(RestartContext)
