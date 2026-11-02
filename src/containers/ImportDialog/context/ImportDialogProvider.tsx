import { PropsWithChildren, useCallback, useState } from "react"
import { ImportContext } from "../steps/common"
import { ImportDialogContext } from "./ImportDialogProviderInstance"

export type ImportDialogContextType = {
  importing: ImportContext | null
  projectName?: string
  folderId?: string
  // the name of the folder or list imported into, shown in the dialog
  folderLabel?: string
  openForContext: (
    c: ImportContext,
    projectName?: string,
    folderId?: string,
    folderLabel?: string,
  ) => void
  close: () => void
}

type ImportDialogProviderProps = PropsWithChildren & {}

export const ImportDialogProvider = ({ children }: ImportDialogProviderProps) => {
  const [importContext, setImportContext] = useState<ImportContext | null>(null)
  const [folderId, setFolderId] = useState<string | undefined>()
  const [folderLabel, setFolderLabel] = useState<string | undefined>()
  const [projectName, setProjectName] = useState<string | undefined>()

  const openForContext = useCallback((
    c: ImportContext,
    projectName?: string,
    folderId?: string,
    folderLabel?: string,
  ) => {
    setImportContext(c)
    setFolderId(folderId)
    setFolderLabel(folderLabel)
    setProjectName(projectName)
  }, [])

  const close = useCallback(() => {
    setImportContext(null)
    setFolderId(undefined)
    setFolderLabel(undefined)
  }, [])

  return (
    <ImportDialogContext.Provider value={{
      importing: importContext,
      folderId,
      folderLabel,
      projectName,
      openForContext,
      close,
    }}>
      {children}
    </ImportDialogContext.Provider>
  )
}
