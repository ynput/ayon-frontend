import { RowSelectionState } from '@tanstack/react-table'
import { useListsContext } from '../context'
import { CommandEvent, useCreateContextMenu } from '@shared/containers/ContextMenu'
import { useCallback } from 'react'
import { useAppSelector } from '@state/store'
import useClearListItems from './useClearListItems'
import { useProjectDataContext } from '@shared/containers/ProjectTreeTable'
import { useListsDataContext } from '../context/ListsDataContext'

const useListContextMenu = () => {
  const user = useAppSelector((state) => state.user)
  const developerMode = user?.attrib.developerMode
  const { projectName } = useProjectDataContext()
  const { listsData } = useListsDataContext()
  const {
    rowSelection,
    setRowSelection,
    openRenameList,
    openDetailsPanel,
    deleteLists,
    createReviewSessionList,
    isReview,
  } = useListsContext()

  const { clearListItems } = useClearListItems({ projectName })

  // create the ref and model
  const [ctxMenuShow] = useCreateContextMenu()

  const handleCreateReviewSessionList: (listId: string) => void = useCallback(
    async (listId) => {
      await createReviewSessionList?.(listId, {
        showToast: true,
        navigateOnSuccess: true,
      })
    },
    [createReviewSessionList, projectName],
  )

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
      const newSelectedRows = Object.entries(newSelection)
        .filter(([_k, v]) => v)
        .map(([k]) => k)
      const newSelectedLists = listsData.filter((list) =>
        newSelectedRows.some((selected) => list?.id === selected),
      )
      const selectedList = newSelectedLists[0]
      const firstSelectedRow = Object.keys(newSelection)[0]
      const multipleSelected = Object.keys(newSelection).length > 1
      // some rows are folders
      const allSelectedRowsAreLists = newSelectedRows.every((selected) =>
        newSelectedLists.some((list) => list?.id === selected),
      )

      const menuItems: any[] = [
        {
          label: 'Rename',
          icon: 'edit',
          command: () => openRenameList(firstSelectedRow),
          disabled: multipleSelected,
        },
        {
          label: 'Create review',
          icon: 'subscriptions',
          command: () => handleCreateReviewSessionList(selectedList.id),
          disabled: multipleSelected || !allSelectedRowsAreLists,
          hidden: !allSelectedRowsAreLists || isReview || !createReviewSessionList,
        },
        {
          label: 'Info',
          icon: 'info',
          command: () => openDetailsPanel(firstSelectedRow),
          disabled: multipleSelected,
          hidden: !allSelectedRowsAreLists,
        },
        {
          label: 'Clear list',
          icon: 'close',
          developer: true,
          command: () => clearListItems(firstSelectedRow),
          hidden: !developerMode || multipleSelected || !allSelectedRowsAreLists,
        },
        {
          label: 'Delete',
          icon: 'delete',
          danger: true,
          command: (e: CommandEvent) =>
            deleteLists(Object.keys(newSelection), {
              force: e.originalEvent.metaKey || e.originalEvent.ctrlKey,
            }),
          hidden: !allSelectedRowsAreLists,
        },
      ]

      ctxMenuShow(e, menuItems)
    },
    [
      ctxMenuShow,
      rowSelection,
      listsData,
      setRowSelection,
      openRenameList,
      openDetailsPanel,
      deleteLists,
      createReviewSessionList,
    ],
  )

  return openContext
}

export default useListContextMenu
