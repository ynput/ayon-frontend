import { FC, useCallback } from 'react'
import { useListsContext } from '@pages/ProjectListsPage/context/lists'
import { ListPicker as SharedListPicker } from '@shared/containers/ListPicker'
import type { EntityList } from '@shared/api'
import type { ListPickerProps, ListRef } from '../../listValues/types'

const toListRef = (list: EntityList): ListRef => ({
  id: list.id,
  label: list.label,
  entityType: list.entityType,
})

type Props = ListPickerProps & {
  // core checks that need the picker's list record, e.g. its count
  isListDisabled?: (list: EntityList) => string | undefined
}

// The page's lists in a single-select picker, for the powerpack's dialogs (e.g. compare with list)
export const ListPicker: FC<Props> = ({
  isDisabled,
  isListDisabled,
  initialSelection,
  onSelect,
  onSubmit,
}) => {
  const { isReview } = useListsContext()
  const listDisabled = useCallback(
    (list: EntityList) => isDisabled(toListRef(list)) ?? isListDisabled?.(list),
    [isDisabled, isListDisabled],
  )

  return (
    <SharedListPicker
      entityListTypes={isReview ? ['review-session'] : ['generic']}
      initialSelection={initialSelection ? [initialSelection] : undefined}
      isListDisabled={listDisabled}
      onSelect={([list]) => onSelect(list && toListRef(list))}
      onSubmit={([list]) => onSubmit(toListRef(list))}
    />
  )
}

export default ListPicker
