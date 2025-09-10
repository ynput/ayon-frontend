import { RowSelectionState } from '@tanstack/react-table'
import { useListsContext } from '../context'
import { CommandEvent, useCreateContextMenu } from '@shared/containers/ContextMenu'
import { useCallback, useState } from 'react'
import { useAppSelector } from '@state/store'
import useClearListItems from './useClearListItems'
import useUpdateListCategory from './useUpdateListCategory'
import { useProjectDataContext } from '@shared/containers/ProjectTreeTable'
import { useListsDataContext } from '../context/ListsDataContext'

const useListContextMenu = () => {
  const user = useAppSelector((state) => state.user)
  const developerMode = user?.attrib.developerMode
  const { projectName } = useProjectDataContext()
  const { listsData, categoryEnum } = useListsDataContext()
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
  const { updateCategory, createAndAssignCategory } = useUpdateListCategory({ projectName })

  // Dialog state for creating categories
  const [createCategoryDialog, setCreateCategoryDialog] = useState<{
    isOpen: boolean
    listId: string | null
  }>({ isOpen: false, listId: null })

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

  const openCreateCategoryDialog = useCallback((listId: string) => {
    setCreateCategoryDialog({ isOpen: true, listId })
  }, [])

  const closeCreateCategoryDialog = useCallback(() => {
    setCreateCategoryDialog({ isOpen: false, listId: null })
  }, [])

  const handleCreateCategory = useCallback(
    async (categoryName: string) => {
      if (createCategoryDialog.listId) {
        await createAndAssignCategory(createCategoryDialog.listId, categoryName)
      }
    },
    [createCategoryDialog.listId, createAndAssignCategory],
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

      // Create category submenu items
      const createCategorySubmenu = () => {
        if (multipleSelected || !allSelectedRowsAreLists || !selectedList) {
          return []
        }

        const currentCategory = selectedList.data?.category
        const submenuItems: any[] = []

        // Add "Create category" option at the top
        submenuItems.push({
          label: 'Create category',
          icon: 'add',
          command: () => openCreateCategoryDialog(selectedList.id),
        })

        // Add "Remove category" option if the list has a category
        if (currentCategory) {
          submenuItems.push({
            label: 'Remove category',
            icon: 'close',
            command: () => updateCategory(selectedList.id, null),
          })
        }

        // Add available categories (excluding the current one)
        const availableCategories = categoryEnum.filter((cat) => cat.value !== currentCategory)

        if (availableCategories.length > 0) {
          if (submenuItems.length > 0) {
            submenuItems.push({ separator: true })
          }

          availableCategories.forEach((category) => {
            submenuItems.push({
              label: category.label,
              icon: 'folder',
              command: () => updateCategory(selectedList.id, category.value),
            })
          })
        }

        return submenuItems
      }

      const categorySubmenu = createCategorySubmenu()

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
          label: 'Add category',
          icon: 'sell',
          items: categorySubmenu,
          disabled: multipleSelected || !allSelectedRowsAreLists,
          hidden: !allSelectedRowsAreLists || categorySubmenu.length === 0,
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
      categoryEnum,
      setRowSelection,
      openRenameList,
      openDetailsPanel,
      deleteLists,
      createReviewSessionList,
      updateCategory,
    ],
  )

  return {
    openContext,
    createCategoryDialog,
    closeCreateCategoryDialog,
    handleCreateCategory,
    existingCategories: categoryEnum.map((cat) => cat.value),
  }
}

export default useListContextMenu
