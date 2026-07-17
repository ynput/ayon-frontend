import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import { api } from '@shared/api/base'

type QuerySubstate = {
  endpointName?: string
  originalArgs?: unknown
}

type ApiState = {
  queries?: Record<string, QuerySubstate | undefined>
  subscriptions?: Record<string, Record<string, unknown> | undefined>
}

/**
 * Refreshes the current query without dropping its cached data, then refreshes
 * active permutations and removes inactive ones so they cannot become stale.
 */
export const refreshActiveAndPurgeOthers =
  (endpointName: string, currentArgs: unknown) =>
  (dispatch: ThunkDispatch<any, any, UnknownAction>, getState: () => any) => {
    const queryApi = api as any
    const state = getState()[api.reducerPath] as ApiState | undefined
    const queries = state?.queries || {}

    const primaryPromise = dispatch(
      queryApi.endpoints[endpointName].initiate(currentArgs, { forceRefetch: true }),
    )

    const serialize = (args: unknown) => JSON.stringify(args ?? {})
    const currentArgsSerialized = serialize(currentArgs)

    Object.entries(queries).forEach(([, querySubstate]) => {
      if (!querySubstate || querySubstate.endpointName !== endpointName) return
      if (serialize(querySubstate.originalArgs) === currentArgsSerialized) return

      dispatch(
        queryApi.endpoints[endpointName].initiate(querySubstate.originalArgs, {
          forceRefetch: true,
        }),
      )
    })

    return primaryPromise
  }
