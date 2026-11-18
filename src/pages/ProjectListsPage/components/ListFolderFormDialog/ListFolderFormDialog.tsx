import { FC, useState, useCallback, useEffect, useRef } from 'react'
import { Dialog, Button, Spacer, SaveButton } from '@ynput/ayon-react-components'
import { toast } from 'react-toastify'
import {
  getCreateAnotherTooltip,
  getDialogKeyDown,
  readDialogMemory,
  writeDialogMemory,
} from '@shared/util'
import { useProjectContext } from '@shared/context'
import { useListsContext } from '@pages/ProjectListsPage/context'
import { FolderForm, FolderFormData } from '@shared/components/FolderForm'
import { useListsDataContext } from '@pages/ProjectListsPage/context/lists-data'
import { parseListFolderRowId } from '@pages/ProjectListsPage/util'

export interface ListFolderFormData extends FolderFormData {
  id?: string // if id is present, it's edit mode
}

interface ListFolderFormDialogProps {}

// Where the last folder went, and the folders made there. A new folder is selected once it is
// made, so without this the next one would be created inside it instead of next to it.
type ParentMemory = { parentIds: string[]; createdIds: string[] }
const parentMemoryKey = (isReview?: boolean) =>
  isReview ? 'review-list-folder-parent' : 'list-folder-parent'

export const ListFolderFormDialog: FC<ListFolderFormDialogProps> = ({}) => {
  const {
    listFolderOpen: { isOpen, initial, folderId, parentId, rowIds },
    setListFolderOpen,
    onCreateListFolder,
    onUpdateListFolder,
    selectedRows,
    selectedList,
    isReview,
  } = useListsContext()

  const { listFolders, listsMap } = useListsDataContext()
  const { projectName } = useProjectContext()
  const formRef = useRef<HTMLDivElement>(null)

  const mode = folderId ? 'edit' : 'create'

  const editingFolder = listFolders?.find((f) => f.id === folderId)

  const initFolderForm: ListFolderFormData = {
    label: '',
    scope: [isReview ? 'review-session' : 'generic'],
  }
  const [folderForm, setFolderForm] = useState<ListFolderFormData>(initFolderForm)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // when creating a folder, we need to derive the context from the selection, or from the rows
  // of the context menu that opened the dialog
  const targetRows = rowIds ?? selectedRows
  const selectedListIds = targetRows.filter((id) => !parseListFolderRowId(id))
  const selectedFolderIds = targetRows
    .map((id) => parseListFolderRowId(id))
    .filter((id): id is string => !!id)
  const targetList = rowIds ? listsMap.get(selectedListIds[0]) : selectedList

  const listIdsToAdd =
    mode === 'create' && !parentId && selectedFolderIds.length === 0 ? selectedListIds : []
  // the selection is just the folders this dialog made last time: create next to them again
  const rememberedParent = readDialogMemory<ParentMemory>(parentMemoryKey(isReview), projectName)
  const selectionIsLastCreated =
    !parentId &&
    selectedListIds.length === 0 &&
    selectedFolderIds.length > 0 &&
    selectedFolderIds.every((id) => rememberedParent.createdIds?.includes(id))
  const parentIdsToCreateIn =
    mode === 'create'
      ? parentId
        ? [parentId]
        : selectionIsLastCreated
        ? (rememberedParent.parentIds || []).filter((id) => listFolders?.some((f) => f.id === id))
        : selectedFolderIds.length > 0
        ? selectedFolderIds
        : targetList?.entityListFolderId
        ? [targetList.entityListFolderId]
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

  // keepOpen (Shift+Enter): create the folder and keep the dialog open for the next one
  const handleSave = useCallback(
    async (keepOpen = false) => {
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
          const createdIds = await onCreateListFolder(
            {
              label: label,
              icon: icon,
              color: color,
              scope: scope,
            },
            listIdsToAdd,
            parentIdsToCreateIn,
          )
          writeDialogMemory<ParentMemory>(
            parentMemoryKey(isReview),
            { parentIds: parentIdsToCreateIn, createdIds },
            projectName,
          )
          if (keepOpen && createdIds.length) {
            toast.success(`Folder "${label}" created`)
            setFolderForm((prev) => ({ ...prev, label: '' }))
            setIsSaving(false)
            formRef.current?.querySelector('input')?.focus()
            return
          }
        }
        handleClose()
      } catch (error) {
        setError(`Failed to ${mode} folder`)
        setIsSaving(false)
      }
    },
    [
      isReview,
      projectName,
      folderForm,
      onCreateListFolder,
      mode,
      listIdsToAdd,
      parentIdsToCreateIn,
      onUpdateListFolder,
      folderId,
      handleClose,
    ],
  )

  const handleFieldChange = useCallback(
    (field: keyof FolderFormData, value: string | string[] | undefined) => {
      setFolderForm((prev) => ({
        ...prev,
        [field]: value,
      }))
      setError(null)
    },
    [],
  )

  const isValid = folderForm.label.trim()

  const handleKeyDown = getDialogKeyDown(() => handleSave(), {
    onClose: handleClose,
    disabled: !isValid || isSaving,
    onContinue: mode === 'create' ? () => handleSave(true) : undefined,
  })

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
            onClick={() => handleSave()}
            disabled={!isValid || isSaving}
            saving={isSaving}
            icon={mode === 'edit' ? 'check' : 'add'}
            {...(mode === 'create' ? getCreateAnotherTooltip() : { 'data-shortcut': 'Enter' })}
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
      <div ref={formRef}>
        <FolderForm
          data={folderForm}
          onChange={handleFieldChange}
          autoFocus={true}
          scopeConfig={{
            options: [
              { value: 'generic', label: 'Lists' },
              { value: 'review-session', label: 'Review Sessions' },
            ],
            filter: isReview ? ['review-session'] : ['generic'],
          }}
        />
      </div>
      {error && <span style={{ color: 'var(--color-hl-error)', fontSize: '14px' }}>{error}</span>}
    </Dialog>
  )
}

export default ListFolderFormDialog
