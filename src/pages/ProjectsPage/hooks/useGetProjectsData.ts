// hook that loads projects data and transforms it into maps and flat table rows

import type { Project } from '@shared/api'
import {
  useGetProjectFoldersQuery,
  useGetProjectsInfiniteInfiniteQuery,
  type ProjectFolderModel,
} from '@shared/api'
import { GROUP_BY_FOLDER_KEY } from '../constants'
import { useEffect, useMemo } from 'react'

const MAX_PROJECT_PAGES = 10

type Props = {
  groupBy?: string | null
  groupByDesc?: boolean
  showArchived: boolean
}

type ProjectMap = Map<string, Project>
export type FolderMap = Map<string, ProjectFolderModel>

type Value = {
  projects: Project[]
  projectsMap: ProjectMap
  projectFolders: ProjectFolderModel[]
  foldersMap: FolderMap
  hasNextPage: boolean
  isFetchingNextPage: boolean
  hasReachedPageLimit: boolean
  isLoading: boolean
  error: string
}

export const useGetProjectsData = ({
  groupBy,
  groupByDesc: _groupByDesc,
  showArchived: _showArchived,
}: Props): Value => {
  // get all projects
  const {
    data: { pages = [] } = {},
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetProjectsInfiniteInfiniteQuery({})

  //   get project projectFolders if grouping by folder
  const { data: projectFolders = [] } = useGetProjectFoldersQuery(undefined, {
    skip: GROUP_BY_FOLDER_KEY !== groupBy,
  })

  const foldersMap = useMemo<FolderMap>(() => {
    const map = new Map<string, ProjectFolderModel>()
    for (const folder of projectFolders ?? []) {
      map.set(folder.id, folder)
    }
    return map
  }, [projectFolders])

  // every project is needed up front: sorting, grouping, filtering and search all run client-side
  const hasReachedPageLimit = !!hasNextPage && pages.length >= MAX_PROJECT_PAGES
  // stop on error, otherwise a failing page retries forever
  const isDraining = !!hasNextPage && !hasReachedPageLimit && !error

  useEffect(() => {
    if (!isDraining || isFetchingNextPage) return
    fetchNextPage()
  }, [isDraining, isFetchingNextPage, fetchNextPage])

  const projects = useMemo(() => pages.flatMap((page) => page.projects), [pages])

  const projectsMap = useMemo<ProjectMap>(() => {
    const map = new Map<string, Project>()
    projects.forEach((project) => {
      map.set(project.name, project)
    })
    return map
  }, [projects])

  return {
    projects,
    projectsMap,
    projectFolders,
    foldersMap,
    hasNextPage: isDraining,
    isFetchingNextPage,
    hasReachedPageLimit,
    isLoading,
    error: String(error),
  }
}
