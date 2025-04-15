import {
  api,
  ConfigureActionApiArg,
  ConfigureActionApiResponse,
  ListAvailableActionsForContextApiArg,
  ListAvailableActionsForContextApiResponse,
} from '@/api/rest/actions'
import { FetchBaseQueryError } from '@reduxjs/toolkit/query'

const actionsApi = api.enhanceEndpoints({
  endpoints: {
    executeAction: {},
  },
})

const injectedActionsApi = actionsApi.injectEndpoints({
  endpoints: (build) => ({
    getActionsFromContext: build.query<
      ListAvailableActionsForContextApiResponse,
      ListAvailableActionsForContextApiArg
    >({
      queryFn: async (args, { dispatch }) => {
        // get the data from the rest api
        const res = await dispatch(api.endpoints.listAvailableActionsForContext.initiate(args))

        if (res.error) {
          return { error: res.error as FetchBaseQueryError }
        }

        return { data: res.data }
      },
      providesTags: (result, _error, args) => {
        const baseTags = [{ type: 'actions', id: 'LIST' }]
        const argsTags = args.actionContext.entityIds.map((id) => ({ type: 'actions', id }))
        const actionTags =
          result?.actions?.map((action) => ({ type: 'actions', id: action.identifier })) || []
        return [...baseTags, ...argsTags, ...actionTags]
      },
    }),

    // Action configuration
    
    getActionConfig: build.query<
      ConfigureActionApiResponse,
      ConfigureActionApiArg
    >({
      queryFn: async (args, { dispatch }) => {
        // get the data from the rest api
        const res = await dispatch(api.endpoints.configureAction.initiate(args))
        if (res.error) {
          return { error: res.error as FetchBaseQueryError }
        }
        return { data: res.data }
      },

      providesTags: (result, _error, args) => {
        return [{type: 'actionConfig', id: 'LIST'}]
      },


    }),

    setActionConfig: build.mutation<
      ConfigureActionApiResponse,
      ConfigureActionApiArg
    >({

      queryFn: async (args, { dispatch }) => {
        // get the data from the rest api
        const res = await dispatch(api.endpoints.configureAction.initiate(args))
        if (res.error) {
          return { error: res.error as FetchBaseQueryError }
        }
        return { data: res.data }
      },

      invalidatesTags: (result, _error, args) => ([{type:"actionConfig", id: "LIST"}]),

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
