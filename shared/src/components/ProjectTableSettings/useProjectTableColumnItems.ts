import {
  getLinkColumnId,
  getLinkLabel,
  getColumnLabel,
  getColumnIcon,
  getNameColumnLabel,
  ENTITY_COLUMN_IDS,
  getScopedColumnId,
  useProjectTableContext,
} from '@shared/containers/ProjectTreeTable'
import { useProjectContext } from '@shared/context'
import { useMemo } from 'react'
import { AddColumnItem } from './addColumnsMenu'
import { getAttributeIcon } from '@shared/util/getAttributeIcon'
import type { ParentColumnDefinition } from '@shared/containers'

interface UseProjectTableColumnItemsProps {
  extraColumns?: { value: string; label: string }[]
  hiddenColumns?: string[]
  includeLinks?: boolean
  parentColumns?: ParentColumnDefinition[]
}

const NO_EXTRA_COLUMNS: { value: string; label: string }[] = []
const NO_HIDDEN_COLUMNS: string[] = []

// the settings panel and the table's add button must offer exactly the same columns
export const useProjectTableColumnItems = ({
  extraColumns = NO_EXTRA_COLUMNS,
  hiddenColumns = NO_HIDDEN_COLUMNS,
  includeLinks = true,
  parentColumns = [],
}: UseProjectTableColumnItemsProps) => {
  const { linkTypes } = useProjectContext()
  const { attribFields, scopes } = useProjectTableContext()

  const columns: (AddColumnItem & { hidden?: boolean })[] = useMemo(
    () => [
      {
        value: 'thumbnail',
        label: getColumnLabel('thumbnail'),
        icon: getColumnIcon('thumbnail'),
      },
      {
        value: 'name',
        label: getNameColumnLabel(scopes),
        icon: getColumnIcon('name'),
      },
      {
        value: ENTITY_COLUMN_IDS.folder,
        label: getColumnLabel(ENTITY_COLUMN_IDS.folder),
        icon: getColumnIcon(ENTITY_COLUMN_IDS.folder),
      },
      {
        value: ENTITY_COLUMN_IDS.task,
        label: getColumnLabel(ENTITY_COLUMN_IDS.task),
        icon: getColumnIcon(ENTITY_COLUMN_IDS.task),
        hidden: !['product', 'version'].some((scope) => scopes.includes(scope)),
      },
      {
        value: 'assignees',
        label: getColumnLabel('assignees'),
        icon: getColumnIcon('assignees'),
        hidden: !scopes.includes('task'),
      },
      {
        value: 'product',
        label: getColumnLabel('product'),
        icon: getColumnIcon('product'),
        hidden: !['product', 'version'].some((scope) => scopes.includes(scope)),
      },
      {
        value: 'entityType',
        label: getColumnLabel('entityType'),
        icon: getColumnIcon('entityType'),
      },
      {
        value: 'status',
        label: getColumnLabel('status'),
        icon: getColumnIcon('status'),
      },
      {
        value: 'subType',
        label: getColumnLabel('subType', scopes),
        icon: getColumnIcon('subType'),
      },
      {
        value: 'tags',
        label: getColumnLabel('tags'),
        icon: getColumnIcon('tags'),
      },
      {
        value: 'createdAt',
        label: getColumnLabel('createdAt'),
        icon: getColumnIcon('createdAt'),
      },
      {
        value: 'updatedAt',
        label: getColumnLabel('updatedAt'),
        icon: getColumnIcon('updatedAt'),
      },
      {
        value: 'subtasks',
        label: getColumnLabel('subtasks'),
        icon: getColumnIcon('subtasks'),
        hidden: !scopes.includes('task'),
      },
      {
        value: 'comments',
        label: getColumnLabel('comments'),
        icon: getColumnIcon('comments'),
        hidden: !scopes.some((scope) => ['task', 'version', 'product', 'folder'].includes(scope)),
      },
      ...attribFields
        .filter((field) => field.scope?.some((scope) => scopes.includes(scope)))
        .map((field) => ({
          value: `attrib_${field.name}`,
          label: field.data.title || field.name,
          icon: getAttributeIcon(field.name, field.data.type, !!field.data.enum),
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
                icon: 'link',
                isLink: true,
              },
              {
                value: getLinkColumnId(link, 'out'),
                label: getLinkLabel(link, 'out'),
                icon: 'link',
                isLink: true,
              },
            ])
        : []),
      ...parentColumns.map((column) => ({
        value: column.id || getScopedColumnId(column.scope, column.field),
        label: column.label,
        parentScope: column.scope,
      })),
      ...Array.from(
        new Set(
          parentColumns
            .filter((column) => column.includeAttributes !== false)
            .map((column) => column.scope),
        ),
      ).flatMap((scope) =>
        attribFields
          .filter((field) => !field.scope || field.scope.includes(scope))
          .map((field) => ({
            value: getScopedColumnId(scope, field.name, true),
            label: field.data.title || field.name,
            attrib: { builtin: field.builtin, scope: field.scope },
            parentScope: scope,
          })),
      ),
      ...extraColumns,
    ],
    [scopes, attribFields, linkTypes, includeLinks, parentColumns, extraColumns],
  )

  const visibleColumns = useMemo(
    () => columns.filter((column) => !column.hidden && !hiddenColumns.includes(column.value)),
    [columns, hiddenColumns],
  )

  return { columns, visibleColumns, scopes }
}
