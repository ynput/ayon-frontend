import { useMemo, useRef } from 'react'
import type { CellContext, ColumnDef } from '@tanstack/react-table'

type CellRenderer<T> = (context: CellContext<T, any>) => any
type Renderer<T> = { current: CellRenderer<T>; stable: CellRenderer<T> }

/**
 * flexRender uses a column's `cell` function as a component type. The columns are rebuilt when
 * their inputs change (an addon's column registers, options load), and a new function remounts
 * every cell of the column, dropping an open cell editor and what it had picked. Each column id
 * keeps one cell function for the table's lifetime, which renders with the column's current one.
 */
export const useStableCellRenderers = <T>(columns: ColumnDef<T, any>[]): ColumnDef<T, any>[] => {
  const renderers = useRef(new Map<string, Renderer<T>>())

  return useMemo(
    () =>
      columns.map((column) => {
        const { id, cell } = column
        if (!id || typeof cell !== 'function') return column
        let renderer = renderers.current.get(id)
        if (!renderer) {
          const created = { current: cell } as Renderer<T>
          created.stable = (context) => created.current(context)
          renderers.current.set(id, created)
          renderer = created
        }
        renderer.current = cell
        return { ...column, cell: renderer.stable }
      }),
    [columns],
  )
}
