import api from '@/api'
import {
  ListAvailableActionsForContextApiArg,
  ListAvailableActionsForContextApiResponse,
} from '@/api/rest'
import { FetchBaseQueryError } from '@reduxjs/toolkit/query'

const injectedActionsRest = api.injectEndpoints({
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
  }),
})

export const { useGetActionsFromContextQuery, useExecuteActionMutation } = injectedActionsRest
