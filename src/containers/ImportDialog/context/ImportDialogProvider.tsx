import { PropsWithChildren, useCallback, useState } from "react"
import type { ImportTarget } from "@ynput/ayon-addon"
import { ImportContext } from "../steps/common"
import { ImportDialogContext } from "./ImportDialogProviderInstance"

export type ImportDialogContextType = {
  importing: ImportContext | null
  projectName?: string
  folderId?: string
  // the name of the folder or list imported into, shown in the dialog
  folderLabel?: string
  // the list folder a list created by the import goes into
  listFolderId?: string
  // an addon's import (openImport in @ynput/ayon-addon), when importing is "addon"
  addonImport?: ImportTarget
  openForContext: (
    c: ImportContext,
    projectName?: string,
    folderId?: string,
    folderLabel?: string,
    listFolderId?: string,
  ) => void
  openForAddon: (target: ImportTarget) => void
  close: () => void
}

type ImportDialogProviderProps = PropsWithChildren & {}

export const ImportDialogProvider = ({ children }: ImportDialogProviderProps) => {
  const [importContext, setImportContext] = useState<ImportContext | null>(null)
  const [folderId, setFolderId] = useState<string | undefined>()
  const [folderLabel, setFolderLabel] = useState<string | undefined>()
  const [listFolderId, setListFolderId] = useState<string | undefined>()
  const [projectName, setProjectName] = useState<string | undefined>()
  const [addonImport, setAddonImport] = useState<ImportTarget | undefined>()

  const openForContext = useCallback((
    c: ImportContext,
    projectName?: string,
    folderId?: string,
    folderLabel?: string,
    listFolderId?: string,
  ) => {
    setImportContext(c)
    setFolderId(folderId)
    setFolderLabel(folderLabel)
    setListFolderId(listFolderId)
    setProjectName(projectName)
    setAddonImport(undefined)
  }, [])

  const openForAddon = useCallback((target: ImportTarget) => {
    setImportContext("addon")
    setFolderId(undefined)
    setFolderLabel(undefined)
    setListFolderId(undefined)
    setProjectName(target.projectName)
    setAddonImport(target)
  }, [])

  const close = useCallback(() => {
    setImportContext(null)
    setFolderId(undefined)
    setFolderLabel(undefined)
    setListFolderId(undefined)
    setAddonImport(undefined)
  }, [])

  return (
    <ImportDialogContext.Provider value={{
      importing: importContext,
      folderId,
      folderLabel,
      listFolderId,
      projectName,
      addonImport,
      openForContext,
      openForAddon,
      close,
    }}>
      {children}
    </ImportDialogContext.Provider>
  )
}
