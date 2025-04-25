import { RowSelectionState } from '@tanstack/react-table'
import { useListsContext } from '../context/ListsContext'
import { CommandEvent, useCreateContextMenu } from '@shared/containers/ContextMenu'
import { useCallback } from 'react'

const useListContextMenu = () => {
  const { rowSelection, setRowSelection, openRenameList, openDetailsPanel, deleteLists } =
    useListsContext()

  // create the ref and model
  const [ctxMenuShow] = useCreateContextMenu()

  const openContext = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault()
      e.stopPropagation()

      let newSelection: RowSelectionState = { ...rowSelection }
      // if we are selecting a row outside of the selection (or none), set the selection to the row
      if (!newSelection[e.currentTarget.id]) {
        newSelection = { [e.currentTarget.id]: true }
        setRowSelection(newSelection)
      }
      const firstSelectedRow = Object.keys(newSelection)[0]
      const multipleSelected = Object.keys(newSelection).length > 1

      const menuItems: any[] = [
        {
          label: 'Rename',
          icon: 'edit',
          command: () => openRenameList(firstSelectedRow),
          disabled: multipleSelected,
        },
        {
          label: 'Info',
          icon: 'info',
          command: () => openDetailsPanel(firstSelectedRow),
          disabled: multipleSelected,
        },
        {
          label: 'Delete',
          icon: 'delete',
          danger: true,
          command: (e: CommandEvent) =>
            deleteLists(Object.keys(newSelection), {
              force: e.originalEvent.metaKey || e.originalEvent.ctrlKey,
            }),
        },
      ]

      ctxMenuShow(e, menuItems)
    },
    [ctxMenuShow, rowSelection, setRowSelection, openRenameList, openDetailsPanel, deleteLists],
  )

  return openContext
}

export default useListContextMenu
