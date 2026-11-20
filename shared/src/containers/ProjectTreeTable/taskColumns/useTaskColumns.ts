import { createElement, useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { useProjectContext } from '@shared/context'
import type { TreeTableExtraColumn } from '../buildTreeTableColumns'
import type { TableRow } from '../types/table'
import { TaskColumnCell } from './TaskColumnCell'
import { useTaskColumnsContext } from './TaskColumnsContextInstance'
import { getTaskColumnId, TASK_COLUMN_CARD_WIDTH } from './taskColumnsHelpers'

const NO_COLUMNS: TreeTableExtraColumn[] = []
const NO_SETTINGS_COLUMNS: { value: string; label: string; icon?: string; menu: string }[] = []
// the narrowest a card still shows its status in
const MIN_WIDTH = 80

/**
 * One column per task type of the project, for tables whose rows are folders: `columns` for the
 * table's `extraColumns`, `settingsColumns` for the column settings and the add-column menu
 * ("Tasks"). Hidden until the user adds one. Needs a TaskColumnsProvider above the table.
 *
 * @param enabled false where the rows are tasks: the columns are left out, and stay in the view
 */
export const useTaskColumns = (enabled: boolean) => {
  const { taskTypes = [] } = useProjectContext()
  const defaultWidths = useTaskColumnsContext()?.defaultWidths

  // by content: the project info is a new object after every refetch
  const typesKey = JSON.stringify(taskTypes.map(({ name, icon, color }) => [name, icon, color]))

  // the cells keep their component across width changes: a new cell function remounts the
  // column's cells, which closes an open picker
  const cells = useMemo(() => {
    const types: [string, string | undefined, string | undefined][] = JSON.parse(typesKey)
    return types.map(([name, icon, color]) => {
      const id = getTaskColumnId(name)
      const taskType = { name, icon, color }
      const cell: ColumnDef<TableRow>['cell'] = ({ row, table }) =>
        createElement(TaskColumnCell, {
          row,
          columnId: id,
          taskType,
          readOnlyFields: table.options.meta?.readOnly,
          updateEntities: table.options.meta?.updateEntities,
        })
      return { id, taskType, cell }
    })
  }, [typesKey])

  const columns = useMemo(() => {
    if (!enabled || !cells.length) return NO_COLUMNS
    return cells.map(
      ({ id, taskType, cell }): TreeTableExtraColumn => ({
        column: {
          id,
          header: taskType.name,
          size: defaultWidths?.[id] || TASK_COLUMN_CARD_WIDTH,
          minSize: MIN_WIDTH,
          // sorting by a task's status needs the tasks of rows that are not on screen
          enableSorting: false,
          enableResizing: true,
          enablePinning: true,
          enableHiding: true,
          meta: { taskColumn: taskType },
          cell,
        },
      }),
    )
  }, [cells, enabled, defaultWidths])

  const settingsColumns = useMemo(
    () =>
      enabled && cells.length
        ? cells.map(({ id, taskType }) => ({
            value: id,
            label: taskType.name,
            icon: taskType.icon,
            menu: 'Tasks',
          }))
        : NO_SETTINGS_COLUMNS,
    [cells, enabled],
  )

  return { columns, settingsColumns }
}
