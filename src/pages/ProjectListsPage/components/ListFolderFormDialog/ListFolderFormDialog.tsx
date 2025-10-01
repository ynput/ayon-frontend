import { FC, useState, useCallback, useEffect } from 'react'
import { Dialog, Button, Spacer, SaveButton } from '@ynput/ayon-react-components'
import { useListsContext } from '@pages/ProjectListsPage/context'
import { ListFolderForm, ListFolderFormData } from './ListFolderForm'
import { useListsDataContext } from '@pages/ProjectListsPage/context/ListsDataContext'
import { parseListFolderRowId } from '@pages/ProjectListsPage/util'

export interface FolderFormData extends ListFolderFormData {
  id?: string // if id is present, it's edit mode
}

interface ListFolderFormDialogProps {}

export const ListFolderFormDialog: FC<ListFolderFormDialogProps> = ({}) => {
  const {
    listFolderOpen: { isOpen, initial, folderId },
    setListFolderOpen,
    onCreateListFolder,
    onUpdateListFolder,
    selectedRows,
    selectedList,
    isReview,
  } = useListsContext()

  const { listFolders } = useListsDataContext()

  const mode = folderId ? 'edit' : 'create'

  const editingFolder = listFolders?.find((f) => f.id === folderId)

  const initFolderForm: FolderFormData = {
    label: '',
    scope: [isReview ? 'review-session' : 'generic'],
  }
  const [folderForm, setFolderForm] = useState<FolderFormData>(initFolderForm)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // when creating a folder, we need to derive the context from the selection
  const selectedListIds = selectedRows.filter((id) => !parseListFolderRowId(id))
  const selectedFolderIds = selectedRows
    .map((id) => parseListFolderRowId(id))
    .filter((id): id is string => !!id)

  const listIdsToAdd = mode === 'create' && selectedFolderIds.length === 0 ? selectedListIds : []
  const parentIdsToCreateIn =
    mode === 'create'
      ? selectedFolderIds.length > 0
        ? selectedFolderIds
        : selectedList?.entityListFolderId
        ? [selectedList.entityListFolderId]
        : []
      : []

  const listCount = listIdsToAdd.length

  const foldersToCreateIn =
    parentIdsToCreateIn?.map((id) => listFolders?.find((f) => f.id === id)).filter((f) => !!f) || []

  // Update folder data when initial folder changes (for edit mode)
  useEffect(() => {
    if (isOpen) {
      setFolderForm({
        ...initFolderForm,
        ...initial,
      })
      setError(null)
    }
  }, [isOpen, initial, mode])

  const handleClose = () => {
    setListFolderOpen({ isOpen: false })
    setFolderForm(initFolderForm)
    setError(null)
    setIsSaving(false)
  }

  const handleSave = useCallback(async () => {
    if (!folderForm.label.trim()) {
      setError('Folder label is required')
      return
    }

    setIsSaving(true)
    setError(null)

    const label = folderForm.label.trim()
    const { color, icon, scope, parentId } = folderForm

    try {
      if (mode === 'edit' && folderId) {
        await onUpdateListFolder(folderId, {
          label,
          parentId: parentId,
          data: { color, icon, scope },
        })
      } else {
        await onCreateListFolder(
          {
            label: label,
            icon: icon,
            color: color,
            scope: scope,
          },
          listIdsToAdd,
          parentIdsToCreateIn,
        )
      }
    } catch (error) {
      console.error(`Failed to ${mode} folder:`, error)
      setError(`Failed to ${mode} folder`)
    } finally {
      handleClose()
    }
  }, [
    folderForm,
    onCreateListFolder,
    mode,
    listIdsToAdd,
    parentIdsToCreateIn,
    onUpdateListFolder,
    folderId,
    handleClose,
  ])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSave()
      } else if (e.key === 'Escape') {
        handleClose()
      }
    },
    [handleSave, handleClose],
  )

  const handleFieldChange = useCallback(
    (field: keyof ListFolderFormData, value: string | string[] | undefined) => {
      setFolderForm((prev) => ({
        ...prev,
        [field]: value,
      }))
      setError(null)
    },
    [],
  )

  const isValid = folderForm.label.trim()

  const getDialogHeader = () => {
    if (mode === 'edit') {
      return `Edit Folder${editingFolder ? `: ${editingFolder.label}` : ''}`
    }
    if (foldersToCreateIn.length > 0) {
      if (foldersToCreateIn.length > 2) {
        return `Create Folder in ${foldersToCreateIn.length} locations`
      }
      const folderNames = foldersToCreateIn.map((f) => f?.label).join(', ')
      return `Create Folder in: ${folderNames}`
    }
    if (listCount > 1) {
      return `Create Folder for ${listCount} Lists`
    }
    return 'Create Folder'
  }

  return (
    <Dialog
      header={getDialogHeader()}
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      onKeyDown={handleKeyDown}
      enableBackdropClose={false}
      style={{ maxWidth: 450, maxHeight: '90vh' }}
      footer={
        <>
          <Button variant="text" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Spacer />
          <SaveButton
            onClick={handleSave}
            disabled={!isValid || isSaving}
            saving={isSaving}
            icon={mode === 'edit' ? 'check' : 'add'}
          >
            {mode === 'edit' ? 'Save folder' : 'Create folder'}
          </SaveButton>
        </>
      }
    >
      {mode === 'create' && listCount > 1 && (
        <p style={{ margin: '0 0 16px 0', color: 'var(--color-text-dim)', fontSize: '14px' }}>
          This folder will be assigned to {listCount} selected lists.
        </p>
      )}
      <ListFolderForm data={folderForm} onChange={handleFieldChange} autoFocus={true} />
      {error && <span style={{ color: 'var(--color-hl-error)', fontSize: '14px' }}>{error}</span>}
    </Dialog>
  )
}

export default ListFolderFormDialog
