import { FC, useState, useCallback, useEffect } from 'react'
import { Dialog, Button, Spacer, SaveButton } from '@ynput/ayon-react-components'
import { useListsContext } from '@pages/ProjectListsPage/context'
import { ListFolderForm, ListFolderFormData } from './ListFolderForm'

export interface FolderFormData extends ListFolderFormData {
  id?: string // if id is present, it's edit mode
}

interface ListFolderFormDialogProps {}

export const ListFolderFormDialog: FC<ListFolderFormDialogProps> = ({}) => {
  const {
    listFolderOpen: { isOpen, initial, folderId, listIds = [] },
    setListFolderOpen,
    onCreateListFolder,
    onUpdateListFolder,
  } = useListsContext()
  const mode = folderId ? 'edit' : 'create'
  const listCount = listIds.length

  const initFolderForm: FolderFormData = { label: '' }
  const [folderForm, setFolderForm] = useState<FolderFormData>(initFolderForm)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    handleClose()
  }

  const handleSave = useCallback(async () => {
    if (!folderForm.label.trim()) {
      setError('Folder label is required')
      return
    }

    setIsSaving(true)
    setError(null)

    const listIdsToAdd = mode === 'create' ? listIds : []
    const label = folderForm.label.trim()
    const { color, icon, scope, parentId } = folderForm

    try {
      if (mode === 'edit' && folderId) {
        await onUpdateListFolder(folderId, { label, parentId, data: { color, icon, scope } })
      } else {
        await onCreateListFolder(
          {
            label: label,
            icon: icon,
            color: color,
            scope: scope,
            parentId: parentId,
          },
          listIdsToAdd,
        )
      }
    } catch (error) {
      console.error(`Failed to ${mode} folder:`, error)
      setError(`Failed to ${mode} folder`)
    } finally {
      handleClose()
    }
  }, [folderForm, onCreateListFolder, mode])

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
      return 'Edit Folder'
    }
    return listCount > 1 ? `Create Folder for ${listCount} Lists` : 'Create Folder'
  }

  return (
    <Dialog
      header={getDialogHeader()}
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      onKeyDown={handleKeyDown}
      enableBackdropClose={false}
      style={{ maxWidth: 550 }}
      footer={
        <>
          <Button variant="text" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Spacer />
          <SaveButton onClick={handleSave} disabled={!isValid || isSaving} saving={isSaving}>
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
