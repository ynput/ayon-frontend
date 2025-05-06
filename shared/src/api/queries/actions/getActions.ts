import {
  actionsApi,
  ConfigureActionApiArg,
  ConfigureActionApiResponse,
  ListAvailableActionsForContextApiArg,
  ListAvailableActionsForContextApiResponse,
} from '@shared/api/generated'
import { FetchBaseQueryError } from '@reduxjs/toolkit/query'

const enhancedApi = actionsApi.enhanceEndpoints({
  endpoints: {
    executeAction: {},
  },
})

const injectedActionsApi = enhancedApi.injectEndpoints({
  endpoints: (build) => ({
    getActionsFromContext: build.query<
      ListAvailableActionsForContextApiResponse,
      ListAvailableActionsForContextApiArg
    >({
      queryFn: async (args, { dispatch }) => {
        // get the data from the rest actionsApi
        const res = await dispatch(
          actionsApi.endpoints.listAvailableActionsForContext.initiate(args),
        )

        if (res.error) {
          return { error: res.error as FetchBaseQueryError }
        }

        return { data: res.data }
      },
      providesTags: (result, _error, args) => {
        const baseTags = [{ type: 'actions', id: 'LIST' }]
        const argsTags = args.actionContext.entityIds?.map((id) => ({ type: 'actions', id })) || []
        const actionTags =
          result?.actions?.map((action) => ({ type: 'actions', id: action.identifier })) || []
        return [...baseTags, ...argsTags, ...actionTags]
      },
    }),

    // Action configuration

    getActionConfig: build.query<ConfigureActionApiResponse, ConfigureActionApiArg>({
      queryFn: async (args, { dispatch }) => {
        // get the data from the rest actionsApi
        const res = await dispatch(actionsApi.endpoints.configureAction.initiate(args))
        if (res.error) {
          return { error: res.error as FetchBaseQueryError }
        }
        return { data: res.data }
      },

      providesTags: [{ type: 'actionConfig', id: 'LIST' }],
    }),

    setActionConfig: build.mutation<ConfigureActionApiResponse, ConfigureActionApiArg>({
      queryFn: async (args, { dispatch }) => {
        // get the data from the rest actionsApi
        const res = await dispatch(actionsApi.endpoints.configureAction.initiate(args))
        if (res.error) {
          return { error: res.error as FetchBaseQueryError }
        }
        return { data: res.data }
      },
      invalidatesTags: [{ type: 'actionConfig', id: 'LIST' }],
    }),

    // End of endpoints
  }),
})

export const {
  useGetActionsFromContextQuery,
  useExecuteActionMutation,
  useGetActionConfigQuery,
  useSetActionConfigMutation,
} = injectedActionsApi
export { injectedActionsApi as actionsQueries }
