import { useCallback, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { format } from 'date-fns'
import { isEqual } from 'lodash'
import { addonSettingsApi } from '@queries/addonSettings'
import {
  getRevertEntries,
  OverrideDiff,
  stageEntries,
  StagedSettings,
} from './settingsHistoryHelpers'
import type { HistoryAddon, SettingsComparison } from './useSettingsHistory'

// the studio settings of a variant nothing was saved for are the addon defaults
// (prototype shortcut: the server could return the defaults directly)
const DEFAULTS_VARIANT = '__defaults__'

export type ComparisonMenuItem = {
  label?: string
  icon?: string
  command?: () => void
  separator?: boolean
}

type Props = {
  comparison: SettingsComparison | null
  addons: HistoryAddon[]
  projectName?: string | null
  /** key of an addon's unsaved settings in the form state */
  getKey: (addon: HistoryAddon) => string
  getStaged: (key: string) => StagedSettings
  /** must merge per key, several addons can be staged before the next render */
  setStaged: (key: string, staged: StagedSettings) => void
  onUndo: (key: string, path: string[]) => void
  onFocus: (addonName: string, path: string[]) => void
}

/**
 * Reverting settings to the compared time, as unsaved changes: saving them is up to the user.
 * The returned functions are stable and read the latest props, the settings form memoizes the
 * context its context menu gets them from.
 */
export const useComparisonActions = (props: Props) => {
  const dispatch = useDispatch()
  const latest = useRef(props)
  latest.current = props

  const getAddon = (addonName: string) =>
    latest.current.addons.find((addon) => addon.name === addonName)

  const isStaged = useCallback((addonName: string, path: string[]) => {
    const addon = getAddon(addonName)
    if (!addon) return false
    const { getKey, getStaged } = latest.current
    return getStaged(getKey(addon)).changed.some((changed) => isEqual(changed, path))
  }, [])

  /** Stages the values of then, returns how many settings could not be reverted */
  const revert = useCallback(
    async (addonName: string, diffs: OverrideDiff[]): Promise<number> => {
      const addon = getAddon(addonName)
      if (!addon || !diffs.length) return 0
      let inherited: unknown
      if (diffs.some((diff) => diff.before === undefined)) {
        const { projectName } = latest.current
        const request = dispatch(
          addonSettingsApi.endpoints.getAddonSettings.initiate({
            addonName,
            addonVersion: addon.version,
            variant: projectName ? addon.variant : DEFAULTS_VARIANT,
            projectName: null,
            siteId: null,
          }) as any,
        ) as any
        try {
          inherited = await request.unwrap()
        } catch {
          toast.error(`Could not load the ${projectName ? 'studio' : 'default'} settings`)
          return diffs.length
        } finally {
          request.unsubscribe()
        }
      }
      const { getKey, getStaged, setStaged } = latest.current
      const key = getKey(addon)
      const state = getStaged(key)
      if (!state.data) return diffs.length
      const entries = getRevertEntries(diffs, inherited)
      const { skipped, ...next } = stageEntries(state, entries)
      if (next.changed.length) setStaged(key, next)
      return diffs.length - entries.length + skipped.length
    },
    [dispatch],
  )

  const warnSkipped = (skipped: number) =>
    skipped &&
    toast.warn(
      `${skipped} setting${skipped === 1 ? '' : 's'} could not be reverted, ` +
        `${skipped === 1 ? 'it does' : 'they do'} not exist in the current version`,
    )

  const revertAll = useCallback(async () => {
    const { comparison } = latest.current
    if (!comparison) return
    let skipped = 0
    for (const { lane, diffs } of comparison.addons) {
      skipped += await revert(lane.addonName, diffs)
    }
    warnSkipped(skipped)
  }, [revert])

  const undo = useCallback((addonName: string, path: string[]) => {
    const addon = getAddon(addonName)
    if (addon) latest.current.onUndo(latest.current.getKey(addon), path)
  }, [])

  /** Revert or undo for one setting, `withFocus` adds showing it in the editor */
  const getMenuItems = useCallback(
    (addonName: string, diff: OverrideDiff, withFocus = false): ComparisonMenuItem[] => {
      const { comparison, onFocus } = latest.current
      if (!comparison) return []
      const items: ComparisonMenuItem[] = []
      if (withFocus) {
        items.push({
          label: 'Show in editor',
          icon: 'arrow_outward',
          command: () => onFocus(addonName, diff.path),
        })
      }
      items.push(
        isStaged(addonName, diff.path)
          ? { label: 'Undo revert', icon: 'redo', command: () => undo(addonName, diff.path) }
          : {
              label: `Revert to ${format(comparison.at, 'd MMM, HH:mm')}`,
              icon: 'history',
              command: () => revert(addonName, [diff]).then(warnSkipped),
            },
      )
      return items
    },
    [isStaged, revert, undo],
  )

  /** Items for the context menu of a field in the editor: the setting or the list it is in */
  const getFieldMenuItems = useCallback(
    (addonName: string, path: string[]): ComparisonMenuItem[] => {
      const addon = latest.current.comparison?.addons.find((a) => a.lane.addonName === addonName)
      const diff = addon?.diffs.find((d) => d.path.every((key, i) => path[i] === key))
      if (!diff) return []
      return [...getMenuItems(addonName, diff), { separator: true }]
    },
    [getMenuItems],
  )

  return { isStaged, revertAll, getMenuItems, getFieldMenuItems }
}
