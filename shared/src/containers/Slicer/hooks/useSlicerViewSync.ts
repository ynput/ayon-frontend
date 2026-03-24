import { useEffect, useRef } from 'react'
import { useSlicerContext } from '../context/SlicerContext'
import { SliceType } from '../types'

/**
 * Syncs the slicer's active slice type with view settings.
 *
 * - Sets isViewSyncPending=true on mount so the slicer shows loading until views are ready
 * - On view load: silently restores sliceType without resetting selection
 * - On user-initiated slice type change: saves the new sliceType to the view
 */
export const useSlicerViewSync = (
  viewSliceType: string | undefined,
  onUpdateSliceType: (sliceType: string) => void,
  isLoadingViews?: boolean,
) => {
  const { sliceType, setSliceType, setIsViewSyncPending } = useSlicerContext()
  const initializedRef = useRef(false)
  const isRestoringRef = useRef(false)

  // On mount: mark sync as pending so slicer shows loading
  useEffect(() => {
    setIsViewSyncPending(true)
    return () => {
      setIsViewSyncPending(false)
    }
  }, [])

  // Clear pending when views finish loading (even if no sliceType is saved)
  useEffect(() => {
    if (isLoadingViews) return

    initializedRef.current = true
    setIsViewSyncPending(false)

    // Restore saved slice type if present
    if (viewSliceType && viewSliceType !== sliceType) {
      isRestoringRef.current = true
      setSliceType(viewSliceType as SliceType)
    }
  }, [viewSliceType, isLoadingViews])

  // Save: slicer → view (on user change)
  useEffect(() => {
    // Don't save until view settings have loaded
    if (!initializedRef.current) return

    // Skip the sync triggered by the restore above
    if (isRestoringRef.current) {
      isRestoringRef.current = false
      return
    }

    // Save to view if different
    if (sliceType !== viewSliceType) {
      onUpdateSliceType(sliceType)
    }
  }, [sliceType])
}