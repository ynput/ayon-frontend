import { ColumnDef, FilterFnOption, Row, SortingFn, sortingFns } from '@tanstack/react-table'
import { TableRow } from './types/table'
import { AttributeData, ProjectTableAttribute, BuiltInFieldOptions } from './types'
import {
  CellWidget,
  MetaWidget,
  EntityNameWidget,
  GroupHeaderWidget,
  ThumbnailWidget,
} from './widgets'
import { getCellId, getCellValue } from './utils/cellUtils'
import { LinkColumnHeader, TableCellContent } from './ProjectTreeTable.styled'
import clsx from 'clsx'
import { SelectionCell } from './components/SelectionCell'
import RowSelectionHeader from './components/RowSelectionHeader'
import { ROW_SELECTION_COLUMN_ID } from './context/SelectionCellsContext'
import { TableGroupBy, useCellEditing, useColumnSettingsContext } from './context'
import { NEXT_PAGE_ID } from './hooks/useBuildGroupByTableData'
import LoadMoreWidget from './widgets/LoadMoreWidget'
import { LinkTypeModel } from '@shared/api'
import { LinkWidgetData } from './widgets/LinksWidget'
import { Icon } from '@ynput/ayon-react-components'
import { getEntityTypeIcon } from '@shared/util'
import { NameWidgetData } from '@shared/components/RenameForm'
import { isEntityRestricted } from './utils/restrictedEntity'

export const isEntityExpandable = (entityType: string) => ['folder', 'product'].includes(entityType)

const MIN_SIZE = 50

// Wrapper function for sorting that pushes isLoading rows to the bottom
const withLoadingStateSort = (sortFn: SortingFn<any>): SortingFn<any> => {
  return (rowA, rowB, ...args) => {
    // If row loading states differ, prioritize non-loading rows
    if (rowA.original.isLoading !== rowB.original.isLoading) {
      return rowA.original.isLoading ? 1 : -1
    }
    // Otherwise, use the original sort function
    return sortFn(rowA, rowB, ...args)
  }
}

const pathSort: SortingFn<any> = (rowA, rowB) => {
  const labelA = rowA.original.path || rowA.original.name
  const labelB = rowB.original.path || rowB.original.name
  // sort alphabetically by label
  return labelA.localeCompare(labelB)
}

const valueLengthSort: SortingFn<any> = (rowA, rowB, columnId) => {
  const valueA = getCellValue(rowA.original, columnId)
  const valueB = getCellValue(rowB.original, columnId)
  const lengthA = Array.isArray(valueA) ? valueA.length : valueA ? String(valueA).length : 0
  const lengthB = Array.isArray(valueB) ? valueB.length : valueB ? String(valueB).length : 0
  return lengthA - lengthB
}

type AttribSortingFn = (rowA: any, rowB: any, columnId: string, attribute?: AttributeData) => number
// sort by the order of the enum options
const attribSort: AttribSortingFn = (rowA, rowB, columnId, attrib) => {
  const valueA = getCellValue(rowA.original, columnId)
  const valueB = getCellValue(rowB.original, columnId)
  // if attrib is defined and has enum options, use them
  if (attrib && attrib.enum) {
    const indexA = attrib.enum.findIndex((o) => o.value === valueA)
    const indexB = attrib.enum.findIndex((o) => o.value === valueB)
    return indexB - indexA < 0 ? 1 : -1
  } else if (attrib?.type === 'datetime') {
    return sortingFns.datetime(rowA, rowB, columnId)
  } else if (attrib?.type === 'boolean') {
    const boolA = valueA === true ? 1 : 0
    const boolB = valueB === true ? 1 : 0
    return boolA - boolB
  } else {
    return sortingFns.alphanumeric(rowA, rowB, columnId)
  }
}

export const getLinkLabel = (
  link: Pick<LinkTypeModel, 'linkType'>,
  direction: 'in' | 'out' | string,
) => `${link.linkType.charAt(0).toUpperCase() + link.linkType.slice(1)} (${direction})`

export const getLinkKey = (link: Pick<LinkTypeModel, 'name'>, direction: 'in' | 'out' | string) =>
  `${link.name.replaceAll('_', '').replaceAll('-', '').replaceAll('|', '_')}_${direction}`

