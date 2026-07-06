import { createContext, PropsWithChildren, useCallback, useContext, useState } from "react"
import { ImportContext } from "../steps/common"

type ImportDialogContextType = {
  importing: ImportContext | null
  projectName?: string
  folderId?: string
  openForContext: (c: ImportContext, projectName?: string, folderId?: string) => void
  close: () => void
}

type ImportDialogProviderProps = PropsWithChildren & {}

const ImportDialogContext = createContext<ImportDialogContextType | null>(null)

export const ImportDialogProvider = ({ children }: ImportDialogProviderProps) => {
  const [importContext, setImportContext] = useState<ImportContext | null>(null)
  const [folderId, setFolderId] = useState<string | undefined>()
  const [projectName, setProjectName] = useState<string | undefined>()

  const openForContext = useCallback((c: ImportContext, projectName?: string, folderId?: string) => {
    setImportContext(c)
    setFolderId(folderId)
    setProjectName(projectName)
  }, [])

  const close = useCallback(() => {
    setImportContext(null)
    setFolderId(undefined)
  }, [])

  return (
    <ImportDialogContext.Provider value={{
      importing: importContext,
      folderId,
      projectName,
      openForContext,
      close,
    }}>
      {children}
    </ImportDialogContext.Provider>
  )
}

export const useImportDialogContext = () => {
  const context = useContext(ImportDialogContext)
  if (!context) {
    throw new Error('useImportDialogContext must be used within an ImportDialogProvider')
  }
  return context
}
