import { RowSelectionState } from '@tanstack/react-table'
import { SliceMap } from '../types'
import type { SimpleTableRow } from '@shared/containers/SimpleTable/SimpleTable.types'

export const getSelectionDataState = (selection: RowSelectionState, data: SliceMap) => {
  // for each selected row, get the data
  const selectedRows = Object.keys(selection)
    .filter((id) => selection[id]) // only include selected rows
    .reduce<Record<string, SimpleTableRow>>((acc, id) => {
      const rowData = data.get(id)

      if (!rowData) {
        console.warn(`Row with id ${id} not found in data`)
        return acc
      }

      acc[id] = rowData
      return acc
    }, {})

  return selectedRows
}
