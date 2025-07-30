import { ListViewsApiResponse, viewsApi } from '@shared/api/generated'
import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'

const VIEW_LIST_TAG = { type: 'view', id: 'LIST' }

type GetViewListResult = ListViewsApiResponse['views']

type Definitions = DefinitionsFromApi<typeof viewsApi>
type TagTypes = TagTypesFromApi<typeof viewsApi>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'listViews'> & {
  listViews: OverrideResultType<Definitions['listViews'], GetViewListResult>
}

export const getViewsApi = viewsApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    listViews: {
      transformResponse: (response: ListViewsApiResponse) => response?.views || [],
      providesTags: (result) =>
        result
          ? [VIEW_LIST_TAG, ...result.map((v) => ({ type: 'view', id: v.id }))]
          : [VIEW_LIST_TAG],
      transformErrorResponse: (error: any) => error.data?.detail,
    },
    getPersonalView: {
      providesTags: (result) => [{ type: 'view', id: result?.id }, VIEW_LIST_TAG],
      transformErrorResponse: (error: any) => error.data?.detail,
    },
    getView: {
      providesTags: (result, error, arg) => [{ type: 'view', id: arg.viewId }, VIEW_LIST_TAG],
      transformErrorResponse: (error: any) => error.data?.detail,
    },
  },
})

export const { useListViewsQuery, useGetPersonalViewQuery, useGetViewQuery } = getViewsApi
