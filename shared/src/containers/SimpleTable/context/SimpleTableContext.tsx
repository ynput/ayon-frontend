import { ExpandedState, RowPinningState, RowSelectionState } from '@tanstack/react-table'
import { createContext, ReactNode, useCallback, useContext } from 'react'
import { ContextMenuItemType, useCreateContextMenu } from '@shared/containers'
import { getPlatformShortcutKey, KeyMode } from '@shared/util'

type DefaultMenuItem = 'expand-collapse'

// Rich metadata for a single row
export type SimpleTableRowMeta = {
  rowId: string
  hasChildren: boolean
  isExpanded: boolean
  depth: number
  parentId?: string
}

// Rich context metadata passed to menu item constructors
export type SimpleTableContextMeta = {
  // Row IDs (for commands)
  selectedRows: string[]

  // Clicked row derived info (pre-computed)
  clickedRowMeta: SimpleTableRowMeta

  // Selected rows derived info (pre-computed)
  selectedRowsMeta: SimpleTableRowMeta[]

  // Aggregate info (useful for menu logic)
  allSelectedHaveChildren: boolean
  anySelectedHasChildren: boolean
  allSelectedExpanded: boolean
  anySelectedExpanded: boolean
}

// Context menu item constructor for SimpleTable
export type SimpleTableContextMenuItemConstructor = (
  e: React.MouseEvent<HTMLElement>,
  clickedRow: any,
  selectedRows: any[],
  meta: SimpleTableContextMeta,
) => ContextMenuItemType | ContextMenuItemType[] | undefined
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
  menuItems: (SimpleTableContextMenuItemConstructor | string)[]
  onContextMenu?: (e: React.MouseEvent<HTMLElement>) => void
  handleAltClick?: (e: React.MouseEvent<HTMLElement>) => void
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
const getAllDescendantIds = (rowId: string, data: any): string[] => {
  const descendantIds: string[] = []

  // If data is a Map, get the row directly
  const row = data instanceof Map ? data.get(rowId) : null

  if (!row) return descendantIds

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

  return descendantIds
}

// Helper to compute row metadata
const getRowMeta = (
  row: any,
  rowId: string,
  expanded: ExpandedState | undefined,
): SimpleTableRowMeta => ({
  rowId,
  hasChildren: Boolean(row?.subRows?.length),
  isExpanded: Boolean(expanded && (expanded as Record<string, boolean>)[rowId]),
  depth: row?.depth ?? 0,
  parentId: row?.parentId,
})

