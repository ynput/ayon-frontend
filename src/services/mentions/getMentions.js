import { compareAsc } from 'date-fns'
import { ayonApi } from '../ayon'
import { ENTITY_MENTION_VERSIONS, FOLDER_MENTION_TASKS } from './mentionQueries'
import { transformMentionTasksData, transformMentionVersionsData } from './mentionTransformations'

const getMentions = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getMentionVersions: build.query({
      query: ({ projectName, entityIds, entityType }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: ENTITY_MENTION_VERSIONS(entityType),
          variables: { projectName, entityIds },
        },
      }),
      transformResponse: (res, meta, args) =>
        transformMentionVersionsData(res?.data, args).sort((a, b) =>
          compareAsc(new Date(a.createdAt), new Date(b.createdAt)),
        ),
      providesTags: (result, error, { entityIds = [] }) => [
        ...entityIds.map((id) => ({ type: 'entitiesVersions', id: id })),
        { type: 'entitiesVersions', id: 'LIST' },
      ],
      // don't include the name in the query args cache key
      // eslint-disable-next-line no-unused-vars
      serializeQueryArgs: ({ queryArgs: { currentUser, ...rest } }) => rest,
    }),
    getMentionTasks: build.query({
      query: ({ projectName, folderIds = [] }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: FOLDER_MENTION_TASKS,
          variables: { projectName, folderIds },
        },
      }),
      transformResponse: (response) =>
        transformMentionTasksData(response?.data?.project?.folders?.edges),
      providesTags: (res) =>
        res && res.map(({ id }) => ({ type: 'kanBanTask', id }, { type: 'task', id })),
    }),
  }),
})

export const { useGetMentionVersionsQuery, useGetMentionTasksQuery } = getMentions
