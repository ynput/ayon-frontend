import { createContext, useContext } from 'react'
import type { ImportDialogContextType } from './ImportDialogProvider'

export const ImportDialogContext = createContext<ImportDialogContextType | null>(null)

export const useImportDialogContext = () => {
  const context = useContext(ImportDialogContext)
  if (!context) {
    throw new Error('useImportDialogContext must be used within an ImportDialogProvider')
  }
  return context
}
