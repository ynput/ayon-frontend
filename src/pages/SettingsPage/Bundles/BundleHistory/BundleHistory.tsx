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
  getBundleLane,
  getSources,
  ListedBundle,
} from './bundleHistoryHelpers'
import { BundleChangeList, BundleChangeSummary } from './BundleChangePopover'

/** events whose payloads one request loads, a new event only reloads the last batch */
const PAYLOAD_BATCH = 50

const valueOf = () => ''

type Props = {
  bundles: ListedBundle[]
  selected: ListedBundle[]
  onSelect: (names: string[]) => void
}

/** The history of what the selected bundles are: production, staging or a dev bundle */
export const BundleHistory: FC<Props> = ({ bundles, selected, onSelect }) => {
  const { data, isLoading } = useGetBundleHistoryQuery()
  const shown = useMemo(() => getSources(selected), [selected])

  // the addons of a dev bundle after each of its events, to tell which versions changed
  const payloadArgs = useMemo(
    () => chunk(getAddonEventIds(data, shown), PAYLOAD_BATCH).map((ids) => ({ ids })),
    [data, shown],
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

  const lanes = useMemo(() => [getBundleLane(data, shown, addons)], [data, shown, addons])
  const canOpen = (change: BundleChange) => bundles.some((b) => b.name === change.bundleName)

  return (
    <SettingsTimeline
      lanes={lanes}
      valueOf={valueOf}
      renderChange={(_lane, change) => (
        <BundleChangeSummary change={change} canOpen={canOpen(change)} />
      )}
      renderChanges={(lane, changes, pick) => (
        <BundleChangeList lane={lane} changes={changes} onPick={pick} />
      )}
      onPick={(_lane, change) => {
        if (canOpen(change)) onSelect([change.bundleName])
      }}
      isLoading={isLoading || isLoadingPayloads}
      storageKey="bundles-history-collapsed"
      collapsedByDefault
      label="Bundle history: which bundle was production or staging when, or the addon changes of a dev bundle, for the selected bundles. Plus and minus zoom, click a change to open its bundle."
    />
  )
}