export const getLinkColumnId = (
  link: Pick<LinkTypeModel, 'name'>,
  direction: 'in' | 'out' | string,
) => `link_${getLinkKey(link, direction)}`

export type DefaultColumns =
  | typeof ROW_SELECTION_COLUMN_ID
  | 'thumbnail'
  | 'name'
  | 'status'
  | 'subType'
  | 'assignees'
  | 'tags'
  | 'createdAt'
  | 'updatedAt'

export type TreeTableExtraColumn = { column: ColumnDef<TableRow>; position?: number }

export type BuildTreeTableColumnsProps = {
  scopes: string[]
  attribs: ProjectTableAttribute[]
  links: LinkTypeModel[]
  includeLinks?: boolean
  showHierarchy: boolean
  options: BuiltInFieldOptions
  excluded?: (DefaultColumns | string)[]
  extraColumns?: TreeTableExtraColumn[]
  groupBy?: TableGroupBy
  nameLabel?: string
}

const buildTreeTableColumns = ({
  scopes,
  attribs,
  links = [],
  includeLinks = true,
  showHierarchy,
  options,
  excluded,
  extraColumns,
  groupBy,
  nameLabel = 'Entity',
}: BuildTreeTableColumnsProps) => {
  const staticColumns: ColumnDef<TableRow>[] = []

  // Helper to check if a column should be included
  const isIncluded = (id: DefaultColumns | string) => !excluded?.includes(id)

  // Conditionally add static columns
  if (isIncluded(ROW_SELECTION_COLUMN_ID)) {
    staticColumns.push({
      id: ROW_SELECTION_COLUMN_ID,
      enableResizing: false,
      enableSorting: false,
      enablePinning: false,
      enableHiding: false,

      header: () => <RowSelectionHeader />,
      cell: ({ row }) => {
        if (row.original.entityType === 'group' || row.original.metaType) return null
        return <SelectionCell />
      },
      size: 20,
    })
  }

  if (isIncluded('thumbnail')) {
    staticColumns.push({
      id: 'thumbnail',
      header: 'Thumbnail',
      size: 63,
      minSize: 24,
      enableResizing: true,
      enableSorting: false,
      cell: ({ row, column, table }) => {
        if (row.original.entityType === 'group' || row.original.metaType) return null
        const meta = table.options.meta
        if (!meta) return null
        const cellId = getCellId(row.id, column.id)
        let thumbnail = {
          entityId: row.original.entityId || row.id,
          entityType: row.original.entityType,
          updatedAt: row.original.updatedAt,
        }
        // check for thumbnail override
        if (row.original.thumbnail) {
          thumbnail = row.original.thumbnail
        }
        return (
          <ThumbnailWidget
            id={cellId}
            entityId={thumbnail.entityId}
            entityType={thumbnail.entityType}
            updatedAt={thumbnail.updatedAt}
            icon={row.original.icon}
            projectName={meta?.projectName as string}
            className={clsx('thumbnail', {
              loading: row.original.isLoading,
            })}
            isPlayable={row.original.hasReviewables}
          />
        )
      },
    })
  }

  if (isIncluded('name')) {
    staticColumns.push({
      id: 'name',
      accessorKey: 'name',
      header: nameLabel,
      minSize: MIN_SIZE,
      sortingFn: withLoadingStateSort(pathSort),
      enableSorting: groupBy ? false : true,
      enableResizing: true,
      enablePinning: true,
      enableHiding: groupBy ? false : true,
      cell: ({ row, column, table }) => {
        const { value, id, type } = getValueIdType(row, column.id)
        const meta = table.options.meta
        const { isEditing } = useCellEditing()
        const { rowHeight = 40 } = useColumnSettingsContext()
        const cellId = getCellId(row.id, column.id)

        if (row.original.metaType) {
          return (
            <TableCellContent
              id={cellId}
              className={clsx('large', 'readonly', row.original.entityType)}
              style={{
                paddingLeft: `calc(${row.depth * 1}rem + 8px)`,
                pointerEvents: 'none',
              }}
              tabIndex={0}
            >
              <MetaWidget metaType={row.original.metaType} label={row.original.label} />
            </TableCellContent>
          )
        }

        if (row.original.entityType === NEXT_PAGE_ID && row.original.group) {
          return (
            <LoadMoreWidget
              label={'Load more tasks'}
              id={row.original.group.value}
              onLoadMore={(id) => meta?.loadMoreTasks?.(id)}
            />
          )
        }

        const isExpandable =
          row.getCanExpand() && !!row.originalSubRows && isEntityExpandable(row.original.entityType)

        return (
          <TableCellContent
            id={cellId}
            className={clsx('large', row.original.entityType, {
              loading: row.original.isLoading,
              hierarchy: showHierarchy,
            })}
            style={{
              paddingLeft: `calc(${row.depth * 1}rem + ${
                isExpandable || !row.getCanExpand() ? 0 : 32
              }px + 8px)`,
            }}
            tabIndex={0}
          >
            {row.original.group ? (
              <GroupHeaderWidget
                id={row.id}
                label={row.original.group.label}
                name={row.original.name}
                icon={row.original.group.icon}
                img={row.original.group.img}
                color={row.original.group.color}
                count={row.original.group.count}
                isExpanded={row.getIsExpanded()}
                isEmpty={row.subRows.length === 0 && !row.original.metaType}
                toggleExpanded={row.getToggleExpandedHandler()}
              />
            ) : (
              <EntityNameWidget
                id={row.id}
                label={row.original.label}
                name={row.original.name}
                path={!showHierarchy ? '/' + row.original.parents?.join('/') : undefined}
                icon={row.original.icon}
                type={row.original.entityType}
                isExpandable={isExpandable}
                isExpanded={row.getIsExpanded()}
                toggleExpandAll={() => meta?.toggleExpandAll?.([row.id])}
                toggleExpanded={row.getToggleExpandedHandler()}
                rowHeight={rowHeight}
              />
            )}
            {isEditing(cellId) && (
              <CellWidget
                rowId={id}
                className={clsx('name', { loading: row.original.isLoading })}
                columnId={column.id}
                value={value}
                valueData={
                  {
                    name: row.original.name,
                    label: row.original.label,
                    meta,
                    entityRowId: id,
                    columnId: column.id,
                    hasVersions: !!row.original.hasVersions,
                  } as NameWidgetData
                }
                entityType={type}
                attributeData={{ type: 'name' }}
                isCollapsed={!!row.original.childOnlyMatch}
                isReadOnly={meta?.readOnly?.includes(column.id)}
              />
            )}
          </TableCellContent>
        )
      },
    })
  }

  if (isIncluded('status')) {
    staticColumns.push({
      id: 'status',
      accessorKey: 'status',
      minSize: MIN_SIZE,
      header: 'Status',
      sortingFn: withLoadingStateSort((a, b, c) =>
        attribSort(a, b, c, { enum: options.status, type: 'string' }),
      ),
      sortDescFirst: true,
      enableSorting: true,
      enableResizing: true,
      enablePinning: true,
      enableHiding: true,
      cell: ({ row, column, table }) => {
        const { value, id, type } = getValueIdType(row, column.id)
        const meta = table.options.meta
        if (['group', NEXT_PAGE_ID].includes(type) || row.original.metaType) return null

        return (
          <CellWidget
            rowId={id}
            className={clsx('status', { loading: row.original.isLoading })}
            columnId={column.id}
            value={value}
            attributeData={{ type: 'string' }}
            options={meta?.options?.status.filter((s) => s.scope?.includes(type))}
            isCollapsed={!!row.original.childOnlyMatch}
            onChange={(value) =>
              meta?.updateEntities?.(
                { field: column.id, value, type, rowId: id },
                { selection: meta?.selection },
              )
            }
            isReadOnly={meta?.readOnly?.includes(column.id) || isEntityRestricted(type)}
            pt={{
              enum: {
                pt: {
                  template: {
                    pt: {
                      icon: {
                        style: {
                          fontVariationSettings: "'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 20",
                        },
                      },
                    },
                  },
                },
              },
            }}
          />
        )
      },
    })
  }

  if (isIncluded('subType')) {
    staticColumns.push({
      id: 'subType',
      accessorKey: 'subType',
      header: 'Type',
      minSize: MIN_SIZE,
      enableSorting: true,
      enableResizing: true,
      enablePinning: true,
      enableHiding: true,
      sortingFn: withLoadingStateSort((a, b, c) =>
        attribSort(a, b, c, { enum: [...options.folderType, ...options.taskType], type: 'string' }),
      ),
      cell: ({ row, column, table }) => {
        const { value, id, type } = getValueIdType(row, column.id)
        if (['group', NEXT_PAGE_ID].includes(type) || row.original.metaType) return null
        const fieldId = type === 'folder' ? 'folderType' : 'taskType'
        const meta = table.options.meta
        return (
          <CellWidget
            rowId={id}
            className={clsx('subType', { loading: row.original.isLoading })}
            columnId={column.id}
            value={value}
            attributeData={{ type: 'string' }}
            isInherited={type === 'version'} // versions do not have types, we just show the product's type
            options={
              type === 'folder'
                ? meta?.options?.folderType
                : type === 'task'
                ? meta?.options?.taskType
                : []
            }
            isCollapsed={!!row.original.childOnlyMatch}
            onChange={(value) =>
              meta?.updateEntities?.(
                { field: fieldId, value, type, rowId: row.id },
                { selection: meta?.selection },
              )
            }
            isReadOnly={meta?.readOnly?.includes(column.id) || meta?.readOnly?.includes(fieldId)}
          />
        )
      },
    })
  }

  if (isIncluded('assignees')) {
    staticColumns.push({
      id: 'assignees',
      accessorKey: 'assignees',
      header: 'Assignees',
      minSize: MIN_SIZE,
      enableSorting: true,
      enableResizing: true,
      enablePinning: true,
      enableHiding: true,
      sortingFn: withLoadingStateSort(valueLengthSort),
      cell: ({ row, column, table }) => {
        const meta = table.options.meta
        const { value, id, type } = getValueIdType(row, column.id)
        if (['group', NEXT_PAGE_ID].includes(type) || row.original.metaType) return null

        if (type === 'folder')
          return (
            <CellWidget
              rowId={id}
              className={clsx('assignees', { loading: row.original.isLoading })}
              columnId={column.id}
              value=""
              isPlaceholder
            />
          )
        return (
          <CellWidget
            rowId={id}
            className={clsx('assignees', { loading: row.original.isLoading })}
            columnId={column.id}
            value={value}
            attributeData={{ type: 'list_of_strings' }}
            options={meta?.options?.assignee}
            isCollapsed={!!row.original.childOnlyMatch}
            onChange={(value) =>
              meta?.updateEntities?.(
                { field: column.id, value, type, rowId: row.id },
                { selection: meta?.selection },
              )
            }
            isReadOnly={meta?.readOnly?.includes(column.id) || isEntityRestricted(type)}
            pt={{
              enum: {
                multiSelectClose: value?.length === 0, // close the dropdown on first assignment
                search: true, // enable search at all times
                multipleOverride: false,
              },
            }}
          />
        )
      },
    })
  }

  // only show authors column for products
  if (isIncluded('author') && ['version', 'product'].some((s) => scopes.includes(s))) {
    staticColumns.push({
      id: 'author',
      accessorKey: 'author',
      header: 'Author',
      minSize: MIN_SIZE,
      enableSorting: true,
      enableResizing: true,
      enablePinning: true,
      enableHiding: true,
      sortingFn: withLoadingStateSort(pathSort),
      cell: ({ row, column, table }) => {
        const meta = table.options.meta
        const { value, id, type } = getValueIdType(row, column.id)
        if (['group', NEXT_PAGE_ID].includes(type) || row.original.metaType) return null

        return (
          <CellWidget
            rowId={id}
            className={clsx('author', { loading: row.original.isLoading })}
            columnId={column.id}
            value={[value]}
            attributeData={{ type: 'list_of_strings' }}
            options={meta?.options?.assignee}
            isReadOnly={true}
            isInherited={type === 'product'} // products do not have authors, we just show the featured version's author
          />
        )
      },
    })
  }

  if (isIncluded('tags')) {
    staticColumns.push({
      id: 'tags',
      accessorKey: 'tags',
      header: 'Tags',
      minSize: MIN_SIZE,
      enableSorting: true,
      enableResizing: true,
      enablePinning: true,
      enableHiding: true,
      sortingFn: withLoadingStateSort(valueLengthSort),
      cell: ({ row, column, table }) => {
        const meta = table.options.meta
        const { value, id, type } = getValueIdType(row, column.id)
        if (['group', NEXT_PAGE_ID].includes(type) || row.original.metaType) return null
        return (
          <CellWidget
            rowId={id}
            className={clsx('tags', { loading: row.original.isLoading })}
            columnId={column.id}
            value={value}
            attributeData={{ type: 'list_of_strings' }}
            options={meta?.options?.tag}
            isCollapsed={!!row.original.childOnlyMatch}
            onChange={(value) =>
              meta?.updateEntities?.(
                { field: column.id, value, type, rowId: row.id },
                { selection: meta?.selection },
              )
            }
            isReadOnly={meta?.readOnly?.includes(column.id) || isEntityRestricted(type)}
            enableCustomValues
          />
        )
      },
    })
  }

  if (isIncluded('createdAt')) {
    staticColumns.push({
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: 'Created at',
      minSize: MIN_SIZE,
      enableSorting: true,
      enableResizing: true,
      enablePinning: true,
      enableHiding: true,
      sortingFn: withLoadingStateSort(sortingFns.datetime),
      cell: ({ row, column }) => {
        const { value, id, type } = getValueIdType(row, column.id)
        if (['group', NEXT_PAGE_ID].includes(type) || row.original.metaType) return null
        return (
          <CellWidget
            rowId={id}
            className={clsx('createdAt', { loading: row.original.isLoading })}
            columnId={column.id}
            value={value}
            attributeData={{ type: 'datetime' }}
            isCollapsed={!!row.original.childOnlyMatch}
            isReadOnly={true}
          />
        )
      },
    })
  }

  if (isIncluded('updatedAt')) {
    staticColumns.push({
      id: 'updatedAt',
      accessorKey: 'updatedAt',
      header: 'Updated at',
      minSize: MIN_SIZE,
      enableSorting: true,
      enableResizing: true,
      enablePinning: true,
      enableHiding: true,
      sortingFn: withLoadingStateSort(sortingFns.datetime),
      cell: ({ row, column }) => {
        const { value, id, type } = getValueIdType(row, column.id)
        if (['group', NEXT_PAGE_ID].includes(type) || row.original.metaType) return null
        return (
          <CellWidget
            rowId={id}
            className={clsx('updatedAt', { loading: row.original.isLoading })}
            columnId={column.id}
            value={value}
            attributeData={{ type: 'datetime' }}
            isCollapsed={!!row.original.childOnlyMatch}
            isReadOnly={true}
          />
        )
      },
    })
  }

  const attributeColumns: ColumnDef<TableRow>[] = attribs
    .filter((attrib) => {
      // filter out attributes that are out of scope
      if (attrib.scope && !attrib.scope.some((s) => scopes.includes(s))) return false
      const columnId = 'attrib_' + attrib.name
      // Check if the specific attribute column is excluded
      // or if all built-in attributes are excluded and this is a built-in attribute
      if (!isIncluded(columnId)) return false
      if (attrib.builtin && !isIncluded('attrib')) return false
      return true
    })
    .map((attrib) => {
      const attribColumn: ColumnDef<TableRow> = {
        id: 'attrib_' + attrib.name,
        accessorKey: 'attrib.' + attrib.name,
        header: attrib.data.title || attrib.name,
        minSize: MIN_SIZE,
        filterFn: 'fuzzy' as FilterFnOption<TableRow>,
        sortingFn: withLoadingStateSort((a, b, c) => attribSort(a, b, c, attrib.data)),
        enableSorting: true,
        enableResizing: true,
        enablePinning: true,
        enableHiding: true,
        cell: ({ row, column, table }) => {
          const meta = table.options.meta
          const columnIdParsed = column.id.replace('attrib_', '')
          const { value, id, type } = getValueIdType(row, columnIdParsed, 'attrib')
          const isInherited = !row.original.ownAttrib?.includes(columnIdParsed)
          if (['group', NEXT_PAGE_ID].includes(type) || row.original.metaType) return null
          const outOfScopeAndNoValue =
            !attrib.scope?.includes(type as (typeof attrib.scope)[number]) &&
            (value === null || value === undefined)

          // if the attribute is not in scope, we should nothing
          if (outOfScopeAndNoValue) return null

          return (
            <CellWidget
              rowId={id}
              className={clsx('attrib', { loading: row.original.isLoading })}
              columnId={column.id}
              value={value}
              attributeData={{ type: attrib.data.type || 'string' }}
              options={attrib.data.enum || []}
              isCollapsed={!!row.original.childOnlyMatch}
              isInherited={isInherited}
              isReadOnly={
                // check attrib is not read only
                attrib.readOnly ||
                // check if there is any other reason the cell should be read only
                meta?.readOnly?.some(
                  (id) => id === columnIdParsed || (id === 'attrib' && attrib.builtin),
                )
              }
              onChange={(value) =>
                meta?.updateEntities?.(
                  { field: columnIdParsed, value, type, isAttrib: true, rowId: row.id },
                  { selection: !!attrib.data.enum?.length ? meta?.selection : undefined },
                )
              }
            />
          )
        },
      }
      return attribColumn
    })

  const linkColumns: ColumnDef<TableRow>[] = !includeLinks
    ? []
    : links
        .filter((link) => {
          // Check if the link type is excluded
          if (!isIncluded(link.linkType) || !isIncluded('link')) return false
          // Check if inputType and outputType are in scopes
          if (!scopes.includes(link.inputType) || !scopes.includes(link.outputType)) return false
          return true
        })
        .flatMap((link) => {
          const createLinkColumn = (direction: 'in' | 'out'): ColumnDef<TableRow> => {
            return {
              id: getLinkColumnId(link, direction),
              accessorKey: `links.${getLinkKey(link, direction)}`,
              header: () => (
                <LinkColumnHeader>
                  {getLinkLabel(link, direction)}{' '}
                  <Icon
                    icon={getEntityTypeIcon(direction === 'in' ? link.inputType : link.outputType)}
                  />
                </LinkColumnHeader>
              ),
              minSize: MIN_SIZE,
              enableSorting: false,
              enableResizing: true,
              enablePinning: true,
              enableHiding: true,
              cell: ({ row, column }) => {
                const columnIdParsed = column.id.replace('link_', '')

                const { id, value } = getValueIdType(row, columnIdParsed, 'links')
                const cellValue = value?.map((v: any) => v.label)
                const valueData: LinkWidgetData = {
                  links: value,
                  direction: direction,
                  entityId: row.original.entityId || row.original.id,
                  entityType: row.original.entityType,
                  link: {
                    label: link.linkType,
                    linkType: link.name,
                    targetEntityType: direction === 'in' ? link.inputType : link.outputType,
                  },
                }

                return (
                  <CellWidget
                    rowId={id}
                    className={clsx('links', { loading: row.original.isLoading })}
                    columnId={column.id}
                    value={cellValue}
                    valueData={valueData}
                    folderId={row.original.folderId}
                    attributeData={{ type: 'links' }}
                  />
                )
              },
            }
          }

          return [createLinkColumn('in'), createLinkColumn('out')]
        })

  const allColumns = [...staticColumns, ...attributeColumns, ...linkColumns]

  // Add extra columns if provided
  if (extraColumns) {
    extraColumns.forEach(({ column, position = -1 }) => {
      if (position >= 0 && position < allColumns.length) {
        allColumns.splice(position, 0, column)
      } else {
        allColumns.push(column)
      }
    })
  }

  return allColumns
}

export default buildTreeTableColumns

export const getValueIdType = (
  row: Row<TableRow>,
  field: string,
  nestedField?: keyof TableRow,
): {
  value: any
  id: string
  type: string
} => ({
  value: nestedField
    ? (row.original[nestedField as keyof TableRow] as any)?.[field]
    : (row.original[field as keyof TableRow] as any),
  id: row.id,
  type: row.original.entityType,
})
