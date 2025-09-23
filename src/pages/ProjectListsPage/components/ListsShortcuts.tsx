import Shortcuts from '@containers/Shortcuts'
import { FC } from 'react'
import { useListsContext } from '../context'
import { useAppSelector } from '@state/store'

interface ListsShortcutsProps {}

const ListsShortcuts: FC<ListsShortcutsProps> = ({}) => {
  const { openNewList, openRenameList, rowSelection } = useListsContext()
  const user = useAppSelector((state) => state.user)
  const isUser = !user.data?.isAdmin && !user.data?.isManager

  const shortcuts = [
    {
      key: 'n',
      action: () => openNewList(),
    },
    {
      key: 'r',
      action: () => {
        if (!rowSelection) return
        const firstSelectedRow = Object.keys(rowSelection)[0]
        const isSelectedRowCategory = firstSelectedRow?.startsWith('category-')

        // Don't allow renaming categories if user is not admin/manager
        if (isSelectedRowCategory && isUser) return

        openRenameList(firstSelectedRow)
      },
    },
  ]

  return (
    // @ts-expect-error - Shortcuts is not typed yet
    <Shortcuts shortcuts={shortcuts} />
  )
}

export default ListsShortcuts
