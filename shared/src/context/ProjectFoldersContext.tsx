import { createContext, useContext, useMemo } from 'react'
import { useGetFolderListQuery } from '@shared/api'

import type { FolderListItem } from '@shared/api'
import { useQueryArgumentChangeLoading } from '@shared/hooks'

export interface ProjectFoldersContextValue {
  folders: FolderListItem[]
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
    data: folders = [],
    isLoading,
    isFetching,
    isSuccess,
    isUninitialized,
    error,
    refetch,
  } = useGetFolderListQuery({ projectName, attrib: true })

  //   only show loading when args change or on first load
  const isLoadingFolders = useQueryArgumentChangeLoading({ projectName }, isFetching || isLoading)

  const value = useMemo(
    () => ({
      folders: folders as FolderListItem[],
      isLoading: isLoadingFolders, // first time and when args change
      isFetching, // any background fetching
      isSuccess,
      isUninitialized,
      error,
      refetch,
    }),
    [folders, isLoading, isFetching, isSuccess, isUninitialized, error, refetch],
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
