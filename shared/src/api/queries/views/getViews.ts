import { ListViewsApiResponse, viewsApi } from '@shared/api/generated'
import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'

export const getScopeTag = (viewType: string, projectName?: string) => {
  return {
    type: 'view',
    id: `${viewType.toUpperCase()}${projectName ? `:${projectName.toUpperCase()}` : ''}`,
  }
}

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
      providesTags: (result, _e, { viewType, projectName }) =>
        result
          ? [
              VIEW_LIST_TAG,
              getScopeTag(viewType, projectName),
              ...result.map((v) => ({ type: 'view', id: v.id })),
            ]
          : [VIEW_LIST_TAG],
      transformErrorResponse: (error: any) => error.data?.detail,
    },
    getWorkingView: {
      providesTags: (result, _e, { viewType, projectName }) => [
        { type: 'view', id: result?.id },
        getScopeTag(viewType, projectName),
        VIEW_LIST_TAG,
      ],
      transformErrorResponse: (error: any) => error.data?.detail,
    },
    getView: {
      providesTags: (result, error, arg) => [{ type: 'view', id: arg.viewId }, VIEW_LIST_TAG],
      transformErrorResponse: (error: any) => error.data?.detail,
    },
    getDefaultView: {
      providesTags: (result, _e, { viewType, projectName }) =>
        result
          ? [{ type: 'view', id: result.id }, getScopeTag(viewType, projectName)]
          : [getScopeTag(viewType, projectName)],
    },
  },
})

export const {
  useListViewsQuery,
  useGetWorkingViewQuery,
  useGetViewQuery,
  useGetDefaultViewQuery,
} = getViewsApi