export const SimpleTableProvider = ({
  children,
  menuItems: inputMenuItems,
  ...props
}: SimpleTableProviderProps) => {
  const { expanded, setExpanded, rowSelection } = props
  const tableData = props.data // Map of row data

  // Context menu hook
  const [cellContextMenuShow] = useCreateContextMenu([])

  const toggleExpandAll = useCallback(
    (rowIds: string[], expandAll: boolean | undefined) => {
      const expandedState = typeof expanded === 'object' ? expanded : {}
      const newExpandedState = { ...expandedState }

      rowIds.forEach((rowId) => {
        // Get all children of the rowId using tableData
        const childIds = getAllDescendantIds(rowId, tableData)
        const isExpanded = expandedState[rowId] || false

        if (expandAll !== undefined ? !expandAll : isExpanded) {
          // Collapse all children
          newExpandedState[rowId] = false
          childIds.forEach((id) => {
            newExpandedState[id] = false
          })
        } else {
          // Expand all children
          newExpandedState[rowId] = true
          childIds.forEach((id) => {
            newExpandedState[id] = true
          })
        }
      })

      setExpanded?.(newExpandedState)
    },
    [expanded, setExpanded, tableData],
  )

  const expandCollapseChildrenItems: SimpleTableContextMenuItemConstructor = (
    _e,
    _clickedRow,
    _selectedRows,
    meta,
  ) => {
    // Use pre-computed metadata
    const { hasChildren } = meta.clickedRowMeta

    return [
      {
        label: 'Expand children',
        icon: 'expand_all',
        command: () => toggleExpandAll(meta.selectedRows, true),
        hidden: !hasChildren,
        shortcut: getPlatformShortcutKey('click', [KeyMode.Alt]),
      },
      {
        label: 'Collapse children',
        icon: 'collapse_all',
        command: () => toggleExpandAll(meta.selectedRows, false),
        hidden: !hasChildren,
        shortcut: getPlatformShortcutKey('click', [KeyMode.Alt]),
      },
    ]
  }

  const builtInMenuItems: Record<DefaultMenuItem, SimpleTableContextMenuItemConstructor> = {
    ['expand-collapse']: expandCollapseChildrenItems,
  }

  // Context menu handler
  const onContextMenu = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const target = e.target as HTMLElement
      e.preventDefault()
      e.stopPropagation()
      const tdEl = target.closest('td')
      const rowId = tdEl?.parentElement?.id

      if (!rowId || !tableData) return

      // Get clicked row data from Map
      const clickedRowData = tableData.get(rowId)
      if (!clickedRowData) return

      // Get selected rows IDs and data
      let selectedRowsIds = Object.keys(rowSelection).filter((id) => rowSelection[id])

      // If no rows are selected, use the clicked row
      if (selectedRowsIds.length === 0) {
        selectedRowsIds = [rowId]
      }

      const selectedRowsData = selectedRowsIds
        .map((id) => tableData.get(id))
        .filter(Boolean)

      // Remove duplicates based on id
      const filteredSelectedRowsData = [
        ...new Map(selectedRowsData.map((row: any) => [row.id, row])).values(),
      ]

      // Pre-compute rich metadata
      const clickedRowMeta = getRowMeta(clickedRowData, rowId, expanded)
      const selectedRowsMeta = selectedRowsIds.map((id) =>
        getRowMeta(tableData.get(id), id, expanded),
      )

      const meta: SimpleTableContextMeta = {
        selectedRows: selectedRowsIds,
        clickedRowMeta,
        selectedRowsMeta,
        allSelectedHaveChildren: selectedRowsMeta.every((r) => r.hasChildren),
        anySelectedHasChildren: selectedRowsMeta.some((r) => r.hasChildren),
        allSelectedExpanded: selectedRowsMeta.every((r) => r.isExpanded),
        anySelectedExpanded: selectedRowsMeta.some((r) => r.isExpanded),
      }

      const constructedMenuItems = inputMenuItems?.flatMap((constructor) =>
        typeof constructor === 'function'
          ? constructor(e, clickedRowData, filteredSelectedRowsData, meta)
          : constructor in builtInMenuItems
            ? builtInMenuItems[constructor as DefaultMenuItem](
                e,
                clickedRowData,
                filteredSelectedRowsData,
                meta,
              )
            : [],
      )

      cellContextMenuShow(e, constructedMenuItems)
    },
    [inputMenuItems, rowSelection, builtInMenuItems, cellContextMenuShow, tableData, expanded],
  )

  const handleAltClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (e.altKey) {
        e.preventDefault()
        e.stopPropagation()

        // Get the row ID from the event target
        const rowId = e.currentTarget.id
        if (!rowId) return

        // Check if this row is in the current selection
        const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id])
        const isInSelection = selectedIds.includes(rowId)

        // If the clicked row is in the selection, use all selected rows, otherwise just the clicked row
        const idsToToggle = isInSelection ? selectedIds : [rowId]

        // Check if the clicked row is expanded
        const isExpanded = expanded && (expanded as Record<string, boolean>)[rowId]

        toggleExpandAll(idsToToggle, !isExpanded)
      }
    },
    [rowSelection, expanded, toggleExpandAll],
  )

  return (
    <SimpleTableContext.Provider
      value={{
        ...props,
        rowSelection,
        menuItems: inputMenuItems || [],
        onContextMenu,
        handleAltClick,
      }}
    >
      {children}
    </SimpleTableContext.Provider>
  )
}

export const useSimpleTableContext = () => {
  const context = useContext(SimpleTableContext)
  if (context === undefined) {
    throw new Error('useSimpleTableContext must be used within a SimpleTableProvider')
  }
  return context
}

export default SimpleTableContext
