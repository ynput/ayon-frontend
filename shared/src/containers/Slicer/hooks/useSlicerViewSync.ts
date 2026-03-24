import { useEffect, useRef } from 'react'
import { useSlicerContext } from '../context/SlicerContext'
import { SliceType } from '../types'
import { useLocalStorage } from '@shared/hooks'

type StoredSelection = {
  type: string
  selection: Record<string, boolean>
}

/**
 * Syncs the slicer's active slice type and selection with view/localStorage.
 *
 * Slice type: persisted in view settings (server-side)
 * Row selection: persisted in localStorage (server model doesn't support it)
 *
 * - Sets isViewSyncPending=true on mount so the slicer shows loading until views are ready
 * - On view load: silently restores sliceType from view and rowSelection from localStorage
 * - On user-initiated slice type change: saves the new sliceType to the view
 * - On user-initiated selection change: saves rowSelection to localStorage
 */
export const useSlicerViewSync = (
  viewSliceType: string | undefined,
  onUpdateSliceType: (sliceType: string) => void,
  isLoadingViews?: boolean,
  selectionStorageKey?: string,
) => {
  const { sliceType, setSliceType, setIsViewSyncPending, rowSelection, setRowSelection } =
    useSlicerContext()
  const initializedRef = useRef(false)
  const isRestoringTypeRef = useRef(false)
  const isRestoringSelectionRef = useRef(false)

  // Keep a ref to always have the latest callback, avoiding stale closures
  const onUpdateSliceTypeRef = useRef(onUpdateSliceType)
  onUpdateSliceTypeRef.current = onUpdateSliceType

  const [storedSelection, setStoredSelection] = useLocalStorage<StoredSelection>(
    selectionStorageKey || 'slicer-selection',
    { type: '', selection: {} },
  )

  // On mount: mark sync as pending so slicer shows loading
  useEffect(() => {
    setIsViewSyncPending(true)
    return () => {
      setIsViewSyncPending(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Restore: view → slicer (only when views finish loading, not on save-triggered updates)
  useEffect(() => {
    if (isLoadingViews) return
    if (initializedRef.current) return

    initializedRef.current = true
    setIsViewSyncPending(false)

    const restoredType = viewSliceType || sliceType

    // Restore saved slice type if present
    if (viewSliceType && viewSliceType !== sliceType) {
      isRestoringTypeRef.current = true
      setSliceType(viewSliceType as SliceType)
    }

    // Restore selection from localStorage if it matches the restored slice type
    if (
      storedSelection.type === restoredType &&
      Object.keys(storedSelection.selection).length > 0
    ) {
      isRestoringSelectionRef.current = true
      setRowSelection(storedSelection.selection)
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

  // Save: slicer selection → localStorage (on user change)
  useEffect(() => {
    if (!initializedRef.current) return

    // Skip the sync triggered by the restore above
    if (isRestoringSelectionRef.current) {
      isRestoringSelectionRef.current = false
      return
    }

    setStoredSelection({ type: sliceType, selection: rowSelection })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection])
}