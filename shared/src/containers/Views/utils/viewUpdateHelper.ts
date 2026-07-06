/**
 * Shared helper for updating view settings with optimistic local state management.
 *
 * Sequential updateViewSettings calls in the same event tick MUST chain correctly:
 * the second call has to see the first call's changes. Closure-captured
 * `viewSettings` does not refresh between sync calls (no re-render yet), so we
 * read the latest settings from the RTK Query cache at call time instead.
 * RTK's updateView mutation performs an optimistic cache write in
 * `onQueryStarted`, so the cache is already up-to-date by the time the next
 * call reads it.
 */

import {
  EntityIdResponse,
  useCreateViewMutation,
  useUpdateViewMutation,
  viewsQueries,
} from '@shared/api'
import { generateWorkingView } from './generateWorkingView'
import { toast } from 'react-toastify'
import { useCallback } from 'react'
import { useStore } from 'react-redux'
import { useViewsContext, ViewsContextValue } from '../context/ViewsContext'

interface UpdateOptions {
  successMessage?: string
  errorMessage?: string
}

// Module-level flag shared across every useViewUpdateHelper instance. Set true
// when a mutation has been dispatched in the current tick (RTK cache is now
// optimistically fresh); reset on the next microtask. Must be module-level so
// that two different hook instances (e.g. ProjectOverviewDataProvider +
// ProjectOverviewContext) coordinate correctly when writes flow through one
// and subsequent reads come from the other in the same event tick.
let cacheDirtyThisTick = false
const markCacheDirty = () => {
  if (cacheDirtyThisTick) return
  cacheDirtyThisTick = true
  queueMicrotask(() => {
    cacheDirtyThisTick = false
  })
}

export type UpdateViewSettingsFn = (
  updatedSettings: any,
  localStateSetter: (value: any) => void,
  newLocalValue: any,
  options: UpdateOptions,
) => Promise<void>

export interface LatestSettingsResult {
  settings?: any
  workingViewId?: string
}

export const updateViewSettings = async (
  updatedSettings: any,
  localStateSetter: (value: any) => void,
  newLocalValue: any,
  options: UpdateOptions = {},
  viewContext: ViewsContextValue,
  onApplyViewChanges: (arg: any, viewId?: string) => Promise<EntityIdResponse | void>,
  // Reads latest effective settings from RTK Query cache at call time. Required to
  // prevent stale-closure races when two updates fire in the same tick.
  getLatest: () => LatestSettingsResult,
  // Invoked synchronously right after the mutation is dispatched. The caller
  // uses this to flip a "cache is fresh this tick" flag so subsequent sync
  // calls in the same tick read the just-updated cache instead of stale state.
  markCacheDirty: () => void,
): Promise<void> => {
  const {
    viewSettings,
    viewType,
    projectName,
    selectedView,
    setSelectedView,
    workingView,
    onSettingsChanged,
  } = viewContext

  if (!viewType) throw new Error('No view type provided for updating view settings')

  const previousSelectedViewId = selectedView?.id
  const wasWorking = selectedView?.working

  try {
    // Immediately update local state for fast UI response
    localStateSetter(newLocalValue)

    // Read latest settings from RTK cache (includes prior same-tick optimistic writes).
    // Fallback to closure-captured value if cache has nothing (first render, etc.).
    const { settings: latestSettingsFromCache, workingViewId: latestWorkingViewIdFromCache } =
      getLatest()
    const latestSettings = latestSettingsFromCache ?? viewSettings

    // If we have no settings baseline at all (neither from cache nor from context),
    // abort to prevent writing a partial payload that would overwrite saved settings.
    // This is a defence-in-depth guard; in normal flow isLoadingViews prevents callers
    // from triggering updates before data is available.
    if (latestSettings === undefined) {
      console.warn(
        'updateViewSettings: no settings baseline available, aborting to prevent data loss.',
      )
      return
    }

    // Create settings with updates
    const newSettings = { ...latestSettings, ...updatedSettings }

    // always update the working view no matter what
    const newWorkingView = generateWorkingView(newSettings)

    // Ensure the payload uses the consistent ID if we already have a working view
    const viewId = latestWorkingViewIdFromCache ?? workingView?.id
    if (viewId) {
      newWorkingView.id = viewId
    }
    const newWorkingViewId = newWorkingView.id

    // Make API call in background
    // only include the fields that are updating (just settings)
    const payload = viewId ? { settings: newSettings } : newWorkingView

    const promise = onApplyViewChanges(
      {
        payload,
        viewType: viewType,
        projectName: projectName,
      },
      viewId,
    )

    // Mutation dispatch above ran onQueryStarted synchronously → RTK cache now
    // reflects `newSettings`. Signal this so any subsequent sync call in the
    // same tick reads the fresh cache instead of the stale closure baseline.
    markCacheDirty()

    // if not already on the working view: set that the settings have been changed to show the little blue save button and switch to the working view
    // Note: selectedView?.id is always a real UUID from the server, never the WORKING_VIEW_ID sentinel.
    if (!wasWorking || selectedView?.id !== viewId) {
      if (selectedView) {
        onSettingsChanged(true)
      }
      setSelectedView(newWorkingViewId as string)
    }

    await promise

    // Clear local state after successful API call - the server data will take over
    localStateSetter(null)

    if (options.successMessage) {
      toast.success(options.successMessage)
    }
  } catch (error) {
    // Revert local state on error
    localStateSetter(null)

    if (previousSelectedViewId) {
      setSelectedView(previousSelectedViewId)
    }

    if (selectedView && !wasWorking) {
      onSettingsChanged(false)
    }

    console.error(error)
    const errorMsg = options.errorMessage || `Failed to update view settings: ${error}`
    toast.error(errorMsg)
  }
}

