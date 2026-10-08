import { FC, useCallback, useEffect } from 'react'
import styled from 'styled-components'
import { ListsDataProvider, useListsDataContext } from '@pages/ProjectListsPage/context/lists-data'
import { ListsProvider, useListsContext } from '@pages/ProjectListsPage/context/lists'
import type { EntityList } from '@shared/api'
import type { ListPickerProps, ListRef } from '../../listValues/types'
import ListsTable from '../ListsTable/ListsTable'

const TableContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  min-height: 0;
  width: 100%;

  /* same as AddToListDialog: muted, not struck through, the reason keeps its space */
  && .disabled {
    .value {
      text-decoration: none;
    }
    .text {
      min-width: 0;
    }
    .badges {
      flex-shrink: 0;
    }
    .badges span {
      white-space: nowrap;
    }
  }
`

const toListRef = (list: EntityList): ListRef => ({
  id: list.id,
  label: list.label,
  entityType: list.entityType,
})

const ListPickerTable: FC<Omit<ListPickerProps, 'isDisabled'>> = ({
  initialSelection,
  onSelect,
  onSubmit,
}) => {
  const { selectedList } = useListsContext()
  const { listsMap, disabledListIds } = useListsDataContext()

  const pickable = (list?: EntityList) => (list && !disabledListIds.has(list.id) ? list : undefined)

  useEffect(() => {
    const list = pickable(selectedList)
    onSelect(list && toListRef(list))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedList?.id, disabledListIds])

  const submit = (list?: EntityList) => {
    const picked = pickable(list)
    if (picked) onSubmit(toListRef(picked))
  }

  return (
    <TableContainer
      // capture: the table's rows stop Enter (it selects the row)
      onKeyDownCapture={(e) => {
        if (e.key === 'Enter' && !(e.target instanceof HTMLInputElement)) submit(selectedList)
      }}
    >
      <ListsTable
        picker
        singleSelect
        scrollToRowId={initialSelection}
        onRowSubmit={(id) => submit(listsMap.get(id))}
      />
    </TableContainer>
  )
}

// The page's lists in a single-select picker, for the powerpack's dialogs (e.g. compare with list)
export const ListPicker: FC<ListPickerProps> = ({ isDisabled, initialSelection, ...props }) => {
  const { isReview } = useListsContext()
  const listDisabled = useCallback((list: EntityList) => isDisabled(toListRef(list)), [isDisabled])

  return (
    <ListsDataProvider
      picker
      isReview={isReview}
      entityListTypes={isReview ? ['review-session'] : ['generic']}
      listDisabled={listDisabled}
    >
      <ListsProvider
        picker
        isReview={isReview}
        initialSelection={initialSelection ? [initialSelection] : undefined}
      >
        <ListPickerTable initialSelection={initialSelection} {...props} />
      </ListsProvider>
    </ListsDataProvider>
  )
}

export default ListPicker
