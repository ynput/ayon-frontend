// The stand-in for AYON's project table (ProjectTreeTable): the picked entities as rows, some of
// AYON's columns filled from the entities' details, and the addon's real columns (cells and
// fetchValues through AYON's own column code). Like AYON's: whole-row hover, a "more" menu in each
// column header (the projectTable.columnMenuItem items with AYON's own), the right-click menu
// (entityMenuItem). Sorting, grouping and hiding are not wired: the shell has no data to sort.
import { useCallback, useMemo, useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Icon } from '@ynput/ayon-react-components'
import { prefetchPiece, runContribution, useContributions } from '@ynput/ayon-addon'
import type {
  AnyContribution,
  Contribution,
  EntityRef,
  ProjectTableColumnMenuItemContext,
  ProjectTablePage,
  ProjectTableState,
} from '@ynput/ayon-addon'
import { menuItemsAt } from '@ynput/ayon-addon/host'
import { useGetEntitiesDetailsPanelQuery, useGetProjectQuery } from '@ynput/ayon-frontend-shared/api'
import { useMenuContext } from '@ynput/ayon-frontend-shared/context'
import {
  AddonColumnDataScope,
  useAddonEntityMenuItems,
  useAddonTableColumns,
} from '@ynput/ayon-frontend-shared/ProjectTreeTable'
import { AddonDialog, ColumnHeaderMenuUI, withSlotEntries } from '@ynput/ayon-frontend-shared/components'
import { useCreateContextMenu } from '@ynput/ayon-frontend-shared/ContextMenu'
import { Placeholder, stageHover, usePlaceholderShown, useSlotMarks } from './slotOverlay'
import { useSlotReport } from './status'

type ColumnMenuItem = Parameters<typeof ColumnHeaderMenuUI>[0]['menuItems'][number]
type ColumnMenuContribution = Contribution<'projectTable.columnMenuItem'>

interface Details {
  id: string
  status?: string
}

interface ShellRow {
  id: string
  primary: { id: string; entityType: string; name: string; label?: string }
  details?: Details
}

/** A column as its header menu sees it: AYON's ColumnHeaderMenu gets the same. */
interface MenuColumn {
  columnId: string
  columnLabel: string
  groupField?: string
}

interface ShellTableProps {
  page: ProjectTablePage
  projectName?: string
  /** what the table shows, for the addon menu items */
  tableState?: ProjectTableState
  entities: EntityRef[]
  selected: EntityRef[]
  onSelect: (selected: EntityRef[]) => void
  /** preview: no server to fill AYON's columns from */
  offline?: boolean
}

const ENTITY_ICONS: Record<string, string> = {
  folder: 'folder',
  task: 'check_circle',
  product: 'inventory_2',
  version: 'layers',
}

// the projectTable.columnMenuItem helpers of AYON's table (useAddonColumnMenuItems)
const matchesColumn = (patterns: string[] | undefined, columnId: string) =>
  !patterns?.length ||
  patterns.some((pattern) => (pattern.endsWith('*') ? columnId.startsWith(pattern.slice(0, -1)) : pattern === columnId))
const withColumnLabel = (text: string, columnLabel: string) => text.replace(/\{column\}/g, () => columnLabel)

const menuId = (columnId: string) => `addon-dev-column-menu-${columnId}`

/**
 * A header cell as AYON's: its label, on hover (or while open) the more menu at the right, and a
 * handle on its right edge to drag its width.
 */
