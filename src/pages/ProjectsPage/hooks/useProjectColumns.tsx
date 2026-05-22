import { useMemo } from 'react'
import { useStore } from 'react-redux'
import { AttributeData, AttributeModel } from '@shared/api'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { format, isValid, parseISO } from 'date-fns'
import {
  ProjectThumbnailCell,
  THUMBNAIL_WIDTH,
} from '../components/ProjectThumbnailCell/ProjectThumbnailCell'
import ProjectHeartbeat from '../components/ProjectDetailsPanel/components/ProjectHeartbeat'
import type { ProjectFolderModel } from '@shared/api'
import { isEmptyFolderPlaceholderRow, ProjectTableRow } from './useProjectTableRows'
import { useGlobalContext } from '@shared/context'

const columnHelper = createColumnHelper<ProjectTableRow>()

export type ProjectTableColumnAttributeData = Record<string, AttributeData>
type FolderMap = Map<string, ProjectFolderModel>

// Padding constants matching ListTable cell indent calculation:
// TDInner left = var(--padding-m) + depth * 16 = 8 + depth * 16
// TDInner internal padding = 8px each side
// Minimum column size for thumbnail: 8 + maxDepth * 16 + 8 + THUMBNAIL_WIDTH + 8 = 24 + maxDepth * 16 + THUMBNAIL_WIDTH
const THUMBNAIL_BASE_SIZE = 24 + THUMBNAIL_WIDTH // = 66px at depth 0
const THUMBNAIL_INDENT_PER_DEPTH = 16

const STATIC_COLUMNS_AFTER_THUMBNAIL: ColumnDef<ProjectTableRow, any>[] = [
  columnHelper.accessor('label', {
    id: 'label',
    header: 'Label',
    size: 200,
  }),
  columnHelper.accessor('name', {
    id: 'name',
    header: 'Name',
    size: 200,
  }),
]

const STATIC_COLUMNS_AFTER_HEARTBEAT: ColumnDef<ProjectTableRow, any>[] = [
  columnHelper.accessor('code', {
    id: 'code',
    header: 'Code',
    size: 100,
  }),
  columnHelper.accessor('active', {
    id: 'active',
    header: 'Active',
    size: 80,
  }),
  columnHelper.accessor('library', {
    id: 'library',
    header: 'Library',
    size: 80,
  }),
  columnHelper.accessor('pipeline', {
    id: 'pipeline',
    header: 'State',
    size: 80,
  }),
  columnHelper.accessor('createdAt', {
    id: 'createdAt',
    header: 'Created at',
    size: 150,
    cell: (info) => {
      const val = info.getValue()
      if (!val) return ''
      const date = parseISO(val)
      return isValid(date) ? format(date, 'dd MMM yyyy') : val
    },
  }),
  columnHelper.accessor('updatedAt', {
    id: 'updatedAt',
    header: 'Updated at',
    size: 150,
    cell: (info) => {
      const val = info.getValue()
      if (!val) return ''
      const date = parseISO(val)
      return isValid(date) ? format(date, 'dd MMM yyyy') : val
    },
  }),
]

const isProjectScopedAttribute = (attribute: AttributeModel) => attribute.scope?.includes('project')

export type ProjectColumn = ColumnDef<ProjectTableRow, any>

