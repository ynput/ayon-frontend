import { confirmDelete } from './confirmDelete'
import { getErrorMessage } from './errorHandling'

/**
 * Base interface for folders with label
 */
export interface FolderWithLabel {
  id: string
  label?: string
}

/**
 * Configuration for delete folder operation
 */
export interface DeleteFolderConfig<T extends FolderWithLabel> {
  folderIds: string | string[]
  folders: T[] | undefined
  deleteMutation: (folderId: string) => Promise<any>
  onSelect: (ids: string[]) => void
  itemTypeName: string // e.g., "Lists" or "Projects"
  messageDetail?: string // Optional custom message
}

/**
 * Handles deletion of one or more folders with confirmation dialog and toast feedback.
 * Extracts common logic for folder deletion across different folder types.
 *
 * @example
 * ```ts
 * await handleDeleteFolders({
 *   folderIds: ['folder-1', 'folder-2'],
 *   folders: listFolders,
 *   deleteMutation: (id) => deleteListFolder({ projectName, folderId: id }).unwrap(),
 *   onSelect: setRowSelection,
 *   itemTypeName: 'Lists',
 * })
 * ```
 */
export const handleDeleteFolders = async <T extends FolderWithLabel>({
  folderIds,
  folders,
  deleteMutation,
  onSelect,
  itemTypeName,
  messageDetail,
}: DeleteFolderConfig<T>): Promise<void> => {
  const ids = Array.isArray(folderIds) ? folderIds : [folderIds]

  // Get the folder labels for the toast message
  const folderData = ids.map((id) => folders?.find((folder) => folder.id === id)).filter(Boolean)
  const folderLabels =
    folderData.length === 1
      ? folderData[0]?.label || 'Folder'
      : folderData.length > 1
        ? `${folderData.length} folders`
        : 'Folder'

  const defaultMessage = `Only the folder(s) will be deleted. ${itemTypeName} inside the folder will remain.`

  confirmDelete({
    accept: async () => {
      try {
        await Promise.all(ids.map((folderId) => deleteMutation(folderId)))

        // deselect everything
        onSelect([])
      } catch (error) {
        throw getErrorMessage(error, 'Failed to delete folder(s)')
      }
    },
    label: folderLabels,
    message: messageDetail || defaultMessage,
  })
}