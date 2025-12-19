import { FC, useState, useCallback, useEffect } from 'react'
import { Dialog, Button, Spacer, SaveButton } from '@ynput/ayon-react-components'
import { ProjectFolderForm, ProjectFolderFormData } from './ProjectFolderForm'
import {
  useCreateProjectFolderMutation,
  useUpdateProjectFolderMutation,
} from '@shared/api/queries/projectFolders'
import { toast } from 'react-toastify'

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
  onPutProjectsInFolder?: ( projectNames: string[], folderId: string,) => void
}

export const ProjectFolderFormDialog: FC<ProjectFolderFormDialogProps> = ({
  isOpen,
  onClose,
  initial,
  folderId,
  projectNames = [],
  onPutProjectsInFolder
}) => {
  const [createFolder] = useCreateProjectFolderMutation()
  const [updateFolder] = useUpdateProjectFolderMutation()

  const mode = folderId ? 'edit' : 'create'

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
    handleClose()
    try {
      if (!!initial?.parentId) {
        console.log('created subfolder')
        await createFolder({
          projectFolderPostModel: {
            label: label,
            data: { icon, color },
            parentId:parentId,
          },
        }).unwrap()
        toast.success('Project folder updated successfully')
      } else if(!!initial?.projectNames){
        const folder = await createFolder({
          projectFolderPostModel: {
            label: label,
            data: { icon, color },
          },
        }).unwrap()
        onPutProjectsInFolder?.(initial.projectNames, folder.id)
        toast.success('Project folder created successfully')

      } else if(mode==='create') {
        await createFolder({
          projectFolderPostModel: {
            label: label,
            data: { icon, color },
            parentId,
          },
        }).unwrap()
        toast.success('Project folder created successfully')
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
  }, [folderForm, mode, folderId, createFolder, updateFolder])

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
    if (projectNames.length > 1) {
      return `Create Folder for ${projectNames.length} Projects`
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
      {mode === 'create' && projectNames.length > 1 && (
        <p style={{ margin: '0 0 16px 0', color: 'var(--color-text-dim)', fontSize: '14px' }}>
          This folder will be assigned to {projectNames.length} selected projects.
        </p>
      )}
      <ProjectFolderForm data={folderForm} onChange={handleFieldChange} autoFocus={true} />
      {error && <span style={{ color: 'var(--color-hl-error)', fontSize: '14px' }}>{error}</span>}
    </Dialog>
  )
}

export default ProjectFolderFormDialog
