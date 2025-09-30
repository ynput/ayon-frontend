import { useState } from 'react'
import { useListsDataContext } from '../context/ListsDataContext'
import { ListsContextType } from '../context'
import {
  EntityListFolderData,
  EntityListFolderPatchModel,
  useCreateEntityListFolderMutation,
  useDeleteEntityListFolderMutation,
  useUpdateEntityListFolderMutation,
  useUpdateEntityListMutation,
  type EntityListPatchModel,
} from '@shared/api'
import { toast } from 'react-toastify'
import { useCallback } from 'react'
import { useAppSelector } from '@state/store'
import { parseListFolderRowId } from '../util'
import { confirmDelete, getEntityId } from '@shared/util'
import { usePowerpack } from '@shared/context'

const getErrorMessage = (error: unknown, prefix: string): string => {
  const errorString = error instanceof Error ? error.message : String(error)
  const errorMessage = `${prefix}: ${errorString}`
  console.error(errorMessage)
  toast.error(errorMessage)
  return errorMessage
}

export interface UseUpdateListProps {
  setRowSelection: ListsContextType['setRowSelection']
  onUpdateList: (listId: string, list: EntityListPatchModel) => Promise<void>
  projectName: string
  onCreatedFolders?: (folderIds: string[], hadListIds: boolean, parentIds?: string[]) => void
}

export interface UseUpdateListReturn {
  renamingList: string | null
  openRenameList: (listId: string) => void
  closeRenameList: () => void
  onRenameList: (value: string) => Promise<void>
  onPutListsInFolder: (listIds: string[], listFolderId: string) => Promise<void>
  onRemoveListsFromFolder: (listIds: string[]) => Promise<void>
  onCreateListFolder: (
    payload: Omit<EntityListFolderData, 'id'> & { label: string },
    listIds?: string[],
    parentIds?: string[],
  ) => Promise<void>
  onUpdateListFolder: (folderId: string, data: EntityListFolderPatchModel) => Promise<void>
  onDeleteListFolders: (folderIds: string[]) => Promise<void>
  onPutFoldersInFolder: (folderIds: string[], parentFolderId: string) => Promise<void>
  onRemoveFoldersFromFolder: (folderIds: string[]) => Promise<void>
}

