// hook that loads projects data and transforms it into maps and table data

import type { Project } from '@shared/api'
import { useGetProjectFoldersQuery, useGetProjectsInfiniteInfiniteQuery } from '@shared/api'
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

type Value = {
  projects: Project[]
  tableRows: ProjectTableRow[]
  projectsMap: ProjectMap
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
  const { data: _folders } = useGetProjectFoldersQuery(undefined, {
    skip: GROUP_BY_FOLDER_KEY !== groupBy,
  })

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
        projectFolder: project.projectFolder ?? null,
        attrib: project.attrib,
      })),
    [projects],
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
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    isLoading,
    error: String(error),
  }
}
