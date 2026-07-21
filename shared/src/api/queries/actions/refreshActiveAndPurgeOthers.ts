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

type RefreshOptions = {
  refreshOtherActiveQueries?: boolean
}

const getOtherActiveQueryArgs = (
  state: ApiState | undefined,
  endpointName: string,
  currentArgs: unknown,
) => {
  const serialize = (args: unknown) => JSON.stringify(args ?? {})
  const currentArgsSerialized = serialize(currentArgs)

  return Object.values(state?.queries || {})
    .filter(
      (querySubstate) =>
        querySubstate?.endpointName === endpointName &&
        serialize(querySubstate.originalArgs) !== currentArgsSerialized,
    )
    .map((querySubstate) => querySubstate?.originalArgs)
}

/**
 * Refreshes the current query without dropping its cached data, then refreshes
 * active permutations and removes inactive ones so they cannot become stale.
 */
export const refreshActiveAndPurgeOthers =
  (
    endpointName: string,
    currentArgs: unknown,
    { refreshOtherActiveQueries = true }: RefreshOptions = {},
  ) =>
  (dispatch: ThunkDispatch<any, any, UnknownAction>, getState: () => any) => {
    const queryApi = api as any
    const state = getState()[api.reducerPath] as ApiState | undefined

    try {
      const primaryPromise = dispatch(
        queryApi.endpoints[endpointName].initiate(currentArgs, {
          forceRefetch: true,
          subscribe: false,
        }),
      )
      if (refreshOtherActiveQueries) {
        for (const args of getOtherActiveQueryArgs(state, endpointName, currentArgs)) {
          dispatch(
            queryApi.endpoints[endpointName].initiate(args, {
              forceRefetch: true,
              subscribe: false,
            }),
          )
        }
      }

      return primaryPromise
    } catch (error) {
      console.error('Error refreshing active queries:', endpointName, error)
      return Promise.reject(error)
    }
  }

export const refreshOtherActiveQueries =
  (endpointName: string, currentArgs: unknown) =>
  (dispatch: ThunkDispatch<any, any, UnknownAction>, getState: () => any) => {
    const queryApi = api as any
    const state = getState()[api.reducerPath] as ApiState | undefined

    return Promise.all(
      getOtherActiveQueryArgs(state, endpointName, currentArgs).map((args) =>
        dispatch(
          queryApi.endpoints[endpointName].initiate(args, { forceRefetch: true, subscribe: false }),
        ).unwrap(),
      ),
    )
  }
