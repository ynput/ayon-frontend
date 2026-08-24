import { ColumnDef, FilterFnOption, Row, SortingFn, sortingFns } from '@tanstack/react-table'
import {
  EntityData,
  EntityScope,
  EntityType,
  getScopedEntity,
  getScopedValue,
  isFieldSupported,
  ParentColumnDefinition,
  TableRow,
  VersionEntityData,
} from './types/table'
import { ProjectTableAttribute, BuiltInFieldOptions } from './types'
import {
  CellWidget,
  EntityWidget,
  MetaWidget,
  EntityNameWidget,
  GroupHeaderWidget,
  ThumbnailWidget,
} from './widgets'
import { getCellId, getScopedColumnId, parseScopedColumnId } from './utils/cellUtils'
import { LinkColumnHeader, TableCellContent } from './ProjectTreeTable.styled'
import clsx from 'clsx'
import { SelectionCell } from './components/SelectionCell'
import RowSelectionHeader from './components/RowSelectionHeader'
import { TableGroupBy, useCellEditing, useColumnSettingsContext } from './context'
import { ROW_SELECTION_COLUMN_ID } from './constants'
import { NEXT_PAGE_ID, parseGroupId } from './hooks/useBuildGroupByTableData'
import LoadMoreWidget from './widgets/LoadMoreWidget'
import { AttributeData, LinkTypeModel } from '@shared/api'
import { LinkWidgetData } from './widgets/LinksWidget'
import { SubtasksWidgetData } from './widgets/SubtasksWidget'
import { Icon } from '@ynput/ayon-react-components'
import { getEntityTypeIcon } from '@shared/util'
import { NameWidgetData } from '@shared/components/RenameForm'
import { isEntityRestricted, READ_ONLY } from './utils/restrictedEntity'
import { getColumnDisplayConfig } from './types/columnConfig'
import { ENTITY_COLUMN_IDS, normalizeColumnId } from './utils/columnIds'
import { upperFirst } from 'lodash'

export const isEntityExpandable = (entityType: string) => ['folder', 'product'].includes(entityType)

export const COLUMN_MIN_SIZE = 50

export const COLUMN_LABELS: Record<string, string> = {
  thumbnail: 'Thumbnail',
  status: 'Status',
  entityType: 'Entity type',
  subType: 'Type',
  productType: 'Product type',
  assignees: 'Assignees',
  folder_entity: 'Folder',
  task_entity: 'Task',
  author: 'Author',
  version: 'Version number',
  version_entity: 'Version',
  product: 'Product name',
  productBaseType: 'Base type',
  taskType: 'Task type',
  folderType: 'Folder type',
  tags: 'Tags',
  createdAt: 'Created at',
  updatedAt: 'Updated at',
  subtasks: 'Subtasks',
  comments: 'Latest comments',
}

export const getColumnLabel = (columnId: string, scopes: string[] = []) => {
  if (columnId === 'subType' && scopes.some((scope) => ['product', 'version'].includes(scope))) {
    return 'Product type'
  }
  return COLUMN_LABELS[normalizeColumnId(columnId)] || columnId
}

type ColumnSortConfig = {
  sortKey?: string
  sortDescFirst?: boolean
  enabled: boolean
  label: string
  scopes?: string[]
}

// TanStack column IDs are also used by the UI state. Keep API sort keys here
// so a column can use a different identifier without leaking that detail into
// the table state.
export const COLUMN_SORT_CONFIG: Record<string, ColumnSortConfig> = {
  thumbnail: { enabled: false, label: COLUMN_LABELS.thumbnail },
  name: { sortKey: 'name', enabled: true, label: 'Name' },
  entityType: { enabled: false, label: COLUMN_LABELS.entityType },
  status: { sortKey: 'status', sortDescFirst: false, enabled: true, label: COLUMN_LABELS.status },
  assignees: {
    sortKey: 'assignees',
    enabled: true,
    label: COLUMN_LABELS.assignees,
    scopes: ['task'],
  },
  folder_entity: {
    sortKey: 'folderName',
    sortDescFirst: false,
    enabled: true,
    label: COLUMN_LABELS.folder_entity,
  },
  task_entity: {
    sortKey: 'taskName',
    enabled: false,
    label: COLUMN_LABELS.task_entity,
    scopes: ['version', 'product'],
  },
  author: {
    sortKey: 'author',
    enabled: true,
    label: COLUMN_LABELS.author,
    scopes: ['version', 'product'],
  },
  version: {
    sortKey: 'version',
    sortDescFirst: true,
    enabled: true,
    label: COLUMN_LABELS.version,
    scopes: ['version', 'product'],
  },
  version_entity: {
    sortKey: 'version',
    enabled: true,
    label: COLUMN_LABELS.version_entity,
    scopes: ['version', 'product'],
  },
  product: {
    sortKey: 'product',
    enabled: true,
    label: COLUMN_LABELS.product,
    scopes: ['version', 'product'],
  },
  productBaseType: {
    sortKey: 'productBaseType',
    enabled: true,
    label: COLUMN_LABELS.productBaseType,
    scopes: ['version', 'product'],
  },
  taskType: {
    sortKey: 'taskType',
    sortDescFirst: true,
    enabled: true,
    label: COLUMN_LABELS.taskType,
    scopes: ['version', 'product'],
  },
  folderType: {
    sortKey: 'folderType',
    enabled: true,
    label: COLUMN_LABELS.folderType,
    scopes: ['version', 'product'],
  },
  productType: {
    sortKey: 'productType',
    enabled: true,
    label: COLUMN_LABELS.productType,
    scopes: ['version', 'product'],
  },
  tags: { sortKey: 'tags', enabled: true, label: COLUMN_LABELS.tags },
  createdAt: { sortKey: 'createdAt', enabled: true, label: COLUMN_LABELS.createdAt },
  updatedAt: { sortKey: 'updatedAt', enabled: true, label: COLUMN_LABELS.updatedAt },
  subtasks: { enabled: false, label: COLUMN_LABELS.subtasks },
  comments: { enabled: false, label: COLUMN_LABELS.comments },
}

