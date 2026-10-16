import { useCallback } from 'react'
import { usePowerpack } from '@shared/context'
import type { EntityList } from '@shared/api'
import { useListsContext } from '../context'
import { useListItemsDataContext } from '../context/list-items-data'
import { useListValuesContext } from '../context/list-values'
import { isTooBigToCompare } from '../listValues/compareLimit'

// Compare two lists from the lists sidebar: shows the first and compares it with the second.
// Without the powerpack it opens the powerpack dialog.
export const useCompareLists = () => {
  const { isPowerFeature } = useListValuesContext()
  const { compareView } = useListItemsDataContext()
  const { setRowSelection } = useListsContext()
  const { setPowerpackDialog } = usePowerpack()

  // lists of the same entity type; a list too big to compare is still offered, disabled
  const canCompareLists = useCallback(
    (shown?: EntityList, compared?: EntityList): compared is EntityList =>
      !!shown && !!compared && shown.id !== compared.id && shown.entityType === compared.entityType,
    [],
  )

  const { compareWithList } = compareView
  const compareLists = useCallback(
    (shown: EntityList, compared: EntityList) => {
      if (!isPowerFeature) return setPowerpackDialog('listValues')
      if (isTooBigToCompare(compared)) return
      setRowSelection({ [shown.id]: true })
      compareWithList({ id: compared.id, label: compared.label, entityType: compared.entityType })
    },
    [isPowerFeature, setPowerpackDialog, setRowSelection, compareWithList],
  )

  return { canCompareLists, compareLists }
}
