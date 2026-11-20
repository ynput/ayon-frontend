import { useMemo } from 'react'
import { addonSettingsApi } from '@queries/addonSettings'
import {
  settingsHistoryApi,
  SettingsChange,
  SettingsChangePayload,
  SettingsHistory,
} from '@queries/settingsHistory/getSettingsHistory'
import {
  diffOverrides,
  getLevelOverrides,
  getOverridesRefAt,
  LANE_COLORS,
  OverrideDiff,
  withMissing,
  withSameValues,
} from './settingsHistoryHelpers'
import { useQueryEach } from './useQueryEach'

export type HistoryAddon = { name: string; version: string; variant: string; title?: string }

export type HistoryLane = {
  addonName: string
  title: string
  color: string
  currentVersion: string
  /** ascending */
  changes: SettingsChange[]
  /** older changes were not loaded */
  truncated: boolean
}

export type AddonComparison = {
  lane: HistoryLane
  /** version whose overrides were in use at the compared time */
  thenVersion: string | null
  /** `none`: nothing was saved before or after, there is nothing to compare with */
  status: 'loading' | 'ready' | 'error' | 'none'
  diffs: OverrideDiff[]
  /** changes saved after the compared time */
  changesSince: SettingsChange[]
}

export type SettingsComparison = {
  at: number
  addons: AddonComparison[]
}

type Props = {
  addons: HistoryAddon[]
  projectName?: string | null
  /** epoch ms, null when not comparing */
  compareAt: number | null
  skip?: boolean
}

export const useSettingsHistory = ({ addons, projectName, compareAt, skip }: Props) => {
  const scope = projectName || null
  const comparing = compareAt !== null && !skip

  const historyArgs = useMemo(
    () =>
      skip
        ? []
        : addons.map((addon) => ({
            addonName: addon.name,
            variant: addon.variant,
            projectName: scope,
          })),
    [addons, scope, skip],
  )
  const histories = useQueryEach<(typeof historyArgs)[number], SettingsHistory>(
    settingsHistoryApi.endpoints.getSettingsHistory,
    historyArgs,
  )

  const lanes = useMemo<HistoryLane[]>(
    () =>
      addons.map((addon, i) => ({
        addonName: addon.name,
        title: addon.title || addon.name,
        color: LANE_COLORS[i % LANE_COLORS.length],
        currentVersion: addon.version,
        changes: histories[i]?.data?.changes ?? [],
        truncated: !!histories[i]?.data?.truncated,
      })),
    [addons, histories],
  )
  const isLoading = histories.some((history) => !history.isSuccess && !history.isError)

  // "now" is what the form shows: the same queries (and cache entries) as AddonSettingsPanel
  const settingsArgs = useMemo(
    () =>
      comparing
        ? addons.map((addon) => ({
            addonName: addon.name,
            addonVersion: addon.version,
            variant: addon.variant,
            projectName: scope,
            siteId: null,
          }))
        : [],
    [addons, scope, comparing],
  )
  const settings = useQueryEach<(typeof settingsArgs)[number], Record<string, unknown>>(
    addonSettingsApi.endpoints.getAddonSettings,
    settingsArgs,
  )
  const listings = useQueryEach<(typeof settingsArgs)[number], Record<string, any>>(
    addonSettingsApi.endpoints.getAddonSettingsOverrides,
    settingsArgs,
  )

  // "then" is read from the event of the last save before the compared time
  const thenRefs = useMemo(
    () =>
      compareAt === null || skip
        ? []
        : lanes.map((lane) => getOverridesRefAt(lane.changes, compareAt)),
    [lanes, compareAt, skip],
  )
  const payloadArgs = useMemo(
    () =>
      [...new Set(thenRefs.flatMap((ref) => (ref ? [ref.changeId] : [])))]
        .sort()
        .map((id) => ({ id })),
    [thenRefs],
  )
  const payloads = useQueryEach<{ id: string }, SettingsChangePayload | null>(
    settingsHistoryApi.endpoints.getSettingsChangePayload,
    payloadArgs,
  )

  const comparison = useMemo<SettingsComparison | null>(() => {
    if (compareAt === null || skip) return null
    const payloadById = new Map(payloadArgs.map((arg, i) => [arg.id, payloads[i]]))
    const level = scope ? 'project' : 'studio'
    return {
      at: compareAt,
      addons: lanes.map((lane, i) => {
        const ref = thenRefs[i]
        const changesSince = lane.changes.filter((change) => change.createdAt > compareAt)
        const base = { lane, thenVersion: ref?.version ?? null, changesSince, diffs: [] }
        if (!ref) return { ...base, status: 'none' }
        const payload = payloadById.get(ref.changeId)
        if (
          payload?.isError ||
          (payload?.isSuccess && !payload.data) ||
          settings[i]?.isError ||
          listings[i]?.isError
        ) {
          return { ...base, status: 'error' }
        }
        const then = payload?.data?.[ref.side]
        const nowSettings = settings[i]?.data
        const listing = listings[i]?.data
        if (!then || !nowSettings || !listing) return { ...base, status: 'loading' }
        const now = getLevelOverrides(nowSettings, listing, level)
        return {
          ...base,
          status: 'ready',
          diffs: withMissing(withSameValues(diffOverrides(then, now), nowSettings), nowSettings),
        }
      }),
    }
  }, [skip, compareAt, lanes, thenRefs, payloadArgs, payloads, settings, listings, scope])

  return { lanes, comparison, isLoading }
}