export const useViewUpdateHelper = () => {
  const [createView] = useCreateViewMutation()
  const [updateView] = useUpdateViewMutation()

  const viewContext = useViewsContext()
  const store = useStore()

  const onApplyViewChanges = useCallback(
    async (arg: any, viewId?: string) => {
      if (viewId) {
        // Filter the payload to only include valid patch fields
        // and ideally only include fields that are actually being updated.
        // Expecting the caller to provide only the fields they want to update in the payload.
        const patchPayload: any = {}
        const patchFields = ['label', 'owner', 'settings']
        patchFields.forEach((key) => {
          if (arg.payload[key] !== undefined) {
            patchPayload[key] = arg.payload[key]
          }
        })

        return await updateView({
          viewType: arg.viewType,
          projectName: arg.projectName,
          viewId,
          payload: patchPayload,
        }).unwrap()
      } else {
        return await createView(arg).unwrap()
      }
    },
    [createView, updateView],
  )

  // Returns cached settings when a same-tick prior write has refreshed the
  // cache. Otherwise returns undefined and the caller falls back to the
  // closure-captured viewSettings (correct baseline for the first write in a
  // tick, including the named-view → working-view fork).
  const getLatest = useCallback((): LatestSettingsResult => {
    const { viewType, projectName, selectedView, workingView } = viewContext
    if (!viewType) return {}

    const state = store.getState() as any

    // 1. Get the working view from the store — most authoritative after optimistic writes.
    const workingViewEntry = viewsQueries.endpoints.getWorkingView.select({
      viewType,
      projectName,
    })(state)
    const storeWorkingViewId = workingViewEntry?.data?.id
    // Prefer the store's working view ID over the potentially stale context closure value.
    const resolvedWorkingViewId = storeWorkingViewId || workingView?.id

    // 2. Determine the currently targeted view ID.
    // Use the store's getDefaultView cache (updated optimistically by setSelectedView) so that
    // an in-flight selection change is visible before React re-renders the context.
    const defaultViewEntry = viewsQueries.endpoints.getDefaultView.select({
      viewType,
      projectName,
    })(state)
    const targetViewId = defaultViewEntry?.data?.id || selectedView?.id

    // 3. Determine if the working view is active.
    // IMPORTANT: use !!resolvedWorkingViewId to avoid the undefined === undefined false-positive
    // that would occur on a new project before any working view exists.
    // Note: WORKING_VIEW_ID ('_working_') is a UI-only sentinel; it never appears in
    // server-side cache IDs, so there is no point checking for it here.
    const isWorkingViewActive =
      (!!resolvedWorkingViewId && targetViewId === resolvedWorkingViewId) || cacheDirtyThisTick

    // 4. If the working view is active, use its cache as the baseline to prevent stale merges.
    if (isWorkingViewActive && workingViewEntry?.data?.settings) {
      return {
        settings: workingViewEntry.data.settings,
        workingViewId: resolvedWorkingViewId,
      }
    }

    // 5. For named views: use the defaultView cache settings as the baseline.
    // This is populated by the initial useGetDefaultViewQuery fetch and is more reliable
    // than the getView endpoint cache (which is only fetched on-demand when editing).
    if (defaultViewEntry?.data?.settings) {
      return {
        settings: defaultViewEntry.data.settings,
        workingViewId: resolvedWorkingViewId,
      }
    }

    return { workingViewId: resolvedWorkingViewId }
  }, [store, viewContext])

  const updateViewSettingsHandler = useCallback<UpdateViewSettingsFn>(
    async (...args) =>
      await updateViewSettings(...args, viewContext, onApplyViewChanges, getLatest, markCacheDirty),
    [viewContext, onApplyViewChanges, getLatest],
  )

  return {
    updateViewSettings: updateViewSettingsHandler,
    onCreateView: onApplyViewChanges,
    getLatestSettings: getLatest,
    markCacheDirty,
  }
}
