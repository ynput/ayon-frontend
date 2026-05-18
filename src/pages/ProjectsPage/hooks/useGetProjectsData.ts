// hook that loads projects data and transforms it into maps and table data

import type { Project } from '@shared/api'
import {
  useGetProjectFoldersQuery,
  useGetProjectsInfiniteInfiniteQuery,
  type ProjectFolderModel,
} from '@shared/api'
import { GROUP_BY_FOLDER_KEY } from '../constants'
import { useMemo } from 'react'

export type ProjectTableRow = {
  id: string
  name: string
  label: string
  code: string
  active: boolean
  library: boolean
  color: string | null
  projectFolder: string | null
  attrib: Record<string, any>
}

type Props = {
  groupBy?: string | null
  groupByDesc?: boolean
  showArchived: boolean
}

type ProjectMap = Map<string, Project>
type FolderMap = Map<string, ProjectFolderModel>

type Value = {
  projects: Project[]
  tableRows: ProjectTableRow[]
  projectsMap: ProjectMap
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

  //   get project folders if grouping by folder
  const { data: foldersData } = useGetProjectFoldersQuery(undefined, {
    skip: GROUP_BY_FOLDER_KEY !== groupBy,
  })

  const foldersMap = useMemo<FolderMap>(() => {
    const map = new Map<string, ProjectFolderModel>()
    for (const folder of foldersData ?? []) {
      map.set(folder.id, folder)
    }
    return map
  }, [foldersData])

  const projects = useMemo(() => pages.flatMap((page) => page.projects), [pages])

  const tableRows = useMemo<ProjectTableRow[]>(
    () =>
      projects.map((project) => ({
        id: project.name,
        name: project.name,
        label: project.label ?? project.name,
        code: project.code,
        active: project.active,
        library: project.library,
        color: project.color ?? null,
        projectFolder:
          project.projectFolder && foldersMap.has(project.projectFolder)
            ? project.projectFolder
            : null,
        attrib: project.attrib,
      })),
    [foldersMap, projects],
  )

  const projectsMap = useMemo<ProjectMap>(() => {
    const map = new Map<string, Project>()
    projects.forEach((project) => {
      map.set(project.name, project)
    })
    return map
  }, [projects])

  return {
    projects,
    tableRows,
    projectsMap,
    foldersMap,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    isLoading,
    error: String(error),
  }
}