type SortColumnLabel = { value: string; label: string }

export const getNameColumnLabel = (scopes: string[]) =>
  scopes.includes('version')
    ? 'Version / Product'
    : scopes.map((scope) => scope.charAt(0).toUpperCase() + scope.slice(1)).join(' / ')

export const getSortableColumnOptions = (scopes?: string[], columns: SortColumnLabel[] = []) =>
  Object.entries(COLUMN_SORT_CONFIG)
    .filter(
      ([, config]) =>
        config.enabled &&
        (!config.scopes || !scopes || config.scopes.some((scope) => scopes.includes(scope))),
    )
    .map(([id, config]) => ({
      id,
      label:
        columns.find((column) => normalizeColumnId(column.value) === id)?.label ||
        getColumnLabel(id, scopes),
    }))

export const isColumnSortable = (columnId: string) =>
  COLUMN_SORT_CONFIG[normalizeColumnId(columnId)]?.enabled ?? !columnId.startsWith('link_')

export const getColumnSortKey = (columnId?: string, showHierarchy = true, entityType?: string) => {
  if (!columnId) return undefined
  const normalizedColumnId = normalizeColumnId(columnId)
  if (normalizedColumnId === 'name' && !showHierarchy) return 'path'
  if (normalizedColumnId === 'subType') {
    if (entityType === 'folder') return 'folderType'
    if (entityType === 'product' || entityType === 'version') return 'productType'
    if (entityType === 'task') return 'taskType'
  }
  return COLUMN_SORT_CONFIG[normalizedColumnId]?.sortKey ?? normalizedColumnId
}

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

const naturalSortCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

const withNameTieBreaker = (sortFn: SortingFn<any>): SortingFn<any> => {
  return (rowA, rowB, ...args) => {
    const result = sortFn(rowA, rowB, ...args)
    if (result !== 0) return result
    const labelA = rowA.original.primary.label || rowA.original.primary.name || ''
    const labelB = rowB.original.primary.label || rowB.original.primary.name || ''
    return naturalSortCollator.compare(labelA, labelB)
  }
}

const pathSort: SortingFn<any> = (rowA, rowB) => {
  const labelA =
    rowA.original.primary.label || rowA.original.primary.path || rowA.original.primary.name || ''
  const labelB =
    rowB.original.primary.label || rowB.original.primary.path || rowB.original.primary.name || ''
  return naturalSortCollator.compare(labelA, labelB)
}

const getVersionEntity = (row: TableRow): VersionEntityData | undefined => {
  const parent = row.parents?.version
  if (parent?.entityType === 'version') return parent
  return row.primary.entityType === 'version' ? row.primary : undefined
}

const getProductEntity = (row: TableRow): EntityData | undefined =>
  row.parents?.product || (row.primary.entityType === 'product' ? row.primary : undefined)

const getThumbnailEntity = (row: TableRow): EntityData | undefined =>
  row.primary.entityType === 'product' ? getVersionEntity(row) : row.primary

const getPrimaryAttributeEntity = (row: TableRow, attribute: ProjectTableAttribute): EntityData => {
  const isVersionOnly = attribute.scope?.length === 1 && attribute.scope[0] === 'version'
  return row.primary.entityType === 'product' && isVersionOnly
    ? getVersionEntity(row) || row.primary
    : row.primary
}

const getPrimaryAttributeValue = (row: TableRow, attribute: ProjectTableAttribute) => {
  const entity = getPrimaryAttributeEntity(row, attribute)
  return entity === row.primary
    ? getScopedValue(row, 'primary', attribute.name, true)
    : entity.attrib?.[attribute.name]
}

const valueLengthSort: SortingFn<any> = (rowA, rowB, columnId) => {
  const valueA = rowA.getValue(columnId)
  const valueB = rowB.getValue(columnId)
  const lengthA = Array.isArray(valueA) ? valueA.length : valueA ? String(valueA).length : 0
  const lengthB = Array.isArray(valueB) ? valueB.length : valueB ? String(valueB).length : 0
  return lengthA - lengthB
}

