import { createContext, useContext } from 'react'
import type { ImportDialogContextType } from './ImportDialogProvider'
import { contextLabelForImportContext, itemsLabelForImportContext } from '../steps/common'

export const ImportDialogContext = createContext<ImportDialogContextType | null>(null)

export const useImportDialogContext = () => {
  const context = useContext(ImportDialogContext)
  if (!context) {
    throw new Error('useImportDialogContext must be used within an ImportDialogProvider')
  }
  return context
}

// What the dialog calls the items it imports, and its subtitle: an addon's import names its own.
export const useImportLabels = () => {
  const { importing, addonImport } = useImportDialogContext()
  if (addonImport) {
    return { items: addonImport.itemsLabel, context: addonImport.label ?? '' }
  }
  return {
    items: importing ? itemsLabelForImportContext[importing] : '',
    context: importing ? contextLabelForImportContext[importing] : '',
  }
}
