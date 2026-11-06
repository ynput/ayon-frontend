import { useMemo, useRef, type ReactNode } from 'react'
import type { CellContext, ColumnDef } from '@tanstack/react-table'

type CellRenderer<T> = (context: CellContext<T, any>) => ReactNode
type Renderer<T> = { current: CellRenderer<T>; stable: CellRenderer<T> }

// flexRender treats cell as a component type, keep one per column id so cells don't remount
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
