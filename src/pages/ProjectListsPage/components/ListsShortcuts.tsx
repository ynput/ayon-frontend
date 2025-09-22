import Shortcuts from '@containers/Shortcuts'
import { FC } from 'react'
import { useListsContext } from '../context'

interface ListsShortcutsProps {}

const ListsShortcuts: FC<ListsShortcutsProps> = ({}) => {
  const { openNewList, openRenameList, selectedList } = useListsContext()

  const shortcuts = [
    {
      key: 'n',
      action: () => openNewList(),
    },
    {
      key: 'r',
      action: () => selectedList && openRenameList(selectedList?.id),
    },
  ]

  return (
    // @ts-expect-error - Shortcuts is not typed yet
    <Shortcuts shortcuts={shortcuts} />
  )
}

export default ListsShortcuts
