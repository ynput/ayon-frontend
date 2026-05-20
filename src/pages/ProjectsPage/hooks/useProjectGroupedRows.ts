import { useCallback, useMemo } from 'react'
import type { ProjectFolderModel } from '@shared/api'
import {
  buildGroupedData,
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
import type { ProjectTableRow } from './useGetProjectsData'

type FolderMap = Map<string, ProjectFolderModel>

export type ProjectGroupRow = ProjectTableRow & ListTableGroupRow<ProjectTableRow>

export const isProjectGroupRow = (row: ProjectTableRow): row is ProjectGroupRow =>
  isListTableGroupRow(row)

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

interface UseProjectGroupedRowsOptions {
  rows: ProjectTableRow[]
  grouping: string[]
  groupSortByDesc: boolean
  foldersMap: FolderMap
  columnAttributeData: ProjectTableColumnAttributeData
}

export const useProjectGroupedRows = ({
  rows,
  grouping,
  groupSortByDesc,
  foldersMap,
  columnAttributeData,
}: UseProjectGroupedRowsOptions): ProjectTableRow[] => {
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
        return {
          value: normalizedValue,
          label:
            columnId === 'active'
              ? normalizedValue
                ? 'Active'
                : 'Inactive'
              : columnId === 'library'
              ? normalizedValue
                ? 'Library'
                : 'Standard'
              : normalizedValue
              ? 'Yes'
              : 'No',
          sortIndex: normalizedValue ? 0 : 1,
          sortValue: normalizedValue ? 0 : 1,
        }
      }

      if (value === null || value === undefined) {
        return { value: null, label: '(None)', sortValue: '(None)' }
      }

      return { value, label: String(value), sortValue: String(value) }
    },
    [columnAttributeData, foldersMap],
  )

  const getGroupingPath = useCallback(
    (columnId: string, row: ProjectTableRow): ListTableGroupingPathItem[] | undefined => {
      if (columnId === GROUP_BY_FOLDER_KEY) {
        if (!row.projectFolder) {
          return [{ value: null, label: 'No folder', sortValue: 'No folder' }]
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

        return path.length ? path : [{ value: null, label: 'No folder', sortValue: 'No folder' }]
      }

      return [getGroupDisplay(columnId, getProjectGroupingValue(row, columnId))]
    },
    [foldersMap, getGroupDisplay],
  )

  return useMemo(() => {
    if (!grouping.length) return rows
    return buildGroupedData(
      rows,
      grouping,
      groupSortByDesc,
      getGroupingPath,
      createProjectGroupRow,
      getProjectGroupingValue,
    ) as ProjectTableRow[]
  }, [rows, grouping, groupSortByDesc, getGroupingPath])
}
