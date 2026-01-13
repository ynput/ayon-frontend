import { useCallback, useState } from 'react'
import {
  useAssignProjectsToFolderMutation,
  useDeleteProjectFolderMutation,
  useUpdateProjectFolderMutation,
  ProjectFolderModel,
} from '@shared/api'
import { getErrorMessage, handleDeleteFolders } from '@shared/util'
import { FolderFormData } from '@pages/ProjectManagerPage/components/ProjectFolderFormDialog/ProjectFolderFormDialog'

interface UseProjectFolderActionsProps {
  folders?: ProjectFolderModel[]
  onSelect: (ids: string[]) => void
  handleOpenFolderDialog: (data?: Partial<FolderFormData>, folderId?: string) => void
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

  // Folder renaming state
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null)

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
    async (folderId: string) => {
      await handleDeleteFolders({
        folderIds: folderId,
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
      setRenamingFolder(rowId)
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
      // The row ID has format "folder-{id}"
      const rowId = `folder-${folderId}`
      openRenameFolder(rowId)
    },
    [openRenameFolder],
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
  }
}