type AttribSortingFn = (rowA: any, rowB: any, columnId: string, attribute?: AttributeData) => number
// sort by the order of the enum options
const attribSort: AttribSortingFn = (rowA, rowB, columnId, attrib) => {
  const valueA = rowA.getValue(columnId)
  const valueB = rowB.getValue(columnId)
  // if attrib is defined and has enum options, use them
  if (attrib && attrib.enum) {
    const indexA = attrib.enum.findIndex((o) => o.value === valueA)
    const indexB = attrib.enum.findIndex((o) => o.value === valueB)
    return indexA - indexB
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
  | 'entityType'
  | typeof ENTITY_COLUMN_IDS.folder
  | 'status'
  | 'subType'
  | 'assignees'
  | 'tags'
  | 'createdAt'
  | 'updatedAt'
  | 'comments'

export type TreeTableExtraColumn = { column: ColumnDef<TableRow>; position?: number }

export type BuildTreeTableColumnsProps = {
  scopes: string[]
  attribs: ProjectTableAttribute[]
  links: LinkTypeModel[]
  includeLinks?: boolean
  showHierarchy: boolean
  isFlatFolderView?: boolean
  options: BuiltInFieldOptions
  excluded?: (DefaultColumns | string)[]
  excludedSorting?: (DefaultColumns | string)[]
  extraColumns?: TreeTableExtraColumn[]
  groupBy?: TableGroupBy
  nameLabel?: string
  includeParents?: EntityType[]
  parentColumns?: ParentColumnDefinition[]
}

const getScopedHeader = (scope: EntityScope, header: string) =>
  scope === 'primary' ? header : `${upperFirst(scope)} ${header}`

const createEntityColumn = (
  column: ColumnDef<TableRow>,
  field: string,
  scope: EntityScope,
): ColumnDef<TableRow> => {
  const id = getScopedColumnId(scope, field)
  const header =
    typeof column.header === 'string' ? getScopedHeader(scope, column.header) : column.header

  return {
    ...column,
    id,
    header,
    accessorFn: (row) => getScopedValue(row, scope, field),
    cell: (context) => {
      const entity = getScopedEntity(context.row.original, scope)
      if (!entity || context.row.original.group || context.row.original.metaType) return null
      if (!isFieldSupported(field, entity.entityType)) return <div className="readonly" />
      return typeof column.cell === 'function' ? column.cell(context) : column.cell
    },
  }
}

const createParentColumn = (definition: ParentColumnDefinition): ColumnDef<TableRow> => {
  const { scope, field } = definition
  const id = definition.id || getScopedColumnId(scope, field)
  const getEntity = (row: TableRow) =>
    getScopedEntity(row, scope) ||
    (definition.fallbackToPrimary && row.primary.entityType === scope ? row.primary : undefined)
  const getValue = (row: TableRow) => {
    const entity = getEntity(row)
    return entity
      ? getScopedValue(row, entity === row.primary ? 'primary' : scope, field)
      : undefined
  }

  return {
    id,
    header: definition.label,
    accessorFn: getValue,
    minSize: COLUMN_MIN_SIZE,
    enableSorting: definition.sortable ?? isColumnSortable(id),
    enableResizing: true,
    enablePinning: true,
    enableHiding: true,
    sortingFn: withLoadingStateSort(withNameTieBreaker(sortingFns.alphanumeric)),
    cell: ({ row, column, table }) => {
      const entity = getEntity(row.original)
      if (!entity || row.original.group || row.original.metaType) return null
      if (!isFieldSupported(field, entity.entityType)) return <div className="readonly" />

      const value = getValue(row.original)
      const meta = table.options.meta
      const updateField = definition.updateField || field
      const isReadOnly =
        definition.readOnly === true ||
        meta?.readOnly?.includes(column.id) ||
        (definition.readOnly !== false && meta?.readOnly?.includes(updateField))

      return (
        <CellWidget
          rowId={row.id}
          className={clsx('parent-column', { loading: row.original.isLoading })}
          columnId={column.id}
          value={value}
          attributeData={{ type: definition.dataType || 'string' }}
          options={
            definition.optionKey
              ? meta?.options?.[definition.optionKey as keyof BuiltInFieldOptions]
              : undefined
          }
          isCollapsed={!!row.original.childOnlyMatch}
          isReadOnly={isReadOnly}
          onChange={(nextValue) =>
            !isReadOnly &&
            meta?.updateEntities?.({
              id: entity.id,
              rowId: row.id,
              type: entity.entityType,
              field: updateField,
              value: nextValue,
              entityData: entity,
            })
          }
        />
      )
    },
  }
}

const createParentAttributeColumn = (
  attribute: ProjectTableAttribute,
  scope: EntityType,
): ColumnDef<TableRow> => {
  const id = getScopedColumnId(scope, attribute.name, true)

  return {
    id,
    header: getScopedHeader(scope, attribute.data.title || attribute.name),
    accessorFn: (row) => getScopedValue(row, scope, attribute.name, true),
    minSize: COLUMN_MIN_SIZE,
    enableSorting: isColumnSortable(id),
    enableResizing: true,
    enablePinning: true,
    enableHiding: true,
    sortingFn: withLoadingStateSort(
      withNameTieBreaker((a, b, c) => attribSort(a, b, c, attribute.data)),
    ),
    cell: ({ row, column, table }) => {
      const entity = getScopedEntity(row.original, scope)
      if (!entity || row.original.group || row.original.metaType) return null

      const meta = table.options.meta
      const value = getScopedValue(row.original, scope, attribute.name, true)
      const isInherited = !entity.ownAttrib?.includes(attribute.name)
      const isReadOnly =
        attribute.readOnly ||
        meta?.readOnly?.includes(id) ||
        meta?.readOnly?.includes(`attrib_${attribute.name}`) ||
        meta?.readOnly?.includes('attrib')

      return (
        <CellWidget
          rowId={row.id}
          className={clsx('attrib', { loading: row.original.isLoading })}
          columnId={column.id}
          value={value}
          attributeData={{
            type: attribute.data.type || 'string',
            widget: attribute.data.widget,
          }}
          options={attribute.data.enum || []}
          isInherited={isInherited}
          isReadOnly={isReadOnly}
          onChange={(nextValue) =>
            !isReadOnly &&
            meta?.updateEntities?.({
              id: entity.id,
              rowId: row.id,
              type: entity.entityType,
              field: attribute.name,
              value: nextValue,
              entityData: entity,
              isAttrib: true,
            })
          }
        />
      )
    },
  }
}

const createThumbnailColumn = (scope: EntityScope): ColumnDef<TableRow> => ({
  id: scope === 'primary' ? 'thumbnail' : getScopedColumnId(scope, 'thumbnail'),
  header: scope === 'primary' ? 'Thumbnail' : `${upperFirst(scope)} Thumbnail`,
  size: 63,
  minSize: 24,
  enableResizing: true,
  enableSorting: false,
  cell: ({ row, column, table }) => {
    if (row.original.group || row.original.metaType || row.original.isLoading) return null
    const meta = table.options.meta
    const entity =
      scope === 'primary' ? getThumbnailEntity(row.original) : getScopedEntity(row.original, scope)
    if (!meta || !entity) return null

    return (
      <ThumbnailWidget
        id={getCellId(row.id, column.id)}
        entityId={entity.id}
        entityType={entity.entityType}
        thumbnailHash={entity.thumbnailHash}
        icon={entity.icon || undefined}
        projectName={meta.projectName as string}
        className={clsx('thumbnail', { loading: row.original.isLoading })}
        isPlayable={entity.hasReviewables}
      />
    )
  },
})

const buildTreeTableColumns = ({
  scopes,
  attribs,
  links = [],
  includeLinks = true,
  showHierarchy,
  isFlatFolderView,
  options,
  excluded,
  excludedSorting,
  extraColumns,
  groupBy,
  nameLabel = 'Entity',
  includeParents = [],
  parentColumns: parentColumnDefinitions = [],
}: BuildTreeTableColumnsProps) => {
  const staticColumns: ColumnDef<TableRow>[] = []

  // Helper to check if a column should be included
  const isIncluded = (id: DefaultColumns | string) =>
    !excluded?.some((excludedId) => normalizeColumnId(excludedId) === normalizeColumnId(id))
  const canSort = (id: DefaultColumns | string) =>
    isColumnSortable(id) &&
    !excludedSorting?.some((excludedId) => normalizeColumnId(excludedId) === normalizeColumnId(id))

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
        if (row.original.group || row.original.metaType) return null
        return <SelectionCell />
      },
      size: 20,
    })
  }

  if (isIncluded('thumbnail')) {
    staticColumns.push(createThumbnailColumn('primary'))
  }

  if (isIncluded('name')) {
    staticColumns.push({
      id: 'name',
      accessorFn: (row) => getScopedValue(row, 'primary', 'name'),
      header: nameLabel,
      minSize: COLUMN_MIN_SIZE,
      sortingFn: withLoadingStateSort(pathSort),
      enableSorting: groupBy && groupBy.id !== 'folder' ? false : canSort('name'),
      enableResizing: true,
      enablePinning: true,
      enableHiding: !(groupBy && groupBy.id !== 'folder'),
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
              className={clsx('large', 'readonly', row.original.primary.entityType)}
              style={{
                paddingLeft: `calc(${row.depth * 1}rem + 8px)`,
                pointerEvents: 'none',
              }}
              tabIndex={0}
            >
              <MetaWidget
                metaType={row.original.metaType}
                label={row.original.primary.label || row.original.primary.name || ''}
              />
            </TableCellContent>
          )
        }

        if (row.original.id.endsWith(NEXT_PAGE_ID) && row.original.group) {
          return (
            <LoadMoreWidget
              id={row.original.group.value}
              onLoadMore={(id) => meta?.loadMoreRows?.(id)}
            />
          )
        }

        const isExpandable =
          row.getCanExpand() &&
          !!row.originalSubRows &&
          (isEntityExpandable(row.original.primary.entityType) || !!row.original.group)

        return (
          <TableCellContent
            id={cellId}
            className={clsx('large', row.original.primary.entityType, {
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
                name={row.original.primary.name || ''}
                icon={row.original.group.icon}
                img={row.original.group.img}
                color={row.original.group.color}
                count={row.original.group.count}
                percentage={row.original.group.percentage}
                isExpanded={row.getIsExpanded()}
                isEmpty={row.original.group.count === 0}
                toggleExpanded={row.getToggleExpandedHandler()}
              />
            ) : (
              <EntityNameWidget
                id={row.id}
                entity={row.original.primary}
                path={!showHierarchy && !isFlatFolderView ? row.original.primary.path : undefined}
                isExpandable={isExpandable}
                isExpanded={row.getIsExpanded()}
                toggleExpandAll={() => meta?.toggleExpandAll?.([row.id])}
                toggleExpanded={row.getToggleExpandedHandler()}
                rowHeight={rowHeight}
                columnDisplayConfig={getColumnDisplayConfig(meta?.columnsConfig, 'name')}
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
                    name: row.original.primary.name,
                    label: row.original.primary.label,
                    meta,
                    entityRowId: id,
                    columnId: column.id,
                    hasVersions:
                      row.original.primary.entityType === 'folder' &&
                      !!row.original.primary.hasVersions,
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
      accessorFn: (row) => getScopedValue(row, 'primary', 'status'),
      minSize: COLUMN_MIN_SIZE,
      header: getColumnLabel('status'),
      sortingFn: withLoadingStateSort(
        withNameTieBreaker((a, b, c) =>
          attribSort(a, b, c, { enum: options.status, type: 'string' }),
        ),
      ),
      sortDescFirst: COLUMN_SORT_CONFIG.status.sortDescFirst,
      enableSorting: canSort('status'),
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
            isReadOnly={
              meta?.readOnly?.includes(column.id) ||
              isEntityRestricted(type) ||
              parseScopedColumnId(column.id).scope !== 'primary'
            }
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

  if (isIncluded('entityType')) {
    staticColumns.push({
      id: 'entityType',
      accessorFn: (row) => row.primary.entityType,
      header: getColumnLabel('entityType'),
      minSize: 20,
      enableSorting: false,
      enableResizing: true,
      enablePinning: true,
      enableHiding: true,
      sortingFn: withLoadingStateSort(withNameTieBreaker(sortingFns.alphanumeric)),
      cell: ({ row, column, table }) => {
        const { value, id, type } = getValueIdType(row, column.id)
        if (['group', NEXT_PAGE_ID].includes(type) || row.original.metaType) return null
        const cellId = getCellId(row.id, column.id)

        return (
          <TableCellContent
            id={cellId}
            className={clsx('entityType', READ_ONLY, type, { loading: row.original.isLoading })}
            tabIndex={0}
          >
            <Icon icon={getEntityTypeIcon(type)} /> {upperFirst(value)}
          </TableCellContent>
        )
      },
    })
  }

  if (isIncluded('subType')) {
    staticColumns.push({
      id: 'subType',
      accessorFn: (row) => getScopedValue(row, 'primary', 'subType'),
      header: getColumnLabel('subType', scopes),
      minSize: COLUMN_MIN_SIZE,
      enableSorting: canSort('subType'),
      enableResizing: true,
      enablePinning: true,
      enableHiding: true,
      sortDescFirst: COLUMN_SORT_CONFIG.taskType.sortDescFirst,
      sortingFn: withLoadingStateSort(
        withNameTieBreaker((a, b, c) =>
          attribSort(a, b, c, {
            enum: [...options.folderType, ...options.taskType],
            type: 'string',
          }),
        ),
      ),
      cell: ({ row, column, table }) => {
        const { value, id, type } = getValueIdType(row, column.id)
        if (['group', NEXT_PAGE_ID].includes(type) || row.original.metaType) return null
        const fieldId = type === 'folder' ? 'folderType' : 'taskType'
        const meta = table.options.meta
        const folderHasVersions =
          type === 'folder' &&
          row.original.primary.entityType === 'folder' &&
          row.original.primary.hasVersions
        return (
          <CellWidget
            rowId={id}
            className={clsx('subType', { loading: row.original.isLoading })}
            columnId={column.id}
            value={value}
            attributeData={{ type: 'string' }}
            options={
              type === 'folder'
                ? meta?.options?.folderType
                : type === 'task'
                ? meta?.options?.taskType
                : type === 'product' || type === 'version'
                ? meta?.options?.productType
                : []
            }
            isCollapsed={!!row.original.childOnlyMatch}
            onChange={(value) =>
              meta?.updateEntities?.(
                { field: fieldId, value, type, rowId: row.id },
                { selection: meta?.selection },
              )
            }
            isReadOnly={
              meta?.readOnly?.includes(column.id) ||
              meta?.readOnly?.includes(fieldId) ||
              folderHasVersions ||
              parseScopedColumnId(column.id).scope !== 'primary'
            }
            tooltip={
              folderHasVersions
                ? 'Folder type cannot be edited when versions exist within the folder'
                : undefined
            }
            pt={{
              enum: {
                pt: {
                  template: {
                    iconOnlyColor: true,
                  },
                },
              },
            }}
          />
        )
      },
    })
  }

  if (isIncluded('assignees')) {
    staticColumns.push({
      id: 'assignees',
      accessorFn: (row) => getScopedValue(row, 'primary', 'assignees'),
      header: getColumnLabel('assignees'),
      minSize: COLUMN_MIN_SIZE,
      enableSorting: canSort('assignees'),
      enableResizing: true,
      enablePinning: true,
      enableHiding: true,
      sortingFn: withLoadingStateSort(withNameTieBreaker(valueLengthSort)),
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
            isReadOnly={
              meta?.readOnly?.includes(column.id) ||
              isEntityRestricted(type) ||
              parseScopedColumnId(column.id).scope !== 'primary'
            }
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

  if (isIncluded(ENTITY_COLUMN_IDS.folder)) {
    staticColumns.push({
      id: ENTITY_COLUMN_IDS.folder,
      accessorFn: (row) => row.parents?.folder?.label || row.parents?.folder?.name,
      header: getColumnLabel(ENTITY_COLUMN_IDS.folder),
      minSize: COLUMN_MIN_SIZE,
      sortDescFirst: COLUMN_SORT_CONFIG.folder_entity.sortDescFirst,
      sortingFn: withLoadingStateSort(pathSort),
      enableSorting: canSort(ENTITY_COLUMN_IDS.folder),
      enableResizing: true,
      enablePinning: true,
      enableHiding: true,
      cell: ({ row, column, table }) => {
        const folder = row.original.parents?.folder
        if (!folder || row.original.group || row.original.metaType) return null

        return (
          <EntityWidget
            rowId={folder.id}
            className="folder"
            columnId={column.id}
            value={folder.label || folder.name}
            entityId={folder.id}
            entityType="folder"
            subType={folder.entityType === 'folder' ? folder.subType : undefined}
            isLoading={row.original.isLoading}
          />
        )
      },
    })
  }

  // related task entity column for versions and products
  if (
    isIncluded(ENTITY_COLUMN_IDS.task) &&
    ['version', 'product'].some((s) => scopes.includes(s))
  ) {
    staticColumns.push({
      id: ENTITY_COLUMN_IDS.task,
      accessorFn: (row) => row.parents?.task?.label || row.parents?.task?.name,
      header: getColumnLabel(ENTITY_COLUMN_IDS.task),
      minSize: COLUMN_MIN_SIZE,
      enableSorting: canSort(ENTITY_COLUMN_IDS.task),
      enableResizing: true,
      enablePinning: true,
      enableHiding: true,
      sortingFn: withLoadingStateSort(pathSort),
      cell: ({ row, column }) => {
        const task = row.original.parents?.task
        if (!task || row.original.group || row.original.metaType) return null

        return (
          <EntityWidget
            rowId={task.id}
            className="task_entity"
            columnId={column.id}
            value={task.label || task.name}
            entityId={task.id}
            entityType="task"
            subType={task.entityType === 'task' ? task.subType : undefined}
            isLoading={row.original.isLoading}
          />
        )
      },
    })
  }

  // only show authors column for products
  if (isIncluded('author') && ['version', 'product'].some((s) => scopes.includes(s))) {
    staticColumns.push({
      id: 'author',
      accessorFn: (row) => getVersionEntity(row)?.author,
      header: getColumnLabel('author'),
      minSize: COLUMN_MIN_SIZE,
      enableSorting: canSort('author'),
      enableResizing: true,
      enablePinning: true,
      enableHiding: true,
      sortingFn: withLoadingStateSort(pathSort),
      cell: ({ row, column, table }) => {
        const meta = table.options.meta
        const versionEntity = getVersionEntity(row.original)
        const value = versionEntity?.author || ''
        const type = versionEntity?.entityType || row.original.primary.entityType
        if (['group', NEXT_PAGE_ID].includes(type) || row.original.metaType) return null

        return (
          <CellWidget
            rowId={row.id}
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

  // version entity column for versions and products
  if (
    isIncluded(ENTITY_COLUMN_IDS.version) &&
    ['version', 'product'].some((s) => scopes.includes(s))
  ) {
    staticColumns.push({
      id: ENTITY_COLUMN_IDS.version,
      accessorFn: (row) => getVersionEntity(row)?.versionName || getVersionEntity(row)?.name,
      header: getColumnLabel(ENTITY_COLUMN_IDS.version),
      minSize: COLUMN_MIN_SIZE,
      enableSorting: canSort(ENTITY_COLUMN_IDS.version),
      enableResizing: true,
      enablePinning: true,
      enableHiding: true,
      sortingFn: withLoadingStateSort(pathSort),
      cell: ({ row, column }) => {
        const versionEntity = getVersionEntity(row.original)
        const value = versionEntity?.versionName || versionEntity?.name || ''
        const type = versionEntity?.entityType || row.original.primary.entityType
        if (['group', NEXT_PAGE_ID].includes(type) || row.original.metaType) return null
        let versionValue = value
        if (row.original.primary.entityType === 'product') {
          // show summary of versions for products
          versionValue = versionEntity
            ? `${versionEntity.versionName || versionEntity.name} (${
                row.original.primary.versionsCount || 0
              } versions)`
            : ''
        }

        return (
          <EntityWidget
            rowId={row.id}
            className="version-entity"
            columnId={column.id}
            value={versionValue}
            entityId={versionEntity?.id}
            entityType="version"
            isLoading={row.original.isLoading}
          />
        )
      },
    })
  }

  // version number column for versions and products
  if (isIncluded('version') && ['version', 'product'].some((s) => scopes.includes(s))) {
    staticColumns.push({
      id: 'version',
      accessorFn: (row) => getVersionEntity(row)?.version,
      header: getColumnLabel('version'),
      minSize: COLUMN_MIN_SIZE,
      sortDescFirst: COLUMN_SORT_CONFIG.version.sortDescFirst,
      enableSorting: canSort('version'),
      enableResizing: true,
      enablePinning: true,
      enableHiding: true,
      sortingFn: withLoadingStateSort(withNameTieBreaker(sortingFns.basic)),
      cell: ({ row, column }) => {
        const versionEntity = getVersionEntity(row.original)
        const value = versionEntity?.version ?? 0
        const type = versionEntity?.entityType || row.original.primary.entityType
        if (['group', NEXT_PAGE_ID].includes(type) || row.original.metaType) return null

        return (
          <CellWidget
            rowId={row.id}
            className={clsx('version', { loading: row.original.isLoading })}
            columnId={column.id}
            value={value}
            attributeData={{ type: 'integer' }}
            isReadOnly={true}
          />
        )
      },
    })
  }

  // product name column for versions and products
  if (isIncluded('product') && ['version', 'product'].some((s) => scopes.includes(s))) {
    staticColumns.push({
      id: 'product',
      accessorFn: (row) => getProductEntity(row)?.label || getProductEntity(row)?.name,
      header: getColumnLabel('product'),
      minSize: COLUMN_MIN_SIZE,
      enableSorting: canSort('product'),
      enableResizing: true,
      enablePinning: true,
      enableHiding: true,
      sortingFn: withLoadingStateSort(pathSort),
      cell: ({ row, column }) => {
        const productEntity = getProductEntity(row.original)
        const value = productEntity?.label || productEntity?.name || ''
        const type = productEntity?.entityType || row.original.primary.entityType
        if (['group', NEXT_PAGE_ID].includes(type) || row.original.metaType) return null

        return (
          <CellWidget
            rowId={row.id}
            className={clsx('product', { loading: row.original.isLoading })}
            columnId={column.id}
            value={value}
            attributeData={{ type: 'string' }}
            isReadOnly={true}
          />
        )
      },
    })
  }

  if (isIncluded('tags')) {
    staticColumns.push({
      id: 'tags',
      accessorFn: (row) => getScopedValue(row, 'primary', 'tags'),
      header: getColumnLabel('tags'),
      minSize: COLUMN_MIN_SIZE,
      enableSorting: canSort('tags'),
      enableResizing: true,
      enablePinning: true,
      enableHiding: true,
      sortingFn: withLoadingStateSort(withNameTieBreaker(valueLengthSort)),
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
            isReadOnly={
              meta?.readOnly?.includes(column.id) ||
              isEntityRestricted(type) ||
              parseScopedColumnId(column.id).scope !== 'primary'
            }
            enableCustomValues
          />
        )
      },
    })
  }

  if (isIncluded('createdAt')) {
    staticColumns.push({
      id: 'createdAt',
      accessorFn: (row) => getScopedValue(row, 'primary', 'createdAt'),
      header: getColumnLabel('createdAt'),
      minSize: COLUMN_MIN_SIZE,
      enableSorting: canSort('createdAt'),
      enableResizing: true,
      enablePinning: true,
      enableHiding: true,
      sortingFn: withLoadingStateSort(withNameTieBreaker(sortingFns.datetime)),
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
            pt={{ date: { showTime: true } }}
          />
        )
      },
    })
  }

  if (isIncluded('updatedAt')) {
    staticColumns.push({
      id: 'updatedAt',
      accessorFn: (row) => getScopedValue(row, 'primary', 'updatedAt'),
      header: getColumnLabel('updatedAt'),
      minSize: COLUMN_MIN_SIZE,
      enableSorting: canSort('updatedAt'),
      enableResizing: true,
      enablePinning: true,
      enableHiding: true,
      sortingFn: withLoadingStateSort(withNameTieBreaker(sortingFns.datetime)),
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
            pt={{ date: { showTime: true } }}
          />
        )
      },
    })
  }

  if (isIncluded('subtasks') && scopes.includes('task')) {
    staticColumns.push({
      id: 'subtasks',
      accessorFn: (row) => (row.primary.entityType === 'task' ? row.primary.subtasks : undefined),
      header: getColumnLabel('subtasks'),
      minSize: COLUMN_MIN_SIZE,
      enableSorting: false,
      enableResizing: true,
      enablePinning: true,
      enableHiding: true,
      cell: ({ row, column, table }) => {
        const meta = table.options.meta
        const { value, id, type } = getValueIdType(row, column.id)
        if (['group', NEXT_PAGE_ID].includes(type) || row.original.metaType) return null

        // only show for tasks
        if (type !== 'task') return <div className="readonly"></div>

        const subtasksData: SubtasksWidgetData = {
          taskId: parseGroupId(row.id) || row.original.primary.id,
          subtasks: value || [],
        }

        return (
          <CellWidget
            rowId={id}
            className={clsx('subtasks', { loading: row.original.isLoading })}
            columnId={column.id}
            value={subtasksData.subtasks?.map((s: any) => s.label || s.name) || []}
            valueData={subtasksData}
            attributeData={{ type: 'subtasks' }}
            isReadOnly={meta?.readOnly?.includes(column.id)}
          />
        )
      },
    })
  }

  if (
    isIncluded('comments') &&
    scopes.some((s) => ['task', 'version', 'product', 'folder'].includes(s))
  ) {
    staticColumns.push({
      id: 'comments',
      accessorFn: (row) =>
        row.primary.entityType === 'product'
          ? row.parents?.version?.latestComments || []
          : row.primary.latestComments || [],
      header: getColumnLabel('comments'),
      minSize: COLUMN_MIN_SIZE,
      enableSorting: false,
      enableResizing: true,
      enablePinning: true,
      enableHiding: true,
      cell: ({ row, column }) => {
        const isProductRow = row.original.primary.entityType === 'product'
        const entity = isProductRow
          ? row.original.parents?.version || row.original.primary
          : row.original.primary
        const value = isProductRow
          ? row.original.parents?.version?.latestComments || []
          : row.original.primary.latestComments || []
        const type = entity.entityType
        if (['group', NEXT_PAGE_ID].includes(type) || row.original.metaType) return null

        // loading placeholder rows have no entityType yet — let them through so the skeleton shows
        // products borrow their featured version's comments; folders only have data on GQL-fed pages (Lists)
        if (!row.original.isLoading && !['task', 'version', 'product', 'folder'].includes(type))
          return <div className="readonly"></div>

        return (
          <CellWidget
            rowId={row.id}
            className={clsx('comments', { loading: row.original.isLoading })}
            columnId={column.id}
            value={''}
            valueData={value || []}
            attributeData={{ type: 'comments' }}
            isCollapsed={!!row.original.childOnlyMatch}
            isReadOnly
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
        accessorFn: (row) => getPrimaryAttributeValue(row, attrib),
        header: attrib.data.title || attrib.name,
        minSize: COLUMN_MIN_SIZE,
        filterFn: 'fuzzy' as FilterFnOption<TableRow>,
        sortingFn: withLoadingStateSort(
          withNameTieBreaker((a, b, c) => attribSort(a, b, c, attrib.data)),
        ),
        enableSorting: canSort(attrib.name) && canSort('attrib'),
        enableResizing: true,
        enablePinning: true,
        enableHiding: true,
        cell: ({ row, column, table }) => {
          const meta = table.options.meta
          const columnIdParsed = column.id.replace('attrib_', '')
          const { type: rowType } = getValueIdType(row, columnIdParsed, 'attrib')
          const entity = getPrimaryAttributeEntity(row.original, attrib)
          const value = getPrimaryAttributeValue(row.original, attrib)
          const id = entity.id
          const type = entity.entityType
          const isInherited = !entity.ownAttrib?.includes(columnIdParsed)
          if (['group', NEXT_PAGE_ID].includes(type) || row.original.metaType) return null
          const outOfScopeAndNoValue =
            !attrib.scope?.includes(rowType as (typeof attrib.scope)[number]) &&
            (value === null || value === undefined)

          // if the attribute is not in scope, we should nothing
          if (outOfScopeAndNoValue) return null

          return (
            <CellWidget
              rowId={row.id}
              className={clsx('attrib', { loading: row.original.isLoading })}
              columnId={column.id}
              value={value}
              attributeData={{ type: attrib.data.type || 'string', widget: attrib.data.widget }}
              options={attrib.data.enum || []}
              midnightExclusiveFields={row.original.midnightExclusiveFields}
              isCollapsed={!!row.original.childOnlyMatch}
              isInherited={isInherited}
              isReadOnly={
                // check attrib is not read only
                attrib.readOnly ||
                // check if there is any other reason the cell should be read only
                meta?.readOnly?.some(
                  (id) => id === columnIdParsed || (id === 'attrib' && attrib.builtin),
                ) ||
                parseScopedColumnId(column.id).scope !== 'primary'
              }
              onChange={(value) =>
                meta?.updateEntities?.(
                  {
                    field: columnIdParsed,
                    value,
                    type,
                    id,
                    isAttrib: true,
                    rowId: row.id,
                    entityData: entity,
                  },
                  {
                    selection:
                      entity === row.original.primary && !!attrib.data.enum?.length
                        ? meta?.selection
                        : undefined,
                  },
                )
              }
            />
          )
        },
      }
      return attribColumn
    })

  const createLinkColumns = (scope: EntityScope): ColumnDef<TableRow>[] =>
    links
      .filter((link) => {
        // Check if the link type is excluded
        if (!isIncluded(link.linkType) || !isIncluded('link')) return false
        // Check if inputType and outputType are in scopes
        if (!scopes.includes(link.inputType) && !scopes.includes(link.outputType)) return false
        return true
      })
      .flatMap((link) =>
        (['in', 'out'] as const).map((direction) => {
          const linkColumnId = getLinkColumnId(link, direction)
          const columnId =
            scope === 'primary' ? linkColumnId : getScopedColumnId(scope, linkColumnId)
          return {
            id: columnId,
            accessorFn: (row) => getScopedEntity(row, scope)?.links?.[getLinkKey(link, direction)],
            header: () => (
              <LinkColumnHeader>
                {scope === 'primary' ? '' : `${upperFirst(scope)} `}
                {getLinkLabel(link, direction)}{' '}
                <Icon
                  icon={getEntityTypeIcon(direction === 'in' ? link.inputType : link.outputType)}
                />
              </LinkColumnHeader>
            ),
            minSize: COLUMN_MIN_SIZE,
            enableSorting: false,
            enableResizing: true,
            enablePinning: true,
            enableHiding: true,
            cell: ({ row, column, table }) => {
              const { id, value } = getValueIdType(row, column.id, 'links')
              const cellValue = value?.map((v: any) => v.label)
              const entity = getScopedEntity(row.original, scope)
              if (!entity) return null
              const isLinksLoading =
                scope === 'primary' && !!table.options.meta?.loadingLinksEntityIds?.has(entity.id)
              const valueData: LinkWidgetData = {
                links: value,
                direction,
                entityId: entity.id,
                entityType: entity.entityType,
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
                  folderId={row.original.parents?.folder?.id}
                  attributeData={{ type: 'links' }}
                  isLinksLoading={isLinksLoading}
                />
              )
            },
          }
        }),
      )

  const linkColumns: ColumnDef<TableRow>[] = includeLinks ? createLinkColumns('primary') : []
  const parentColumnFields = new Set([
    'status',
    'assignees',
    'author',
    'version',
    'tags',
    'createdAt',
    'updatedAt',
  ])
  const configuredParentFields = new Set(
    parentColumnDefinitions.map((definition) => `${definition.scope}:${definition.field}`),
  )
  const genericParentColumns = includeParents.flatMap((scope) =>
    staticColumns
      .filter(
        (column) =>
          parentColumnFields.has(column.id as string) &&
          !configuredParentFields.has(`${scope}:${column.id as string}`),
      )
      .map((column) => createEntityColumn(column, column.id as string, scope)),
  )
  const configuredParentColumns = parentColumnDefinitions
    .filter((definition) => includeParents.includes(definition.scope))
    .map(createParentColumn)
  const parentThumbnailColumns = isIncluded('thumbnail')
    ? includeParents.map((scope) => createThumbnailColumn(scope))
    : []
  const parentLinkColumns = includeLinks
    ? includeParents.flatMap((scope) => createLinkColumns(scope))
    : []
  const parentAttributeScopes = new Set(
    includeParents.filter((scope) => {
      const definitions = parentColumnDefinitions.filter((definition) => definition.scope === scope)
      return (
        definitions.length === 0 ||
        definitions.some((definition) => definition.includeAttributes !== false)
      )
    }),
  )
  const parentAttributeColumns = includeParents
    .filter((scope) => parentAttributeScopes.has(scope))
    .flatMap((scope) =>
      attribs.flatMap((attrib) => {
        if (attrib.scope && !attrib.scope.includes(scope)) return []
        return [createParentAttributeColumn(attrib, scope)]
      }),
    )

  const allColumns = [
    ...staticColumns,
    ...parentThumbnailColumns,
    ...genericParentColumns,
    ...configuredParentColumns,
    ...attributeColumns,
    ...parentAttributeColumns,
    ...linkColumns,
    ...parentLinkColumns,
  ]

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
  nestedField?: 'attrib' | 'links' | 'subtasks' | 'latestComments',
): {
  value: any
  id: string
  type: string
} => {
  const { scope, field: scopedField, isAttrib } = parseScopedColumnId(field)
  const scopedEntity = getScopedEntity(row.original, scope)
  const entity = scopedEntity || row.original.primary
  const versionEntity = getVersionEntity(row.original)
  const productEntity = getProductEntity(row.original)
  const isVersionField =
    scope === 'primary' && !isAttrib && ['author', 'version', 'versionName'].includes(scopedField)
  const isProductField = scope === 'primary' && !isAttrib && scopedField === 'product'
  const isCommentsField =
    nestedField === 'latestComments' && row.original.primary.entityType === 'product'
  const valueEntity = isVersionField
    ? versionEntity || entity
    : isProductField
    ? productEntity || entity
    : isCommentsField
    ? versionEntity || entity
    : entity
  const value =
    nestedField === 'attrib'
      ? getScopedValue(row.original, scope, scopedField, true)
      : nestedField === 'links'
      ? valueEntity.links?.[scopedField.replace(/^link_/, '')]
      : nestedField === 'subtasks'
      ? valueEntity.entityType === 'task'
        ? valueEntity.subtasks
        : undefined
      : nestedField === 'latestComments'
      ? row.original.primary.entityType === 'product'
        ? versionEntity?.latestComments || row.original.primary.latestComments
        : entity.latestComments
      : field === 'folder'
      ? row.original.parents?.folder?.label || row.original.parents?.folder?.name
      : field === 'product'
      ? productEntity?.label || productEntity?.name
      : valueEntity === entity
      ? getScopedValue(row.original, scope, scopedField, isAttrib)
      : getScopedValue(
          row.original,
          valueEntity === row.original.primary ? 'primary' : 'version',
          scopedField,
          isAttrib,
        )

  return { value, id: valueEntity.id, type: valueEntity.entityType }
}