const useUpdateList = ({
  setRowSelection,
  onUpdateList,
  projectName,
  onCreatedFolders,
}: UseUpdateListProps) => {
  const { listsData, listFolders } = useListsDataContext()
  const [renamingList, setRenamingList] = useState<UseUpdateListReturn['renamingList']>(null)
  const user = useAppSelector((state) => state.user)
  const isUser = !user.data?.isAdmin && !user.data?.isManager
  const { powerLicense, setPowerpackDialog } = usePowerpack()

  const openRenameList: UseUpdateListReturn['openRenameList'] = useCallback(
    (listId) => {
      // Check if this is a folder folder
      if (parseListFolderRowId(listId)) {
        // Folder folder - just set renaming state
        setRenamingList(listId)
        setRowSelection({ [listId]: true })
        return
      }

      // Regular list - find list by id
      const list = listsData.find((list) => list.id === listId)
      if (!list) return
      setRenamingList(listId)

      // ensure the row is selected
      setRowSelection({ [listId]: true })
    },
    [listsData, setRowSelection],
  )

  const closeRenameList = useCallback(() => {
    setRenamingList(null)
  }, [])

  const [updateList] = useUpdateEntityListMutation()

  const [createListFolder] = useCreateEntityListFolderMutation()
  const [updateListFolder] = useUpdateEntityListFolderMutation()
  const [deleteListFolder] = useDeleteEntityListFolderMutation()

  const onRenameList: UseUpdateListReturn['onRenameList'] = useCallback(
    async (label) => {
      if (!renamingList) return Promise.reject()

      try {
        const listFolderId = parseListFolderRowId(renamingList)
        // Check if this is a folder
        if (!!listFolderId) {
          const listFolder = listFolders.find((folder) => folder.id === listFolderId)
          if (!listFolder) throw new Error('Folder not found')

          // Check if user has permission to rename folder
          // admin, manager or owner
          if (isUser && listFolder.owner !== user.name) {
            toast.error('You do not have permission to rename folders')
            return Promise.reject(new Error('Insufficient permissions'))
          }

          await updateListFolder({
            projectName,
            folderId: listFolderId,
            entityListFolderPatchModel: { label },
          }).unwrap()
        } else {
          // Regular list renaming
          await onUpdateList(renamingList, {
            label: label,
          })
        }

        // close the dialog
        closeRenameList()
      } catch (error: any) {
        throw getErrorMessage(error, 'Failed to rename')
      }
    },
    [renamingList, onUpdateList, closeRenameList, listFolders, updateListFolder, isUser],
  )

  const onPutListsInFolder: UseUpdateListReturn['onPutListsInFolder'] = useCallback(
    async (listIds, listFolderId) => {
      try {
        const updatePromises = listIds.map((listId) =>
          updateList({
            listId,
            projectName,
            entityListPatchModel: {
              entityListFolderId: listFolderId,
            },
          }).unwrap(),
        )

        await Promise.all(updatePromises)
      } catch (error: any) {
        throw getErrorMessage(error, 'Failed to update list folder')
      }
    },
    [updateList, projectName],
  )

  const onRemoveListsFromFolder: UseUpdateListReturn['onRemoveListsFromFolder'] = useCallback(
    async (listIds) => {
      try {
        const updatePromises = listIds.map((listId) =>
          updateList({
            listId,
            projectName,
            entityListPatchModel: {
              entityListFolderId: null as unknown as string | undefined,
            },
          }).unwrap(),
        )

        await Promise.all(updatePromises)
      } catch (error: any) {
        throw getErrorMessage(error, 'Failed to remove lists from folder')
      }
    },
    [updateList, projectName],
  )

  const onCreateListFolder: UseUpdateListReturn['onCreateListFolder'] = async (
    payload,
    listIds,
    parentIds = [],
  ) => {
    if (!powerLicense) {
      setPowerpackDialog('listFolders')
      return
    }

    try {
      const { label, color, icon, scope } = payload

      const createFolder = async (pId?: string) => {
        const newListId = getEntityId()
        const res = await createListFolder({
          projectName,
          entityListFolderPostModel: {
            id: newListId,
            label,
            parentId: pId,
            data: {
              color,
              icon,
              scope,
            },
          },
        }).unwrap()
        return res
      }

      const responses = await Promise.all(
        parentIds?.length ? parentIds.map((pId) => createFolder(pId)) : [createFolder()],
      )
      // for now we only care about the first folder created
      const resIds = responses.map((r) => r.id).filter((id) => !!id)

      if (listIds?.length && resIds.length) {
        await onPutListsInFolder(listIds, resIds[0])
      }

      if (resIds.length && onCreatedFolders) {
        onCreatedFolders(resIds, !!listIds?.length, parentIds)
      }
    } catch (error) {
      throw getErrorMessage(error, 'Failed to create folder')
    }
  }

  const onUpdateListFolder: UseUpdateListReturn['onUpdateListFolder'] = useCallback(
    async (folderId, payload) => {
      const { data = {} } = payload
      // convert any undefined values in data to null to clear them
      const cleanedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value === undefined ? null : value]),
      )
      try {
        await updateListFolder({
          projectName,
          folderId,
          entityListFolderPatchModel: { ...payload, data: cleanedData },
        }).unwrap()
      } catch (error) {
        throw getErrorMessage(error, 'Failed to update folder')
      }
    },
    [projectName, updateListFolder],
  )

  const onDeleteListFolders: UseUpdateListReturn['onDeleteListFolders'] = useCallback(
    async (folderIds) => {
      const ids = Array.isArray(folderIds) ? folderIds : [folderIds]

      confirmDelete({
        accept: async () => {
          try {
            await Promise.all(
              ids.map((folderId) =>
                deleteListFolder({
                  projectName,
                  folderId,
                }).unwrap(),
              ),
            )

            // deselect everything
            setRowSelection({})
          } catch (error) {
            throw getErrorMessage(error, 'Failed to delete folder(s)')
          }
        },
        label: ids.length > 1 ? 'folders?' : 'folder?',
        message: 'Only the folder(s) will be deleted. Lists inside the folder will remain.',
      })
    },
    [projectName, deleteListFolder],
  )

  const onPutFoldersInFolder: UseUpdateListReturn['onPutFoldersInFolder'] = useCallback(
    async (folderIds, parentFolderId) => {
      try {
        await Promise.all(
          folderIds.map((id) =>
            updateListFolder({
              projectName,
              folderId: id,
              entityListFolderPatchModel: {
                parentId: parentFolderId,
              },
            }).unwrap(),
          ),
        )
      } catch (error) {
        throw getErrorMessage(error, 'Failed to move folder')
      }
    },
    [projectName, updateListFolder],
  )

  const onRemoveFoldersFromFolder: UseUpdateListReturn['onRemoveFoldersFromFolder'] = useCallback(
    async (folderIds) => {
      try {
        await Promise.all(
          folderIds.map((id) =>
            updateListFolder({
              projectName,
              folderId: id,
              entityListFolderPatchModel: {
                parentId: null as unknown as string | undefined,
              },
            }).unwrap(),
          ),
        )
      } catch (error) {
        throw getErrorMessage(error, 'Failed to remove folder from parent')
      }
    },
    [projectName, updateListFolder],
  )

  return {
    renamingList,
    openRenameList,
    closeRenameList,
    onRenameList,
    onPutListsInFolder,
    onRemoveListsFromFolder,
    onCreateListFolder,
    onUpdateListFolder,
    onDeleteListFolders,
    onPutFoldersInFolder,
    onRemoveFoldersFromFolder,
  }
}

export default useUpdateList
