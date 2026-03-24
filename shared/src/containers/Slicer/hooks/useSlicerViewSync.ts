import { useEffect, useRef } from 'react'
import { useSlicerContext } from '../context/SlicerContext'
import { SliceType } from '../types'

/**
 * Syncs the slicer's active slice type and selection with view settings.
 *
 * - Sets isViewSyncPending=true on mount so the slicer shows loading until views are ready
 * - On view load: silently restores sliceType and rowSelection without resetting selection
 * - On user-initiated slice type change: saves the new sliceType to the view
 * - On user-initiated selection change: debounced save of rowSelection to the view
 */
export const useSlicerViewSync = (
  viewSliceType: string | undefined,
  onUpdateSliceType: (sliceType: string) => void,
  viewSlicerSelection: Record<string, boolean> | undefined,
  onUpdateSlicerSelection: (selection: Record<string, boolean>) => void,
  isLoadingViews?: boolean,
) => {
  const { sliceType, setSliceType, setIsViewSyncPending, rowSelection, setRowSelection } =
    useSlicerContext()
  const initializedRef = useRef(false)
  const isRestoringTypeRef = useRef(false)
  const isRestoringSelectionRef = useRef(false)
  const selectionSaveTimerRef = useRef<ReturnType<typeof setTimeout>>()

  // Keep refs to always have the latest callbacks, avoiding stale closures
  // in the debounced selection save. Without this, a 300ms-old closure could
  // call updateViewSettings with stale viewSettings, overwriting concurrent saves.
  const latestRef = useRef({ onUpdateSliceType, onUpdateSlicerSelection })
  latestRef.current = { onUpdateSliceType, onUpdateSlicerSelection }

  // On mount: mark sync as pending so slicer shows loading
  useEffect(() => {
    setIsViewSyncPending(true)
    return () => {
      setIsViewSyncPending(false)
      if (selectionSaveTimerRef.current) {
        clearTimeout(selectionSaveTimerRef.current)
      }
    }
  }, [])

  // Restore: view → slicer (only when views finish loading, not on save-triggered updates)
  useEffect(() => {
    if (isLoadingViews) return
    if (initializedRef.current) return

    initializedRef.current = true
    setIsViewSyncPending(false)

    // Restore saved slice type if present
    if (viewSliceType && viewSliceType !== sliceType) {
      isRestoringTypeRef.current = true
      setSliceType(viewSliceType as SliceType)
    }

    // Restore saved selection if present
    if (viewSlicerSelection && Object.keys(viewSlicerSelection).length > 0) {
      isRestoringSelectionRef.current = true
      setRowSelection(viewSlicerSelection)
    }
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
      latestRef.current.onUpdateSliceType(sliceType)
    }
  }, [sliceType])

  // Save: slicer selection → view (debounced, on user change)
  useEffect(() => {
    if (!initializedRef.current) return

    // Skip the sync triggered by the restore above
    if (isRestoringSelectionRef.current) {
      isRestoringSelectionRef.current = false
      return
    }

    // Debounce selection saves to avoid hammering the API on rapid clicks
    if (selectionSaveTimerRef.current) {
      clearTimeout(selectionSaveTimerRef.current)
    }

    selectionSaveTimerRef.current = setTimeout(() => {
      // Use latestRef to avoid stale closures — the callback from 300ms ago
      // could have an old viewSettings that would overwrite concurrent saves
      latestRef.current.onUpdateSlicerSelection(rowSelection)
    }, 300)
  }, [rowSelection])
}
