import { useSetFrontendPreferencesMutation } from '@queries/user/updateUser'
import { useAppSelector } from '@state/store'
import { ColumnSizingState, Table } from '@tanstack/react-table'
import { $Any } from '@types'
import { debounce, isEqual } from 'lodash'
import { useCallback, useEffect, useMemo } from 'react'

const useStoredCustomColumnWidths = () => {
  const frontendPreferences = useAppSelector((state) => state.user.data.frontendPreferences)
  const storedColumnWidths =
    (frontendPreferences.columnSizes as { [key: string]: number })?.overview || {}

  return storedColumnWidths
}

const useCustomColumnWidths = (table: Table<$Any>) => {
  const frontendPreferences = useAppSelector((state) => state.user.data.frontendPreferences)
  const storedColumnWidths =
    (frontendPreferences.columnSizes as { [key: string]: number })?.overview || {}

  const headers = table.getFlatHeaders()
  const columnSizingInfo = table.getState().columnSizingInfo
  const columnSizing = table.getState().columnSizing

  const columnSizeVars = useMemo(() => {
    const colSizes: { [key: string]: number } = {}
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]!
      colSizes[`--header-${header.id}-size`] = header.getSize()
      colSizes[`--col-${header.column.id}-size`] = header.column.getSize()
    }
    return colSizes
  }, [columnSizingInfo, columnSizing, storedColumnWidths, headers])

  return columnSizeVars
}

const useSyncCustomColumnWidths = (columnSizing: ColumnSizingState) => {
  const userName = useAppSelector((state) => state.user.name)
  const frontendPreferences = useAppSelector((state) => state.user.data.frontendPreferences)
  const storedColumnWidths =
    (frontendPreferences.columnSizes as { [key: string]: number })?.overview || {}
  const [updateUserPreferences] = useSetFrontendPreferencesMutation()

  const debouncedUpdate = useCallback(
    debounce((columnSizing) => {
      const storedSizes = frontendPreferences.columnSizes
      const updatedFrontendPreferences = {
        ...frontendPreferences,
        columnSizes: {
          ...storedSizes,
          overview: columnSizing,
        },
      }
      updateUserPreferences({ userName, patchData: updatedFrontendPreferences })
    }, 500),
    [],
  )

  useEffect(() => {
    if (isEqual(columnSizing, {})) {
      return
    }
    debouncedUpdate(columnSizing)
  }, [columnSizing, storedColumnWidths])
}

export { useCustomColumnWidths, useSyncCustomColumnWidths, useStoredCustomColumnWidths }
