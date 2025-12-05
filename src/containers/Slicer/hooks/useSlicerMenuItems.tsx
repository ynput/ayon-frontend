import { useCallback } from 'react'
import { useCreateContextMenu } from '@shared/containers'
import { ExpandedState, RowSelectionState } from '@tanstack/react-table'
import { SimpleTableRow } from '@shared/containers/SimpleTable'

type UseSectionMenuItemsProps = {
  expanded: ExpandedState
  setExpanded: (expanded: ExpandedState) => void
  rowSelection: RowSelectionState
  setRowSelection: (selection: RowSelectionState) => void
  tableData: SimpleTableRow[] // The table data to traverse for children
}

const useSlicerMenuItems = ({
  expanded,
  setExpanded,
  rowSelection,
  setRowSelection,
  tableData,
}: UseSectionMenuItemsProps) => {
  const [ctxMenuShow] = useCreateContextMenu()

  // Helper function: Recursively get all descendant IDs from a row
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

  const handleDelete = useCallback(
    (selectedIds: string[]) => {
      console.log('Delete selected items:', selectedIds)
      // Add your delete logic here
    },
    [],
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
        },
        {
          label: 'Collapse All',
          icon: 'unfold_less',
          command: () => handleCollapse(selectedIds),
          hidden: multipleSelected || !hasSelection,
        },
        {
          label: 'Delete',
          icon: 'delete',
          danger: true,
          command: () => handleDelete(selectedIds),
          hidden: !hasSelection,
        },
      ].filter((item) => !item.hidden)

      ctxMenuShow(e, menuItems)
    },
    [ctxMenuShow, rowSelection, handleExpand, handleCollapse, handleDelete],
  )

  return { openContext }
}

export default useSlicerMenuItems
