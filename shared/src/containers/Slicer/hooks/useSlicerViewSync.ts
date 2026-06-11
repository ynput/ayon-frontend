import { useEffect, useRef } from 'react'
import { useSlicerContext } from '../context/SlicerContext'
import { SliceType } from '../types'

/**
 * Syncs the slicer's active slice type with view settings (server-side).
 *
 * - Sets isViewSyncPending=true on mount so the slicer shows loading until views are ready
 * - On view load: silently restores sliceType from view
 * - On user-initiated slice type change: saves the new sliceType to the view
 */
export const useSlicerViewSync = (
  viewSliceType: string | undefined,
  onUpdateSliceType: (sliceType: string) => void,
  isLoadingViews?: boolean,
) => {
  const { sliceType, setSliceType, setIsViewSyncPending } = useSlicerContext()
  const initializedRef = useRef(false)
  const isRestoringTypeRef = useRef(false)

  // Keep a ref to always have the latest callback, avoiding stale closures
  const onUpdateSliceTypeRef = useRef(onUpdateSliceType)
  onUpdateSliceTypeRef.current = onUpdateSliceType

  // On mount: mark sync as pending so slicer shows loading
  useEffect(() => {
    setIsViewSyncPending(true)
    return () => {
      setIsViewSyncPending(false)
      initializedRef.current = false
      isRestoringTypeRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Restore: view → slicer (only when views finish loading, not on save-triggered updates)
  useEffect(() => {
    if (isLoadingViews) return
    if (initializedRef.current) return

    initializedRef.current = true
    setIsViewSyncPending(false)

    // Restore saved slice type if present.
    // Selection is keyed per slice type in storage, so no reset is needed here.
    if (viewSliceType && viewSliceType !== sliceType) {
      isRestoringTypeRef.current = true
      setSliceType(viewSliceType as SliceType)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingViews])

  // Save: slicer slice type → view (on user change)
  useEffect(() => {
    // Don't save until view settings have loaded
    if (!initializedRef.current) return

    // Skip the sync triggered by the restore above
    if (isRestoringTypeRef.current) {
      isRestoringTypeRef.current = false
      return
    }

    // Save to view if different
    if (sliceType !== viewSliceType) {
      onUpdateSliceTypeRef.current(sliceType)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliceType])
}
