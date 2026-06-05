// hook that loads projects data and transforms it into maps and flat table rows

import type { Project } from '@shared/api'
import {
  useGetProjectFoldersQuery,
  useGetProjectsInfiniteInfiniteQuery,
  type ProjectFolderModel,
} from '@shared/api'
import { GROUP_BY_FOLDER_KEY } from '../constants'
import { useMemo } from 'react'

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
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
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
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    isLoading,
    error: String(error),
  }
}
