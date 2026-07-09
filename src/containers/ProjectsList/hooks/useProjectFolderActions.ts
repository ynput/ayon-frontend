import { useCallback, useState } from 'react'
import {
  useAssignProjectsToFolderMutation,
  useDeleteProjectFolderMutation,
  useUpdateProjectFolderMutation,
  useUpdateProjectMutation,
  ProjectFolderModel,
} from '@shared/api'
import { getErrorMessage, handleDeleteFolders } from '@shared/util'
import { ProjectFolderFormData } from '@pages/ProjectManagerPage/components/ProjectFolderFormDialog'
import { toast } from 'react-toastify'

interface UseProjectFolderActionsProps {
  folders?: ProjectFolderModel[]
  onSelect: (ids: string[]) => void
  handleOpenFolderDialog: (data?: Partial<ProjectFolderFormData>, folderId?: string) => void
}

export const useProjectFolderActions = ({
  folders,
  onSelect,
  handleOpenFolderDialog,
}: UseProjectFolderActionsProps) => {
  const [assignProjectsToFolder] = useAssignProjectsToFolderMutation()
  const [assignFolderToFolder] = useUpdateProjectFolderMutation()
  const [deleteProjectFolder] = useDeleteProjectFolderMutation()
  const [updateProjectFolder] = useUpdateProjectFolderMutation()
  const [updateProject] = useUpdateProjectMutation()

  // Folder renaming state
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null)
  // Project label inline-editing state (row id = project.name)
  const [renamingProject, setRenamingProject] = useState<string | null>(null)

  const onPutProjectsInFolder = useCallback(
    async (projectNames: string[], projectFolderId?: string) => {
      try {
        await assignProjectsToFolder({
          assignProjectRequest: {
            folderId: projectFolderId,
            projectNames: projectNames,
          },
        }).unwrap()
      } catch (error: any) {
        throw getErrorMessage(error, 'Failed to assign projects to folder')
      }
    },
    [assignProjectsToFolder],
  )

  const onPutFolderInFolder = useCallback(
    async (folderId: string, parentId?: string) => {
      try {
        await assignFolderToFolder({
          folderId,
          projectFolderPatchModel: {
            parentId: parentId || null,
          },
        })
      } catch (error: any) {
        getErrorMessage(error, 'Failed to assign folder to parent')
      }
    },
    [assignFolderToFolder],
  )

  const onRemoveProjectsFromFolder = useCallback(
    async (projectNames: string[]) => {
      return onPutProjectsInFolder(projectNames, undefined)
    },
    [onPutProjectsInFolder],
  )

  const onDeleteFolder = useCallback(
    async (folderIds: string[]) => {
      await handleDeleteFolders({
        folderIds: folderIds,
        folders,
        deleteMutation: (id) => deleteProjectFolder({ folderId: id }).unwrap(),
        onSelect,
        itemTypeName: 'Projects',
      })
    },
    [deleteProjectFolder, onSelect, folders],
  )

  const onEditFolder = useCallback(
    (folderId: string) => {
      const folder = folders?.find((f) => f.id === folderId)
      if (folder) {
        handleOpenFolderDialog({ label: folder.label, ...folder.data }, folderId)
      }
    },
    [folders, handleOpenFolderDialog],
  )

  const openRenameFolder = useCallback(
    (rowId: string) => {
      console.log('on rename folder', rowId)
      setRenamingFolder(rowId)
      setRenamingProject(null) // Ensure project renaming is closed
      onSelect([rowId])
    },
    [onSelect],
  )

  const closeRenameFolder = useCallback(() => {
    setRenamingFolder(null)
  }, [])

  const onSubmitRenameFolder = useCallback(
    async (newLabel: string) => {
      if (!renamingFolder) return

      try {
        // Parse the folder ID from the row ID
        const folderId = renamingFolder.replace('folder-', '')

        await updateProjectFolder({
          folderId,
          projectFolderPatchModel: {
            label: newLabel,
          },
        }).unwrap()

        closeRenameFolder()
      } catch (error: any) {
        getErrorMessage(error, 'Failed to rename folder')
      }
    },
    [renamingFolder, updateProjectFolder, closeRenameFolder],
  )

  const onRenameFolder = useCallback(
    (folderId: string) => {
      // check if we need to add folder- prefix to the rowId, if not already present
      const rowId = folderId.startsWith('folder-') ? folderId : `folder-${folderId}`
      openRenameFolder(rowId)
    },
    [openRenameFolder],
  )

  // Project label rename
  const onRenameProject = useCallback(
    (projectName: string) => {
      setRenamingProject(projectName)
      setRenamingFolder(null) // Ensure folder renaming is closed
      onSelect([projectName])
    },
    [onSelect],
  )

  const closeRenameProject = useCallback(() => {
    setRenamingProject(null)
  }, [])

  const onSubmitRenameProject = useCallback(
    (newLabel: string) => {
      if (!renamingProject) return
      const projectName = renamingProject
      const trimmed = newLabel.trim()

      closeRenameProject()
      updateProject({
        projectName,
        projectPatchModel: { label: trimmed },
      })
        .unwrap()
        .catch((error: any) => {
          toast.error(getErrorMessage(error, 'Failed to update project label'))
        })
    },
    [renamingProject, updateProject, closeRenameProject],
  )

  return {
    onPutProjectsInFolder,
    onPutFolderInFolder,
    onRemoveProjectsFromFolder,
    onDeleteFolder,
    onEditFolder,
    onRenameFolder,
    renamingFolder,
    onSubmitRenameFolder,
    closeRenameFolder,
    onRenameProject,
    renamingProject,
    onSubmitRenameProject,
    closeRenameProject,
  }
}
