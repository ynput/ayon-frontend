import { gqlApi } from '@shared/api'
import type { GetInboxMessagesQuery } from '@shared/api'
import {
  TransformedInboxMessages,
  mergeInboxMessages,
  transformInboxMessages,
} from './inboxTransform'

// Hand-written because codegen needs a server token; the endpoint name is camelCase
// so a future generated `GetProjectInbox` operation cannot collide with it.
const PROJECT_INBOX_QUERY = `
query GetProjectInbox(
  $projectName: String!
  $userName: String!
  $referenceTypes: [String!]
  $activityTypes: [String!]
  $filter: String
  $last: Int
  $cursor: String
) {
  project(name: $projectName) {
    activities(
      entityNames: [$userName]
      referenceTypes: $referenceTypes
      activityTypes: $activityTypes
      filter: $filter
      last: $last
      before: $cursor
    ) {
      pageInfo {
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        cursor
        node {
          projectName
          activityId
          activityType
          activityData
          referenceType
          referenceId
          body
          createdAt
          updatedAt
          active
          read
          author {
            name
            attrib {
              fullName
            }
          }
          origin {
            id
            name
            label
            type
            subtype
          }
          parents {
            type
            name
            label
          }
        }
      }
    }
  }
}
`

export interface GetProjectInboxArgs {
  projectName: string
  userName: string
  referenceTypes: string[]
  activityTypes: string[] | null
  filter: string
  last: number
  cursor?: string | null
  // not sent to the server - they build the filter and key the cache
  active: boolean
  important: boolean | null
}

type ProjectInboxResponse = {
  project: { activities: GetInboxMessagesQuery['inbox'] }
}

export const projectInboxApi = gqlApi.injectEndpoints({
  endpoints: (build) => ({
    getProjectInbox: build.query<TransformedInboxMessages, GetProjectInboxArgs>({
      query: ({ projectName, userName, referenceTypes, activityTypes, filter, last, cursor }) => ({
        document: PROJECT_INBOX_QUERY,
        variables: { projectName, userName, referenceTypes, activityTypes, filter, last, cursor },
      }),
      transformResponse: (res: ProjectInboxResponse, _meta, { important }) =>
        transformInboxMessages(
          res.project.activities,
          { important: important ?? false },
          { truncate: true },
        ),
      // cursor and page size must not key the cache, otherwise pagination never merges
      serializeQueryArgs: ({
        queryArgs: { projectName, active, important, filter, activityTypes, referenceTypes },
      }) => ({ projectName, active, important, filter, activityTypes, referenceTypes }),
      merge: mergeInboxMessages,
      keepUnusedDataFor: 30,
      providesTags: (_res, _error, { projectName, active }) => [
        { type: 'inbox', id: 'LIST' },
        { type: 'inbox', id: `project=${projectName}` },
        { type: 'inbox', id: `project=${projectName}/active=${active}` },
      ],
    }),
  }),
})

export const { useGetProjectInboxQuery, useLazyGetProjectInboxQuery } = projectInboxApi
