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

  // an open sub-menu keeps the items it was opened with, so toggling must read the latest state
  const latestRef = useRef({ columnVisibility, defaultColumnVisibility, updateColumnVisibility })
  latestRef.current = { columnVisibility, defaultColumnVisibility, updateColumnVisibility }

  const toggleColumn = useCallback((columnId: string) => {
    const { columnVisibility, defaultColumnVisibility, updateColumnVisibility } = latestRef.current
    const isVisible = checkColumnVisibility(columnVisibility, columnId, defaultColumnVisibility)
    updateColumnVisibility({ ...columnVisibility, [columnId]: !isVisible })
  }, [])

  const menuItems = useMemo(
    () =>
      buildAddColumnsMenu({
        columns,
        onToggle: toggleColumn,
        isColumnVisible: (columnId) =>
          checkColumnVisibility(columnVisibility, columnId, defaultColumnVisibility),
        scopes,
        extraItems,
      }),
    [columns, columnVisibility, defaultColumnVisibility, toggleColumn, scopes, extraItems],
  )

  return { menuItems, hasMenuItems: !!menuItems.length }
}
