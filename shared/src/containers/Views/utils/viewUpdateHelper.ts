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
  CreateViewApiArg,
  EntityIdResponse,
  useCreateViewMutation,
  useUpdateViewMutation,
  viewsQueries,
} from '@shared/api'
import { generateWorkingView } from './generateWorkingView'
import { toast } from 'react-toastify'
import { useCallback } from 'react'
import { useStore } from 'react-redux'
import { useViewsContext, ViewsContextValue, ViewSettings } from '../context/ViewsContext'

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

export const updateViewSettings = async (
  updatedSettings: any,
  localStateSetter: (value: any) => void,
  newLocalValue: any,
  options: UpdateOptions = {},
  viewContext: ViewsContextValue,
  onApplyViewChanges: (arg: any, viewId?: string) => Promise<EntityIdResponse | void>,
  // Reads latest effective settings from RTK Query cache at call time. Required to
  // prevent stale-closure races when two updates fire in the same tick.
  getLatestSettings: () => ViewSettings | undefined,
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
    const latestSettings = getLatestSettings() ?? viewSettings

    // Create settings with updates
    const newSettings = { ...latestSettings, ...updatedSettings }

    // always update the working view no matter what
    const newWorkingView = generateWorkingView(newSettings)

    // Ensure the payload uses the consistent ID if we already have a working view
    const viewId = workingView?.id
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
    if (!wasWorking) {
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
  const getLatestSettings = useCallback((): ViewSettings | undefined => {
    if (!cacheDirtyThisTick) return undefined
    const { viewType, projectName } = viewContext
    if (!viewType) return undefined
    // RTK selector state is typed against the full RootState; we don't have that
    // type in @shared and the store is project-specific. Cast is safe: the
    // selector only touches the api slice, which exists in every consumer app.
    const entry = viewsQueries.endpoints.getWorkingView.select({ viewType, projectName })(
      store.getState() as any,
    )
    return entry?.data?.settings
  }, [store, viewContext])

  const updateViewSettingsHandler = useCallback<UpdateViewSettingsFn>(
    async (...args) =>
      await updateViewSettings(
        ...args,
        viewContext,
        onApplyViewChanges,
        getLatestSettings,
        markCacheDirty,
      ),
    [viewContext, onApplyViewChanges, getLatestSettings],
  )

  return {
    updateViewSettings: updateViewSettingsHandler,
    onCreateView: onApplyViewChanges,
    getLatestSettings,
    markCacheDirty,
  }
}
