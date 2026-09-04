import { readSessionStorage, writeSessionStorage } from '@shared/hooks/useSessionStorage'
import { ExpandedState, RowSelectionState } from '@tanstack/react-table'
import { SliceType } from '../types'
import { useCallback, useEffect, useRef, useState } from 'react'

type UseSlicerRowSelectionProps = {
  sliceTypes: SliceType[]
  page: string
  projectName: string
  // forwarded external state management (applies to the first panel only)
  rowSelection?: RowSelectionState
  setRowSelection?: React.Dispatch<React.SetStateAction<RowSelectionState>>
  expanded?: ExpandedState
  setExpanded?: React.Dispatch<React.SetStateAction<ExpandedState>>
}

// panel heights are written on every pointer move of a resize, so only the buckets this
// hook actually reads may invalidate it
const READ_BUCKET_PREFIXES = ['slicer-selection-', 'slicer-expanded-']

// hierarchy buckets are shared across pages, other slice types get one bucket per page
const getSelectionKey = (projectName: string, page: string, sliceType: SliceType) =>
  sliceType === 'hierarchy'
    ? `slicer-selection-hierarchy-${projectName}`
    : `slicer-selection-${projectName}-${page}-${sliceType}`

const getExpandedKey = (projectName: string, page: string, sliceType: SliceType) =>
  sliceType === 'hierarchy'
    ? `slicer-expanded-hierarchy-${projectName}`
    : `slicer-expanded-${projectName}-${page}-${sliceType}`

export const useSlicerRowSelection = ({
  sliceTypes,
  page,
  projectName,
  ...props
}: UseSlicerRowSelectionProps) => {
  const [storageVersion, setStorageVersion] = useState(0)

  useEffect(() => {
    // any storage write fires this, so ignore keys no slicer bucket reads
    const handler = (event: Event | StorageEvent) => {
      const key =
        (event as CustomEvent<{ key?: string }>).detail?.key ??
        ('key' in event ? event.key : undefined)
      if (key && !READ_BUCKET_PREFIXES.some((prefix) => key.startsWith(prefix))) return
      setStorageVersion((v) => v + 1)
    }
    window.addEventListener('session-storage', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('session-storage', handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  // reuse parsed values while the raw string is unchanged so references stay stable
  const cacheRef = useRef<Map<string, { raw: string | null; value: any }>>(new Map())
  const readBucket = useCallback(<T>(key: string, fallback: T): T => {
    const raw = typeof window === 'undefined' ? null : sessionStorage.getItem(key)
    const cached = cacheRef.current.get(key)
    if (cached && cached.raw === raw) return cached.value
    const value = readSessionStorage(key, fallback)
    cacheRef.current.set(key, { raw, value })
    return value
  }, [])

  const firstSliceType = sliceTypes[0]

  const getPanelSelection = useCallback(
    (sliceType: SliceType): RowSelectionState => {
      if (props.rowSelection && sliceType === firstSliceType) return props.rowSelection
      return readBucket(getSelectionKey(projectName, page, sliceType), {})
    },
    // storageVersion invalidates memoized reads when any bucket changes
    [props.rowSelection, firstSliceType, projectName, page, readBucket, storageVersion],
  )

  const setPanelSelection = useCallback(
    (sliceType: SliceType, value: React.SetStateAction<RowSelectionState>) => {
      if (props.setRowSelection && sliceType === firstSliceType) {
        props.setRowSelection(value)
        return
      }
      const key = getSelectionKey(projectName, page, sliceType)
      const next = typeof value === 'function' ? value(readBucket(key, {})) : value
      writeSessionStorage(key, next)
    },
    [props.setRowSelection, firstSliceType, projectName, page, readBucket],
  )

  const getPanelExpanded = useCallback(
    (sliceType: SliceType): ExpandedState => {
      if (props.expanded && sliceType === firstSliceType) return props.expanded
      return readBucket(getExpandedKey(projectName, page, sliceType), {})
    },
    [props.expanded, firstSliceType, projectName, page, readBucket, storageVersion],
  )

  const setPanelExpanded = useCallback(
    (sliceType: SliceType, value: React.SetStateAction<ExpandedState>) => {
      if (props.setExpanded && sliceType === firstSliceType) {
        props.setExpanded(value)
        return
      }
      const key = getExpandedKey(projectName, page, sliceType)
      const next = typeof value === 'function' ? value(readBucket(key, {})) : value
      writeSessionStorage(key, next)
    },
    [props.setExpanded, firstSliceType, projectName, page, readBucket],
  )

  // first panel state, kept in the shape single-panel consumers expect
  const rowSelection = getPanelSelection(firstSliceType)
  const setRowSelection = useCallback(
    (value: React.SetStateAction<RowSelectionState>, targetSliceType: SliceType = firstSliceType) =>
      setPanelSelection(targetSliceType, value),
    [setPanelSelection, firstSliceType],
  )

  const expanded = getPanelExpanded(firstSliceType)
  const setExpanded = useCallback(
    (value: React.SetStateAction<ExpandedState>, targetSliceType: SliceType = firstSliceType) =>
      setPanelExpanded(targetSliceType, value),
    [setPanelExpanded, firstSliceType],
  )

  return {
    rowSelection,
    setRowSelection,
    expanded,
    setExpanded,
    getPanelSelection,
    setPanelSelection,
    getPanelExpanded,
    setPanelExpanded,
  }
}
