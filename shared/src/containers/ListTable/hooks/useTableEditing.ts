import React, { useCallback, useState } from 'react'
import { ListTableCellEditingState } from '../ListTableCell'

export function useTableEditing() {
  const [editingCellId, setEditingCellId] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState<string | null>(null)

  const startEditingCell = useCallback((cellId: string) => {
    setEditingCellId(cellId)
  }, [])

  const stopEditingCell = useCallback(() => {
    setEditingCellId(null)
    setEditingDraft(null)
  }, [])

  const editingState = React.useMemo<ListTableCellEditingState>(
    () => ({
      editingCellId,
      startEditingCell,
      stopEditingCell,
      getDraftValue: () => editingDraft,
      setDraftValue: setEditingDraft,
    }),
    [editingCellId, editingDraft, startEditingCell, stopEditingCell],
  )

  return { editingState }
}
