// Syncs the redux store with selection and expanded rows used in legacy hierarchy table
// This will be removed once the hierarchy table is refactored to use the new slicer table

import { setExpandedFolders, setFocusedFolders } from '@state/context'
import { useAppSelector } from '@state/store'
import { ExpandedState, RowSelectionState } from '@tanstack/react-table'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

type Props = {
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>
  setExpanded: React.Dispatch<React.SetStateAction<ExpandedState>>
}

const useSlicerReduxSync = ({ setRowSelection, setExpanded }: Props) => {
  const dispatch = useDispatch()
  //  redux state
  const reduxFocusedFolders = useAppSelector((state) => state.context.focused.folders)
  const reduxExpandedFolders = useAppSelector((state) => state.context.expandedFolders)

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

  //   when slicer selection changes update redux focused folders
  const onRowSelectionChange = (selection: RowSelectionState) => {
    dispatch(setFocusedFolders({ ids: Object.keys(selection) }))
  }

  //   if redux expanded folders change, update expanded if they are different
  useEffect(() => {
    setExpanded((prev) => {
      if (JSON.stringify(reduxExpandedFolders) !== JSON.stringify(prev)) {
        return reduxExpandedFolders
      }
      return prev
    })
  }, [reduxExpandedFolders, setExpanded])

  //   when slicer expanded changes update redux expanded folders
  const onExpandedChange = (expanded: ExpandedState) => {
    console.log(expanded)
    dispatch(setExpandedFolders(expanded))
  }

  return { onRowSelectionChange, onExpandedChange }
}

export default useSlicerReduxSync
