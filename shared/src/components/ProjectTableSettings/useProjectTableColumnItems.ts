import {
  getLinkColumnId,
  getLinkLabel,
  getColumnLabel,
  ENTITY_COLUMN_IDS,
  useProjectTableContext,
} from '@shared/containers/ProjectTreeTable'
import { useProjectContext } from '@shared/context'
import { useMemo } from 'react'
import { AddColumnItem } from './addColumnsMenu'

interface UseProjectTableColumnItemsProps {
  extraColumns?: { value: string; label: string }[]
  hiddenColumns?: string[]
  includeLinks?: boolean
}

const NO_EXTRA_COLUMNS: { value: string; label: string }[] = []
const NO_HIDDEN_COLUMNS: string[] = []

// the settings panel and the table's add button must offer exactly the same columns
export const useProjectTableColumnItems = ({
  extraColumns = NO_EXTRA_COLUMNS,
  hiddenColumns = NO_HIDDEN_COLUMNS,
  includeLinks = true,
}: UseProjectTableColumnItemsProps) => {
  const { linkTypes } = useProjectContext()
  const { attribFields, scopes } = useProjectTableContext()

  const columns: (AddColumnItem & { hidden?: boolean })[] = useMemo(
    () => [
      {
        value: 'thumbnail',
        label: getColumnLabel('thumbnail'),
      },
      {
        value: 'name',
        label:
          scopes.map((scope) => scope.charAt(0).toUpperCase() + scope.slice(1)).join('/') + ' Name',
      },
      {
        value: ENTITY_COLUMN_IDS.folder,
        label: getColumnLabel(ENTITY_COLUMN_IDS.folder),
      },
      {
        value: ENTITY_COLUMN_IDS.task,
        label: getColumnLabel(ENTITY_COLUMN_IDS.task),
        hidden: !['product', 'version'].some((scope) => scopes.includes(scope)),
      },
      {
        value: 'assignees',
        label: getColumnLabel('assignees'),
        hidden: !scopes.includes('task'),
      },
      {
        value: 'product',
        label: getColumnLabel('product'),
        hidden: ['product', 'version'].some((scope) => !scopes.includes(scope)),
      },
      {
        value: 'entityType',
        label: getColumnLabel('entityType'),
      },
      {
        value: 'status',
        label: getColumnLabel('status'),
      },
      {
        value: 'subType',
        label: getColumnLabel('subType', scopes),
      },
      {
        value: 'tags',
        label: getColumnLabel('tags'),
      },
      {
        value: 'createdAt',
        label: getColumnLabel('createdAt'),
      },
      {
        value: 'updatedAt',
        label: getColumnLabel('updatedAt'),
      },
      {
        value: 'subtasks',
        label: getColumnLabel('subtasks'),
        hidden: !scopes.includes('task'),
      },
      {
        value: 'comments',
        label: getColumnLabel('comments'),
        hidden: !scopes.some((scope) => ['task', 'version', 'product', 'folder'].includes(scope)),
      },
      ...attribFields
        .filter((field) => field.scope?.some((scope) => scopes.includes(scope)))
        .map((field) => ({
          value: `attrib_${field.name}`,
          label: field.data.title || field.name,
          attrib: { builtin: field.builtin, scope: field.scope },
        })),
      ...(linkTypes && includeLinks
        ? linkTypes
            .filter((link) =>
              [link.inputType, link.outputType].some((type) => scopes.includes(type)),
            )
            .flatMap((link) => [
              {
                value: getLinkColumnId(link, 'in'),
                label: getLinkLabel(link, 'in'),
                isLink: true,
              },
              {
                value: getLinkColumnId(link, 'out'),
                label: getLinkLabel(link, 'out'),
                isLink: true,
              },
            ])
        : []),
      ...extraColumns,
    ],
    [scopes, attribFields, linkTypes, includeLinks, extraColumns],
  )

  const visibleColumns = useMemo(
    () => columns.filter((column) => !column.hidden && !hiddenColumns.includes(column.value)),
    [columns, hiddenColumns],
  )

  return { columns, visibleColumns, scopes }
}
