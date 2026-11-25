import { useCallback, useMemo } from 'react'
import { toast } from 'react-toastify'
import { getRequestErrorString } from '@shared/util'
import { useListViewsQuery } from '@shared/api'
import type { PinnableView, ViewPins } from '@shared/containers/Views'
import { useUserLayout } from './useUserLayout'
import {
  getPins,
  movePinPast,
  renamePin,
  repointPin,
  samePagePins,
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

  // one list per view type in PINNED_PAGES (hooks can't loop): a type added there needs its list here
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
  const reviews = useListViewsQuery(
    { viewType: 'reviews', projectName },
    { skip: !enabled || !has('reviews') },
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
              reviews: reviews.currentData,
            },
            projectName,
          )
        : [],
    [
      enabled,
      pins,
      overview.currentData,
      versions.currentData,
      lists.currentData,
      reviews.currentData,
      projectName,
    ],
  )

  const change = useCallback(
    (next: (pins: PinnedView[]) => PinnedView[]) =>
      update((current) => withPins(current, next(getPins(current)))),
    [update],
  )

  // what the user does from a button or menu: a failure says so instead of failing silently
  const report = (action: Promise<unknown>) =>
    action.catch((error) => {
      toast.error(`Couldn't change your pinned tabs: ${getRequestErrorString(error)}`)
    })
  // the same, still failing for a caller that keeps its form open to try again
  const reportAndFail = (action: Promise<unknown>) =>
    action.catch((error) => {
      toast.error(`Couldn't change your pinned tabs: ${getRequestErrorString(error)}`)
      throw error
    })

  const viewPins: ViewPins | null = useMemo(
    () =>
      enabled
        ? {
            viewTypes: VIEW_TYPES,
            isPinned: (viewId: string) => pins.some((pin) => pin.id === viewId),
            togglePin: (view: PinnableView) =>
              void report(change((all) => togglePin(all, view, projectName))),
          }
        : null,
    [enabled, pins, change, projectName],
  )

  return {
    enabled,
    visible,
    /** for the views menu's pin buttons */
    viewPins,
    // the rename dialog stays open when it fails
    rename: (id: string, label: string) =>
      reportAndFail(change((all) => renamePin(all, id, label))),
    /** moves a tab past the next shown pin of the same page */
    move: (id: string, delta: -1 | 1) => {
      const siblings = samePagePins(visible, id)
      const index = siblings.findIndex((item) => item.pin.id === id)
      const other = siblings[index + delta]?.pin.id
      return other
        ? report(change((all) => movePinPast(all, id, other, delta > 0)))
        : Promise.resolve()
    },
    unpin: (id: string) => report(change((all) => all.filter((pin) => pin.id !== id))),
    // Save as new reports its own failure
    repoint: (id: string, view: PinnedView) => change((all) => repointPin(all, id, view)),
  }
}