const HeaderCell = ({
  label,
  menuItems,
  columnId,
  width,
  className,
  extra,
  onResize,
  resizing,
}: {
  label: ReactNode
  menuItems: ColumnMenuItem[]
  columnId: string
  width: number
  className?: string
  extra?: object
  onResize: (event: unknown) => void
  resizing: boolean
}) => {
  const { menuOpen } = useMenuContext()
  const open = menuOpen === menuId(columnId)
  return (
    <th
      className={`ayon-shell-th${open ? ' open' : ''}${className || ''}`}
      style={{ width, minWidth: width }}
      data-shell-column={columnId}
      {...extra}
    >
      <div className="ayon-shell-th-content">{label}</div>
      <div className="ayon-shell-th-actions">
        <ColumnHeaderMenuUI
          menuItems={menuItems}
          menuId={menuId(columnId)}
          className="header-menu"
          slot="projectTable.columnMenuItem"
        />
      </div>
      <div
        className={`ayon-shell-resizer${resizing ? ' resizing' : ''}`}
        onMouseDown={onResize}
        onTouchStart={onResize}
        onClick={(e) => e.stopPropagation()}
      />
    </th>
  )
}

export const ShellTable = ({ page, projectName, tableState, entities, selected, onSelect, offline }: ShellTableProps) => {
  const { columns: addonColumns } = useAddonTableColumns(page)
  const tableMarks = useSlotMarks('tableColumn')

  // AYON's columns: filled from the entities' details
  const entityType = entities[0]?.entityType || 'task'
  const { data: details = [] } = useGetEntitiesDetailsPanelQuery(
    { entityType: entityType as never, entities: entities.map((e) => ({ id: e.id, projectName: e.projectName })) },
    { skip: offline || !entities.length },
  )
  const { data: project } = useGetProjectQuery({ projectName: projectName! }, { skip: offline || !projectName })
  const statuses = (project as { statuses?: { name: string; color?: string; icon?: string }[] } | undefined)?.statuses

  const builtIn = useMemo<(MenuColumn & { size: number; cell: (row: ShellRow) => ReactNode })[]>(
    () => [
      {
        columnId: 'name',
        columnLabel: 'Name',
        size: 240,
        cell: (row) => (
          <>
            <Icon icon={(ENTITY_ICONS[row.primary.entityType] || 'help') as never} />
            <span>{row.primary.label || row.primary.name}</span>
          </>
        ),
      },
      {
        columnId: 'status',
        columnLabel: 'Status',
        groupField: 'status',
        size: 140,
        cell: (row) => {
          const name = row.details?.status
          const status = statuses?.find((s) => s.name === name)
          return name ? (
            <span className="ayon-shell-status-cell" style={{ color: status?.color }}>
              {status?.icon && <Icon icon={status.icon as never} />}
              {name}
            </span>
          ) : null
        },
      },
    ],
    [statuses],
  )

  const columns = useMemo<ColumnDef<ShellRow>[]>(
    () => [
      ...builtIn.map(
        (column): ColumnDef<ShellRow> => ({
          id: column.columnId,
          header: column.columnLabel,
          size: column.size,
          cell: ({ row }) => column.cell(row.original),
        }),
      ),
      ...(addonColumns.map((extra) => extra.column) as unknown as ColumnDef<ShellRow>[]),
    ],
    [builtIn, addonColumns],
  )
  const data = useMemo<ShellRow[]>(
    () =>
      entities.map((entity) => ({
        id: entity.id,
        primary: { id: entity.id, entityType: entity.entityType, name: entity.name || entity.id, label: entity.label },
        details: (details as Details[]).find((d) => d.id === entity.id),
      })),
    [entities, details],
  )
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    // drag a header's right edge, as in AYON: an addon column may need room for its content
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    defaultColumn: { minSize: 60 },
    // AYON's table declares its own filter functions (ProjectTreeTable)
    filterFns: {} as never,
  })

  // projectTable.columnMenuItem: the addon items of a column's more menu, run or opened as AYON does
  const { contributions } = useContributions('projectTable.columnMenuItem')
  const columnItems = useMemo(
    () =>
      menuItemsAt(contributions as never, 'bottom').filter(
        (item) => !(item as ColumnMenuContribution).pages?.length || (item as ColumnMenuContribution).pages!.includes(page),
      ) as unknown as ColumnMenuContribution[],
    [contributions, page],
  )
  const [dialog, setDialog] = useState<{ contribution: ColumnMenuContribution; context: object; title: string }>()
  const columnContext = useCallback(
    (column: MenuColumn): ProjectTableColumnMenuItemContext => ({
      projectName: projectName!,
      page,
      columnId: column.columnId,
      columnLabel: column.columnLabel,
      groupField: column.groupField,
      tableState,
    }),
    [projectName, page, tableState],
  )
  const runColumnItem = useCallback(
    (item: ColumnMenuContribution, column: MenuColumn) => {
      const context = columnContext(column)
      if (!item.dialog) return runContribution(item, context)
      const label = withColumnLabel(item.label, column.columnLabel)
      setDialog({
        contribution: item,
        context: { ...context, close: () => setDialog(undefined) },
        title: item.dialogTitle ? withColumnLabel(item.dialogTitle, column.columnLabel) : label,
      })
      return undefined
    },
    [columnContext],
  )
  const { menuOpen, toggleMenuOpen } = useMenuContext()
  const menuColumns = useMemo<MenuColumn[]>(
    () => [
      ...builtIn,
      ...addonColumns.map((extra) => {
        const def = extra.column as { id?: string; header?: unknown }
        return { columnId: def.id || '', columnLabel: typeof def.header === 'string' ? def.header : def.id || '' }
      }),
    ],
    [builtIn, addonColumns],
  )
  const menuItemsFor = (column: MenuColumn): ColumnMenuItem[] => {
    const close = (run?: () => void) => () => {
      run?.()
      toggleMenuOpen(false)
    }
    const addon = columnItems
      .filter((item) => matchesColumn(item.columns, column.columnId) && (!item.groupable || !!column.groupField))
      .map((item) => {
        prefetchPiece(item.dialog || item.run)
        return {
          id: item.key,
          label: withColumnLabel(item.label, column.columnLabel),
          icon: item.icon,
          onClick: close(() => void runColumnItem(item, column)),
        }
      })
    return [
      { id: 'pin', label: 'Pin column', icon: 'push_pin', onClick: close() },
      { id: 'divider-pin', type: 'divider' },
      { id: 'sort-asc', label: 'Sort ascending', icon: 'sort', className: 'sort-asc-icon', onClick: close() },
      { id: 'sort-desc', label: 'Sort descending', icon: 'sort', className: 'sort-desc-icon', onClick: close() },
      { id: 'divider-sort', type: 'divider' },
      ...(column.groupField
        ? [{ id: 'group-by', label: `Group by ${column.columnLabel}`, icon: 'splitscreen', onClick: close() }]
        : []),
      // tagged with the slot, or its placeholder (AYON's slot highlighting, as ColumnHeaderMenu)
      ...withSlotEntries<ColumnMenuItem>('projectTable.columnMenuItem', addon, 'Column menu item'),
      ...(column.columnId === 'name' ? [] : [{ id: 'hide', label: 'Hide column', icon: 'visibility_off', onClick: close() }]),
    ]
  }
  // what the items of the open column menu get (the first column's until one opens)
  const openColumn = menuColumns.find((column) => menuOpen === menuId(column.columnId)) ?? menuColumns[1]
  const openColumnContext = useMemo(() => openColumn && columnContext(openColumn), [openColumn, columnContext])
  const runOpenColumnItem = useCallback(
    async (item: AnyContribution) => {
      if (openColumn) await runColumnItem(item as unknown as ColumnMenuContribution, openColumn)
    },
    [openColumn, runColumnItem],
  )
  useSlotReport('projectTable.columnMenuItem', openColumnContext, runOpenColumnItem)

  // entityMenuItem: the right-click menu of a row's cells
  const buildAddonItems = useAddonEntityMenuItems(page, 'bottom', tableState)
  const [openMenu] = useCreateContextMenu([])
  const isSelected = (id: string) => selected.some((entity) => entity.id === id)
  // a column for the "+ Column" placeholder, only while it shows
  const placeholder = usePlaceholderShown('tableColumn')

  const onContextMenu = (e: MouseEvent, entity: EntityRef) => {
    e.preventDefault()
    const targets = isSelected(entity.id) ? selected : [entity]
    if (!isSelected(entity.id)) onSelect([entity])
    // the cells AYON's table would pass: one per selected row
    const cells = targets.map((target) => ({
      cellId: `${target.id}-name`,
      entityId: target.id,
      entityType: target.entityType,
      isGroup: false,
      data: { name: target.name, label: target.label },
    }))
    const cell = cells.find((c) => c.entityId === entity.id)!
    const items = buildAddonItems(
      e as never,
      cell as never,
      cells as never,
      {
        selectedCells: cells.map((c) => c.cellId),
        scopedCells: cells.map((c) => c.cellId),
        selectedRows: [],
        selectedColumns: [],
        selectedFullRows: [],
        selectedGroups: [],
      },
      {} as never,
    )
    // tagged with the slot, or its placeholder while slots are highlighted (the shared hook)
    if (Array.isArray(items) && items.length) openMenu(e, items as never)
  }

  const addonColumnKey = (meta: unknown) =>
    (meta as { addonColumn?: { contribution?: { key?: string } } } | undefined)?.addonColumn?.contribution?.key

  return (
    <>
      <table className="ayon-shell-table" data-shell-surface="table">
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => {
                const content = flexRender(header.column.columnDef.header, header.getContext())
                const key = addonColumnKey(header.column.columnDef.meta)
                const column = menuColumns.find((c) => c.columnId === header.column.id) ?? {
                  columnId: header.column.id,
                  columnLabel: header.column.id,
                }
                return (
                  <HeaderCell
                    key={header.id}
                    columnId={header.column.id}
                    width={header.getSize()}
                    label={content}
                    menuItems={menuItemsFor(column)}
                    onResize={header.getResizeHandler()}
                    resizing={header.column.getIsResizing()}
                    // an addon column: marked as the tableColumn slot's
                    className={key ? ` ayon-dev-column${tableMarks.className}` : undefined}
                    extra={key ? { 'data-ayon-dev-contribution': key, ...stageHover('tableColumn') } : undefined}
                  />
                )
              })}
              {placeholder && (
                <th className="ayon-shell-th ayon-shell-placeholder-cell">
                  <div className="ayon-shell-th-content">
                    <Placeholder slot="tableColumn" label="Column" />
                  </div>
                </th>
              )}
              <th className="ayon-shell-th ayon-shell-filler" />
            </tr>
          ))}
        </thead>
        <AddonColumnDataScope columns={table.getAllLeafColumns() as never} entities={data.map((row) => row.primary) as never}>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const entity = entities.find((e) => e.id === row.id)!
              return (
                <tr
                  key={row.id}
                  className={isSelected(row.id) ? 'selected' : undefined}
                  onClick={(e) =>
                    onSelect(
                      e.metaKey || e.ctrlKey
                        ? isSelected(row.id)
                          ? selected.filter((s) => s.id !== row.id)
                          : [...selected, entity]
                        : [entity],
                    )
                  }
                  onContextMenu={(e) => onContextMenu(e, entity)}
                >
                  {row.getVisibleCells().map((cell) => {
                    const key = addonColumnKey(cell.column.columnDef.meta)
                    return (
                      <td
                        key={cell.id}
                        className={`${cell.column.id}${key ? ` ayon-dev-column${tableMarks.className}` : ''}`}
                        style={{ width: cell.column.getSize(), minWidth: cell.column.getSize() }}
                        {...(key ? stageHover('tableColumn') : {})}
                      >
                        <div className="ayon-shell-td-content">{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
                      </td>
                    )
                  })}
                  {placeholder && <td className="ayon-shell-placeholder-cell" />}
                  <td className="ayon-shell-filler" />
                </tr>
              )
            })}
          </tbody>
        </AddonColumnDataScope>
      </table>
      {dialog && (
        <AddonDialog contribution={dialog.contribution} context={dialog.context as never} title={dialog.title} />
      )}
    </>
  )
}
