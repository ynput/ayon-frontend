// The stand-in for AYON's project table: the picked entities as rows, with the addon's real
// columns (cells and fetchValues through AYON's own column code) and right-click menu items.
import { useMemo } from 'react'
import type { MouseEvent } from 'react'
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import type { EntityRef, ProjectTablePage, ProjectTableState } from '@ynput/ayon-addon'
import {
  AddonColumnDataScope,
  useAddonEntityMenuItems,
  useAddonTableColumns,
} from '@ynput/ayon-frontend-shared/ProjectTreeTable'
import { useCreateContextMenu } from '@ynput/ayon-frontend-shared/ContextMenu'
import { FocusFrame, Placeholder, usePlaceholderShown } from './slotOverlay'

interface ShellRow {
  id: string
  primary: { id: string; entityType: string; name: string; label?: string }
}

interface ShellTableProps {
  page: ProjectTablePage
  /** what the table shows, for the addon right-click menu items */
  tableState?: ProjectTableState
  entities: EntityRef[]
  selected: EntityRef[]
  onSelect: (selected: EntityRef[]) => void
}

export const ShellTable = ({ page, tableState, entities, selected, onSelect }: ShellTableProps) => {
  const { columns: addonColumns } = useAddonTableColumns(page)
  const columns = useMemo<ColumnDef<ShellRow>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        size: 260,
        cell: ({ row }) => row.original.primary.label || row.original.primary.name,
      },
      ...(addonColumns.map((extra) => extra.column) as unknown as ColumnDef<ShellRow>[]),
    ],
    [addonColumns],
  )
  const data = useMemo<ShellRow[]>(
    () =>
      entities.map((entity) => ({
        id: entity.id,
        primary: {
          id: entity.id,
          entityType: entity.entityType,
          name: entity.name || entity.id,
          label: entity.label,
        },
      })),
    [entities],
  )
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    // AYON's table declares its own filter functions (ProjectTreeTable)
    filterFns: {} as never,
  })

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
    const items = buildAddonItems(e as never, cell as never, cells as never, {
      selectedCells: cells.map((c) => c.cellId),
      selectedRows: [],
      selectedColumns: [],
      selectedFullRows: [],
      selectedGroups: [],
    }, {} as never)
    if (Array.isArray(items) && items.length) openMenu(e, items as never)
  }

  return (
    <table className="ayon-shell-table" data-shell-surface="table">
      <thead>
        {table.getHeaderGroups().map((group) => (
          <tr key={group.id}>
            {group.headers.map((header) => {
              const content = flexRender(header.column.columnDef.header, header.getContext())
              // an addon column: outlined while it is in focus in the developer panel
              const key = (header.column.columnDef.meta as { addonColumn?: { contribution?: { key?: string } } } | undefined)
                ?.addonColumn?.contribution?.key
              return (
                <th key={header.id} style={{ width: header.getSize() }}>
                  {key ? (
                    <FocusFrame slot="tableColumn" contribution={key}>
                      <span>{content}</span>
                    </FocusFrame>
                  ) : (
                    content
                  )}
                </th>
              )
            })}
            {placeholder && (
              <th className="ayon-shell-placeholder-cell">
                <Placeholder slot="tableColumn" label="Column" />
              </th>
            )}
          </tr>
        ))}
      </thead>
      <AddonColumnDataScope
        columns={table.getAllLeafColumns() as never}
        entities={data.map((row) => row.primary) as never}
      >
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
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={cell.column.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
                {placeholder && <td className="ayon-shell-placeholder-cell" />}
              </tr>
            )
          })}
        </tbody>
      </AddonColumnDataScope>
    </table>
  )
}
