// Syncs the redux store with selection and expanded rows used in legacy hierarchy table
// This will be removed once the hierarchy table is refactored to use the new slicer table

import { setFocusedFolders } from '@state/context'
import { useAppSelector } from '@state/store'
import { RowSelectionState } from '@tanstack/react-table'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

type Props = {
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>
}

const useSlicerReduxSync = ({ setRowSelection }: Props) => {
  const dispatch = useDispatch()
  //  redux state
  const reduxFocusedFolders = useAppSelector((state) => state.context.focused.folders)
  //   const reduxExpandedFolders = useAppSelector((state) => state.context.expandedFolders)

  //   if redux focused folders change, update row selection if they are different
  useEffect(() => {
    setRowSelection((prev) => {
      const rowSelection = Object.fromEntries(reduxFocusedFolders.map((id) => [id, true]))
      if (JSON.stringify(rowSelection) !== JSON.stringify(prev)) {
        return rowSelection
      }
      return prev
    })
  }, [reduxFocusedFolders, setRowSelection])

  const onRowSelectionChange = (selection: RowSelectionState) => {
    dispatch(setFocusedFolders({ ids: Object.keys(selection) }))
  }

  return { onRowSelectionChange }
}

export default useSlicerReduxSync
