import type { RowSelectionState } from '@tanstack/react-table'
import { usePowerpack } from '@shared/context/PowerpackContext'
import { useOptionalSlicerContext } from '../context/SlicerContext'

// the hierarchy panel can sit anywhere in the stack, or nowhere at all; pages that have
// not migrated to panels still keep their folder scope behind the pin
export const useHierarchySelection = (): RowSelectionState | null => {
  const slicer = useOptionalSlicerContext()
  const { powerLicense } = usePowerpack()
  if (!slicer) return null
  // without a license only the first panel is rendered and queried; the rest stay stored
  const visibleSlices = powerLicense ? slicer.slices : slicer.slices?.slice(0, 1)
  if (visibleSlices?.some((slice) => slice.sliceType === 'hierarchy')) {
    return slicer.getPanelSelection('hierarchy')
  }
  return slicer.pinnedSlice?.rowSelection ?? null
}
