import { TreeTable } from 'primereact/treetable'
import { useMemo, useCallback, RefObject } from 'react'

// Utility function to extract ID from a class list
export const extractIdFromClassList = (classList: DOMTokenList): string | null => {
  const idClass = Array.from(classList).find((c) => c.startsWith('id-'))
  return idClass ? idClass.split('-')[1] : null
}

export const getMultiSelection = (
  selection: { [key: string]: boolean },
  newSelection: string[],
  orderedIds: string[],
  nextId: string,
  direction: number,
): string[] => {
  const previousSelection = Object.keys(selection)
  newSelection = [...new Set([...newSelection, ...previousSelection])]
  newSelection = orderedIds.filter((id) => newSelection.includes(id))

  const isInPrevious = previousSelection.includes(nextId)
  if (isInPrevious) {
    if (direction === 1) {
      newSelection.shift()
    } else {
      newSelection.pop()
    }
  }

  return newSelection
}

// Type definitions for props
export interface UseTableNavigationProps {
  tableRef: RefObject<TreeTable>
  treeData: any[]
  selection: Record<string, boolean>
  onSelectionChange: (selection: { array: string[]; object: { [key: string]: boolean } }) => void
  config: { multiSelect?: boolean }
}

// Hook to manage table navigation for Arrow keys
export const useTableKeyboardNavigation = ({
  tableRef,
  treeData,
  selection,
  onSelectionChange,
  config: { multiSelect = true } = {},
}: UseTableNavigationProps) => {
  // Get all row IDs from the table
  const tableRowsIds = useMemo(() => {
    const rows: string[] = []
    tableRef.current
      ?.getElement()
      ?.querySelectorAll('.p-treetable-tbody tr')
      .forEach((tr) => {
        const id = extractIdFromClassList(tr.classList)
        if (id) {
          rows.push(id)
        }
      })

    return rows
  }, [tableRef.current, treeData])

  // Handle Arrow keydown event
  const handleTableKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const { key, target, shiftKey } = event

      if ((target as HTMLElement).tagName === 'TR' && (key === 'ArrowDown' || key === 'ArrowUp')) {
        const direction = key === 'ArrowDown' ? 1 : -1
        const nextElement =
          direction === 1
            ? (target as HTMLElement).nextElementSibling
            : (target as HTMLElement).previousElementSibling

        if (!nextElement) return

        const nextId = extractIdFromClassList(nextElement.classList)

        if (!nextId && nextId !== 'undefined') return

        let newSelection = [nextId]
        if (shiftKey && multiSelect) {
          newSelection = getMultiSelection(selection, newSelection, tableRowsIds, nextId, direction)
        }
        const array = newSelection
        const object = newSelection.reduce((acc: { [key: string]: boolean }, id: string) => {
          acc[id] = true
          return acc
        }, {})

        onSelectionChange({ array, object })
      }
    },
    [tableRowsIds, selection],
  )

  return handleTableKeyDown
}

export default useTableKeyboardNavigation
