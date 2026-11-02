import { useCallback } from 'react'
import { toast } from 'react-toastify'
import { usePowerpack } from '@shared/context'
import type { EntityList } from '@shared/api'
import { useListsContext } from '../context'
import { useListItemsDataContext } from '../context/list-items-data'
import { useListValuesContext } from '../context/list-values'
import { isTooBigToCompare } from '../listValues/compareLimit'
import { listValuesOutdatedMessage } from '../listValues/listValuesOutdated'

// Compare two lists from the lists sidebar: shows the first and compares it with the second.
// Without the powerpack it opens the powerpack dialog; an outdated powerpack says which version it needs.
export const useCompareLists = () => {
  const { isPowerFeature, outdated } = useListValuesContext()
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
      if (!isPowerFeature) {
        if (outdated) toast.info(listValuesOutdatedMessage(outdated))
        else setPowerpackDialog('listValues')
        return
      }
      if (isTooBigToCompare(compared)) return
      setRowSelection({ [shown.id]: true })
      compareWithList({ id: compared.id, label: compared.label, entityType: compared.entityType })
    },
    [isPowerFeature, outdated, setPowerpackDialog, setRowSelection, compareWithList],
  )

  return { canCompareLists, compareLists }
}
