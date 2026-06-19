import { RowSelectionState } from '@tanstack/react-table'
import { SliceDataItem, SliceMap } from '../types'

export const getSelectionDataState = (selection: RowSelectionState, data: SliceMap) => {
  // for each selected row, get the data
  const selectedRows = Object.keys(selection)
    .filter((id) => selection[id]) // only include selected rows
    .reduce<Record<string, SliceDataItem>>((acc, id) => {
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
