import { useSessionStorage } from '@shared/hooks'
import { ExpandedState, RowSelectionState } from '@tanstack/react-table'
import { SliceType } from '../types'
import { useCallback, useMemo } from 'react'

type UseSlicerRowSelectionProps = {
  sliceType: SliceType
  page: string
  projectName: string
  // forwarded external state management
  rowSelection?: RowSelectionState
  setRowSelection?: React.Dispatch<React.SetStateAction<RowSelectionState>>
  expanded?: ExpandedState
  setExpanded?: React.Dispatch<React.SetStateAction<ExpandedState>>
}

export const useSlicerRowSelection = ({
  sliceType,
  page,
  projectName,
  ...props
}: UseSlicerRowSelectionProps) => {
  // hierarchy selection is shared across pages with session storage
  const [hierarchyRowSelection, setHierarchyRowSelection] = useSessionStorage<RowSelectionState>(
    `slicer-selection-hierarchy-${projectName}`,
    {},
  )
  // other slicer type selections are stored per page with local storage
  const [otherRowSelection, setOtherRowSelection] = useSessionStorage<RowSelectionState>(
    `slicer-selection-${projectName}-${page}`,
    {},
  )

  const [hierarchyExpanded, setHierarchyExpanded] = useSessionStorage<ExpandedState>(
    `slicer-expanded-hierarchy-${projectName}`,
    {},
  )
  const [otherExpanded, setOtherExpanded] = useSessionStorage<ExpandedState>(
    `slicer-expanded-${projectName}-${page}`,
    {},
  )

  // build row selection state and setter based on the current slice type
  const rowSelection = useMemo(
    () =>
      props.rowSelection ?? (sliceType === 'hierarchy' ? hierarchyRowSelection : otherRowSelection),
    [props.rowSelection, sliceType, hierarchyRowSelection, otherRowSelection],
  )
  const setRowSelection = useCallback(
    (value: React.SetStateAction<RowSelectionState>, targetSliceType: SliceType = sliceType) => {
      if (props.setRowSelection) {
        props.setRowSelection(value)
      } else if (targetSliceType === 'hierarchy') {
        setHierarchyRowSelection(value)
      } else {
        setOtherRowSelection(value)
      }
    },
    [props.setRowSelection, sliceType, setHierarchyRowSelection, setOtherRowSelection],
  )

  const expanded = useMemo(
    () => (sliceType === 'hierarchy' ? hierarchyExpanded : otherExpanded),
    [sliceType, hierarchyExpanded, otherExpanded],
  )
  const setExpanded = useCallback(
    (value: React.SetStateAction<ExpandedState>, targetSliceType: SliceType = sliceType) => {
      if (props.setExpanded) {
        props.setExpanded(value)
      } else if (targetSliceType === 'hierarchy') {
        setHierarchyExpanded(value)
      } else {
        setOtherExpanded(value)
      }
    },
    [props.setExpanded, sliceType, setHierarchyExpanded, setOtherExpanded],
  )

  return {
    rowSelection,
    setRowSelection,
    expanded,
    setExpanded,
  }
}
