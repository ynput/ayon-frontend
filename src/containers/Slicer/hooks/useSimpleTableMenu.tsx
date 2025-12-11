import { useCallback } from 'react'
import { useCreateContextMenu } from '@shared/containers'
import { ExpandedState, RowSelectionState } from '@tanstack/react-table'
import { SimpleTableRow } from '@shared/containers/SimpleTable'
import { getPlatformShortcutKey, KeyMode } from '@shared/util'

type UseSimpleTableMenuProps = {
  expanded: ExpandedState
  setExpanded: (expanded: ExpandedState) => void
  rowSelection: RowSelectionState
  setRowSelection: (selection: RowSelectionState) => void
  tableData: SimpleTableRow[]
}

const useSimpleTableMenu = ({
  expanded,
  setExpanded,
  rowSelection,
  setRowSelection,
  tableData,
}: UseSimpleTableMenuProps) => {
  const [ctxMenuShow] = useCreateContextMenu()

  const getAllDescendantIds = useCallback((rowId: string, data: SimpleTableRow[]): string[] => {
    const descendantIds: string[] = []

    // Find the row in the data
    const findRowAndDescendants = (rows: SimpleTableRow[]): void => {
      for (const row of rows) {
        if (row.id === rowId) {
          // Found the row, now get all its descendants
          const collectDescendants = (children: SimpleTableRow[]): void => {
            for (const child of children) {
              descendantIds.push(child.id)
              if (child.subRows && child.subRows.length > 0) {
                collectDescendants(child.subRows)
              }
            }
          }
          if (row.subRows && row.subRows.length > 0) {
            collectDescendants(row.subRows)
          }
          return
        }
        // Continue searching in subRows
        if (row.subRows && row.subRows.length > 0) {
          findRowAndDescendants(row.subRows)
        }
      }
    }

    findRowAndDescendants(data)
    return descendantIds
  }, [])

  const handleExpand = useCallback(
    (selectedIds: string[]) => {
      const currentExpanded = expanded || {}
      const newExpanded = { ...(currentExpanded as Record<string, boolean>) }

      selectedIds.forEach((id) => {
        // Add the folder itself
        newExpanded[id] = true

        // Add ALL its descendants (children, grandchildren, etc.)
        const descendantIds = getAllDescendantIds(id, tableData)
        descendantIds.forEach((descendantId) => {
          newExpanded[descendantId] = true
        })
      })

      setExpanded(newExpanded)
    },
    [expanded, setExpanded, tableData, getAllDescendantIds],
  )

  const handleCollapse = useCallback(
    (selectedIds: string[]) => {
      const currentExpanded = expanded || {}
      const newExpanded = { ...(currentExpanded as Record<string, boolean>) }

      selectedIds.forEach((id) => {
        // Remove the folder itself
        delete newExpanded[id]

        // Remove ALL its descendants (children, grandchildren, etc.)
        const descendantIds = getAllDescendantIds(id, tableData)
        descendantIds.forEach((descendantId) => {
          delete newExpanded[descendantId]
        })
      })

      setExpanded(newExpanded)
    },
    [expanded, setExpanded, tableData, getAllDescendantIds],
  )

  // Handle alt+click for expand/collapse
  const handleRowClick = useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      if (event.altKey) {
        event.preventDefault()
        event.stopPropagation()

        // Get the row ID from the event target
        const rowId = event.currentTarget.id
        if (!rowId) return

        // Check if this row is in the current selection
        const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id])
        const isInSelection = selectedIds.includes(rowId)

        // If the clicked row is in the selection, use all selected rows, otherwise just the clicked row
        const idsToToggle = isInSelection ? selectedIds : [rowId]

        // Check if the clicked row is expanded
        const isExpanded = expanded && (expanded as Record<string, boolean>)[rowId]

        if (isExpanded) {
          handleCollapse(idsToToggle)
        } else {
          handleExpand(idsToToggle)
        }
      }
    },
    [rowSelection, expanded, handleExpand, handleCollapse],
  )

  const openContext = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault()
      e.stopPropagation()

      // Get the clicked row ID from the event target
      const clickedRowId = e.currentTarget.id

      // Temporary selection: if clicked row is not in current selection, select it temporarily
      let newSelection: RowSelectionState = { ...rowSelection }
      if (!newSelection[clickedRowId]) {
        newSelection = { [clickedRowId]: true }
        setRowSelection(newSelection)
      }

      // Get selected IDs based on the new selection
      const selectedIds = Object.keys(newSelection).filter((id) => newSelection[id])
      const multipleSelected = selectedIds.length > 1
      const hasSelection = selectedIds.length > 0

      const menuItems = [
        {
          label: 'Expand All',
          icon: 'unfold_more',
          command: () => handleExpand(selectedIds),
          hidden: multipleSelected || !hasSelection,
          shortcut: getPlatformShortcutKey('click', [KeyMode.Alt]),
        },
        {
          label: 'Collapse All',
          icon: 'unfold_less',
          command: () => handleCollapse(selectedIds),
          hidden: multipleSelected || !hasSelection,
          shortcut: getPlatformShortcutKey('click', [KeyMode.Alt]),
        },
      ].filter((item) => !item.hidden)

      ctxMenuShow(e, menuItems)
    },
    [ctxMenuShow, rowSelection, setRowSelection, handleExpand, handleCollapse],
  )


  return {
    openContext,
    handleRowClick,
  }
}

export default useSimpleTableMenu
