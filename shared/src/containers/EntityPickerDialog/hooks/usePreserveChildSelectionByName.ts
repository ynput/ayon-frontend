import { useEffect, useRef } from 'react'
import { RowSelectionState } from '@tanstack/react-table'
import { PickerEntityType, PickerSelection } from '../EntityPickerDialog'
import type { EntityPickerDataReturn } from './useGetEntityPickerData'

interface UsePreserveChildSelectionByNameProps {
  entityHierarchy: PickerEntityType[]
  entityData: EntityPickerDataReturn
  rowSelection: PickerSelection
  setEntityRowSelection: (selection: RowSelectionState, entityType: PickerEntityType) => void
}

interface PreserveState {
  // Names of currently selected entities per type — updated continuously by Effect 2
  selectedNames: Partial<Record<PickerEntityType, string[]>>
  // Names to match when child data finishes loading
  pendingNameMatches: Partial<Record<PickerEntityType, Set<string>>>
  // Skip detection on the next render (after an auto-select caused the selection change)
  skipDetection: boolean
  // Previous parent selection keys to detect changes
  prevParentKeys: Record<string, string>
}

export const usePreserveChildSelectionByName = ({
  entityHierarchy,
  entityData,
  rowSelection,
  setEntityRowSelection,
}: UsePreserveChildSelectionByNameProps) => {
  const stateRef = useRef<PreserveState>({
    selectedNames: {},
    pendingNameMatches: {},
    skipDetection: false,
    prevParentKeys: {},
  })

  // Effect 1 — Detect parent selection changes and copy selectedNames → pendingNameMatches
  // MUST be declared before Effect 2 so it reads the *previous* render's selectedNames values
  useEffect(() => {
    const state = stateRef.current

    // Compute selection keys for all parent types once per effect run
    const currentKeys: Record<string, string> = {}
    for (let i = 0; i < entityHierarchy.length - 1; i++) {
      const type = entityHierarchy[i]
      const selection = rowSelection[type] || {}
      currentKeys[type] = Object.keys(selection)
        .filter((id) => selection[id])
        .sort()
        .join(',')
    }

    if (state.skipDetection) {
      state.prevParentKeys = currentKeys
      state.skipDetection = false
      return
    }

    for (let i = 0; i < entityHierarchy.length - 1; i++) {
      const parentType = entityHierarchy[i]
      const prevKey = state.prevParentKeys[parentType]

      if (prevKey !== undefined && prevKey !== currentKeys[parentType]) {
        const parentDeselected = currentKeys[parentType] === ''

        if (parentDeselected) {
          // Parent fully deselected — clear all descendant selections
          for (let j = i + 1; j < entityHierarchy.length; j++) {
            state.skipDetection = true
            setEntityRowSelection({}, entityHierarchy[j])
          }
        } else {
          // Parent switched — capture names for every descendant level
          for (let j = i + 1; j < entityHierarchy.length; j++) {
            const childType = entityHierarchy[j]
            const names = state.selectedNames[childType]
            if (names?.length) {
              state.pendingNameMatches[childType] = new Set(names)
            }
          }
        }
        break // only handle the highest-level parent change
      }
    }

    state.prevParentKeys = currentKeys
  }, [entityHierarchy, rowSelection])

  // Effect 2 — Continuously track the names of selected entities (runs AFTER Effect 1)
  useEffect(() => {
    const state = stateRef.current

    for (const type of entityHierarchy) {
      const selection = rowSelection[type] || {}
      const selectedIds = new Set(Object.keys(selection).filter((id) => selection[id]))
      const data = entityData[type]?.data || []
      state.selectedNames[type] = data
        .filter((entity) => selectedIds.has(entity.id))
        .map((entity) => entity.name)
    }
  }, [entityHierarchy, rowSelection, entityData])

  // Effect 3 — When child data finishes loading and there are pending names, auto-select matches
  useEffect(() => {
    const state = stateRef.current
    // Track types processed in THIS run so child types wait for the next render
    // (the parent's state update hasn't propagated yet, so child data is still stale)
    const processedInThisRun = new Set<PickerEntityType>()

    for (const type of entityHierarchy) {
      const pendingNames = state.pendingNameMatches[type]
      if (!pendingNames?.size) continue

      // Don't consume child pending matches while a parent type is still pending
      // or was just processed in this same run (its state update hasn't propagated yet).
      const typeIndex = entityHierarchy.indexOf(type)
      const hasParentPending = entityHierarchy
        .slice(0, typeIndex)
        .some(
          (parentType) =>
            state.pendingNameMatches[parentType]?.size || processedInThisRun.has(parentType),
        )
      if (hasParentPending) continue

      const { isLoading, data } = entityData[type]
      if (isLoading) continue

      // Clear pending once loading completes — even if data is empty (no children under this parent)
      delete state.pendingNameMatches[type]
      processedInThisRun.add(type)

      if (!data?.length) {
        // No children under this parent, clear stale selection
        state.skipDetection = true
        setEntityRowSelection({}, type)
        continue
      }

      const newSelection: RowSelectionState = {}
      for (const entity of data) {
        if (pendingNames.has(entity.name)) {
          newSelection[entity.id] = true
        }
      }

      state.skipDetection = true
      setEntityRowSelection(newSelection, type)
    }
  }, [entityHierarchy, entityData, setEntityRowSelection])
}
