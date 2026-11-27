import { useMemo } from 'react'
import { toast } from 'react-toastify'
import { getRequestErrorString } from '@shared/util'
import { useListViewsQuery } from '@shared/api'
import type { ViewPins } from '@shared/containers/Views'
import { useNavArrangement, type TabRow } from '../NavArrangement'
import { visiblePins } from './pins'
import { PINNED_PAGES, type PinnedView } from './types'

const VIEW_TYPES = Object.keys(PINNED_PAGES)

/**
 * The saved views pinned as tabs in a project (the arrangement's: `NavArrangement`), the ones the
 * user can read, and changing them. Every view type is listed once per project: the same queries
 * the pages use, so they come from the cache.
 */
export const usePinnedViews = (projectName: string) => {
  const { pins } = useNavArrangement()
  const enabled = !!pins
  const list = useMemo(() => pins?.list ?? [], [pins?.list])

  // one list per view type in PINNED_PAGES (hooks can't loop): a type added there needs its list here
  const has = (viewType: string) => list.some((pin) => pin.viewType === viewType)
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
            list,
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
      list,
      overview.currentData,
      versions.currentData,
      lists.currentData,
      reviews.currentData,
      projectName,
    ],
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

  // the pin buttons wait for the arrangement: a pin made before it loads would be made on nothing
  const viewPins: ViewPins | null = useMemo(
    () =>
      pins?.ready
        ? {
            viewTypes: VIEW_TYPES,
            isPinned: (viewId: string) => pins.list.some((pin) => pin.id === viewId),
            togglePin: (view) => void report(pins.toggle(view, projectName)),
          }
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pins, projectName],
  )

  return {
    enabled,
    visible,
    /** for the views menu's pin buttons */
    viewPins,
    // the rename dialog stays open when it fails
    rename: (id: string, label: string) =>
      pins ? reportAndFail(pins.rename(id, label)) : Promise.resolve(),
    /** moves a pinned tab one place within its row, as the user sees it */
    move: (id: string, delta: -1 | 1, row: TabRow) =>
      pins ? report(pins.move(id, delta, row)) : Promise.resolve(),
    unpin: (id: string) => (pins ? report(pins.unpin(id)) : Promise.resolve()),
    // Save as new reports its own failure
    repoint: (id: string, view: PinnedView) =>
      pins ? pins.repoint(id, view) : Promise.resolve(),
  }
}
