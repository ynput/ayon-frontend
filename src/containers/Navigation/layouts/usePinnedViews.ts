import { useCallback, useMemo } from 'react'
import { useListViewsQuery } from '@shared/api'
import type { PinnableView, ViewPins } from '@shared/containers/Views'
import { useUserLayout } from './useUserLayout'
import {
  getPins,
  movePinPast,
  renamePin,
  repointPin,
  togglePin,
  visiblePins,
  withPins,
} from './pins'
import { PINNED_PAGES, type PinnedView } from './types'

const VIEW_TYPES = Object.keys(PINNED_PAGES)

/**
 * The saved views pinned as tabs in a project, and the changes to them. Pins are kept in the
 * user's own layout. Every view type is listed once per project: the same queries the pages use,
 * so they come from the cache.
 */
export const usePinnedViews = (projectName: string) => {
  const { enabled, layout, update } = useUserLayout()
  const pins = getPins(layout)

  const has = (viewType: string) => pins.some((pin) => pin.viewType === viewType)
  const overview = useListViewsQuery(
    { viewType: 'overview', projectName },
    { skip: !enabled || !has('overview') },
  )
  const versions = useListViewsQuery(
    { viewType: 'versions', projectName },
    { skip: !enabled || !has('versions') },
  )
  const lists = useListViewsQuery(
    { viewType: 'lists', projectName },
    { skip: !enabled || !has('lists') },
  )

  const visible = useMemo(
    () =>
      enabled
        ? visiblePins(
            pins,
            {
              overview: overview.currentData,
              versions: versions.currentData,
              lists: lists.currentData,
            },
            projectName,
          )
        : [],
    [enabled, pins, overview.currentData, versions.currentData, lists.currentData, projectName],
  )

  const change = useCallback(
    (next: (pins: PinnedView[]) => PinnedView[]) =>
      update((current) => withPins(current, next(getPins(current)))),
    [update],
  )

  const viewPins: ViewPins | null = useMemo(
    () =>
      enabled
        ? {
            viewTypes: VIEW_TYPES,
            isPinned: (viewId: string) => pins.some((pin) => pin.id === viewId),
            togglePin: (view: PinnableView) => change((all) => togglePin(all, view, projectName)),
          }
        : null,
    [enabled, pins, change, projectName],
  )

  return {
    enabled,
    visible,
    /** for the views menu's pin buttons */
    viewPins,
    rename: (id: string, label: string) => change((all) => renamePin(all, id, label)),
    /** moves a tab past the shown tab next to it */
    move: (id: string, delta: -1 | 1) => {
      const index = visible.findIndex((item) => item.pin.id === id)
      const other = visible[index + delta]?.pin.id
      return other ? change((all) => movePinPast(all, id, other, delta > 0)) : Promise.resolve()
    },
    unpin: (id: string) => change((all) => all.filter((pin) => pin.id !== id)),
    repoint: (id: string, view: PinnedView) => change((all) => repointPin(all, id, view)),
  }
}
