import type { EntityComment } from '@shared/api'
import getOverviewApi from '../overview/getOverview'
import { entityListsQueriesGql } from '../entityLists/updateLists'
import { injectedVersionsPageApi } from '../versions/getVersionsProducts'

// Backend's latestComments returns the 5 newest top-level (origin) comments, newest first.
const LATEST_COMMENTS_LIMIT = 5

// latestComments serializes uuids with dashes, but the feed/entity uuids are dashless;
// compare normalized so the same id matches across both shapes.
const normalizeId = (id?: string | null) => (id || '').replace(/-/g, '')

// Update one cached table node's latestComments. Mutates the immer draft array in
// place — reassigning it to a new array that still holds existing draft elements
// breaks immer finalization, so the patch would silently fail to apply.
const applyCommentToNode = (
  node: any,
  comment: EntityComment,
  method: 'create' | 'update' | 'delete',
) => {
  if (!Array.isArray(node.latestComments)) node.latestComments = []
  const list: EntityComment[] = node.latestComments
  const target = normalizeId(comment.activityId)
  const idx = list.findIndex((c) => normalizeId(c.activityId) === target)
  if (method === 'delete') {
    if (idx !== -1) list.splice(idx, 1)
  } else if (method === 'update') {
    if (idx !== -1) list[idx].body = comment.body
  } else {
    if (idx !== -1) list.splice(idx, 1)
    list.unshift(comment)
    if (list.length > LATEST_COMMENTS_LIMIT) list.splice(LATEST_COMMENTS_LIMIT)
  }
}

// The table caches that show latestComments, grouped by the owning api slice (so we
// patch through each slice's own util, like the other patchers do). For every slice:
// the tag to find its caches by entity, and where each rendered endpoint keeps its
// comment-bearing nodes. Raw GraphQL sub-queries (GetTasksList/GetTasksByParent) are
// omitted — the UI renders from the aggregating endpoints, which copy the data out.
// Add an endpoint here when a new table starts showing latestComments.
const COMMENT_CACHE_GROUPS: {
  api: { util: any }
  tag: string
  selectors: Record<string, (draft: any) => any[]>
}[] = [
  {
    api: getOverviewApi,
    tag: 'overviewTask',
    selectors: {
      getOverviewTasksByFolders: (d) => d ?? [],
      getTasksListInfinite: (d) => d?.pages?.flatMap((p: any) => p.tasks ?? []) ?? [],
      getGroupedTasksList: (d) => d?.tasks ?? [],
    },
  },
  {
    api: entityListsQueriesGql,
    tag: 'entityListItem',
    selectors: {
      getListItemsInfinite: (d) => d?.pages?.flatMap((p: any) => p.items ?? []) ?? [],
    },
  },
  {
    api: injectedVersionsPageApi,
    tag: 'version',
    selectors: {
      getVersionsInfinite: (d) => d?.pages?.flatMap((p: any) => p.versions ?? []) ?? [],
      getVersionsByProducts: (d) => d?.versions ?? [],
      getGroupedVersionsList: (d) => d?.versions ?? [],
      getProductsInfinite: (d) =>
        (d?.pages?.flatMap((p: any) => p.products ?? []) ?? [])
          .map((p: any) => p.featuredVersion)
          .filter(Boolean),
    },
  },
]

// Optimistically patch latestComments in the overview/versions/products/lists table caches
// instead of refetching them. Returns the patch handles so they can be undone on failure.
export const patchTableLatestComments = (
  args: any,
  { dispatch, getState }: any,
  method: 'create' | 'update' | 'delete',
) => {
  const { patch } = args
  const entityId = args.entityId ?? patch?.entityId
  const activityId = patch?.activityId ?? args.activityId
  if (!entityId || !activityId) return []

  // Only top-level comments appear in latestComments; ignore replies and non-comment activities.
  if (method === 'create' && !(patch?.activityType === 'comment' && patch?.referenceType === 'origin'))
    return []
  if (method === 'update' && patch?.activityType && patch.activityType !== 'comment') return []

  const comment: EntityComment = {
    __typename: 'EntityComment',
    activityId,
    body: patch?.body ?? '',
    author: patch?.authorName ?? null,
    createdAt: patch?.createdAt ?? '',
  }

  // tasks → overviewTask; versions + products(via featuredVersion) → version; list rows → entityListItem
  const state = getState()
  const target = normalizeId(entityId)
  const patches: any[] = []

  for (const { api: sliceApi, tag, selectors } of COMMENT_CACHE_GROUPS) {
    const entries = sliceApi.util.selectInvalidatedBy(state, [{ type: tag, id: entityId }])
    for (const { endpointName, originalArgs } of entries) {
      const selectNodes = selectors[endpointName]
      if (!selectNodes) continue // skip caches the table never renders (raw sub-queries)
      patches.push(
        dispatch(
          sliceApi.util.updateQueryData(endpointName, originalArgs, (draft: any) => {
            for (const node of selectNodes(draft)) {
              if (normalizeId(node?.id) === target || normalizeId(node?.entityId) === target) {
                applyCommentToNode(node, comment, method)
              }
            }
          }),
        ),
      )
    }
  }

  return patches
}
