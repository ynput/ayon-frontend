import { FC, useMemo } from 'react'
import { chunk } from 'lodash'
import {
  BundleAddons,
  bundleHistoryApi,
  useGetBundleHistoryQuery,
} from '@queries/bundleHistory/getBundleHistory'
import { SettingsTimeline } from '@containers/AddonSettings/SettingsHistory/SettingsTimeline'
import { useQueryEach } from '@containers/AddonSettings/SettingsHistory/useQueryEach'
import {
  BundleChange,
  getAddonEventIds,
  getBundleLanes,
  ListedBundle,
} from './bundleHistoryHelpers'
import { BundleChangeList, BundleChangeSummary } from './BundleChangePopover'

/** events whose payloads one request loads, a new event only reloads the last batch */
const PAYLOAD_BATCH = 50

const valueOf = (change: BundleChange) => change.value

type Props = {
  bundles: ListedBundle[]
  selected: string[]
  onSelect: (names: string[]) => void
}

/** Which bundle was production and staging when, and the addon changes of the selected bundles */
export const BundleHistory: FC<Props> = ({ bundles, selected, onSelect }) => {
  const { data, isLoading } = useGetBundleHistoryQuery()

  // the addons of a bundle after each of its events, to tell which versions changed
  const payloadArgs = useMemo(
    () => chunk(getAddonEventIds(data, selected), PAYLOAD_BATCH).map((ids) => ({ ids })),
    [data, selected],
  )
  const payloads = useQueryEach<{ ids: string[] }, Record<string, BundleAddons | null>>(
    bundleHistoryApi.endpoints.getBundleEventsAddons,
    payloadArgs,
  )
  const addons = useMemo(
    () =>
      Object.assign(
        {},
        ...payloads.map((payload, i) =>
          payload.isError
            ? Object.fromEntries(payloadArgs[i].ids.map((id) => [id, null]))
            : payload.data,
        ),
      ) as Record<string, BundleAddons | null>,
    [payloads, payloadArgs],
  )
  const isLoadingPayloads = payloads.some((payload) => !payload.isSuccess && !payload.isError)

  const lanes = useMemo(
    () => getBundleLanes(data, bundles, selected, addons),
    [data, bundles, selected, addons],
  )
  const canOpen = (change: BundleChange) => bundles.some((b) => b.name === change.bundleName)

  if (!lanes.length) return null
  return (
    <SettingsTimeline
      lanes={lanes}
      valueOf={valueOf}
      renderChange={(lane, change) => (
        <BundleChangeSummary lane={lane} change={change} canOpen={canOpen(change)} />
      )}
      renderChanges={(lane, changes, pick) => (
        <BundleChangeList lane={lane} changes={changes} onPick={pick} />
      )}
      onPick={(_lane, change) => {
        if (canOpen(change)) onSelect([change.bundleName])
      }}
      isLoading={isLoading || isLoadingPayloads}
      storageKey="bundles-history-collapsed"
      label="Bundle history: which bundle was production or staging when, and the addon changes of the selected bundles. Plus and minus zoom, click a change to open its bundle."
    />
  )
}
