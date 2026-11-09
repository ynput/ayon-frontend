import { activityFeedApi } from '@shared/api/generated'
import { normalizeQueryError } from '@shared/api/base/queryError'
import type {
  SuggestEntityMentionApiArg,
  SuggestEntityMentionApiResponse,
} from '@shared/api/generated'
import type { MentionSearchFolder } from './searchMentions'

export interface EntityMentionSuggestions extends SuggestEntityMentionApiResponse {
  // the folder of the entity and the folders next to it
  folders?: MentionSearchFolder[]
}

// folders next to the entity listed at most
const SIBLING_FOLDERS_LIMIT = 100

const FOLDER_FIELDS = 'id parentId name label folderType path'

// the folder of a folder, task or version
const ENTITY_FOLDER_QUERY = `
  query MentionEntityFolder(
    $projectName: String!
    $id: String!
    $folder: Boolean!
    $task: Boolean!
    $version: Boolean!
  ) {
    project(name: $projectName) {
      folder(id: $id) @include(if: $folder) { ${FOLDER_FIELDS} }
      task(id: $id) @include(if: $task) { folder { ${FOLDER_FIELDS} } }
      version(id: $id) @include(if: $version) { product { folder { ${FOLDER_FIELDS} } } }
    }
  }
`

const SIBLING_FOLDERS_QUERY = `
  query MentionSiblingFolders($projectName: String!, $parentIds: [String!]!, $first: Int!) {
    project(name: $projectName) {
      folders(parentIds: $parentIds, first: $first) {
        edges { node { ${FOLDER_FIELDS} } }
      }
    }
  }
`

type FolderWithParent = MentionSearchFolder & { parentId?: string | null }

const enhancedMentionsApi = activityFeedApi.enhanceEndpoints({
  endpoints: {
    suggestEntityMention: {},
  },
})

const injectedApi = enhancedMentionsApi.injectEndpoints({
  endpoints: (build) => ({
    getEntityMentions: build.query<EntityMentionSuggestions, SuggestEntityMentionApiArg>({
      queryFn: async (args, { dispatch }, _extraOptions, baseQuery) => {
        const { projectName, suggestRequest } = args
        const { entityType, entityId } = suggestRequest

        // the folder of the entity first, then the folders next to it. A folder leaves itself out.
        const getSiblingFolders = async (): Promise<MentionSearchFolder[]> => {
          if (!['folder', 'task', 'version'].includes(entityType)) return []
          const parent = await baseQuery({
            document: ENTITY_FOLDER_QUERY,
            variables: {
              projectName,
              id: entityId,
              folder: entityType === 'folder',
              task: entityType === 'task',
              version: entityType === 'version',
            },
          })
          const project = (parent.data as any)?.project
          const folder: FolderWithParent | undefined =
            project?.folder ?? project?.task?.folder ?? project?.version?.product?.folder
          if (parent.error || !folder) return []

          const res = await baseQuery({
            document: SIBLING_FOLDERS_QUERY,
            variables: {
              projectName,
              parentIds: [folder.parentId || 'root'],
              first: SIBLING_FOLDERS_LIMIT,
            },
          })
          const edges: { node: MentionSearchFolder }[] =
            (res.data as any)?.project?.folders?.edges ?? []
          const siblings = edges.map((e) => e.node).filter((f) => f.id !== folder.id)
          return entityType === 'folder' ? siblings : [folder, ...siblings]
        }

        // fetched next to the suggestions, a failure only leaves the folders out
        const [res, folders] = await Promise.all([
          dispatch(enhancedMentionsApi.endpoints.suggestEntityMention.initiate(args)),
          getSiblingFolders().catch(() => []),
        ])

        if (res.error) {
          return { error: normalizeQueryError(res.error) }
        }

        return { data: { ...res.data, folders } }
      },
      providesTags: [{ type: 'team' as const, id: 'LIST' }],
    }),
  }),
})

export const { useGetEntityMentionsQuery } = injectedApi
export { injectedApi as mentionsQueries }
