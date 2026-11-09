import { activityFeedApi } from '@shared/api/generated'
import { normalizeQueryError } from '@shared/api/base/queryError'
import type {
  FolderSuggestionItem,
  SuggestEntityMentionApiArg,
  SuggestEntityMentionApiResponse,
  VersionSuggestionItem,
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

// the folders of suggested versions, the suggestions leave them out
const VERSION_FOLDERS_QUERY = `
  query MentionVersionFolders($projectName: String!, $ids: [String!]!, $first: Int!) {
    project(name: $projectName) {
      versions(ids: $ids, first: $first) {
        edges { node { id product { folder { id name label folderType } } } }
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

        // the folder of each version as the parent of its product
        const addVersionFolders = async (
          versions: VersionSuggestionItem[] = [],
        ): Promise<VersionSuggestionItem[]> => {
          const ids = versions.filter((v) => v.parent && !v.parent.parent).map((v) => v.id)
          if (!ids.length) return versions
          const res = await baseQuery({
            document: VERSION_FOLDERS_QUERY,
            variables: { projectName, ids, first: ids.length },
          })
          const edges: { node: { id: string; product: { folder: FolderSuggestionItem } } }[] =
            (res.data as any)?.project?.versions?.edges ?? []
          const folders = new Map(edges.map(({ node }) => [node.id, node.product.folder]))
          return versions.map((v) =>
            v.parent && folders.has(v.id)
              ? { ...v, parent: { ...v.parent, parent: folders.get(v.id) } }
              : v,
          )
        }

        // fetched next to the suggestions, a failure only leaves the folders out
        const [res, folders] = await Promise.all([
          dispatch(enhancedMentionsApi.endpoints.suggestEntityMention.initiate(args)),
          getSiblingFolders().catch(() => []),
        ])

        if (res.error) {
          return { error: normalizeQueryError(res.error) }
        }

        const versions = await addVersionFolders(res.data?.versions).catch(
          () => res.data?.versions,
        )
        return { data: { ...res.data, versions, folders } }
      },
      providesTags: [{ type: 'team' as const, id: 'LIST' }],
    }),
  }),
})

export const { useGetEntityMentionsQuery } = injectedApi
export { injectedApi as mentionsQueries }
