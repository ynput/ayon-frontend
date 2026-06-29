import { useLocalStorage } from '@shared/hooks'
import { ExpandedState, RowSelectionState } from '@tanstack/react-table'
import { SelectionData, SliceType } from '../types'
import { useCallback, useMemo } from 'react'

type UseSlicerRowSelectionProps = {
  page: string
  sliceType: SliceType
  // forwarded external state management
  rowSelection?: RowSelectionState
  setRowSelection?: React.Dispatch<React.SetStateAction<RowSelectionState>>
  expanded?: ExpandedState
  setExpanded?: React.Dispatch<React.SetStateAction<ExpandedState>>
}

export const useSlicerRowSelection = ({
  sliceType,
  page,
  ...props
}: UseSlicerRowSelectionProps) => {
  // hierarchy selection is shared across pages with local storage
  const [hierarchyRowSelection, setHierarchyRowSelection] = useLocalStorage<RowSelectionState>(
    'slicer-selection-hierarchy-${projectName}',
    {},
  )
  const [hierarchyRowSelectionData, setHierarchyRowSelectionData] = useLocalStorage<SelectionData>(
    'slicer-selection-data-hierarchy-${projectName}',
    {},
  )
  // other slicer type selections are stored per page with local storage
  const [otherRowSelection, setOtherRowSelection] = useLocalStorage<RowSelectionState>(
    `slicer-selection-${projectName}-${page}`,
    {},
  )
  const [otherRowSelectionData, setOtherRowSelectionData] = useLocalStorage<SelectionData>(
    `slicer-selection-data-${projectName}-${page}`,
    {},
  )

  const [hierarchyExpanded, setHierarchyExpanded] = useLocalStorage<ExpandedState>(
    'slicer-expanded-hierarchy-${projectName}',
    {},
  )
  const [otherExpanded, setOtherExpanded] = useLocalStorage<ExpandedState>(
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

  const rowSelectionData = useMemo(
    () => (sliceType === 'hierarchy' ? hierarchyRowSelectionData : otherRowSelectionData),
    [sliceType, hierarchyRowSelectionData, otherRowSelectionData],
  )
  const setRowSelectionData = useCallback(
    (value: React.SetStateAction<SelectionData>, targetSliceType: SliceType = sliceType) => {
      if (targetSliceType === 'hierarchy') {
        setHierarchyRowSelectionData(value)
      } else {
        setOtherRowSelectionData(value)
      }
    },
    [sliceType, setHierarchyRowSelectionData, setOtherRowSelectionData],
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
    rowSelectionData,
    setRowSelectionData,
    expanded,
    setExpanded,
  }
}
