import { ExpandedState, RowPinningState, RowSelectionState, Table } from '@tanstack/react-table'
import { createContext, useContext, ReactNode, useMemo, useCallback } from 'react'
import { ContextMenuItemType, useCreateContextMenu } from '@shared/containers'
import { getPlatformShortcutKey, KeyMode } from '@shared/util'

interface SimpleTableContextValue {
  // forwarded from props
  expanded?: ExpandedState
  setExpanded?: React.Dispatch<React.SetStateAction<ExpandedState>>
  onExpandedChange?: (expanded: ExpandedState) => void
  rowSelection: RowSelectionState
  onRowSelectionChange: (selection: RowSelectionState) => void // should be used most of the time
  setRowSelection?: (rowSelection: RowSelectionState) => void // used to directly update the row selection
  rowPinning?: RowPinningState
  onRowPinningChange?: (rowPinning: RowPinningState) => void
  data?: any
  menuItems: (ContextMenuItemType | string)[]
  onContextMenu?: (e: React.MouseEvent<HTMLElement>) => void
}

const SimpleTableContext = createContext<SimpleTableContextValue | undefined>(undefined)

interface SimpleTableProviderProps {
  children: ReactNode
  expanded?: SimpleTableContextValue['expanded']
  setExpanded?: SimpleTableContextValue['setExpanded']
  onExpandedChange?: SimpleTableContextValue['onExpandedChange']
  rowSelection: SimpleTableContextValue['rowSelection']
  onRowSelectionChange: SimpleTableContextValue['onRowSelectionChange']
  setRowSelection?: SimpleTableContextValue['setRowSelection']
  rowPinning?: SimpleTableContextValue['rowPinning']
  onRowPinningChange?: SimpleTableContextValue['onRowPinningChange']
  data?: SimpleTableContextValue['data']
  menuItems?: SimpleTableContextValue['menuItems']
}
const getAllDescendantIds = (rowId: string, data: any[]): string[] => {
  const descendantIds: string[] = []

  const findRowAndDescendants = (rows: any[]): void => {
    for (const row of rows) {
      if (row.id === rowId) {
        const collectDescendants = (children: any[]): void => {
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
      if (row.subRows && row.subRows.length > 0) {
        findRowAndDescendants(row.subRows)
      }
    }
  }
  findRowAndDescendants(data)
  return descendantIds
}
export const SimpleTableProvider = ({ children, menuItems: inputMenuItems, ...props }: SimpleTableProviderProps) => {
  const { expanded, setExpanded, rowSelection, setRowSelection } = props
  const tableData = props.data // Assuming this is the tanstack-table data structure (sliceTableData)

  // Context menu hook
  const [ctxMenuShow] = useCreateContextMenu()

  // --- Expansion/Collapse Command Handlers ---
  const handleExpand = useCallback(
    (selectedIds: string[]) => {
      const currentExpanded = expanded || {}
      const newExpanded = { ...(currentExpanded as Record<string, boolean>) }

      selectedIds.forEach((id) => {
        newExpanded[id] = true
        const descendantIds = getAllDescendantIds(id, tableData)
        descendantIds.forEach((descendantId) => {
          newExpanded[descendantId] = true
        })
      })

      setExpanded?.(newExpanded)
    },
    [expanded, setExpanded, tableData],
  )

  const handleCollapse = useCallback(
    (selectedIds: string[]) => {
      const currentExpanded = expanded || {}
      const newExpanded = { ...(currentExpanded as Record<string, boolean>) }

      selectedIds.forEach((id) => {
        delete newExpanded[id]
        const descendantIds = getAllDescendantIds(id, tableData)
        descendantIds.forEach((descendantId) => {
          delete newExpanded[descendantId]
        })
      })

      setExpanded?.(newExpanded)
    },
    [expanded, setExpanded, tableData],
  )

  // Helper function to compute menu items based on selected IDs
  const computeMenuItems = useCallback(
    (selectedIds: string[]) => {
      if (!Array.isArray(inputMenuItems)) return []

      const items: ContextMenuItemType[] = []
      const hasSelection = selectedIds.length > 0
      const multipleSelected = selectedIds.length > 1
console.log('computeMenuItems', inputMenuItems)
      // Process each menu item
      inputMenuItems.forEach((item) => {
        if (typeof item === 'string') {
          if (item === 'expand-collapse') {
            const handleExpandSelected = () => handleExpand(selectedIds)
            const handleCollapseSelected = () => handleCollapse(selectedIds)

            const isAllSelectedExpanded = selectedIds.every(
              (id) => expanded && (expanded as Record<string, boolean>)[id],
            )
            const isAllSelectedCollapsed = selectedIds.every(
              (id) => !expanded || !(expanded as Record<string, boolean>)[id],
            )

            const expandCollapseItems: ContextMenuItemType[] = [
              {
                label: 'Expand All',
                icon: 'unfold_more',
                command: handleExpandSelected,
                hidden: isAllSelectedExpanded,
                disabled: !hasSelection || multipleSelected,
                shortcut: getPlatformShortcutKey('click', [KeyMode.Alt]),
              },
              {
                label: 'Collapse All',
                icon: 'unfold_less',
                command: handleCollapseSelected,
                hidden: isAllSelectedCollapsed,
                disabled: !hasSelection || multipleSelected,
                shortcut: getPlatformShortcutKey('click', [KeyMode.Alt]),
              },
            ].filter((menuItem) => !menuItem.hidden)

            if (expandCollapseItems.length > 0 && items.length > 0) {
              items.push({ separator: true })
            }
            items.push(...expandCollapseItems)
          }
        } else {
          items.push(item)
        }
      })

      return items
    },
    [inputMenuItems, expanded, handleExpand, handleCollapse],
  )

  // --- Menu Item Construction (for display purposes) ---
  const finalMenuItems: ContextMenuItemType[] = useMemo(() => {
    const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id])
    return computeMenuItems(selectedIds)
  }, [computeMenuItems, rowSelection])

  // Context menu handler
  const onContextMenu = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault()
      e.stopPropagation()
      console.log('onContextMenu event:', e)
      console.log('e.currentTarget:', e.currentTarget)
      console.log('e.currentTarget.id:', e.currentTarget.id)

      // Get the clicked row ID from the event target
      const clickedRowId = e.currentTarget.id
      console.log('clickedRowId:', clickedRowId)
      console.log('rowSelection:', rowSelection)

      // Determine the effective selection (current or the clicked row if not selected)
      let effectiveSelection = rowSelection
      if (clickedRowId && !rowSelection[clickedRowId]) {
        effectiveSelection = { [clickedRowId]: true }
        console.log('Updated effectiveSelection:', effectiveSelection)
        // Update the actual selection
        if (setRowSelection) {
          setRowSelection(effectiveSelection)
        }
      }

      // Compute menu items based on effective selection
      const effectiveSelectedIds = Object.keys(effectiveSelection).filter((id) => effectiveSelection[id])
      console.log('effectiveSelectedIds:', effectiveSelectedIds)
      const menuItemsToShow = computeMenuItems(effectiveSelectedIds)
      console.log('menuItemsToShow:', menuItemsToShow)
      // Show context menu
      if (menuItemsToShow.length > 0) {
        ctxMenuShow(e, menuItemsToShow)
      } else {
        console.warn('No menu items to show!')
      }
    },
    [ctxMenuShow, rowSelection, setRowSelection, computeMenuItems],
  )

  return <SimpleTableContext.Provider value={{ ...props, rowSelection, menuItems: finalMenuItems, onContextMenu }}>{children}</SimpleTableContext.Provider>
}

export const useSimpleTableContext = () => {
  const context = useContext(SimpleTableContext)
  if (context === undefined) {
    throw new Error('useSimpleTableContext must be used within a SimpleTableProvider')
  }
  return context
}

export default SimpleTableContext
