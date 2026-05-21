import { useCallback, useMemo } from 'react'
import type { Project, ProjectFolderModel } from '@shared/api'
import {
  buildGroupedData,
  compareGroupingPathItems,
  isListTableGroupDisplayObject,
  isListTableGroupRow,
  type ListTableGroupRow,
} from '@shared/containers/ListTable/utils/buildGroupedData'
import type {
  ListTableGroupDisplay,
  ListTableGroupingPathItem,
} from '@shared/containers/ListTable/ListTable.types'
import { GROUP_BY_FOLDER_KEY } from '../constants'
import type { ProjectTableColumnAttributeData } from './useProjectColumns'
import type { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import { applyProjectFilters } from './utils/filterProjects'

export type ProjectTableRow = {
  id: string
  name: string
  label?: string | null
  code: string | null
  active: boolean | null
  library: boolean | null
  color: string | null
  projectFolder: string | null
  skeleton?: boolean
  pipeline?: string // opposite of skeleton for easier handling in the UI
  updatedAt?: string
  createdAt?: string
  attrib: Record<string, any>
  subRows?: ProjectTableRow[]
  __listTableGroup?: true
  __listTablePlaceholder?: true
  __groupColumnId?: string
  __groupValue?: ListTableGroupingPathItem
  __groupKey?: string
}

type FolderMap = Map<string, ProjectFolderModel>

export type ProjectGroupRow = ProjectTableRow & ListTableGroupRow<ProjectTableRow>

type ProjectRowEntry = ProjectTableRow | ProjectGroupRow

const EMPTY_FOLDER_PLACEHOLDER_LABEL = 'No projects in this folder'

export const isProjectGroupRow = (row: ProjectTableRow): row is ProjectGroupRow =>
  isListTableGroupRow(row)

export const isEmptyFolderPlaceholderRow = (
  row: ProjectTableRow | undefined,
): row is ProjectTableRow & { __listTablePlaceholder: true } => !!row?.__listTablePlaceholder

const createEmptyFolderPlaceholderRow = (groupKey: string): ProjectTableRow => ({
  id: `${groupKey}|__empty-folder-placeholder`,
  name: '',
  label: EMPTY_FOLDER_PLACEHOLDER_LABEL,
  code: null,
  active: null,
  library: null,
  color: null,
  skeleton: false,
  projectFolder: null,
  attrib: {},
  __listTablePlaceholder: true,
})

const sortProjectRowEntries = (
  rows: ProjectRowEntry[],
  groupSortByDesc: boolean,
): ProjectRowEntry[] => {
  const groupRows = rows.filter(isProjectGroupRow)
  const leafRows = rows.filter((row) => !isProjectGroupRow(row))

  groupRows.sort((left, right) => {
    const result = compareGroupingPathItems(left.__groupValue, right.__groupValue)
    return groupSortByDesc ? -result : result
  })

  groupRows.forEach((row) => {
    row.subRows = sortProjectRowEntries(row.subRows as ProjectRowEntry[], groupSortByDesc)
  })

  return [...groupRows, ...leafRows]
}

const ensureEmptyFolderGroups = (
  rows: ProjectRowEntry[],
  foldersMap: FolderMap,
  groupSortByDesc: boolean,
): ProjectTableRow[] => {
  const childFoldersByParentId = new Map<string | null, ProjectFolderModel[]>()

  for (const folder of foldersMap.values()) {
    const parentId = folder.parentId ?? null
    const siblingFolders = childFoldersByParentId.get(parentId) ?? []
    siblingFolders.push(folder)
    childFoldersByParentId.set(parentId, siblingFolders)
  }

  const ensureBranch = (
    container: ProjectRowEntry[],
    parentId: string | null,
    parentKey: string,
    level: number,
  ) => {
    const childFolders = childFoldersByParentId.get(parentId)
    if (!childFolders?.length) return

    for (const folder of childFolders) {
      const groupKey = `${parentKey}|${GROUP_BY_FOLDER_KEY}:${level}:${JSON.stringify(folder.id)}`
      let groupRow = container.find(
        (row): row is ProjectGroupRow => isProjectGroupRow(row) && row.__groupKey === groupKey,
      )

      if (!groupRow) {
        groupRow = createProjectGroupRow(GROUP_BY_FOLDER_KEY, groupKey, {
          value: folder.id,
          label: folder.label,
          icon: folder.data?.icon ?? undefined,
          color: folder.data?.color ?? undefined,
          sortValue: folder.label,
        }) as ProjectGroupRow
        container.push(groupRow)
      }

      ensureBranch(groupRow.subRows as ProjectRowEntry[], folder.id, groupKey, level + 1)

      if (!groupRow.subRows.length) {
        groupRow.subRows.push(createEmptyFolderPlaceholderRow(groupKey))
      }
    }
  }

  ensureBranch(rows, null, 'root', 0)
  return sortProjectRowEntries(rows, groupSortByDesc)
}

const getProjectGroupingValue = (row: ProjectTableRow, columnId: string): unknown => {
  if (columnId.startsWith('attrib_')) return row.attrib[columnId.slice(7)]
  return (row as Record<string, unknown>)[columnId]
}

const createProjectGroupRow = (
  columnId: string,
  groupKey: string,
  groupValue: ListTableGroupingPathItem,
): ListTableGroupRow<ProjectTableRow> => {
  const display = isListTableGroupDisplayObject(groupValue) ? groupValue : undefined
  const resolvedValue = display?.value ?? groupValue
  const label = display?.label ?? String(resolvedValue ?? '(None)')

  return {
    id: groupKey,
    name: label,
    label,
    code: '',
    active: false,
    library: false,
    color: display?.color ?? null,
    projectFolder: columnId === GROUP_BY_FOLDER_KEY ? String(resolvedValue ?? '') || null : null,
    attrib: columnId.startsWith('attrib_') ? { [columnId.slice(7)]: resolvedValue } : {},
    __listTableGroup: true,
    __groupColumnId: columnId,
    __groupValue: groupValue,
    __groupKey: groupKey,
    subRows: [],
  } as unknown as ListTableGroupRow<ProjectTableRow>
}

interface UseProjectTableRowsOptions {
  projects: Project[]
  grouping: string[]
  groupSortByDesc: boolean
  foldersMap: FolderMap
  columnAttributeData: ProjectTableColumnAttributeData
  filters: QueryFilter
}

export const useProjectTableRows = ({
  projects,
  grouping,
  groupSortByDesc,
  foldersMap,
  columnAttributeData,
  filters,
}: UseProjectTableRowsOptions): ProjectTableRow[] => {
  const tableRows = useMemo<ProjectTableRow[]>(
    () =>
      projects.map((project) => ({
        id: project.name,
        name: project.name,
        label: project.label,
        code: project.code,
        active: project.active,
        library: project.library,
        skeleton: project.skeleton,
        pipeline: project.skeleton ? 'No' : 'Yes',
        color: project.color ?? null,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        projectFolder:
          project.projectFolder && foldersMap.has(project.projectFolder)
            ? project.projectFolder
            : null,
        attrib: project.attrib,
      })),
    [foldersMap, projects],
  )

  const getGroupDisplay = useCallback(
    (columnId: string, value: unknown): ListTableGroupDisplay => {
      if (columnId === GROUP_BY_FOLDER_KEY) {
        if (value === null || value === undefined) {
          return { value: null, label: 'No folder', sortValue: 'No folder' }
        }
        const folder = foldersMap.get(String(value))
        return {
          value,
          label: folder?.label ?? String(value),
          icon: folder?.data?.icon,
          color: folder?.data?.color,
          sortValue: folder?.label ?? String(value),
        }
      }

      const attribute = columnAttributeData[columnId]
      if (attribute?.enum?.length) {
        const optionIndex = attribute.enum.findIndex((item) => String(item.value) === String(value))
        const option = optionIndex >= 0 ? attribute.enum[optionIndex] : undefined
        return {
          value,
          label: String(option?.label ?? option?.value ?? value ?? '(None)'),
          icon: typeof option?.icon === 'string' ? option.icon : undefined,
          color: option?.color,
          sortIndex: optionIndex >= 0 ? optionIndex : Number.MAX_SAFE_INTEGER,
          sortValue: String(option?.label ?? option?.value ?? value ?? '(None)'),
        }
      }

      if (attribute?.type === 'boolean') {
        if (value === null || value === undefined) {
          return { value: null, label: '(None)', sortValue: '(None)' }
        }
        const normalizedValue = String(value) === 'true'

        let label: string
        switch (columnId) {
          case 'active':
            label = normalizedValue ? 'Active' : 'Archived'
            break
          case 'library':
            label = normalizedValue ? 'Library' : 'Standard'
            break
          default:
            label = normalizedValue ? 'Yes' : 'No'
        }

        return {
          value: normalizedValue,
          label,
          sortIndex: normalizedValue ? 0 : 1,
          sortValue: normalizedValue ? 0 : 1,
          icon: columnId === 'active' ? (normalizedValue ? 'check' : 'archive') : undefined,
        }
      }

      if (value === null || value === undefined) {
        return { value: null, label: '(None)', sortValue: '(None)' }
      }

      // special handling of skeleton (pipeline) grouping for better display
      if (columnId === 'skeleton') {
        const normalizedSkeletonValue = String(value) === 'true'
        return {
          value: normalizedSkeletonValue,
          label: normalizedSkeletonValue ? 'Standard' : 'Pipeline',
          sortIndex: normalizedSkeletonValue ? 0 : 1,
          sortValue: normalizedSkeletonValue ? 0 : 1,
        }
      }

      return { value, label: String(value), sortValue: String(value) }
    },
    [columnAttributeData, foldersMap],
  )

  const getGroupingPath = useCallback(
    (columnId: string, row: ProjectTableRow): ListTableGroupingPathItem[] | undefined => {
      if (columnId === GROUP_BY_FOLDER_KEY) {
        if (!row.projectFolder) {
          return []
        }

        const path: ListTableGroupingPathItem[] = []
        let currentFolder = foldersMap.get(row.projectFolder)

        while (currentFolder) {
          path.unshift({
            value: currentFolder.id,
            label: currentFolder.label,
            icon: currentFolder.data?.icon ?? undefined,
            color: currentFolder.data?.color ?? undefined,
            sortValue: currentFolder.label,
          })
          currentFolder = currentFolder.parentId
            ? foldersMap.get(currentFolder.parentId)
            : undefined
        }

        return path
      }

      return [getGroupDisplay(columnId, getProjectGroupingValue(row, columnId))]
    },
    [foldersMap, getGroupDisplay],
  )

  const filteredRows = useMemo(() => applyProjectFilters(tableRows, filters), [tableRows, filters])

  return useMemo(() => {
    if (!grouping.length) return filteredRows
    const groupedRows = buildGroupedData(
      filteredRows,
      grouping,
      groupSortByDesc,
      getGroupingPath,
      createProjectGroupRow,
      getProjectGroupingValue,
    ) as ProjectRowEntry[]

    if (grouping[0] === GROUP_BY_FOLDER_KEY) {
      return ensureEmptyFolderGroups(groupedRows, foldersMap, groupSortByDesc)
    }

    return groupedRows as ProjectTableRow[]
  }, [filteredRows, foldersMap, grouping, groupSortByDesc, getGroupingPath])
}
