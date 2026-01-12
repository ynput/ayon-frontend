import { FC, useState, useCallback, useEffect, useMemo } from 'react'
import { Dialog, Button, Spacer, SaveButton } from '@ynput/ayon-react-components'
import { ProjectFolderForm, ProjectFolderFormData } from './ProjectFolderForm'
import {
  useCreateProjectFolderMutation,
  useUpdateProjectFolderMutation,
} from '@shared/api/queries/projectFolders'
import { toast } from 'react-toastify'
import { RowSelectionState } from '@tanstack/react-table'
import { parseProjectFolderRowId } from '@containers/ProjectsList/buildProjectsTableData'
import { ProjectFolderModel } from '@shared/api'

export interface FolderFormData extends ProjectFolderFormData {
 parentId?: string
  projectNames?: string[]
}

interface ProjectFolderFormDialogProps {
  isOpen: boolean
  onClose: () => void
  initial?: Partial<FolderFormData>
  folderId?: string
  projectNames?: string[]
  onPutProjectsInFolder?: (projectNames: string[], folderId: string) => void
  rowSelection?: RowSelectionState
  folders?: ProjectFolderModel[]
  onFolderCreated?: (folderId: string, hadProjects: boolean) => void
  onFoldersCreated?: (parentFolderIds: string[], areExpanding: boolean) => void
}

export const ProjectFolderFormDialog: FC<ProjectFolderFormDialogProps> = ({
  isOpen,
  onClose,
  initial,
  folderId,
  onPutProjectsInFolder,
  rowSelection = {},
  folders = [],
  onFolderCreated,
  onFoldersCreated,
}) => {
  const [createFolder] = useCreateProjectFolderMutation()
  const [updateFolder] = useUpdateProjectFolderMutation()

  const mode = folderId ? 'edit' : 'create'

  // Analyze selection context when creating folders
  const { projectNamesToAdd, parentIdsToCreateIn, foldersToCreateIn, projectCount } = useMemo(() => {
    if (mode !== 'create') {
      return { projectNamesToAdd: [], parentIdsToCreateIn: [], foldersToCreateIn: [], projectCount: 0 }
    }

    // Parse selection to separate projects from folders
    const selectedProjectNames = Object.keys(rowSelection).filter(
      (rowId) => !parseProjectFolderRowId(rowId)
    )
    const selectedFolderIds = Object.keys(rowSelection)
      .map((rowId) => parseProjectFolderRowId(rowId))
      .filter((id): id is string => !!id)

    // Determine context: if folders are selected, create subfolders
    // Otherwise if projects are selected, put them in the new folder
    const projectNamesToAdd = selectedFolderIds.length === 0 ? selectedProjectNames : []
    const parentIdsToCreateIn = selectedFolderIds.length > 0 ? selectedFolderIds : []

    const foldersToCreateIn = parentIdsToCreateIn
      .map((id) => folders?.find((f) => f.id === id))
      .filter((f): f is ProjectFolderModel => !!f)

    return {
      projectNamesToAdd,
      parentIdsToCreateIn,
      foldersToCreateIn,
      projectCount: projectNamesToAdd.length,
    }
  }, [mode, rowSelection, folders])

  const initFolderForm: FolderFormData = {
    label: '',
  }
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
    onClose()
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
    const { color, icon, parentId } = folderForm

    try {
      if (mode === 'edit' && folderId) {
        await updateFolder({
          folderId,
          projectFolderPatchModel: {
            label,
            data: { icon: icon|| "", color: color || "" },
          },
        }).unwrap()
        toast.success('Project folder updated successfully')
        handleClose()
      } else if (mode === 'create') {
        handleClose()

        // Create new folder - handle different scenarios
        if (parentIdsToCreateIn.length > 0) {

          onFoldersCreated?.(parentIdsToCreateIn, true)

          Promise.all(
            parentIdsToCreateIn.map((parentId) =>
              createFolder({
                projectFolderPostModel: {
                  label,
                  data: { icon, color },
                  parentId,
                },
              }).unwrap()
            )
          )
            .then(() => {
              toast.success(
                parentIdsToCreateIn.length === 1
                  ? 'Subfolder created successfully'
                  : `${parentIdsToCreateIn.length} subfolders created successfully`
              )
            })
            .catch((error) => {
              console.error('Failed to create subfolders:', error)
              const errorMessage =
                (error as any)?.data?.detail || 'Failed to create subfolders. Please try again.'
              toast.error(errorMessage)
            })
        } else if (projectNamesToAdd.length > 0) {
          // Scenario 2: Create folder and assign selected projects to it
          createFolder({
            projectFolderPostModel: {
              label,
              data: { icon, color },
            },
          })
            .unwrap()
            .then((folder) => {
              // Optimistically expand folder to show projects
              onFolderCreated?.(folder.id, true)
              return onPutProjectsInFolder?.(projectNamesToAdd, folder.id)
            })
            .then(() => {
              toast.success('Project folder created successfully')
            })
            .catch((error) => {
              console.error('Failed to create folder:', error)
              const errorMessage =
                (error as any)?.data?.detail || 'Failed to create folder. Please try again.'
              toast.error(errorMessage)
            })
        } else {
          // Scenario 3: Simple folder creation at root level
          createFolder({
            projectFolderPostModel: {
              label,
              data: { icon, color },
              parentId,
            },
          })
            .unwrap()
            .then((folder) => {
              // Optimistically select the new empty folder
              onFolderCreated?.(folder.id, false)
              toast.success('Project folder created successfully')
            })
            .catch((error) => {
              console.error('Failed to create folder:', error)
              const errorMessage =
                (error as any)?.data?.detail || 'Failed to create folder. Please try again.'
              toast.error(errorMessage)
            })
        }
      }
    } catch (error) {
      console.error(`Failed to ${mode} folder:`, error)
      const errorMessage =
        (error as any)?.data?.detail || `Failed to ${mode} folder. Please try again.`
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }, [
    folderForm,
    mode,
    folderId,
    createFolder,
    updateFolder,
    parentIdsToCreateIn,
    projectNamesToAdd,
    onPutProjectsInFolder,
    onFolderCreated,
    onFoldersCreated,
  ])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSave()
      } else if (e.key === 'Escape') {
        handleClose()
      }
    },
    [handleSave],
  )

  const handleFieldChange = useCallback(
    (field: keyof ProjectFolderFormData, value: string | undefined) => {
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
      return `Edit Folder${initial?.label ? `: ${initial.label}` : ''}`
    }
    if (foldersToCreateIn.length > 0) {
      if (foldersToCreateIn.length > 2) {
        return `Create Folder in ${foldersToCreateIn.length} locations`
      }
      const folderNames = foldersToCreateIn.map((f) => f?.label).join(', ')
      return `Create Folder in: ${folderNames}`
    }
    if (projectCount > 1) {
      return `Create Folder for ${projectCount} Projects`
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
      {mode === 'create' && projectCount > 1 && (
        <p style={{ margin: '0 0 16px 0', color: 'var(--color-text-dim)', fontSize: '14px' }}>
          This folder will be assigned to {projectCount} selected projects.
        </p>
      )}
      <ProjectFolderForm data={folderForm} onChange={handleFieldChange} autoFocus={true} />
      {error && <span style={{ color: 'var(--color-hl-error)', fontSize: '14px' }}>{error}</span>}
    </Dialog>
  )
}

export default ProjectFolderFormDialog
