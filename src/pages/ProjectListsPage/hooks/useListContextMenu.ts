import { RowSelectionState } from '@tanstack/react-table'
import { useListsContext } from '../context'
import { CommandEvent, useCreateContextMenu } from '@shared/containers/ContextMenu'
import { useCallback, useState } from 'react'
import { useAppSelector } from '@state/store'
import useClearListItems from './useClearListItems'
import { useProjectDataContext } from '@shared/containers/ProjectTreeTable'
import { useListsDataContext } from '../context/ListsDataContext'

const useListContextMenu = () => {
  const user = useAppSelector((state) => state.user)
  const developerMode = user?.attrib.developerMode
  const isUser = !user.data?.isAdmin && !user.data?.isManager
  const { projectName } = useProjectDataContext()
  const { listsData, categories } = useListsDataContext()
  const {
    rowSelection,
    setRowSelection,
    openRenameList,
    setListDetailsOpen,
    deleteLists,
    createReviewSessionList,
    isReview,
    setListsCategory,
    createAndAssignCategory,
    editCategory,
  } = useListsContext()

  const { clearListItems } = useClearListItems({ projectName })

  // Dialog state for creating/editing categories
  const [categoryFormDialog, setCategoryFormDialog] = useState<{
    isOpen: boolean
    mode: 'create' | 'edit'
    listIds: string[]
    initialCategory?: {
      label: string
      value: string
      icon?: string
      color?: string
    }
  }>({ isOpen: false, mode: 'create', listIds: [] })

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

  const openCreateCategoryDialog = useCallback((listIds: string[]) => {
    setCategoryFormDialog({ isOpen: true, mode: 'create', listIds })
  }, [])

  const openEditCategoryDialog = useCallback(
    (categoryValue: string) => {
      const category = categories.find((cat) => cat.value === categoryValue)
      if (category) {
        setCategoryFormDialog({
          isOpen: true,
          mode: 'edit',
          listIds: [],
          initialCategory: {
            label: category.label,
            value: category.value.toString(),
            icon: category.icon,
            color: category.color,
          },
        })
      }
    },
    [categories],
  )

  const closeCategoryFormDialog = useCallback(() => {
    setCategoryFormDialog({ isOpen: false, mode: 'create', listIds: [] })
  }, [])

  const handleSaveCategory = useCallback(
    async (category: { label: string; value: string; icon?: string; color?: string }) => {
      if (categoryFormDialog.mode === 'create') {
        await createAndAssignCategory(categoryFormDialog.listIds, category)
      } else if (categoryFormDialog.mode === 'edit' && categoryFormDialog.initialCategory) {
        await editCategory(categoryFormDialog.initialCategory.value, category)
      }
    },
    [categoryFormDialog, createAndAssignCategory, editCategory],
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
        if (!allSelectedRowsAreLists || newSelectedLists.length === 0) {
          return []
        }

        const submenuItems: any[] = []
        const selectedListIds = newSelectedLists.map((list) => list.id)

        // Add "Create category" option at the top
        submenuItems.push({
          label: 'Create category',
          icon: 'add',
          command: () => openCreateCategoryDialog(selectedListIds),
          hidden: isUser, // only admins and managers can create categories
        })

        // For multiple selections, show "Unset category" if any list has a category
        // For single selection, show "Unset category" only if that list has a category
        const hasAnyCategory = newSelectedLists.some((list) => list.data?.category)
        if (hasAnyCategory) {
          submenuItems.push({
            label: 'Unset category',
            icon: 'close',
            command: () => {
              setListsCategory(selectedListIds, null)
            },
          })
        }

        // Get categories that are not already assigned to ALL selected lists
        const availableCategories = categories.filter((cat) => {
          if (multipleSelected) {
            // For multiple selections, show categories that are not assigned to ALL lists
            return !newSelectedLists.every((list) => list.data?.category === cat.value)
          } else {
            // For single selection, show categories that are not assigned to this list
            return newSelectedLists[0]?.data?.category !== cat.value
          }
        })

        if (availableCategories.length > 0) {
          if (submenuItems.length > 0) {
            submenuItems.push({ separator: true })
          }

          availableCategories.forEach((category) => {
            submenuItems.push({
              label: category.label,
              icon: category.icon || 'sell',
              command: () => {
                setListsCategory(selectedListIds, category.value.toString())
              },
            })
          })
        }

        return submenuItems
      }

      const categorySubmenu = createCategorySubmenu()

      // Check if the first selected row is a category
      const isSelectedRowCategory = firstSelectedRow?.startsWith('category-')

      const menuItems: any[] = [
        {
          label: 'Rename',
          icon: 'edit',
          command: () => openRenameList(firstSelectedRow),
          disabled: multipleSelected || (isSelectedRowCategory && isUser),
        },
        {
          label: 'Edit category',
          icon: 'settings',
          command: () => {
            const categoryValue = firstSelectedRow.replace('category-', '')
            openEditCategoryDialog(categoryValue)
          },
          hidden: !isSelectedRowCategory || multipleSelected,
          disabled: isUser, // only admins and managers can edit categories
        },
        {
          label: 'Create review',
          icon: 'subscriptions',
          command: () => handleCreateReviewSessionList(selectedList.id),
          disabled: multipleSelected || !allSelectedRowsAreLists,
          hidden: !allSelectedRowsAreLists || isReview || !createReviewSessionList,
        },
        {
          label: 'Category',
          icon: 'sell',
          items: categorySubmenu,
          disabled: !allSelectedRowsAreLists,
          hidden: !allSelectedRowsAreLists || categorySubmenu.length === 0,
        },
        {
          label: 'Details',
          icon: 'info',
          command: () => setListDetailsOpen(true),
          disabled: multipleSelected,
          hidden: !allSelectedRowsAreLists,
          shortcut: 'Double click',
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
      categories,
      setRowSelection,
      openRenameList,
      setListDetailsOpen,
      deleteLists,
      createReviewSessionList,
      setListsCategory,
      createAndAssignCategory,
      openCreateCategoryDialog,
      openEditCategoryDialog,
    ],
  )

  return {
    openContext,
    categoryFormDialog,
    closeCategoryFormDialog,
    handleSaveCategory,
  }
}

export default useListContextMenu
