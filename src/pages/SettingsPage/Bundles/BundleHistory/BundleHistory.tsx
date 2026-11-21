import { FC, useMemo } from 'react'
import { chunk } from 'lodash'
import styled from 'styled-components'
import { Dropdown, Icon } from '@ynput/ayon-react-components'
import { useLocalStorage } from '@shared/hooks'
import {
  BundleAddons,
  bundleHistoryApi,
  useGetBundleHistoryQuery,
} from '@queries/bundleHistory/getBundleHistory'
import { SettingsTimeline } from '@containers/AddonSettings/SettingsHistory/SettingsTimeline'
import { useQueryEach } from '@containers/AddonSettings/SettingsHistory/useQueryEach'
import {
  BundleChange,
  BundleSource,
  getAddonEventIds,
  getBundleLane,
  getSources,
  ListedBundle,
} from './bundleHistoryHelpers'
import { BundleChangeList, BundleChangeSummary } from './BundleChangePopover'

/** events whose payloads one request loads, a new event only reloads the last batch */
const PAYLOAD_BATCH = 50

const valueOf = () => ''

const Filter = styled(Dropdown)`
  height: 26px;

  .button {
    height: 26px;
    border-radius: var(--border-radius-m);
    background-color: transparent;

    &:hover {
      background-color: var(--md-sys-color-surface-container-hover);
    }
  }
`

const SourceItem = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  white-space: nowrap;

  &.value {
    height: 26px;
    padding: 0 2px 0 8px;
    gap: 4px;
    color: var(--md-sys-color-on-surface);

    .icon {
      font-size: 18px;
    }
  }

  .swatch {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .check {
    font-size: 18px;
  }
`

const Swatch: FC<{ source: BundleSource }> = ({ source }) => (
  <span className="swatch" style={{ backgroundColor: source.color }} />
)

type Props = {
  bundles: ListedBundle[]
  onSelect: (names: string[]) => void
}

/** Which bundle was production and staging when, and the addon changes of the dev bundles */
export const BundleHistory: FC<Props> = ({ bundles, onSelect }) => {
  const { data, isLoading } = useGetBundleHistoryQuery()
  const [shownKeys, setShownKeys] = useLocalStorage<string[]>('bundles-history-shown', [
    'production',
    'staging',
  ])
  const sources = useMemo(() => getSources(bundles), [bundles])
  const shown = useMemo(
    () => sources.filter((source) => shownKeys.includes(source.key)),
    [sources, shownKeys],
  )

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

  const filter = (
    <Filter
      value={shown.map((source) => source.key)}
      options={sources.map((source) => ({ value: source.key, label: source.title }))}
      onChange={(keys) => setShownKeys(keys)}
      multiSelect
      minSelected={1}
      align="right"
      valueTemplate={() => (
        <SourceItem className="value">
          {shown.map((source) => (
            <Swatch key={source.key} source={source} />
          ))}
          <span className="label">{shown.map((source) => source.title).join(', ')}</span>
          <Icon icon="expand_more" />
        </SourceItem>
      )}
      itemTemplate={(option: { value: string; label: string }, _active, isSelected) => {
        const source = sources.find((s) => s.key === option.value)
        return (
          <SourceItem>
            {source && <Swatch source={source} />}
            <span className="label">{option.label}</span>
            {isSelected && <Icon icon="check" className="check" />}
          </SourceItem>
        )
      }}
    />
  )

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
      controls={filter}
      label="Bundle history: which bundle was production or staging when, and the addon changes of dev bundles. Plus and minus zoom, click a change to open its bundle."
    />
  )
}
