import { createContext, useContext, useMemo } from 'react'
import { useGetFolderListQuery } from '@shared/api'

import type { FolderListItem } from '@shared/api'
import { useQueryArgumentChangeLoading } from '@shared/hooks'

export interface ProjectFoldersContextValue {
  folders: FolderListItem[]
  getFolderById: (id: string) => FolderListItem | undefined
  getParentFolderIds: (folderId: string) => string[]
  getChildFolderIds: (folderIds: string[], includeSelf?: boolean) => string[]
  isLoading: boolean
  isFetching: boolean
  isSuccess: boolean
  isUninitialized: boolean
  error: any
  refetch: () => void
}

const ProjectFoldersContext = createContext<ProjectFoldersContextValue | undefined>(undefined)

//
// ProjectFoldersProvider
//

interface ProjectFoldersProviderProps {
  projectName: string
  children: React.ReactNode
}

export const ProjectFoldersContextProvider: React.FC<ProjectFoldersProviderProps> = ({
  projectName,
  children,
}: ProjectFoldersProviderProps) => {
  // FOLDERS LIST
  const {
    data: { folders = [] } = {},
    isLoading,
    isFetching,
    isSuccess,
    isUninitialized,
    error,
    refetch,
  } = useGetFolderListQuery({ projectName, attrib: true })

  //   only show loading when args change or on first load
  const isLoadingFolders = useQueryArgumentChangeLoading({ projectName }, isFetching || isLoading)

  // Create folder map for efficient O(1) lookups
  const folderMap = useMemo(() => {
    const map = new Map<string, FolderListItem>()
    for (const folder of folders) {
      map.set(folder.id, folder)
    }
    return map
  }, [folders])

  // Function to get folder by ID
  const getFolderById = useMemo(() => (id: string) => folderMap.get(id), [folderMap])

  // Function to get all parent folder IDs by crawling up the hierarchy
  const getParentFolderIds = useMemo(
    () =>
      (folderId: string): string[] => {
        const parentIds: string[] = []
        const visited = new Set<string>()
        let currentId: string | undefined = folderId

        while (currentId && !visited.has(currentId)) {
          visited.add(currentId)
          const currentFolder = folderMap.get(currentId)
          if (!currentFolder?.parentId) break
          parentIds.push(currentFolder.parentId)
          currentId = currentFolder.parentId
        }

        return parentIds
      },
    [folderMap],
  )

  // function to get all child folder IDs recursively for a given folder IDs
  const getChildFolderIds = useMemo(
    () =>
      (folderIds: string[], includeSelf = false): string[] => {
        const childIds: string[] = includeSelf ? [...folderIds] : []
        const queue: string[] = [...folderIds]

        while (queue.length > 0) {
          const currentId = queue.shift()!
          for (const folder of folders) {
            if (folder.parentId === currentId) {
              childIds.push(folder.id)
              queue.push(folder.id)
            }
          }
        }

        return childIds
      },
    [folders],
  )

  const value = useMemo(
    () => ({
      folders: folders,
      getFolderById,
      getParentFolderIds,
      getChildFolderIds,
      isLoading: isLoadingFolders, // first time and when args change
      isFetching, // any background fetching
      isSuccess,
      isUninitialized,
      error,
      refetch,
    }),
    [
      folders,
      getFolderById,
      getParentFolderIds,
      getChildFolderIds,
      isLoadingFolders,
      isFetching,
      isSuccess,
      isUninitialized,
      error,
      refetch,
    ],
  )

  return <ProjectFoldersContext.Provider value={value}>{children}</ProjectFoldersContext.Provider>
}

export const useProjectFoldersContext = () => {
  const context = useContext(ProjectFoldersContext)
  if (context === undefined) {
    throw new Error('useProjectFoldersContext must be used within a ProjectFoldersContextProvider')
  }
  return context
}
