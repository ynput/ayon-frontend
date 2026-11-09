import { gqlApi } from '@shared/api/generated'

// entities that can be searched for a mention, the ones the details panel can open
export type MentionSearchType = 'folder' | 'task' | 'version'

export interface MentionSearchArgs {
  projectName: string
  search: string
  types: MentionSearchType[]
  // results per type
  first: number
}

export interface MentionSearchFolder {
  id: string
  name: string
  label?: string | null
  folderType: string
  path: string
}

export interface MentionSearchTask {
  id: string
  name: string
  label?: string | null
  taskType: string
  folder: { path: string }
}

export interface MentionSearchVersion {
  id: string
  name: string
  version: number
  createdAt: string
  product: { name: string; productType: string; folder: { path: string } }
}

export interface MentionSearchResult {
  folders: MentionSearchFolder[]
  tasks: MentionSearchTask[]
  versions: MentionSearchVersion[]
}

// one request for every type, the ones not asked for are skipped
const SEARCH_MENTIONS_QUERY = `
  query SearchMentionEntities(
    $projectName: String!
    $search: String!
    $first: Int!
    $folders: Boolean!
    $tasks: Boolean!
    $versions: Boolean!
  ) {
    project(name: $projectName) {
      folders(search: $search, first: $first) @include(if: $folders) {
        edges { node { id name label folderType path } }
      }
      tasks(search: $search, first: $first) @include(if: $tasks) {
        edges { node { id name label taskType folder { path } } }
      }
      versions(search: $search, first: $first, sortBy: "-createdAt") @include(if: $versions) {
        edges {
          node {
            id
            name
            version
            createdAt
            product { name productType folder { path } }
          }
        }
      }
    }
  }
`

const nodes = <T>(connection?: { edges: { node: T }[] }) =>
  connection?.edges.map((e) => e.node) ?? []

const injectedApi = gqlApi.injectEndpoints({
  endpoints: (build) => ({
    searchMentionEntities: build.query<MentionSearchResult, MentionSearchArgs>({
      // the graphql base query, its errors keep the `{ status, data }` shape
      query: ({ projectName, search, types, first }) => ({
        document: SEARCH_MENTIONS_QUERY,
        variables: {
          projectName,
          search,
          first,
          folders: types.includes('folder'),
          tasks: types.includes('task'),
          versions: types.includes('version'),
        },
      }),
      transformResponse: (res: any) => {
        const project = res?.project
        return {
          folders: nodes(project?.folders),
          tasks: nodes(project?.tasks),
          versions: nodes(project?.versions),
        }
      },
      // results go stale quickly, every search refetches
      keepUnusedDataFor: 0,
    }),
  }),
})

export const { useLazySearchMentionEntitiesQuery } = injectedApi
