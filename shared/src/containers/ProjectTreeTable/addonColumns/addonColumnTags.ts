import type { TableColumnTag } from '@ynput/ayon-addon'
import { api } from '@shared/api/base'

// The cache tags an addon column's values depend on (tableColumn `providesTags`). The values
// themselves stay in addonColumnValues (rows on screen, batches, kept outside RTK Query); this
// query only provides the tags. RTK refetches it when one of them is invalidated, by the addon's
// mutations or the host's, and ColumnValuesFetcher takes each new result as refreshTableColumn.

let refetches = 0

export const addonColumnTagsApi = api.injectEndpoints({
  endpoints: (build) => ({
    // a number that changes on every refetch; no request
    addonColumnTags: build.query<number, { columnId: string; tags: TableColumnTag[] }>({
      queryFn: () => ({ data: ++refetches }),
      // tag types are the addon's (addTagTypes) or the host's, unknown to this api's types
      providesTags: (_result, _error, { tags }) => tags as never,
      keepUnusedDataFor: 0,
    }),
  }),
})

export const { useAddonColumnTagsQuery } = addonColumnTagsApi
