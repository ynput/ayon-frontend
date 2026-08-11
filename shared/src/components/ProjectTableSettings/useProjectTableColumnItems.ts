import {
  getLinkColumnId,
  getLinkLabel,
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
        label: 'Thumbnail',
      },
      {
        value: 'name',
        label:
          scopes.map((scope) => scope.charAt(0).toUpperCase() + scope.slice(1)).join('/') + ' Name',
      },
      {
        value: 'folder',
        label: 'Folder',
      },
      {
        value: 'assignees',
        label: 'Assignees',
        hidden: !scopes.includes('task'),
      },
      {
        value: 'product',
        label: 'Product name',
        hidden: ['product', 'version'].some((scope) => !scopes.includes(scope)),
      },
      {
        value: 'entityType',
        label: 'Entity type',
      },
      {
        value: 'status',
        label: 'Status',
      },
      {
        value: 'subType',
        label: 'Type',
      },
      {
        value: 'tags',
        label: 'Tags',
      },
      {
        value: 'createdAt',
        label: 'Created At',
      },
      {
        value: 'updatedAt',
        label: 'Updated At',
      },
      {
        value: 'subtasks',
        label: 'Subtasks',
        hidden: !scopes.includes('task'),
      },
      {
        value: 'comments',
        label: 'Latest comments',
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
