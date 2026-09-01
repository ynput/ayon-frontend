import type { RowSelectionState } from '@tanstack/react-table'
import { useOptionalSlicerContext } from '../context/SlicerContext'

// the hierarchy panel can sit anywhere in the stack, or nowhere at all; pages that have
// not migrated to panels still keep their folder scope behind the pin
export const useHierarchySelection = (): RowSelectionState | null => {
  const slicer = useOptionalSlicerContext()
  if (!slicer) return null
  if (slicer.slices?.some((slice) => slice.sliceType === 'hierarchy')) {
    return slicer.getPanelSelection('hierarchy')
  }
  return slicer.pinnedSlice?.rowSelection ?? null
}
