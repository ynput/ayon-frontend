// Addon keyboard shortcuts on table cells (table.shortcut slot, @ynput/ayon-addon), for the
// project tables and SimpleTable. The table calls `handleShortcut` from its key handler with a
// function that builds the context (only when a key matches) and renders `dialog` when it is set.
import { useCallback, useMemo, useState } from 'react'
import { runContribution, useContributions } from '@ynput/ayon-addon'
import type {
  Contribution,
  EntityRef,
  ShortcutTable,
  TableRowRef,
  TableShortcutContext,
} from '@ynput/ayon-addon'
import { matchesShortcut, parseShortcut } from '@ynput/ayon-addon/host'

type ShortcutKeyEvent = Pick<
  KeyboardEvent,
  'key' | 'code' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey' | 'repeat'
> & { preventDefault: () => void; stopPropagation: () => void }

export interface OpenAddonShortcutDialog {
  contribution: Contribution<'table.shortcut'>
  context: TableShortcutContext & { close: () => void }
}

/** The context without `entities`: the hook adds them from the rows. */
export type TableShortcutRows = Omit<TableShortcutContext, 'entities'>

const PROJECT_TABLES: ShortcutTable[] = ['overview', 'products', 'lists']

/**
 * The entities of a shortcut's rows: every row of the project tables is one (list items resolve
 * to theirs). The panels' rows are not all entities (the lists panel's are lists), so none there.
 */
export const shortcutEntities = (
  table: ShortcutTable,
  projectName: string | null,
  rows: TableRowRef[],
): EntityRef[] =>
  PROJECT_TABLES.includes(table) && projectName
    ? rows.flatMap(({ id, entityType, name, label }) =>
        entityType ? [{ id, entityType, projectName, name, label }] : [],
      )
    : []

/** `table`: which table this is; no shortcuts when not set. */
export const useAddonTableShortcuts = (table: ShortcutTable | undefined) => {
  const { contributions } = useContributions('table.shortcut')
  const [dialog, setDialog] = useState<OpenAddonShortcutDialog | null>(null)

  const shortcuts = useMemo(
    () =>
      table
        ? contributions.flatMap((contribution) => {
            const shortcut = parseShortcut(contribution.keys)
            const inTable = !contribution.tables?.length || contribution.tables.includes(table)
            return shortcut && inTable ? [{ contribution, shortcut }] : []
          })
        : [],
    [contributions, table],
  )

  /** Runs a shortcut's `run`, or opens its dialog. */
  const runShortcut = useCallback(
    (contribution: Contribution<'table.shortcut'>, rowsContext: TableShortcutRows) => {
      const { table, projectName, rows } = rowsContext
      const context = { ...rowsContext, entities: shortcutEntities(table, projectName, rows) }
      if (contribution.dialog) {
        const close = () => setDialog(null)
        setDialog({ contribution, context: { ...context, close } })
      } else {
        runContribution(contribution, context)
      }
    },
    [],
  )

  /**
   * Runs the shortcut the key event is, if any: `getContext` gives the rows it acts on, or nothing
   * when the key wasn't pressed in a row. Returns whether it ran one (the event is then stopped).
   */
  const handleShortcut = useCallback(
    (
      event: ShortcutKeyEvent,
      getContext: () => Omit<TableShortcutRows, 'table'> | undefined,
    ): boolean => {
      if (!table || event.repeat) return false
      const match = shortcuts.find(({ shortcut }) => matchesShortcut(event, shortcut))
      if (!match) return false
      const context = getContext()
      if (!context?.rows.length) return false
      event.preventDefault()
      event.stopPropagation()

      runShortcut(match.contribution, { ...context, table })
      return true
    },
    [shortcuts, table, runShortcut],
  )

  return { hasShortcuts: shortcuts.length > 0, handleShortcut, runShortcut, dialog }
}
