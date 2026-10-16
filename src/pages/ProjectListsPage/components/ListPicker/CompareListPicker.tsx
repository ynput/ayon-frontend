import { FC, useCallback } from 'react'
import { useListsDataContext } from '@pages/ProjectListsPage/context/lists-data'
import type { ListPickerProps, ListRef } from '../../listValues/types'
import { COMPARE_TOO_MANY_ITEMS, isTooBigToCompare } from '../../listValues/compareLimit'
import { ListPicker } from './ListPicker'

// The list picker for the compare dialog: lists too big to compare can't be picked
export const CompareListPicker: FC<ListPickerProps> = ({ isDisabled, ...props }) => {
  const { listsMap } = useListsDataContext()
  const isDisabledForCompare = useCallback(
    (list: ListRef) =>
      isDisabled(list) ??
      (isTooBigToCompare(listsMap.get(list.id)) ? COMPARE_TOO_MANY_ITEMS : undefined),
    [isDisabled, listsMap],
  )

  return <ListPicker isDisabled={isDisabledForCompare} {...props} />
}
