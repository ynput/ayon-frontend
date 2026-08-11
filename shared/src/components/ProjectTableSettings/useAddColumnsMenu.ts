import { useCallback, useMemo, useRef } from 'react'
import { useColumnSettingsContext } from '@shared/containers/ProjectTreeTable/context/ColumnSettingsContext'
import { checkColumnVisibility } from '@shared/containers/ProjectTreeTable/utils'
import { buildAddColumnsMenu, AddColumnItem } from './addColumnsMenu'
import type { MenuItemType } from '../Menu'

interface UseAddColumnsMenuProps {
  columns: AddColumnItem[]
  scopes?: string[]
  extraItems?: MenuItemType[]
}

export const useAddColumnsMenu = ({ columns, scopes, extraItems }: UseAddColumnsMenuProps) => {
  const { columnVisibility, defaultColumnVisibility, updateColumnVisibility } =
    useColumnSettingsContext()

  // an open sub-menu keeps the items it was opened with, so adding must read the latest state
  const latestRef = useRef({ columnVisibility, updateColumnVisibility })
  latestRef.current = { columnVisibility, updateColumnVisibility }

  const addColumn = useCallback((columnId: string) => {
    const { columnVisibility, updateColumnVisibility } = latestRef.current
    updateColumnVisibility({ ...columnVisibility, [columnId]: true })
  }, [])

  const menuItems = useMemo(
    () =>
      buildAddColumnsMenu({
        columns: columns.filter(
          (column) =>
            !checkColumnVisibility(columnVisibility, column.value, defaultColumnVisibility),
        ),
        onAdd: addColumn,
        scopes,
        extraItems,
      }),
    [columns, columnVisibility, defaultColumnVisibility, addColumn, scopes, extraItems],
  )

  return { menuItems, hasColumnsToAdd: !!menuItems.length }
}
