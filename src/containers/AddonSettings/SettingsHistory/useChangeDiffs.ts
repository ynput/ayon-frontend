import { useMemo } from 'react'
import {
  SettingsChange,
  useGetSettingsChangePayloadQuery,
} from '@queries/settingsHistory/getSettingsHistory'
import { diffOverrides } from './settingsHistoryHelpers'

/**
 * Settings one save changed. The first save of a version starts from nothing, so it is
 * compared to the save before it (`previous`, the version before). `skip` waits with loading.
 */
export const useChangeDiffs = (change: SettingsChange, previous?: SettingsChange, skip = false) => {
  const startsVersion = !!previous && previous.addonVersion !== change.addonVersion
  const { data: payload, isError } = useGetSettingsChangePayloadQuery({ id: change.id }, { skip })
  const { data: previousPayload } = useGetSettingsChangePayloadQuery(
    { id: previous?.id ?? '' },
    { skip: skip || !startsVersion },
  )

  const diffs = useMemo(() => {
    if (!payload) return null
    const before =
      startsVersion && !Object.keys(payload.originalValue).length
        ? previousPayload?.newValue
        : payload.originalValue
    return before ? diffOverrides(before, payload.newValue) : null
  }, [payload, previousPayload, startsVersion])

  return { diffs, startsVersion, isError: isError || payload === null }
}