export const useProjectColumns = (
  foldersMap: FolderMap = new Map(),
  maxGroupDepth: number = 0,
): {
  columns: ProjectColumn[]
  columnAttributeData: ProjectTableColumnAttributeData
} => {
  const { attributes } = useGlobalContext()
  const store = useStore()

  const attribKeys = useMemo(() => {
    const keys = new Set<string>()
    attributes.forEach((attribute) => {
      if (isProjectScopedAttribute(attribute)) {
        keys.add(attribute.name)
      }
    })
    return Array.from(keys)
  }, [attributes])

  const columnAttribsAttributeData = useMemo<ProjectTableColumnAttributeData>(
    () =>
      attribKeys.reduce<ProjectTableColumnAttributeData>((acc, key) => {
        const attribute = attributes.find((item) => item.name === key)
        if (attribute?.data) {
          acc[`attrib_${key}`] = attribute.data
        }
        return acc
      }, {}),
    [attribKeys, attributes],
  )

  const columnAttributeData = useMemo<ProjectTableColumnAttributeData>(
    () => ({
      label: { type: 'string' },
      code: { type: 'string' },
      active: { type: 'boolean' },
      library: { type: 'boolean' },
      createdAt: { type: 'datetime' },
      updatedAt: { type: 'datetime' },
      ...columnAttribsAttributeData,
    }),
    [columnAttribsAttributeData],
  )

  const attribColumns = useMemo<ColumnDef<ProjectTableRow, any>[]>(
    () =>
      attribKeys.map((key) =>
        columnHelper.accessor((row) => row.attrib[key], {
          id: `attrib_${key}`,
          header: columnAttributeData[`attrib_${key}`]?.title || key,
          size: 150,
          cell: (info) => {
            const val = info.getValue()
            if (val === undefined || val === null) return ''
            const attribute = columnAttributeData[`attrib_${key}`]
            if (attribute?.type === 'datetime') {
              const date = parseISO(val)
              return isValid(date) ? format(date, 'dd MMM yyyy') : val
            }
            return String(val)
          },
          sortingFn: (rowA, rowB) => {
            const attribute = columnAttribsAttributeData[`attrib_${key}`]
            const valueA = rowA.original.attrib[key]
            const valueB = rowB.original.attrib[key]

            if (attribute?.enum?.length) {
              const values = attribute.enum.map((item) => String(item.value))
              const indexA = values.indexOf(String(valueA))
              const indexB = values.indexOf(String(valueB))
              const normalizedA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA
              const normalizedB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB
              return normalizedA - normalizedB
            }

            return String(valueA ?? '').localeCompare(String(valueB ?? ''), undefined, {
              sensitivity: 'base',
            })
          },
        }),
      ),
    [attribKeys, columnAttribsAttributeData, columnAttributeData],
  )

  const heartbeatColumn = useMemo<ColumnDef<ProjectTableRow, any>>(
    () =>
      columnHelper.accessor('name', {
        id: 'heartbeat',
        header: 'Heartbeat',
        size: 150,
        meta: {
          listTableCustomCell: true,
        },
        cell: (info) =>
          isEmptyFolderPlaceholderRow(info.row.original) || !!info.row.original.skeleton ? null : (
            <ProjectHeartbeat projectName={info.getValue()} />
          ),
        sortingFn: (rowA, rowB) => {
          if (
            isEmptyFolderPlaceholderRow(rowA.original) ||
            isEmptyFolderPlaceholderRow(rowB.original)
          ) {
            return 0
          }

          const getScore = (projectName: string): number => {
            const state = store.getState() as any
            // RTK Query default cache key: `endpointName({...args sorted by key})`
            const cacheKey = `getProjectDashboard({"panel":"activity","projectName":"${projectName}"})`
            const activity: number[] = state?.restApi?.queries?.[cacheKey]?.data?.activity ?? []
            // Weighted sum: later entries (more recent) get higher weight
            return activity.reduce((sum, val, i) => sum + val * (i + 1), 0)
          }
          return getScore(rowA.original.name) - getScore(rowB.original.name)
        },
      }),
    [store],
  )

  const thumbnailColumn = useMemo<ColumnDef<ProjectTableRow, any>>(() => {
    const thumbnailSize = Math.max(
      70,
      THUMBNAIL_BASE_SIZE + maxGroupDepth * THUMBNAIL_INDENT_PER_DEPTH,
    )
    return columnHelper.accessor('name', {
      id: 'thumbnail',
      header: 'Thumbnail',
      size: thumbnailSize,
      minSize: thumbnailSize,
      meta: {
        listTableCustomCell: true,
      },
      cell: (info) => <ProjectThumbnailCell info={info} />,
    })
  }, [maxGroupDepth])

  const columns = useMemo(
    () => [
      thumbnailColumn,
      ...STATIC_COLUMNS_AFTER_THUMBNAIL,
      heartbeatColumn,
      ...STATIC_COLUMNS_AFTER_HEARTBEAT.map((column) =>
        column.id === 'projectFolder'
          ? {
              ...column,
              sortingFn: (
                rowA: { original: ProjectTableRow },
                rowB: { original: ProjectTableRow },
              ) => {
                const labelA =
                  foldersMap.get(rowA.original.projectFolder ?? '')?.label ?? 'No folder'
                const labelB =
                  foldersMap.get(rowB.original.projectFolder ?? '')?.label ?? 'No folder'
                return labelA.localeCompare(labelB, undefined, { sensitivity: 'base' })
              },
            }
          : column,
      ),
      ...attribColumns,
    ],
    [attribColumns, foldersMap, heartbeatColumn, thumbnailColumn],
  )

  return useMemo(() => ({ columns, columnAttributeData }), [columns, columnAttributeData])
}
